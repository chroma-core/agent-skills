---
name: Chroma Regex Filtering
description: Learn how to use regex filters in Chroma queries
---

## Regex Filtering in Chroma

Chroma supports regex filtering on document content and metadata. This is useful when you need exact pattern matching that semantic search can't provide.

### When to use regex vs semantic search

**Use regex when:**
- Matching exact patterns like email addresses, URLs, or code identifiers
- Finding documents containing specific formats (dates, phone numbers, IDs)
- Filtering by prefixes or suffixes in structured data
- You need deterministic, repeatable matches

**Use semantic search when:**
- Looking for conceptually similar content regardless of exact wording
- The user's query is natural language
- You want to find related content even if it uses different terminology

You can combine both: use regex to narrow results, then rank by semantic similarity.

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

Use the `$regex` operator in `where_document` to match document content against a regular expression. The regex follows standard regex syntax.

```python
results = collection.query(
    query_texts=["search query"],
    where_document={
        "$regex": "^tech.*"
    },
    n_results=10
)
```

### Combining regex with metadata filters

Regex filters can be combined with metadata filters using `$and` and `$or` operators. This is powerful for narrowing results by both content patterns and structured metadata.

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

### Performance considerations

Regex filtering happens after the initial vector search retrieves candidates. For best performance:
- Keep regex patterns simple when possible
- Use metadata filters to reduce the candidate set before regex matching
- Consider whether a metadata field with pre-extracted values would be faster than runtime regex
