
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


# Auth Schemas 

class UserRegister(BaseModel):
    email: EmailStr         
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str   


class ScoreCreate(BaseModel):
    category: str
    score: int
    note: str | None = None


class ScoreRead(BaseModel):
    id: str
    candidate_id: str
    category: str
    score: int
    reviewer_id: str
    note: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateBase(BaseModel):
    name: str
    email: EmailStr
    role_applied: str
    status: str = "new"
    skills: list[str] = []
    internal_notes: str | None = None


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role_applied: str | None = None
    status: str | None = None
    skills: list[str] | None = None
    internal_notes: str | None = None


class CandidateRead(CandidateBase):
    id: str
    created_at: datetime
    scores: list[ScoreRead] = []

    class Config:
        from_attributes = True


class CandidateListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[CandidateRead]


class AISummary(BaseModel):
    candidate_id: str
    summary: str
    generated_at: datetime
