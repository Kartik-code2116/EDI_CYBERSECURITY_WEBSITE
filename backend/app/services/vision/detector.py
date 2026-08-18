"""
Vision Threat Detector

╔═══════════════════════════════════════════════════════════╗
║  MODEL PLACEHOLDER — Visual Phishing Detector            ║
║                                                           ║
║  This module defines the architecture for screenshot-    ║
║  based phishing detection using computer vision.         ║
║                                                           ║
║  The placeholder:                                        ║
║  1. Defines the clean VisionThreatDetector interface     ║
║  2. Uses Playwright to capture screenshots               ║
║  3. Runs a mock detector that returns safe defaults      ║
║                                                           ║
║  To integrate your YOLO model:                           ║
║  1. Set VISION_MODEL_PATH in .env to your .pt file path  ║
║  2. Implement YOLOv8ThreatDetector (see interface below) ║
║  3. Pass it to VisionThreatDetector(model=your_model)   ║
║                                                           ║
║  YOLO Classes to train for:                              ║
║    0: login_form                                         ║
║    1: brand_logo                                         ║
║    2: credential_input                                   ║
║    3: payment_form                                       ║
║    4: fake_verification_dialog                           ║
║    5: suspicious_popup                                   ║
╚═══════════════════════════════════════════════════════════╝
"""

import base64
import logging
import io
from dataclasses import dataclass, field
from typing import Protocol, Optional, Any, runtime_checkable
from pathlib import Path

logger = logging.getLogger(__name__)


# ── Detection result types ────────────────────────────────────────────────────

@dataclass
class Detection:
    class_name: str
    confidence: float
    bbox: Optional[list[float]] = None  # [x1, y1, x2, y2] normalized


@dataclass
class VisionAnalysisResult:
    analyzed: bool = False
    model_available: bool = False
    detections: list[Detection] = field(default_factory=list)
    threat_score: float = 0.0
    threats_detected: list[str] = field(default_factory=list)
    screenshot_captured: bool = False
    note: str = ""
    model_used: str = "mock_placeholder_v1"


# ── Model Interface ───────────────────────────────────────────────────────────

@runtime_checkable
class VisionModelInterface(Protocol):
    """
    Interface that any vision model must implement.
    
    To integrate YOLOv8:
    
        from ultralytics import YOLO
        
        class YOLOv8ThreatDetector:
            def __init__(self, model_path: str):
                self.model = YOLO(model_path)
            
            def detect(self, image_bytes: bytes) -> list[Detection]:
                from PIL import Image
                img = Image.open(io.BytesIO(image_bytes))
                results = self.model(img)[0]
                detections = []
                for box in results.boxes:
                    detections.append(Detection(
                        class_name=results.names[int(box.cls)],
                        confidence=float(box.conf),
                        bbox=box.xyxyn[0].tolist()
                    ))
                return detections
    """
    def detect(self, image_bytes: bytes) -> list[Detection]:
        """Run detection on image bytes (PNG/JPEG). Returns list of Detection."""
        ...


# ── Mock Detector (placeholder when no model is available) ────────────────────

class MockVisionDetector:
    """
    Returns a safe-by-default mock response.
    
    CLEARLY MARKED AS PLACEHOLDER — does not perform real detection.
    Replace with YOLOv8ThreatDetector when model is trained.
    """

    def detect(self, image_bytes: bytes) -> list[Detection]:
        logger.info("[MOCK] Vision detector called — returning empty detections (no model loaded)")
        return []


# Threat class → risk contribution mapping
THREAT_SCORES = {
    "login_form": 0.3,
    "brand_logo": 0.25,
    "credential_input": 0.4,
    "payment_form": 0.45,
    "fake_verification_dialog": 0.5,
    "suspicious_popup": 0.35,
}

