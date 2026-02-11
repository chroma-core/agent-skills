# Chroma - Agent Skills

Official AI Agent skills from the Chroma team for building with Chroma.

## Installation

```sh
npx skills add chroma-core/agent-skills --skill "chroma"
```

The Chroma skill is able to help you integrate Chroma into your TypeScript or Python project and give you agent deeper understanding of Chroma's APIs.

Simply tell your agent `Add search to my project with Chroma`, the agent will ask you a few questions about how you want Chroma configured then get to work.

Check out the [Chroma docs](https://docs.trychroma.com) for more details about Chroma.

## Contributing

### Building

There is a build step to compile the code examples for both python and typescript versions of the skill examples.

```sh
bun run build
```

### New skill template

To add a new skill, you can run `$ bun run new` which will scaffhold the new skill markdown and code examples in the `src/` directory.

### Validation

To validate code examples, first set up the Python virtual environment:

```sh
uv venv .venv && uv pip install -r requirements.txt
# or without uv:
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

Then run validation:

```sh
bun run validate             # Run both TypeScript and Python validation
bun run validate:typescript  # TypeScript only
bun run validate:python      # Python only
```

### Pre commit hook

This repo uses [pre-commit](https://pre-commit.com/) to automatically run the build before each commit. To install the hook:

1. Install pre-commit if you haven't already:
```sh
pip install pre-commit
```

2. Install the git hook:
```sh
pre-commit install
```

Now the skills will be automatically built before each commit.
