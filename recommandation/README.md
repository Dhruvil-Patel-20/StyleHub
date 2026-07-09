# StyleHub Recommendation System

This recommendation service supports:
- training from synthetic data and future site interaction data
- fast recommendations for a given user
- exporting recommendations as JSON for your storefront

## Quick start

1. Activate your Python 3.11 virtual environment.
2. Run training:
   ```bash
   python train.py
   ```
3. Start the API:
   ```bash
   uvicorn app:app --reload
   ```
4. Open:
   - http://127.0.0.1:8000/health
   - http://127.0.0.1:8000/recommend/user_1

## Data flow

- Put site interaction data in data/interactions.csv
- The trainer uses that file to build the recommendation model
- The API serves recommendations for any user ID
