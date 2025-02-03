from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from settings import settings
app = FastAPI(root_path="/api/")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World", "environment": settings.SECRET_KEY}


# For development purposes

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True, proxy_headers=True)
