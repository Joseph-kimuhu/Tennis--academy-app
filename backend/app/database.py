from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Configure engine with connection pooling for production
engine_args = {}
if settings.DATABASE_URL.startswith("postgresql"):
    engine_args = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

engine = create_engine(settings.DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
