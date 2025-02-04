from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = [error["msg"] for error in exc.errors()]

    return JSONResponse(
        content={"detail": error_messages},
        status_code=status.HTTP_400_BAD_REQUEST
    )