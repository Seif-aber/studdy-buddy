#!/bin/bash

# Start the FastAPI backend server
echo "Starting AI Study Buddy Backend..."
echo "Server will be available at: http://localhost:8000"
echo ""

cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# Start server with uvicorn
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
