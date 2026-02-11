---
name: Error Handling
description: Handling errors and failures when working with Chroma
---

## Error Handling

Chroma operations can fail for various reasons: connection issues, missing resources, invalid data, or quota limits. This guide covers common error scenarios and how to handle them.

```typescript
import { ChromaClient, CloudClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';
```

### Error types

**Python** uses specific exception classes:
- `chromadb.errors.NotFoundError` - Collection, tenant, or database doesn't exist
- `ValueError` - Invalid collection name or duplicate creation attempt

**TypeScript** throws standard `Error` objects with descriptive messages. Check the error message to determine the cause.

### Connection errors

Connection failures occur when the client can't reach the Chroma server. This is common during startup or when network issues occur.

```typescript
async function connectWithRetry(maxRetries = 3): Promise<ChromaClient> {
  const client = new ChromaClient();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // heartbeat() verifies the connection is working
      await client.heartbeat();
      return client;
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to connect to Chroma after ${maxRetries} attempts: ${error}`
        );
      }
      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}
```

### Collection not found

When working with collections that may not exist, handle the `NotFoundError` (Python) or catch the error and check its message (TypeScript).

```typescript
const client = new ChromaClient();
const embeddingFunction = new DefaultEmbeddingFunction();

// getCollection throws if the collection doesn't exist
try {
  const collection = await client.getCollection({
    name: 'my_collection',
    embeddingFunction,
  });
} catch (error) {
  if (error instanceof Error && error.message.includes('does not exist')) {
    console.log('Collection not found, creating it...');
    // Handle missing collection
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

### Safe collection access pattern

The `getOrCreateCollection` method is the recommended way to avoid "not found" errors entirely. Use `getCollection` only when you specifically need to verify a collection exists.

```typescript
const client2 = new ChromaClient();
const embeddingFunction2 = new DefaultEmbeddingFunction();

// Preferred: getOrCreateCollection never throws "not found"
const collection = await client2.getOrCreateCollection({
  name: 'my_collection',
  embeddingFunction: embeddingFunction2,
});

// Check if results exist before accessing
const results = await collection.query({
  queryTexts: ['search query'],
  nResults: 5,
});

if (results.documents[0] && results.documents[0].length > 0) {
  const firstDoc = results.documents[0][0];
  // Safe to use firstDoc
} else {
  // No results found
}
```

### Validation errors

Chroma validates data before operations. Common validation failures include:
- Document content exceeding 16KB
- Embedding dimensions not matching the collection
- Metadata exceeding limits (4KB total, 32 keys max)
- Invalid collection names

```typescript
const client3 = new ChromaClient();
const embeddingFunction3 = new DefaultEmbeddingFunction();

// Validate document size before adding (16KB limit, recommend < 8KB)
function validateDocument(doc: string): boolean {
  const byteSize = new TextEncoder().encode(doc).length;
  return byteSize <= 16384;
}

// Validate metadata size (4KB limit, 32 keys max)
function validateMetadata(
  metadata: Record<string, string | number | boolean>
): boolean {
  const keys = Object.keys(metadata);
  if (keys.length > 32) return false;

  const jsonSize = new TextEncoder().encode(JSON.stringify(metadata)).length;
  return jsonSize <= 4096;
}

async function safeAdd(
  collectionName: string,
  ids: string[],
  documents: string[],
  metadatas?: Record<string, string | number | boolean>[]
) {
  // Pre-validate
  for (const doc of documents) {
    if (!validateDocument(doc)) {
      throw new Error(`Document exceeds 16KB limit`);
    }
  }

  if (metadatas) {
    for (const meta of metadatas) {
      if (!validateMetadata(meta)) {
        throw new Error(`Metadata exceeds limits (4KB or 32 keys)`);
      }
    }
  }

  const collection = await client3.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: embeddingFunction3,
  });

  try {
    await collection.add({ ids, documents, metadatas });
  } catch (error) {
    // Handle specific validation errors from server
    if (error instanceof Error) {
      if (error.message.includes('dimension')) {
        throw new Error('Embedding dimensions do not match collection');
      }
      if (error.message.includes('duplicate')) {
        throw new Error('Duplicate IDs in batch');
      }
    }
    throw error;
  }
}
```

### Batch operation failures

When adding or upserting multiple documents, a single invalid document fails the entire batch. Validate data before sending, or implement retry logic for partial failures.

```typescript
const client4 = new ChromaClient();
const embeddingFunction4 = new DefaultEmbeddingFunction();

// Process documents in batches to avoid memory issues and partial failures
async function batchAdd(
  collectionName: string,
  ids: string[],
  documents: string[],
  batchSize = 100
) {
  const collection = await client4.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: embeddingFunction4,
  });

  const failures: { index: number; error: string }[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    const batchDocs = documents.slice(i, i + batchSize);

    try {
      await collection.add({
        ids: batchIds,
        documents: batchDocs,
      });
    } catch (error) {
      // Log failure but continue with other batches
      failures.push({
        index: i,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (failures.length > 0) {
    console.error(`${failures.length} batches failed:`, failures);
  }

  return { totalBatches: Math.ceil(ids.length / batchSize), failures };
}
```

### Cloud-specific errors

Chroma Cloud has additional failure modes:
- **Authentication errors** - Invalid or expired API key
- **Quota exceeded** - Rate limits or storage limits reached
- **Tenant/database not found** - Incorrect configuration

```typescript
// Verify environment variables before creating client
function getCloudConfig() {
  const apiKey = process.env.CHROMA_API_KEY;
  const tenant = process.env.CHROMA_TENANT;
  const database = process.env.CHROMA_DATABASE;

  const missing: string[] = [];
  if (!apiKey) missing.push('CHROMA_API_KEY');
  if (!tenant) missing.push('CHROMA_TENANT');
  if (!database) missing.push('CHROMA_DATABASE');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  return { apiKey, tenant, database };
}

async function createCloudClient() {
  const config = getCloudConfig();

  const client = new CloudClient({
    apiKey: config.apiKey,
    tenant: config.tenant,
    database: config.database,
  });

  try {
    // Verify connection and authentication
    await client.heartbeat();
    return client;
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('401') ||
        error.message.includes('Unauthorized')
      ) {
        throw new Error('Invalid or expired API key');
      }
      if (
        error.message.includes('404') ||
        error.message.includes('not found')
      ) {
        throw new Error('Tenant or database not found - check configuration');
      }
      if (error.message.includes('429') || error.message.includes('rate')) {
        throw new Error('Rate limit exceeded - implement backoff');
      }
    }
    throw error;
  }
}
```

### Defensive patterns summary

| Scenario | Recommended approach |
|----------|---------------------|
| Collection access | Use `getOrCreateCollection` instead of `getCollection` |
| Missing data | Check results length before accessing |
| Connection issues | Implement retry with exponential backoff |
| Large batches | Validate data size before operations |
| Cloud auth | Verify environment variables are set |
