'''
import os
from dotenv import load_dotenv
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
async def get_session():
    async with AsyncSession(engine) as session:
        yield session
'''
# services/user_service/app/database.py

import asyncio
import os
import logging
from dotenv import load_dotenv

from sqlmodel import SQLModel, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.exc import OperationalError, ProgrammingError, SQLAlchemyError # 필요한 예외 타입 추가

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO) # 로그 레벨 설정

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# DATABASE_URL이 설정되어 있는지 확인 (중요!)
if not DATABASE_URL:
    logger.error("DATABASE_URL 환경 변수가 설정되지 않았습니다. 프로그램을 종료합니다.")
    raise ValueError("DATABASE_URL 환경 변수가 설정되지 않았습니다.")

engine = create_async_engine(DATABASE_URL, echo=True) # echo=True는 SQL 쿼리를 터미널에 출력하여 디버깅에 도움

async def init_db():
    # MySQL이 완전히 시작될 때까지 기다리는 재시도 로직 추가
    max_retries = 30  # 최대 30번 재시도 (총 30초 * 2초 = 1분 대기)
    retry_delay = 2   # 각 재시도 사이 2초 대기

    for i in range(max_retries):
        try:
            logger.info(f"데이터베이스 연결 및 테이블 생성 시도 중... (시도 {i+1}/{max_retries})")
            async with engine.begin() as conn:
                await conn.run_sync(SQLModel.metadata.create_all)
            logger.info("데이터베이스 테이블이 성공적으로 생성되었거나 이미 존재합니다.")
            return # 성공하면 함수 종료
        except (OperationalError, ProgrammingError) as e:
            # OperationalError는 연결 실패, ProgrammingError는 DB 존재X 등
            logger.warning(f"데이터베이스 연결 실패 또는 준비되지 않음: {e}")
            error_message = str(e)
            if "Unknown database" in error_message:
                logger.error("데이터베이스 'user_db'가 존재하지 않거나 아직 초기화되지 않은 것 같습니다. MySQL 설정을 확인해주세요.")
                break # 데이터베이스 자체가 없으면 더 이상 재시도할 필요 없음
            if "Access denied" in error_message or "Authentication plugin" in error_message:
                logger.error("데이터베이스 인증 실패 또는 인증 플러그인 문제. DB_USER, DB_PASSWORD 또는 MySQL 인증 설정을 확인하세요.")
                break # 인증 실패는 재시도해도 똑같을 가능성 높음
            if i < max_retries - 1: # 마지막 재시도가 아니면 대기
                logger.info(f"{retry_delay}초 후 재시도합니다...")
                await asyncio.sleep(retry_delay)
            else: # 모든 재시도 실패 시
                logger.error("최대 재시도 횟수를 초과했습니다. 데이터베이스에 연결할 수 없습니다.")
                raise # 예외를 다시 발생시켜 애플리케이션 종료
        except SQLAlchemyError as e: # SQLAlchemy 관련 다른 예외 처리
            logger.error(f"데이터베이스 초기화 중 SQLAlchemy 오류 발생: {e}")
            raise
        except Exception as e: # 그 외 예상치 못한 예외 처리
            logger.error(f"데이터베이스 초기화 중 예상치 못한 오류 발생: {e}")
            raise


async def get_session() -> AsyncSession: # 타입 힌트 추가
    async_session = AsyncSession(engine)
    try:
        yield async_session
    finally:
        await async_session.close()