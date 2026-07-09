from __future__ import annotations

from pathlib import Path

from models.recommendation_model import RecommendationModel


class RecommendationInference:
    def __init__(self, model_path: str | Path) -> None:
        self.model_path = Path(model_path)
        self.model = RecommendationModel.load(self.model_path) if self.model_path.exists() else RecommendationModel()

    def recommend(self, user_id: str, top_k: int = 10) -> list[str]:
        if self.model is None:
            return []
        return self.model.recommend(user_id=user_id, top_k=top_k)
