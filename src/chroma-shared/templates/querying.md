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

{{CODE:imports}}

### Basic query

The `query` method embeds your query text and finds the nearest neighbors in the collection. Results are returned in order of similarity.

{{CODE:query-method}}

### Query with options

You can control what data is returned using `include`, and limit results with `nResults`. By default, Chroma returns 10 results.

{{CODE:query-with-options}}

The `include` parameter accepts: `documents`, `metadatas`, `embeddings`, and `distances`. Only request what you need to minimize response size.

### Document content filtering

The `whereDocument` parameter filters on the actual document text, not metadata. This is useful for full-text search within your semantic results.

**Operators:**
- `$contains` - documents must contain the string (case-sensitive)
- `$not_contains` - documents must not contain the string

{{CODE:where-document}}

## The `get` method

Use `get` when you need to retrieve documents without similarity ranking. Common use cases:

- Fetching specific documents by ID after a search
- Paginating through all documents in a collection
- Retrieving documents by metadata filter only

{{CODE:get-method}}

The key difference from `query`: `get` returns documents in insertion order (or filtered by metadata), while `query` returns documents ranked by similarity to your query text.
