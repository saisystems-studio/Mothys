
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.products import Product
from app.models.units import Unit
from app.models.users import User
from app.models.stock_movements import StockMovement
from app.schemas.products import (
    ProductCreate,
    ProductUpdate,
    ProductResponse
)

router = APIRouter(
    prefix="/products",
    tags=["Products"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id).all()


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_product = db.query(Product).filter(
        Product.product_name == product_data.product_name
    ).first()

    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product already exists"
        )

    unit = db.query(Unit).filter(
        Unit.id == product_data.unit_id,
        Unit.is_active == True
    ).first()

    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active unit not found"
        )

    try:
        new_product = Product(
            product_name=product_data.product_name,
            unit_id=product_data.unit_id
        )

        db.add(new_product)
        db.flush()

        if product_data.opening_stock is not None and product_data.opening_stock > 0:
            opening_movement = StockMovement(
                product_id=new_product.id,
                movement_type="OPENING",
                quantity=product_data.opening_stock,
                created_by=current_user.id
            )

            db.add(opening_movement)

        db.commit()
        db.refresh(new_product)

        return new_product

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product could not be created because of a duplicate or database constraint"
        )

    except Exception:
        db.rollback()
        raise


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    update_data = product_data.model_dump(exclude_unset=True)

    if "product_name" in update_data and update_data["product_name"] is not None:
        existing_product = db.query(Product).filter(
            Product.product_name == update_data["product_name"],
            Product.id != product_id
        ).first()

        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product name already exists"
            )

    if "unit_id" in update_data and update_data["unit_id"] is not None:
        unit = db.query(Unit).filter(
            Unit.id == update_data["unit_id"],
            Unit.is_active == True
        ).first()

        if not unit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active unit not found"
            )

    for field, value in update_data.items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)
        return product

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product update conflicts with existing database data"
        )

    except Exception:
        db.rollback()
        raise

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    has_stock_history = db.query(StockMovement).filter(
        StockMovement.product_id == product_id
    ).first()

    if has_stock_history:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product cannot be deleted because stock history exists. Deactivate it instead."
        )

    try:
        db.delete(product)
        db.commit()
        return None

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product cannot be deleted because it is referenced by existing records."
        )
