"""
Page Analyzer — Safe HTML/content analysis.

PRIVACY GUARANTEE:
  - Never processes password values
  - Never processes form input values
  - Never processes cookie data
  - Only analyzes structural and semantic signals

Returns structured PageFeatures used by the Risk Engine.
"""

import re
import logging
from dataclasses import dataclass, field
from typing import Optional
from bs4 import BeautifulSoup
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# ── Brand detection vocabulary ────────────────────────────────────────────────
KNOWN_BRANDS = [
    "paypal", "apple", "microsoft", "google", "amazon", "netflix",
    "facebook", "instagram", "twitter", "chase", "wellsfargo", "citibank",
    "linkedin", "dropbox", "icloud", "office", "outlook", "yahoo",
    "ebay", "spotify", "steam", "discord", "github", "gitlab",
]

# ── Suspicious JS patterns ────────────────────────────────────────────────────
SUSPICIOUS_JS_PATTERNS = [
    (r"document\.cookie", "Reads browser cookies"),
    (r"window\.location\s*=", "Forced navigation redirect"),
    (r"eval\s*\(", "Dynamic code evaluation (eval)"),
    (r"atob\s*\(", "Base64 decoding (possible obfuscation)"),
    (r"fromCharCode", "Character code manipulation (obfuscation)"),
    (r"unescape\s*\(", "URL unescape call (obfuscation)"),
    (r"XMLHttpRequest", "AJAX data exfiltration possible"),
    (r"fetch\s*\(.*password", "Possible password exfiltration"),
    (r"keylogger|keystroke|keypress.*send", "Potential keylogger"),
    (r"navigator\.sendBeacon", "Silent background data transmission"),
]

# ── Social engineering text patterns ─────────────────────────────────────────
URGENCY_PATTERNS = [
    r"\burgent\b", r"\bimmediately\b", r"\bexpire[sd]?\b", r"\bsuspend(ed)?\b",
    r"\blocked\b", r"\bunusual activity\b", r"\bverify now\b", r"\bact now\b",
    r"\blimited time\b", r"\byour account\b.*\bat risk\b",
]


@dataclass
class PageFeatures:
    login_form_detected: bool = False
    password_field_detected: bool = False
    external_form_submission: bool = False
    suspicious_iframe: bool = False
    hidden_elements_detected: bool = False
    external_scripts_count: int = 0
    redirect_detected: bool = False
    suspicious_js_patterns: list = field(default_factory=list)
    brand_keywords_found: list = field(default_factory=list)
    form_count: int = 0
    credential_form_score: float = 0.0
    urgency_text_detected: bool = False
    external_link_ratio: float = 0.0
    title: str = ""
    meta_description: str = ""


@dataclass
class PageAnalysisResult:
    features: PageFeatures
    risk_score: float     # 0.0–100.0
    risk_flags: list[str]
    model_used: str = "rule_based_v1"


