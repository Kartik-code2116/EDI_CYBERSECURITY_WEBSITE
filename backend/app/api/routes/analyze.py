"""
FastAPI router — Analysis endpoints

POST /api/analyze/url        — URL-only analysis (fast)
POST /api/analyze/page       — Full page analysis with metadata
POST /api/analyze/screenshot — Vision analysis from screenshot
GET  /api/health             — Health check
GET  /api/recent             — Recent analysis records
"""

import json
import time
import logging
import base64
import uuid
from typing import Optional
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import JSONResponse
from pathlib import Path
import tempfile

from app.schemas.models import (
    URLAnalysisRequest,
    PageAnalysisRequest,
    ScreenshotAnalysisRequest,
    ImageAnalysisResult as ImageAnalysisResultSchema,
    AnalysisResponse,
    HealthResponse,
    RiskResult as RiskResultSchema,
    URLFeatures as URLFeaturesSchema,
    PageFeatures as PageFeaturesSchema,
    VisionResult as VisionResultSchema,
    NLPResult as NLPResultSchema,
)
from app.services.url_analyzer.analyzer import URLAnalyzer
from app.services.page_analyzer.analyzer import PageAnalyzer
from app.services.vision.detector import VisionThreatDetector
from app.services.nlp.analyzer import SocialEngineeringAnalyzer
from app.services.risk_engine.engine import RiskEngine, RiskInput
from app.services.security_analyst.analyst import SecurityAnalyst
from app.services.image_analyzer.analyzer import analyze_image, ImageAnalysisError
from app.db.repository import AnalysisRepository
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()

# ── Service singletons (initialized once) ────────────────────────────────────
_url_analyzer = URLAnalyzer()
_page_analyzer = PageAnalyzer()
_vision_detector = VisionThreatDetector()      # mock until YOLO model is loaded
_nlp_analyzer = SocialEngineeringAnalyzer()
_risk_engine = RiskEngine()
_security_analyst = SecurityAnalyst()          # template mode until LLM is configured
_repository = AnalysisRepository()

MODEL_VERSIONS = {
    "url_analyzer": "rule_based_v1",
    "page_analyzer": "rule_based_v1",
    "vision_detector": "mock_placeholder_v1",
    "nlp_analyzer": "rule_based_v1",
    "risk_engine": "weighted_fusion_v1",
    "security_analyst": "template_v1",
}


# ── Health Check ──────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        services={
            "url_analyzer": "operational",
            "page_analyzer": "operational",
            "vision_detector": "placeholder_active",
            "nlp_analyzer": "operational",
            "risk_engine": "operational",
            "security_analyst": "operational",
            "database": "operational",
        }
    )


# ── URL Analysis ──────────────────────────────────────────────────────────────

@router.post("/analyze/url", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_url(request: URLAnalysisRequest):
    """
    Fast URL-only analysis. No network requests to the target URL.
    Best for quick pre-visit safety checks.
    """
    start_time = time.monotonic()
    url = request.url

    try:
        domain = urlparse(url).netloc or url[:50]

        # 1. URL Analysis
        url_result = _url_analyzer.analyze(url)

        # 2. Risk Fusion (URL-only, other signals = 0)
        risk_input = RiskInput(
            url_risk_score=url_result.risk_score,
            url_flags=url_result.risk_flags,
            has_ssl=url_result.features.has_https,
        )
        risk_result = _risk_engine.calculate(risk_input)

        # 3. Explanation
        analyst_output = _security_analyst.explain(risk_result, domain)

        # 4. Persist metadata (non-sensitive only)
        duration_ms = round((time.monotonic() - start_time) * 1000)
        analysis_id = _repository.save(
            domain=domain,
            risk_score=risk_result.risk_score,
            severity=risk_result.severity,
            model_version="url_v1",
            scan_duration_ms=duration_ms,
            threats_json=json.dumps(risk_result.threats),
        )

        f = url_result.features
        url_features_schema = URLFeaturesSchema(
            length=f.length,
            subdomain_count=f.subdomain_count,
            special_char_count=f.special_char_count,
            has_https=f.has_https,
            has_ip_address=f.has_ip_address,
            has_suspicious_tld=f.has_suspicious_tld,
            hyphen_count=f.hyphen_count,
            digit_count=f.digit_count,
            has_punycode=f.has_punycode,
            has_at_symbol=f.has_at_symbol,
            has_double_slash=f.has_double_slash,
            suspicious_keywords_found=f.suspicious_keywords_found,
            url_entropy=round(f.url_entropy, 3),
            domain=f.domain,
            tld=f.tld,
            path_length=f.path_length,
            query_param_count=f.query_param_count,
        )

        return AnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            url=url,
            domain=domain,
            risk=_risk_result_to_schema(risk_result),
            url_features=url_features_schema,
            explanation=analyst_output.explanation,
            recommendation=analyst_output.recommendation,
            model_versions=MODEL_VERSIONS,
            scan_duration_ms=duration_ms,
        )

    except Exception as exc:
        logger.error("URL analysis failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}")


