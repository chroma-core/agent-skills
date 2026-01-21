---
name: Query and Get
description: Query and Get Data from Chroma Collections
---

## Querying

Query and Get Data from Chroma Collections

### Imports and boilerplatte

{{CODE:imports}}

### Example

{{CODE:query-method}}

A more involved example with query options

{{CODE:query-with-options}}

### Metadata Filtering

The where argument in get and query is used to filter records by their metadata. For example, in this query operation, Chroma will only query records that have the page metadata field with the value 10:

{{CODE:metadata-filtering}}