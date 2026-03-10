#!/bin/bash
# Render startup script

set -e  # Exit on error

echo "Starting Tennis Academy Backend..."

# Run database migrations/setup if needed
echo "Setting up database..."
python3 -c "from backend.app.database import engine, Base; from backend.app.models import *; Base.metadata.create_all(bind=engine)" || echo "Database setup skipped or failed (non-critical)"

# Start the application
echo "Starting uvicorn server..."
exec uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}
