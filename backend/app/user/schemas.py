from pydantic import BaseModel, field_validator
from pydantic_core.core_schema import FieldValidationInfo
from pydantic import EmailStr


class UserSchema(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserRegister(UserSchema):
    confirm_password: str

    @field_validator("password")
    def password_valid(cls, v, info: FieldValidationInfo):
        if "password" in info.data and 8 > len(v) > 100:
            raise ValueError("password not valid")
        return v

    @field_validator("confirm_password")
    def passwords_match(cls, v, info: FieldValidationInfo):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("passwords do not match")
        return v
