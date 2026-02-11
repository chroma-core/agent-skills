# @snippet:imports
from typing import cast
from chromadb import Schema, VectorIndexConfig, SparseVectorIndexConfig, K
from chromadb.utils.embedding_functions import ChromaCloudSpladeEmbeddingFunction
from chromadb.utils.embedding_functions import ChromaBm25EmbeddingFunction
from chromadb.utils.embedding_functions import ChromaCloudQwenEmbeddingFunction
from chromadb.utils.embedding_functions.chroma_cloud_qwen_embedding_function import ChromaCloudQwenEmbeddingModel
# @end

# @snippet:basic-example
basic_schema = Schema()

# Configure vector index with custom embedding function
embedding_function = ChromaCloudQwenEmbeddingFunction(
    model=ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
    task=None,
    api_key_env_var="CHROMA_API_KEY"
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
dense_embedding_function = ChromaCloudQwenEmbeddingFunction(
    model=ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
    task=None,
    api_key_env_var="CHROMA_API_KEY"
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
dense_embedding_function = ChromaCloudQwenEmbeddingFunction(
    model=ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
    task=None,
    api_key_env_var="CHROMA_API_KEY"
)

bm25_schema.create_index(config=VectorIndexConfig(
    space="cosine",
    embedding_function=dense_embedding_function
))

bm25_embedding_function = ChromaBm25EmbeddingFunction()

bm25_schema.create_index(config=SparseVectorIndexConfig(
	source_key=cast(str, K.DOCUMENT),
	embedding_function=bm25_embedding_function
), key=SPARSE_BM25_KEY)
# @end