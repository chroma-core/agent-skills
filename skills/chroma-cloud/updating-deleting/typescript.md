---
name: Updating and Deleting
description: Update existing documents and delete data from collections
---

## Updating and Deleting

Chroma provides `update`, `upsert`, and `delete` methods for modifying data after initial insertion. Understanding when to use each is important for building reliable data sync pipelines.

### Method overview

| Method | Behavior | Use when |
|--------|----------|----------|
| `update` | Modifies existing documents, fails if ID doesn't exist | You know the document exists |
| `upsert` | Updates if exists, inserts if not | Syncing from external data source |
| `delete` | Removes documents by ID or filter | Removing stale or unwanted data |

### Imports

```typescript
import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new ChromaClient();
const embeddingFunction = new DefaultEmbeddingFunction();
```

## Update

Update modifies existing documents. If an ID doesn't exist, the operation fails silently for that ID (no error thrown, but nothing is updated).

**Important:** When you update a document's text, Chroma re-computes the embedding automatically using the collection's embedding function.

```typescript
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
```

## Upsert

Upsert is the preferred method for syncing data from an external source. It inserts new documents and updates existing ones in a single operation.

**When to use upsert vs update:**
- Use `upsert` when syncing from a primary database (you don't know which records are new)
- Use `update` when you're certain the document already exists

```typescript
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
```

## Delete by ID

The simplest way to delete documents is by their IDs.

```typescript
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
```

## Delete by filter

Delete documents matching metadata or content filters without knowing specific IDs. Useful for bulk cleanup operations.

```typescript
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
```

## Syncing from an external data source

A common pattern is keeping Chroma in sync with a primary database. This example shows how to handle creates, updates, and deletes.

```typescript
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
```

### Sync strategy tips

**Track source IDs:** Always store the primary database ID in metadata so you can find and update documents later.

**Batch operations:** Process updates in batches of 100-500 to balance throughput and memory usage.

**Handle deletes:** When records are deleted from your primary database, delete them from Chroma too. Use metadata filters if you track `source_id`.

**Idempotent syncs:** Use `upsert` so re-running a sync doesn't create duplicates.
