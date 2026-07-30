import asyncio
import json
import random
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Candidate, Score
from app.schemas import (
    CandidateCreate, CandidateUpdate,
    CandidateReviewerResponse, CandidateAdminResponse,
    ScoreCreate, ScoreResponse,
    AISummaryResponse,
)
from app import auth as auth_utils
from app.services.candidate_service import search_candidates

router = APIRouter()



def _get_candidate_or_404(candidate_id: str, db: Session) -> Candidate:
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.deleted_at.is_(None),  
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


def _build_response(candidate: Candidate, current_user: dict):
    is_admin = current_user.get("role") == "admin"

    if is_admin:
        return CandidateAdminResponse.model_validate(candidate)
    else:
        reviewer_id = current_user["sub"]
        own_scores = [s for s in candidate.scores if s.reviewer_id == reviewer_id]
        data = {
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "role_applied": candidate.role_applied,
            "status": candidate.status,
            "skills": candidate.skills or [],
            "created_at": candidate.created_at,
            "scores": own_scores,
        }
        return CandidateReviewerResponse.model_validate(data)


# GET /candidates/ 

@router.get("/", summary="List candidates with filters and pagination")
def list_candidates(
    status: Optional[str] = Query(None, description="Filter by status: new/reviewed/hired/rejected"),
    role_applied: Optional[str] = Query(None, description="Filter by role applied for"),
    skill: Optional[str] = Query(None, description="Filter by skill (exact, case-insensitive)"),
    keyword: Optional[str] = Query(None, description="Search name, email, role"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=50, description="Results per page (max 50)"),
    current_user: dict = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    total, candidates = search_candidates(
        db, status=status, role_applied=role_applied,
        skill=skill, keyword=keyword, page=page, page_size=page_size,
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
        "items": [_build_response(c, current_user) for c in candidates],
    }


# POST /candidates/ 

@router.post("/", status_code=status.HTTP_201_CREATED, summary="Create a candidate (admin only)")
def create_candidate(
    payload: CandidateCreate,
    current_user: dict = Depends(auth_utils.require_admin), 
    db: Session = Depends(get_db),
):
    existing = db.query(Candidate).filter(Candidate.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Candidate with this email already exists")

    candidate = Candidate(
        name=payload.name,
        email=payload.email,
        role_applied=payload.role_applied,
        skills=payload.skills,
        internal_notes=payload.internal_notes,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return CandidateAdminResponse.model_validate(candidate)

#  POST /candidates/ 

@router.post("/", status_code=status.HTTP_201_CREATED, summary="Create a candidate (admin only)")
def create_candidate(
    payload: CandidateCreate,
    current_user: dict = Depends(auth_utils.require_admin),  
    db: Session = Depends(get_db),
):
    existing = db.query(Candidate).filter(Candidate.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Candidate with this email already exists")

    candidate = Candidate(
        name=payload.name,
        email=payload.email,
        role_applied=payload.role_applied,
        skills=payload.skills,
        internal_notes=payload.internal_notes,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return CandidateAdminResponse.model_validate(candidate)


# GET /candidates/{id}

@router.get("/{candidate_id}", summary="Get a single candidate's full detail")
def get_candidate(
    candidate_id: str,
    current_user: dict = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    candidate = _get_candidate_or_404(candidate_id, db)
    return _build_response(candidate, current_user)


# PATCH /candidates/{id}

@router.patch("/{candidate_id}", summary="Update candidate status or notes (admin only)")
def update_candidate(
    candidate_id: str,
    payload: CandidateUpdate,
    current_user: dict = Depends(auth_utils.require_admin),
    db: Session = Depends(get_db),
):
    candidate = _get_candidate_or_404(candidate_id, db)

    if payload.status is not None:
        candidate.status = payload.status
    if payload.internal_notes is not None:
        candidate.internal_notes = payload.internal_notes

    db.commit()
    db.refresh(candidate)
    return CandidateAdminResponse.model_validate(candidate)


#  DELETE /candidates/{id}

@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Soft-delete a candidate (admin only)")
def delete_candidate(
    candidate_id: str,
    current_user: dict = Depends(auth_utils.require_admin),
    db: Session = Depends(get_db),
):
    candidate = _get_candidate_or_404(candidate_id, db)
    candidate.deleted_at = datetime.now(timezone.utc)
    db.commit()

#  PATCH /candidates/{id}

@router.patch("/{candidate_id}", summary="Update candidate status or notes (admin only)")
def update_candidate(
    candidate_id: str,
    payload: CandidateUpdate,
    current_user: dict = Depends(auth_utils.require_admin),
    db: Session = Depends(get_db),
):
    candidate = _get_candidate_or_404(candidate_id, db)

    if payload.status is not None:
        candidate.status = payload.status
    if payload.internal_notes is not None:
        candidate.internal_notes = payload.internal_notes

    db.commit()
    db.refresh(candidate)
    return CandidateAdminResponse.model_validate(candidate)


# DELETE /candidates/{id} 

@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Soft-delete a candidate (admin only)")
def delete_candidate(
    candidate_id: str,
    current_user: dict = Depends(auth_utils.require_admin),
    db: Session = Depends(get_db),
):
    candidate = _get_candidate_or_404(candidate_id, db)
    candidate.deleted_at = datetime.now(timezone.utc)
    db.commit()


# POST /candidates/{id}/scores 

@router.post("/{candidate_id}/scores", response_model=ScoreResponse, status_code=201,
             summary="Submit a score for a candidate")
def add_score(
    candidate_id: str,
    payload: ScoreCreate,
    current_user: dict = Depends(auth_utils.get_current_user),  # both roles can score
    db: Session = Depends(get_db),
):
    candidate = _get_candidate_or_404(candidate_id, db)

    existing_score = db.query(Score).filter(
        Score.candidate_id == candidate.id,
        Score.reviewer_id == current_user["sub"],
        Score.category == payload.category
    ).first()

    if existing_score:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already submitted a score for the '{payload.category}' category for this candidate."
        )

    score = Score(
        candidate_id=candidate.id,
        category=payload.category,
        score=payload.score,
        reviewer_id=current_user["sub"],  
        note=payload.note,
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    return score


# POST /candidates/{id}/summary 

@router.post("/{candidate_id}/summary", response_model=AISummaryResponse,
             summary="Generate an AI summary (mock 2s LLM call)")
async def generate_summary(
    candidate_id: str,
    current_user: dict = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):

    candidate = _get_candidate_or_404(candidate_id, db)

    await asyncio.sleep(2)

    skills_str = ", ".join(candidate.skills) if candidate.skills else "no specific skills listed"
    score_objs = candidate.scores
    avg_score = (
        round(sum(s.score for s in score_objs) / len(score_objs), 1)
        if score_objs else "N/A"
    )

    summaries = [
        f"{candidate.name} is a {candidate.role_applied} candidate with expertise in {skills_str}. "
        f"Average reviewer score: {avg_score}/5. Current status: {candidate.status}. "
        f"Based on the scoring data, this candidate demonstrates strong alignment "
        f"with TechKraft's technical requirements and company values.",

        f"Assessment summary for {candidate.name} ({candidate.role_applied}): "
        f"Technical profile includes {skills_str}. "
        f"Reviewer consensus score: {avg_score}/5. Status: {candidate.status}. "
        f"AI analysis indicates this candidate warrants advancement to the next stage "
        f"of TechKraft's recruitment process.",
    ]

    return AISummaryResponse(
        candidate_id=candidate_id,
        summary=random.choice(summaries),
        generated_at=datetime.now(timezone.utc),
    )


# GET /candidates/{id}/stream

@router.get("/{candidate_id}/stream", summary="Stream score updates via SSE")
async def stream_scores(
    candidate_id: str,
    current_user: dict = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):

    candidate = _get_candidate_or_404(candidate_id, db)

    async def event_generator():
        scores = db.query(Score).filter(Score.candidate_id == candidate_id).all()
        for score in scores:
            payload = json.dumps({
                "category": score.category,
                "score": score.score,
                "reviewer_id": score.reviewer_id,
            })
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.05)


        for _ in range(30):
            yield 'data: {"type":"heartbeat"}\n\n'
            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no", 
            "Connection": "keep-alive",
        },
    )
