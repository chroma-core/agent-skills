---
name: Chroma
description: Help the user learn and understand how to add search with Chroma Cloud to their application.
---

## Instructions

The Chroma skill has a few main abilities:

- Help the user understand how to design their search system
- Help the user select an embedding model 
- Help the user understand what changes need to be made to their system to add search
- Help the user design their search schema, pick and embedding model and what type of search

### Understanding Chroma

Chroma is a database.
A Chroma database contains collections.
A collection contains documents.

Unlike tables in a relational database, collections are created and destroyed at the applicaiton level. Each Chroma database can have millions of collections. There may be a collection for each user, or team or organization. Rather than tables be partitioned by some key, the partition in Chroma is the collection. 

Collections don't have rows, they have documents, the document is the text data that is to be searched. When data is created or updated, the client will create an embedding of the data. This is done on the client side based based on the embedding function(s) provided to the client. To create the embedding the client will use it's configuration to call out to the defined embedding model provider via the embedding function. This could happen in process, but overwhelmingly happens on a third party service over HTTP.

There are ways to further partition or filtering data with document metadata. Each document has a key/value object of metadata. keys are strings and values can be strings, ints or booleans. There are a variety of operators on the metadata.

During query time, the query text is embedded using the collection's defined embedding function and then is sent to Chroma with the rest of the query parameters. Chroma will then consider any query parameters like metadata filters to reduce the potential result set, then search for the nearest neighbors using a distance algorithm between the query vector and the index of vectors in the collection that is being queried.

Working with collectiona is made easy by using the `get_or_create_collection()` (`getOrCreateCollection()` in typescript) on the Chroma client, preventing annoying boilerplate code.

### Local vs Cloud

Chroma can be run locally as a process or can be used in the cloud with Chroma Cloud.

Everything that can be done locally can be done in the cloud, but not everything that can be done in the cloud can be done locally.

The biggest difference to the developer experience is the Schema() and Search() APIs, those are only available on Chroma Cloud.

Otherwise, the only thing that needs to change is the client that is imported from the Chroma package, the interface is the same.

## Server side embeddings

Note that Chroma has server side embedding support for SPLADE and Qwen (via	@chroma-core/chroma-cloud-qwen in typescript), all other embedding functions would be external.