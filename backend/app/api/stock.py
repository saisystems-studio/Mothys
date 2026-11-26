
# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from sqlalchemy import case, func
# from sqlalchemy.exc import IntegrityError

# from app.core.database import get_db
# from app.core.security import get_current_user
# from app.models.products import Product
# from app.models.stock_movements import StockMovement
# from app.models.users import User
# from app.schemas.stock_movements import (
#     StockMovementCreate,
#     StockMovementResponse
# )

# router = APIRouter(
#     prefix="/stock",
#     tags=["Stock"],
#     dependencies=[Depends(get_current_user)]
# )


# @router.get("/")
# def get_stock(db: Session = Depends(get_db)):
#     stock_quantity = func.coalesce(
#         func.sum(
#             case(
#                 (
#                     StockMovement.movement_type == "OUT",
#                     -StockMovement.quantity
#                 ),
#                 else_=StockMovement.quantity
#             )
#         ),
#         0
#     ).label("remaining_stock")

#     results = (
#         db.query(
#             Product.id.label("product_id"),
#             Product.product_name,
#             Product.unit_id,
#             stock_quantity
#         )
#         .outerjoin(
#             StockMovement,
#             Product.id == StockMovement.product_id
#         )
#         .filter(Product.is_active == True)
#         .group_by(
#             Product.id,
#             Product.product_name,
#             Product.unit_id
#         )
#         .order_by(Product.product_name)
#         .all()
#     )

#     return [
#         {
#             "product_id": row.product_id,
#             "product_name": row.product_name,
#             "unit_id": row.unit_id,
#             "remaining_stock": row.remaining_stock
#         }
#         for row in results
#     ]


# @router.post(
#     "/entry",
#     response_model=StockMovementResponse,
#     status_code=status.HTTP_201_CREATED
# )
# def create_stock_entry(
#     stock_data: StockMovementCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     product = db.query(Product).filter(
#         Product.id == stock_data.product_id,
#         Product.is_active == True
#     ).first()

#     if not product:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Active product not found"
#         )

#     new_movement = StockMovement(
#         product_id=product.id,
#         movement_type="IN",
#         quantity=stock_data.quantity,
#         created_by=current_user.id
#     )

#     try:
#         db.add(new_movement)
#         db.commit()
#         db.refresh(new_movement)

#         return new_movement

#     except IntegrityError:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Stock entry could not be saved due to a database constraint"
#         )

#     except Exception:
#         db.rollback()
#         raise




from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    require_page_permission
)

from app.models.products import Product
from app.models.stock_movements import StockMovement
from app.models.users import User

from app.schemas.stock_movements import (
    StockMovementCreate,
    StockMovementResponse,
    StockAdjustmentCreate
)


router = APIRouter(
    prefix="/stock",
    tags=["Stock"]
)


# =========================================================
# GET STOCK
# Returns stock separately for each product and unit.
# Example:
# Rice / Nos = 10
# Rice / Kg  = 25
# =========================================================

@router.get(
    "/",
    dependencies=[Depends(require_page_permission("stock"))]
)
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

    unit_expr = func.coalesce(
        StockMovement.unit_id,
        Product.unit_id
    ).label("unit_id")

    results = (
        db.query(
            Product.id.label("product_id"),
            Product.product_name,
            unit_expr,
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
            Product.unit_id,
            StockMovement.unit_id
        )
        .order_by(
            Product.product_name,
            Product.id,
            StockMovement.unit_id
        )
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


# =========================================================
# CREATE STOCK ENTRY
# Adds incoming stock for a product and selected unit.
# =========================================================

@router.post(
    "/entry",
    response_model=StockMovementResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_page_permission("products_in"))]
)
def create_stock_entry(
    stock_data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Find active product
    product = (
        db.query(Product)
        .filter(
            Product.id == stock_data.product_id,
            Product.is_active == True
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active product not found"
        )

    # Use default unit if unit_id was not provided
    unit_id = (
        stock_data.unit_id
        if stock_data.unit_id is not None
        else product.unit_id
    )

    # Validate selected unit
    allowed_unit_ids = {
        unit.id for unit in product.units
    }

    if product.unit_id is not None:
        allowed_unit_ids.add(product.unit_id)

    if unit_id not in allowed_unit_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unit {unit_id} is not associated "
                f"with product {product.id}"
            )
        )

    # Create incoming stock movement
    new_movement = StockMovement(
        product_id=product.id,
        unit_id=unit_id,
        movement_type="IN",
        quantity=stock_data.quantity,
        created_by=current_user.id
    )

    try:
        db.add(new_movement)
        db.commit()
        db.refresh(new_movement)

        return new_movement

    except IntegrityError as e:
        db.rollback()

        print(
            "STOCK DATABASE ERROR:",
            str(e.orig)
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock entry could not be saved due to a database constraint"
        )

    except Exception as e:
        db.rollback()

        print(
            "STOCK ENTRY ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while saving stock entry"
        )


# =========================================================
# CREATE STOCK ADJUSTMENT
# =========================================================

from decimal import Decimal
from sqlalchemy import case, func
# also import StockAdjustmentCreate from your schemas


@router.post(
    "/adjustment",
    response_model=StockMovementResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_page_permission("stock"))]
)
def create_stock_adjustment(
    stock_data: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Find active product
    product = (
        db.query(Product)
        .filter(
            Product.id == stock_data.product_id,
            Product.is_active == True
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active product not found"
        )

    # Use default unit if unit_id was not provided
    unit_id = (
        stock_data.unit_id
        if stock_data.unit_id is not None
        else product.unit_id
    )

    # Validate selected unit
    allowed_unit_ids = {
        unit.id for unit in product.units
    }

    if product.unit_id is not None:
        allowed_unit_ids.add(product.unit_id)

    if unit_id not in allowed_unit_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unit {unit_id} is not associated "
                f"with product {product.id}"
            )
        )

    # A reduction must not take stock of this product + unit below zero
    if stock_data.quantity < 0:
        remaining = (
            db.query(
                func.coalesce(
                    func.sum(
                        case(
                            (StockMovement.movement_type == "OUT", -StockMovement.quantity),
                            else_=StockMovement.quantity,
                        )
                    ),
                    0,
                )
            )
            .filter(
                StockMovement.product_id == product.id,
                StockMovement.unit_id == unit_id,
            )
            .scalar()
        )

        remaining = Decimal(str(remaining))

        if remaining + stock_data.quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock to reduce. Available: {remaining}"
            )

    # Create stock adjustment movement (quantity is signed)
    new_movement = StockMovement(
        product_id=product.id,
        unit_id=unit_id,
        movement_type="ADJUSTMENT",
        quantity=stock_data.quantity,
        created_by=current_user.id
    )

    try:
        db.add(new_movement)
        db.commit()
        db.refresh(new_movement)

        return new_movement

    except IntegrityError as e:
        db.rollback()

        print(
            "STOCK ADJUSTMENT DATABASE ERROR:",
            str(e.orig)
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock adjustment could not be saved due to a database constraint"
        )

    except Exception as e:
        db.rollback()

        print(
            "STOCK ADJUSTMENT ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while adjusting stock"
        )