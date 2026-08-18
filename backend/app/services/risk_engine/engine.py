"""
Risk Fusion Engine

Combines signals from all analyzers using configurable weights.
This is a critical component — no single signal determines the final result.

Signal weights (configurable via environment variables):
  URL Risk      25%
  Page Risk     20%
  Vision Risk   30%
  NLP Risk      15%
  Behavior Risk 10%
"""

import logging
from dataclasses import dataclass, field
from typing import Optional
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Severity thresholds ───────────────────────────────────────────────────────
SEVERITY_LEVELS = [
    (settings.dangerous_threshold, "CRITICAL"),
    (settings.suspicious_threshold, "DANGEROUS"),
    (settings.safe_threshold, "SUSPICIOUS"),
    (0, "SAFE"),
]


@dataclass
class RiskInput:
    """Collected analysis results passed to the risk engine."""
    url_risk_score: float = 0.0         # 0–100
    page_risk_score: float = 0.0        # 0–100
    vision_risk_score: float = 0.0      # 0–100
    nlp_risk_score: float = 0.0         # 0–100
    behavior_risk_score: float = 0.0    # 0–100

    url_flags: list[str] = field(default_factory=list)
    page_flags: list[str] = field(default_factory=list)
    vision_threats: list[str] = field(default_factory=list)
    nlp_indicators: list[str] = field(default_factory=list)

    # Structural signals that boost/dampen overall score
    has_ssl: bool = True
    has_login_form: bool = False
    is_brand_impersonation_suspected: bool = False
    brand_name: Optional[str] = None


@dataclass
class RiskResult:
    risk_score: int               # 0–100 integer
    severity: str                 # SAFE | SUSPICIOUS | DANGEROUS | CRITICAL
    url_risk: float
    page_risk: float
    vision_risk: float
    nlp_risk: float
    behavior_risk: float
    threats: list[str]
    evidence: list[str]
    confidence: float             # 0.0–1.0 estimate of result confidence
    weights_used: dict            # For transparency


class RiskEngine:
    """
    Weighted multi-signal risk fusion engine.

    All weights are configurable. The engine aggregates evidence from
    all analyzers, deduplicates threat labels, and assigns a severity level.

    Architecture allows easy addition of new signal sources.
    """

    def __init__(
        self,
        weight_url: Optional[float] = None,
        weight_page: Optional[float] = None,
        weight_vision: Optional[float] = None,
        weight_nlp: Optional[float] = None,
        weight_behavior: Optional[float] = None,
    ):
        # Load from settings, allow per-instance override
        self.w_url = weight_url or settings.weight_url
        self.w_page = weight_page or settings.weight_page
        self.w_vision = weight_vision or settings.weight_vision
        self.w_nlp = weight_nlp or settings.weight_nlp
        self.w_behavior = weight_behavior or settings.weight_behavior

        # Normalize weights so they always sum to 1.0
        total = self.w_url + self.w_page + self.w_vision + self.w_nlp + self.w_behavior
        if abs(total - 1.0) > 0.01:
            logger.warning("Risk weights don't sum to 1.0 (%.3f), normalizing", total)
            self.w_url /= total
            self.w_page /= total
            self.w_vision /= total
            self.w_nlp /= total
            self.w_behavior /= total

        logger.debug("RiskEngine initialized", extra={
            "weights": {
                "url": self.w_url, "page": self.w_page, "vision": self.w_vision,
                "nlp": self.w_nlp, "behavior": self.w_behavior
            }
        })

    def calculate(self, inp: RiskInput) -> RiskResult:
        """Fuse all input signals into a single risk result."""

        # ── Weighted fusion ───────────────────────────────────────────────────
        fused_score = (
            inp.url_risk_score * self.w_url +
            inp.page_risk_score * self.w_page +
            inp.vision_risk_score * self.w_vision +
            inp.nlp_risk_score * self.w_nlp +
            inp.behavior_risk_score * self.w_behavior
        )

        # ── Boosting rules (context-aware adjustments) ────────────────────────
        boosts: list[tuple[float, str]] = []

        if not inp.has_ssl and inp.has_login_form:
            boosts.append((15.0, "Login form on non-HTTPS page"))

        if inp.is_brand_impersonation_suspected:
            brand = inp.brand_name or "a known brand"
            boosts.append((10.0, f"Brand impersonation suspected: {brand}"))

        # Multiple strong signals compound
        strong_signals = sum([
            inp.url_risk_score > 50,
            inp.page_risk_score > 50,
            inp.vision_risk_score > 50,
            inp.nlp_risk_score > 50,
        ])
        if strong_signals >= 3:
            boosts.append((10.0, "Multiple high-confidence threat signals detected"))

        for boost_amount, _ in boosts:
            fused_score += boost_amount

        fused_score = min(100.0, max(0.0, fused_score))
        risk_score_int = round(fused_score)

        # ── Severity ──────────────────────────────────────────────────────────
        severity = "SAFE"
        for threshold, level in SEVERITY_LEVELS:
            if risk_score_int >= threshold:
                severity = level
                break

        # ── Threat labels ─────────────────────────────────────────────────────
        threats = self._build_threat_labels(inp)

        # ── Evidence collection ───────────────────────────────────────────────
        evidence = []
        evidence.extend(inp.url_flags)
        evidence.extend(inp.page_flags)
        evidence.extend(inp.vision_threats)
        evidence.extend(inp.nlp_indicators)
        evidence.extend(desc for _, desc in boosts)
        # Deduplicate while preserving order
        evidence = list(dict.fromkeys(evidence))[:15]

        # ── Confidence estimate ───────────────────────────────────────────────
        # More signals → higher confidence; vision placeholder → lower confidence
        active_analyzers = sum([
            inp.url_risk_score > 0,
            inp.page_risk_score > 0,
            inp.vision_risk_score > 0,
            inp.nlp_risk_score > 0,
        ])
        confidence = min(1.0, 0.4 + (active_analyzers * 0.15))

        logger.info("Risk calculation complete", extra={
            "risk_score": risk_score_int,
            "severity": severity,
            "confidence": confidence,
        })

        return RiskResult(
            risk_score=risk_score_int,
            severity=severity,
            url_risk=inp.url_risk_score,
            page_risk=inp.page_risk_score,
            vision_risk=inp.vision_risk_score,
            nlp_risk=inp.nlp_risk_score,
            behavior_risk=inp.behavior_risk_score,
            threats=threats,
            evidence=evidence,
            confidence=confidence,
            weights_used={
                "url": self.w_url,
                "page": self.w_page,
                "vision": self.w_vision,
                "nlp": self.w_nlp,
                "behavior": self.w_behavior,
            }
        )

    # ── Threat Label Builder ──────────────────────────────────────────────────

    def _build_threat_labels(self, inp: RiskInput) -> list[str]:
        threats: list[str] = []

        if inp.is_brand_impersonation_suspected:
            brand = inp.brand_name or "a known brand"
            threats.append(f"Brand Impersonation ({brand})")

        if inp.page_risk_score > 40 and inp.has_login_form:
            threats.append("Credential Harvesting")

        if inp.url_risk_score > 50:
            threats.append("Suspicious URL Structure")

        if inp.nlp_risk_score > 50:
            threats.append("Social Engineering Content")

        if inp.vision_risk_score > 50:
            threats.append("Visual Phishing Indicators")

        if not inp.has_ssl:
            threats.append("Unencrypted Connection")

        if inp.vision_threats:
            threats.extend(t for t in inp.vision_threats if t not in threats)

        return list(dict.fromkeys(threats))[:8]  # deduplicate, cap at 8
