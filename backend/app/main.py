from fastapi import FastAPI


app = FastAPI(
    title="TechKraft Recruitment Dashboard API",
    version="0.1.0",
)


@app.get("/")
def root():
    return {"status": "ok"}
