from collections.abc import Callable
from pathlib import Path

from loguru import logger


async def parse_document(file_path: str, doc_type: str) -> list[tuple[str, int | None]]:
    """解析文档内容，返回 [(text, page_number), ...]。
    对于非 PDF 文档，page_number 为 None。
    """
    path = Path(file_path)
    if not path.exists():
        logger.error(f"文件不存在: {file_path}")
        return []

    parser = _PARSERS.get(doc_type)
    if parser is None:
        logger.warning(f"不支持的文档类型: {doc_type}，跳过解析")
        return []

    try:
        pages = await parser(path)
        if not pages:
            logger.warning(f"文档解析结果为空: {file_path}")
            return []
        return pages
    except Exception as exc:
        logger.error(f"文档解析失败: {file_path} — {exc}")
        return []


async def _parse_txt(path: Path) -> list[tuple[str, int | None]]:
    text = path.read_text(encoding="utf-8", errors="replace").strip()
    if not text:
        return []
    return [(text, None)]


async def _parse_md(path: Path) -> list[tuple[str, int | None]]:
    text = path.read_text(encoding="utf-8", errors="replace").strip()
    if not text:
        return []
    return [(text, None)]


async def _parse_pdf(path: Path) -> list[tuple[str, int | None]]:
    pages = await _parse_pdf_pypdf2(path)
    if pages:
        return pages
    # PyPDF2 失败，回退到 pdfplumber
    return await _parse_pdf_plumber(path)


async def _parse_pdf_pypdf2(path: Path) -> list[tuple[str, int | None]]:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        logger.warning("PyPDF2 未安装")
        return []

    try:
        reader = PdfReader(str(path))
    except Exception as exc:
        logger.warning(f"PyPDF2 打开 PDF 失败: {exc}")
        return []

    pages: list[tuple[str, int | None]] = []
    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text()
        except Exception:
            continue
        if text and text.strip():
            pages.append((text.strip(), i + 1))  # 1-based 页码
    return pages


async def _parse_pdf_plumber(path: Path) -> list[tuple[str, int | None]]:
    try:
        import pdfplumber
    except ImportError:
        logger.error("pdfplumber 未安装，无法回退解析 PDF")
        return []

    pages: list[tuple[str, int | None]] = []
    try:
        with pdfplumber.open(str(path)) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text and text.strip():
                    pages.append((text.strip(), i + 1))
    except Exception as exc:
        logger.error(f"pdfplumber 解析 PDF 失败: {exc}")
        return []
    return pages


async def _parse_docx(path: Path) -> list[tuple[str, int | None]]:
    try:
        from docx import Document
    except ImportError:
        logger.error("python-docx 未安装")
        return []

    doc = Document(str(path))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    text = "\n".join(paragraphs)
    if not text:
        return []
    return [(text, None)]


_PARSERS: dict[str, Callable[..., object]] = {
    "txt": _parse_txt,
    "md": _parse_md,
    "pdf": _parse_pdf,
    "docx": _parse_docx,
    "doc": _parse_docx,
}