# ── Full Page Analysis ────────────────────────────────────────────────────────

@router.post("/analyze/page", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_page(request: PageAnalysisRequest):
    """
    Full page analysis combining URL signals, page structure metadata, and NLP.
    The content script sends safe structural data — no passwords or sensitive values.
    """
    start_time = time.monotonic()
    url = request.url

    try:
        domain = urlparse(url).netloc or url[:50]

        # 1. URL Analysis
        url_result = _url_analyzer.analyze(url)

        # 2. Page Analysis (from metadata collected by content script)
        page_result = _page_analyzer.analyze_metadata(
            url=url,
            title=request.title or "",
            meta_description=request.meta_description or "",
            visible_text=request.visible_text or "",
            form_count=request.form_count,
            password_field_count=request.password_field_count,
            external_script_count=request.external_script_count,
            iframe_count=request.iframe_count,
            external_links=request.external_links or [],
            link_count=request.link_count,
        )

        # 3. NLP Analysis on visible text
        nlp_result = None
        nlp_schema = None
        if request.visible_text:
            nlp_result = _nlp_analyzer.analyze(request.visible_text)
            nlp_schema = NLPResultSchema(
                analyzed=True,
                urgency_score=round(nlp_result.urgency_score, 3),
                threat_score=round(nlp_result.threat_score, 3),
                financial_pressure_score=round(nlp_result.financial_pressure_score, 3),
                impersonation_score=round(nlp_result.impersonation_score, 3),
                overall_score=round(nlp_result.overall_score, 3),
                indicators=nlp_result.indicators,
            )

        # 4. Vision (skip unless explicitly requested — it's slow)
        vision_schema = VisionResultSchema(
            analyzed=False,
            model_available=False,
            note="[MODEL PLACEHOLDER] Vision analysis requires YOLO model integration",
        )

        # 5. Risk Fusion
        pf = page_result.features
        brand_refs = pf.brand_keywords_found
        is_impersonation = len(brand_refs) > 0 and pf.password_field_detected

        risk_input = RiskInput(
            url_risk_score=url_result.risk_score,
            page_risk_score=page_result.risk_score,
            vision_risk_score=0.0,
            nlp_risk_score=(nlp_result.overall_score * 100) if nlp_result else 0.0,
            behavior_risk_score=0.0,
            url_flags=url_result.risk_flags,
            page_flags=page_result.risk_flags,
            vision_threats=[],
            nlp_indicators=nlp_result.indicators if nlp_result else [],
            has_ssl=url_result.features.has_https,
            has_login_form=pf.login_form_detected,
            is_brand_impersonation_suspected=is_impersonation,
            brand_name=brand_refs[0] if brand_refs else None,
        )
        risk_result = _risk_engine.calculate(risk_input)

        # 6. Explanation
        analyst_output = _security_analyst.explain(risk_result, domain)

        # 7. Persist
        duration_ms = round((time.monotonic() - start_time) * 1000)
        analysis_id = _repository.save(
            domain=domain,
            risk_score=risk_result.risk_score,
            severity=risk_result.severity,
            model_version="page_v1",
            scan_duration_ms=duration_ms,
            threats_json=json.dumps(risk_result.threats),
        )

        pf_schema = PageFeaturesSchema(
            login_form_detected=pf.login_form_detected,
            password_field_detected=pf.password_field_detected,
            external_form_submission=pf.external_form_submission,
            suspicious_iframe=pf.suspicious_iframe,
            hidden_elements_detected=pf.hidden_elements_detected,
            external_scripts_count=pf.external_scripts_count,
            redirect_detected=pf.redirect_detected,
            suspicious_js_patterns=pf.suspicious_js_patterns,
            brand_keywords_found=pf.brand_keywords_found,
            form_count=pf.form_count,
            credential_form_score=round(pf.credential_form_score, 3),
        )

        uf = url_result.features
        url_features_schema = URLFeaturesSchema(
            length=uf.length,
            subdomain_count=uf.subdomain_count,
            special_char_count=uf.special_char_count,
            has_https=uf.has_https,
            has_ip_address=uf.has_ip_address,
            has_suspicious_tld=uf.has_suspicious_tld,
            hyphen_count=uf.hyphen_count,
            digit_count=uf.digit_count,
            has_punycode=uf.has_punycode,
            has_at_symbol=uf.has_at_symbol,
            has_double_slash=uf.has_double_slash,
            suspicious_keywords_found=uf.suspicious_keywords_found,
            url_entropy=round(uf.url_entropy, 3),
            domain=uf.domain,
            tld=uf.tld,
            path_length=uf.path_length,
            query_param_count=uf.query_param_count,
        )

        return AnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            url=url,
            domain=domain,
            risk=_risk_result_to_schema(risk_result),
            url_features=url_features_schema,
            page_features=pf_schema,
            vision=vision_schema,
            nlp=nlp_schema,
            explanation=analyst_output.explanation,
            recommendation=analyst_output.recommendation,
            model_versions=MODEL_VERSIONS,
            scan_duration_ms=duration_ms,
        )

    except Exception as exc:
        logger.error("Page analysis failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}")


