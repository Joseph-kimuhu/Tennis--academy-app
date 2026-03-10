#!/bin/bash
# Render startup script

# Run database migrations/setup if needed
python -c "from backend.app.database import engine, Base; from backend.app.models import *; Base.metadata.create_all(bind=engine)" || true

# Start the application
uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}
