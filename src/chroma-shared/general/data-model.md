---
name: Data Model
description: An overview of how Chroma stores data
---

## Data Model

Understanding how Chroma stores data helps you design effective search systems.

### Core concepts

**Collections** are the top-level containers, similar to tables in a relational database. Each collection has its own embedding configuration and indexes.

**Documents** are the searchable units within a collection. Each document has:
- **ID** - A unique string identifier (up to 128 bytes)
- **Content** - The text that gets embedded and searched (max 16KB, recommended under 8KB)
- **Embedding** - The vector representation (max 4096 dimensions; common sizes are 384, 768, 1536, or 3072)
- **Metadata** - Key-value pairs for filtering (max 4KB total, up to 32 keys with 36-byte key names)

### Limits

#### Document limits (add/upsert)

| Property | Limit | Notes |
|----------|-------|-------|
| ID | 128 bytes | |
| Content | 16,384 bytes | Recommend < 8,000 |
| Embedding dimensions | 4,096 | Most models: 384, 768, 1536, or 3072 |
| Metadata size | 4,096 bytes | |
| Metadata keys | 32 max | Key names up to 36 bytes |
| URI | 256 bytes | Rarely used |

#### Query / Get / Delete limits

| Property | Limit |
|----------|-------|
| ID | 128 bytes |
| Results returned (query) | 300 max |
| Where predicates | 8 max |
| Where size | 4,096 bytes |
| Where document predicates | 8 max |
| Where document size | 130 bytes |

#### Collection metadata limits

Collection-level metadata has stricter limits than document metadata:

| Property | Limit |
|----------|-------|
| Metadata size | 256 bytes |
| Metadata keys | 16 max |
| Key size | 36 bytes |

Chroma Cloud users can request quota increases through the dashboard.

## Chunking

Most real-world data is too large to fit in a single document. Chunking splits content into searchable pieces.

### Chunking strategy

**Recommended chunk size:** Under 8,000 bytes. This balances search precision with context.

**Good chunking preserves meaning:**
- Split at natural boundaries (paragraphs, sentences, sections)
- Don't cut mid-sentence or mid-word
- Include enough context for the chunk to be meaningful on its own

**Ask the user:**
- What type of content are they indexing?
- Are there natural boundaries (chapters, sections, records)?
- How much context does a search result need to be useful?

**Chonkie** is a popular chunking library available for both Python and TypeScript.

### Tracking chunks with metadata

When a single source document becomes multiple chunks, use metadata to track the relationship:

```
{
  "source_id": "post-123",      // ID in the primary database
  "source_type": "blog_post",   // Type of content
  "chunk_index": 0,             // Position in sequence
  "total_chunks": 3             // Total chunks from this source
}
```

This approach is better than encoding information in the document ID because:
- IDs can be simple UUIDs
- Metadata is filterable
- Updates and deletes are easier (filter by `source_id`)

## Collection organization

### One collection per tenant

For multi-tenant applications, create separate collections per tenant (customer, team, user) rather than one large collection with tenant metadata.

**Why this works better:**
- Nearest neighbor search is more accurate with fewer candidates
- Lower latency with smaller collections
- Natural isolation between tenants
- Easy to delete all tenant data by dropping the collection

**Example:** A knowledge base SaaS might have collections like `kb_customer_123`, `kb_customer_456`, etc.

**Ask the user:** What's the smallest logical unit of data isolation in their application?

## Filtering

Metadata filtering reduces the candidate set before vector search runs, making queries faster and more precise.

### Filter operators

| Operator | Description | Types |
|----------|-------------|-------|
| `$eq` | Equal (default) | string, int, bool |
| `$ne` | Not equal | string, int, bool |
| `$gt`, `$gte` | Greater than (or equal) | int |
| `$lt`, `$lte` | Less than (or equal) | int |
| `$in` | In list | string, int |
| `$nin` | Not in list | string, int |
| `$and`, `$or` | Logical combinators | filter arrays |

### Document content filtering

Beyond metadata, you can filter on the document text itself using `where_document`:
- `$contains` - Full-text substring search
- `$regex` - Regular expression matching

## Dense vs sparse vectors

**Dense vectors** (default) are produced by neural embedding models. They capture semantic meaning, so "car" and "automobile" will be similar.

**Sparse vectors** (BM25, SPLADE) are high-dimensional but mostly zeros. They excel at exact keyword matching.

**Hybrid search** combines both, often outperforming either alone. Chroma Cloud supports hybrid search through the Schema and Search APIs.

### Important note

When creating collections, `get_or_create_collection()` accepts either an `embedding_function` OR a `schema`, but not both. Use Schema when you need multiple indexes or sparse embeddings. 