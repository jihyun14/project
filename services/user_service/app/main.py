import os
from typing import Annotated
from fastapi import FastAPI, status, Response, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from redis.asyncio import Redis
from models import User, UserCreate, UserPublic
from database import init_db, get_session
from redis_client import get_redis
from auth import get_password_hash, create_session
app=FastAPI(title="User Servive")



STATIC_DIR="/app/static"
PROFILE_IMAGE_DIR =f"{STATIC_DIR}/profiles"
os.makedirs(PROFILE_IMAGE_DIR,exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR),name="static")


def create_user_public(user:User)-> UserPublic:
    image_url=f"/static/profiles/{user.profile_image_filename}" if user.profile_image_filename else "https://www.w3schools.com/w3images/jane.jpg"
    user_dict = user.model_dump()
    user_dict["profile_image_url"]= image_url
    user_dict["user_id"] = user.user_id
    return UserPublic.model_validate(user_dict) 
@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/")
def health_check():
    return {"status":"User service running"}

@app.post('/api/auth/register', response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register_user(
    response: Response, #응답보내기
    user_data: UserCreate, # 데이터 받기 위해서
    session: Annotated[AsyncSession, Depends(get_session)], #데이터 베이스 연결
    redis: Annotated[Redis, Depends(get_redis)] #redis 사용을 위해서

):

     # 'session.exec(statement)' 대신 'session.execute(statement)' 사용
    statement_email = select(User).where(User.email == user_data.email)
    result_email = await session.execute(statement_email) # <-- 여기를 수정합니다.
    exist_user_email = result_email.scalars().first() # 결과 추출 방식 변경
    if exist_user_email:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 사용중인 이메일입니다.")

    hashed_password = get_password_hash(user_data.password)
    new_user = User.model_validate(user_data, update={"hashed_password":hashed_password})

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    session_id=await create_session(redis, new_user.id)
    response.set_cookie(key="session_id", value=session_id, httponly=True, samesite="lax", max_age=3600, path="/")

    return create_user_public(new_user)

    '''
    new_user=User(
    username = user_data.username)
    '''