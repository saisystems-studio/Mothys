# from decimal import Decimal
# from uuid import uuid4

# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from sqlalchemy import case, func
# from sqlalchemy.exc import IntegrityError

# from app.core.database import get_db
# from app.core.security import get_current_user

# from app.models.vouchers import Voucher
# from app.models.voucher_items import VoucherItem
# from app.models.products import Product
# from app.models.units import Unit
# from app.models.stock_movements import StockMovement
# from app.models.users import User

# from app.schemas.vouchers import (
#     VoucherCreate,
#     VoucherUpdate,
#     VoucherResponse
# )
# from app.schemas.voucher_items import VoucherItemResponse
# from datetime import datetime

# router = APIRouter(
#     prefix="/vouchers",
#     tags=["Vouchers"],
#     dependencies=[Depends(get_current_user)]
# )


# @router.get("/", response_model=list[VoucherResponse])
# def get_vouchers(db: Session = Depends(get_db)):
#     return db.query(Voucher).order_by(
#         Voucher.id.desc()
#     ).all()


# @router.get(
#     "/{voucher_id}/items",
#     response_model=list[VoucherItemResponse]
# )
# def get_voucher_items(
#     voucher_id: int,
#     db: Session = Depends(get_db)
# ):
#     voucher = db.query(Voucher).filter(
#         Voucher.id == voucher_id
#     ).first()

#     if not voucher:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Billing voucher not found"
#         )

#     return db.query(VoucherItem).filter(
#         VoucherItem.voucher_id == voucher_id
#     ).order_by(
#         VoucherItem.id
#     ).all()


# @router.post(
#     "/",
#     response_model=VoucherResponse,
#     status_code=status.HTTP_201_CREATED
# )
# def create_billing(
#     voucher_data: VoucherCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     # Combine quantities for repeated products.
#     requested_quantities = {}

#     for item in voucher_data.items:
#         requested_quantities[item.product_id] = (
#             requested_quantities.get(
#                 item.product_id, Decimal("0")
#             ) + item.quantity
#         )

#     product_ids = sorted(requested_quantities.keys())

#     try:
#         # Lock product rows in a consistent order.
#         # This prevents simultaneous bills from overselling
#         # the same product.
#         products = (
#             db.query(Product)
#             .filter(
#                 Product.id.in_(product_ids),
#                 Product.is_active == True
#             )
#             .order_by(Product.id)
#             .with_hint(
#                 Product,
#                 "WITH (UPDLOCK, HOLDLOCK)",
#                 dialect_name="mssql"
#             )
#             .all()
#         )

#         if len(products) != len(product_ids):
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="One or more products do not exist or are inactive"
#             )

#         products_by_id = {
#             product.id: product
#             for product in products
#         }

#         # Validate stock for every product before creating billing.
#         for product_id, requested_quantity in requested_quantities.items():

#             available_stock = db.query(
#                 func.coalesce(
#                     func.sum(
#                         case(
#                             (
#                                 StockMovement.movement_type == "OUT",
#                                 -StockMovement.quantity
#                             ),
#                             else_=StockMovement.quantity
#                         )
#                     ),
#                     0
#                 )
#             ).filter(
#                 StockMovement.product_id == product_id
#             ).scalar()

#             available_stock = Decimal(str(available_stock))

#             if available_stock < requested_quantity:
#                 product_name = products_by_id[
#                     product_id
#                 ].product_name

