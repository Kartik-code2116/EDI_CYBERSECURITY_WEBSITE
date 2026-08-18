"""
URL Analyzer — Rule-based feature extraction.

Analyzes 20+ URL-level signals without making any network requests.
Architecture is designed so a trained ML model can be substituted via
the MLModelInterface later.

┌─────────────────────────────────────────────────┐
│  URLAnalyzer                                    │
│  • Feature extraction (always real)             │
│  • Risk scoring (rule-based baseline)           │
│  • ML interface (MODEL PLACEHOLDER)             │
└─────────────────────────────────────────────────┘
"""

import re
import math
import logging
from urllib.parse import urlparse, parse_qs
from dataclasses import dataclass, field
from typing import Protocol, Optional
from collections import Counter

logger = logging.getLogger(__name__)

# ── Suspicious signal lists ───────────────────────────────────────────────────

SUSPICIOUS_TLDS = {
    ".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".click",
    ".download", ".loan", ".win", ".bid", ".stream", ".gdn",
    ".racing", ".review", ".science", ".party", ".kim", ".country",
    ".cricket", ".trade", ".accountant", ".work", ".porn", ".adult",
}

SUSPICIOUS_KEYWORDS = [
    "login", "signin", "sign-in", "verify", "verification",
    "update", "confirm", "password", "passwd",
    "credential", "banking", "webscr", "cmd=", "phishing",
    "prize", "winner", "claim", "suspended", "locked",
    "unusual", "helpdesk", "recover", "secure-", "verify-",
]

# Brand names — flagged differently (higher weight) when in subdomains/path
BRAND_KEYWORDS_IN_URL = [
    "paypal", "apple", "microsoft", "google", "amazon", "netflix",
    "facebook", "instagram", "twitter", "chase", "wellsfargo", "citibank",
    "account", "secure", "support", "helpdesk",
]

COMMON_BRANDS = [
    "paypal", "apple", "microsoft", "google", "amazon", "netflix",
    "facebook", "instagram", "twitter", "bank", "chase", "wellsfargo",
    "citibank", "linkedin", "dropbox", "icloud", "office365", "outlook",
]

# Common legitimate TLDs
TRUSTED_TLDS = {".com", ".org", ".net", ".edu", ".gov", ".io", ".co.uk"}


# ── ML Model Interface (MODEL PLACEHOLDER) ───────────────────────────────────

class URLMLModelInterface(Protocol):
    """
    ╔════════════════════════════════════════════════════════╗
    ║  MODEL PLACEHOLDER — URL ML Classifier                ║
    ║                                                        ║
    ║  Replace this with your trained phishing URL model.   ║
    ║  The model must implement this Protocol.              ║
    ║                                                        ║
    ║  Suggested architectures:                             ║
    ║  • Random Forest / XGBoost on URL features            ║
    ║  • Character-level CNN                                ║
    ║  • LSTM over URL character sequence                   ║
    ╚════════════════════════════════════════════════════════╝
    """
    def predict(self, features: dict) -> float:
        """Return probability [0.0–1.0] that URL is malicious."""
        ...


@dataclass
class URLFeatures:
    url: str
    domain: str
    tld: str
    scheme: str
    path: str
    length: int = 0
    subdomain_count: int = 0
    special_char_count: int = 0
    has_https: bool = False
    has_ip_address: bool = False
    has_suspicious_tld: bool = False
    hyphen_count: int = 0
    digit_count: int = 0
    has_punycode: bool = False
    has_at_symbol: bool = False
    has_double_slash: bool = False
    has_suspicious_keyword: bool = False
    suspicious_keywords_found: list = field(default_factory=list)
    url_entropy: float = 0.0
    path_length: int = 0
    query_param_count: int = 0
    has_brand_in_subdomain: bool = False
    has_brand_in_path: bool = False
    brand_referenced: Optional[str] = None
    redirect_chain_indicator: bool = False
    raw_score: float = 0.0


