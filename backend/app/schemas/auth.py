from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.user import UserRead
from app.models.user import UserRole


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str
    role: UserRole | None = None

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip()


class ChangePasswordRequest(BaseModel):
    username: str | None = Field(
        default=None, min_length=7, max_length=16, pattern=r"^\+?[0-9]{7,15}$"
    )
    new_password: str | None = Field(default=None, min_length=6, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return "".join(character for character in value if character.isdigit())

    @model_validator(mode="after")
    def require_an_account_change(self) -> "ChangePasswordRequest":
        if self.username is None and self.new_password is None:
            raise ValueError("Provide a username or a new password")
        return self


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class PublicChangePasswordRequest(BaseModel):
    username: str = Field(min_length=8, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)
    role: UserRole | None = None

    @field_validator("username")
    @classmethod
    def normalize_phone_number(cls, value: str) -> str:
        return "".join(character for character in value if character.isdigit())


class AdminOverrideResetRequest(BaseModel):
    target_username: str = Field(min_length=8, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    new_password: str = Field(min_length=6, max_length=128)
    target_role: UserRole | None = None
    admin_username: str = Field(min_length=8, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    admin_password: str = Field(min_length=1, max_length=128)

    @field_validator("target_username", "admin_username")
    @classmethod
    def normalize_phone_numbers(cls, value: str) -> str:
        return "".join(character for character in value if character.isdigit())


class PasswordChangeResponse(BaseModel):
    message: str
    username: str