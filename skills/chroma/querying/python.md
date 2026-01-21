---
name: Query and Get
description: Query and Get Data from Chroma Collections
---

## Querying

Query and Get Data from Chroma Collections

### Imports and boilerplatte

```python
import os

import chromadb
from chromadb.api.types import Embeddings, ID, IDs, Document, Metadata, Include, EmbeddingFunction, Embeddable
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from typing import List, Optional, TypedDict, cast

client = chromadb.CloudClient(
    tenant=os.getenv("CHROMA_TENANT"),
    database=os.getenv("CHROMA_DATABASE"),
    api_key=os.getenv("CHROMA_API_KEY"),
)
```

### Example

```python
embedding_function = OpenAIEmbeddingFunction(
	api_key="your-openai-api-key",
	model_name="text-embedding-3-large"
)

collection = client.get_or_create_collection(name="my_collection", embedding_function=cast(EmbeddingFunction[Embeddable], embedding_function))

collection.query(
    query_texts=["thus spake zarathustra", "the oracle speaks"],
)
```

A more involved example with query options

```python
embedding_function = OpenAIEmbeddingFunction(
	api_key="your-openai-api-key",
	model_name="text-embedding-3-large"
)

collection = client.get_or_create_collection(name="my_collection", embedding_function=cast(EmbeddingFunction[Embeddable], embedding_function))

collection.query(
    query_texts=["thus spake zarathustra", "the oracle speaks"],
	n_results=5,
	# specify what to include in the results
	include=["metadatas", "documents", "embeddings"],
	# reduce the search space by only looking at these ids
	ids=["id1", "id2"],
	# filter results only to those matching metadata criteria
	where={"category": "philosophy"},
	# filter results only to those matching document criteria
	where_document={"$contains": "wikipedia"},
)

# result shape

class QueryResult(TypedDict):
    ids: List[IDs]
    embeddings: Optional[List[Embeddings]]
    documents: Optional[List[List[Document]]]
    metadatas: Optional[List[List[Metadata]]]
    distances: Optional[List[List[float]]]
    included: Include

class GetResult(TypedDict):
    ids: List[ID]
    embeddings: Optional[Embeddings]
    documents: Optional[List[Document]]
    metadatas: Optional[List[Metadata]]
    included: Include
```

### Metadata Filtering

The where argument in get and query is used to filter records by their metadata. For example, in this query operation, Chroma will only query records that have the page metadata field with the value 10:

```python
collection.query(
    query_texts=["first query", "second query"],
    where={"page": 10}
)

# In order to filter on metadata, you must supply a where filter dictionary to the query. The dictionary must have the following structure:
# {
#     "metadata_field": {
#         <Operator>: <Value>
#     }
# }


# Using the $eq operator is equivalent to using the metadata field directly in your where filter.
filter1 = {
    "metadata_field": "search_string"
}

# is equivalent to

filter2 = {
    "metadata_field": {
        "$eq": "search_string"
    }
}

and_example = {
    "$and": [
        {
            "metadata_field1": {
                # <Operator>: <Value>
            }
        },
        {
            "metadata_field2": {
                # <Operator>: <Value>
            }
        }
    ]
}
```