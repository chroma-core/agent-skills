// @snippet:imports
import { CloudClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});
const embeddingFunction = new DefaultEmbeddingFunction();
// @end

// @snippet:fork-collection
const sourceCollection = await client.getCollection({
  name: 'main-repo-index',
  embeddingFunction,
});

const forkedCollection = await sourceCollection.fork({
  name: 'main-repo-index-pr-1234',
});
// @end

// @snippet:add-to-fork
await forkedCollection.add({
  ids: ['doc-pr-1', 'doc-pr-2'],
  documents: [
    'New API endpoint for user preferences',
    'Updated authentication flow with OAuth2',
  ],
});
// @end

// @snippet:query-fork
// Query the fork — includes source data plus any new additions
const results = await forkedCollection.query({
  queryTexts: ['authentication changes'],
  nResults: 5,
});
// @end
