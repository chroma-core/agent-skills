---
name: Collection Forking
description: Instantly duplicate collections using copy-on-write forking in Chroma Cloud
---

## Collection Forking

Chroma Cloud supports forking collections. Forking creates a new collection from an existing one instantly using copy-on-write. The forked collection shares data blocks with the source until modifications are made, so it completes instantly regardless of collection size.

**Key properties:**
- **Instant**: Forking completes immediately, no matter how large the source collection
- **Isolated**: Changes to a fork do not affect the source, and vice versa
- **Efficient**: Only new modifications allocate separate storage; shared data is not duplicated
- **Cloud only**: The storage engine on single-node Chroma does not support forking

### Imports and boilerplate

```typescript
import { CloudClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});
const embeddingFunction = new DefaultEmbeddingFunction();
```

### Forking a collection

Call `.fork()` on an existing collection to create a copy with a new name.

```typescript
const sourceCollection = await client.getCollection({
  name: 'main-repo-index',
  embeddingFunction,
});

const forkedCollection = await sourceCollection.fork({
  name: 'main-repo-index-pr-1234',
});
```

### Adding data to a fork

After forking, the new collection is fully independent. You can add, update, or delete records without affecting the source.

```typescript
await forkedCollection.add({
  ids: ['doc-pr-1', 'doc-pr-2'],
  documents: [
    'New API endpoint for user preferences',
    'Updated authentication flow with OAuth2',
  ],
});
```

### Querying a fork

Forked collections are queried the same way as any other collection. The fork contains all data from the source at the time of forking, plus any changes made after.

```typescript
// Query the fork — includes source data plus any new additions
const results = await forkedCollection.query({
  queryTexts: ['authentication changes'],
  nResults: 5,
});
```

### Limits and costs

- Maximum of 256 fork edges per tree. Exceeding this triggers a `NUM_FORKS` quota error. To recover, create a fresh collection and copy the data.
- Fork operation costs $0.03 per call.
- Storage is only charged for incremental changes; shared data between source and fork is free.

### Common use cases

- **Branch-based indexing:** Fork a collection per git branch or PR to test index changes in isolation, then discard the fork when done.
- **Data snapshots:** Create point-in-time copies before running bulk updates or migrations.
- **A/B testing:** Fork a collection, modify one copy with different embeddings or metadata strategies, and compare query results.
- **Safe experimentation:** Try out changes to a collection without risk to the production data.