@dataclass
class URLAnalysisResult:
    features: URLFeatures
    risk_score: float          # 0.0–100.0
    risk_flags: list[str]
    model_used: str = "rule_based_v1"


class URLAnalyzer:
    """
    Extracts 20+ features from a URL and computes a risk score.

    Rule-based baseline is always active. To use a trained ML model,
    pass it as `ml_model` — it receives the feature dict and returns
    a probability override.
    """

    def __init__(self, ml_model: Optional[URLMLModelInterface] = None):
        self._ml_model = ml_model

    # ── Public API ────────────────────────────────────────────────────────────

    def analyze(self, url: str) -> URLAnalysisResult:
        logger.debug("URLAnalyzer.analyze called", extra={"url_domain": self._safe_domain(url)})
        features = self._extract_features(url)
        risk_score, flags = self._compute_risk(features)

        # If a trained ML model is wired up, use it
        if self._ml_model is not None:
            try:
                ml_prob = self._ml_model.predict(self._features_to_dict(features))
                # Blend: 60% ML, 40% rules
                risk_score = ml_prob * 100 * 0.6 + risk_score * 0.4
                model_used = "ml_model_blend_v1"
            except Exception as exc:
                logger.warning("ML model prediction failed, falling back to rules", exc_info=exc)
                model_used = "rule_based_v1_fallback"
        else:
            model_used = "rule_based_v1"

        return URLAnalysisResult(
            features=features,
            risk_score=min(100.0, max(0.0, risk_score)),
            risk_flags=flags,
            model_used=model_used,
        )

    # ── Feature Extraction ────────────────────────────────────────────────────

    def _extract_features(self, url: str) -> URLFeatures:
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        path = parsed.path or ""
        query = parsed.query or ""

        # Extract domain parts
        parts = hostname.split(".")
        tld = "." + parts[-1] if len(parts) >= 2 else ""
        domain = ".".join(parts[-2:]) if len(parts) >= 2 else hostname
        subdomain_count = max(0, len(parts) - 2)

        # Punycode / IDN check
        has_punycode = "xn--" in hostname.lower()

        # Brand impersonation in subdomain
        subdomain = ".".join(parts[:-2]) if subdomain_count > 0 else ""
        brand_in_sub = None
        for brand in COMMON_BRANDS:
            if brand in subdomain.lower():
                brand_in_sub = brand
                break

        brand_in_path = None
        for brand in COMMON_BRANDS:
            if brand in (path + query).lower():
                brand_in_path = brand
                break

        brand_referenced = brand_in_sub or brand_in_path

        # Suspicious keywords scan
        full_url_lower = url.lower()
        found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in full_url_lower]

        # IP address instead of domain
        has_ip = bool(re.match(
            r"^\d{1,3}(\.\d{1,3}){3}$", hostname
        )) or hostname.startswith("[")   # IPv6

        # Entropy of the full URL (high entropy = random-looking)
        entropy = self._entropy(url)

        # Query params
        try:
            qp_count = len(parse_qs(query))
        except Exception:
            qp_count = 0

        # Special characters (excluding typical URL chars)
        special = len(re.findall(r"[~!$&'()*+,;=@]", url))

        return URLFeatures(
            url=url,
            domain=domain,
            tld=tld,
            scheme=parsed.scheme.lower(),
            path=path,
            length=len(url),
            subdomain_count=subdomain_count,
            special_char_count=special,
            has_https=parsed.scheme.lower() == "https",
            has_ip_address=has_ip,
            has_suspicious_tld=tld.lower() in SUSPICIOUS_TLDS,
            hyphen_count=hostname.count("-"),
            digit_count=sum(c.isdigit() for c in hostname),
            has_punycode=has_punycode,
            has_at_symbol="@" in url,
            has_double_slash=bool(re.search(r"(?<!:)//", url)),
            has_suspicious_keyword=bool(found_keywords),
            suspicious_keywords_found=found_keywords,
            url_entropy=entropy,
            path_length=len(path),
            query_param_count=qp_count,
            has_brand_in_subdomain=brand_in_sub is not None,
            has_brand_in_path=brand_in_path is not None,
            brand_referenced=brand_referenced,
        )

    # ── Risk Scoring ──────────────────────────────────────────────────────────

    def _compute_risk(self, f: URLFeatures) -> tuple[float, list[str]]:
        score = 0.0
        flags: list[str] = []

        if not f.has_https:
            score += 15.0
            flags.append("No HTTPS — connection is not encrypted")

        if f.has_ip_address:
            score += 20.0
            flags.append("IP address used instead of domain name")

        if f.has_suspicious_tld:
            score += 15.0
            flags.append(f"Suspicious top-level domain: {f.tld}")

        if f.length > 100:
            score += min(15.0, (f.length - 100) * 0.1)
            flags.append(f"Unusually long URL ({f.length} characters)")

        if f.subdomain_count >= 3:
            score += 10.0
            flags.append(f"Excessive subdomains ({f.subdomain_count})")

        if f.hyphen_count >= 4:
            score += 10.0
            flags.append(f"Excessive hyphens in domain ({f.hyphen_count})")

        if f.has_punycode:
            score += 15.0
            flags.append("Punycode / IDN domain (possible homograph attack)")

        if f.has_at_symbol:
            score += 25.0
            flags.append("@ symbol in URL (can redirect to attacker domain)")

        if f.has_double_slash:
            score += 10.0
            flags.append("Suspicious double-slash pattern in URL")

        if f.has_brand_in_subdomain:
            score += 30.0
            flags.append(f"Brand name '{f.brand_referenced}' used as subdomain (possible impersonation)")

        if f.has_brand_in_path and not f.has_brand_in_subdomain:
            score += 12.0
            flags.append(f"Brand name '{f.brand_referenced}' in URL path")

        if len(f.suspicious_keywords_found) >= 3:
            score += min(25.0, len(f.suspicious_keywords_found) * 5)
            flags.append(f"Multiple suspicious keywords: {', '.join(f.suspicious_keywords_found[:5])}")
        elif f.has_suspicious_keyword:
            score += 10.0
            flags.append(f"Suspicious keywords in URL: {', '.join(f.suspicious_keywords_found[:3])}")

        if f.url_entropy > 4.5:
            score += min(10.0, (f.url_entropy - 4.5) * 5)
            flags.append("High URL entropy (random-looking, possibly generated)")

        if f.query_param_count > 10:
            score += 5.0
            flags.append(f"Many query parameters ({f.query_param_count})")

        return score, flags

    # ── Utilities ─────────────────────────────────────────────────────────────

    @staticmethod
    def _entropy(s: str) -> float:
        if not s:
            return 0.0
        counts = Counter(s)
        total = len(s)
        return -sum((c / total) * math.log2(c / total) for c in counts.values())

    @staticmethod
    def _safe_domain(url: str) -> str:
        try:
            return urlparse(url).hostname or "unknown"
        except Exception:
            return "unknown"

    def _features_to_dict(self, f: URLFeatures) -> dict:
        return {
            "length": f.length,
            "subdomain_count": f.subdomain_count,
            "special_char_count": f.special_char_count,
            "has_https": int(f.has_https),
            "has_ip_address": int(f.has_ip_address),
            "has_suspicious_tld": int(f.has_suspicious_tld),
            "hyphen_count": f.hyphen_count,
            "digit_count": f.digit_count,
            "has_punycode": int(f.has_punycode),
            "has_at_symbol": int(f.has_at_symbol),
            "has_double_slash": int(f.has_double_slash),
            "suspicious_keyword_count": len(f.suspicious_keywords_found),
            "url_entropy": f.url_entropy,
            "path_length": f.path_length,
            "query_param_count": f.query_param_count,
            "has_brand_in_subdomain": int(f.has_brand_in_subdomain),
            "has_brand_in_path": int(f.has_brand_in_path),
        }
