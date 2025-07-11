from typing import Optional
from sqlmodel import Field, SQLModel

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(unique=True, index=True) # 사용자가 직접 입력하는 '아이디' (고유해야 함)
    username: str = Field(unique=True, index=True)
    email: str = Field (unique=True, index=True)
    hashed_password : str
    profile_image_filename:Optional[str]=None

class UserCreate(SQLModel):
    username: str
    user_id: str # 사용자가 직접 입력하는 '아이디' (HTML의 "아이디")
    email:str
    password: str
    password_confirm: str # 사용자가 입력하는 '비밀번호 확인' (평문, DB 저장X)


class Userlogin(SQLModel):
    username:str
    password: str

class UserPublic(SQLModel):
    id:int
    username:str
    user_id: str # 공개할 '아이디'
    email:str
    profile_image_url: Optional[str]=None 


