// @snippet:imports
import { ChromaBm25EmbeddingFunction } from '@chroma-core/chroma-bm25';
import {
  ChromaCloudQwenEmbeddingFunction,
  ChromaCloudQwenEmbeddingModel,
} from '@chroma-core/chroma-cloud-qwen';
import { ChromaCloudSpladeEmbeddingFunction } from '@chroma-core/chroma-cloud-splade';
import {
  CloudClient,
  K,
  Schema,
  SparseVectorIndexConfig,
  VectorIndexConfig,
} from 'chromadb';

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});
// @end

// @snippet:splade
const spladeSchema = new Schema();
const SPARSE_SPLADE_KEY = 'splade_key';

// Configure vector index with both sparse and dense embeddings
const denseEmbeddingFunction = new ChromaCloudQwenEmbeddingFunction({
  model: ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
  task: null,
  apiKeyEnvVar: 'CHROMA_API_KEY',
});

spladeSchema.createIndex(
  new VectorIndexConfig({
    space: 'cosine',
    embeddingFunction: denseEmbeddingFunction,
  })
);

const spladeEmbeddingFunction = new ChromaCloudSpladeEmbeddingFunction();

spladeSchema.createIndex(
  new SparseVectorIndexConfig({
    sourceKey: K.DOCUMENT,
    embeddingFunction: spladeEmbeddingFunction,
  }),
  SPARSE_SPLADE_KEY
);

// create the collection with the schema
const spladeCollectionExample = await client.getOrCreateCollection({
  name: 'my_collection',
  schema: spladeSchema,
});
// @end

// @snippet:bm25
const bm25Schema = new Schema();
const SPARSE_BM25_KEY = 'bm25_key';

// Configure vector index with both sparse and dense embeddings
const bm25ExampleEmbeddingFunction = new ChromaCloudQwenEmbeddingFunction({
  model: ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
  task: null,
  apiKeyEnvVar: 'CHROMA_API_KEY',
});

bm25Schema.createIndex(
  new VectorIndexConfig({
    space: 'cosine',
    embeddingFunction: bm25ExampleEmbeddingFunction,
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

// create the collection with the schema
const bm25CollectionExample = await client.getOrCreateCollection({
  name: 'my_collection',
  schema: bm25Schema,
});
// @end
