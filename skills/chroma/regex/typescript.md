---
name: Chroma Regex Filtering
description: Learn how to use regex filters in Chroma queries
---

## Regex Filtering in Chroma

Chroma supports regex filtering on document metadata. This allows you to filter results based on pattern matching.

### Imports and boilerplate

```typescript
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
```

### Basic Regex Filter

Use the `$regex` operator to match metadata values against a regular expression:

```typescript
await collection.get({
  whereDocument: {
    $regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  },
});
```

### Combining with metadata filters

```typescript
await collection.query({
  queryTexts: ['query1', 'query2'],
  whereDocument: {
    $and: [{ $contains: 'search_string_1' }, { $regex: '[a-z]+' }],
  },
});
```
