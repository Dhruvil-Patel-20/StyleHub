import tensorflow as tf
import tensorflow_recommenders as tfrs

from models.user_model import UserModel
from models.product_model import ProductModel


class StyleHubRetrievalModel(tfrs.models.Model):

    def __init__(
        self,
        user_ids,
        product_ids,
        categories,
        sub_categories,
        candidate_dataset,
    ):
        super().__init__()

        self.user_model = UserModel(user_ids)

        self.product_model = ProductModel(
            product_ids,
            categories,
            sub_categories
        )

        self.task = tfrs.tasks.Retrieval(
            metrics=tfrs.metrics.FactorizedTopK(
                candidates=candidate_dataset.batch(128).map(
                    lambda x: (
                        x["product_id"],
                        self.product_model(x)
                    )
                )
            )
        )

    def compute_loss(self, features, training=False):

        user_embeddings = self.user_model(
            features["user_id"]
        )

        product_embeddings = self.product_model(features)

        return self.task(
            user_embeddings=user_embeddings,
            candidate_embeddings=product_embeddings
        )