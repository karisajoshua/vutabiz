from .models import ListingAnalysisRequest, ListingAnalysisResponse


def analyze_listing(listing: ListingAnalysisRequest) -> ListingAnalysisResponse:
    score = 100
    issues: list[str] = []
    recommendations: list[str] = []

    title_words = listing.title.split()
    if len(title_words) < 3:
        score -= 15
        issues.append("Title is too short to describe the item clearly.")
        recommendations.append("Use a descriptive title with the brand, model, or key feature.")

    if len(listing.description.strip()) < 50:
        score -= 20
        issues.append("Description provides limited buyer information.")
        recommendations.append("Add condition, specifications, included items, and other important details.")

    if not listing.category:
        score -= 15
        issues.append("Category is missing.")
        recommendations.append("Select the most specific marketplace category available.")

    if listing.price is None or listing.price <= 0:
        score -= 15
        issues.append("A valid price has not been provided.")
        recommendations.append("Provide a realistic asking price when the listing type requires one.")

    if listing.image_count == 0:
        score -= 25
        issues.append("Listing has no images.")
        recommendations.append("Add clear, recent photos of the actual item.")
    elif listing.image_count < 3:
        score -= 10
        recommendations.append("Add multiple angles to improve buyer confidence.")

    if not listing.location:
        score -= 10
        issues.append("Location is missing.")
        recommendations.append("Add the relevant location so buyers can assess collection or delivery options.")

    score = max(0, score)
    grade = "excellent" if score >= 85 else "good" if score >= 70 else "fair" if score >= 50 else "needs_improvement"

    if not recommendations:
        recommendations.append("Listing contains the core information buyers need.")

    return ListingAnalysisResponse(
        score=score,
        grade=grade,
        issues=issues,
        recommendations=recommendations,
    )
