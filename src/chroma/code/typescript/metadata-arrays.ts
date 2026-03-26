// @snippet:imports
import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new ChromaClient();
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
// Find all articles tagged with "lending"
const results = await collection.query({
  queryTexts: ['lending products'],
  where: {
    topics: { $contains: 'lending' },
  },
});
// @end

// @snippet:not-contains-query
// Exclude articles about inflation
const filtered = await collection.query({
  queryTexts: ['economic outlook'],
  where: {
    topics: { $not_contains: 'inflation' },
  },
});
// @end

// @snippet:combined-filters
// Combine array filters with scalar filters using $and
const combined = await collection.query({
  queryTexts: ['financial results'],
  where: {
    $and: [
      { topics: { $contains: 'earnings' } },
      { year: { $gte: 2025 } },
    ],
  },
});

// Use $or to match records containing any of several values
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

