
# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from sqlalchemy.exc import IntegrityError

# from app.core.database import get_db
# from app.core.security import get_current_user
# from app.models.products import Product
# from app.models.units import Unit
# from app.models.users import User
# from app.models.stock_movements import StockMovement
# from app.schemas.products import (
#     ProductCreate,
#     ProductUpdate,
#     ProductResponse
# )

# router = APIRouter(
#     prefix="/products",
#     tags=["Products"],
#     dependencies=[Depends(get_current_user)]
# )


# @router.get("/", response_model=list[ProductResponse])
# def get_products(db: Session = Depends(get_db)):
#     return db.query(Product).order_by(Product.id).all()


# @router.post(
#     "/",
#     response_model=ProductResponse,
#     status_code=status.HTTP_201_CREATED
# )
# def create_product(
#     product_data: ProductCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     existing_product = db.query(Product).filter(
#         Product.product_name == product_data.product_name
#     ).first()

#     if existing_product:
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail="Product already exists"
#         )

#     unit = db.query(Unit).filter(
#         Unit.id == product_data.unit_id,
#         Unit.is_active == True
#     ).first()

#     if not unit:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Active unit not found"
#         )

#     try:
#         new_product = Product(
#             product_name=product_data.product_name,
#             unit_id=product_data.unit_id
#         )

#         db.add(new_product)
#         db.flush()

#         if product_data.opening_stock is not None and product_data.opening_stock > 0:
#             opening_movement = StockMovement(
#                 product_id=new_product.id,
#                 movement_type="OPENING",
#                 quantity=product_data.opening_stock,
#                 created_by=current_user.id
#             )

#             db.add(opening_movement)

#         db.commit()
#         db.refresh(new_product)

#         return new_product

#     except IntegrityError:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail="Product could not be created because of a duplicate or database constraint"
#         )

#     except Exception:
#         db.rollback()
#         raise


# @router.patch("/{product_id}", response_model=ProductResponse)
# def update_product(
#     product_id: int,
#     product_data: ProductUpdate,
#     db: Session = Depends(get_db)
# ):
#     product = db.query(Product).filter(
#         Product.id == product_id
#     ).first()

#     if not product:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Product not found"
#         )

#     update_data = product_data.model_dump(exclude_unset=True)

#     if "product_name" in update_data and update_data["product_name"] is not None:
#         existing_product = db.query(Product).filter(
#             Product.product_name == update_data["product_name"],
#             Product.id != product_id
#         ).first()

#         if existing_product:
#             raise HTTPException(
#                 status_code=status.HTTP_409_CONFLICT,
#                 detail="Product name already exists"
#             )

#     if "unit_id" in update_data and update_data["unit_id"] is not None:
#         unit = db.query(Unit).filter(
#             Unit.id == update_data["unit_id"],
#             Unit.is_active == True
#         ).first()

#         if not unit:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Active unit not found"
#             )

#     for field, value in update_data.items():
#         setattr(product, field, value)

#     try:
#         db.commit()
#         db.refresh(product)
#         return product

#     except IntegrityError:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail="Product update conflicts with existing database data"
#         )

#     except Exception:
#         db.rollback()
#         raise

# @router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_product(
#     product_id: int,
#     db: Session = Depends(get_db)
# ):
#     product = db.query(Product).filter(
#         Product.id == product_id
#     ).first()

#     if not product:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Product not found"
#         )

#     has_stock_history = db.query(StockMovement).filter(
#         StockMovement.product_id == product_id
#     ).first()

#     if has_stock_history:
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail="Product cannot be deleted because stock history exists. Deactivate it instead."
#         )

#     try:
#         db.delete(product)
#         db.commit()
#         return None

#     except IntegrityError:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail="Product cannot be deleted because it is referenced by existing records."
#         )







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


def get_active_units(db: Session, unit_ids: list[int]):
    units = db.query(Unit).filter(
     Unit.id.in_(unit_ids),
     Unit.is_active == True  # noqa: E712
    ).all()

    if len(units) != len(unit_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more units were not found or are inactive"
        )

    unit_map = {unit.id: unit for unit in units}

    return [unit_map[unit_id] for unit_id in unit_ids]


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
    units = get_active_units(db, product_data.unit_ids)

    try:
        # ALWAYS create a NEW product record.
        # Duplicate product names are allowed.

        new_product = Product(
            product_name=product_data.product_name.strip(),

            # First selected unit becomes default unit
            unit_id=product_data.unit_ids[0],

            # Assign selected units
            units=units
        )

        db.add(new_product)
        db.flush()

        # Create opening stock for this individual product ID.
        if (
            product_data.opening_stock is not None
            and product_data.opening_stock > 0
        ):
            opening_movement = StockMovement(
                product_id=new_product.id,
                unit_id=product_data.unit_ids[0],
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
            detail="Product with same selected unit already exists."
        )

    except Exception:
        db.rollback()
        raise


@router.patch(
    "/{product_id}",
    response_model=ProductResponse
)
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

    try:
        # Update product name
        if update_data.get("product_name") is not None:
                product.product_name = update_data["product_name"].strip()

        # Update active status
        if update_data.get("is_active") is not None:
            product.is_active = update_data["is_active"]

        # Update units ONLY when unit_ids is provided
        if "unit_ids" in update_data and update_data["unit_ids"] is not None:

            unit_ids = update_data["unit_ids"]

            # Validate selected units
            units = get_active_units(db, unit_ids)

            # Find units being removed
            current_unit_ids = {
                unit.id for unit in product.units
            }

            removed_unit_ids = current_unit_ids - set(unit_ids)

            # Prevent removing units with stock history
            if removed_unit_ids:
                existing_movements = db.query(StockMovement).filter(
                    StockMovement.product_id == product_id,
                    StockMovement.unit_id.in_(removed_unit_ids)
                ).first()

                if existing_movements:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Cannot remove a unit that has existing stock history."
                    )

            # Assign new units
            product.units = units

            # First selected unit becomes default
            product.unit_id = unit_ids[0]

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

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
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
