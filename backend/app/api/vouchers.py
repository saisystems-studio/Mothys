
from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import get_current_user

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
    dependencies=[Depends(get_current_user)]
)


@router.get("/", response_model=list[VoucherResponse])
def get_vouchers(db: Session = Depends(get_db)):
    return db.query(Voucher).order_by(
        Voucher.id.desc()
    ).all()


@router.get(
    "/{voucher_id}/items",
    response_model=list[VoucherItemResponse]
)
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

        for old_item, new_item in zip(
            existing_items,
            voucher_data.items
        ):
            if old_item.product_id != new_item.product_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The voucher's products cannot be changed"
                )

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

        # Combine the revised quantities by product.
        requested_quantities = {}

        for item in voucher_data.items:
            requested_quantities[item.product_id] = (
                requested_quantities.get(
                    item.product_id,
                    Decimal("0")
                ) + item.quantity
            )

        # Add back this voucher's original OUT quantities when
        # calculating stock available for the revised voucher.
        previous_quantities = {}

        for item in existing_items:
            movement = movements_by_item[item.id]

            previous_quantities[item.product_id] = (
                previous_quantities.get(
                    item.product_id,
                    Decimal("0")
                ) + Decimal(str(movement.quantity))
            )

        products_by_id = {
            product.id: product
            for product in products
        }

        # Validate stock before changing anything.
        for product_id, requested_quantity in requested_quantities.items():

            current_stock = db.query(
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
                StockMovement.product_id == product_id
            ).scalar()

            current_stock = Decimal(str(current_stock or 0))

            available_stock = (
                current_stock
                + previous_quantities.get(
                    product_id,
                    Decimal("0")
                )
            )

            if available_stock < requested_quantity:
                product_name = products_by_id[
                    product_id
                ].product_name

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for {product_name}. "
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
def create_billing(
    voucher_data: VoucherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Combine quantities for repeated products.
    requested_quantities = {}

    for item in voucher_data.items:
        requested_quantities[item.product_id] = (
            requested_quantities.get(
                item.product_id, Decimal("0")
            ) + item.quantity
        )

    product_ids = sorted(requested_quantities.keys())

    try:
        # Lock product rows in a consistent order.
        # This prevents simultaneous bills from overselling
        # the same product.
        products = (
            db.query(Product)
            .filter(
                Product.id.in_(product_ids),
                Product.is_active == True
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

        # Validate stock for every product before creating billing.
        for product_id, requested_quantity in requested_quantities.items():

            available_stock = db.query(
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
                StockMovement.product_id == product_id
            ).scalar()

            available_stock = Decimal(str(available_stock))

            if available_stock < requested_quantity:
                product_name = products_by_id[
                    product_id
                ].product_name

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for {product_name}. "
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
        for item in voucher_data.items:
            product = products_by_id[item.product_id]

            unit = db.query(Unit).filter(
                Unit.id == product.unit_id
            ).first()

            if not unit:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unit not found for {product.product_name}"
                )

            new_item = VoucherItem(
                voucher_id=new_voucher.id,
                product_id=product.id,
                unit_id=product.unit_id,
                product_name_snapshot=product.product_name,
                unit_name_snapshot=unit.unit_name,
                quantity=item.quantity
            )

            db.add(new_item)
            db.flush()

            stock_movement = StockMovement(
                product_id=product.id,
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
