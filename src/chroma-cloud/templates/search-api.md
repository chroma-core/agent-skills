---
name: Search() API
description: An expressive and flexible API for doing dense and sparse vector search on collections, as well as hybrid search
---

## Search() API

The Search API provides a fluent, composable interface for building complex queries. It's more expressive than the basic `query` method and supports advanced features like hybrid search with rank fusion.

**Note:** The Search API is only available on Chroma Cloud and is designed to work with Collection Schemas.

### When to use Search() vs query()

**Use `query()` when:**
- You need simple semantic search
- You're using local Chroma
- You want the most straightforward API

**Use `search()` when:**
- You need hybrid search combining dense and sparse indexes
- You want fine-grained control over ranking and filtering
- You're building complex queries with multiple conditions
- You need to select specific fields to return

Note that the Search() class uses a builder pattern, so if you call a method on it, it does not mutate that instance, it returns a copy with that mutation, so it needs re-assignging to the variable that is referencing it.

The `search()` method on a collection is able to take a single Search class instance or an arry of them, so rhe return value of the `search()` method on a collection is a SearchResult class, which has a `rows()` method, which will give you an array of array of results. So index 0 of the return value of `rows()` will be the array of the first Search class instance results.

### Setup

{{CODE:imports}}

### Filtering with Key (K)

The `Key` class (aliased as `K` for brevity) provides a fluent interface for building filter expressions. Think of it like a query builder for metadata, document content, and IDs.

{{CODE:k}}

### Ranking with Knn

`Knn` (k-nearest neighbors) is how you specify which embeddings to search and how to score results. Each `Knn` finds the nearest neighbors for a given query in a specific index.

The `limit` parameter controls how many candidates each `Knn` considers. A higher limit means more candidates are scored, which can improve recall but increases latency.

{{CODE:knn}}

### Basic search example

Here's a complete example showing the typical flow: create a collection, add documents, and search.

{{CODE:base-example}}

### Hybrid search with Reciprocal Rank Fusion (RRF)

Hybrid search combines results from multiple indexes (typically dense + sparse) to get better results than either alone. RRF is a rank fusion algorithm that merges ranked lists without needing score normalization.

**How RRF works:**
1. Each `Knn` produces a ranked list of candidates
2. Documents are scored based on their rank position in each list: `1 / (k + rank)`
3. Scores are weighted and summed across all lists
4. Final results are sorted by combined score

The `k` parameter (default 60) controls how much weight top-ranked documents get relative to lower-ranked ones. Higher `k` values make rankings more uniform.

{{CODE:rrf}}

### Building effective hybrid search

For best results with hybrid search:

1. **Use comparable limits** for each `Knn` so both indexes contribute meaningfully
2. **Weight based on your data**: keyword-heavy content might favor sparse; conceptual content might favor dense
3. **Start with 0.7/0.3 weighting** (dense/sparse) and adjust based on evaluation
4. **Use `returnRank: true`** when combining with RRF, as RRF operates on ranks, not distances

Note that return ranks from RRF are netagive and the value furthest from 0 is the closest to the original query.