class PageAnalyzer:
    """
    Analyzes safe structural and semantic signals from a webpage.

    Accepts either raw HTML snippet or pre-extracted metadata fields
    (form_count, password_field_count, etc.) collected by the content script.
    """

    def analyze_html(self, html: str, base_url: str = "") -> PageAnalysisResult:
        """Full analysis when an HTML snippet is available."""
        logger.debug("PageAnalyzer.analyze_html called")
        features = self._extract_from_html(html, base_url)
        risk_score, flags = self._compute_risk(features)
        return PageAnalysisResult(
            features=features,
            risk_score=min(100.0, max(0.0, risk_score)),
            risk_flags=flags,
        )

    def analyze_metadata(
        self,
        url: str,
        title: str = "",
        meta_description: str = "",
        visible_text: str = "",
        form_count: int = 0,
        password_field_count: int = 0,
        external_script_count: int = 0,
        iframe_count: int = 0,
        external_links: Optional[list] = None,
        link_count: int = 0,
    ) -> PageAnalysisResult:
        """
        Analysis from pre-extracted metadata (used when full HTML is not sent).
        This is the primary flow when the content script sends structured data.
        """
        logger.debug("PageAnalyzer.analyze_metadata called")
        base_domain = urlparse(url).netloc

        features = PageFeatures(
            password_field_detected=password_field_count > 0,
            login_form_detected=form_count > 0 and password_field_count > 0,
            external_form_submission=False,   # Can't determine without HTML
            suspicious_iframe=iframe_count > 0,
            external_scripts_count=external_script_count,
            form_count=form_count,
            title=title[:256],
            meta_description=meta_description[:512],
        )

        # Brand detection in title + description
        combined_text = f"{title} {meta_description} {visible_text}".lower()
        features.brand_keywords_found = [b for b in KNOWN_BRANDS if b in combined_text]

        # Urgency detection in visible text
        for pattern in URGENCY_PATTERNS:
            if re.search(pattern, combined_text, re.IGNORECASE):
                features.urgency_text_detected = True
                break

        # External link ratio
        if link_count > 0 and external_links:
            features.external_link_ratio = len(external_links) / link_count

        # Credential form score
        features.credential_form_score = self._credential_form_score(features)

        risk_score, flags = self._compute_risk(features)
        return PageAnalysisResult(
            features=features,
            risk_score=min(100.0, max(0.0, risk_score)),
            risk_flags=flags,
        )

    # ── HTML Feature Extraction ───────────────────────────────────────────────

    def _extract_from_html(self, html: str, base_url: str) -> PageFeatures:
        try:
            soup = BeautifulSoup(html, "html.parser")
        except Exception as exc:
            logger.warning("HTML parsing failed", exc_info=exc)
            return PageFeatures()

        base_domain = urlparse(base_url).netloc
        features = PageFeatures()

        # Title and meta
        title_tag = soup.find("title")
        features.title = title_tag.get_text(strip=True)[:256] if title_tag else ""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        features.meta_description = (meta_desc.get("content", "") or "")[:512] if meta_desc else ""

        # Forms
        forms = soup.find_all("form")
        features.form_count = len(forms)
        password_inputs = soup.find_all("input", type="password")
        features.password_field_detected = len(password_inputs) > 0

        for form in forms:
            if form.find("input", type="password"):
                features.login_form_detected = True
                action = form.get("action", "")
                if action and base_domain and base_domain not in action and action.startswith("http"):
                    features.external_form_submission = True

        # iFrames
        iframes = soup.find_all("iframe")
        for iframe in iframes:
            src = iframe.get("src", "")
            if src and base_domain not in src:
                features.suspicious_iframe = True
                break

        # Hidden elements
        hidden = soup.find_all(style=re.compile(r"display\s*:\s*none|visibility\s*:\s*hidden"))
        features.hidden_elements_detected = len(hidden) > 3

        # External scripts
        scripts = soup.find_all("script", src=True)
        ext_scripts = [s for s in scripts if base_domain not in (s.get("src") or "")]
        features.external_scripts_count = len(ext_scripts)

        # Meta redirect
        meta_refresh = soup.find("meta", attrs={"http-equiv": re.compile(r"refresh", re.I)})
        features.redirect_detected = meta_refresh is not None

        # Suspicious JS patterns (in inline scripts only — never forms/inputs)
        inline_scripts = [s.get_text() for s in soup.find_all("script") if not s.get("src")]
        inline_combined = " ".join(inline_scripts)
        for pattern, description in SUSPICIOUS_JS_PATTERNS:
            if re.search(pattern, inline_combined, re.IGNORECASE):
                features.suspicious_js_patterns.append(description)

        # Brand keyword detection
        page_text = soup.get_text(separator=" ").lower()
        features.brand_keywords_found = [b for b in KNOWN_BRANDS if b in page_text]

        # Urgency detection
        for pattern in URGENCY_PATTERNS:
            if re.search(pattern, page_text, re.IGNORECASE):
                features.urgency_text_detected = True
                break

        features.credential_form_score = self._credential_form_score(features)
        return features

    # ── Risk Scoring ──────────────────────────────────────────────────────────

    def _compute_risk(self, f: PageFeatures) -> tuple[float, list[str]]:
        score = 0.0
        flags: list[str] = []

        if f.login_form_detected and f.password_field_detected:
            score += 15.0
            flags.append("Login form with password field detected")

        if f.external_form_submission:
            score += 25.0
            flags.append("Form submits credentials to external domain")

        if f.suspicious_iframe:
            score += 15.0
            flags.append("Cross-origin iframe detected")

        if f.hidden_elements_detected:
            score += 10.0
            flags.append("Suspicious hidden elements on page")

        if f.external_scripts_count > 10:
            score += min(15.0, f.external_scripts_count * 1.0)
            flags.append(f"Many external scripts loaded ({f.external_scripts_count})")

        if f.redirect_detected:
            score += 10.0
            flags.append("Meta-refresh redirect detected")

        if f.suspicious_js_patterns:
            score += min(20.0, len(f.suspicious_js_patterns) * 5)
            for pattern in f.suspicious_js_patterns[:3]:
                flags.append(f"Suspicious script pattern: {pattern}")

        if f.urgency_text_detected:
            score += 10.0
            flags.append("Urgency/threat language detected in page text")

        if len(f.brand_keywords_found) > 0:
            score += 10.0
            flags.append(f"Brand references: {', '.join(f.brand_keywords_found[:3])}")

        if f.credential_form_score > 0.7:
            score += 15.0
            flags.append("High-confidence credential harvesting form structure")

        return score, flags

    @staticmethod
    def _credential_form_score(f: PageFeatures) -> float:
        """Heuristic score for how likely a form is credential-harvesting."""
        score = 0.0
        if f.password_field_detected:
            score += 0.4
        if f.login_form_detected:
            score += 0.2
        if f.external_form_submission:
            score += 0.3
        if f.urgency_text_detected:
            score += 0.1
        return min(1.0, score)
