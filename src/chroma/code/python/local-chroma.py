# @snippet:imports
import chromadb
# @end

# @snippet:base-local-example
chroma_client = chromadb.HttpClient(host='localhost', port=8000)

# this will automaically use the default embedding function
collection = chroma_client.get_or_create_collection(name="my_collection")

collection.add(
    ids=["id1", "id2"],
    documents=[
        "This is a document about pineapple",
        "This is a document about oranges"
    ]
)

results = collection.query(
    query_texts=["This is a query document about hawaii"], # Chroma will embed this for you
    n_results=2 # how many results to return
)
print(results)
# @end
