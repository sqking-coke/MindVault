from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.models.document import KbDocument, DOC_STATUS_FAILED, DOC_STATUS_PROCESSING, DOC_STATUS_COMPLETED  # noqa: E402, F401
from app.models.chunk import KbChunk  # noqa: E402, F401
from app.models.session import KbSession  # noqa: E402, F401
from app.models.qa_record import KbQaRecord  # noqa: E402, F401
from app.models.config import KbConfig  # noqa: E402, F401

__all__ = ["Base", "KbDocument", "KbChunk", "KbSession", "KbQaRecord", "KbConfig"]
