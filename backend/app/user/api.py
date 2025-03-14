from fastapi import APIRouter, Depends, status, BackgroundTasks, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import db_helper
from .cookie import oauth2_scheme
from .hash import get_password_hash
from .schemas import (
    UserRegister,
    URLToken,
    EmailData,
    ResponseModel,
    LoginData,
    PasswordResetSchema,
)
from app.database.models import User, Player
from app.utils.mail import send_verification_mail, send_password_reset_mail
from app.settings import settings
from .tokens import (
    create_url_safe_token,
    decode_url_safe_token,
    create_token,
    decode_token,
)

router = APIRouter(prefix="/user", tags=["users"])


@router.get("/", response_model=ResponseModel, response_model_exclude_none=True)
async def get_profile_data(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    payload = decode_token(token)
    user = await User.get_profile(session, int(payload["sub"]))
    return ResponseModel(message="User data retrieved successfully", data=user)


@router.post(
    "/register", response_model=ResponseModel, response_model_exclude_none=True
)
async def register(
    user_data: UserRegister,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    user_exists = await User.find_by_email_and_username(
        session, str(user_data.email), user_data.username
    )

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

    return ResponseModel(message="Account Created! Check email to verify your account")


@router.post("/verify", response_model=ResponseModel, response_model_exclude_none=True)
async def verify(
    token: URLToken, session: AsyncSession = Depends(db_helper.session_dependency)
):
    token_data = decode_url_safe_token(token.token)
    if not (user := await User.find_by_id(session, int(token_data["id"]))):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token",
        )

    user.is_verified = True
    await session.commit()
    return ResponseModel(message="Account verified, you can login now")


@router.post("/login", response_model=ResponseModel, response_model_exclude_none=True)
async def login(
    response: Response,
    form_data: LoginData,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    if "@" in form_data.username:
        user = await User.authenticate(
            session, password=form_data.password, email=form_data.username
        )
    else:
        user = await User.authenticate(
            session, password=form_data.password, username=form_data.username
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )
    if user.is_verified is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account not verified",
        )

    access_token = create_token({"sub": str(user.id)})

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
        expires=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
        samesite="lax",
        secure=True,
    )

    return ResponseModel(
        message="Login successful",
        data={"username": user.username, "email": user.email},
    )


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logout successful"}


@router.post(
    "/password-reset", response_model=ResponseModel, response_model_exclude_none=True
)
async def password_reset_request(
    email: EmailData,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    email = str(email.email)
    if not (user := await User.find_by_email(session, email)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not registered",
        )

    token = create_url_safe_token({"email": email, "id": str(user.id)})
    url = f"{settings.PASSWORD_RESET_PATH}/{token}/"
    await send_password_reset_mail(background_tasks, email, url)
    return ResponseModel(message="Password reset link sent to email")


@router.post(
    "/password-reset/verify",
    response_model=ResponseModel,
    response_model_exclude_none=True,
)
async def password_reset_verify(
    data: PasswordResetSchema,
    session: AsyncSession = Depends(db_helper.session_dependency),
):
    token_data = decode_url_safe_token(data.token)
    if not (user := await User.find_by_id(session, int(token_data["id"]))):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token",
        )

    user.password = get_password_hash(data.password)
    await session.commit()

    return ResponseModel(message="Password reset successful")
