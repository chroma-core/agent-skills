# @snippet:imports
import os
import time
from typing import TypedDict

import chromadb
from chromadb.utils.embedding_functions import ChromaCloudQwenEmbeddingFunction
from chromadb.utils.embedding_functions.chroma_cloud_qwen_embedding_function import ChromaCloudQwenEmbeddingModel

client = chromadb.Client()
embedding_function = ChromaCloudQwenEmbeddingFunction(
    model=ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
    task=None,
    api_key_env_var="CHROMA_API_KEY"
)
# @end

# @snippet:update

collection = client.get_or_create_collection(
    name="my_collection",
    embedding_function=embedding_function,
)

# Add initial documents
collection.add(
    ids=["doc1", "doc2"],
    documents=["Original text for doc1", "Original text for doc2"],
    metadatas=[{"category": "draft"}, {"category": "draft"}],
)

# Update document text (embedding is recomputed automatically)
collection.update(
    ids=["doc1"],
    documents=["Updated text for doc1"],
)

# Update only metadata (document and embedding unchanged)
collection.update(
    ids=["doc1", "doc2"],
    metadatas=[{"category": "published"}, {"category": "published"}],
)

# Update both document and metadata
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

# Upsert inserts new documents or updates existing ones
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

# Running the same upsert again updates existing docs (no duplicates)
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

collection3 = client.get_or_create_collection(
    name="my_collection",
    embedding_function=embedding_function,
)

# Delete specific documents by ID
collection3.delete(ids=["doc1", "doc2"])

# Delete a single document
collection3.delete(ids=["doc3"])

# @end

# @snippet:delete-by-filter

collection4 = client.get_or_create_collection(
    name="my_collection",
    embedding_function=embedding_function,
)

# Delete all documents matching a metadata filter
collection4.delete(where={"status": "archived"})

# Delete documents from a specific source
collection4.delete(where={"source_id": "old-source-123"})

# Delete documents containing specific content
collection4.delete(where_document={"$contains": "DEPRECATED"})

# Combine ID list with filters (deletes matching documents from the ID list)
collection4.delete(
    ids=["doc1", "doc2", "doc3", "doc4"],
    where={"category": "temp"},
)

# @end

# @snippet:sync-pattern


class SourceRecord(TypedDict):
    id: str
    content: str
    updated_at: int
    category: str


def sync_to_chroma(
    collection_name: str,
    records: list[SourceRecord],
    deleted_ids: list[str],
) -> dict[str, int]:
    collection = client.get_or_create_collection(
        name=collection_name,
        embedding_function=embedding_function,
    )

    # Upsert new and updated records
    if records:
        batch_size = 100

        for i in range(0, len(records), batch_size):
            batch = records[i : i + batch_size]

            collection.upsert(
                ids=[f"source-{r['id']}" for r in batch],
                documents=[r["content"] for r in batch],
                metadatas=[
                    {
                        "source_id": r["id"],
                        "updated_at": r["updated_at"],
                        "category": r["category"],
                    }
                    for r in batch
                ],
            )

    # Delete removed records
    if deleted_ids:
        collection.delete(ids=[f"source-{id}" for id in deleted_ids])

    return {"synced": len(records), "deleted": len(deleted_ids)}


# Example usage
changed_records: list[SourceRecord] = [
    {"id": "1", "content": "Article about Python", "updated_at": int(time.time()), "category": "tech"},
    {"id": "2", "content": "Guide to vector databases", "updated_at": int(time.time()), "category": "tech"},
]

deleted_record_ids = ["old-1", "old-2"]

sync_to_chroma("articles", changed_records, deleted_record_ids)

# @end
