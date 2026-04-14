# @snippet:example
from chromadb.utils.embedding_functions import ChromaCloudQwenEmbeddingFunction
from chromadb.utils.embedding_functions.chroma_cloud_qwen_embedding_function import ChromaCloudQwenEmbeddingModel
import os

os.environ["CHROMA_API_KEY"] = "YOUR_API_KEY"
qwen_ef = ChromaCloudQwenEmbeddingFunction(
    model=ChromaCloudQwenEmbeddingModel.QWEN3_EMBEDDING_0p6B,
    task="nl_to_code"
)

texts = ["Hello, world!", "How are you?"]
embeddings = qwen_ef(texts)
# @end
