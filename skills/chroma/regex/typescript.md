---
name: Chroma Regex Filtering
description: Learn how to use regex filters in Chroma queries
---

## Regex Filtering in Chroma

Chroma supports regex filtering on document content and metadata. This is useful when you need exact pattern matching that semantic search can't provide.

### When to use regex vs semantic search

**Use regex when:**
- Matching exact patterns like email addresses, URLs, or code identifiers
- Finding documents containing specific formats (dates, phone numbers, IDs)
- Filtering by prefixes or suffixes in structured data
- You need deterministic, repeatable matches

**Use semantic search when:**
- Looking for conceptually similar content regardless of exact wording
- The user's query is natural language
- You want to find related content even if it uses different terminology

You can combine both: use regex to narrow results, then rank by semantic similarity.

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

Use the `$regex` operator in `where_document` to match document content against a regular expression. The regex follows standard regex syntax.

```typescript
await collection.get({
  whereDocument: {
    $regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  },
});
```

### Combining regex with metadata filters

Regex filters can be combined with metadata filters using `$and` and `$or` operators. This is powerful for narrowing results by both content patterns and structured metadata.

```typescript
await collection.query({
  queryTexts: ['query1', 'query2'],
  whereDocument: {
    $and: [{ $contains: 'search_string_1' }, { $regex: '[a-z]+' }],
  },
});
```

### Performance considerations

Regex filtering happens after the initial vector search retrieves candidates. For best performance:
- Keep regex patterns simple when possible
- Use metadata filters to reduce the candidate set before regex matching
- Consider whether a metadata field with pre-extracted values would be faster than runtime regex
