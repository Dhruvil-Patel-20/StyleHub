from __future__ import annotations

import pickle
from pathlib import Path
from typing import Iterable

from sklearn.preprocessing import LabelEncoder


class ProductEncoder:
    def __init__(self) -> None:
        self.encoder = LabelEncoder()

    def fit(self, product_ids: Iterable[str]) -> "ProductEncoder":
        self.encoder.fit(list(product_ids))
        return self

    def transform(self, product_ids: Iterable[str]) -> list[int]:
        return self.encoder.transform(list(product_ids)).tolist()

    def inverse_transform(self, codes: Iterable[int]) -> list[str]:
        return self.encoder.inverse_transform(list(codes)).tolist()

    def save(self, path: str | Path) -> None:
        target_path = Path(path)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with target_path.open("wb") as handle:
            pickle.dump(self.encoder, handle)

    @classmethod
    def load(cls, path: str | Path) -> "ProductEncoder":
        instance = cls()
        with Path(path).open("rb") as handle:
            instance.encoder = pickle.load(handle)
        return instance
