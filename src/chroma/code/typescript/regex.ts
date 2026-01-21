import { OpenAIEmbeddingFunction } from '@chroma-core/openai';
import { CloudClient } from 'chromadb';

// Initialize the embedder
const embedder = new OpenAIEmbeddingFunction({
  modelName: 'text-embedding-3-large',
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});

const collection = await client.getOrCreateCollection({
  name: 'exampe-collection',
  embeddingFunction: embedder,
});

// @snippet:basic-regex
await collection.get({
  whereDocument: {
    $regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  },
});
// @end

// @snippet:case-insensitive
const results2 = await collection.query({
  queryTexts: ['search query'],
  whereDocument: {
    $regex: 'javascript',
  },
  nResults: 10,
});
// @end
