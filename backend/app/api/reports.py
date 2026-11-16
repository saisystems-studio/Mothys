
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user

from app.models.vouchers import Voucher
from app.models.voucher_items import VoucherItem


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
    dependencies=[Depends(get_current_user)]
)


def apply_date_filters(query, start_date, end_date):

    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be later than end date"
        )

    if start_date:
        query = query.filter(
            Voucher.voucher_date >= datetime.combine(
                start_date, time.min
            )
        )

    if end_date:
        query = query.filter(
            Voucher.voucher_date < datetime.combine(
                end_date + timedelta(days=1), time.min
            )
        )

    return query


@router.get("/voucher-details")
def get_voucher_details(
    start_date: date | None = None,
    end_date: date | None = None,
    product_id: int | None = None,
    db: Session = Depends(get_db)
):

    query = (
        db.query(Voucher, VoucherItem)
        .join(
            VoucherItem,
            Voucher.id == VoucherItem.voucher_id
        )
    )

    query = apply_date_filters(
        query,
        start_date,
        end_date
    )

    if product_id is not None:
        query = query.filter(
            VoucherItem.product_id == product_id
        )

    results = query.order_by(
        Voucher.voucher_date.desc(),
        Voucher.id.desc()
    ).all()

    return [
        {
            "voucher_id": voucher.id,
            "voucher_number": voucher.voucher_number,
            "voucher_date": voucher.voucher_date,
            "product_id": item.product_id,
            "product_name": item.product_name_snapshot,
            "unit_name": item.unit_name_snapshot,
            "quantity": item.quantity
        }
        for voucher, item in results
    ]


@router.get("/billing-summary")
def get_billing_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    product_id: int | None = None,
    db: Session = Depends(get_db)
):

    query = (
        db.query(
            func.count(func.distinct(Voucher.id)).label(
                "total_billings"
            ),
            func.coalesce(
                func.sum(VoucherItem.quantity),
                0
            ).label("total_quantity_billed")
        )
        .join(
            VoucherItem,
            Voucher.id == VoucherItem.voucher_id
        )
    )

    query = apply_date_filters(
        query,
        start_date,
        end_date
    )

    if product_id is not None:
        query = query.filter(
            VoucherItem.product_id == product_id
        )

    result = query.one()

    return {
        "total_billings": result.total_billings,
        "total_quantity_billed": result.total_quantity_billed
    }


@router.get("/product-billing-summary")
def get_product_billing_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db)
):

    query = (
        db.query(
            VoucherItem.product_id,
            VoucherItem.product_name_snapshot.label(
                "product_name"
            ),
            VoucherItem.unit_name_snapshot.label(
                "unit_name"
            ),
            func.count(
                func.distinct(Voucher.id)
            ).label("total_billings"),
            func.sum(
                VoucherItem.quantity
            ).label("total_quantity_billed")
        )
        .join(
            Voucher,
            Voucher.id == VoucherItem.voucher_id
        )
    )

    query = apply_date_filters(
        query,
        start_date,
        end_date
    )

    results = query.group_by(
        VoucherItem.product_id,
        VoucherItem.product_name_snapshot,
        VoucherItem.unit_name_snapshot
    ).order_by(
        VoucherItem.product_name_snapshot
    ).all()

    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "unit_name": row.unit_name,
            "total_billings": row.total_billings,
            "total_quantity_billed": row.total_quantity_billed
        }
        for row in results
    ]
