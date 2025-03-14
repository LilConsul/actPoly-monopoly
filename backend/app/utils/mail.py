from typing import List, Dict, Any
from fastapi import BackgroundTasks
from fastapi_mail import FastMail, ConnectionConfig, MessageSchema, MessageType
from app.settings import settings

mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.SMTP_USER,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_FROM_NAME=settings.EMAIL_FROM_NAME,
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=settings.ROOT_DIR / "templates",
)

mail = FastMail(mail_config)


def create_single_message(
    recipient: str, subject: str, body: Dict[str, Any]
) -> MessageSchema:
    return MessageSchema(
        subject=subject,
        recipients=[recipient],
        template_body=body,
        subtype=MessageType.html,
    )


async def send_verification_mail(
    background_tasks: BackgroundTasks, email: str, link: str
):
    message = create_single_message(
        recipient=email,
        subject="Email Verification",
        body={"link": link},
    )
    background_tasks.add_task(
        mail.send_message, message, template_name="mail/verify.html"
    )


async def send_password_reset_mail(
    background_tasks: BackgroundTasks, email: str, link: str
):
    message = create_single_message(
        recipient=email,
        subject="Password Reset",
        body={"link": link},
    )
    background_tasks.add_task(
        mail.send_message, message, template_name="mail/password_reset.html"
    )
