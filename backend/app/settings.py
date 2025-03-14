from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from pathlib import Path


class Settings(BaseSettings):
    # Redis settings
    REDIS_PORT: int
    REDIS_HOST: str

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # Security settings
    SECRET_KEY: str
    ALGORITHM: str
    PROJECT_NAME: str
    CORS_ORIGINS: List[AnyHttpUrl]
    DEBUG: bool

    # Domain settings
    DOMAIN: str

    # JWT settings
    ACCESS_TOKEN_EXPIRE_SECONDS: int

    # SMTP settings
    SMTP_USER: str
    SMTP_PASSWORD: str
    EMAILS_FROM_EMAIL: str
    SMTP_PORT: int
    SMTP_HOST: str
    EMAIL_FROM_NAME: str

    # PostgreSQL settings
    POSTGRES_PORT: int
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Mail settings
    VERIFY_MAIL_PATH: str

    @property
    def VERIFY_MAIL_URL(self) -> str:
        return f"https://{self.DOMAIN}{self.VERIFY_MAIL_PATH}"

    PASSWORD_RESET_PATH: str

    @property
    def PASSWORD_RESET_URL(self) -> str:
        return f"https://{self.DOMAIN}{self.PASSWORD_RESET_PATH}"

    BASE_DIR: Path = Path(__file__).resolve().parent
    ROOT_DIR: Path = Path(__file__).resolve().parent.parent

    class Config:
        case_sensitive = True
        env_prefix = ""


settings = Settings()
