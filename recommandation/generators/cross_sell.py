from collections import defaultdict


class CrossSellEngine:

    def __init__(self, products):
        self.products = products
        self.relationships = self._build_relationships()

    def _build_relationships(self):

        relationships = defaultdict(set)

        for product in self.products:

            category = (product.get("category") or "").strip()
            sub_category = (product.get("sub_category") or "").strip()

            if category:
                relationships[category].add(category)

            if sub_category:
                relationships[category].add(sub_category)
                relationships[sub_category].add(category)

        return relationships

    def related_categories(self, category):

        return list(
            self.relationships.get(category, [])
        )