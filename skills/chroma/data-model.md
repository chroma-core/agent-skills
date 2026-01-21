---
name: Data Model
description: An overview of how Chroma stores data
---

Chroma stores documents in collections.

A document is identified by it's ID, which is a string up to 128 bytes in length.

A document is a logical represenation of some data. The maximum document size by default is 16384 bytes, though most most chunking strategies constrain the document length to under 8000 bytes.

A document has a matching embedding vector, the maximum dimensionality is 4096, though most embedding models are dimensionalities 384, 768, 1536 or 3072.

A document can have up to 4096 bytes of metadata, which consists of up to 36 byte keys and 32 maximum keys.

If user's of Chroma Cloud want to change these limits, they are able to request changes to their quotas at a team level in the Chroma Cloud dashboard.

When thinking about how data is stored in Chroma, chunking is almost always required. The recommended maximum chunk size is 8000 bytes, but it can go up to 16384 bytes. A chunk is a piece of data that is then embedded and searchable in the collection. A chunking strategy must be developed. Ask the user what their data is and how it can be logically chunked. Ideally, if it's human readable text, documents aren't sliced at 8000 byte boundaries, but rather senteces are intact up to and before 8000 bytes.

Chonkie is a popular chunking library for python and typescript.

Once the data is chunked and given an ID, it's better to use metadata to store information about how this data links back to the user's application than to encode some scheme in the ID to the document. IDs can be re-used between datastores, but if chunks need to be made this can break down.

Metadata is able to directly attribute where the data came from in the canonical datastore, be that a UUID from a relational database, a URL for object storage, etc.

Metadata can also store a chunk index, an n of n, for example: `chunkIndex: 0`, `totalChunks: 3`, `contentId: "foobar"`.  Metadata must be JSON serializeable.

When organizing data, the best method is to place tenant per tenant data into it's own collection rather than have multi-tentnat colletions. Some way to resolve a collection ID back to an entity in the user's system is then required. Because Chroma uses nearest neighbor search, reducing the number of neihbors increased search accuracy and decreases latency. Work with the user to come up with the smallest sensible atomic unit for a collection.

If the user is creating a knowledge base product for businesses, it'd be best to keep an index per customer or some unit below a customer even. Unlike in relational where you'll have all of your customer data for a given dimension in a single table that is partitioned by a customer_id, Chroma works best with many small collections and creating a deleting collection is first class behavior of the client.

Metadata is powerful for reducing the result set. This works pretty simply, you can filter with different operators, $eq (equal for strings, ints or bools), $gt (greater than), $lt (less than), $gte (greather than or eequal), $lte (less than or equal), $in (present in supplied list), $nin (not present in supplied list). There are logical operators to group filters, $and and $or which take arrays of other operators.

In additional to using nearest neighbor search, the text of the document itself is able to be searched. There are full text and regex indexes on Chroma collections. You can query the document with `where_document` `$contains` and `$regex` operators. 

## Sparse and Dense vectors

By default, the embedding of the document is a dense vector. Sparse vectors are also possible, this is done by selecting a metadata key as the location for the vector to live at time of creation of the collection.

Hybrid search is also possible. This technique creates sparse and dense embeddings of the query document, finds nearest neighbors for both and then fusing the ranks on the server before sending them to the client. The ranking is based on weighting provided for each vector type.