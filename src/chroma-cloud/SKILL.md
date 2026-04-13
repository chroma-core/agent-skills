---
name: chroma-cloud
description: Provides expertise on Chroma Cloud integration for semantic search and hybrid search applications. Use when the user is working with Chroma Cloud, CloudClient, managed collections, Schema(), Search(), hybrid search, or Chroma Cloud CLI workflows.
---

## Instructions

### Intake

Do not block on a long questionnaire. Ask only for details that are missing and required to choose the right path:

- Dense only or hybrid search
- Whether `CHROMA_API_KEY`, `CHROMA_TENANT`, and `CHROMA_DATABASE` are already configured
- Existing embedding choice, if any

If the user has no embedding preference, default to Chroma Cloud Qwen. If hybrid search is required, use `Schema()` and `Search()`. If the task is narrow, such as fixing an existing query, reviewing code, or answering an API question, proceed with the repo context instead of forcing intake.

### What to validate

- Correct client import (`CloudClient` vs `Client`)
- Environment variables are set for Cloud deployments
- Embedding function package is installed when the selected TypeScript embedding requires one
- `Schema()` and `Search()` are only used for Cloud workflows
- **Important:** `get_or_create_collection()` accepts either an `embedding_function` OR a `schema`, but not both. Use `schema` when you need multiple indexes, hybrid search, or sparse embeddings; use `embedding_function` for simple dense-only search.

## Quick Start

Use the CLI topic to authenticate and write Cloud credentials:

```bash
chroma login
chroma db create <db_name>
chroma db connect <db_name> --env-file
```

Then create a `CloudClient` and choose the API based on the search mode:

```typescript
import { CloudClient } from 'chromadb';

const client = new CloudClient();
const collection = await client.getOrCreateCollection({ name: 'my_collection' });
```

Use `collection.query()` for dense-only search. Use `Schema()` plus `Search()` only when the user needs hybrid retrieval, multiple indexes, or more expressive ranking/query composition.

## Cloud Guidance

Collections are the main isolation boundary in Chroma Cloud, and metadata is the main filtering mechanism inside a collection. Reach for `Schema()` only when you need explicit dense+sparse or multi-index configuration, and reach for `Search()` only when `query()` is not expressive enough.

## Learn More

If you need more detailed information about Chroma beyond what's covered in this skill, fetch Chroma's llms.txt for comprehensive documentation: https://docs.trychroma.com/llms.txt
