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
import time
from typing import TypedDict

import chromadb

client = chromadb.HttpClient(host="localhost", port=8000)
```

## Update

Update modifies existing documents. If an ID doesn't exist, the operation fails silently for that ID (no error thrown, but nothing is updated).

**Important:** When you update a document's text, Chroma re-computes the embedding automatically using the collection's embedding function.

```python
collection = client.get_or_create_collection(name="my_collection")

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
```

## Upsert

Upsert is the preferred method for syncing data from an external source. It inserts new documents and updates existing ones in a single operation.

**When to use upsert vs update:**
- Use `upsert` when syncing from a primary database (you don't know which records are new)
- Use `update` when you're certain the document already exists

```python
collection2 = client.get_or_create_collection(name="articles")

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
```

## Delete by ID

The simplest way to delete documents is by their IDs.

```python
awaiting_cleanup = ["article-789", "article-456"]
collection2.delete(ids=awaiting_cleanup)
```

## Delete by filter

Delete documents matching metadata or content filters without knowing specific IDs. Useful for bulk cleanup operations.

```python
collection2.delete(
    where={"source_id": "123"},
)
```

## Syncing from an external data source

A common pattern is keeping Chroma in sync with a primary database. This example shows how to handle creates, updates, and deletes.

```python
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
```

### Sync strategy tips

**Track source IDs:** Always store the primary database ID in metadata so you can find and update documents later.

**Batch operations:** Process updates in batches of 100-500 to balance throughput and memory usage.

**Handle deletes:** When records are deleted from your primary database, delete them from Chroma too. Use metadata filters if you track `source_id`.

**Idempotent syncs:** Use `upsert` so re-running a sync doesn't create duplicates.
