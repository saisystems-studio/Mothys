
from sqlalchemy import inspect
from app.core.database import engine, Base
from app.models import *

inspector = inspect(engine)

print("MOTHYS COLUMN VERIFICATION")
print("--------------------------")

has_errors = False

for table_name, model_table in Base.metadata.tables.items():
    db_columns = {
        column["name"]
        for column in inspector.get_columns(table_name)
    }

    model_columns = set(model_table.columns.keys())

    missing_columns = model_columns - db_columns

    if missing_columns:
        has_errors = True
        print(f"MISMATCH: {table_name}")
        print("Missing columns:", sorted(missing_columns))
    else:
        print(f"SUCCESS: {table_name} - columns match")

print("--------------------------")

if has_errors:
    print("Some column mismatches need attention.")
else:
    print("All seven models match database columns.")
