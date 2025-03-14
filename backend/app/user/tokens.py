from datetime import datetime, timezone, timedelta
import jwt
from itsdangerous import URLSafeTimedSerializer
from jwt import ExpiredSignatureError, InvalidTokenError
from loguru import logger

from app.settings import settings

serializer = URLSafeTimedSerializer(secret_key=settings.SECRET_KEY, salt="mail")


def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        seconds=settings.ACCESS_TOKEN_EXPIRE_SECONDS
    )
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token


def decode_token(token: str) -> dict:
    try:
        token_data = jwt.decode(
            jwt=token, key=settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return token_data
    except ExpiredSignatureError:
        raise ValueError("Token has expired")
    except InvalidTokenError:
        raise ValueError("Invalid token")
    except jwt.PyJWTError as e:
        logger.exception(e)
        return None


def create_url_safe_token(data: dict):
    token = serializer.dumps(data)
    return token


def decode_url_safe_token(token: str):
    try:
        token_data = serializer.loads(token)
        return token_data
    except Exception as e:
        logger.error(str(e))
        return None
