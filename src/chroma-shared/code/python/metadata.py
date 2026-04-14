# @snippet:imports
import chromadb

client = chromadb.HttpClient(host="localhost", port=8000)
# @end

# @snippet:metadata-filtering
collection = client.get_or_create_collection(name="articles")

query_results = collection.query(
    query_texts=["interest rates outlook"],
    where={
        "category": "research",
    },
)

filtered_docs = collection.get(
    where={
        "$and": [
            {"year": {"$gte": 2025}},
            {"region": {"$in": ["us", "eu"]}},
        ]
    },
    limit=20,
)

direct_filter = {
    "metadata_field": "search_string",
}

explicit_filter = {
    "metadata_field": {
        "$eq": "search_string",
    }
}
# @end

# @snippet:add-with-arrays
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
results = collection.query(
    query_texts=["lending products"],
    where={
        "topics": {"$contains": "lending"},
    },
)
# @end

# @snippet:not-contains-query
filtered = collection.query(
    query_texts=["economic outlook"],
    where={
        "topics": {"$not_contains": "inflation"},
    },
)
# @end

# @snippet:combined-filters
combined = collection.query(
    query_texts=["financial results"],
    where={
        "$and": [
            {"topics": {"$contains": "earnings"}},
            {"year": {"$gte": 2025}},
        ]
    },
)

multi_match = collection.query(
    query_texts=["market trends"],
    where={
        "$or": [
            {"topics": {"$contains": "rates"}},
            {"topics": {"$contains": "inflation"}},
        ]
    },
)
# @end
