---
name: Schema
description: Schema() configures collections with multiple indexes
---

## Schema

The Schema API configures collections with advanced indexing options, including multiple indexes on the same collection. This enables hybrid search strategies that combine different retrieval methods.

**Note:** The Schema API is only available on Chroma Cloud.

### Why use Schema?

Without Schema, collections have a single dense embedding index. With Schema, you can:

- Add sparse indexes (BM25, SPLADE) alongside dense embeddings for hybrid search
- Configure multiple embedding functions on the same collection
- Fine-tune index parameters for your specific use case

Hybrid search (combining dense and sparse) often outperforms either method alone, especially for queries that mix conceptual meaning with specific keywords.

### Important: Schema vs embedding function

When using the Schema API, you cannot pass an embedding function directly to `getOrCreateCollection`. Instead, you pass the embedding function to `schema.indexConfig()`. This gives you explicit control over which index uses which embedding.

### Imports

{{CODE:imports}}

## BM25 sparse index

BM25 is a traditional keyword-based ranking algorithm. It works well when:
- Exact keyword matches are important
- Users search with specific terms they expect to find verbatim
- You want a lightweight sparse index without neural embeddings

BM25 doesn't understand semantics, so "car" won't match "automobile". Use it as a complement to dense embeddings, not a replacement.

{{CODE:bm25}}

## SPLADE sparse index

SPLADE (Sparse Lexical and Expansion) is a neural sparse embedding model. It combines the efficiency of sparse retrieval with learned term expansion.

**SPLADE vs BM25:**
- SPLADE understands synonyms and related terms (like dense embeddings)
- SPLADE produces sparse vectors (efficient like BM25)
- SPLADE generally outperforms BM25 for most use cases
- BM25 is simpler and doesn't require a neural model

For hybrid search, SPLADE + dense embeddings is typically the best combination. Use BM25 only if you have specific requirements for traditional keyword matching or want to avoid the neural model dependency.

{{CODE:splade}}

## Choosing an index strategy

| Use case | Recommended setup |
|----------|-------------------|
| General semantic search | Dense embeddings only (default) |
| Search with important keywords | Dense + BM25 hybrid |
| Best quality hybrid search | Dense + SPLADE hybrid |
