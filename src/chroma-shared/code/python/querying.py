# @snippet:imports
from typing import Optional, TypedDict

import chromadb

client = chromadb.HttpClient(host="localhost", port=8000)
# @end

# @snippet:query-method
collection = client.get_or_create_collection(name="my_collection")

collection.add(
    ids=["doc1", "doc2"],
    documents=[
        "Apples are really good red fruit",
        "Red cars tend to get more speeding tickets",
    ],
)

results = collection.query(
    query_texts=["I like red apples"],
)

first_result = results["documents"][0]
# @end

# @snippet:query-with-options
collection2 = client.get_or_create_collection(name="my_collection")

results2 = collection2.query(
    query_texts=["I like red apples"],
    n_results=2,
    include=["metadatas", "documents", "embeddings", "distances"],
    ids=["id1", "id2"],
    where={"category": "philosophy"},
    where_document={"$contains": "wikipedia"},
)


class QueryResult(TypedDict):
    ids: list[list[str]]
    embeddings: Optional[list[list[list[float]]]]
    documents: Optional[list[list[str]]]
    metadatas: Optional[list[list[dict]]]
    distances: Optional[list[list[float]]]


class GetResult(TypedDict):
    ids: list[str]
    embeddings: Optional[list[list[float]]]
    documents: Optional[list[str]]
    metadatas: Optional[list[dict]]


typed_results: QueryResult = results2
# @end

# @snippet:metadata-filtering
collection.query(
    query_texts=["first query", "second query"],
    where={"page": 10},
)

filter1 = {
    "metadata_field": "search_string",
}

filter2 = {
    "metadata_field": {
        "$eq": "search_string"
    }
}

and_example = {
    "$and": [
        {
            "metadata_field1": {
                # <Operator>: <Value>
            }
        },
        {
            "metadata_field2": {
                # <Operator>: <Value>
            }
        }
    ]
}
# @end

# @snippet:get-method
docs = collection.get(ids=["doc1", "doc2"])

page = collection.get(limit=20, offset=0)

filtered = collection.get(
    where={"category": "blog"},
    limit=50,
)
# @end

# @snippet:where-document
contains_results = collection.query(
    query_texts=["search query"],
    where_document={"$contains": "important keyword"},
)

excluded_results = collection.query(
    query_texts=["search query"],
    where_document={"$not_contains": "deprecated"},
)

combined_results = collection.query(
    query_texts=["search query"],
    where_document={
        "$and": [
            {"$contains": "python"},
            {"$not_contains": "legacy"},
        ]
    },
)

full_filter_results = collection.query(
    query_texts=["search query"],
    n_results=10,
    where={"status": "published"},
    where_document={"$contains": "tutorial"},
)
# @end
