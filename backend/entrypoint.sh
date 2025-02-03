#!/bin/bash
set -e

# Install/update dependencies
echo "Installing/updating dependencies..."
poetry install --no-interaction --no-ansi

# Execute the command passed to the container
exec "$@"