---
name: Error Handling
description: Handling errors and failures when working with Chroma
---

## Error Handling

Local Chroma operations can fail for various reasons: the local server may not be running, collections may be missing, or input data may be invalid. This guide covers the common local error scenarios and how to handle them.

```python
import json
import time

import chromadb
from chromadb.errors import NotFoundError
from chromadb.types import Metadata
```

### Error types

**Python** uses specific exception classes:
- `chromadb.errors.NotFoundError` - Collection, tenant, or database doesn't exist
- `ValueError` - Invalid collection name or duplicate creation attempt

**TypeScript** throws standard `Error` objects with descriptive messages. Check the error message to determine the cause.

### Connection errors

Connection failures occur when the client can't reach the Chroma server. This is common during startup or when network issues occur.

```python
def connect_with_retry(max_retries: int = 3):
    """Connect to a local Chroma server with exponential backoff retry."""
    client = chromadb.HttpClient(host="localhost", port=8000)

    for attempt in range(1, max_retries + 1):
        try:
            client.heartbeat()
            return client
        except Exception as e:
            if attempt == max_retries:
                raise ConnectionError(
                    f"Failed to connect to local Chroma after {max_retries} attempts: {e}"
                )

            time.sleep(2 ** (attempt - 1))

    raise ConnectionError("Chroma is unreachable")
```

### Collection not found

When working with collections that may not exist, handle the `NotFoundError` (Python) or catch the error and check its message (TypeScript).

```python
client = chromadb.HttpClient(host="localhost", port=8000)

try:
    collection = client.get_collection(name="my_collection")
except NotFoundError:
    print("Collection not found, creating it...")
    collection = client.create_collection(name="my_collection")
```

### Safe collection access pattern

The `getOrCreateCollection` method is the recommended way to avoid "not found" errors entirely. Use `getCollection` only when you specifically need to verify a collection exists.

```python
client = chromadb.HttpClient(host="localhost", port=8000)
collection = client.get_or_create_collection(name="my_collection")

results = collection.query(
    query_texts=["search query"],
    n_results=5,
)

if results["documents"] and len(results["documents"][0]) > 0:
    first_doc = results["documents"][0][0]
else:
    pass
```

### Validation errors

Chroma validates data before operations. Common validation failures include:
- Document content exceeding 16KB
- Embedding dimensions not matching the collection
- Metadata exceeding limits (4KB total, 32 keys max)
- Invalid collection names

```python
client = chromadb.HttpClient(host="localhost", port=8000)


def validate_document(doc: str) -> bool:
    byte_size = len(doc.encode("utf-8"))
    return byte_size <= 16384


def validate_metadata(metadata: Metadata) -> bool:
    if len(metadata.keys()) > 32:
        return False

    json_size = len(json.dumps(metadata).encode("utf-8"))
    return json_size <= 4096


def safe_add(
    collection_name: str,
    ids: list[str],
    documents: list[str],
    metadatas: list[Metadata] | None
) -> None:
    for doc in documents:
        if not validate_document(doc):
            raise ValueError("Document exceeds 16KB limit")

    if metadatas:
        for meta in metadatas:
            if not validate_metadata(meta):
                raise ValueError("Metadata exceeds limits (4KB or 32 keys)")

    collection = client.get_or_create_collection(name=collection_name)
    collection.add(ids=ids, documents=documents, metadatas=metadatas)
```

### Batch operation failures

When adding or upserting multiple documents, a single invalid document fails the entire batch. Validate data before sending, or implement retry logic for partial failures.

```python
client = chromadb.HttpClient(host="localhost", port=8000)


def batch_add(
    collection_name: str,
    ids: list[str],
    documents: list[str],
    batch_size: int = 100,
) -> dict:
    collection = client.get_or_create_collection(name=collection_name)
    failures = []

    for i in range(0, len(ids), batch_size):
        batch_ids = ids[i : i + batch_size]
        batch_docs = documents[i : i + batch_size]

        try:
            collection.add(ids=batch_ids, documents=batch_docs)
        except Exception as e:
            failures.append({"index": i, "error": str(e)})

    total_batches = (len(ids) + batch_size - 1) // batch_size
    return {"total_batches": total_batches, "failures": failures}
```

### Defensive patterns summary

| Scenario | Recommended approach |
|----------|---------------------|
| Collection access | Use `getOrCreateCollection` instead of `getCollection` |
| Missing data | Check results length before accessing |
| Connection issues | Implement retry with exponential backoff |
| Large batches | Validate data size before operations |
| Local server startup | Verify the server is running before debugging query logic |
