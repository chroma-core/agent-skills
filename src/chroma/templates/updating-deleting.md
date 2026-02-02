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

{{CODE:imports}}

## Update

Update modifies existing documents. If an ID doesn't exist, the operation fails silently for that ID (no error thrown, but nothing is updated).

**Important:** When you update a document's text, Chroma re-computes the embedding automatically using the collection's embedding function.

{{CODE:update}}

## Upsert

Upsert is the preferred method for syncing data from an external source. It inserts new documents and updates existing ones in a single operation.

**When to use upsert vs update:**
- Use `upsert` when syncing from a primary database (you don't know which records are new)
- Use `update` when you're certain the document already exists

{{CODE:upsert}}

## Delete by ID

The simplest way to delete documents is by their IDs.

{{CODE:delete-by-id}}

## Delete by filter

Delete documents matching metadata or content filters without knowing specific IDs. Useful for bulk cleanup operations.

{{CODE:delete-by-filter}}

## Syncing from an external data source

A common pattern is keeping Chroma in sync with a primary database. This example shows how to handle creates, updates, and deletes.

{{CODE:sync-pattern}}

### Sync strategy tips

**Track source IDs:** Always store the primary database ID in metadata so you can find and update documents later.

**Batch operations:** Process updates in batches of 100-500 to balance throughput and memory usage.

**Handle deletes:** When records are deleted from your primary database, delete them from Chroma too. Use metadata filters if you track `source_id`.

**Idempotent syncs:** Use `upsert` so re-running a sync doesn't create duplicates.
