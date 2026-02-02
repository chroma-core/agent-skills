---
name: Integrating Chroma into an existing system
description: Guidance for adding Chroma search to an existing application
---

## Integrating Chroma into an existing system

Adding search to an existing application requires understanding the data flow and planning both the initial import and ongoing synchronization. This guide helps identify the key questions to answer.

### Key questions to ask the user

Before writing any code, clarify:

1. **What data should be searchable?** (documents, products, messages, etc.)
2. **Where does that data currently live?** (database, S3, API, files)
3. **How is the data structured?** (helps determine chunking strategy)
4. **How often does the data change?** (informs sync strategy)
5. **What latency is acceptable for updates to appear in search?**

## Initial data import (offline ingest)

The first step is getting existing data into Chroma. This typically involves:

1. **Reading from the source** - database queries, S3 listing, API pagination
2. **Chunking** - breaking large documents into searchable pieces (see data-model.md)
3. **Embedding** - converting text chunks to vectors
4. **Writing to Chroma** - batching for efficiency

Build this as a reusable pipeline, not a one-off script. The same chunking and embedding logic will be needed for ongoing updates.

**Progress tracking:** For large imports, track which records have been processed. This allows resuming after failures and re-running for updates. A simple approach is storing the last processed ID or timestamp.

## Keeping data in sync (online writes)

After the initial import, new and updated data must flow to Chroma. There are two main patterns:

### Asynchronous (recommended)

Use a message queue (SQS, RabbitMQ, Redis streams, etc.) to decouple the primary write path from Chroma updates:

1. Application writes to primary database
2. Application publishes an event with the record ID
3. Queue consumer fetches the record, chunks, embeds, and writes to Chroma

**Benefits:** Primary writes aren't slowed by embedding latency. Retries are handled by the queue. Search updates can lag slightly without affecting the main application.

### Synchronous

If no queue infrastructure exists and slight latency is acceptable, update Chroma in the same request:

1. Application writes to primary database
2. Application chunks, embeds, and writes to Chroma
3. Request completes

**Tradeoffs:** Simpler infrastructure but adds latency to every write. Failures in Chroma can affect the primary write path unless carefully handled.

**Ask the user:** Do they have an async queue? If not, is synchronous acceptable, or should we set one up?

## Handling updates and deletes

- **Updates:** Re-chunk and re-embed the document, then use `upsert` to replace existing chunks
- **Deletes:** Delete all chunks for the document by ID prefix or metadata filter

Storing the source record ID in chunk metadata makes this straightforward. For example, if a blog post with ID `post-123` has 3 chunks, store `{"source_id": "post-123", "chunk_index": 0}` etc. on each chunk.