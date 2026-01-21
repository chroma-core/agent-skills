---
name: Chroma Regex Filtering
description: Learn how to use regex filters in Chroma queries
---

## Regex Filtering in Chroma

Chroma supports regex filtering on document metadata. This allows you to filter results based on pattern matching.

### Imports and boilerplate

```python
import os

import chromadb
from chromadb.api.types import Embeddings, ID, IDs, Document, Metadata, Include, EmbeddingFunction, Embeddable
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

client = chromadb.CloudClient(
    tenant=os.getenv("CHROMA_TENANT"),
    database=os.getenv("CHROMA_DATABASE"),
    api_key=os.getenv("CHROMA_API_KEY"),
)

collection = client.get_or_create_collection(name="my_collection")
```

### Basic Regex Filter

Use the `$regex` operator to match metadata values against a regular expression:

```python
results = collection.query(
    query_texts=["search query"],
    where_document={
        "$regex": "^tech.*"
    },
    n_results=10
)
```

### Combining with metadata filters

```python
collection.query(
    query_texts=["query1", "query2"],
    where_document={
        "$and": [
            {"$contains": "search_string_1"},
            {"$regex": "[a-z]+"},
        ]
    }
)
```
