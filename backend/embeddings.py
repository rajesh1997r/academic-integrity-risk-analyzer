from __future__ import annotations

import chromadb

from backend.models import Clause

_client: chromadb.PersistentClient | None = None
_CHROMA_PATH = "chroma_db"


def load_index() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=_CHROMA_PATH)
    return _client


def _row_to_clause(doc: str, metadata: dict, id: str) -> Clause:
    return Clause(
        id=id,
        text=doc,
        source_doc=metadata.get("source_doc", ""),
        page_num=metadata.get("page_num", 0),
        position_index=metadata.get("position_index", 0),
        word_count=metadata.get("word_count", 0),
    )


def query_similar(
    embedding: list[float],
    collection_name: str,
    k: int = 5,
) -> list[Clause]:
    client = load_index()
    collection = client.get_collection(collection_name)
    results = collection.query(query_embeddings=[embedding], n_results=k)
    clauses = []
    for doc, meta, id_ in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["ids"][0],
    ):
        clauses.append(_row_to_clause(doc, meta, id_))
    return clauses


def get_all_clauses(collection_name: str) -> list[Clause]:
    client = load_index()
    collection = client.get_collection(collection_name)
    results = collection.get()
    clauses = []
    for doc, meta, id_ in zip(
        results["documents"],
        results["metadatas"],
        results["ids"],
    ):
        clauses.append(_row_to_clause(doc, meta, id_))
    return clauses


def get_all_embeddings(collection_name: str) -> tuple[list[Clause], list[list[float]]]:
    """Return clauses and their stored embeddings together."""
    client = load_index()
    collection = client.get_collection(collection_name)
    results = collection.get(include=["documents", "metadatas", "embeddings"])
    clauses = []
    for doc, meta, id_ in zip(
        results["documents"],
        results["metadatas"],
        results["ids"],
    ):
        clauses.append(_row_to_clause(doc, meta, id_))
    return clauses, results["embeddings"]


def index_loaded() -> bool:
    try:
        client = load_index()
        collections = client.list_collections()
        return len(collections) > 0
    except Exception:
        return False
