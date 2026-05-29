import pytest
from app.services.chunking_service import chunk_text, _fixed_chunk


class TestFixedChunk:
    def test_empty_text(self):
        assert _fixed_chunk("", 500, 50) == []

    def test_whitespace_only(self):
        assert _fixed_chunk("   ", 500, 50) == []

    def test_single_chunk(self):
        result = _fixed_chunk("hello world", 500, 50)
        assert result == ["hello world"]

    def test_multiple_chunks(self):
        text = "a" * 500 + "b" * 500
        result = _fixed_chunk(text, 500, 50)
        assert len(result) == 3
        assert result[0] == "a" * 500
        assert result[1] == ("a" * 50 + "b" * 450)  # overlap: start at 450
        assert result[2] == "b" * 100  # rest: 900..1000

    def test_exact_boundary(self):
        text = "1234567890"
        result = _fixed_chunk(text, 5, 2)
        assert result == ["12345", "45678", "7890"]

    def test_chunk_smaller_than_overlap(self):
        text = "abc"
        result = _fixed_chunk(text, 10, 5)
        assert result == ["abc"]


class TestChunkText:
    @pytest.mark.asyncio
    async def test_default_fixed_mode(self):
        text = "hello world this is a test"
        result = await chunk_text(text, chunk_size=10, chunk_overlap=2)
        assert len(result) > 0
        assert all(isinstance(c, str) for c in result)

    @pytest.mark.asyncio
    async def test_empty_text(self):
        assert await chunk_text("") == []
        assert await chunk_text("   ") == []

    @pytest.mark.asyncio
    async def test_semantic_mode(self):
        text = "段落一内容。\n\n段落二内容。\n\n段落三内容。"
        result = await chunk_text(text, chunk_size=500, chunk_overlap=50, mode="semantic")
        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_semantic_mode_empty(self):
        result = await chunk_text("", chunk_size=500, chunk_overlap=50, mode="semantic")
        assert result == []
