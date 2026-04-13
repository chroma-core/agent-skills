---
name: Chroma Cloud Qwen
description: Chroma's hosted Qwen embedding service
---

## Chroma Cloud Qwen

Embed documents using Qwen 3.

### Example

```typescript
// npm install @chroma-core/chroma-cloud-qwen
import {
  ChromaCloudQwenEmbeddingFunction,
  ChromaCloudQwenEmbeddingModel,
} from '@chroma-core/chroma-cloud-qwen';
import { CloudClient } from 'chromadb';

const embeddingFunction = new ChromaCloudQwenEmbeddingFunction({
  apiKeyEnvVar: 'CHROMA_API_KEY', // Or set CHROMA_API_KEY env var
  model: ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
  task: 'nl_to_code',
});

const client = new CloudClient({});

// pass documents to query for .add and .query
const collection = await client.createCollection({
  name: 'name',
  embeddingFunction: embeddingFunction,
});
```
