
from app.core.database import SessionLocal
from sqlalchemy import text


def test_database_session():
    db = SessionLocal()

    try:
        result = db.execute(text("SELECT DB_NAME()"))
        database_name = result.scalar()

        print("DATABASE SESSION TEST")
        print("---------------------")
        print("SUCCESS: Session created")
        print(f"Connected database: {database_name}")

    except Exception as error:
        print("SESSION TEST FAILED")
        print(error)

    finally:
        db.close()
        print("SUCCESS: Session closed")


if __name__ == "__main__":
    test_database_session()
