# @snippet:basic-regex
results = collection.query(
    query_texts=["search query"],
    where={
        "category": {"$regex": "^tech.*"}
    },
    n_results=10
)
# @end

# @snippet:case-insensitive
results = collection.query(
    query_texts=["search query"],
    where={
        "title": {"$iregex": "javascript"}
    },
    n_results=10
)
# @end

# @snippet:combined-filters
results = collection.query(
    query_texts=["search query"],
    where={
        "$and": [
            {"category": {"$regex": "^blog"}},
            {"status": "published"}
        ]
    },
    n_results=10
)
# @end
