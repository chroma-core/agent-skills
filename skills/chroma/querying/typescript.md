---
name: Query and Get
description: Query and Get Data from Chroma Collections
---

## Querying

Chroma provides two main methods for retrieving documents: `query` and `get`. Understanding when to use each is important for building effective search.

### Query vs Get

**Use `query` when:**
- You have a search query (text that needs to be embedded and compared)
- You want results ranked by semantic similarity
- Building search features, RAG systems, or recommendation engines

**Use `get` when:**
- You know the exact document IDs you want
- You need to retrieve documents by metadata without similarity ranking
- Fetching documents to display after a search, or for batch operations

### Imports and boilerplate

```typescript
import { ChromaClient, type IncludeEnum } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new ChromaClient();
```

### Basic query

The `query` method embeds your query text and finds the nearest neighbors in the collection. Results are returned in order of similarity.

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

### Query with options

You can control what data is returned using `include`, and limit results with `nResults`. By default, Chroma returns 10 results.

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

The `include` parameter accepts: `documents`, `metadatas`, `embeddings`, and `distances`. Only request what you need to minimize response size.

### Metadata filtering

The `where` argument filters documents by metadata before the similarity search runs. This is efficient because it reduces the candidate set that needs to be compared.

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

### Available filter operators

Chroma supports these operators in `where` clauses:

- **Equality:** `$eq` (default if just a value), `$ne`
- **Comparison:** `$gt`, `$gte`, `$lt`, `$lte`
- **Set membership:** `$in`, `$nin`
- **Logical:** `$and`, `$or`

Filters can be nested and combined for complex queries. Metadata filtering is much faster than post-processing results in application code.

### Document content filtering

The `whereDocument` parameter filters on the actual document text, not metadata. This is useful for full-text search within your semantic results.

**Operators:**
- `$contains` - documents must contain the string (case-sensitive)
- `$not_contains` - documents must not contain the string

```typescript
// Find documents containing a specific string (case-sensitive)
const containsResults = await collection.query({
  queryTexts: ['search query'],
  whereDocument: { $contains: 'important keyword' },
});

// Exclude documents containing a string
const excludedResults = await collection.query({
  queryTexts: ['search query'],
  whereDocument: { $not_contains: 'deprecated' },
});

// Combine multiple document filters with $and
const combinedResults = await collection.query({
  queryTexts: ['search query'],
  whereDocument: {
    $and: [{ $contains: 'python' }, { $not_contains: 'legacy' }],
  },
});

// Combine whereDocument with metadata filtering
const fullFilterResults = await collection.query({
  queryTexts: ['search query'],
  nResults: 10,
  where: { status: 'published' },
  whereDocument: { $contains: 'tutorial' },
});
```

## The `get` method

Use `get` when you need to retrieve documents without similarity ranking. Common use cases:

- Fetching specific documents by ID after a search
- Paginating through all documents in a collection
- Retrieving documents by metadata filter only

```typescript
// Get by specific IDs
const docs = await collection.get({
  ids: ['doc1', 'doc2'],
});

// Get with pagination (default limit is 100)
const page = await collection.get({
  limit: 20,
  offset: 0,
});

// Get with metadata filter (no similarity ranking)
const filtered = await collection.get({
  where: { category: 'blog' },
  limit: 50,
});
```

The key difference from `query`: `get` returns documents in insertion order (or filtered by metadata), while `query` returns documents ranked by similarity to your query text.