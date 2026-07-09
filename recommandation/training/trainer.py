from __future__ import annotations

from pathlib import Path

from models.recommendation_model import RecommendationModel
from training.dataset import load_interactions, prepare_training_frame


class RecommendationTrainer:
    def __init__(self, model_path: str | Path | None = None) -> None:
        self.model_path = Path(model_path) if model_path else Path(__file__).resolve().parents[1] / "saved_models" / "recommendation_model.pkl"
        self.model = RecommendationModel()

    def train(self, interactions_path: str | Path | None = None) -> RecommendationModel:
        interactions = load_interactions(interactions_path)
        frame = prepare_training_frame(interactions)
        self.model.fit(frame)
        self.model.save(self.model_path)
        return self.model

    def load(self) -> RecommendationModel:
        if self.model_path.exists():
            self.model = RecommendationModel.load(self.model_path)
        return self.model
