---
name: Metadata
description: Store and query metadata, including filters and array values
---

## Metadata

Metadata in Chroma is structured key-value data stored alongside each document. You can use metadata to filter records in both `query` and `get`, and the metadata model is the same between local and cloud.

### Imports and boilerplate

```python
import chromadb

client = chromadb.HttpClient(host="localhost", port=8000)
```

### Filtering with `where`

The `where` argument filters documents by metadata. With `query`, this reduces the candidate set before similarity search runs. The same filter syntax also works with `get` when you want metadata-based retrieval without similarity ranking.

```python
collection = client.get_or_create_collection(name="articles")

query_results = collection.query(
    query_texts=["interest rates outlook"],
    where={
        "category": "research",
    },
)

filtered_docs = collection.get(
    where={
        "$and": [
            {"year": {"$gte": 2025}},
            {"region": {"$in": ["us", "eu"]}},
        ]
    },
    limit=20,
)

direct_filter = {
    "metadata_field": "search_string",
}

explicit_filter = {
    "metadata_field": {
        "$eq": "search_string",
    }
}
```

### Available filter operators

Chroma supports these operators in `where` clauses:

- **Equality:** `$eq` (default if just a value), `$ne`
- **Comparison:** `$gt`, `$gte`, `$lt`, `$lte`
- **Set membership:** `$in`, `$nin`
- **Array:** `$contains`, `$not_contains`
- **Logical:** `$and`, `$or`

Filters can be nested and combined for complex queries. Filtering in Chroma is usually better than retrieving a larger result set and post-processing it in application code.

### Storing arrays in metadata

Chroma supports storing arrays of strings, numbers, and booleans in metadata fields. This removes the need for workarounds like comma-separated strings or JSON serialization when one field needs multiple values.

**Rules:**
- All elements in an array must share the same type
- Arrays are stored directly on metadata fields alongside regular scalar values

```python
collection.add(
    ids=["article-1", "article-2", "article-3"],
    documents=[
        "Net interest income rose 12% in Q3",
        "New lending products launched in Southeast Asia",
        "Central bank holds rates steady amid inflation concerns",
    ],
    metadatas=[
        {
            "topics": ["net-interest-income", "earnings", "quarterly-results"],
            "year": 2026,
        },
        {
            "topics": ["lending", "expansion", "southeast-asia"],
            "year": 2026,
        },
        {
            "topics": ["rates", "central-bank", "inflation"],
            "year": 2026,
        },
    ],
)
```

### Querying array metadata with `$contains`

Use `$contains` in a `where` filter to find records where an array metadata field includes a specific value.

```python
results = collection.query(
    query_texts=["lending products"],
    where={
        "topics": {"$contains": "lending"},
    },
)
```

### Querying array metadata with `$not_contains`

Use `$not_contains` to exclude records where an array metadata field includes a specific value.

```python
filtered = collection.query(
    query_texts=["economic outlook"],
    where={
        "topics": {"$not_contains": "inflation"},
    },
)
```

### Combining array and scalar filters

Array filters compose with existing logical operators (`$and`, `$or`) and can be combined with scalar metadata filters in the same query.

```python
combined = collection.query(
    query_texts=["financial results"],
    where={
        "$and": [
            {"topics": {"$contains": "earnings"}},
            {"year": {"$gte": 2025}},
        ]
    },
)

multi_match = collection.query(
    query_texts=["market trends"],
    where={
        "$or": [
            {"topics": {"$contains": "rates"}},
            {"topics": {"$contains": "inflation"}},
        ]
    },
)
```

### Common use cases

- **Multi-label tagging:** Store tags or categories as arrays, then filter with `$contains` to find matching records without joins or separate tables.
- **Access control:** Store allowed roles or groups as an array, then filter by the current user's role at query time.
- **Tenant and source filtering:** Store fields like tenant ID, source system, or document type so retrieval can stay scoped to the relevant subset.
