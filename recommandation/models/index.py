import tensorflow as tf
import tensorflow_recommenders as tfrs


def build_index(model, candidate_dataset):

    index = tfrs.layers.factorized_top_k.BruteForce(
        model.user_model
    )

    index.index_from_dataset(

        candidate_dataset.batch(128).map(

            lambda x: (

                x["product_id"],

                model.product_model(x)

            )

        )

    )

    return index