#                 raise HTTPException(
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     detail=(
#                         f"Insufficient stock for {product_name}. "
#                         f"Available: {available_stock}, "
#                         f"Requested: {requested_quantity}"
#                     )
#                 )

#         # Create voucher with a temporary unique number.
#         # Replace it with the database-generated ID after flush.
#         new_voucher = Voucher(
#             voucher_number=f"TEMP-{uuid4().hex}",
#             created_by=current_user.id,
#             total_quantity=sum(
#                 (item.quantity for item in voucher_data.items),
#                 Decimal("0")
#             )
#         )

#         db.add(new_voucher)
#         db.flush()

#         new_voucher.voucher_number = str(new_voucher.id)

#         # Create voucher items and corresponding OUT movements.
#         for item in voucher_data.items:
#             product = products_by_id[item.product_id]

#             unit = db.query(Unit).filter(
#                 Unit.id == product.unit_id
#             ).first()

#             if not unit:
#                 raise HTTPException(
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     detail=f"Unit not found for {product.product_name}"
#                 )

#             new_item = VoucherItem(
#                 voucher_id=new_voucher.id,
#                 product_id=product.id,
#                 unit_id=product.unit_id,
#                 product_name_snapshot=product.product_name,
#                 unit_name_snapshot=unit.unit_name,
#                 quantity=item.quantity
#             )

#             db.add(new_item)
#             db.flush()

#             stock_movement = StockMovement(
#                 product_id=product.id,
#                 movement_type="OUT",
#                 quantity=item.quantity,
#                 voucher_item_id=new_item.id,
#                 created_by=current_user.id
#             )

#             db.add(stock_movement)

#         db.commit()
#         db.refresh(new_voucher)

#         return new_voucher

#     except HTTPException:
#         db.rollback()
#         raise

#     except IntegrityError:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail="Billing could not be saved because of a database constraint"
#         )

#     except Exception:
#         db.rollback()
#         raise


# @router.patch(
#     "/{voucher_id}",
#     response_model=VoucherResponse
# )
# def update_voucher(
#     voucher_id: int,
#     voucher_data: VoucherUpdate,
#     db: Session = Depends(get_db)
# ):
#     try:
#         # Find and lock the voucher.
#         voucher = (
#             db.query(Voucher)
#             .filter(Voucher.id == voucher_id)
#             .with_hint(
#                 Voucher,
#                 "WITH (UPDLOCK, HOLDLOCK)",
#                 dialect_name="mssql"
#             )
#             .first()
#         )

#         if not voucher:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Billing voucher not found"
#             )

#         # Load existing voucher lines in a stable order.
#         existing_items = (
#             db.query(VoucherItem)
#             .filter(VoucherItem.voucher_id == voucher_id)
#             .order_by(VoucherItem.id)
#             .all()
#         )

#         if not existing_items:
#             raise HTTPException(
#                 status_code=status.HTTP_409_CONFLICT,
#                 detail="This voucher has no items to update"
#             )

#         # The current frontend edits dates and quantities only.
#         # Do not allow product lines to be silently replaced.
#         if len(existing_items) != len(voucher_data.items):
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="The voucher's product lines cannot be changed"
#             )

#         for old_item, new_item in zip(
#             existing_items,
#             voucher_data.items
#         ):
#             if old_item.product_id != new_item.product_id:
#                 raise HTTPException(
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     detail="The voucher's products cannot be changed"
#                 )

#         product_ids = sorted({
#             item.product_id for item in existing_items
#         })

#         # Lock products in a consistent order.
#         products = (
#             db.query(Product)
#             .filter(Product.id.in_(product_ids))
#             .order_by(Product.id)
#             .with_hint(
#                 Product,
#                 "WITH (UPDLOCK, HOLDLOCK)",
#                 dialect_name="mssql"
#             )
#             .all()
#         )

#         if len(products) != len(product_ids):
#             raise HTTPException(
#                 status_code=status.HTTP_409_CONFLICT,
#                 detail="A product associated with this voucher no longer exists"
#             )

#         # Find the existing stock movements for these voucher lines.
#         item_ids = [item.id for item in existing_items]

#         movements = (
#             db.query(StockMovement)
#             .filter(
#                 StockMovement.voucher_item_id.in_(item_ids)
#             )
#             .order_by(StockMovement.id)
#             .all()
#         )

#         movements_by_item = {
#             movement.voucher_item_id: movement
#             for movement in movements
#         }

#         # Every voucher line must have its original OUT movement.
#         for item in existing_items:
#             movement = movements_by_item.get(item.id)

#             if (
#                 movement is None
#                 or movement.movement_type != "OUT"
#                 or movement.product_id != item.product_id
#             ):
#                 raise HTTPException(
#                     status_code=status.HTTP_409_CONFLICT,
#                     detail=(
#                         "The original stock movement for this voucher "
#                         "could not be verified. The voucher was not changed."
#                     )
#                 )

#         # Combine the revised quantities by product.
#         requested_quantities = {}

#         for item in voucher_data.items:
#             requested_quantities[item.product_id] = (
#                 requested_quantities.get(
#                     item.product_id,
#                     Decimal("0")
#                 ) + item.quantity
#             )

#         # Add back this voucher's original OUT quantities when
#         # calculating stock available for the revised voucher.
#         previous_quantities = {}

#         for item in existing_items:
#             movement = movements_by_item[item.id]

#             previous_quantities[item.product_id] = (
#                 previous_quantities.get(
#                     item.product_id,
#                     Decimal("0")
#                 ) + Decimal(str(movement.quantity))
#             )

#         products_by_id = {
#             product.id: product
#             for product in products
#         }

#         # Validate stock before changing anything.
#         for product_id, requested_quantity in requested_quantities.items():

#             current_stock = db.query(
#                 func.coalesce(
#                     func.sum(
#                         case(
#                             (
#                                 StockMovement.movement_type == "OUT",
#                                 -StockMovement.quantity
#                             ),
#                             else_=StockMovement.quantity
#                         )
#                     ),
#                     0
#                 )
#             ).filter(
#                 StockMovement.product_id == product_id
#             ).scalar()

#             current_stock = Decimal(str(current_stock or 0))

#             available_stock = (
#                 current_stock
#                 + previous_quantities.get(
#                     product_id,
#                     Decimal("0")
#                 )
#             )

#             if available_stock < requested_quantity:
#                 product_name = products_by_id[
#                     product_id
#                 ].product_name

#                 raise HTTPException(
#                     status_code=status.HTTP_400_BAD_REQUEST,
#                     detail=(
#                         f"Insufficient stock for {product_name}. "
#                         f"Available: {available_stock}, "
#                         f"Requested: {requested_quantity}"
#                     )
#                 )

#         # Update existing voucher items and their original movements.
#         for old_item, new_item in zip(
#             existing_items,
#             voucher_data.items
#         ):
#             old_item.quantity = new_item.quantity

#             movement = movements_by_item[old_item.id]
#             movement.quantity = new_item.quantity

#         # Store the selected date at midnight.
#         voucher.voucher_date = datetime.combine(
#             voucher_data.voucher_date,
#             datetime.min.time()
#         )

#         # Retain the existing database field for compatibility.
#         # This is a raw sum, not a physical quantity across units.
#         voucher.total_quantity = sum(
#             (item.quantity for item in voucher_data.items),
#             Decimal("0")
#         )

#         db.commit()
#         db.refresh(voucher)

#         return voucher

#     except HTTPException:
#         db.rollback()
#         raise

#     except IntegrityError:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_409_CONFLICT,
#             detail="Voucher update failed because of a database constraint"
#         )

#     except Exception:
#         db.rollback()
#         raise










from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    require_page_permission
)

