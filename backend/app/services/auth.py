from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.repositories.user import UserRepository


class AuthenticationError(Exception):
	pass


def normalize_phone_number(value: str) -> str:
	return "".join(character for character in value if character.isdigit())


async def authenticate_user(
	session: AsyncSession,
	username: str,
	password: str,
	role: UserRole | None = None,
) -> User:
	trimmed_username = username.strip()
	identifier = (
		normalize_phone_number(trimmed_username)
		if trimmed_username.lstrip("+").isdigit()
		else trimmed_username
	)
	repo = UserRepository(session)
	user = await repo.get_by_username(identifier, role)
	if user is None or not verify_password(password, user.password_hash):
		raise AuthenticationError("Invalid username or password")
	if not user.is_active:
		raise AuthenticationError("User account is inactive")
	return user


def issue_access_token(user: User) -> str:
	return create_access_token(
		user_id=user.id,
		username=user.username,
		role=user.role,
		property_id=user.property_id,
	)


def build_user(*, full_name: str, username: str, password: str, role: UserRole, email: str | None = None, property_id: int | None = None) -> User:
	return User(
		full_name=full_name,
		username=normalize_phone_number(username),
		email=email,
		password_hash=hash_password(password),
		role=role.value,
		property_id=property_id,
		is_active=True,
	)
