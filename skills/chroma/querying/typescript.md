---
name: Query and Get
description: Query and Get Data from Chroma Collections
---

## Querying

Query and Get Data from Chroma Collections

### Imports and boilerplatte

```typescript
import { ChromaClient, type IncludeEnum } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new ChromaClient();
```

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
  embeddingFunction: embeddingFunction2,
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

### Metadata Filtering

The where argument in get and query is used to filter records by their metadata. For example, in this query operation, Chroma will only query records that have the page metadata field with the value 10:

```typescript
await collection.query({
  queryTexts: ['first query', 'second query'],
  where: { page: 10 },
});

// In order to filter on metadata, you must supply a where filter dictionary to the query. The dictionary must have the following structure:
// {
//     metadata_field: {
//         <Operator>: <Value>
//     }
// }

// Using the $eq operator is equivalent to using the metadata field directly in your where filter.

const filter1 = {
  metadata_field: 'search_string',
};

// is equivalent to

const filter2 = {
  metadata_field: {
    $eq: 'search_string',
  },
};

const andExample = {
  $and: [
    {
      metadata_field1: {
        // <Operator>: <Value>
      },
    },
    {
      metadata_field2: {
        //<Operator>: <Value>
      },
    },
  ],
};
```