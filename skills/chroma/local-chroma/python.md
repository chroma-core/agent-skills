---
name: Local Chroma
description: How to run and use local chroma
---

## Local Chroma

For python, chroma can be installed with pip or uv

```
pip install chromadb
uv install chromadb
```
To run chroma in python from a venv:

```
chroma run
```

For javascript, npm can be used

```
npm install chromadb
```

To run chroma from where it was installed:

```
npx chroma run
```

### Example

```python
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
```
