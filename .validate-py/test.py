import chromadb
from chromadb import Collection

# Mock setup for type checking
client: chromadb.ClientAPI
collection: Collection

def __validate() -> None:
    schema = Schema()

    # Configure vector index with custom embedding function
    embedding_function = OpenAIEmbeddingFunction(
        api_key="your-api-key",
        model_name="text-embedding-3-small"
    )

    sdlfkjsdlfkjsdf())()()()()))))))))
    lkjsdflk jsd;lfkj sd;lkfj sd;lfkj sl;dfkj 

    schema.create_index(config=VectorIndexConfig(
        space="cosine",
        embedding_function=embedding_function
    ))
