
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String

from app.models import Candidate


def search_candidates(
    db: Session,
    status: Optional[str] = None,
    role_applied: Optional[str] = None,
    skill: Optional[str] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[int, List[Candidate]]:

    query = db.query(Candidate).filter(Candidate.deleted_at.is_(None))

    if status:
        query = query.filter(Candidate.status == status)

    if role_applied:
        query = query.filter(Candidate.role_applied.ilike(f"%{role_applied}%"))

    if keyword:
        query = query.filter(
            or_(
                Candidate.name.ilike(f"%{keyword}%"),
                Candidate.email.ilike(f"%{keyword}%"),
                Candidate.role_applied.ilike(f"%{keyword}%"),
            )
        )

    if skill:
        query = query.filter(
            cast(Candidate.skills, String).ilike(f"%{skill}%")
        )

    total = query.count()

    offset = (page - 1) * page_size
    items = (
        query
        .order_by(Candidate.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return total, items
