"""Initial schema — kb_documents, kb_chunks, kb_sessions, kb_qa_records, kb_config

Revision ID: 0001
Revises:
Create Date: 2026-05-29

启用 pgvector 扩展，创建所有核心业务表，并在 kb_chunks.embedding 上建立 HNSW 索引。
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


revision: str = "0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. pgvector 扩展
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 2. kb_documents
    op.create_table(
        "kb_documents",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("doc_name", sa.String(255), nullable=False),
        sa.Column("doc_type", sa.String(10), nullable=False),
        sa.Column("doc_desc", sa.Text(), nullable=True),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("status", sa.Integer(), server_default="1", nullable=False),
        sa.Column("chunk_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # 3. kb_sessions
    op.create_table(
        "kb_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.String(36), nullable=False),
        sa.Column("title", sa.String(255), server_default="新对话", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )

    # 4. kb_chunks (pgvector embedding + FK -> kb_documents)
    op.create_table(
        "kb_chunks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("kb_documents.id"), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(1024), nullable=False),
        sa.Column("page", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # HNSW index for cosine_distance search
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_kb_chunks_embedding_hnsw "
        "ON kb_chunks USING hnsw (embedding vector_cosine_ops) "
        "WITH (m = 16, ef_construction = 200)"
    )

    # 5. kb_qa_records (FK -> kb_sessions, JSONB ref_chunks)
    op.create_table(
        "kb_qa_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("kb_sessions.id"), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("ref_chunks", sa.dialects.postgresql.JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("model_name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # 6. kb_config (单行配置表)
    op.create_table(
        "kb_config",
        sa.Column("id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("embedding_dim", sa.Integer(), server_default="1024", nullable=False),
        sa.Column("chunk_size", sa.Integer(), server_default="500", nullable=False),
        sa.Column("chunk_overlap", sa.Integer(), server_default="50", nullable=False),
        sa.Column("top_k", sa.Integer(), server_default="5", nullable=False),
        sa.Column("similarity_threshold", sa.Float(), server_default="0.7", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # 插入默认配置行
    op.execute(
        "INSERT INTO kb_config (id) VALUES (1) "
        "ON CONFLICT (id) DO NOTHING"
    )


def downgrade() -> None:
    op.drop_table("kb_qa_records")
    op.drop_table("kb_chunks")
    op.drop_table("kb_documents")
    op.drop_table("kb_sessions")
    op.drop_table("kb_config")
