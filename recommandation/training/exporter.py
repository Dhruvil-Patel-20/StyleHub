from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from models.inference import RecommendationInference


class RecommendationExporter:
    def __init__(self, model_path: str | Path) -> None:
        self.model_path = Path(model_path)
        self.inference = RecommendationInference(self.model_path)

    def export_json(self, user_id: str, top_k: int = 10) -> dict[str, Any]:
        recommendations = self.inference.recommend(user_id=user_id, top_k=top_k)
        return {"user_id": user_id, "recommendations": recommendations}

    def save_json(self, user_id: str, output_path: str | Path, top_k: int = 10) -> Path:
        payload = self.export_json(user_id=user_id, top_k=top_k)
        target_path = Path(output_path)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with target_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
        return target_path
