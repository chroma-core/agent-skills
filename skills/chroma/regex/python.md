---
name: Chroma Regex Filtering
description: Learn how to use regex filters in Chroma queries
---

## Regex Filtering in Chroma

Chroma supports regex filtering on document metadata. This allows you to filter results based on pattern matching.

### Basic Regex Filter

Use the `$regex` operator to match metadata values against a regular expression:

```python
results = collection.query(
    query_texts=["search query"],
    where={
        "category": {"$regex": "^tech.*"}
    },
    n_results=10
)
```

### Case-Insensitive Matching

For case-insensitive regex matching, use the `$iregex` operator:

```python
results = collection.query(
    query_texts=["search query"],
    where={
        "title": {"$iregex": "javascript"}
    },
    n_results=10
)
```
