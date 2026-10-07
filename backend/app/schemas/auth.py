from pydantic import BaseModel, Field, field_validator

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    username: str = Field(
        min_length=8,
        max_length=16,
        pattern=r"^\+?[0-9]{7,15}$",
    )
    password: str

    @field_validator("username")
    @classmethod
    def normalize_phone_number(cls, value: str) -> str:
        return "".join(character for character in value if character.isdigit())


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class PublicChangePasswordRequest(BaseModel):
    username: str = Field(min_length=8, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_phone_number(cls, value: str) -> str:
        return "".join(character for character in value if character.isdigit())


class AdminOverrideResetRequest(BaseModel):
    target_username: str = Field(min_length=8, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    new_password: str = Field(min_length=6, max_length=128)
    admin_username: str = Field(min_length=8, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    admin_password: str = Field(min_length=1, max_length=128)

    @field_validator("target_username", "admin_username")
    @classmethod
    def normalize_phone_numbers(cls, value: str) -> str:
        return "".join(character for character in value if character.isdigit())


class PasswordChangeResponse(BaseModel):
    message: str
    username: str