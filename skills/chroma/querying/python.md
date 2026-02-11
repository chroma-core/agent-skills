---
name: Query and Get
description: Query and Get Data from Chroma Collections
---

## Querying

Chroma provides two main methods for retrieving documents: `query` and `get`. Understanding when to use each is important for building effective search.

### Query vs Get

**Use `query` when:**
- You have a search query (text that needs to be embedded and compared)
- You want results ranked by semantic similarity
- Building search features, RAG systems, or recommendation engines

**Use `get` when:**
- You know the exact document IDs you want
- You need to retrieve documents by metadata without similarity ranking
- Fetching documents to display after a search, or for batch operations

### Imports and boilerplate

```python
import os

import chromadb
from chromadb.api.types import Embeddings, ID, IDs, Document, Metadata, Include, EmbeddingFunction, Embeddable
from chromadb.utils.embedding_functions import ChromaCloudQwenEmbeddingFunction
from chromadb.utils.embedding_functions.chroma_cloud_qwen_embedding_function import ChromaCloudQwenEmbeddingModel
from typing import List, Optional, TypedDict, cast

client = chromadb.CloudClient(
    tenant=os.getenv("CHROMA_TENANT"),
    database=os.getenv("CHROMA_DATABASE"),
    api_key=os.getenv("CHROMA_API_KEY"),
)
```

### Basic query

The `query` method embeds your query text and finds the nearest neighbors in the collection. Results are returned in order of similarity.

```python
embedding_function = ChromaCloudQwenEmbeddingFunction(
    model=ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
    task=None,
    api_key_env_var="CHROMA_API_KEY"
)

collection = client.get_or_create_collection(name="my_collection", embedding_function=cast(EmbeddingFunction[Embeddable], embedding_function))

collection.query(
    query_texts=["thus spake zarathustra", "the oracle speaks"],
)
```

### Query with options

You can control what data is returned using `include`, and limit results with `nResults`. By default, Chroma returns 10 results.

```python
embedding_function = ChromaCloudQwenEmbeddingFunction(
    model=ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
    task=None,
    api_key_env_var="CHROMA_API_KEY"
)

collection = client.get_or_create_collection(name="my_collection", embedding_function=cast(EmbeddingFunction[Embeddable], embedding_function))

collection.query(
    query_texts=["thus spake zarathustra", "the oracle speaks"],
	n_results=5,
	# specify what to include in the results
	include=["metadatas", "documents", "embeddings"],
	# reduce the search space by only looking at these ids
	ids=["id1", "id2"],
	# filter results only to those matching metadata criteria
	where={"category": "philosophy"},
	# filter results only to those matching document criteria
	where_document={"$contains": "wikipedia"},
)

# result shape

class QueryResult(TypedDict):
    ids: List[IDs]
    embeddings: Optional[List[Embeddings]]
    documents: Optional[List[List[Document]]]
    metadatas: Optional[List[List[Metadata]]]
    distances: Optional[List[List[float]]]
    included: Include

class GetResult(TypedDict):
    ids: List[ID]
    embeddings: Optional[Embeddings]
    documents: Optional[List[Document]]
    metadatas: Optional[List[Metadata]]
    included: Include
```

The `include` parameter accepts: `documents`, `metadatas`, `embeddings`, and `distances`. Only request what you need to minimize response size.

### Metadata filtering

The `where` argument filters documents by metadata before the similarity search runs. This is efficient because it reduces the candidate set that needs to be compared.

```python
collection.query(
    query_texts=["first query", "second query"],
    where={"page": 10}
)

# In order to filter on metadata, you must supply a where filter dictionary to the query. The dictionary must have the following structure:
# {
#     "metadata_field": {
#         <Operator>: <Value>
#     }
# }


# Using the $eq operator is equivalent to using the metadata field directly in your where filter.
filter1 = {
    "metadata_field": "search_string"
}

# is equivalent to

filter2 = {
    "metadata_field": {
        "$eq": "search_string"
    }
}

and_example = {
    "$and": [
        {
            "metadata_field1": {
                # <Operator>: <Value>
            }
        },
        {
            "metadata_field2": {
                # <Operator>: <Value>
            }
        }
    ]
}
```

### Available filter operators

Chroma supports these operators in `where` clauses:

- **Equality:** `$eq` (default if just a value), `$ne`
- **Comparison:** `$gt`, `$gte`, `$lt`, `$lte`
- **Set membership:** `$in`, `$nin`
- **Logical:** `$and`, `$or`

Filters can be nested and combined for complex queries. Metadata filtering is much faster than post-processing results in application code.

### Document content filtering

The `whereDocument` parameter filters on the actual document text, not metadata. This is useful for full-text search within your semantic results.

**Operators:**
- `$contains` - documents must contain the string (case-sensitive)
- `$not_contains` - documents must not contain the string

```python
# Find documents containing a specific string (case-sensitive)
results = collection.query(
    query_texts=["search query"],
    where_document={"$contains": "important keyword"}
)

# Exclude documents containing a string
excluded = collection.query(
    query_texts=["search query"],
    where_document={"$not_contains": "deprecated"}
)

# Combine multiple document filters with $and
combined = collection.query(
    query_texts=["search query"],
    where_document={
        "$and": [
            {"$contains": "python"},
            {"$not_contains": "legacy"}
        ]
    }
)

# Combine where_document with metadata filtering
full_filter = collection.query(
    query_texts=["search query"],
    n_results=10,
    where={"status": "published"},
    where_document={"$contains": "tutorial"}
)
```

## The `get` method

Use `get` when you need to retrieve documents without similarity ranking. Common use cases:

- Fetching specific documents by ID after a search
- Paginating through all documents in a collection
- Retrieving documents by metadata filter only

```python
# Get by specific IDs
docs = collection.get(ids=["doc1", "doc2"])

# Get with pagination (default limit is 100)
page = collection.get(limit=20, offset=0)

# Get with metadata filter (no similarity ranking)
filtered = collection.get(
    where={"category": "blog"},
    limit=50
)
```

The key difference from `query`: `get` returns documents in insertion order (or filtered by metadata), while `query` returns documents ranked by similarity to your query text.