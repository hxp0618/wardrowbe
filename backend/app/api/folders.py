"""Folder API — wardrobe organisation (flat M2M grouping)."""
import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.folder import Folder, item_folders
from app.models.item import ClothingItem
from app.models.user import User
from app.schemas.folder import (
    FolderCreate,
    FolderItemsUpdate,
    FolderReorderRequest,
    FolderResponse,
    FolderUpdate,
)
from app.utils.auth import get_current_user
from app.utils.i18n import translate_request

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/folders", tags=["Folders"])


async def _folder_with_count(db: AsyncSession, folder: Folder) -> FolderResponse:
    count_result = await db.execute(
        select(func.count()).select_from(item_folders).where(item_folders.c.folder_id == folder.id)
    )
    item_count = count_result.scalar() or 0
    resp = FolderResponse.model_validate(folder)
    resp.item_count = item_count
    return resp


@router.get("", response_model=list[FolderResponse])
async def list_folders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[FolderResponse]:
    result = await db.execute(
        select(Folder)
        .where(Folder.user_id == current_user.id)
        .order_by(Folder.position.asc(), Folder.name.asc())
    )
    folders = list(result.scalars().all())

    if not folders:
        return []

    # Count items per folder in a single query.
    count_result = await db.execute(
        select(item_folders.c.folder_id, func.count(item_folders.c.item_id))
        .where(item_folders.c.folder_id.in_([f.id for f in folders]))
        .group_by(item_folders.c.folder_id)
    )
    counts: dict[UUID, int] = {row[0]: row[1] for row in count_result.all()}

    responses: list[FolderResponse] = []
    for folder in folders:
        resp = FolderResponse.model_validate(folder)
        resp.item_count = counts.get(folder.id, 0)
        responses.append(resp)
    return responses


@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    payload: FolderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FolderResponse:
    folder = Folder(
        user_id=current_user.id,
        name=payload.name.strip(),
        icon=payload.icon,
        color=payload.color,
        position=payload.position,
    )
    db.add(folder)
    await db.flush()
    await db.refresh(folder)
    return await _folder_with_count(db, folder)


async def _get_folder_or_404(
    folder_id: UUID,
    user_id: UUID,
    db: AsyncSession,
    http_request: Request,
) -> Folder:
    result = await db.execute(
        select(Folder).where(and_(Folder.id == folder_id, Folder.user_id == user_id))
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.folder_not_found"),
        )
    return folder


@router.patch("/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: UUID,
    payload: FolderUpdate,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FolderResponse:
    folder = await _get_folder_or_404(folder_id, current_user.id, db, http_request)

    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] is not None:
        data["name"] = data["name"].strip()
    for field, value in data.items():
        setattr(folder, field, value)
    await db.flush()
    await db.refresh(folder)
    return await _folder_with_count(db, folder)


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: UUID,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    folder = await _get_folder_or_404(folder_id, current_user.id, db, http_request)
    # Deleting the folder cascades the association rows via ON DELETE CASCADE on item_folders.
    await db.delete(folder)
    await db.flush()


async def _fetch_user_items(
    db: AsyncSession,
    user_id: UUID,
    item_ids: list[UUID],
) -> list[ClothingItem]:
    if not item_ids:
        return []
    result = await db.execute(
        select(ClothingItem)
        .where(and_(ClothingItem.user_id == user_id, ClothingItem.id.in_(item_ids)))
        .options(selectinload(ClothingItem.folders))
    )
    return list(result.scalars().all())


@router.post("/{folder_id}/items", response_model=FolderResponse)
async def add_items_to_folder(
    folder_id: UUID,
    payload: FolderItemsUpdate,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FolderResponse:
    folder = await _get_folder_or_404(folder_id, current_user.id, db, http_request)
    await db.refresh(folder, ["items"])

    items = await _fetch_user_items(db, current_user.id, payload.item_ids)
    existing = {i.id for i in folder.items}
    for item in items:
        if item.id not in existing:
            folder.items.append(item)
    await db.flush()
    return await _folder_with_count(db, folder)


@router.delete("/{folder_id}/items", response_model=FolderResponse)
async def remove_items_from_folder(
    folder_id: UUID,
    payload: FolderItemsUpdate,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FolderResponse:
    folder = await _get_folder_or_404(folder_id, current_user.id, db, http_request)
    await db.refresh(folder, ["items"])
    remove_set = set(payload.item_ids)
    folder.items = [i for i in folder.items if i.id not in remove_set]
    await db.flush()
    return await _folder_with_count(db, folder)


@router.post("/reorder", response_model=list[FolderResponse])
async def reorder_folders(
    payload: FolderReorderRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[FolderResponse]:
    result = await db.execute(select(Folder).where(Folder.user_id == current_user.id))
    folders_by_id = {f.id: f for f in result.scalars().all()}
    for position, fid in enumerate(payload.folder_ids):
        folder = folders_by_id.get(fid)
        if folder:
            folder.position = position
    await db.flush()
    return await list_folders(db, current_user)
