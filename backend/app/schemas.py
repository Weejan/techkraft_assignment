from datetime import datetime
from typing import Optional, List

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

# Score Schemas 

class ScoreCreate(BaseModel):
    category: str
    score: int
    note: Optional[str] = None

    @field_validator("score")
    @classmethod
    def score_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Score must be between 1 and 5")
        return v

class ScoreResponse(BaseModel):
    id: str
    candidate_id: str
    category: str
    score: int
    reviewer_id: str
    note: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

ScoreRead = ScoreResponse

class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    role_applied: str
    skills: List[str] = []
    internal_notes: Optional[str] = None

class CandidateUpdate(BaseModel):
    status: Optional[str] = None
    internal_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: Optional[str]) -> Optional[str]:
        allowed = {"new", "reviewed", "hired", "rejected"}
        if v and v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v

class CandidateReviewerResponse(BaseModel):
    id: str
    name: str
    email: str
    role_applied: str
    status: str
    skills: List[str]
    created_at: datetime
    scores: List[ScoreResponse] = []

    model_config = {"from_attributes": True}

class CandidateAdminResponse(CandidateReviewerResponse):
    internal_notes: Optional[str] = None

CandidateRead = CandidateAdminResponse

class CandidateListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[CandidateAdminResponse]

class AISummaryResponse(BaseModel):
    candidate_id: str
    summary: str
    generated_at: datetime

AISummary = AISummaryResponse
