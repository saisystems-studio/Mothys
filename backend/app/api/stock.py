
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.products import Product
from app.models.stock_movements import StockMovement
from app.models.users import User
from app.schemas.stock_movements import (
    StockMovementCreate,
    StockMovementResponse
)

router = APIRouter(
    prefix="/stock",
    tags=["Stock"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/")
def get_stock(db: Session = Depends(get_db)):
    stock_quantity = func.coalesce(
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
    ).label("remaining_stock")

    results = (
        db.query(
            Product.id.label("product_id"),
            Product.product_name,
            Product.unit_id,
            stock_quantity
        )
        .outerjoin(
            StockMovement,
            Product.id == StockMovement.product_id
        )
        .filter(Product.is_active == True)
        .group_by(
            Product.id,
            Product.product_name,
            Product.unit_id
        )
        .order_by(Product.product_name)
        .all()
    )

    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "unit_id": row.unit_id,
            "remaining_stock": row.remaining_stock
        }
        for row in results
    ]


@router.post(
    "/entry",
    response_model=StockMovementResponse,
    status_code=status.HTTP_201_CREATED
)
def create_stock_entry(
    stock_data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.id == stock_data.product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active product not found"
        )

    new_movement = StockMovement(
        product_id=product.id,
        movement_type="IN",
        quantity=stock_data.quantity,
        created_by=current_user.id
    )

    try:
        db.add(new_movement)
        db.commit()
        db.refresh(new_movement)

        return new_movement

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock entry could not be saved due to a database constraint"
        )

    except Exception:
        db.rollback()
        raise
