"""Folder model for organising wardrobe items into user-defined groups.

Folders are a many-to-many grouping (a single item can belong to 0 or many
folders) and are intentionally flat — there is no nesting — to keep the UI
simple. Folders are orthogonal to the existing type/color/status filters.
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.item import ClothingItem
    from app.models.user import User


# Association table for Folder <-> ClothingItem many-to-many relationship.
item_folders = Table(
    "item_folders",
    Base.metadata,
    Column(
        "item_id",
        UUID(as_uuid=True),
        ForeignKey("clothing_items.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "folder_id",
        UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "created_at",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    ),
)


class Folder(Base):
    __tablename__ = "folders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(50), nullable=False)
    # Emoji or lucide icon name; purely visual.
    icon: Mapped[str | None] = mapped_column(String(32))
    # Hex color (e.g. #7C3AED) or tailwind token — UI decides how to render.
    color: Mapped[str | None] = mapped_column(String(16))
    # Lower = earlier in sort order; ties broken by name.
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="folders")
    items: Mapped[list["ClothingItem"]] = relationship(
        "ClothingItem",
        secondary=item_folders,
        back_populates="folders",
        lazy="selectin",
    )
