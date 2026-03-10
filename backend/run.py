#!/usr/bin/env python3
"""
Startup script for Render deployment.
This adds the parent directory to Python path so imports work correctly.
"""
import sys
from pathlib import Path

# Add parent directory to Python path
parent_dir = str(Path(__file__).parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Now import and run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=int(sys.argv[1]) if len(sys.argv) > 1 else 8000)
