// @snippet:imports
import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new ChromaClient();
const embeddingFunction = new DefaultEmbeddingFunction();
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

const collection3 = await client.getOrCreateCollection({
  name: 'my_collection',
  embeddingFunction,
});

await collection3.delete({
  ids: ['doc1', 'doc2'],
});

await collection3.delete({
  ids: ['doc3'],
});

// @end

// @snippet:delete-by-filter

const collection4 = await client.getOrCreateCollection({
  name: 'my_collection',
  embeddingFunction,
});

await collection4.delete({
  where: { status: 'archived' },
});

await collection4.delete({
  where: { source_id: 'old-source-123' },
});

await collection4.delete({
  whereDocument: { $contains: 'DEPRECATED' },
});

await collection4.delete({
  ids: ['doc1', 'doc2', 'doc3', 'doc4'],
  where: { category: 'temp' },
});

// @end

// @snippet:sync-pattern

interface SourceRecord {
  id: string;
  content: string;
  updated_at: number;
  category: string;
}

async function syncToChroma(
  collectionName: string,
  records: SourceRecord[],
  deletedIds: string[]
) {
  const collection = await client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction,
  });

  if (records.length > 0) {
    const batchSize = 100;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      await collection.upsert({
        ids: batch.map((record) => `source-${record.id}`),
        documents: batch.map((record) => record.content),
        metadatas: batch.map((record) => ({
          source_id: record.id,
          updated_at: record.updated_at,
          category: record.category,
        })),
      });
    }
  }

  if (deletedIds.length > 0) {
    await collection.delete({
      ids: deletedIds.map((id) => `source-${id}`),
    });
  }

  return { synced: records.length, deleted: deletedIds.length };
}

const changedRecords: SourceRecord[] = [
  {
    id: '1',
    content: 'Article about TypeScript',
    updated_at: Date.now(),
    category: 'tech',
  },
  {
    id: '2',
    content: 'Guide to vector databases',
    updated_at: Date.now(),
    category: 'tech',
  },
];

const deletedRecordIds = ['old-1', 'old-2'];

await syncToChroma('articles', changedRecords, deletedRecordIds);

// @end
