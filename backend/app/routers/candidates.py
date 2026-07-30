from datetime import datetime, timezone
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app import auth as auth_utils
from app.database import get_db
from app.models import Candidate, Score
from app.schemas import (
    AISummary,
    CandidateListResponse,
    CandidateRead,
    CandidateUpdate,
    ScoreCreate,
    ScoreRead,
)

router = APIRouter()


def _candidate_to_schema(candidate: Candidate) -> CandidateRead:
    return CandidateRead(
        id=candidate.id,
        name=candidate.name,
        email=candidate.email,
        role_applied=candidate.role_applied,
        status=candidate.status,
        skills=candidate.skills or [],
        internal_notes=candidate.internal_notes,
        created_at=candidate.created_at,
        scores=[
            ScoreRead.model_validate(score)
            if hasattr(ScoreRead, "model_validate")
            else ScoreRead.from_orm(score)
            for score in candidate.scores
        ],
    )


def _get_candidate_or_404(db: Session, candidate_id: str) -> Candidate:
    candidate = (
        db.query(Candidate)
        .options(joinedload(Candidate.scores))
        .filter(Candidate.id == candidate_id, Candidate.deleted_at.is_(None))
        .first()
    )
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    return candidate


@router.get("/", response_model=CandidateListResponse)
def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    status: str | None = None,
    role_applied: str | None = None,
    skill: str | None = None,
    keyword: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Candidate).filter(Candidate.deleted_at.is_(None))

    if status:
        query = query.filter(Candidate.status == status)
    if role_applied:
        query = query.filter(Candidate.role_applied.ilike(f"%{role_applied}%"))
    if skill:
        query = query.filter(Candidate.skills.contains([skill]))
    if keyword:
        term = f"%{keyword}%"
        query = query.filter((Candidate.name.ilike(term)) | (Candidate.email.ilike(term)))

    total = query.count()
    total_pages = ceil(total / page_size) if total else 0
    items = (
        query.order_by(Candidate.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .options(joinedload(Candidate.scores))
        .all()
    )
    return CandidateListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=[_candidate_to_schema(candidate) for candidate in items],
    )


@router.get("/{candidate_id}", response_model=CandidateRead)
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    return _candidate_to_schema(_get_candidate_or_404(db, candidate_id))


@router.patch("/{candidate_id}", response_model=CandidateRead)
def update_candidate(candidate_id: str, payload: CandidateUpdate, db: Session = Depends(get_db)):
    candidate = _get_candidate_or_404(db, candidate_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(candidate, key, value)
    db.commit()
    db.refresh(candidate)
    return _candidate_to_schema(_get_candidate_or_404(db, candidate_id))


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: str, db: Session = Depends(get_db)):
    candidate = _get_candidate_or_404(db, candidate_id)
    candidate.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return None


@router.post("/{candidate_id}/scores", response_model=ScoreRead, status_code=status.HTTP_201_CREATED)
def create_score(
    candidate_id: str,
    payload: ScoreCreate,
    current_user: dict = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    _get_candidate_or_404(db, candidate_id)
    score = Score(
        candidate_id=candidate_id,
        category=payload.category,
        score=payload.score,
        reviewer_id=current_user["sub"],
        note=payload.note,
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    return ScoreRead.model_validate(score) if hasattr(ScoreRead, "model_validate") else ScoreRead.from_orm(score)


@router.post("/{candidate_id}/summary", response_model=AISummary)
def generate_summary(candidate_id: str, db: Session = Depends(get_db)):
    candidate = _get_candidate_or_404(db, candidate_id)
    score_values = [score.score for score in candidate.scores]
    avg_score = sum(score_values) / len(score_values) if score_values else 0
    summary = (
        f"{candidate.name} is a {candidate.role_applied} candidate with "
        f"{len(candidate.scores)} score(s) and an average rating of {avg_score:.1f}."
    )
    return AISummary(candidate_id=candidate.id, summary=summary, generated_at=datetime.now(timezone.utc))
