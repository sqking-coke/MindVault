import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import KbSession
from app.models.qa_record import KbQaRecord
from app.core.exceptions import SessionNotFoundError
from app.services.chat_service import get_chat_history, list_sessions, _build_context
from app.schemas.chat import RefChunk


class TestBuildContext:
    def test_empty_chunks(self):
        ctx = _build_context([])
        assert ctx == ""

    def test_single_chunk(self):
        chunks = [RefChunk(chunk_id=1, doc_name="doc.txt", content="hello world", similarity=0.95, page=None)]
        ctx = _build_context(chunks)
        assert "[1] 来源: doc.txt" in ctx
        assert "hello world" in ctx

    def test_multiple_chunks(self):
        chunks = [
            RefChunk(chunk_id=1, doc_name="a.txt", content="aaa", similarity=0.99, page=1),
            RefChunk(chunk_id=2, doc_name="b.txt", content="bbb", similarity=0.88, page=2),
        ]
        ctx = _build_context(chunks)
        assert "[1] 来源: a.txt" in ctx
        assert "[2] 来源: b.txt" in ctx
        assert "aaa" in ctx
        assert "bbb" in ctx


class TestGetChatHistory:
    @pytest.mark.asyncio
    async def test_missing_session_raises(self, db_session: AsyncSession):
        with pytest.raises(SessionNotFoundError):
            await get_chat_history(db_session, "nonexistent-session-id")


class TestListSessions:
    @pytest.mark.asyncio
    async def test_empty_sessions(self, db_session: AsyncSession):
        result = await list_sessions(db_session)
        assert result.sessions == []

    @pytest.mark.asyncio
    async def test_list_sessions(self, db_session: AsyncSession):
        s1 = KbSession(session_id="uuid-1", title="Session 1")
        s2 = KbSession(session_id="uuid-2", title="Session 2")
        db_session.add_all([s1, s2])
        await db_session.commit()

        result = await list_sessions(db_session)
        assert len(result.sessions) == 2
        ids = {s.session_id for s in result.sessions}
        assert ids == {"uuid-1", "uuid-2"}
