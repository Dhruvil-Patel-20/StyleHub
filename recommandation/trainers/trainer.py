import tensorflow as tf

from models.retrieval_model import StyleHubRetrievalModel
from models.index import build_index


class Trainer:

    def __init__(

        self,

        train_dataset,

        candidate_dataset,

        user_ids,

        product_ids,

        categories,

        sub_categories

    ):

        self.model = StyleHubRetrievalModel(

            user_ids,

            product_ids,

            categories,

            sub_categories,

            candidate_dataset

        )

        self.model.compile(

            optimizer=tf.keras.optimizers.Adagrad(0.1)

        )

        self.train_dataset = train_dataset

        self.candidate_dataset = candidate_dataset

    def train(self, epochs=5):

        self.model.fit(

            self.train_dataset,

            epochs=epochs

        )

    def save(self, path):

        index = build_index(

            self.model,

            self.candidate_dataset

        )

        tf.saved_model.save(

            index,

            path

        )