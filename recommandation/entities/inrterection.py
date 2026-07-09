from dataclasses import dataclass
from datetime import datetime


@dataclass
class Interaction:

    user_id: str

    product_id: str

    event: str

    timestamp: datetime

    category: str

    sub_category: str

    seller_id: str | None

    price: float

    persona: str