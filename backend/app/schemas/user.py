from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user import UserRole


class UserCreate(BaseModel):
    property_id: int | None = None
    full_name: str = Field(min_length=1, max_length=200)
    username: str = Field(min_length=8, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    email: str | None = Field(default=None, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    role: UserRole

    @field_validator("username")
    @classmethod
    def normalize_phone_number(cls, value: str) -> str:
        return "".join(character for character in value if character.isdigit())


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    username: str | None = Field(default=None, min_length=8, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    email: str | None = Field(default=None, max_length=255)
    role: UserRole | None = None
    is_active: bool | None = None

    @field_validator("username")
    @classmethod
    def normalize_phone_number(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return "".join(character for character in value if character.isdigit())


class UserPasswordUpdate(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    property_id: int | None = None
    property_name: str | None = None
    full_name: str
    username: str
    email: str | None = None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime