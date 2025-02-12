from pydantic import BaseModel, field_validator
from pydantic_core.core_schema import FieldValidationInfo
from pydantic import EmailStr
from typing import Optional, Dict, Any


class PasswordValidation(BaseModel):
    password: str
    confirm_password: str

    @field_validator("password")
    def password_valid(cls, v, info: FieldValidationInfo):
        if "password" in info.data and not (8 <= len(v) <= 100):
            raise ValueError("password is invalid")
        return v

    @field_validator("confirm_password")
    def passwords_match(cls, v, info: FieldValidationInfo):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("passwords do not match")
        return v


class UserSchema(BaseModel):
    email: EmailStr
    username: str


class UserRegister(UserSchema, PasswordValidation):
    pass


class URLToken(BaseModel):
    token: str


class EmailData(BaseModel):
    email: EmailStr


class LoginData(BaseModel):
    username: str
    password: str


class ResponseModel(BaseModel):
    message: Optional[str] = None
    detail: Optional[str] = None
    data: Optional[Dict[Any, Any]] = None


class PasswordResetSchema(URLToken, PasswordValidation):
    pass
