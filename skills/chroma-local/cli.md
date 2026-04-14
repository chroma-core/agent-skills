---
name: Chroma CLI
description: Starting and managing a local open source Chroma server from the CLI
---

## Chroma CLI

The Chroma CLI can also be used for local open source Chroma workflows. This topic focuses on starting and managing a local server, not Chroma Cloud account setup.

### Install

```bash
pip install chromadb
```

### Start a local server

Run Chroma locally on the default address:

```bash
chroma run
```

This starts a server on `localhost:8000`.

### Choose a persistent data directory

Store local data in a specific path instead of the default working directory:

```bash
chroma run --path ./chroma-data
```

### Change the port

If another process already uses port `8000`, pick another one:

```bash
chroma run --port 8001
```

Update your client code to match the chosen host and port.

### Local workflow tips

- Use a dedicated data directory per environment so dev and test data do not mix.
- In tests, use disposable directories or clear collections between runs.
- Check that the server is running before debugging client-side collection errors.
