import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.config import KbConfig
from app.models.chunk import KbChunk
from app.models.document import KbDocument, DOC_STATUS_COMPLETED
from app.services.retrieval_service import get_config, retrieve_chunks


class TestGetConfig:
    @pytest.mark.asyncio
    async def test_creates_default_config(self, db_session: AsyncSession):
        cfg = await get_config(db_session)
        assert cfg is not None
        assert cfg.id == 1
        assert cfg.top_k == 5
        assert cfg.similarity_threshold == 0.7
        assert cfg.chunk_size == 500
        assert cfg.chunk_overlap == 50
        assert cfg.embedding_dim == 1024

    @pytest.mark.asyncio
    async def test_returns_existing_config(self, db_session: AsyncSession):
        cfg1 = await get_config(db_session)
        cfg1.top_k = 10
        await db_session.commit()

        cfg2 = await get_config(db_session)
        assert cfg2.top_k == 10
        assert cfg2.id == 1


class TestRetrieveChunks:
    @pytest.mark.asyncio
    async def test_no_documents_returns_empty(self, db_session: AsyncSession):
        embedding = [0.1] * 1024
        results = await retrieve_chunks(db_session, embedding)
        assert results == []

    @pytest.mark.asyncio
    async def test_no_matching_embedding_returns_empty(self, db_session: AsyncSession):
        doc = KbDocument(doc_name="test.txt", doc_type="txt", file_path="/tmp/test.txt",
                         status=DOC_STATUS_COMPLETED, chunk_count=1)
        db_session.add(doc)
        await db_session.flush()

        # very different embedding — won't pass similarity threshold
        chunk_emb = [0.9] * 1024
        chunk = KbChunk(document_id=doc.id, chunk_index=0, content="hello", embedding=chunk_emb)
        db_session.add(chunk)
        await db_session.commit()

        query_emb = [-0.9] * 1024  # opposite direction
        results = await retrieve_chunks(db_session, query_emb)
        assert results == []
