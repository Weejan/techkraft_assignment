import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship

from app.database import Base


def new_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=new_id)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="reviewer")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=new_id)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role_applied = Column(String, nullable=False)
    status = Column(String, nullable=False, default="new")
    skills = Column(JSON, nullable=False, default=list)
    internal_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime, nullable=True)

    scores = relationship("Score", back_populates="candidate", lazy="select")

    __table_args__ = (
        Index("ix_candidates_status", "status"),
        Index("ix_candidates_role_applied", "role_applied"),
    )


class Score(Base):
    __tablename__ = "scores"

    id = Column(String, primary_key=True, default=new_id)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    category = Column(String, nullable=False)  
    score = Column(Integer, nullable=False) 
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = relationship("Candidate", back_populates="scores")
    reviewer = relationship("User")


    __table_args__ = (
        Index("ix_scores_candidate_id", "candidate_id"),
        Index("ix_scores_reviewer_id", "reviewer_id"),
    )