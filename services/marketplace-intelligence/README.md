# VutaBiz Marketplace Intelligence Service

This directory introduces an optional Python service for marketplace intelligence.

The first contribution is deliberately isolated from the existing TypeScript application so it can be reviewed and deployed independently without changing VutaBiz's core runtime.

## Initial capabilities

- Listing quality scoring
- Missing-field detection
- Basic title and description quality checks
- Category and pricing recommendation extension points

## Run locally

```bash
cd services/marketplace-intelligence
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## API

`GET /health` returns service status.

`POST /v1/listings/analyze` accepts a marketplace listing and returns a quality score, issues, and recommendations.

This service does not require Supabase credentials for the initial implementation. The TypeScript application remains responsible for authentication, authorization, and database access.
