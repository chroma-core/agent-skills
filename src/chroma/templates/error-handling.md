---
name: Error Handling
description: Handling errors and failures when working with Chroma
---

## Error Handling

Chroma operations can fail for various reasons: connection issues, missing resources, invalid data, or quota limits. This guide covers common error scenarios and how to handle them.

{{CODE:imports}}

### Error types

**Python** uses specific exception classes:
- `chromadb.errors.NotFoundError` - Collection, tenant, or database doesn't exist
- `ValueError` - Invalid collection name or duplicate creation attempt

**TypeScript** throws standard `Error` objects with descriptive messages. Check the error message to determine the cause.

### Connection errors

Connection failures occur when the client can't reach the Chroma server. This is common during startup or when network issues occur.

{{CODE:connection-errors}}

### Collection not found

When working with collections that may not exist, handle the `NotFoundError` (Python) or catch the error and check its message (TypeScript).

{{CODE:collection-not-found}}

### Safe collection access pattern

The `getOrCreateCollection` method is the recommended way to avoid "not found" errors entirely. Use `getCollection` only when you specifically need to verify a collection exists.

{{CODE:safe-collection-access}}

### Validation errors

Chroma validates data before operations. Common validation failures include:
- Document content exceeding 16KB
- Embedding dimensions not matching the collection
- Metadata exceeding limits (4KB total, 32 keys max)
- Invalid collection names

{{CODE:validation-errors}}

### Batch operation failures

When adding or upserting multiple documents, a single invalid document fails the entire batch. Validate data before sending, or implement retry logic for partial failures.

{{CODE:batch-operations}}

### Cloud-specific errors

Chroma Cloud has additional failure modes:
- **Authentication errors** - Invalid or expired API key
- **Quota exceeded** - Rate limits or storage limits reached
- **Tenant/database not found** - Incorrect configuration

{{CODE:cloud-errors}}

### Defensive patterns summary

| Scenario | Recommended approach |
|----------|---------------------|
| Collection access | Use `getOrCreateCollection` instead of `getCollection` |
| Missing data | Check results length before accessing |
| Connection issues | Implement retry with exponential backoff |
| Large batches | Validate data size before operations |
| Cloud auth | Verify environment variables are set |
