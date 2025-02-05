from fastapi import APIRouter, Depends, status, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.db_helper import db_helper
from .hash import get_password_hash
from .schemas import UserRegister, UserLogin, URLToken
from app.database.models import User, Player
from app.utils.mail import send_verification_mail
from app.settings import settings
from .tokens import create_url_safe_token, decode_url_safe_token

router = APIRouter(prefix="/user", tags=["users"])


@router.post("/register")
async def register(
        user_data: UserRegister,
        background_tasks: BackgroundTasks,
        session: AsyncSession = Depends(db_helper.session_dependency)
):
    user_exists = await User.find_by_email_username(session, user_data.email, user_data.username)

    if user_exists is not None:
        if user_exists.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already registered",
            )

        if user_exists.username == user_data.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already registered",
            )

    user_data = user_data.model_dump(exclude={"confirm_password"})
    user_data["password"] = get_password_hash(user_data["password"])

    user = User(**user_data)

    player = Player()
    user.player = player

    session.add(user)
    await session.commit()

    token = create_url_safe_token({"email": user_data["email"], "id": str(user.id)})
    link = f"{settings.VERIFY_MAIL_URL}/{token}/"

    await send_verification_mail(background_tasks, user.email, link)

    return {"message": "Account Created! Check email to verify your account"}


@router.post("/verify")
async def verify(token: URLToken, session: AsyncSession = Depends(db_helper.session_dependency)):
    token_data = decode_url_safe_token(token.token)
    user = await User.find_by_id(session, int(token_data["id"]))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token",
        )

    user.is_verified = True
    await session.commit()
    return {"message": "Account verified, you can login now"}


@router.post("/login")
async def login(
        login_data: UserLogin,
        session: AsyncSession = Depends(db_helper.session_dependency)
):
    user = await User.authenticate(session,
                                   password=login_data.password,
                                   email=login_data.email,
                                   username=login_data.username
                                   )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if user.is_verified is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account not verified",
        )
