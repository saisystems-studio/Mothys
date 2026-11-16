
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import case, func

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.products import Product
from app.models.units import Unit
from app.models.vouchers import Voucher
from app.models.stock_movements import StockMovement


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):

    total_products = db.query(Product).count()

    total_units = db.query(Unit).count()

    total_entries = db.query(StockMovement).filter(
        StockMovement.movement_type == "IN"
    ).count()

    total_billings = db.query(Voucher).count()

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
        "total_entries": total_entries,
        "total_billings": total_billings,
        "total_stock_quantity": total_stock_quantity
    }
