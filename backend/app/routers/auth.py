from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, Token
from app import auth as auth_utils

router = APIRouter()


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new reviewer account",
)
def register(payload: UserRegister, db: Session = Depends(get_db)):

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=payload.email,
        hashed_password=auth_utils.hash_password(payload.password),
        role="reviewer",   
    )
    db.add(user)      
    db.commit()       
    db.refresh(user)   

    token = auth_utils.create_access_token({
        "sub": user.id,         
        "email": user.email,
        "role": user.role,
    })
    return Token(access_token=token, token_type="bearer", role=user.role)


@router.post(
    "/login",
    response_model=Token,
    summary="Log in and receive a JWT",
)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not auth_utils.verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = auth_utils.create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
    })
    return Token(access_token=token, token_type="bearer", role=user.role)
