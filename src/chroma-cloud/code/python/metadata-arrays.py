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

# @snippet:add-with-arrays
collection = client.get_or_create_collection(
    name="articles",
    embedding_function=cast(EmbeddingFunction[Embeddable], embedding_function),
)

collection.add(
    ids=["article-1", "article-2", "article-3"],
    documents=[
        "Net interest income rose 12% in Q3",
        "New lending products launched in Southeast Asia",
        "Central bank holds rates steady amid inflation concerns",
    ],
    metadatas=[
        {
            "topics": ["net-interest-income", "earnings", "quarterly-results"],
            "year": 2026,
        },
        {
            "topics": ["lending", "expansion", "southeast-asia"],
            "year": 2026,
        },
        {
            "topics": ["rates", "central-bank", "inflation"],
            "year": 2026,
        },
    ],
)
# @end

# @snippet:contains-query
# Find all articles tagged with "lending"
results = collection.query(
    query_texts=["lending products"],
    where={
        "topics": {"$contains": "lending"},
    },
)
# @end

# @snippet:not-contains-query
# Exclude articles about inflation
filtered = collection.query(
    query_texts=["economic outlook"],
    where={
        "topics": {"$not_contains": "inflation"},
    },
)
# @end

# @snippet:combined-filters
# Combine array filters with scalar filters using $and
combined = collection.query(
    query_texts=["financial results"],
    where={
        "$and": [
            {"topics": {"$contains": "earnings"}},
            {"year": {"$gte": 2025}},
        ],
    },
)

# Use $or to match records containing any of several values
multi_match = collection.query(
    query_texts=["market trends"],
    where={
        "$or": [
            {"topics": {"$contains": "rates"}},
            {"topics": {"$contains": "inflation"}},
        ],
    },
)
# @end

