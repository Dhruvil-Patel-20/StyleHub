import random
from datetime import datetime, timedelta


class ShoppingSession:

    def __init__(self, persona, products):

        self.persona = persona
        self.products = products

        self.events = []

    def generate(self, user_id):

        if not self.products:
            return []

        session_time = datetime.now() - timedelta(
            days=random.randint(0, 30)
        )

        # Select one category

        categories = list(
            set(
                p["category"]
                for p in self.products
            )
        )

        category = random.choice(categories)

        category_products = [
            p
            for p in self.products
            if p["category"] == category
        ]

        random.shuffle(category_products)

        viewed = category_products[
            : random.randint(3, min(8, len(category_products)))
        ]

        for product in viewed:

            self.events.append({

                "user_id": user_id,

                "product_id": product["id"],

                "event": "view",

                "timestamp": session_time

            })

            session_time += timedelta(
                minutes=random.randint(1, 5)
            )

            if random.random() < self.persona["cart_probability"]:

                self.events.append({

                    "user_id": user_id,

                    "product_id": product["id"],

                    "event": "add_to_cart",

                    "timestamp": session_time

                })

                session_time += timedelta(
                    minutes=random.randint(1, 3)
                )

                if random.random() < self.persona["purchase_probability"]:

                    self.events.append({

                        "user_id": user_id,

                        "product_id": product["id"],

                        "event": "purchase",

                        "timestamp": session_time

                    })

                    session_time += timedelta(
                        minutes=random.randint(2, 10)
                    )

        return self.events