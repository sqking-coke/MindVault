from datetime import datetime

from sqlalchemy import Integer, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class KbConfig(Base):
    __tablename__ = "kb_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    embedding_dim: Mapped[int] = mapped_column(Integer, default=1024, nullable=False)
    chunk_size: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    chunk_overlap: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    top_k: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    similarity_threshold: Mapped[float] = mapped_column(Float, default=0.7, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
