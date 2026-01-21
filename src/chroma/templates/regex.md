---
name: Chroma Regex Filtering
description: Learn how to use regex filters in Chroma queries
---

## Regex Filtering in Chroma

Chroma supports regex filtering on document metadata. This allows you to filter results based on pattern matching.

### Basic Regex Filter

Use the `$regex` operator to match metadata values against a regular expression:

{{CODE:basic-regex}}

### Case-Insensitive Matching

For case-insensitive regex matching, use the `$iregex` operator:

{{CODE:case-insensitive}}
