import logging
import os
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.family import (
    FamilyCreate,
    FamilyCreateResponse,
    FamilyMember,
    FamilyResponse,
    FamilyUpdate,
    InviteCodeResponse,
    InviteMemberRequest,
    InviteResponse,
    JoinByTokenRequest,
    JoinFamilyRequest,
    JoinFamilyResponse,
    MessageResponse,
    PendingInvite,
    UpdateMemberRoleRequest,
)
from app.schemas.notification import EmailConfig
from app.services.family_service import FamilyService
from app.services.notification_providers import EmailProvider, build_family_invite_email
from app.utils.auth import get_current_user
from app.utils.i18n import translate_request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/families", tags=["Families"])


def require_admin(user: User, request: Request | None = None) -> None:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=translate_request(request, "error.admin_required"),
        )


def require_family_admin(user: User, request: Request | None = None) -> None:
    if user.family_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(request, "error.not_in_family"),
        )
    require_admin(user, request)


@router.get("/me", response_model=FamilyResponse)
async def get_my_family(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FamilyResponse:
    if current_user.family_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(request, "error.not_in_family"),
        )

    family_service = FamilyService(db)
    family = await family_service.get_user_family(current_user)

    if family is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(request, "error.family_not_found"),
        )

    pending_invites = await family_service.get_pending_invites(family)

    return FamilyResponse(
        id=family.id,
        name=family.name,
        invite_code=family.invite_code,
        members=[
            FamilyMember(
                id=m.id,
                display_name=m.display_name,
                email=m.email,
                avatar_url=m.avatar_url,
                role=m.role,
                created_at=m.created_at,
            )
            for m in family.members
            if m.is_active
        ],
        pending_invites=[
            PendingInvite(
                id=i.id,
                email=i.email,
                created_at=i.created_at,
                expires_at=i.expires_at,
            )
            for i in pending_invites
        ],
        created_at=family.created_at,
    )


@router.post("", response_model=FamilyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_family(
    family_data: FamilyCreate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FamilyCreateResponse:
    if current_user.family_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=translate_request(request, "error.already_in_family_leave_first"),
        )

    family_service = FamilyService(db)
    family = await family_service.create(current_user, family_data)
    await db.commit()

    return FamilyCreateResponse(
        id=family.id,
        name=family.name,
        invite_code=family.invite_code,
        role="admin",
    )


@router.patch("/me", response_model=FamilyResponse)
async def update_family(
    family_data: FamilyUpdate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FamilyResponse:
    require_family_admin(current_user, request)

    family_service = FamilyService(db)
    family = await family_service.get_user_family(current_user)

    if family is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(request, "error.family_not_found"),
        )

    family = await family_service.update(family, family_data)
    await db.commit()

    pending_invites = await family_service.get_pending_invites(family)

    return FamilyResponse(
        id=family.id,
        name=family.name,
        invite_code=family.invite_code,
        members=[
            FamilyMember(
                id=m.id,
                display_name=m.display_name,
                email=m.email,
                avatar_url=m.avatar_url,
                role=m.role,
                created_at=m.created_at,
            )
            for m in family.members
            if m.is_active
        ],
        pending_invites=[
            PendingInvite(
                id=i.id,
                email=i.email,
                created_at=i.created_at,
                expires_at=i.expires_at,
            )
            for i in pending_invites
        ],
        created_at=family.created_at,
    )


@router.post("/me/regenerate-code", response_model=InviteCodeResponse)
async def regenerate_invite_code(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InviteCodeResponse:
    require_family_admin(current_user, request)

    family_service = FamilyService(db)
    family = await family_service.get_user_family(current_user)

    if family is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(request, "error.family_not_found"),
        )

    new_code = await family_service.regenerate_invite_code(family)
    await db.commit()

    return InviteCodeResponse(invite_code=new_code)


@router.post("/join", response_model=JoinFamilyResponse)
async def join_family(
    join_body: JoinFamilyRequest,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> JoinFamilyResponse:
    if current_user.family_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=translate_request(http_request, "error.already_in_family_leave_first"),
        )

    family_service = FamilyService(db)
    family = await family_service.join_family(current_user, join_body.invite_code)

    if family is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.invalid_invite_code"),
        )

    await db.commit()

    return JoinFamilyResponse(
        family_id=family.id,
        family_name=family.name,
        role="member",
    )


