"""Run once locally to build the ChromaDB vector index from the 3 policy PDFs.

Usage:
    python build_index.py

Requires:
    - OPENAI_API_KEY in environment (or .env file)
    - PDF files in data/policies/
    - pip install -r requirements.txt

After running, commit the chroma_db/ directory to the repo.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

import chromadb

from backend.ingestion import extract_clauses

POLICIES_DIR = Path("data/policies")
CHROMA_DIR = Path("chroma_db")
BATCH_SIZE = 100

# Map from filename slug to collection name
PDF_FILES = {
    "mit_handbook.pdf.pdf": "mitt",
    "harvard_ai_guidelines.pdf.pdf": "harvard_ai",
    "neu_academic_integrity.pdf.pdf": "neu_integrity",
}


def embed_batch(client: OpenAI, texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in response.data]


def build_collection(
    openai_client: OpenAI,
    chroma_client: chromadb.PersistentClient,
    pdf_path: Path,
    collection_name: str,
) -> int:
    print(f"\n[{collection_name}] Extracting clauses from {pdf_path.name}...")
    clauses = extract_clauses(str(pdf_path))
    print(f"[{collection_name}] {len(clauses)} clauses extracted")

    collection = chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    # Process in batches
    for start in range(0, len(clauses), BATCH_SIZE):
        batch = clauses[start : start + BATCH_SIZE]
        texts = [c.text for c in batch]
        ids = [c.id for c in batch]
        metadatas = [
            {
                "source_doc": c.source_doc,
                "page_num": c.page_num,
                "position_index": c.position_index,
                "word_count": c.word_count,
            }
            for c in batch
        ]

        print(f"[{collection_name}] Embedding batch {start // BATCH_SIZE + 1} ({len(batch)} clauses)...")
        embeddings = embed_batch(openai_client, texts)

        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )

    print(f"[{collection_name}] Upserted {len(clauses)} clauses into ChromaDB")
    return len(clauses)


def verify_index(
    openai_client: OpenAI,
    chroma_client: chromadb.PersistentClient,
    collection_name: str,
    test_query: str,
) -> None:
    print(f"\n[{collection_name}] Verifying with query: '{test_query}'")
    collection = chroma_client.get_collection(collection_name)
    query_embedding = embed_batch(openai_client, [test_query])[0]
    results = collection.query(query_embeddings=[query_embedding], n_results=3)
    for i, doc in enumerate(results["documents"][0]):
        print(f"  Result {i + 1}: {doc[:120]}...")


def main() -> None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set. Add it to .env or export it.")
        sys.exit(1)

    if not POLICIES_DIR.exists():
        print(f"ERROR: {POLICIES_DIR} does not exist. Upload PDFs first.")
        sys.exit(1)

    openai_client = OpenAI(api_key=api_key)
    CHROMA_DIR.mkdir(exist_ok=True)
    chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    total = 0
    built: list[str] = []
    for filename, collection_name in PDF_FILES.items():
        pdf_path = POLICIES_DIR / filename
        if not pdf_path.exists():
            print(f"WARNING: {pdf_path} not found — skipping")
            continue
        total += build_collection(openai_client, chroma_client, pdf_path, collection_name)
        built.append(collection_name)

    if not built:
        print("\nNo PDFs were found. Upload PDFs to data/policies/ and re-run.")
        sys.exit(1)

    # Spot-check only collections that were actually built
    VERIFY_QUERIES = {
        "neu_integrity": "artificial intelligence prohibited",
        "harvard_ai": "generative AI tools",
    }
    for collection_name, query in VERIFY_QUERIES.items():
        if collection_name in built:
            verify_index(openai_client, chroma_client, collection_name, query)

    print(f"\nDone. {total} total clauses indexed across all collections.")
    print(f"ChromaDB persisted at: {CHROMA_DIR.resolve()}")
    print("Next: commit chroma_db/ to the repo.")


if __name__ == "__main__":
    main()
