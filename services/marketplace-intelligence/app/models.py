from pydantic import BaseModel, Field


class ListingAnalysisRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=10000)
    category: str | None = None
    price: float | None = Field(default=None, ge=0)
    image_count: int = Field(default=0, ge=0)
    location: str | None = None


class ListingAnalysisResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    grade: str
    issues: list[str]
    recommendations: list[str]