from app.models.vouchers import Voucher
from app.models.voucher_items import VoucherItem
from app.models.products import Product
from app.models.units import Unit
from app.models.stock_movements import StockMovement
from app.models.users import User

from app.schemas.vouchers import (
    VoucherCreate,
    VoucherUpdate,
    VoucherResponse
)
from app.schemas.voucher_items import VoucherItemResponse
from datetime import datetime

router = APIRouter(
    prefix="/vouchers",
    tags=["Vouchers"],
    dependencies=[Depends(require_page_permission("billing"))]
)


def stock_balance(db: Session, product_id: int, unit_id: int) -> Decimal:
    """Stock of one product in ONE unit (units are never mixed)."""
    value = db.query(
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
    ).filter(
        StockMovement.product_id == product_id,
        StockMovement.unit_id == unit_id
    ).scalar()

    return Decimal(str(value or 0))


@router.get("/", response_model=list[VoucherResponse])
def get_vouchers(db: Session = Depends(get_db)):
    return db.query(Voucher).order_by(
        Voucher.id.desc()
    ).all()


@router.get(
    "/{voucher_id}/items",
    response_model=list[VoucherItemResponse]
)
def get_voucher_items(
    voucher_id: int,
    db: Session = Depends(get_db)
):
    voucher = db.query(Voucher).filter(
        Voucher.id == voucher_id
    ).first()

    if not voucher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billing voucher not found"
        )

    return db.query(VoucherItem).filter(
        VoucherItem.voucher_id == voucher_id
    ).order_by(
        VoucherItem.id
    ).all()


