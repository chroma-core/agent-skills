---
name: Metadata
description: Store and query metadata, including filters and array values
---

## Metadata

Metadata in Chroma is structured key-value data stored alongside each document. You can use metadata to filter records in both `query` and `get`, and the metadata model is the same between local and cloud.

### Imports and boilerplate

```typescript
import { CloudClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new CloudClient({});
const embeddingFunction = new DefaultEmbeddingFunction();
```

### Filtering with `where`

The `where` argument filters documents by metadata. With `query`, this reduces the candidate set before similarity search runs. The same filter syntax also works with `get` when you want metadata-based retrieval without similarity ranking.

```typescript
const collection = await client.getOrCreateCollection({
  name: 'articles',
  embeddingFunction,
});

const queryResults = await collection.query({
  queryTexts: ['interest rates outlook'],
  where: {
    category: 'research',
  },
});

const filteredDocs = await collection.get({
  where: {
    $and: [{ year: { $gte: 2025 } }, { region: { $in: ['us', 'eu'] } }],
  },
  limit: 20,
});

const directFilter = {
  metadata_field: 'search_string',
};

const explicitFilter = {
  metadata_field: {
    $eq: 'search_string',
  },
};
```

### Available filter operators

Chroma supports these operators in `where` clauses:

- **Equality:** `$eq` (default if just a value), `$ne`
- **Comparison:** `$gt`, `$gte`, `$lt`, `$lte`
- **Set membership:** `$in`, `$nin`
- **Array:** `$contains`, `$not_contains`
- **Logical:** `$and`, `$or`

Filters can be nested and combined for complex queries. Filtering in Chroma is usually better than retrieving a larger result set and post-processing it in application code.

### Storing arrays in metadata

Chroma supports storing arrays of strings, numbers, and booleans in metadata fields. This removes the need for workarounds like comma-separated strings or JSON serialization when one field needs multiple values.

**Rules:**
- All elements in an array must share the same type
- Arrays are stored directly on metadata fields alongside regular scalar values

```typescript
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
```

### Querying array metadata with `$contains`

Use `$contains` in a `where` filter to find records where an array metadata field includes a specific value.

```typescript
const results = await collection.query({
  queryTexts: ['lending products'],
  where: {
    topics: { $contains: 'lending' },
  },
});
```

### Querying array metadata with `$not_contains`

Use `$not_contains` to exclude records where an array metadata field includes a specific value.

```typescript
const filtered = await collection.query({
  queryTexts: ['economic outlook'],
  where: {
    topics: { $not_contains: 'inflation' },
  },
});
```

### Combining array and scalar filters

Array filters compose with existing logical operators (`$and`, `$or`) and can be combined with scalar metadata filters in the same query.

```typescript
const combined = await collection.query({
  queryTexts: ['financial results'],
  where: {
    $and: [{ topics: { $contains: 'earnings' } }, { year: { $gte: 2025 } }],
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
```

### Common use cases

- **Multi-label tagging:** Store tags or categories as arrays, then filter with `$contains` to find matching records without joins or separate tables.
- **Access control:** Store allowed roles or groups as an array, then filter by the current user's role at query time.
- **Tenant and source filtering:** Store fields like tenant ID, source system, or document type so retrieval can stay scoped to the relevant subset.
