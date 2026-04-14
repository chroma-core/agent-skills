---
name: Caching Collection References
description: Reduce repeated collection lookup requests in high-traffic Chroma Cloud applications
---

## Caching Collection References

In Chroma Cloud, calling `client.getOrCreateCollection()` or `client.get_or_create_collection()` is not just a local lookup. The client makes an HTTP request to fetch the collection metadata, or create the collection if it does not already exist.

That means it is usually a mistake to call `getOrCreateCollection()` on every request in a hot path.

In higher-traffic applications, keep and reuse the returned collection reference. Even in horizontally scaled deployments, caching the collection handle in each process, pod, or worker avoids repeating the collection lookup on every operation.

This is a simple latency win and also reduces avoidable request volume to Chroma Cloud.

### When this helps

This pattern is especially useful when:

- your app serves many requests against the same small set of collections
- you create the `CloudClient` once and reuse it for the lifetime of the process
- your server uses request handlers, workers, or background jobs that repeatedly touch the same collections

### TypeScript example

```typescript
import { CloudClient, type Collection } from 'chromadb';

const client = new CloudClient();
const collections = new Map<string, Collection>();

export async function getCollection(name: string): Promise<Collection> {
  const cached = collections.get(name);
  if (cached) {
    return cached;
  }

  const collection = await client.getOrCreateCollection({ name });
  collections.set(name, collection);
  return collection;
}
```

If your app has a fixed set of collections, it can be even simpler to initialize them once during startup and reuse those references afterward.

### Python example

```python
import chromadb

client = chromadb.CloudClient()
collections: dict[str, chromadb.Collection] = {}

def get_collection(name: str) -> chromadb.Collection:
    cached = collections.get(name)
    if cached is not None:
        return cached

    collection = client.get_or_create_collection(name=name)
    collections[name] = collection
    return collection
```

For async Python servers, use the same idea with process-local module state, application state, or a small collection registry object.

### Practical guidance

- Cache collection references in memory, not in an external cache like Redis
- Keep the cache keyed by collection name, or by tenant/database plus collection name if your app spans multiple Chroma environments
- If a process restarts, rebuild the cache lazily or during startup
- This optimization is about avoiding repeated collection lookup requests, not caching query results
