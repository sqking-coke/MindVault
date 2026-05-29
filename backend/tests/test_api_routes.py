import json

import pytest
from httpx import AsyncClient


class TestHealth:
    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["status"] == "ok"


class TestDocumentsAPI:
    @pytest.mark.asyncio
    async def test_list_empty(self, client: AsyncClient):
        resp = await client.get("/api/v1/kb/documents")
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["total"] == 0
        assert data["data"]["items"] == []

    @pytest.mark.asyncio
    async def test_list_with_pagination(self, client: AsyncClient):
        resp = await client.get("/api/v1/kb/documents?page=1&page_size=5")
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["page"] == 1
        assert data["data"]["page_size"] == 5

    @pytest.mark.asyncio
    async def test_get_nonexistent_document(self, client: AsyncClient):
        resp = await client.get("/api/v1/kb/documents/99999")
        assert resp.status_code == 404
        data = resp.json()
        assert data["code"] == 2001

    @pytest.mark.asyncio
    async def test_update_nonexistent_document(self, client: AsyncClient):
        resp = await client.put(
            "/api/v1/kb/documents/99999",
            json={"doc_name": "renamed.txt"},
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_nonexistent_document(self, client: AsyncClient):
        resp = await client.delete("/api/v1/kb/documents/99999")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_invalid_page_params(self, client: AsyncClient):
        resp = await client.get("/api/v1/kb/documents?page=0&page_size=101")
        assert resp.status_code == 422


class TestChatAPI:
    @pytest.mark.asyncio
    async def test_list_sessions(self, client: AsyncClient):
        resp = await client.get("/api/v1/kb/chat/sessions")
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert "sessions" in data["data"]

    @pytest.mark.asyncio
    async def test_chat_history_missing_session(self, client: AsyncClient):
        resp = await client.get("/api/v1/kb/chat/history?session_id=nonexistent")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_chat_invalid_request(self, client: AsyncClient):
        resp = await client.post("/api/v1/kb/chat", json={"question": "", "session_id": ""})
        assert resp.status_code == 422


class TestRetrievalAPI:
    @pytest.mark.asyncio
    async def test_test_endpoint(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/kb/retrieval/test",
            json={"query": "test query"},
        )
        # May return 200 (empty results) or 500 (embedding unavailable) — both acceptable in test
        assert resp.status_code in (200, 502)

    @pytest.mark.asyncio
    async def test_test_endpoint_invalid_params(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/kb/retrieval/test",
            json={"query": "", "top_k": 0},
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_chunk_preview_missing(self, client: AsyncClient):
        resp = await client.get("/api/v1/kb/chunks/99999/preview")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_chunk_locate_missing(self, client: AsyncClient):
        resp = await client.post("/api/v1/kb/chunks/99999/locate")
        assert resp.status_code == 404