@router.post(
    "/",
    response_model=VoucherResponse,
    status_code=status.HTTP_201_CREATED
)
def create_billing(
    voucher_data: VoucherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product_ids = sorted({item.product_id for item in voucher_data.items})

    try:
        # Lock product rows in a consistent order.
        # This prevents simultaneous bills from overselling
        # the same product.
        products = (
            db.query(Product)
            .filter(
                Product.id.in_(product_ids),
                Product.is_active == True  # noqa: E712
            )
            .order_by(Product.id)
            .with_hint(
                Product,
                "WITH (UPDLOCK, HOLDLOCK)",
                dialect_name="mssql"
            )
            .all()
        )

        if len(products) != len(product_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more products do not exist or are inactive"
            )

        products_by_id = {
            product.id: product
            for product in products
        }

        # Resolve the unit of every line (no unit sent -> default unit)
        # and combine quantities per (product, unit).
        resolved_items = []
        requested_quantities = {}

        for item in voucher_data.items:
            product = products_by_id[item.product_id]
            unit_id = getattr(item, "unit_id", None) or product.unit_id

            allowed_unit_ids = {u.id for u in product.units} | {product.unit_id}

            if unit_id not in allowed_unit_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{product.product_name} is not available in the selected unit"
                )

            resolved_items.append((item, product, unit_id))

            key = (product.id, unit_id)
            requested_quantities[key] = (
                requested_quantities.get(key, Decimal("0")) + item.quantity
            )

        needed_unit_ids = {unit_id for _, unit_id in requested_quantities}

        units_by_id = {
            unit.id: unit
            for unit in db.query(Unit).filter(
                Unit.id.in_(needed_unit_ids)
            ).all()
        }

        if len(units_by_id) != len(needed_unit_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more units were not found"
            )

        # Validate stock per product AND unit before creating billing.
        for (product_id, unit_id), requested_quantity in requested_quantities.items():
            available_stock = stock_balance(db, product_id, unit_id)

            if available_stock < requested_quantity:
                product_name = products_by_id[product_id].product_name
                unit_name = units_by_id[unit_id].unit_name

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for {product_name} ({unit_name}). "
                        f"Available: {available_stock}, "
                        f"Requested: {requested_quantity}"
                    )
                )

        # Create voucher with a temporary unique number.
        # Replace it with the database-generated ID after flush.
        new_voucher = Voucher(
            voucher_number=f"TEMP-{uuid4().hex}",
            created_by=current_user.id,
            total_quantity=sum(
                (item.quantity for item in voucher_data.items),
                Decimal("0")
            )
        )

        db.add(new_voucher)
        db.flush()

        new_voucher.voucher_number = str(new_voucher.id)

        # Create voucher items and corresponding OUT movements.
        for item, product, unit_id in resolved_items:
            unit = units_by_id[unit_id]

            new_item = VoucherItem(
                voucher_id=new_voucher.id,
                product_id=product.id,
                unit_id=unit_id,
                product_name_snapshot=product.product_name,
                unit_name_snapshot=unit.unit_name,
                quantity=item.quantity
            )

            db.add(new_item)
            db.flush()

            stock_movement = StockMovement(
                product_id=product.id,
                unit_id=unit_id,
                movement_type="OUT",
                quantity=item.quantity,
                voucher_item_id=new_item.id,
                created_by=current_user.id
            )

            db.add(stock_movement)

        db.commit()
        db.refresh(new_voucher)

        return new_voucher

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Billing could not be saved because of a database constraint"
        )

    except Exception:
        db.rollback()
        raise


