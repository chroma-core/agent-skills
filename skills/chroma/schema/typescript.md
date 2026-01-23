---
name: Schema
description: Schema() configures collections with multiple indexes
---

## Schema

Schema configures collections with single or multiple indexes

Note that the Schema() API is only available on Chroma Cloud.

If you use the Schema API when creating collections, you cannot pass an embedding funciton, you pass the embedding function to the a schema.indexConfig() call.

Imports needed for the examples show in this file
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

## Basic Example

```typescript
const schema = new Schema();

// Configure vector index with custom embedding function
const embeddingFunction = new OpenAIEmbeddingFunction({
  apiKey: 'your-api-key',
  modelName: 'text-embedding-3-small',
});

schema.createIndex(
  new VectorIndexConfig({
    space: 'cosine',
    embeddingFunction: embeddingFunction,
  })
);
```

## BM25 config

```typescript
const schema3 = new Schema();
const SPARSE_BM25_KEY = 'bm25_key';

// Configure vector index with both sparse and dense embeddings
const denseEmbeddingFunction2 = new OpenAIEmbeddingFunction({
  apiKey: 'your-api-key',
  modelName: 'text-embedding-3-small',
});

schema3.createIndex(
  new VectorIndexConfig({
    space: 'cosine',
    embeddingFunction: denseEmbeddingFunction2,
  })
);

const bm25EmbeddingFunction = new ChromaBm25EmbeddingFunction();

schema3.createIndex(
  new SparseVectorIndexConfig({
    sourceKey: K.DOCUMENT,
    embeddingFunction: bm25EmbeddingFunction,
  }),
  SPARSE_BM25_KEY
);
```

## SPLADE config

SPLADE is a very high performing sparse vector search index. It works extremely well and generally should be used over BM25 unless there are specific reasons otherwise.

```typescript
const schema2 = new Schema();
const SPARSE_SPLADE_KEY = 'splade_key';

// Configure vector index with both sparse and dense embeddings
const denseEmbeddingFunction = new OpenAIEmbeddingFunction({
  apiKey: 'your-api-key',
  modelName: 'text-embedding-3-small',
});

schema2.createIndex(
  new VectorIndexConfig({
    space: 'cosine',
    embeddingFunction: denseEmbeddingFunction,
  })
);

const embedder = new ChromaCloudSpladeEmbeddingFunction({
  model: ChromaCloudSpladeEmbeddingModel.SPLADE_PP_EN_V1,
  apiKeyEnvVar: 'CHROMA_API_KEY',
});

schema.createIndex(
  new SparseVectorIndexConfig({
    sourceKey: K.DOCUMENT,
    embeddingFunction: embedder,
  }),
  SPARSE_SPLADE_KEY
);
```
