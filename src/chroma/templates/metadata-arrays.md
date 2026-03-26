---
name: Metadata Arrays
description: Store and query arrays of strings, numbers, and booleans in metadata fields
---

## Metadata Arrays

Chroma supports storing arrays of strings, numbers, and booleans in metadata fields. This eliminates the need for workarounds like comma-separated strings or JSON serialization when a record needs multiple values for a single field.

**Rules:**
- All elements in an array must share the same type (all strings, all numbers, or all booleans)
- Arrays are stored directly on metadata fields alongside regular scalar values

### Imports and boilerplate

{{CODE:imports}}

### Adding records with array metadata

Store arrays directly in metadata fields when adding or upserting documents.

{{CODE:add-with-arrays}}

### Querying array metadata with $contains

Use `$contains` in a `where` filter to find records where an array metadata field includes a specific value.

{{CODE:contains-query}}

### Querying array metadata with $not_contains

Use `$not_contains` to exclude records where an array metadata field includes a specific value.

{{CODE:not-contains-query}}

### Combining array filters with logical operators

Array filter operators compose with existing logical operators (`$and`, `$or`) and can be combined with scalar metadata filters in a single query.

{{CODE:combined-filters}}

### Common use cases

- **Multi-label tagging:** Store tags or categories as arrays, then filter with `$contains` to find matching records without needing joins or separate tables.
- **Multi-entity association:** Track mentioned users, related entities, or linked resources as arrays on each record.
- **Access control:** Store allowed roles or groups as an array, then filter by the current user's role at query time.