@router.patch(
    "/{voucher_id}",
    response_model=VoucherResponse
)
def update_voucher(
    voucher_id: int,
    voucher_data: VoucherUpdate,
    db: Session = Depends(get_db)
):
    try:
        # Find and lock the voucher.
        voucher = (
            db.query(Voucher)
            .filter(Voucher.id == voucher_id)
            .with_hint(
                Voucher,
                "WITH (UPDLOCK, HOLDLOCK)",
                dialect_name="mssql"
            )
            .first()
        )

        if not voucher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Billing voucher not found"
            )

        # Load existing voucher lines in a stable order.
        existing_items = (
            db.query(VoucherItem)
            .filter(VoucherItem.voucher_id == voucher_id)
            .order_by(VoucherItem.id)
            .all()
        )

        if not existing_items:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This voucher has no items to update"
            )

        # The current frontend edits dates and quantities only.
        # Do not allow product lines to be silently replaced.
        if len(existing_items) != len(voucher_data.items):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The voucher's product lines cannot be changed"
            )

                # Match each saved line to the sent line by product AND unit.
        remaining = list(voucher_data.items)
        ordered = []

        for old_item in existing_items:
            match = next(
                (
                    i for i in remaining
                    if i.product_id == old_item.product_id
                    and i.unit_id in (None, old_item.unit_id)
                ),
                None
            )

            if match is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The voucher's products cannot be changed"
                )

            remaining.remove(match)
            ordered.append(match)

        voucher_data.items = ordered

        product_ids = sorted({
            item.product_id for item in existing_items
        })

        # Lock products in a consistent order.
        products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids))
            .order_by(Product.id)
            .with_hint(
                Product,
                "WITH (UPDLOCK, HOLDLOCK)",
                dialect_name="mssql"
            )
            .all()
        )

        if len(products) != len(product_ids):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A product associated with this voucher no longer exists"
            )

        # Find the existing stock movements for these voucher lines.
        item_ids = [item.id for item in existing_items]

        movements = (
            db.query(StockMovement)
            .filter(
                StockMovement.voucher_item_id.in_(item_ids)
            )
            .order_by(StockMovement.id)
            .all()
        )

        movements_by_item = {
            movement.voucher_item_id: movement
            for movement in movements
        }

        # Every voucher line must have its original OUT movement.
        for item in existing_items:
            movement = movements_by_item.get(item.id)

            if (
                movement is None
                or movement.movement_type != "OUT"
                or movement.product_id != item.product_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "The original stock movement for this voucher "
                        "could not be verified. The voucher was not changed."
                    )
                )

        # Revised quantities per (product, unit). The unit of each line
        # is the unit it was originally billed in; it cannot change here.
        requested_quantities = {}

        for old_item, new_item in zip(
            existing_items,
            voucher_data.items
        ):
            key = (old_item.product_id, old_item.unit_id)
            requested_quantities[key] = (
                requested_quantities.get(key, Decimal("0")) + new_item.quantity
            )

        # Add back this voucher's original OUT quantities when
        # calculating stock available for the revised voucher.
        previous_quantities = {}

        for item in existing_items:
            movement = movements_by_item[item.id]
            key = (item.product_id, item.unit_id)

            previous_quantities[key] = (
                previous_quantities.get(key, Decimal("0"))
                + Decimal(str(movement.quantity))
            )

        products_by_id = {
            product.id: product
            for product in products
        }

        unit_names = {
            item.unit_id: item.unit_name_snapshot
            for item in existing_items
        }

        # Validate stock before changing anything.
        for (product_id, unit_id), requested_quantity in requested_quantities.items():
            available_stock = (
                stock_balance(db, product_id, unit_id)
                + previous_quantities.get((product_id, unit_id), Decimal("0"))
            )

            if available_stock < requested_quantity:
                product_name = products_by_id[product_id].product_name

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for {product_name} ({unit_names[unit_id]}). "
                        f"Available: {available_stock}, "
                        f"Requested: {requested_quantity}"
                    )
                )

        # Update existing voucher items and their original movements.
        for old_item, new_item in zip(
            existing_items,
            voucher_data.items
        ):
            old_item.quantity = new_item.quantity

            movement = movements_by_item[old_item.id]
            movement.quantity = new_item.quantity

        # Store the selected date at midnight.
        voucher.voucher_date = datetime.combine(
            voucher_data.voucher_date,
            datetime.min.time()
        )

        # Retain the existing database field for compatibility.
        # This is a raw sum, not a physical quantity across units.
        voucher.total_quantity = sum(
            (item.quantity for item in voucher_data.items),
            Decimal("0")
        )

        db.commit()
        db.refresh(voucher)

        return voucher

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Voucher update failed because of a database constraint"
        )

    except Exception:
        db.rollback()
        raise
@router.delete("/{voucher_id}")
def delete_voucher(
    voucher_id: int,
    db: Session = Depends(get_db)
):
    try:
        # Find and lock the voucher.
        voucher = (
            db.query(Voucher)
            .filter(Voucher.id == voucher_id)
            .with_hint(
                Voucher,
                "WITH (UPDLOCK, HOLDLOCK)",
                dialect_name="mssql"
            )
            .first()
        )

        if not voucher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Billing voucher not found"
            )

        items = (
            db.query(VoucherItem)
            .filter(VoucherItem.voucher_id == voucher_id)
            .all()
        )
        item_ids = [item.id for item in items]
        product_ids = sorted({item.product_id for item in items})

        if item_ids:
            # Lock products in a consistent order (same as create/update).
            (
                db.query(Product)
                .filter(Product.id.in_(product_ids))
                .order_by(Product.id)
                .with_hint(
                    Product,
                    "WITH (UPDLOCK, HOLDLOCK)",
                    dialect_name="mssql"
                )
                .all()
            )

            # 1. Removing the OUT movements restores the stock.
            db.query(StockMovement).filter(
                StockMovement.voucher_item_id.in_(item_ids)
            ).delete(synchronize_session=False)

            # 2. Remove the voucher lines.
            db.query(VoucherItem).filter(
                VoucherItem.voucher_id == voucher_id
            ).delete(synchronize_session=False)

        # 3. Remove the voucher.
        db.delete(voucher)
        db.commit()

        return {"message": "Voucher deleted"}

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Voucher could not be deleted because of a database constraint"
        )

    except Exception:
        db.rollback()
        raise