// @snippet:imports
import { ChromaClient, type IncludeEnum } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new ChromaClient();
// @end

// @snippet:query-method

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
// @end

// @snippet:query-with-options

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
// @end

// @snippet:metadata-filtering

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

// @end

// @snippet:get-method

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

// @end

// @snippet:where-document

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

// @end
