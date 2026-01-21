# @snippet:imports
from typing import cast
from chromadb import Schema, VectorIndexConfig, SparseVectorIndexConfig, K
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from chromadb.utils.embedding_functions import ChromaCloudSpladeEmbeddingFunction
from chromadb.utils.embedding_functions import ChromaBm25EmbeddingFunction
# @end

# @snippet:basic-example
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
# @end


# @snippet:splade
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
# @end

# @snippet:bm25
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
# @end