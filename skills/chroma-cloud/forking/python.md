---
name: Collection Forking
description: Instantly duplicate collections using copy-on-write forking in Chroma Cloud
---

## Collection Forking

Chroma Cloud supports forking collections. Forking creates a new collection from an existing one instantly using copy-on-write. The forked collection shares data blocks with the source until modifications are made, so it completes instantly regardless of collection size.

**Key properties:**
- **Instant**: Forking completes immediately, no matter how large the source collection
- **Isolated**: Changes to a fork do not affect the source, and vice versa
- **Efficient**: Only new modifications allocate separate storage; shared data is not duplicated
- **Cloud only**: The storage engine on single-node Chroma does not support forking

### Imports and boilerplate

```python
import os
from typing import cast

import chromadb
from chromadb.api.types import EmbeddingFunction, Embeddable
from chromadb.utils.embedding_functions import ChromaCloudQwenEmbeddingFunction
from chromadb.utils.embedding_functions.chroma_cloud_qwen_embedding_function import ChromaCloudQwenEmbeddingModel

client = chromadb.CloudClient(
    tenant=os.getenv("CHROMA_TENANT"),
    database=os.getenv("CHROMA_DATABASE"),
    api_key=os.getenv("CHROMA_API_KEY"),
)

embedding_function = ChromaCloudQwenEmbeddingFunction(
    model=ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
    task=None,
    api_key_env_var="CHROMA_API_KEY"
)
```

### Forking a collection

Call `.fork()` on an existing collection to create a copy with a new name.

```python
source_collection = client.get_collection(
    name="main-repo-index",
    embedding_function=cast(EmbeddingFunction[Embeddable], embedding_function),
)

forked_collection = source_collection.fork(new_name="main-repo-index-pr-1234")
```

### Adding data to a fork

After forking, the new collection is fully independent. You can add, update, or delete records without affecting the source.

```python
forked_collection.add(
    ids=["doc-pr-1", "doc-pr-2"],
    documents=[
        "New API endpoint for user preferences",
        "Updated authentication flow with OAuth2",
    ],
)
```

### Querying a fork

Forked collections are queried the same way as any other collection. The fork contains all data from the source at the time of forking, plus any changes made after.

```python
# Query the fork — includes source data plus any new additions
results = forked_collection.query(
    query_texts=["authentication changes"],
    n_results=5,
)
```

### Limits and costs

- Maximum of 256 fork edges per tree. Exceeding this triggers a `NUM_FORKS` quota error. To recover, create a fresh collection and copy the data.
- Fork operation costs $0.03 per call.
- Storage is only charged for incremental changes; shared data between source and fork is free.

### Common use cases

- **Branch-based indexing:** Fork a collection per git branch or PR to test index changes in isolation, then discard the fork when done.
- **Data snapshots:** Create point-in-time copies before running bulk updates or migrations.
- **A/B testing:** Fork a collection, modify one copy with different embeddings or metadata strategies, and compare query results.
- **Safe experimentation:** Try out changes to a collection without risk to the production data.
