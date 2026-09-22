from fastapi import FastAPI

from .models import ListingAnalysisRequest, ListingAnalysisResponse
from .scoring import analyze_listing

app = FastAPI(
    title="VutaBiz Marketplace Intelligence",
    version="0.1.0",
    description="Optional intelligence services for VutaBiz marketplace listings.",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "marketplace-intelligence"}


@app.post("/v1/listings/analyze", response_model=ListingAnalysisResponse)
def analyze(request: ListingAnalysisRequest) -> ListingAnalysisResponse:
    return analyze_listing(request)
