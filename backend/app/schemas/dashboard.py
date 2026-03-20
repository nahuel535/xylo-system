from pydantic import BaseModel
from decimal import Decimal


class DashboardSummary(BaseModel):
    total_products_in_stock: int
    total_stock_value_usd: Decimal
    total_sales_count: int
    total_sales_value_usd: Decimal
    total_gross_profit_usd: Decimal
    sales_today_count: int
    sales_today_value_usd: Decimal
    sales_this_month_count: int
    sales_this_month_value_usd: Decimal
    profit_this_month_usd: Decimal
    cost_this_month_usd: Decimal
    sales_last_month_count: int
    sales_last_month_value_usd: Decimal
    profit_last_month_usd: Decimal


class MonthStat(BaseModel):
    year: int
    month: int
    label: str
    sales_count: int
    revenue_usd: float
    profit_usd: float
    cost_usd: float
