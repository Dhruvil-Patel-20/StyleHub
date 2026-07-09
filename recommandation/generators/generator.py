import random
import pandas as pd

from utils.dataset import load_products

from generators.personas import PERSONAS
from generators.popularity import calculate_popularity
from generators.sessions import ShoppingSession


class InteractionGenerator:

    def __init__(self):

        self.products = calculate_popularity(
            load_products()
        )

    def generate(self, users=1000):

        rows = []

        persona_names = list(PERSONAS.keys())

        for i in range(users):

            user_id = f"user_{i+1}"

            persona_name = random.choice(persona_names)

            persona = PERSONAS[persona_name]

            session = ShoppingSession(
                persona,
                self.products
            )

            events = session.generate(user_id)

            for event in events:

                product = next(
                    p
                    for p in self.products
                    if p["id"] == event["product_id"]
                )

                rows.append({

                    "user_id": user_id,

                    "product_id": event["product_id"],

                    "event": event["event"],

                    "timestamp": event["timestamp"],

                    "persona": persona_name,

                    "category": product["category"],

                    "sub_category": product["sub_category"],

                    "price": product["price"],

                    "seller_id": product["seller_id"]

                })

        return pd.DataFrame(rows)