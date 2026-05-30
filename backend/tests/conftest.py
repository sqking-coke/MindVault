import asyncio
import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Force test database URL before any app imports
os.environ.setdefault(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://mindvaults:mindvaults@localhost:5432/mindvaults_test",
)

TEST_DATABASE_URL = os.environ["TEST_DATABASE_URL"]


@pytest.fixture(scope="session")
def _test_db_url() -> str:
    return TEST_DATABASE_URL


@pytest.fixture(scope="session")
def _db_available(_test_db_url: str):
    """Check if the test database is reachable. Skip session if not."""
    import asyncio as _asyncio

    async def _check():
        try:
            engine = create_async_engine(_test_db_url, echo=False)
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            await engine.dispose()
            return True
        except Exception:
            return False

    try:
        loop = _asyncio.get_running_loop()
    except RuntimeError:
        loop = _asyncio.new_event_loop()
        _asyncio.set_event_loop(loop)

    ok = loop.run_until_complete(_check())
    if not ok:
        pytest.skip(
            f"Test database not available at {_test_db_url}. "
            "Set TEST_DATABASE_URL env var or start PostgreSQL + pgvector."
        )
    return True


@pytest_asyncio.fixture(loop_scope="session")
async def _engine(_test_db_url: str, _db_available):
    """Session-scoped async engine. Creates all tables once."""
    from app.models import Base

    engine = create_async_engine(_test_db_url, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        # Enable pgvector extension
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        except Exception:
            pass

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(loop_scope="session")
async def _session_factory(_engine):
    """Session-scoped async session factory."""
    return async_sessionmaker(_engine, expire_on_commit=False)


@pytest_asyncio.fixture
async def db_session(_session_factory) -> AsyncGenerator[AsyncSession, None]:
    """Per-test async DB session with automatic rollback."""
    async with _session_factory() as session:
        async with session.begin() as transaction:
            yield session
            await transaction.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """httpx AsyncClient wired to the FastAPI app with test DB override."""
    from app.main import app
    from app.core.database import get_db

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
