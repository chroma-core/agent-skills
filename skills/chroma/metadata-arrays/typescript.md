---
name: Metadata Arrays
description: Store and query arrays of strings, numbers, and booleans in metadata fields
---

## Metadata Arrays

Chroma supports storing arrays of strings, numbers, and booleans in metadata fields. This eliminates the need for workarounds like comma-separated strings or JSON serialization when a record needs multiple values for a single field.

**Rules:**
- All elements in an array must share the same type (all strings, all numbers, or all booleans)
- Arrays are stored directly on metadata fields alongside regular scalar values

### Imports and boilerplate

```typescript
import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new ChromaClient();
const embeddingFunction = new DefaultEmbeddingFunction();
```

### Adding records with array metadata

Store arrays directly in metadata fields when adding or upserting documents.

```typescript
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
```

### Querying array metadata with $contains

Use `$contains` in a `where` filter to find records where an array metadata field includes a specific value.

```typescript
// Find all articles tagged with "lending"
const results = await collection.query({
  queryTexts: ['lending products'],
  where: {
    topics: { $contains: 'lending' },
  },
});
```

### Querying array metadata with $not_contains

Use `$not_contains` to exclude records where an array metadata field includes a specific value.

```typescript
// Exclude articles about inflation
const filtered = await collection.query({
  queryTexts: ['economic outlook'],
  where: {
    topics: { $not_contains: 'inflation' },
  },
});
```

### Combining array filters with logical operators

Array filter operators compose with existing logical operators (`$and`, `$or`) and can be combined with scalar metadata filters in a single query.

```typescript
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
```

### Common use cases

- **Multi-label tagging:** Store tags or categories as arrays, then filter with `$contains` to find matching records without needing joins or separate tables.
- **Multi-entity association:** Track mentioned users, related entities, or linked resources as arrays on each record.
- **Access control:** Store allowed roles or groups as an array, then filter by the current user's role at query time.
