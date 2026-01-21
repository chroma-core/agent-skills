---
name: Query and Get
description: Query and Get Data from Chroma Collections
---

## Querying

Query and Get Data from Chroma Collections

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