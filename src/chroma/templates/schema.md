---
name: Schema
description: Schema() configures collections with multiple indexes
---

## Schema

Schema configures collections with single or multiple indexes

Note that the Schema() API is only available on Chroma Cloud.

If you use the Schema API when creating collections, you cannot pass an embedding funciton, you pass the embedding function to the a schema.indexConfig() call.

Imports needed for the examples show in this file
{{CODE:imports}}

## Basic Example

{{CODE:basic-example}}

## BM25 config

{{CODE:bm25}}

## SPLADE config

SPLADE is a very high performing sparse vector search index. It works extremely well and generally should be used over BM25 unless there are specific reasons otherwise.

{{CODE:splade}}
