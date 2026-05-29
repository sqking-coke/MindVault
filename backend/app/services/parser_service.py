from collections.abc import Callable
from pathlib import Path

from loguru import logger


async def parse_document(file_path: str, doc_type: str) -> str:
    """解析文档内容，返回纯文本。doc_type: txt/md/pdf/docx/doc。"""
    path = Path(file_path)
    if not path.exists():
        logger.error(f"文件不存在: {file_path}")
        return ""

    parser = _PARSERS.get(doc_type)
    if parser is None:
        logger.warning(f"不支持的文档类型: {doc_type}，跳过解析")
        return ""

    try:
        text = await parser(path)
        if not text or not text.strip():
            logger.warning(f"文档解析结果为空: {file_path}")
            return ""
        return text.strip()
    except Exception as exc:
        logger.error(f"文档解析失败: {file_path} — {exc}")
        return ""


async def _parse_txt(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


async def _parse_md(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


async def _parse_pdf(path: Path) -> str:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        logger.error("PyPDF2 未安装")
        return ""

    reader = PdfReader(str(path))
    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n\n".join(pages)


async def _parse_docx(path: Path) -> str:
    try:
        from docx import Document
    except ImportError:
        logger.error("python-docx 未安装")
        return ""

    doc = Document(str(path))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


_PARSERS: dict[str, Callable[..., object]] = {
    "txt": _parse_txt,
    "md": _parse_md,
    "pdf": _parse_pdf,
    "docx": _parse_docx,
    "doc": _parse_docx,
}
