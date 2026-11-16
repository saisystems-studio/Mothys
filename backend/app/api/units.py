
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.units import Unit
from app.schemas.units import UnitCreate, UnitUpdate, UnitResponse
from app.core.security import get_current_user
router = APIRouter(
    prefix="/units",
    tags=["Units"],
    dependencies=[Depends(get_current_user)]
)
from sqlalchemy.exc import IntegrityError
from app.models.products import Product
from app.models.voucher_items import VoucherItem

@router.get("/", response_model=list[UnitResponse])
def get_units(db: Session = Depends(get_db)):
    return db.query(Unit).order_by(Unit.id).all()


@router.post(
    "/",
    response_model=UnitResponse,
    status_code=status.HTTP_201_CREATED
)
def create_unit(
    unit_data: UnitCreate,
    db: Session = Depends(get_db)
):
    existing_unit = db.query(Unit).filter(
        Unit.unit_name == unit_data.unit_name
    ).first()

    if existing_unit:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unit already exists"
        )

    new_unit = Unit(unit_name=unit_data.unit_name)

    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)

    return new_unit


@router.patch("/{unit_id}", response_model=UnitResponse)
def update_unit(
    unit_id: int,
    unit_data: UnitUpdate,
    db: Session = Depends(get_db)
):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()

    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unit not found"
        )

    update_data = unit_data.model_dump(exclude_unset=True)

    if "unit_name" in update_data and update_data["unit_name"] is not None:
        existing_unit = db.query(Unit).filter(
            Unit.unit_name == update_data["unit_name"],
            Unit.id != unit_id
        ).first()

        if existing_unit:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Unit name already exists"
            )

    for field, value in update_data.items():
        setattr(unit, field, value)

    db.commit()
    db.refresh(unit)

    return unit
@router.delete("/{unit_id}", status_code=204)
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()

    if not unit:
        raise HTTPException(
            status_code=404,
            detail="Unit not found."
        )

    has_products = (
        db.query(Product)
        .filter(Product.unit_id == unit_id)
        .first()
    )

    if has_products:
        raise HTTPException(
            status_code=409,
            detail="Unit cannot be deleted because products are assigned to it. Deactivate it instead."
        )

    has_voucher_history = (
        db.query(VoucherItem)
        .filter(VoucherItem.unit_id == unit_id)
        .first()
    )

    if has_voucher_history:
        raise HTTPException(
            status_code=409,
            detail="Unit cannot be deleted because billing history references it. Deactivate it instead."
        )

    try:
        db.delete(unit)
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Unit cannot be deleted because it is referenced by existing records."
        )