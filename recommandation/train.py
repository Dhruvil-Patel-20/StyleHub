from pathlib import Path

from training.trainer import RecommendationTrainer

MODEL_PATH = Path("saved_models/recommendation_model.pkl")


def main() -> None:
    trainer = RecommendationTrainer(MODEL_PATH)
    trainer.train("data/interactions.csv")
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()