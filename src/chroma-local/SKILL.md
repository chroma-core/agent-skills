---
name: chroma-local
description: Use when the user needs self-hosted or local Chroma for semantic search, including `ChromaClient`, `HttpClient`, or Python `EphemeralClient`, local persistence, Docker or `chroma run`, or OSS Chroma without Chroma Cloud features.
---

## Instructions

Determine these before writing code. Prefer discovering them from the repo and the user request. Ask only when the choice materially changes the implementation.

1. **Runtime shape**
   - Are they connecting to a running local server, embedding Chroma into tests, or setting up local development from scratch?
   - Decide whether they need `chroma run`, a Docker or service command, `HttpClient` or `ChromaClient`, or Python `EphemeralClient`.

2. **Persistence**
   - Persistent local data: choose an intentional data path.
   - Disposable test data: use defaults or a temp directory.

3. **Embedding model**
   - Reuse the app's existing embedding provider when possible.
   - Otherwise default to `@chroma-core/default-embed` in TypeScript or the standard local default in Python.
   - If the user explicitly wants OpenAI embeddings in TypeScript, install and use `@chroma-core/openai`.

4. **Indexed data shape**
   - Determine what is being indexed, how it should be chunked, and what metadata is needed for filtering and updates.

## Routing

- **Existing local server**
  - Confirm host and port before changing client code.
  - Validate the server is reachable before assuming collections are missing.

- **Fresh local development**
  - Add a local startup path such as `chroma run` or the repo's existing Docker or service command.
  - Default to `localhost:8000` unless the repo already uses another address.

- **Python tests or disposable local workflows**
  - Prefer `EphemeralClient` when persistence is unnecessary.
  - Call out that data is lost when the process exits.

- **Persistent local development**
  - Use a stable data path and make persistence explicit in code or config.
  - Do not silently switch between ephemeral and persistent modes.

- **Search integration work**
  - Use `getOrCreateCollection()` in TypeScript or `get_or_create_collection()` in Python.
  - Design document IDs and metadata so upserts and deletes are straightforward.
  - Batch writes when syncing large datasets.

## Ask vs proceed

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
- Use a local server on `localhost:8000` unless the repo already configures another address or is using Python `EphemeralClient`

## What to validate

- Correct client import (`ChromaClient`, `HttpClient`, or `Client`)
- Embedding function package is installed (TypeScript)
- Local server is reachable before assuming collections are missing
- Local path and persistence mode are intentional

## Implementation notes

- Local Chroma is the right default for development, tests, and self-hosted deployments.
- OSS Chroma does not include Chroma Cloud-only features such as `Schema()` and `Search()`.
- If the user asks for hybrid dense and sparse retrieval, treat that as a likely Chroma Cloud requirement unless the repo already implements an OSS workaround.
- For open source Chroma, dense retrieval with a single embedding function is the normal baseline.

## Minimal patterns

Start a local Chroma server when the repo needs one:

```bash
chroma run
```

Default address: `localhost:8000`.

TypeScript local client:

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

Python local client:

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

## Learn More

Fetch Chroma's `llms.txt` only when you need API or product details that are not already in the repo or this skill: https://docs.trychroma.com/llms.txt
