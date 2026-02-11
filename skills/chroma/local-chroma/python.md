---
name: Local Chroma
description: How to run and use local chroma
---

## Local Chroma

Running Chroma locally is useful for development, testing, and applications where data privacy or offline operation is important. Local Chroma stores data on disk and runs as a separate process that your application connects to over HTTP.

### When to use local vs cloud

**Use local Chroma when:**
- Developing and testing before deploying to production
- Data must stay on-premises for compliance or privacy reasons
- You need offline operation without network dependencies
- Running integration tests in CI/CD pipelines

**Use Chroma Cloud when:**
- You need the Schema() and Search() APIs for advanced indexing
- You want managed infrastructure without operational overhead
- You need hybrid search with SPLADE or other cloud-only features
- Scaling beyond what a single machine can handle

### Installation

For Python, install with pip or uv:

```
pip install chromadb
# or
uv pip install chromadb
```

To start the Chroma server from a Python environment:

```
chroma run
```

By default, this starts Chroma on `localhost:8000` and persists data to a local directory.

For JavaScript/TypeScript, install with npm:

```
npm install chromadb
```

To start the Chroma server:

```
npx chroma run
```

### Connecting to local Chroma

```python
import chromadb
```

Once the server is running, connect using the `ChromaClient` (not `CloudClient`):

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

### Persistence

Local Chroma persists data to disk automatically. By default, data is stored in `.chroma/` in the current directory. You can specify a different path when starting the server:

```
chroma run --path /path/to/data
```

This makes it safe to restart the server without losing your indexed documents.
