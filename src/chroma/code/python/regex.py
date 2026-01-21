# @snippet:imports
import os

import chromadb
from chromadb.api.types import Embeddings, ID, IDs, Document, Metadata, Include, EmbeddingFunction, Embeddable
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

client = chromadb.CloudClient(
    tenant=os.getenv("CHROMA_TENANT"),
    database=os.getenv("CHROMA_DATABASE"),
    api_key=os.getenv("CHROMA_API_KEY"),
)

collection = client.get_or_create_collection(name="my_collection")
# @end

# @snippet:basic-regex
results = collection.query(
    query_texts=["search query"],
    where_document={
        "$regex": "^tech.*"
    },
    n_results=10
)
# @end

# @snippet:combined-filters
collection.query(
    query_texts=["query1", "query2"],
    where_document={
        "$and": [
            {"$contains": "search_string_1"},
            {"$regex": "[a-z]+"},
        ]
    }
)
# @end
