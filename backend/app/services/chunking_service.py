from loguru import logger


async def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50,
    mode: str = "fixed",
) -> list[str]:
    """将文本拆分为切片列表。mode: fixed（固定长度）| semantic（语义边界）。"""
    if not text or not text.strip():
        return []

    if mode == "semantic":
        return await _semantic_chunk(text, chunk_size, chunk_overlap)
    return _fixed_chunk(text, chunk_size, chunk_overlap)


def _fixed_chunk(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """固定长度切片，按 chunk_size 字符切分，overlap 重叠。"""
    chunks: list[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= text_len:
            break
        start = end - chunk_overlap

    return chunks


async def chunk_pages(
    pages: list[tuple[str, int | None]],
    chunk_size: int = 500,
    chunk_overlap: int = 50,
    mode: str = "fixed",
) -> list[tuple[str, int | None]]:
    """逐页切片，保留页码信息。返回 [(chunk_text, page_number), ...]。
    页码为 None 表示该切片来自非分页文档。
    """
    all_chunks: list[tuple[str, int | None]] = []
    for page_text, page_num in pages:
        chunks = await chunk_text(page_text, chunk_size, chunk_overlap, mode)
        for chunk in chunks:
            all_chunks.append((chunk, page_num))
    return all_chunks


async def _semantic_chunk(
    text: str, chunk_size: int, chunk_overlap: int
) -> list[str]:
    """基于语义边界的切片，优先按段落/句子边界拆分。"""
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
    except ImportError:
        logger.warning("langchain-text-splitters 未安装，回退到固定切片")
        return _fixed_chunk(text, chunk_size, chunk_overlap)

    # 使用 RecursiveCharacterTextSplitter 按分隔符优先级拆分
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", "。", ".", "！", "？", "，", ",", " ", ""],
        length_function=len,
    )
    docs = splitter.create_documents([text])
    chunks = [doc.page_content.strip() for doc in docs if doc.page_content.strip()]
    return chunks
