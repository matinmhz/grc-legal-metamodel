FROM mcr.microsoft.com/devcontainers/python:1-3.12-bookworm

ENV PYTHONUNBUFFERED=1 

# Install the TOML-declared dependencies into the container, never the host.
COPY pyproject.toml /tmp/metamodel-deps/pyproject.toml
RUN python -m pip install --no-cache-dir '/tmp/metamodel-deps[dev]'
