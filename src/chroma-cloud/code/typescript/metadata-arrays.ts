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

// @snippet:add-with-arrays
const collection = await client.getOrCreateCollection({
  name: 'articles',
  embeddingFunction,
});

await collection.add({
  ids: ['article-1', 'article-2', 'article-3'],
  documents: [
    'Net interest income rose 12% in Q3',
    'New lending products launched in Southeast Asia',
    'Central bank holds rates steady amid inflation concerns',
  ],
  metadatas: [
    {
      topics: ['net-interest-income', 'earnings', 'quarterly-results'],
      year: 2026,
    },
    {
      topics: ['lending', 'expansion', 'southeast-asia'],
      year: 2026,
    },
    {
      topics: ['rates', 'central-bank', 'inflation'],
      year: 2026,
    },
  ],
});
// @end

// @snippet:contains-query
const results = await collection.query({
  queryTexts: ['lending products'],
  where: {
    topics: { $contains: 'lending' },
  },
});
// @end

// @snippet:not-contains-query
const filtered = await collection.query({
  queryTexts: ['economic outlook'],
  where: {
    topics: { $not_contains: 'inflation' },
  },
});
// @end

// @snippet:combined-filters
const combined = await collection.query({
  queryTexts: ['financial results'],
  where: {
    $and: [
      { topics: { $contains: 'earnings' } },
      { year: { $gte: 2025 } },
    ],
  },
});

const multiMatch = await collection.query({
  queryTexts: ['market trends'],
  where: {
    $or: [
      { topics: { $contains: 'rates' } },
      { topics: { $contains: 'inflation' } },
    ],
  },
});
// @end
