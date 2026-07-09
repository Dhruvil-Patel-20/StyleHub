from pathlib import Path

from fastapi import FastAPI

from models.inference import RecommendationInference
from training.trainer import RecommendationTrainer

app = FastAPI(title="StyleHub Recommendation API")

MODEL_PATH = Path(__file__).resolve().parent / "saved_models" / "recommendation_model.pkl"
service: RecommendationInference | None = None


@app.on_event("startup")
async def startup_event() -> None:
    global service
    if MODEL_PATH.exists():
        service = RecommendationInference(MODEL_PATH)
    else:
        trainer = RecommendationTrainer(MODEL_PATH)
        trainer.train("data/interactions.csv")
        service = RecommendationInference(MODEL_PATH)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/recommend/{user_id}")
def recommend(user_id: str, top_k: int = 10) -> dict:
    if service is None:
        return {"user_id": user_id, "recommendations": []}
    return {
        "user_id": user_id,
        "recommendations": service.recommend(user_id, top_k=top_k),
    }


@app.post("/train")
def train() -> dict:
    trainer = RecommendationTrainer(MODEL_PATH)
    trainer.train("data/interactions.csv")
    global service
    service = RecommendationInference(MODEL_PATH)
    return {"status": "trained", "model_path": str(MODEL_PATH)}