---
name: Query and Get
description: Query and Get Data from Chroma Collections
---

## Querying

Query and Get Data from Chroma Collections

### Example

```typescript
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
```

A more involved example with query options

```typescript
const embeddingFunction2 = new DefaultEmbeddingFunction();

const collection2 = await client.getOrCreateCollection({
  name: 'my_collection',
  embeddingFunction,
});

const results2 = await collection2.query({
  queryTexts: ['I like red apples'],
  nResults: 2,
  // specify what to include in the results
  include: ['distances', 'embeddings', 'metadatas'],
  // reduce the search space by only looking at these ids
  ids: ['id1', 'id2'],
  // filter results based on metadata
  where: { category: 'philosophy' },
  // filter results only to those matching document criteria
  whereDocument: { $contains: 'wikipedia' },
});

// return types

type QueryResult = {
  distances: (number | null)[][];
  documents: (string | null)[][];
  embeddings: (number[] | null)[][];
  ids: string[][];
  include: IncludeEnum[];
  metadatas: (Record<string, string | number | boolean> | null)[][];
};

type GetResult = {
  documents: (string | null)[];
  embeddings: number[][];
  ids: string[];
  include: IncludeEnum[];
  metadatas: (Record<string, string | number | boolean> | null)[];
};
```