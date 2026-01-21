---
name: Search() API
description: An expressive and flexible API for doing dense and sparse vector search on collections, as well as hybrid search
---

## Search() API

An expressive and flexible API for doing dense and sparse vector search on collections, as well as hybrid search.

The Search API is meant to be used with Collection Schemas.

Note that the Search() API is only available on Chroma Cloud.

```python
from chromadb import Search, K, Knn, CloudClient, Rrf
import os

client = CloudClient(
    tenant=os.getenv("CHROMA_TENANT"),
    database=os.getenv("CHROMA_DATABASE"),
    api_key=os.getenv("CHROMA_API_KEY"),
)

collection = client.get_or_create_collection(name="my_collection")
```

### Example

The Key class (aliased as K for brevity) provides a fluent interface for building filter expressions. Use K to reference document fields, IDs, and metadata properties.

```python
# K is an alias for Key - use K for more concise code
# Filter by metadata field
K("status") == "active"

# Filter by document content
K.DOCUMENT.contains("machine learning")

# Filter by document IDs
K.ID.is_in(["doc1", "doc2", "doc3"])

# Equality and inequality (all types)
K("status") == "published"     # String equality
K("views") != 0                # Numeric inequality
K("featured") == True          # Boolean equality

# Numeric comparisons (numbers only)
K("price") > 100               # Greater than
K("rating") >= 4.5             # Greater than or equal
K("stock") < 10                # Less than
K("discount") <= 0.25          # Less than or equal

# Set membership operators (works on all fields)
K.ID.is_in(["doc1", "doc2", "doc3"])           # Match any ID in list
K("category").is_in(["tech", "science"])       # Match any category
K("status").not_in(["draft", "deleted"])       # Exclude specific values

# String content operators (currently K.DOCUMENT only)
K.DOCUMENT.contains("machine learning")        # Substring search in document
K.DOCUMENT.not_contains("deprecated")          # Exclude documents with text
K.DOCUMENT.regex(r"\bAPI\b")                   # Match whole word "API" in document
```

Ranking uses Knn

```python
# Example 1: Single Knn - scores top 16 documents
rank = Knn(query="machine learning research")
# Only the 16 nearest documents get scored (default limit)

# Example 2: Multiple Knn with default=None
rank = Knn(query="research papers", limit=100) + Knn(query="academic publications", limit=100, key="sparse_embedding")
# Both Knn have default=None (the default)
# Documents must appear in BOTH top-100 lists to be scored
# Documents in only one list are excluded

# Example 3: Mixed default values
rank = Knn(query="AI research", limit=100) * 0.5 + Knn(query="scientific papers", limit=50, default=1000.0, key="sparse_embedding") * 0.5
# First Knn has default=None, second has default=1000.0
# Documents in first top-100 but not in second top-50:
#   - Get first distance * 0.5 + 1000.0 * 0.5 (second's default)
# Documents in second top-50 but not in first top-100:
#   - Excluded (must appear in all Knn where default=None)
# Documents in both lists:
#   - Get first distance * 0.5 + second distance * 0.5


from chromadb import Knn

# Basic search on default embedding field
Knn(query="What is machine learning?")

# Search with custom parameters
Knn(
    query="What is machine learning?",
    key="#embedding",      # Field to search (default: "#embedding")
    limit=100,            # Max candidates to consider (default: 16)
    return_rank=False     # Return rank position vs distance (default: False)
)

# Search custom sparse embedding field in metadata
Knn(query="machine learning", key="sparse_embedding")
```

A full, simple example

```python
# Build the base search with filtering
search = (
    Search()
    .where(K("category") == "science")
    .limit(10)
    .select(K.DOCUMENT, K.SCORE)
)

# Option 1: Pass pre-computed embeddings directly
query_embedding = [0.25, -0.15, 0.33, ...]
result = collection.search(search.rank(Knn(query=query_embedding)))

# Option 2: Pass text query (embedding created using collection's schema configuration)
query_text = "What are the latest advances in quantum computing?"
result = collection.search(search.rank(Knn(query=query_text)))
```

An example of hybrid search using Rrf

```python
# Dense semantic embeddings
dense_rank = Knn(
    query="machine learning research",  # Text query for dense embeddings
    key="#embedding",          # Default embedding field
    return_rank=True,
    limit=200                  # Consider top 200 candidates
)

# Sparse keyword embeddings
sparse_rank = Knn(
    query="machine learning research",  # Text query for sparse embeddings
    key="sparse_embedding",    # Metadata field for sparse vectors
    return_rank=True,
    limit=200
)

# Combine with RRF
hybrid_rank = Rrf(
    ranks=[dense_rank, sparse_rank],
    weights=[0.7, 0.3],       # 70% semantic, 30% keyword
    k=60
)

# Use in search
search = (Search()
    .where(K("status") == "published")  # Optional filtering
    .rank(hybrid_rank)
    .limit(20)
    .select(K.DOCUMENT, K.SCORE, "title")
)

results = collection.search(search)
```
