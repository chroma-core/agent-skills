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

```typescript
import { ChromaBm25EmbeddingFunction } from '@chroma-core/chroma-bm25';
import {
  ChromaCloudSpladeEmbeddingFunction,
  ChromaCloudSpladeEmbeddingModel,
} from '@chroma-core/chroma-cloud-splade';
import { OpenAIEmbeddingFunction } from '@chroma-core/openai';
import {
  K,
  Schema,
  SparseVectorIndexConfig,
  VectorIndexConfig,
} from 'chromadb';
```

## Basic example

This creates a collection with a single dense embedding index, equivalent to not using Schema at all. It's a starting point for understanding the API.

```typescript
const basicSchema = new Schema();

// Configure vector index with custom embedding function
const embeddingFunction = new OpenAIEmbeddingFunction({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small',
});

basicSchema.createIndex(
  new VectorIndexConfig({
    space: 'cosine',
    embeddingFunction: embeddingFunction,
  })
);
```

## BM25 sparse index

BM25 is a traditional keyword-based ranking algorithm. It works well when:
- Exact keyword matches are important
- Users search with specific terms they expect to find verbatim
- You want a lightweight sparse index without neural embeddings

BM25 doesn't understand semantics, so "car" won't match "automobile". Use it as a complement to dense embeddings, not a replacement.

```typescript
const bm25Schema = new Schema();
const SPARSE_BM25_KEY = 'bm25_key';

// Configure vector index with both sparse and dense embeddings
const bm25DenseEmbeddingFunction = new OpenAIEmbeddingFunction({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small',
});

bm25Schema.createIndex(
  new VectorIndexConfig({
    space: 'cosine',
    embeddingFunction: bm25DenseEmbeddingFunction,
  })
);

const bm25EmbeddingFunction = new ChromaBm25EmbeddingFunction();

bm25Schema.createIndex(
  new SparseVectorIndexConfig({
    sourceKey: K.DOCUMENT,
    embeddingFunction: bm25EmbeddingFunction,
  }),
  SPARSE_BM25_KEY
);
```

## SPLADE sparse index

SPLADE (Sparse Lexical and Expansion) is a neural sparse embedding model. It combines the efficiency of sparse retrieval with learned term expansion.

**SPLADE vs BM25:**
- SPLADE understands synonyms and related terms (like dense embeddings)
- SPLADE produces sparse vectors (efficient like BM25)
- SPLADE generally outperforms BM25 for most use cases
- BM25 is simpler and doesn't require a neural model

For hybrid search, SPLADE + dense embeddings is typically the best combination. Use BM25 only if you have specific requirements for traditional keyword matching or want to avoid the neural model dependency.

```typescript
const spladeSchema = new Schema();
const SPARSE_SPLADE_KEY = 'splade_key';

// Configure vector index with both sparse and dense embeddings
const denseEmbeddingFunction = new OpenAIEmbeddingFunction({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small',
});

spladeSchema.createIndex(
  new VectorIndexConfig({
    space: 'cosine',
    embeddingFunction: denseEmbeddingFunction,
  })
);

const spladeEmbeddingFunction = new ChromaCloudSpladeEmbeddingFunction({
  model: ChromaCloudSpladeEmbeddingModel.SPLADE_PP_EN_V1,
  apiKeyEnvVar: 'CHROMA_API_KEY',
});

spladeSchema.createIndex(
  new SparseVectorIndexConfig({
    sourceKey: K.DOCUMENT,
    embeddingFunction: spladeEmbeddingFunction,
  }),
  SPARSE_SPLADE_KEY
);
```

## Choosing an index strategy

| Use case | Recommended setup |
|----------|-------------------|
| General semantic search | Dense embeddings only (default) |
| Search with important keywords | Dense + BM25 hybrid |
| Best quality hybrid search | Dense + SPLADE hybrid |
| Exact term matching required | Include BM25 alongside other indexes |
