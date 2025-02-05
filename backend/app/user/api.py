from fastapi import APIRouter, Depends, status, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.db_helper import db_helper
from .hash import get_password_hash
from .schemas import UserRegister
from app.database.models import User, Player
from app.utils.mail import send_verification_mail
from app.settings import settings
from .tokens import create_url_safe_token

router = APIRouter(prefix="/user", tags=["users"])


@router.post("/register")
async def register(
        user_data: UserRegister,
        background_tasks: BackgroundTasks,
        session: AsyncSession = Depends(db_helper.session_dependency)
):
    user_exists = await User.select_by_email_username(session, user_data.email, user_data.username)

    if user_exists is not None:
        if user_exists.email == user_data.email:
            return JSONResponse(
                content={"detail": ["This email is already registered"]},
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if user_exists.username == user_data.username:
            return JSONResponse(
                content={"detail": ["This username is already registered"]},
                status_code=status.HTTP_400_BAD_REQUEST
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
