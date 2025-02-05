from itsdangerous import URLSafeTimedSerializer
from loguru import logger
from app.settings import settings

serializer = URLSafeTimedSerializer(secret_key=settings.SECRET_KEY, salt="mail")


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
