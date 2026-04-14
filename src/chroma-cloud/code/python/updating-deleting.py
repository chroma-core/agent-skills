# @snippet:imports
import os
import time
from typing import TypedDict

import chromadb
from chromadb.utils.embedding_functions import ChromaCloudQwenEmbeddingFunction
from chromadb.utils.embedding_functions.chroma_cloud_qwen_embedding_function import (
    ChromaCloudQwenEmbeddingModel,
)

client = chromadb.CloudClient(
    api_key=os.environ["CHROMA_API_KEY"],
    tenant=os.environ["CHROMA_TENANT"],
    database=os.environ["CHROMA_DATABASE"],
)
embedding_function = ChromaCloudQwenEmbeddingFunction(
    model=ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
    task=None,
    api_key_env_var="CHROMA_API_KEY",
)
# @end

# @snippet:update
collection = client.get_or_create_collection(
    name="my_collection",
    embedding_function=embedding_function,
)

collection.add(
    ids=["doc1", "doc2"],
    documents=["Original text for doc1", "Original text for doc2"],
    metadatas=[{"category": "draft"}, {"category": "draft"}],
)

collection.update(
    ids=["doc1"],
    documents=["Updated text for doc1"],
)

collection.update(
    ids=["doc1", "doc2"],
    metadatas=[{"category": "published"}, {"category": "published"}],
)

collection.update(
    ids=["doc2"],
    documents=["Completely revised doc2 content"],
    metadatas=[{"category": "published", "revision": 2}],
)
# @end

# @snippet:upsert
collection2 = client.get_or_create_collection(
    name="articles",
    embedding_function=embedding_function,
)

collection2.upsert(
    ids=["article-123", "article-456", "article-789"],
    documents=[
        "Content of article 123",
        "Content of article 456",
        "Content of article 789",
    ],
    metadatas=[
        {"source_id": "123", "updated_at": int(time.time())},
        {"source_id": "456", "updated_at": int(time.time())},
        {"source_id": "789", "updated_at": int(time.time())},
    ],
)

collection2.upsert(
    ids=["article-123", "article-456"],
    documents=[
        "Updated content of article 123",
        "Updated content of article 456",
    ],
    metadatas=[
        {"source_id": "123", "updated_at": int(time.time())},
        {"source_id": "456", "updated_at": int(time.time())},
    ],
)
# @end

# @snippet:delete-by-id
collection2.delete(ids=["article-789", "article-456"])
# @end

# @snippet:delete-by-filter
collection2.delete(where={"source_id": "123"})
# @end

# @snippet:sync-pattern


class SourceRecord(TypedDict):
    id: str
    content: str
    deleted: bool
    updated_at: int


def sync_records(records: list[SourceRecord]) -> None:
    active_records = [record for record in records if not record["deleted"]]
    deleted_ids = [record["id"] for record in records if record["deleted"]]

    if active_records:
        collection2.upsert(
            ids=[record["id"] for record in active_records],
            documents=[record["content"] for record in active_records],
            metadatas=[
                {
                    "source_id": record["id"],
                    "updated_at": record["updated_at"],
                }
                for record in active_records
            ],
        )

    if deleted_ids:
        collection2.delete(ids=deleted_ids)
# @end
