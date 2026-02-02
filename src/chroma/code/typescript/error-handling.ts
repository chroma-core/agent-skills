import { ChromaClient, CloudClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

// @snippet:connection-errors

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

// @end

// @snippet:collection-not-found

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

// @end

// @snippet:safe-collection-access

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

// @end

// @snippet:validation-errors

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

// @end

// @snippet:batch-operations

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

// @end

// @snippet:cloud-errors

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

// @end
