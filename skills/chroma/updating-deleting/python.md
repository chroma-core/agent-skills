---
name: Updating and Deleting
description: Update existing documents and delete data from collections
---

## Updating and Deleting

Chroma provides `update`, `upsert`, and `delete` methods for modifying data after initial insertion. Understanding when to use each is important for building reliable data sync pipelines.

### Method overview

| Method | Behavior | Use when |
|--------|----------|----------|
| `update` | Modifies existing documents, fails if ID doesn't exist | You know the document exists |
| `upsert` | Updates if exists, inserts if not | Syncing from external data source |
| `delete` | Removes documents by ID or filter | Removing stale or unwanted data |

### Imports

```python
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
```

## Update

Update modifies existing documents. If an ID doesn't exist, the operation fails silently for that ID (no error thrown, but nothing is updated).

**Important:** When you update a document's text, Chroma re-computes the embedding automatically using the collection's embedding function.

```python
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
```

## Upsert

Upsert is the preferred method for syncing data from an external source. It inserts new documents and updates existing ones in a single operation.

**When to use upsert vs update:**
- Use `upsert` when syncing from a primary database (you don't know which records are new)
- Use `update` when you're certain the document already exists

```python
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
```

## Delete by ID

The simplest way to delete documents is by their IDs.

```python
collection3 = client.get_or_create_collection(
    name="my_collection",
    embedding_function=embedding_function,
)

# Delete specific documents by ID
collection3.delete(ids=["doc1", "doc2"])

# Delete a single document
collection3.delete(ids=["doc3"])
```

## Delete by filter

Delete documents matching metadata or content filters without knowing specific IDs. Useful for bulk cleanup operations.

```python
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
```

## Syncing from an external data source

A common pattern is keeping Chroma in sync with a primary database. This example shows how to handle creates, updates, and deletes.

```python
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
```

### Sync strategy tips

**Track source IDs:** Always store the primary database ID in metadata so you can find and update documents later.

**Batch operations:** Process updates in batches of 100-500 to balance throughput and memory usage.

**Handle deletes:** When records are deleted from your primary database, delete them from Chroma too. Use metadata filters if you track `source_id`.

**Idempotent syncs:** Use `upsert` so re-running a sync doesn't create duplicates.
