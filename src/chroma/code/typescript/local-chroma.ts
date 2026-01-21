// @snippet:imports
import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';
// @end

// @snippet:base-local-example

// client with no args uses local chroma instance
const client = new ChromaClient();

const embeddingFunction = new DefaultEmbeddingFunction();

const collection = await client.getOrCreateCollection({
  name: 'my_collection',
  embeddingFunction,
});

await collection.add({
  ids: ['doc1', 'doc2'],
  documents: [
    'Apples are really good red fruit',
    'Red cars tend to get more speeding tickets',
  ],
});

const results = await collection.query({
  queryTexts: ['I like red apples'],
});

const firstResult = results.documents[0];
// @end
