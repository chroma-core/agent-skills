# @snippet:imports
from typing import cast
from chromadb import Schema, VectorIndexConfig, SparseVectorIndexConfig, K
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from chromadb.utils.embedding_functions import ChromaCloudSpladeEmbeddingFunction
from chromadb.utils.embedding_functions import ChromaBm25EmbeddingFunction
# @end

# @snippet:basic-example
basic_schema = Schema()

# Configure vector index with custom embedding function
embedding_function = OpenAIEmbeddingFunction(
    api_key="your-api-key",
    model_name="text-embedding-3-small"
)

basic_schema.create_index(config=VectorIndexConfig(
    space="cosine",
    embedding_function=embedding_function
))
# @end


# @snippet:splade
splade_schema = Schema()
SPARSE_SPLADE_KEY = "sparse_splade"

# Configure vector index with custom embedding function
dense_embedding_function = OpenAIEmbeddingFunction(
    api_key="your-api-key",
    model_name="text-embedding-3-small"
)

splade_schema.create_index(config=VectorIndexConfig(
    space="cosine",
    embedding_function=dense_embedding_function
))

splade_embedding_function = ChromaCloudSpladeEmbeddingFunction()

splade_schema.create_index(config=SparseVectorIndexConfig(
	source_key=cast(str, K.DOCUMENT),
	embedding_function=splade_embedding_function
), key=SPARSE_SPLADE_KEY)
# @end

# @snippet:bm25
bm25_schema = Schema()
SPARSE_BM25_KEY = "sparse_bm25"

# Configure vector index with custom embedding function
bm25_dense_embedding_function = OpenAIEmbeddingFunction(
    api_key="your-api-key",
    model_name="text-embedding-3-small"
)

bm25_schema.create_index(config=VectorIndexConfig(
    space="cosine",
    embedding_function=bm25_dense_embedding_function
))

bm25_embedding_function = ChromaBm25EmbeddingFunction()

bm25_schema.create_index(config=SparseVectorIndexConfig(
	source_key=cast(str, K.DOCUMENT),
	embedding_function=bm25_embedding_function
), key=SPARSE_BM25_KEY)
# @end