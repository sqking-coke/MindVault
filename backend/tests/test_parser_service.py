import tempfile
from pathlib import Path

import pytest
from app.services.parser_service import parse_document


class TestParseDocument:
    @pytest.mark.asyncio
    async def test_parse_txt(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write("hello world\nthis is a test")
            tmp_path = f.name

        try:
            result = await parse_document(tmp_path, "txt")
            assert "hello world" in result
            assert "this is a test" in result
        finally:
            Path(tmp_path).unlink()

    @pytest.mark.asyncio
    async def test_parse_md(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False, encoding="utf-8") as f:
            f.write("# Title\n\nSome content here.")
            tmp_path = f.name

        try:
            result = await parse_document(tmp_path, "md")
            assert "Title" in result
            assert "Some content" in result
        finally:
            Path(tmp_path).unlink()

    @pytest.mark.asyncio
    async def test_file_not_found(self):
        result = await parse_document("/nonexistent/path/file.txt", "txt")
        assert result == ""

    @pytest.mark.asyncio
    async def test_unsupported_type(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".xyz", delete=False, encoding="utf-8") as f:
            f.write("test")
            tmp_path = f.name

        try:
            result = await parse_document(tmp_path, "xyz")
            assert result == ""
        finally:
            Path(tmp_path).unlink()

    @pytest.mark.asyncio
    async def test_empty_file(self):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write("")
            tmp_path = f.name

        try:
            result = await parse_document(tmp_path, "txt")
            assert result == ""
        finally:
            Path(tmp_path).unlink()
