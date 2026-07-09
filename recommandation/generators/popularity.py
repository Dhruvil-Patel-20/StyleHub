from typing import List, Dict


def calculate_popularity(products: List[Dict]) -> List[Dict]:
    """
    Calculate a popularity score for each product.
    """

    if not products:
        return products

    max_reviews = max(
        (product.get("num_reviews") or 0)
        for product in products
    )

    if max_reviews == 0:
        max_reviews = 1

    for product in products:

        rating = float(product.get("rating") or 0)

        reviews = int(product.get("num_reviews") or 0)

        featured = 1 if product.get("featured") else 0

        stock = int(product.get("stock") or 0)

        review_score = reviews / max_reviews

        popularity = (
            rating * 0.45 +
            review_score * 0.30 +
            featured * 0.15 +
            (1 if stock > 0 else 0) * 0.10
        )

        product["popularity_score"] = round(popularity, 4)

    return products