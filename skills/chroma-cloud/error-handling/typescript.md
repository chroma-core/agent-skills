---
name: Error Handling
description: Handling errors and failures when working with Chroma
---

## Error Handling

Chroma Cloud operations can fail for various reasons: authentication problems, missing Cloud resources, invalid data, or quota limits. This guide covers common error scenarios and how to handle them.

```typescript
import { CloudClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';
```

### Error types

**Python** uses specific exception classes:
- `chromadb.errors.NotFoundError` - Collection, tenant, or database doesn't exist
- `ValueError` - Invalid collection name or duplicate creation attempt

**TypeScript** throws standard `Error` objects with descriptive messages. Check the error message to determine the cause.

### Connection errors

Connection failures occur when the client can't reach Chroma Cloud or when network/auth configuration is wrong.

```typescript
async function connectWithRetry(maxRetries = 3): Promise<CloudClient> {
  const config = getCloudConfig();
  const client = new CloudClient(config);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.heartbeat();
      return client;
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to connect to Chroma Cloud after ${maxRetries} attempts: ${error}`
        );
      }

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
const config = getCloudConfig();
const client = new CloudClient(config);
const embeddingFunction = new DefaultEmbeddingFunction();

try {
  await client.getCollection({
    name: 'my_collection',
    embeddingFunction,
  });
} catch (error) {
  if (error instanceof Error && error.message.includes('does not exist')) {
    console.log('Collection not found, creating it...');
    await client.getOrCreateCollection({
      name: 'my_collection',
      embeddingFunction,
    });
  } else {
    throw error;
  }
}
```

### Safe collection access pattern

The `getOrCreateCollection` method is the recommended way to avoid "not found" errors entirely. Use `getCollection` only when you specifically need to verify a collection exists.

```typescript
const config2 = getCloudConfig();
const client2 = new CloudClient(config2);
const embeddingFunction2 = new DefaultEmbeddingFunction();

const collection = await client2.getOrCreateCollection({
  name: 'my_collection',
  embeddingFunction: embeddingFunction2,
});

const results = await collection.query({
  queryTexts: ['search query'],
  nResults: 5,
});

if (results.documents[0] && results.documents[0].length > 0) {
  const firstDoc = results.documents[0][0];
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
const config3 = getCloudConfig();
const client3 = new CloudClient(config3);
const embeddingFunction3 = new DefaultEmbeddingFunction();

function validateDocument(doc: string): boolean {
  const byteSize = new TextEncoder().encode(doc).length;
  return byteSize <= 16384;
}

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
  for (const doc of documents) {
    if (!validateDocument(doc)) {
      throw new Error('Document exceeds 16KB limit');
    }
  }

  if (metadatas) {
    for (const meta of metadatas) {
      if (!validateMetadata(meta)) {
        throw new Error('Metadata exceeds limits (4KB or 32 keys)');
      }
    }
  }

  const collection = await client3.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: embeddingFunction3,
  });

  await collection.add({ ids, documents, metadatas });
}
```

### Batch operation failures

When adding or upserting multiple documents, a single invalid document fails the entire batch. Validate data before sending, or implement retry logic for partial failures.

```typescript
const config4 = getCloudConfig();
const client4 = new CloudClient(config4);
const embeddingFunction4 = new DefaultEmbeddingFunction();

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
      failures.push({
        index: i,
        error: error instanceof Error ? error.message : String(error),
      });
    }
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
async function createCloudClient() {
  const config = getCloudConfig();
  const client = new CloudClient(config);

  try {
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
