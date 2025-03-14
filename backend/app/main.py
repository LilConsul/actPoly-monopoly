from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from settings import settings

from app.user.api import router as user_router
from app.game.api import router as game_router

from app.game import load_game_data, reload_game_data

from utils import validation_exception_handler

logger.add(
    f"{settings.ROOT_DIR}/app.log",
    rotation="50 MB",
    compression="zip",
    retention="7 days",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up the application")
    await load_game_data()

    yield
    logger.info("Shutting down the application")


app = FastAPI(
    title=f"{settings.PROJECT_NAME} API", root_path="/api/", lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(game_router)

app.add_exception_handler(RequestValidationError, validation_exception_handler)


@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Hello World"}


@app.post("/reload")
async def reload():
    await reload_game_data()
    return {"message": "Game data reloaded"}


# For development purposes

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True, proxy_headers=True)
