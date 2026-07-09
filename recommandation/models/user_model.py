import tensorflow as tf


class UserModel(tf.keras.Model):
    def __init__(self, user_ids):
        super().__init__()

        self.user_lookup = tf.keras.layers.StringLookup(
            vocabulary=user_ids,
            mask_token=None
        )

        self.user_embedding = tf.keras.Sequential([
            self.user_lookup,
            tf.keras.layers.Embedding(
                input_dim=len(user_ids) + 1,
                output_dim=64
            )
        ])

    def call(self, user_id):
        return self.user_embedding(user_id)