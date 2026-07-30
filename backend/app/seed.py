from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Candidate, Score
from app.auth import hash_password


def seed_db(db: Session):
    admin_user = db.query(User).filter(User.email == "admin@techkraft.com").first()
    if not admin_user:
        admin_user = User(
            email="admin@techkraft.com",
            hashed_password=hash_password("password123"),
            role="admin",
        )
        db.add(admin_user)
        db.flush() 

    reviewer_seeds = [
        {"email": "reviewer@techkraft.com", "password": "password123"},
        {"email": "reviewer2@techkraft.com", "password": "password123"},
    ]

    reviewer_users = []
    for seed in reviewer_seeds:
        existing = db.query(User).filter(User.email == seed["email"]).first()
        if not existing:
            existing = User(
                email=seed["email"],
                hashed_password=hash_password(seed["password"]),
                role="reviewer",
            )
            db.add(existing)
            db.flush()
        reviewer_users.append(existing)

    db.commit()
    for u in [admin_user] + reviewer_users:
        db.refresh(u)


    existing_candidates_count = db.query(Candidate).count()
    if existing_candidates_count > 0:
        print("Database already contains candidate data. Skipping seed.")
        return

    print("Seeding initial candidates and evaluation scores...")

    demo_candidates = [
        {
            "name": "Sarah Jenkins",
            "email": "sarah.jenkins@example.com",
            "role_applied": "Full Stack Engineer",
            "status": "hired",
            "skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker"],
            "internal_notes": "Strong technical background. Great communicator during systemic architecture discussion. Top candidate.",
            "scores": [
                {"category": "Technical", "score": 5, "note": "Exceptional understanding of REST architecture and async Python.", "reviewer_idx": 0},
                {"category": "Problem Solving", "score": 5, "note": "Quickly identified database indexing optimization in code sample.", "reviewer_idx": 1},
                {"category": "Communication", "score": 4, "note": "Clear explanations during whiteboarding session.", "reviewer_idx": 0},
                {"category": "Culture Fit", "score": 5, "note": "Exhibits strong mentorship potential and collaborative mindset.", "reviewer_idx": 1},
            ],
        },
        {
            "name": "Alex Rivera",
            "email": "alex.rivera@example.com",
            "role_applied": "Backend Engineer",
            "status": "reviewed",
            "skills": ["Python", "Django", "SQLAlchemy", "Redis", "Celery"],
            "internal_notes": "Pending final interview with Engineering Lead. Highly recommended.",
            "scores": [
                {"category": "Technical", "score": 4, "note": "Deep experience with async tasks, caching, and ORM tuning.", "reviewer_idx": 0},
                {"category": "Problem Solving", "score": 4, "note": "Structured approach to debugging complex queries.", "reviewer_idx": 1},
            ],
        },
        {
            "name": "David Chen",
            "email": "david.chen@example.com",
            "role_applied": "Frontend Engineer",
            "status": "reviewed",
            "skills": ["React", "TypeScript", "Next.js", "TailwindCSS", "Redux"],
            "internal_notes": "Excellent UI/UX sensibility. Created clean reusable component libraries.",
            "scores": [
                {"category": "Technical", "score": 5, "note": "Superb frontend skills. Great grasp of React state management.", "reviewer_idx": 1},
                {"category": "Communication", "score": 4, "note": "Articulate when explaining component trade-offs.", "reviewer_idx": 0},
            ],
        },
        {
            "name": "Elena Rostova",
            "email": "elena.rostova@example.com",
            "role_applied": "DevOps Engineer",
            "status": "new",
            "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD"],
            "internal_notes": "New applicant. Resume matches infrastructure requirements well.",
            "scores": [],
        },
        {
            "name": "Marcus Vance",
            "email": "marcus.vance@example.com",
            "role_applied": "Backend Engineer",
            "status": "new",
            "skills": ["Go", "Microservices", "gRPC", "PostgreSQL"],
            "internal_notes": "Application received via internal referral.",
            "scores": [],
        },
        {
            "name": "Priya Sharma",
            "email": "priya.sharma@example.com",
            "role_applied": "Data Engineer",
            "status": "hired",
            "skills": ["Python", "Spark", "Snowflake", "Airflow", "SQL"],
            "internal_notes": "Offer accepted! Starting next month in data platform team.",
            "scores": [
                {"category": "Technical", "score": 5, "note": "Expert knowledge in distributed data processing.", "reviewer_idx": 0},
                {"category": "Leadership", "score": 4, "note": "Has previously led small data team projects.", "reviewer_idx": 1},
            ],
        },
        {
            "name": "James Mitchell",
            "email": "james.mitchell@example.com",
            "role_applied": "Full Stack Engineer",
            "status": "rejected",
            "skills": ["Node.js", "Express", "MongoDB", "Vue.js"],
            "internal_notes": "Lacks Python/FastAPI experience required for our core tech stack.",
            "scores": [
                {"category": "Technical", "score": 2, "note": "Limited familiarity with typed system architecture.", "reviewer_idx": 0},
                {"category": "Culture Fit", "score": 3, "note": "Decent candidate but not aligned with current tech stack.", "reviewer_idx": 1},
            ],
        },
        {
            "name": "Hannah Abbott",
            "email": "hannah.abbott@example.com",
            "role_applied": "Mobile Engineer",
            "status": "new",
            "skills": ["React Native", "Swift", "Kotlin", "GraphQL"],
            "internal_notes": "Awaiting initial phone screening.",
            "scores": [],
        },
        {
            "name": "Leo Patel",
            "email": "leo.patel@example.com",
            "role_applied": "AI/ML Engineer",
            "status": "reviewed",
            "skills": ["Python", "PyTorch", "LangChain", "HuggingFace", "FastAPI"],
            "internal_notes": "Impressive AI workflow demo and RAG pipeline setup.",
            "scores": [
                {"category": "Technical", "score": 5, "note": "Built custom LLM integration pipeline during live coding task.", "reviewer_idx": 0},
                {"category": "Problem Solving", "score": 4, "note": "Thoughtful about model latency and token costs.", "reviewer_idx": 1},
            ],
        },
    ]

    for c_data in demo_candidates:
        scores_data = c_data.pop("scores")
        candidate = Candidate(**c_data)
        db.add(candidate)
        db.flush() 

        for s_data in scores_data:
            reviewer_idx = s_data.pop("reviewer_idx", 0)
            reviewer = reviewer_users[reviewer_idx] if reviewer_users else admin_user
            score = Score(
                candidate_id=candidate.id,
                category=s_data["category"],
                score=s_data["score"],
                note=s_data.get("note"),
                reviewer_id=reviewer.id,
            )
            db.add(score)

    db.commit()
    print("Demo data successfully seeded!")


def run_seed():
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
