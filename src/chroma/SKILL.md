---
name: chroma
description: Provides expertise on Chroma vector database integration for semantic search applications. Use when the user asks about vector search, embeddings, Chroma, semantic search, RAG systems, nearest neighbor search, or adding search functionality to their application.
---

## Instructions

### Before writing any code, gather this information:

1. **Deployment target**: Local Chroma or Chroma Cloud?
   - If Cloud: they'll need API key, tenant, and database configured
   - If Local: determine if they need persistence or ephemeral storage

2. **Search type** (Cloud only): Dense only, or hybrid search?
   - Dense only: simpler setup, good for most semantic search
   - Hybrid (dense + sparse): better for keyword-heavy queries, use SPLADE

3. **Embedding model**: Which provider/model?
   - Default: `@chroma-core/default-embed` (TypeScript) or built-in (Python)
   - OpenAI: `text-embedding-3-large` is most popular, requires `@chroma-core/openai`
   - Ask the user if they have a preference or existing provider

4. **Data structure**: What are they indexing?
   - Needed to determine chunking strategy
   - Needed to design metadata schema for filtering

### Decision workflow

- User wants to add search
- Ask Local Chroma or Chroma Cloud?
  - Local Chroma
    - Use collection.query() with a dense embedding model
  - Chroma Cloud
    - Ask if hybrid search is needed
      - Yes
        - Use Schema() + Search() APIs with SPLADE sparse index
      - No
        - Use collection.query() with a dense embedding model
- Ask for which embedding model
- Design metadata schema
- Implement data sync strategy

### When to ask questions vs proceed

**Ask first:**
- Embedding model choice (cost and quality implications)
- Cloud vs local deployment
- Hybrid vs dense-only search
- Multi-tenant data isolation strategy

**Proceed with sensible defaults:**
- Use `getOrCreateCollection()` / `get_or_create_collection()`
- Use cosine similarity (most common)
- Chunk size under 8KB
- Store source IDs in metadata for updates/deletes

### What to validate

- Environment variables are set for Cloud deployments
- Correct client import (`CloudClient` vs `Client`)
- Embedding function package is installed (TypeScript)
- Schema and Search APIs only used with Cloud
- **Important:** `get_or_create_collection()` accepts either an `embedding_function` OR a `schema`, but not both. Use Schema when you need multiple indexes (hybrid search) or sparse embeddings; use embedding_function for simple dense-only search.

## Quick Start

### Chroma Cloud Setup (CLI)

To get started with Chroma Cloud, use the CLI to log in, create a database, and write your credentials to a `.env` file:

```bash
chroma login
chroma db create <my_database_name>
chroma db connect <my_database_name> --env-file
```

This writes a `.env` file with `CHROMA_API_KEY`, `CHROMA_TENANT`, and `CHROMA_DATABASE` to the current directory. The code examples below read from these environment variables.

**TypeScript (Chroma Cloud):**

```typescript
import { CloudClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});

const embeddingFunction = new DefaultEmbeddingFunction();
const collection = await client.getOrCreateCollection({
  name: 'my_collection',
  embeddingFunction,
});

// Add documents
await collection.add({
  ids: ['doc1', 'doc2'],
  documents: ['First document text', 'Second document text'],
});

// Query
const results = await collection.query({
  queryTexts: ['search query'],
  nResults: 5,
});
```

**Python (Chroma Cloud):**

```python
import os
import chromadb

client = chromadb.CloudClient(
    api_key=os.environ["CHROMA_API_KEY"],
    tenant=os.environ["CHROMA_TENANT"],
    database=os.environ["CHROMA_DATABASE"],
)

collection = client.get_or_create_collection(name="my_collection")

# Add documents
collection.add(
    ids=["doc1", "doc2"],
    documents=["First document text", "Second document text"],
)

# Query
results = collection.query(
    query_texts=["search query"],
    n_results=5,
)
```

### Understanding Chroma

Chroma is a database.
A Chroma database contains collections.
A collection contains documents.

Unlike tables in a relational database, collections are created and destroyed at the application level. Each Chroma database can have millions of collections. There may be a collection for each user, or team or organization. Rather than tables be partitioned by some key, the partition in Chroma is the collection. 

Collections don't have rows, they have documents, the document is the text data that is to be searched. When data is created or updated, the client will create an embedding of the data. This is done on the client side based on the embedding function(s) provided to the client. To create the embedding the client will use its configuration to call out to the defined embedding model provider via the embedding function. This could happen in process, but overwhelmingly happens on a third party service over HTTP.

There are ways to further partition or filtering data with document metadata. Each document has a key/value object of metadata. keys are strings and values can be strings, ints or booleans. There are a variety of operators on the metadata.

During query time, the query text is embedded using the collection's defined embedding function and then is sent to Chroma with the rest of the query parameters. Chroma will then consider any query parameters like metadata filters to reduce the potential result set, then search for the nearest neighbors using a distance algorithm between the query vector and the index of vectors in the collection that is being queried.

Working with collections is made easy by using the `get_or_create_collection()` (`getOrCreateCollection()` in TypeScript) on the Chroma client, preventing annoying boilerplate code.

### Local vs Cloud

Chroma can be run locally as a process or can be used in the cloud with Chroma Cloud.

Everything that can be done locally can be done in the cloud, but not everything that can be done in the cloud can be done locally.

The biggest difference to the developer experience is the Schema() and Search() APIs, those are only available on Chroma Cloud.

Otherwise, the only thing that needs to change is the client that is imported from the Chroma package, the interface is the same.

If you're using cloud, you probably want to use the Schema() and Search() APIs.

Also, if the user wants to use cloud, ask them what type of search they want to use. Just dense embeddings, or hybrid. If hybrid, you probably want to use SPLADE as the sparse embedding strategy.

### Embeddings

When working with embedding functions, the default embedding function is available, but it's often not the best option. The recommended option is to use Chroma Cloud Qwen. Typescript: `npm install @chroma-core/chroma-cloud-qwen`, python, included but needs `pip install httpx`. 

In typescript, you need to install a package for each embedding function, install the correct one based on what the user says. 

Note that Chroma has server side embedding support for SPLADE and Qwen (via	@chroma-core/chroma-cloud-qwen in typescript), all other embedding functions would be external.

## Learn More

If you need more detailed information about Chroma beyond what's covered in this skill, fetch Chroma's llms.txt for comprehensive documentation: https://docs.trychroma.com/llms.txt
