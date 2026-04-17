"""Pydantic schemas for Folder endpoints."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FolderBase(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    icon: str | None = Field(None, max_length=32)
    color: str | None = Field(None, max_length=16)
    position: int = Field(default=0, ge=0)


class FolderCreate(FolderBase):
    pass


class FolderUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    icon: str | None = Field(None, max_length=32)
    color: str | None = Field(None, max_length=16)
    position: int | None = Field(None, ge=0)


class FolderRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    icon: str | None = None
    color: str | None = None


class FolderResponse(FolderBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    item_count: int = 0
    created_at: datetime
    updated_at: datetime


class FolderItemsUpdate(BaseModel):
    """Request to add/remove items from a folder."""

    item_ids: list[UUID] = Field(min_length=1)


class FolderReorderRequest(BaseModel):
    folder_ids: list[UUID] = Field(min_length=1)
