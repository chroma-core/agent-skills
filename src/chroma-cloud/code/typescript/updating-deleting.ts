// @snippet:imports
import { CloudClient } from 'chromadb';
import {
  ChromaCloudQwenEmbeddingFunction,
  ChromaCloudQwenEmbeddingModel,
} from '@chroma-core/chroma-cloud-qwen';

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});
const embeddingFunction = new ChromaCloudQwenEmbeddingFunction({
  model: ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
  task: null,
  apiKeyEnvVar: 'CHROMA_API_KEY',
});
// @end

// @snippet:update
const collection = await client.getOrCreateCollection({
  name: 'my_collection',
  embeddingFunction,
});

await collection.add({
  ids: ['doc1', 'doc2'],
  documents: ['Original text for doc1', 'Original text for doc2'],
  metadatas: [{ category: 'draft' }, { category: 'draft' }],
});

await collection.update({
  ids: ['doc1'],
  documents: ['Updated text for doc1'],
});

await collection.update({
  ids: ['doc1', 'doc2'],
  metadatas: [{ category: 'published' }, { category: 'published' }],
});

await collection.update({
  ids: ['doc2'],
  documents: ['Completely revised doc2 content'],
  metadatas: [{ category: 'published', revision: 2 }],
});
// @end

// @snippet:upsert
const collection2 = await client.getOrCreateCollection({
  name: 'articles',
  embeddingFunction,
});

await collection2.upsert({
  ids: ['article-123', 'article-456', 'article-789'],
  documents: [
    'Content of article 123',
    'Content of article 456',
    'Content of article 789',
  ],
  metadatas: [
    { source_id: '123', updated_at: Date.now() },
    { source_id: '456', updated_at: Date.now() },
    { source_id: '789', updated_at: Date.now() },
  ],
});

await collection2.upsert({
  ids: ['article-123', 'article-456'],
  documents: [
    'Updated content of article 123',
    'Updated content of article 456',
  ],
  metadatas: [
    { source_id: '123', updated_at: Date.now() },
    { source_id: '456', updated_at: Date.now() },
  ],
});
// @end

// @snippet:delete-by-id
await collection2.delete({
  ids: ['article-789', 'article-456'],
});
// @end

// @snippet:delete-by-filter
await collection2.delete({
  where: { source_id: '123' },
});
// @end

// @snippet:sync-pattern
type SourceRecord = {
  id: string;
  content: string;
  deleted: boolean;
  updatedAt: number;
};

async function syncRecords(records: SourceRecord[]) {
  const activeRecords = records.filter((record) => !record.deleted);
  const deletedIds = records
    .filter((record) => record.deleted)
    .map((record) => record.id);

  if (activeRecords.length > 0) {
    await collection2.upsert({
      ids: activeRecords.map((record) => record.id),
      documents: activeRecords.map((record) => record.content),
      metadatas: activeRecords.map((record) => ({
        source_id: record.id,
        updated_at: record.updatedAt,
      })),
    });
  }

  if (deletedIds.length > 0) {
    await collection2.delete({
      ids: deletedIds,
    });
  }
}
// @end
