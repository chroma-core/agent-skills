---
name: Chroma CLI
description: Getting started with the Chroma CLI for cloud database management
---

## Chroma CLI

The Chroma CLI lets you interact with your Chroma Cloud databases for your active profile.

### Install

```bash
pip install chromadb
```

### Login

Authenticate with Chroma Cloud:

```bash
chroma login
```

This opens a browser for authentication and stores your credentials locally.

### Create a database

Create a new database on Chroma Cloud. If you don't provide a name, the CLI will prompt you to choose one. If a database with the provided name already exists, the CLI will error.

```bash
chroma db create <db_name>
```

### Connect to a database

The `connect` command outputs a connection code snippet for your Chroma Cloud database. If you don't provide the `name` or `language`, the CLI will prompt you to choose. The `name` argument is always assumed to be the first, so you don't need to include the `--name` flag.

The output code snippet will already have the API key of your profile set for the client construction.

```bash
chroma db connect <db_name> [--language python/JS/TS]
```

Add Chroma environment variables (`CHROMA_API_KEY`, `CHROMA_TENANT`, and `CHROMA_DATABASE`) to a `.env` file in your current working directory. Creates the file if it doesn't exist:

```bash
chroma db connect <db_name> --env-file
```

Or output the environment variables to the terminal:

```bash
chroma db connect <db_name> --env-vars
```

Setting these environment variables allows the `CloudClient` to be instantiated with no arguments.

### List databases

List all databases under your current profile:

```bash
chroma db list
```

### Delete a database

Deleting a database cannot be undone. The CLI will ask you to confirm the deletion.

```bash
chroma db delete <db_name>
```

## Profile Management

A **profile** persists the credentials (API key and tenant ID) for authenticating with Chroma Cloud. Each time you use `chroma login`, the CLI creates a profile for the team you logged in with. All profiles are saved in `~/.chroma/credentials`.

The CLI tracks your "active" profile in `~/.chroma/config.json`. This is the profile used for all CLI commands with Chroma Cloud. For example, if you logged into your "staging" team and set it as your active profile, running `chroma db create my-db` will create `my-db` under your "staging" team.

### Show active profile

```bash
chroma profile show
```

### List profiles

```bash
chroma profile list
```

### Switch active profile

```bash
chroma profile use <profile_name>
```

### Rename a profile

```bash
chroma profile rename <old_name> <new_name>
```

### Delete a profile

The CLI will ask for confirmation if you are deleting your active profile. If so, use `chroma profile use` to set a new active profile afterward, otherwise all future Chroma Cloud CLI commands will fail.

```bash
chroma profile delete <profile_name>
```
