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
from typing import Optional, TypedDict

import chromadb

client = chromadb.CloudClient()
```

### Basic query

The `query` method embeds your query text and finds the nearest neighbors in the collection. Results are returned in order of similarity.

```python
collection = client.get_or_create_collection(name="my_collection")

collection.add(
    ids=["doc1", "doc2"],
    documents=[
        "Apples are really good red fruit",
        "Red cars tend to get more speeding tickets",
    ],
)

results = collection.query(
    query_texts=["I like red apples"],
)

first_result = results["documents"][0]
```

### Query with options

You can control what data is returned using `include`, and limit results with `nResults`. By default, Chroma returns 10 results.

```python
collection2 = client.get_or_create_collection(name="my_collection")

results2 = collection2.query(
    query_texts=["I like red apples"],
    n_results=2,
    include=["metadatas", "documents", "embeddings", "distances"],
    ids=["id1", "id2"],
    where={"category": "philosophy"},
    where_document={"$contains": "wikipedia"},
)


class QueryResult(TypedDict):
    ids: list[list[str]]
    embeddings: Optional[list[list[list[float]]]]
    documents: Optional[list[list[str]]]
    metadatas: Optional[list[list[dict]]]
    distances: Optional[list[list[float]]]


class GetResult(TypedDict):
    ids: list[str]
    embeddings: Optional[list[list[float]]]
    documents: Optional[list[str]]
    metadatas: Optional[list[dict]]


typed_results: QueryResult = results2
```

The `include` parameter accepts: `documents`, `metadatas`, `embeddings`, and `distances`. Only request what you need to minimize response size.

### Document content filtering

The `whereDocument` parameter filters on the actual document text, not metadata. This is useful for full-text search within your semantic results.

**Operators:**
- `$contains` - documents must contain the string (case-sensitive)
- `$not_contains` - documents must not contain the string

```python
contains_results = collection.query(
    query_texts=["search query"],
    where_document={"$contains": "important keyword"},
)

excluded_results = collection.query(
    query_texts=["search query"],
    where_document={"$not_contains": "deprecated"},
)

combined_results = collection.query(
    query_texts=["search query"],
    where_document={
        "$and": [
            {"$contains": "python"},
            {"$not_contains": "legacy"},
        ]
    },
)

full_filter_results = collection.query(
    query_texts=["search query"],
    n_results=10,
    where={"status": "published"},
    where_document={"$contains": "tutorial"},
)
```

## The `get` method

Use `get` when you need to retrieve documents without similarity ranking. Common use cases:

- Fetching specific documents by ID after a search
- Paginating through all documents in a collection
- Retrieving documents by metadata filter only

```python
docs = collection.get(ids=["doc1", "doc2"])

page = collection.get(limit=20, offset=0)

filtered = collection.get(
    where={"category": "blog"},
    limit=50,
)
```

The key difference from `query`: `get` returns documents in insertion order (or filtered by metadata), while `query` returns documents ranked by similarity to your query text.
