import tensorflow as tf


class ProductModel(tf.keras.Model):
    def __init__(
        self,
        product_ids,
        categories,
        sub_categories
    ):
        super().__init__()

        self.product_lookup = tf.keras.layers.StringLookup(
            vocabulary=product_ids,
            mask_token=None
        )

        self.category_lookup = tf.keras.layers.StringLookup(
            vocabulary=categories,
            mask_token=None
        )

        self.subcategory_lookup = tf.keras.layers.StringLookup(
            vocabulary=sub_categories,
            mask_token=None
        )

        self.product_embedding = tf.keras.layers.Embedding(
            len(product_ids) + 1,
            32
        )

        self.category_embedding = tf.keras.layers.Embedding(
            len(categories) + 1,
            16
        )

        self.subcategory_embedding = tf.keras.layers.Embedding(
            len(sub_categories) + 1,
            16
        )

        self.dense = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dense(64)
        ])

    def call(self, inputs):

        product = self.product_embedding(
            self.product_lookup(inputs["product_id"])
        )

        category = self.category_embedding(
            self.category_lookup(inputs["category"])
        )

        sub_category = self.subcategory_embedding(
            self.subcategory_lookup(inputs["sub_category"])
        )

        x = tf.concat(
            [
                product,
                category,
                sub_category
            ],
            axis=1
        )

        return self.dense(x)