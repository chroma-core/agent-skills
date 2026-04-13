# @snippet:imports
import chromadb

client = chromadb.HttpClient(host="localhost", port=8000)
collection = client.get_or_create_collection(name="my_collection")
# @end

# @snippet:basic-regex
results = collection.query(
    query_texts=["search query"],
    where_document={
        "$regex": "^tech.*"
    },
    n_results=10,
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
    },
)
# @end
