from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd

EVENT_WEIGHTS = {
    "view": 1.0,
    "add_to_cart": 2.5,
    "purchase": 5.0,
}


def load_interactions(csv_path: str | Path | None = None) -> pd.DataFrame:
    default_path = Path(__file__).resolve().parents[1] / "data" / "interactions.csv"
    source_path = Path(csv_path) if csv_path else default_path

    frame = pd.read_csv(source_path)
    frame = frame.copy()
    frame["user_id"] = frame["user_id"].astype(str)
    frame["product_id"] = frame["product_id"].astype(str)
    frame["event"] = frame.get("event", "view").fillna("view").astype(str).str.lower()
    frame["category"] = frame.get("category", "general").fillna("general").astype(str)
    frame["sub_category"] = frame.get("sub_category", "general").fillna("general").astype(str)
    frame["weight"] = frame["event"].map(EVENT_WEIGHTS).fillna(1.0).astype(float)
    frame["timestamp"] = pd.to_datetime(frame.get("timestamp"), errors="coerce")
    frame = frame.sort_values(["timestamp", "user_id"], na_position="last")
    return frame


def prepare_training_frame(interactions: pd.DataFrame) -> pd.DataFrame:
    frame = interactions.copy()
    frame["user_id"] = frame["user_id"].astype(str)
    frame["product_id"] = frame["product_id"].astype(str)
    frame["weight"] = frame.get("weight", 1.0).fillna(1.0).astype(float)
    return frame[["user_id", "product_id", "weight", "category", "sub_category"]]
