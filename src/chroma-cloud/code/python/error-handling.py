# @snippet:imports
import json
import os
import time

import chromadb
from chromadb.errors import NotFoundError
# @end


def get_cloud_config() -> dict[str, str]:
    api_key = os.environ["CHROMA_API_KEY"]
    tenant = os.environ["CHROMA_TENANT"]
    database = os.environ["CHROMA_DATABASE"]
    return {"api_key": api_key, "tenant": tenant, "database": database}


# @snippet:connection-errors
def connect_with_retry(max_retries: int = 3) -> chromadb.ClientAPI:
    """Connect to Chroma Cloud with exponential backoff retry."""
    client = chromadb.CloudClient(**get_cloud_config())

    for attempt in range(1, max_retries + 1):
        try:
            client.heartbeat()
            return client
        except Exception as e:
            if attempt == max_retries:
                raise ConnectionError(
                    f"Failed to connect to Chroma Cloud after {max_retries} attempts: {e}"
                )

            time.sleep(2 ** (attempt - 1))

    raise ConnectionError("Unreachable")


# @end

# @snippet:collection-not-found
client = chromadb.CloudClient(**get_cloud_config())

try:
    collection = client.get_collection(name="my_collection")
except NotFoundError:
    print("Collection not found, creating it...")
    collection = client.get_or_create_collection(name="my_collection")
# @end

# @snippet:safe-collection-access
client = chromadb.CloudClient(**get_cloud_config())
collection = client.get_or_create_collection(name="my_collection")

results = collection.query(
    query_texts=["search query"],
    n_results=5,
)

if results["documents"] and len(results["documents"][0]) > 0:
    first_doc = results["documents"][0][0]
else:
    pass
# @end

# @snippet:validation-errors
client = chromadb.CloudClient(**get_cloud_config())


def validate_document(doc: str) -> bool:
    byte_size = len(doc.encode("utf-8"))
    return byte_size <= 16384


def validate_metadata(metadata: dict) -> bool:
    if len(metadata.keys()) > 32:
        return False

    json_size = len(json.dumps(metadata).encode("utf-8"))
    return json_size <= 4096


def safe_add(
    collection_name: str,
    ids: list[str],
    documents: list[str],
    metadatas: list[dict] | None = None,
) -> None:
    for doc in documents:
        if not validate_document(doc):
            raise ValueError("Document exceeds 16KB limit")

    if metadatas:
        for meta in metadatas:
            if not validate_metadata(meta):
                raise ValueError("Metadata exceeds limits (4KB or 32 keys)")

    collection = client.get_or_create_collection(name=collection_name)
    collection.add(ids=ids, documents=documents, metadatas=metadatas)


# @end

# @snippet:batch-operations
client = chromadb.CloudClient(**get_cloud_config())


def batch_add(
    collection_name: str,
    ids: list[str],
    documents: list[str],
    batch_size: int = 100,
) -> dict:
    collection = client.get_or_create_collection(name=collection_name)
    failures = []

    for i in range(0, len(ids), batch_size):
        batch_ids = ids[i : i + batch_size]
        batch_docs = documents[i : i + batch_size]

        try:
            collection.add(ids=batch_ids, documents=batch_docs)
        except Exception as e:
            failures.append({"index": i, "error": str(e)})

    total_batches = (len(ids) + batch_size - 1) // batch_size
    return {"total_batches": total_batches, "failures": failures}


# @end

# @snippet:cloud-errors
def create_cloud_client() -> chromadb.ClientAPI:
    """Create CloudClient with error handling."""
    client = chromadb.CloudClient(**get_cloud_config())

    try:
        client.heartbeat()
        return client
    except Exception as e:
        error_msg = str(e).lower()
        if "401" in error_msg or "unauthorized" in error_msg:
            raise PermissionError("Invalid or expired API key") from e
        if "404" in error_msg or "not found" in error_msg:
            raise NotFoundError(
                "Tenant or database not found - check configuration"
            ) from e
        if "429" in error_msg or "rate" in error_msg:
            raise RuntimeError("Rate limit exceeded - implement backoff") from e
        raise


# @end
