from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="TechKraft Recruitment Dashboard API",
    version="0.1.0",
    lifespan=lifespan,
)

@app.get("/")
def root():
    return {"status": "ok"}