@router.post("/join-by-token", response_model=JoinFamilyResponse)
async def join_family_by_token(
    join_body: JoinByTokenRequest,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> JoinFamilyResponse:
    if current_user.family_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=translate_request(http_request, "error.already_in_family_leave_first"),
        )

    family_service = FamilyService(db)
    invite = await family_service.get_invite_by_token(join_body.token)

    if invite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.invalid_or_expired_invite"),
        )

    if invite.email.lower() != current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=translate_request(http_request, "error.invite_wrong_email"),
        )

    family = await family_service.accept_invite_by_token(invite, current_user)
    await db.commit()

    if family is None:
        logger.error("Family %s not found after accepting invite %s", invite.family_id, invite.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translate_request(http_request, "error.family_not_found"),
        )

    return JoinFamilyResponse(
        family_id=family.id,
        family_name=family.name,
        role=current_user.role,
    )


@router.post("/me/leave", response_model=MessageResponse)
async def leave_family(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MessageResponse:
    if current_user.family_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(request, "error.not_in_family"),
        )

    family_service = FamilyService(db)
    success = await family_service.leave_family(current_user)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=translate_request(request, "error.cannot_leave_sole_admin"),
        )

    await db.commit()
    return MessageResponse(message="Left family successfully")


@router.post("/me/invite", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def invite_member(
    invite_data: InviteMemberRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> InviteResponse:
    require_family_admin(current_user, request)

    family_service = FamilyService(db)
    family = await family_service.get_user_family(current_user)

    if family is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(request, "error.family_not_found"),
        )

    invite = await family_service.create_invite(family, current_user, invite_data)
    await db.commit()

    app_url = os.getenv("APP_URL", "http://localhost:3000")
    provider = EmailProvider(EmailConfig(address=invite.email))
    if provider.is_configured():
        email = build_family_invite_email(
            to=invite.email,
            family_name=family.name,
            inviter_name=current_user.display_name,
            invite_token=invite.token,
            app_url=app_url,
        )
        result = await provider.send(email)
        if not result.get("success"):
            logger.warning("Failed to send family invite email: %s", result.get("error"))

    return InviteResponse(
        id=invite.id,
        email=invite.email,
        expires_at=invite.expires_at,
    )


@router.delete("/me/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_invite(
    invite_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    require_family_admin(current_user, request)

    family_service = FamilyService(db)
    invite = await family_service.get_invite_by_id(invite_id)

    if invite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(request, "error.invite_not_found"),
        )

    # Verify invite belongs to user's family
    if invite.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=translate_request(request, "error.invite_not_in_family"),
        )

    await family_service.cancel_invite(invite)
    await db.commit()


@router.patch("/me/members/{member_id}", response_model=FamilyMember)
async def update_member_role(
    member_id: UUID,
    body: UpdateMemberRoleRequest,
    http_request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FamilyMember:
    require_family_admin(current_user, http_request)

    if member_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=translate_request(http_request, "error.cannot_change_own_role"),
        )

    family_service = FamilyService(db)
    family = await family_service.get_user_family(current_user)

    if family is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.family_not_found"),
        )

    member = await family_service.update_member_role(family, member_id, body.role)

    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(http_request, "error.member_not_in_family"),
        )

    await db.commit()

    return FamilyMember(
        id=member.id,
        display_name=member.display_name,
        email=member.email,
        avatar_url=member.avatar_url,
        role=member.role,
        created_at=member.created_at,
    )


@router.delete("/me/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    member_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    require_family_admin(current_user, request)

    if member_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=translate_request(request, "error.cannot_remove_self_use_leave"),
        )

    family_service = FamilyService(db)
    family = await family_service.get_user_family(current_user)

    if family is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(request, "error.family_not_found"),
        )

    success = await family_service.remove_member(family, member_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate_request(request, "error.member_not_in_family"),
        )

    await db.commit()
