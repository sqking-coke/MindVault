import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import KbSession
from app.models.qa_record import KbQaRecord
from app.core.exceptions import SessionNotFoundError
from app.services.chat_service import (
    get_chat_history,
    list_sessions,
    _build_context,
    _classify_intent,
    _build_history,
)
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


class TestClassifyIntent:
    def test_knowledge_qa(self):
        assert _classify_intent("什么是 RAG") == "knowledge_qa"
        assert _classify_intent("如何配置向量数据库") == "knowledge_qa"
        assert _classify_intent("微服务架构设计") == "knowledge_qa"

    def test_document_lookup(self):
        assert _classify_intent("查找关于微服务的文档") == "document_lookup"
        assert _classify_intent("有哪些文档") == "document_lookup"

    def test_chitchat(self):
        assert _classify_intent("你好") == "chitchat"
        assert _classify_intent("谢谢你的帮助") == "chitchat"

    def test_default_to_knowledge_qa(self):
        assert _classify_intent("介绍一下你自己") == "knowledge_qa"


class TestBuildHistory:
    @pytest.mark.asyncio
    async def test_empty_history(self, db_session: AsyncSession):
        session = KbSession(session_id="uuid-empty", title="Empty")
        db_session.add(session)
        await db_session.commit()

        result = await _build_history(db_session, session.id)
        assert result == ""

    @pytest.mark.asyncio
    async def test_build_history(self, db_session: AsyncSession):
        session = KbSession(session_id="uuid-history", title="Test")
        db_session.add(session)
        await db_session.flush()

        r1 = KbQaRecord(
            session_id=session.id,
            question="什么是 RAG？",
            answer="RAG 是检索增强生成技术。",
            ref_chunks=[],
            model_name="qwen3",
        )
        r2 = KbQaRecord(
            session_id=session.id,
            question="它有什么优点？",
            answer="优点是提高准确性和可解释性。",
            ref_chunks=[],
            model_name="qwen3",
        )
        db_session.add_all([r1, r2])
        await db_session.commit()

        result = await _build_history(db_session, session.id)
        assert "对话历史" in result
        assert "什么是 RAG？" in result
        assert "RAG 是检索增强生成技术" in result
        assert "它有什么优点？" in result
        # earlier question should appear before later question
        idx1 = result.index("什么是 RAG？")
        idx2 = result.index("它有什么优点？")
        assert idx1 < idx2


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
