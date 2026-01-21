---
name: Search() API
description: An expressive and flexible API for doing dense and sparse vector search on collections, as well as hybrid search
---

## Search() API

An expressive and flexible API for doing dense and sparse vector search on collections, as well as hybrid search.

The Search API is meant to be used with Collection Schemas.

Note that the Search() API is only available on Chroma Cloud.

```typescript
import { ChromaClient, type IncludeEnum, Rrf, K, Knn, Search } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new ChromaClient();
```

### Example

The Key class (aliased as K for brevity) provides a fluent interface for building filter expressions. Use K to reference document fields, IDs, and metadata properties.

```typescript
// K is an alias for Key - use K for more concise code
// Filter by metadata field
K('status').eq('active');

// Filter by document content
K.DOCUMENT.contains('machine learning');

// Filter by document IDs
K.ID.isIn(['doc1', 'doc2', 'doc3']);

// Equality and inequality (all types)
K('status').eq('published'); // String equality
K('views').ne(0); // Numeric inequality
K('featured').eq(true); // Boolean equality

// Numeric comparisons (numbers only)
K('price').gt(100); // Greater than
K('rating').gte(4.5); // Greater than or equal
K('stock').lt(10); // Less than
K('discount').lte(0.25); // Less than or equal

K.ID.isIn(['doc1', 'doc2', 'doc3']); // Match any ID in list
K('category').isIn(['tech', 'science']); // Match any category
K('status').notIn(['draft', 'deleted']); // Exclude specific values

// String content operators (currently K.DOCUMENT only)
K.DOCUMENT.contains('machine learning'); // Substring search in document
K.DOCUMENT.notContains('deprecated'); // Exclude documents with text
K.DOCUMENT.regex('\\bAPI\\b'); // Match whole word "API" in document
```

Ranking uses Knn

```typescript
// Example 1: Single Knn - scores top 16 documents
const rank1 = Knn({ query: 'machine learning research' });
// Only the 16 nearest documents get scored (default limit)

// Example 2: Multiple Knn with default undefined
const rank2 = Knn({ query: 'research papers', limit: 100 }).add(
  Knn({ query: 'academic publications', limit: 100, key: 'sparse_embedding' })
);
// Both Knn have default undefined (the default)
// Documents must appear in BOTH top-100 lists to be scored
// Documents in only one list are excluded

// Example 3: Mixed default values
const rank3 = Knn({ query: 'AI research', limit: 100 })
  .multiply(0.5)
  .add(
    Knn({
      query: 'scientific papers',
      limit: 50,
      default: 1000.0,
      key: 'sparse_embedding',
    }).multiply(0.5)
  );
// First Knn has default undefined, second has default 1000.0
// Documents in first top-100 but not in second top-50:
//   - Get first distance * 0.5 + 1000.0 * 0.5 (second's default)
// Documents in second top-50 but not in first top-100:
//   - Excluded (must appear in all Knn where default is undefined)
// Documents in both lists:
//   - Get first distance * 0.5 + second distance * 0.5

// Basic search on default embedding field
Knn({ query: 'What is machine learning?' });

// Search with custom parameters
Knn({
  query: 'What is machine learning?',
  key: '#embedding', // Field to search (default: "#embedding")
  limit: 100, // Max candidates to consider (default: 16)
  returnRank: false, // Return rank position vs distance (default: false)
});

// Search custom sparse embedding field in metadata
Knn({ query: 'machine learning', key: 'sparse_embedding' });
```

A full, simple example

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

const results1 = await collection.query({
  queryTexts: ['I like red apples'],
});

const firstResult = results1.documents[0];
```

An example of hybrid search using Rrf

```typescript
const embeddingFunction2 = new DefaultEmbeddingFunction();

const collection2 = await client.getOrCreateCollection({
  name: 'my_collection',
  embeddingFunction: embeddingFunction2,
});

// Dense semantic embeddings
const denseRank = Knn({
  query: 'machine learning research', // Text query for dense embeddings
  key: '#embedding', // Default embedding field
  returnRank: true,
  limit: 200, // Consider top 200 candidates
});

// Sparse keyword embeddings
const sparseRank = Knn({
  query: 'machine learning research', // Text query for sparse embeddings
  key: 'sparse_embedding', // Metadata field for sparse vectors
  returnRank: true,
  limit: 200,
});

// Combine with RRF
const hybridRank = Rrf({
  ranks: [denseRank, sparseRank],
  weights: [0.7, 0.3], // 70% semantic, 30% keyword
  k: 60,
});

// Use in search
const search = new Search()
  .where(K('status').eq('published')) // Optional filtering
  .rank(hybridRank)
  .limit(20)
  .select(K.DOCUMENT, K.SCORE, 'title');

const results = await collection.search(search);
```
