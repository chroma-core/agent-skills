// @snippet:imports
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';
import { ChromaClient } from 'chromadb';

const client = new ChromaClient();
const embedder = new DefaultEmbeddingFunction();

const collection = await client.getOrCreateCollection({
  name: 'example-collection',
  embeddingFunction: embedder,
});
// @end

// @snippet:basic-regex
await collection.query({
  queryTexts: ['find support tickets with email addresses'],
  whereDocument: {
    $regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
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