THREAT_LABELS = {
    "login_form": "Fake login form detected",
    "brand_logo": "Brand logo detected (possible impersonation)",
    "credential_input": "Credential harvesting interface detected",
    "payment_form": "Payment form detected",
    "fake_verification_dialog": "Fake verification dialog detected",
    "suspicious_popup": "Suspicious popup overlay detected",
}


class VisionThreatDetector:
    """
    Main vision analysis class.
    
    Orchestrates:
    1. Screenshot capture (via Playwright, if enabled)
    2. Model inference (YOLO or mock)
    3. Risk scoring from detections
    """

    def __init__(self, model: Optional[VisionModelInterface] = None):
        if model is not None:
            self._model = model
            self._model_available = True
            logger.info("VisionThreatDetector: real model loaded")
        else:
            self._model = MockVisionDetector()
            self._model_available = False
            logger.info("VisionThreatDetector: no model — using mock placeholder")

    def analyze_screenshot(self, image_bytes: bytes) -> VisionAnalysisResult:
        """
        Analyze a pre-captured screenshot.
        Used when the extension sends a screenshot.
        """
        if not image_bytes:
            return VisionAnalysisResult(
                note="No screenshot provided",
                model_used="mock_placeholder_v1" if not self._model_available else "real_model_v1"
            )

        detections = self._run_detection(image_bytes)
        return self._build_result(detections, screenshot_captured=True)

    async def capture_and_analyze(self, url: str) -> VisionAnalysisResult:
        """
        Capture screenshot via Playwright and analyze.
        Requires playwright to be installed.
        """
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            return VisionAnalysisResult(
                analyzed=False,
                note="Playwright not installed. Run: pip install playwright && playwright install chromium",
                model_used="unavailable"
            )

        logger.info("Capturing screenshot via Playwright", extra={"url_domain": url[:50]})
        image_bytes = await self._capture_screenshot(url)
        if not image_bytes:
            return VisionAnalysisResult(analyzed=False, note="Screenshot capture failed")

        detections = self._run_detection(image_bytes)
        return self._build_result(detections, screenshot_captured=True)

    def _run_detection(self, image_bytes: bytes) -> list[Detection]:
        try:
            return self._model.detect(image_bytes)
        except Exception as exc:
            logger.error("Vision model inference failed", exc_info=exc)
            return []

    def _build_result(self, detections: list[Detection], screenshot_captured: bool) -> VisionAnalysisResult:
        if not self._model_available:
            return VisionAnalysisResult(
                analyzed=False,
                model_available=False,
                detections=[],
                threat_score=0.0,
                threats_detected=[],
                screenshot_captured=screenshot_captured,
                note="[MODEL PLACEHOLDER] Vision model not loaded. Integrate YOLOv8 model to enable.",
                model_used="mock_placeholder_v1"
            )

        # Compute threat score from detections
        threat_score = 0.0
        threats: list[str] = []
        for det in detections:
            if det.confidence >= 0.5:
                contribution = THREAT_SCORES.get(det.class_name, 0.2) * det.confidence
                threat_score = min(1.0, threat_score + contribution)
                label = THREAT_LABELS.get(det.class_name, f"Visual threat: {det.class_name}")
                if label not in threats:
                    threats.append(label)

        return VisionAnalysisResult(
            analyzed=True,
            model_available=True,
            detections=detections,
            threat_score=threat_score,
            threats_detected=threats,
            screenshot_captured=screenshot_captured,
            model_used="yolo_v1"
        )

    @staticmethod
    async def _capture_screenshot(url: str) -> Optional[bytes]:
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    viewport={"width": 1280, "height": 800},
                    java_script_enabled=True,
                )
                page = await context.new_page()
                await page.goto(url, timeout=15000, wait_until="domcontentloaded")
                screenshot = await page.screenshot(full_page=False, type="jpeg", quality=85)
                await browser.close()
                return screenshot
        except Exception as exc:
            logger.warning("Playwright screenshot failed", exc_info=exc)
            return None
