# @snippet:imports
import os
from typing import cast

import chromadb
from chromadb.api.types import EmbeddingFunction, Embeddable
from chromadb.utils.embedding_functions import ChromaCloudQwenEmbeddingFunction
from chromadb.utils.embedding_functions.chroma_cloud_qwen_embedding_function import ChromaCloudQwenEmbeddingModel

client = chromadb.CloudClient(
    tenant=os.getenv("CHROMA_TENANT"),
    database=os.getenv("CHROMA_DATABASE"),
    api_key=os.getenv("CHROMA_API_KEY"),
)

embedding_function = ChromaCloudQwenEmbeddingFunction(
    model=ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
    task=None,
    api_key_env_var="CHROMA_API_KEY"
)
# @end

# @snippet:fork-collection
source_collection = client.get_collection(
    name="main-repo-index",
    embedding_function=cast(EmbeddingFunction[Embeddable], embedding_function),
)

forked_collection = source_collection.fork(new_name="main-repo-index-pr-1234")
# @end

# @snippet:add-to-fork
forked_collection.add(
    ids=["doc-pr-1", "doc-pr-2"],
    documents=[
        "New API endpoint for user preferences",
        "Updated authentication flow with OAuth2",
    ],
)
# @end

# @snippet:query-fork
# Query the fork — includes source data plus any new additions
results = forked_collection.query(
    query_texts=["authentication changes"],
    n_results=5,
)
# @end
