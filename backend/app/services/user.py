import json
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.services.auth import build_user, normalize_phone_number


class DuplicateUsernameError(Exception):
    pass


class InvalidCurrentPasswordError(Exception):
    pass


class UserNotFoundError(Exception):
    pass


class UnauthorizedAdminError(Exception):
    pass


async def create_user(
    session: AsyncSession,
    *,
    full_name: str,
    username: str,
    password: str,
    role: UserRole,
    email: str | None = None,
    property_id: int | None = None,
) -> User:
    username = normalize_phone_number(username)
    if not 7 <= len(username) <= 15:
    	raise ValueError("User phone number must contain 7 to 15 digits")
    repository = UserRepository(session)
    if await repository.get_by_username(username, role) is not None:
        raise DuplicateUsernameError("Username is already in use")
    user = build_user(full_name=full_name, username=username, password=password, role=role, email=email, property_id=property_id)
    try:
        await repository.add(user)
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DuplicateUsernameError("Username or email is already in use") from exc
    await session.refresh(user)
    return user


async def update_user(
    session: AsyncSession,
    user: User,
    *,
    full_name: str | None = None,
    username: str | None = None,
    email: str | None = None,
    role: UserRole | None = None,
    is_active: bool | None = None,
) -> User:
    repository = UserRepository(session)
    if username is not None:
        clean_username = normalize_phone_number(username)
        if not 7 <= len(clean_username) <= 15:
            raise ValueError("User phone number must contain 7 to 15 digits")
        if clean_username != user.username.lower():
            target_role = role or UserRole(user.role)
            existing = await repository.get_by_username(clean_username, target_role)
            if existing is not None and existing.id != user.id:
                raise DuplicateUsernameError("Username is already in use")
            user.username = clean_username
    if full_name is not None:
        user.full_name = full_name.strip()
    if email is not None:
        clean_email = email.strip() or None
        if clean_email is not None and (user.email is None or clean_email.lower() != user.email.lower()):
            existing_email = await repository.get_by_email(clean_email)
            if existing_email is not None and existing_email.id != user.id:
                raise DuplicateUsernameError("Email is already in use by another user")
        user.email = clean_email
    if role is not None:
        user.role = role.value
    if is_active is not None:
        user.is_active = is_active
    try:
        await session.commit()
        await session.refresh(user)
    except IntegrityError as exc:
        await session.rollback()
        raise DuplicateUsernameError("Username or email is already in use") from exc
    return user


async def change_password(
    session: AsyncSession,
    user: User,
    *,
    new_password: str | None = None,
    username: str | None = None,
) -> User:
    old_username = user.username
    if username is not None:
        clean_username = normalize_phone_number(username)
        if not 7 <= len(clean_username) <= 15:
            raise ValueError("User phone number must contain 7 to 15 digits")
        if clean_username != user.username:
            repository = UserRepository(session)
            existing = await repository.get_by_username(
                clean_username, UserRole(user.role)
            )
            if existing is not None and existing.id != user.id:
                raise DuplicateUsernameError("Username is already in use")
            user.username = clean_username
            session.add(
                AuditLog(
                    user_id=user.id,
                    action="STAFF_USERNAME_CHANGED",
                    entity_type="User",
                    entity_id=user.id,
                    details=json.dumps({
                        "old_username": old_username,
                        "new_username": clean_username,
                    }),
                )
            )

    if new_password is not None:
        user.password_hash = hash_password(new_password)
        user.password_changed_at = datetime.now(timezone.utc)
        session.add(
            AuditLog(
                user_id=user.id,
                action="STAFF_PASSWORD_CHANGED",
                entity_type="User",
                entity_id=user.id,
                details=json.dumps({"username": user.username}),
            )
        )
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise DuplicateUsernameError("Username is already in use") from exc
    await session.refresh(user)
    return user


async def set_password(
    session: AsyncSession,
    user: User,
    *,
    new_password: str,
    actor_id: int,
) -> User:
    user.password_hash = hash_password(new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    session.add(
        AuditLog(
            property_id=user.property_id,
            user_id=actor_id,
            action="STAFF_PASSWORD_RESET",
            entity_type="User",
            entity_id=user.id,
            details=json.dumps({"target_username": user.username}),
        )
    )
    await session.commit()
    await session.refresh(user)
    return user


async def _find_user(
    repo: UserRepository,
    username: str,
    role: UserRole | None = None,
) -> User | None:
    identifier = normalize_phone_number(username)
    return await repo.get_by_username(identifier, role) if identifier else None


async def public_change_password(
    session: AsyncSession,
    *,
    username: str,
    current_password: str,
    new_password: str,
    role: UserRole | None = None,
) -> User:
    repository = UserRepository(session)
    user = await _find_user(repository, username, role)
    if user is None or not user.is_active:
        raise InvalidCurrentPasswordError("Invalid username or password")
    if not verify_password(current_password, user.password_hash):
        raise InvalidCurrentPasswordError("Invalid username or password")

    user.password_hash = hash_password(new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    session.add(
        AuditLog(
            user_id=user.id,
            action="STAFF_PASSWORD_CHANGED",
            entity_type="User",
            entity_id=user.id,
            details=json.dumps({"username": user.username}),
        )
    )
    await session.commit()
    await session.refresh(user)
    return user


async def admin_override_reset_password(
    session: AsyncSession,
    *,
    target_username: str,
    new_password: str,
    admin_username: str,
    admin_password: str,
    target_role: UserRole | None = None,
) -> User:
    repository = UserRepository(session)
    admin_user = await _find_user(repository, admin_username, UserRole.ADMIN)
    if admin_user is None or not admin_user.is_active:
        raise UnauthorizedAdminError("Admin credentials are invalid")
    if admin_user.role != UserRole.ADMIN.value:
        raise UnauthorizedAdminError("Only administrators can authorize a password reset")
    if not verify_password(admin_password, admin_user.password_hash):
        raise UnauthorizedAdminError("Admin credentials are invalid")

    target_user = await _find_user(repository, target_username, target_role)
    if target_user is None:
        raise UserNotFoundError(f"User '{target_username}' not found")

    target_user.password_hash = hash_password(new_password)
    target_user.password_changed_at = datetime.now(timezone.utc)
    session.add(
        AuditLog(
            user_id=admin_user.id,
            action="STAFF_PASSWORD_RESET_BY_ADMIN",
            entity_type="User",
            entity_id=target_user.id,
            details=json.dumps({
                "target_username": target_user.username,
                "target_user_id": target_user.id,
                "authorized_by_admin": admin_user.username,
            }),
        )
    )
    await session.commit()
    await session.refresh(target_user)
    return target_user