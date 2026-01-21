---
name: Search() API
description: An expressive and flexible API for doing dense and sparse vector search on collections, as well as hybrid search
---

## Search() API

An expressive and flexible API for doing dense and sparse vector search on collections, as well as hybrid search.

The Search API is meant to be used with Collection Schemas.

### Example

The Key class (aliased as K for brevity) provides a fluent interface for building filter expressions. Use K to reference document fields, IDs, and metadata properties.

{{CODE:k}}

Ranking uses Knn

{{CODE:knn}}

A full, simple example

{{CODE:base-example}}

An example of hybrid search using Rrf

{{CODE:rrf}}
