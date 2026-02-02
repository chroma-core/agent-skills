// @snippet:imports
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
// @end

// @snippet:basic-example
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
// @end

// @snippet:splade
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
// @end

// @snippet:bm25
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
// @end
