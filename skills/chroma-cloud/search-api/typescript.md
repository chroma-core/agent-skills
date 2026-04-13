---
name: Search() API
description: An expressive and flexible API for doing dense and sparse vector search on collections, as well as hybrid search
---

## Search() API

The Search API provides a fluent, composable interface for building complex queries. It's more expressive than the basic `query` method and supports advanced features like hybrid search with rank fusion.

**Note:** The Search API is only available on Chroma Cloud and is designed to work with Collection Schemas.

### When to use Search() vs query()

**Use `query()` when:**
- You need simple semantic search
- You're using local Chroma
- You want the most straightforward API

**Use `search()` when:**
- You need hybrid search combining dense and sparse indexes
- You want fine-grained control over ranking and filtering
- You're building complex queries with multiple conditions
- You need to select specific fields to return

Note that the Search() class uses a builder pattern, so if you call a method on it, it does not mutate that instance, it returns a copy with that mutation, so it needs re-assignging to the variable that is referencing it.

The `search()` method on a collection is able to take a single Search class instance or an arry of them, so rhe return value of the `search()` method on a collection is a SearchResult class, which has a `rows()` method, which will give you an array of array of results. So index 0 of the return value of `rows()` will be the array of the first Search class instance results.

### Setup

```typescript
import { CloudClient, type IncludeEnum, Rrf, K, Knn, Search } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});
```

### Filtering with Key (K)

The `Key` class (aliased as `K` for brevity) provides a fluent interface for building filter expressions. Think of it like a query builder for metadata, document content, and IDs.

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

### Ranking with Knn

`Knn` (k-nearest neighbors) is how you specify which embeddings to search and how to score results. Each `Knn` finds the nearest neighbors for a given query in a specific index.

The `limit` parameter controls how many candidates each `Knn` considers. A higher limit means more candidates are scored, which can improve recall but increases latency.

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

### Basic search example

Here's a complete example showing the typical flow: create a collection, add documents, and search.

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

### Hybrid search with Reciprocal Rank Fusion (RRF)

Hybrid search combines results from multiple indexes (typically dense + sparse) to get better results than either alone. RRF is a rank fusion algorithm that merges ranked lists without needing score normalization.

**How RRF works:**
1. Each `Knn` produces a ranked list of candidates
2. Documents are scored based on their rank position in each list: `1 / (k + rank)`
3. Scores are weighted and summed across all lists
4. Final results are sorted by combined score

The `k` parameter (default 60) controls how much weight top-ranked documents get relative to lower-ranked ones. Higher `k` values make rankings more uniform.

```typescript
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

### Building effective hybrid search

For best results with hybrid search:

1. **Use comparable limits** for each `Knn` so both indexes contribute meaningfully
2. **Weight based on your data**: keyword-heavy content might favor sparse; conceptual content might favor dense
3. **Start with 0.7/0.3 weighting** (dense/sparse) and adjust based on evaluation
4. **Use `returnRank: true`** when combining with RRF, as RRF operates on ranks, not distances

Note that return ranks from RRF are netagive and the value furthest from 0 is the closest to the original query.