from __future__ import annotations

import pickle
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
from sklearn.decomposition import NMF

from models.product_encoder import ProductEncoder
from models.user_encoder import UserEncoder


class RecommendationModel:
    def __init__(self, n_components: int = 16, random_state: int = 42) -> None:
        self.n_components = n_components
        self.random_state = random_state
        self.user_encoder = UserEncoder()
        self.product_encoder = ProductEncoder()
        self.user_factors: np.ndarray | None = None
        self.product_factors: np.ndarray | None = None
        self.popularity: np.ndarray | None = None
        self.user_seen_products: dict[str, set[str]] = {}

    def fit(self, interactions: pd.DataFrame) -> "RecommendationModel":
        frame = interactions.copy()
        frame["user_id"] = frame["user_id"].astype(str)
        frame["product_id"] = frame["product_id"].astype(str)
        frame["weight"] = frame.get("weight", 1.0).fillna(1.0).astype(float)

        self.user_encoder.fit(frame["user_id"].unique())
        self.product_encoder.fit(frame["product_id"].unique())

        user_codes = self.user_encoder.transform(frame["user_id"])
        product_codes = self.product_encoder.transform(frame["product_id"])
        weights = frame["weight"].to_numpy(dtype=float)

        matrix = np.zeros(
            (len(self.user_encoder.encoder.classes_), len(self.product_encoder.encoder.classes_)),
            dtype=float,
        )
        for user_code, product_code, weight in zip(user_codes, product_codes, weights):
            matrix[user_code, product_code] += float(weight)

        self.user_seen_products = {
            str(user_id): set(group["product_id"].astype(str))
            for user_id, group in frame.groupby("user_id")
        }

        self.popularity = matrix.sum(axis=0)
        if matrix.shape[0] < 2 or matrix.shape[1] < 2:
            self.user_factors = np.zeros((matrix.shape[0], self.n_components), dtype=float)
            self.product_factors = np.zeros((matrix.shape[1], self.n_components), dtype=float)
            return self

        n_components = min(self.n_components, min(matrix.shape) - 1)
        model = NMF(
            n_components=n_components,
            init="nndsvda",
            random_state=self.random_state,
            max_iter=500,
        )
        self.user_factors = model.fit_transform(matrix)
        self.product_factors = model.components_.T
        return self

    def recommend(self, user_id: str, top_k: int = 10, exclude: Iterable[str] | None = None) -> list[str]:
        exclude = set(exclude or [])
        if not isinstance(user_id, str):
            user_id = str(user_id)

        try:
            user_code = self.user_encoder.transform([user_id])[0]
        except ValueError:
            return self._fallback_recommendations(top_k=top_k, exclude=exclude)

        seen = set(self.user_seen_products.get(user_id, set())) | exclude
        if self.user_factors is None or self.product_factors is None:
            return self._fallback_recommendations(top_k=top_k, exclude=seen)

        scores = self.user_factors[user_code] @ self.product_factors.T
        ranked_indexes = np.argsort(scores)[::-1]

        recommendations: list[str] = []
        for index in ranked_indexes:
            product_id = self.product_encoder.inverse_transform([int(index)])[0]
            if product_id in seen:
                continue
            recommendations.append(product_id)
            if len(recommendations) >= top_k:
                break

        if len(recommendations) < top_k:
            fallback = self._fallback_recommendations(
                top_k=top_k - len(recommendations),
                exclude=seen | set(recommendations),
            )
            recommendations.extend(fallback)

        return recommendations[:top_k]

    def _fallback_recommendations(self, top_k: int, exclude: Iterable[str] | None = None) -> list[str]:
        if self.popularity is None:
            return []

        exclude = set(exclude or [])
        ranked_indexes = np.argsort(self.popularity)[::-1]
        recommendations: list[str] = []
        for index in ranked_indexes:
            product_id = self.product_encoder.inverse_transform([int(index)])[0]
            if product_id in exclude:
                continue
            recommendations.append(product_id)
            if len(recommendations) >= top_k:
                break
        return recommendations

    def save(self, path: str | Path) -> None:
        target_path = Path(path)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "n_components": self.n_components,
            "random_state": self.random_state,
            "user_encoder": self.user_encoder,
            "product_encoder": self.product_encoder,
            "user_factors": self.user_factors,
            "product_factors": self.product_factors,
            "popularity": self.popularity,
            "user_seen_products": self.user_seen_products,
        }
        with target_path.open("wb") as handle:
            pickle.dump(payload, handle)

    @classmethod
    def load(cls, path: str | Path) -> "RecommendationModel":
        instance = cls()
        with Path(path).open("rb") as handle:
            payload = pickle.load(handle)
        instance.n_components = payload.get("n_components", instance.n_components)
        instance.random_state = payload.get("random_state", instance.random_state)
        instance.user_encoder = payload.get("user_encoder", instance.user_encoder)
        instance.product_encoder = payload.get("product_encoder", instance.product_encoder)
        instance.user_factors = payload.get("user_factors")
        instance.product_factors = payload.get("product_factors")
        instance.popularity = payload.get("popularity")
        instance.user_seen_products = payload.get("user_seen_products", {})
        return instance
