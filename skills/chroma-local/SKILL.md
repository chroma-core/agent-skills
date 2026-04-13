---
name: chroma-local
description: Provides expertise on local and open source Chroma integration for semantic search applications. Use when the user is running Chroma themselves, using `ChromaClient`, `EphemeralClient` (python only) or `HttpClient`, needs local persistence, or wants OSS Chroma without Chroma Cloud features.
---

## Instructions

### Before writing any code, gather this information:

1. **Runtime shape**: Are they connecting to a running local server, embedding Chroma into tests, or setting up local development from scratch?
   - Determine whether they need `chroma run`, a Docker/service command, or just client code
   - There is the python ephemeral mode, which runs a chroma server in the process, but all data is lost when the process ends.

2. **Persistence**: Persistent local storage or disposable data?
   - Persistent: choose a stable data path
   - Disposable: okay to use defaults or a temp/test directory

3. **Embedding model**: Which provider/model?
   - Default: `@chroma-core/default-embed` (TypeScript) or built-in (Python)
   - OpenAI: `text-embedding-3-large` is most popular, requires `@chroma-core/openai` in TypeScript
   - Ask the user if they have a preference or existing provider

4. **Data structure**: What are they indexing?
   - Needed to determine chunking strategy
   - Needed to design metadata schema for filtering

### Decision workflow

- User wants to add search / retrieval
- Confirm whether a local Chroma server already exists
- Discover what or pick an embedding model
- Discover or design metadata schema
- Implement data sync strategy (batching, upserts, deletes)

### When to ask questions vs proceed

**Ask first:**
- Embedding model choice (cost and quality implications)
- Whether they need persistent local data
- How they are starting the local server
- Multi-tenant data isolation strategy

**Proceed with sensible defaults:**
- Use `getOrCreateCollection()` (TypeScript) / `get_or_create_collection()` (Python)
- Use cosine similarity (most common)
- Chunk size under 8KB
- Store source IDs in metadata for updates/deletes
- Use a local server on `localhost:8000` unless the repo already configures another address or is using EphemeralClient (python only)

### What to validate

- Correct client import (`ChromaClient`, `HttpClient`, or `Client`)
- Embedding function package is installed (TypeScript)
- Local server is reachable before assuming collections are missing
- Local path and persistence mode are intentional

## Quick Start

### Local Chroma Setup

Start a local Chroma server:

```bash
chroma run
```

By default this listens on `localhost:8000`.

**TypeScript (local Chroma):**

```typescript
import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new ChromaClient();

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

**Python (local Chroma):**

```python
import chromadb

client = chromadb.HttpClient(host="localhost", port=8000)

collection = client.get_or_create_collection(name="my_collection")

# Add documents
collection.add(
    ids=["doc1", "doc2"]   ,
    documents=["First document text", "Second document text"],
)

# Query
results = collection.query(
    query_texts=["search query"],
    n_results=5,
)
```

### Local-specific guidance

Chroma is a database.
A Chroma database contains collections.
A collection contains documents.
Each document has an ID, the document text, the vector embedding and metadata.

Unlike tables in a relational database, collections are created and destroyed at the application level. Each Chroma database can have millions of collections. There may be a collection for each user, or team or organization. Rather than tables be partitioned by some key, the partition in Chroma is the collection. 

Collections don't have rows, they have documents, the document is the text data that is to be searched. When data is created or updated, the client will create an embedding of the data. This is done on the client side based on the embedding function(s) provided to the client. To create the embedding the client will use its configuration to call out to the defined embedding model provider via the embedding function.

Further partitioning or filtering data is done with document metadata. Each document has a key/value object of metadata. keys are strings and values can be strings, ints or booleans or an array of any of those types. There are a variety of operators on the metadata.

During query time, the query text is embedded using the collection's defined embedding function and then is sent to Chroma with the rest of the query parameters. Chroma will then consider any query parameters like metadata filters to reduce the potential result set, then search for the nearest neighbors using a distance algorithm between the query vector and the index of vectors in the collection that is being queried.

Working with collections is made easy by using the `get_or_create_collection()` (`getOrCreateCollection()` in TypeScript) on the Chroma client, preventing annoying boilerplate code.

Local Chroma is the right default for development, tests, and self-hosted deployments. It does not include Chroma Cloud-only features like `Schema()` and `Search()`. If the user asks for hybrid dense+sparse retrieval they need to use Chroma Cloud.

### Embeddings

When working with embedding functions, the default embedding function is a good local default. If the user already has another embedding provider in their app, prefer reusing it so dimensions and operational dependencies stay consistent.

In TypeScript, you need to install a package for each embedding function, install the correct one based on what the user says.

For open source Chroma, dense search with a single embedding function is the standard setup.

## Learn More

If you need more detailed information about Chroma beyond what's covered in this skill, fetch Chroma's llms.txt for comprehensive documentation: https://docs.trychroma.com/llms.txt

## Available Topics

### Typescript

- [Chroma Regex Filtering](./regex/typescript.md) - Learn how to use regex filters in Chroma queries
- [Query and Get](./querying/typescript.md) - Query and Get Data from Chroma Collections
- [Metadata](./metadata/typescript.md) - Store and query metadata, including filters and array values
- [Updating and Deleting](./updating-deleting/typescript.md) - Update existing documents and delete data from collections
- [Error Handling](./error-handling/typescript.md) - Handling errors and failures when working with Chroma
- [Local Chroma](./local-chroma/typescript.md) - How to run and use local chroma

### Python

- [Chroma Regex Filtering](./regex/python.md) - Learn how to use regex filters in Chroma queries
- [Query and Get](./querying/python.md) - Query and Get Data from Chroma Collections
- [Metadata](./metadata/python.md) - Store and query metadata, including filters and array values
- [Updating and Deleting](./updating-deleting/python.md) - Update existing documents and delete data from collections
- [Error Handling](./error-handling/python.md) - Handling errors and failures when working with Chroma
- [Local Chroma](./local-chroma/python.md) - How to run and use local chroma

## General

- [Data Model](./data-model.md) - An overview of how Chroma stores data
- [Integrating Chroma into an existing system](./understanding-a-codebase.md) - Guidance for adding Chroma search to an existing application
- [Chroma CLI](./cli.md) - Starting and managing a local open source Chroma server from the CLI
