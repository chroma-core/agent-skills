---
name: Schema
description: Schema() configures collections with multiple indexes
---

## Schema

Schema configures collections with single or multiple indexes

Imports needed for the examples show in this file
```python
from typing import cast
from chromadb import Schema, VectorIndexConfig, SparseVectorIndexConfig, K
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from chromadb.utils.embedding_functions import ChromaCloudSpladeEmbeddingFunction
from chromadb.utils.embedding_functions import ChromaBm25EmbeddingFunction
```

## Basic Example

```python
schema = Schema()

# Configure vector index with custom embedding function
embedding_function = OpenAIEmbeddingFunction(
    api_key="your-api-key",
    model_name="text-embedding-3-small"
)

schema.create_index(config=VectorIndexConfig(
    space="cosine",
    embedding_function=embedding_function
))
```

## BM25 config

```python
schema3 = Schema()
SPARSE_BM25_KEY = "sparse_bm25"

# Configure vector index with custom embedding function
embedding_function = OpenAIEmbeddingFunction(
    api_key="your-api-key",
    model_name="text-embedding-3-small"
)

schema3.create_index(config=VectorIndexConfig(
    space="cosine",
    embedding_function=embedding_function
))

sparse_ef = ChromaBm25EmbeddingFunction()

schema3.create_index(config=SparseVectorIndexConfig(
	source_key=cast(str, K.DOCUMENT),
	embedding_function=sparse_ef
), key=SPARSE_BM25_KEY)
```

## SPLADE config

SPLADE is a very high performing sparse vector search index. It works extremely well and generally should be used over BM25 unless there are specific reasons otherwise.

```python
schema2 = Schema()
SPARSE_SPLADE_KEY = "sparse_splade"

# Configure vector index with custom embedding function
embedding_function = OpenAIEmbeddingFunction(
    api_key="your-api-key",
    model_name="text-embedding-3-small"
)

schema2.create_index(config=VectorIndexConfig(
    space="cosine",
    embedding_function=embedding_function
))

sparse_ef = ChromaCloudSpladeEmbeddingFunction()

schema2.create_index(config=SparseVectorIndexConfig(
	source_key=cast(str, K.DOCUMENT),
	embedding_function=sparse_ef
), key=SPARSE_SPLADE_KEY)
```
