import pandas as pd

EVENT_WEIGHTS = {
    "view": 1,
    "add_to_cart": 3,
    "purchase": 5,
}


def preprocess_interactions(csv_path: str) -> pd.DataFrame:
    """
    Load and prepare interactions for model training.
    """

    df = pd.read_csv(csv_path)

    df["interaction_weight"] = (
        df["event"]
        .map(EVENT_WEIGHTS)
        .fillna(1)
        .astype(int)
    )

    df["user_id"] = df["user_id"].astype(str)
    df["product_id"] = df["product_id"].astype(str)

    return df