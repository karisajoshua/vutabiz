from app.models import ListingAnalysisRequest
from app.scoring import analyze_listing


def test_complete_listing_scores_highly() -> None:
    listing = ListingAnalysisRequest(
        title="Samsung Galaxy S25 Ultra 256GB",
        description=(
            "Excellent condition phone with original box, charging cable, "
            "receipt, and a clean screen. Available for inspection before purchase."
        ),
        category="Phones & Tablets",
        price=95000,
        image_count=5,
        location="Nairobi",
    )

    result = analyze_listing(listing)

    assert result.score == 100
    assert result.grade == "excellent"
    assert result.issues == []


def test_incomplete_listing_returns_actionable_feedback() -> None:
    listing = ListingAnalysisRequest(
        title="Phone",
        description="Good phone",
        price=0,
        image_count=0,
    )

    result = analyze_listing(listing)

    assert result.score < 50
    assert result.grade == "needs_improvement"
    assert "Category is missing." in result.issues
    assert "Listing has no images." in result.issues
    assert "Location is missing." in result.issues
