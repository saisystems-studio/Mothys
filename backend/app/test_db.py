
from app.core.database import engine

def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.exec_driver_sql(
                "SELECT DB_NAME()"
            )
            database_name = result.scalar()

            print("SUCCESS! Database connection established.")
            print(f"Connected database: {database_name}")

    except Exception as error:
        print("DATABASE CONNECTION FAILED!")
        print(error)

if __name__ == "__main__":
    test_connection()
