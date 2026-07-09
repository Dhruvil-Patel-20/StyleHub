from utils.dataset import load_products
from generators.cross_sell import CrossSellEngine

products = load_products()

engine = CrossSellEngine(products)

for category in engine.relationships:
    print(
        category,
        "=>",
        engine.related_categories(category)
    )