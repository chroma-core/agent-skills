import json
import os
import time

import chromadb
from chromadb.errors import NotFoundError

# @snippet:connection-errors


def connect_with_retry(max_retries: int = 3) -> chromadb.ClientAPI:
    """Connect to Chroma with exponential backoff retry."""
    client = chromadb.Client()

    for attempt in range(1, max_retries + 1):
        try:
            # heartbeat() verifies the connection is working
            client.heartbeat()
            return client
        except Exception as e:
            if attempt == max_retries:
                raise ConnectionError(
                    f"Failed to connect to Chroma after {max_retries} attempts: {e}"
                )
            # Exponential backoff: 1s, 2s, 4s...
            delay = 2 ** (attempt - 1)
            time.sleep(delay)

    raise ConnectionError("Unreachable")


# @end

# @snippet:collection-not-found

client = chromadb.Client()

# get_collection raises NotFoundError if the collection doesn't exist
try:
    collection = client.get_collection(name="my_collection")
except NotFoundError:
    print("Collection not found, creating it...")
    collection = client.create_collection(name="my_collection")

# @end

# @snippet:safe-collection-access

client = chromadb.Client()

# Preferred: get_or_create_collection never raises NotFoundError
collection = client.get_or_create_collection(name="my_collection")

# Check if results exist before accessing
results = collection.query(
    query_texts=["search query"],
    n_results=5,
)

if results["documents"] and len(results["documents"][0]) > 0:
    first_doc = results["documents"][0][0]
    # Safe to use first_doc
else:
    # No results found
    pass

# @end

# @snippet:validation-errors

client = chromadb.Client()


def validate_document(doc: str) -> bool:
    """Validate document size (16KB limit, recommend < 8KB)."""
    byte_size = len(doc.encode("utf-8"))
    return byte_size <= 16384


def validate_metadata(metadata: dict) -> bool:
    """Validate metadata size (4KB limit, 32 keys max)."""
    if len(metadata.keys()) > 32:
        return False

    json_size = len(json.dumps(metadata).encode("utf-8"))
    return json_size <= 4096


def safe_add(
    collection_name: str,
    ids: list[str],
    documents: list[str],
    metadatas: list[dict] | None = None,
):
    """Add documents with pre-validation."""
    # Pre-validate documents
    for doc in documents:
        if not validate_document(doc):
            raise ValueError("Document exceeds 16KB limit")

    # Pre-validate metadata
    if metadatas:
        for meta in metadatas:
            if not validate_metadata(meta):
                raise ValueError("Metadata exceeds limits (4KB or 32 keys)")

    collection = client.get_or_create_collection(name=collection_name)

    try:
        collection.add(ids=ids, documents=documents, metadatas=metadatas)
    except ValueError as e:
        # Handle specific validation errors
        error_msg = str(e).lower()
        if "dimension" in error_msg:
            raise ValueError("Embedding dimensions do not match collection") from e
        if "duplicate" in error_msg:
            raise ValueError("Duplicate IDs in batch") from e
        raise


# @end

# @snippet:batch-operations

client = chromadb.Client()


def batch_add(
    collection_name: str,
    ids: list[str],
    documents: list[str],
    batch_size: int = 100,
) -> dict:
    """Process documents in batches to handle partial failures."""
    collection = client.get_or_create_collection(name=collection_name)

    failures = []

    for i in range(0, len(ids), batch_size):
        batch_ids = ids[i : i + batch_size]
        batch_docs = documents[i : i + batch_size]

        try:
            collection.add(ids=batch_ids, documents=batch_docs)
        except Exception as e:
            # Log failure but continue with other batches
            failures.append({"index": i, "error": str(e)})

    if failures:
        print(f"{len(failures)} batches failed: {failures}")

    total_batches = (len(ids) + batch_size - 1) // batch_size
    return {"total_batches": total_batches, "failures": failures}


# @end

# @snippet:cloud-errors


def get_cloud_config() -> dict:
    """Verify environment variables before creating client."""
    api_key = os.environ.get("CHROMA_API_KEY")
    tenant = os.environ.get("CHROMA_TENANT")
    database = os.environ.get("CHROMA_DATABASE")

    missing = []
    if not api_key:
        missing.append("CHROMA_API_KEY")
    if not tenant:
        missing.append("CHROMA_TENANT")
    if not database:
        missing.append("CHROMA_DATABASE")

    if missing:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing)}"
        )

    return {"api_key": api_key, "tenant": tenant, "database": database}


def create_cloud_client() -> chromadb.ClientAPI:
    """Create CloudClient with error handling."""
    config = get_cloud_config()

    client = chromadb.CloudClient(
        api_key=config["api_key"],
        tenant=config["tenant"],
        database=config["database"],
    )

    try:
        # Verify connection and authentication
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