# ── Screenshot Analysis ───────────────────────────────────────────────────────

@router.post("/analyze/screenshot", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_screenshot(request: ScreenshotAnalysisRequest):
    """
    Vision-only analysis from a base64-encoded screenshot.
    NOTE: Vision model is currently a placeholder — see VisionThreatDetector.
    """
    start_time = time.monotonic()
    url = request.url
    domain = urlparse(url).netloc or url[:50]

    try:
        # Decode screenshot
        try:
            image_bytes = base64.b64decode(request.screenshot_base64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 screenshot data")

        if len(image_bytes) > settings.max_screenshot_bytes:
            raise HTTPException(status_code=413, detail="Screenshot too large (max 5MB)")

        # URL analysis (always)
        url_result = _url_analyzer.analyze(url)

        # Vision analysis
        vision_raw = _vision_detector.analyze_screenshot(image_bytes)
        vision_schema = VisionResultSchema(
            analyzed=vision_raw.analyzed,
            model_available=vision_raw.model_available,
            threat_score=vision_raw.threat_score,
            threats_detected=vision_raw.threats_detected,
            note=vision_raw.note,
        )

        risk_input = RiskInput(
            url_risk_score=url_result.risk_score,
            vision_risk_score=vision_raw.threat_score * 100,
            vision_threats=vision_raw.threats_detected,
            url_flags=url_result.risk_flags,
            has_ssl=url_result.features.has_https,
        )
        risk_result = _risk_engine.calculate(risk_input)
        analyst_output = _security_analyst.explain(risk_result, domain)

        duration_ms = round((time.monotonic() - start_time) * 1000)
        analysis_id = _repository.save(
            domain=domain,
            risk_score=risk_result.risk_score,
            severity=risk_result.severity,
            model_version="screenshot_v1",
            scan_duration_ms=duration_ms,
            threats_json=json.dumps(risk_result.threats),
        )

        return AnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            url=url,
            domain=domain,
            risk=_risk_result_to_schema(risk_result),
            vision=vision_schema,
            explanation=analyst_output.explanation,
            recommendation=analyst_output.recommendation,
            model_versions=MODEL_VERSIONS,
            scan_duration_ms=duration_ms,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Screenshot analysis failed", exc_info=exc)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}")


@router.post("/analyze/image", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_uploaded_image(file: UploadFile = File(...)):
    """Analyze an uploaded PNG/JPEG/WEBP/BMP image for phishing malware indicators."""
    start_time = time.monotonic()
    filename = file.filename or "uploaded_image"
    suffix = Path(filename).suffix.lower()
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    if suffix not in allowed_exts:
        raise HTTPException(status_code=400, detail="Unsupported image type. Use JPG, PNG, WEBP, or BMP.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Image file is empty")
    if len(contents) > settings.max_screenshot_bytes:
        raise HTTPException(status_code=413, detail="Image too large")

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            temp_path = tmp.name

        image_result = analyze_image(temp_path)
        domain = "uploaded-image"
        image_score = float(image_result.get("risk_score", 0))
        image_indicators = image_result.get("indicators", [])

        risk_input = RiskInput(
            url_risk_score=0.0,
            page_risk_score=0.0,
            vision_risk_score=image_score,
            nlp_risk_score=0.0,
            behavior_risk_score=0.0,
            vision_threats=image_indicators,
            has_ssl=True,
        )
        risk_result = _risk_engine.calculate(risk_input)
        analyst_output = _security_analyst.explain(risk_result, domain)

        duration_ms = round((time.monotonic() - start_time) * 1000)
        analysis_id = _repository.save(
            domain=domain,
            risk_score=risk_result.risk_score,
            severity=risk_result.severity,
            model_version="image_v1",
            scan_duration_ms=duration_ms,
            threats_json=json.dumps(risk_result.threats),
        )

        image_schema = ImageAnalysisResultSchema(
            filename=image_result.get("filename", filename),
            format=image_result.get("format"),
            mime_type=image_result.get("mime_type"),
            file_size_bytes=image_result.get("file_size_bytes", len(contents)),
            width=image_result.get("width"),
            height=image_result.get("height"),
            color_mode=image_result.get("color_mode"),
            sha256=image_result.get("sha256"),
            ocr_text=image_result.get("ocr_text", ""),
            ocr_engine=image_result.get("ocr_engine"),
            urls=image_result.get("urls", []),
            qr_codes=image_result.get("qr_codes", []),
            risk_score=float(image_result.get("risk_score", 0)),
            classification=image_result.get("classification", "Safe / Benign"),
            indicators=image_result.get("indicators", []),
            matched_rules=image_result.get("matched_rules", []),
        )

        return AnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            url="",
            domain=domain,
            risk=_risk_result_to_schema(risk_result),
            image=image_schema,
            explanation=analyst_output.explanation,
            recommendation=analyst_output.recommendation,
            model_versions={**MODEL_VERSIONS, "image_analyzer": "edi_v1"},
            scan_duration_ms=duration_ms,
        )
    except ImageAnalysisError as exc:
        logger.warning("Uploaded image analysis failed", exc_info=exc)
        raise HTTPException(status_code=400, detail=f"Image analysis failed: {str(exc)}")
    finally:
        if temp_path and Path(temp_path).exists():
            Path(temp_path).unlink(missing_ok=True)


# ── Recent Analyses ───────────────────────────────────────────────────────────

@router.get("/recent", tags=["History"])
async def get_recent_analyses(limit: int = 20):
    """Return recent analysis metadata (non-sensitive)."""
    records = _repository.get_recent(min(limit, 100))
    return {"records": [
        {
            "id": r.id,
            "timestamp": r.timestamp,
            "domain": r.domain,
            "risk_score": r.risk_score,
            "severity": r.severity,
        }
        for r in records
    ]}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _risk_result_to_schema(r) -> RiskResultSchema:
    return RiskResultSchema(
        risk_score=r.risk_score,
        severity=r.severity,
        url_risk=round(r.url_risk, 2),
        page_risk=round(r.page_risk, 2),
        vision_risk=round(r.vision_risk, 2),
        nlp_risk=round(r.nlp_risk, 2),
        behavior_risk=round(r.behavior_risk, 2),
        threats=r.threats,
        evidence=r.evidence,
        confidence=round(r.confidence, 3),
    )
