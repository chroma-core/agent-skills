// @snippet:imports
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
// @end

// @snippet:basic-regex
await collection.get({
  whereDocument: {
    $regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  },
});
// @end

// @snippet:combined-filters
await collection.query({
  queryTexts: ['query1', 'query2'],
  whereDocument: {
    $and: [{ $contains: 'search_string_1' }, { $regex: '[a-z]+' }],
  },
});
// @end
