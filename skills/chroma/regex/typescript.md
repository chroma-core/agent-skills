---
name: Chroma Regex Filtering
description: Learn how to use regex filters in Chroma queries
---

## Regex Filtering in Chroma

Chroma supports regex filtering on document metadata. This allows you to filter results based on pattern matching.

### Basic Regex Filter

Use the `$regex` operator to match metadata values against a regular expression:

```typescript
await collection.get({
  whereDocument: {
    $regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  },
});
```

### Case-Insensitive Matching

For case-insensitive regex matching, use the `$iregex` operator:

```typescript
const results2 = await collection.query({
  queryTexts: ['search query'],
  whereDocument: {
    $regex: 'javascript',
  },
  nResults: 10,
});
```
