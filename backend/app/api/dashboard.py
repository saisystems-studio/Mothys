
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import case, func

from app.core.database import get_db
from app.core.security import require_page_permission

from app.models.products import Product
from app.models.units import Unit
from app.models.vouchers import Voucher
from app.models.stock_movements import StockMovement


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(require_page_permission("dashboard"))]
)


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):

    today = datetime.now().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    start_of_next_day = start_of_day + timedelta(days=1)

    total_products = db.query(Product).count()

    total_units = db.query(Unit).count()

    # Count today's stock IN entries.
    today_entries = db.query(StockMovement).filter(
        StockMovement.movement_type == "IN",
        StockMovement.created_at >= start_of_day,
        StockMovement.created_at < start_of_next_day
    ).count()

    # Count today's billings based on voucher date.
    today_billings = db.query(Voucher).filter(
        Voucher.voucher_date >= start_of_day,
        Voucher.voucher_date < start_of_next_day
    ).count()

    total_stock_quantity = db.query(
        func.coalesce(
            func.sum(
                case(
                    (
                        StockMovement.movement_type == "OUT",
                        -StockMovement.quantity
                    ),
                    else_=StockMovement.quantity
                )
            ),
            0
        )
    ).join(
        Product,
        Product.id == StockMovement.product_id
    ).filter(
        Product.is_active == True
    ).scalar()

    return {
        "total_products": total_products,
        "total_units": total_units,
        "today_entries": today_entries,
        "today_billings": today_billings,
        "total_stock_quantity": total_stock_quantity
    }
