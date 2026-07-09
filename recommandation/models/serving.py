import tensorflow as tf


class RecommendationService:

    def __init__(self, model_path):

        self.model = tf.saved_model.load(model_path)

    def recommend(self, user_id, k=10):

        scores, ids = self.model(
            tf.constant([user_id])
        )

        return [
            x.decode("utf-8")
            for x in ids.numpy()[0][:k]
        ]