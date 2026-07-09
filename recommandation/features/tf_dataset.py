import tensorflow as tf


def dataframe_to_dataset(df):

    dataset = tf.data.Dataset.from_tensor_slices({

        "user_id": df["user_id"].astype(str),

        "product_id": df["product_id"].astype(str),

        "category": df["category"].astype(str),

        "sub_category": df["sub_category"].astype(str)

    })

    return dataset