---
name: Local Chroma
description: How to run and use local chroma
---

## Local Chroma

For python, chroma can be installed with pip or uv

```
pip install chromadb
uv install chromadb
```
To run chroma in python from a venv:

```
chroma run
```

For javascript, npm can be used

```
npm install chromadb
```

To run chroma from where it was installed:

```
npx chroma run
```

### Example

```typescript
// client with no args uses local chroma instance
const client = new ChromaClient();

const embeddingFunction = new DefaultEmbeddingFunction();

const collection = await client.getOrCreateCollection({
  name: 'my_collection',
  embeddingFunction,
});

await collection.add({
  ids: ['doc1', 'doc2'],
  documents: [
    'Apples are really good red fruit',
    'Red cars tend to get more speeding tickets',
  ],
});

const results = await collection.query({
  queryTexts: ['I like red apples'],
});

const firstResult = results.documents[0];
```
