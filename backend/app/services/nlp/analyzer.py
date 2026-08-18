"""
NLP Social Engineering Analyzer.

Detects social-engineering characteristics in webpage text:
  • Urgency / fear
  • Threats / account suspension
  • Financial pressure
  • Credential requests
  • Fake rewards
  • Impersonation language
  • Suspicious instructions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BASELINE: Rule/keyword implementation (always active)
 INTERFACE: Drop in RoBERTa / DistilBERT / LLM classifier
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: This module does NOT claim to detect AI-generated text.
           It detects social-engineering PATTERNS in text.
"""

import re
import logging
import math
from dataclasses import dataclass, field
from typing import Protocol, Optional, runtime_checkable
from collections import Counter

logger = logging.getLogger(__name__)


# ── Signal Pattern Library ────────────────────────────────────────────────────

SIGNAL_PATTERNS = {
    "urgency": [
        r"\burgent\b", r"\bimmediately\b", r"\bact now\b", r"\bright now\b",
        r"\btime is running out\b", r"\bexpire[sd]?\b", r"\bdeadline\b",
        r"\blast chance\b", r"\bwithin \d+ hours?\b", r"\bwithin \d+ minutes?\b",
        r"\bdo not delay\b", r"\bfailure to\b",
    ],
    "threat": [
        r"\baccount.*(?:suspend|terminat|block|lock|clos)\w*", r"\bsuspicious activity\b",
        r"\bunusual.*login\b", r"\bsecurity breach\b", r"\bcompromised\b",
        r"\bdetected.*unauthorized\b", r"\bwarning\b.*\baccount\b",
        r"\byour account will be\b", r"\bpermanently deleted\b",
    ],
    "financial_pressure": [
        r"\bwire transfer\b", r"\bsend money\b", r"\bgift card\b",
        r"\bitcoin\b", r"\bcryptocurrency\b", r"\bpayment.*required\b",
        r"\b\$\d+\b.*\bimmediately\b", r"\brefund\b.*\bclick\b",
        r"\byou owe\b", r"\boverdue\b.*\bpayment\b", r"\bfine\b.*\bpay\b",
    ],
    "credential_request": [
        r"\bverify.*(?:identity|account|email|phone)\b",
        r"\bconfirm.*(?:password|credentials|details)\b",
        r"\benter.*(?:password|pin|ssn|social security)\b",
        r"\bprovide.*(?:username|email|password)\b",
        r"\bupdate.*(?:payment|billing|account).*info\b",
        r"\bvalidat\w+.*account\b",
    ],
    "fake_reward": [
        r"\byou.*won\b", r"\bcongratulations\b.*\bwinner\b",
        r"\bfree.*gift\b", r"\bclaim.*prize\b", r"\bselected\b.*\breward\b",
        r"\blottery\b", r"\bexclusive offer\b.*\bexpire\b",
        r"\b100%\s+free\b", r"\bno cost\b.*\bclaim\b",
    ],
    "impersonation": [
        r"\bapple\b.*\bsupport\b", r"\bmicrosoft\b.*\bteam\b",
        r"\bgoogle\b.*\bsecurity\b", r"\bpaypal\b.*\baccount\b",
        r"\bamazon\b.*\border\b.*\bverif\w+", r"\birs\b.*\btax\b",
        r"\bfbi\b.*\balert\b", r"\bcustomer service\b.*\bclick\b",
        r"\btech support\b.*\bcall\b", r"\bofficial.*notice\b",
    ],
    "suspicious_instructions": [
        r"\bdo not\b.*\btell\b", r"\bkeep.*(?:secret|confidential)\b",
        r"\bdo not share\b.*\b(?:this|code|pin)\b",
        r"\binstall.*software\b.*\bproblem\b",
        r"\ballow.*remote\b.*access\b", r"\bdisable.*antivirus\b",
        r"\bclick here\b.*\bimmediately\b",
    ],
}

# Weights for each signal category (sum to 1.0)
CATEGORY_WEIGHTS = {
    "urgency": 0.15,
    "threat": 0.20,
    "financial_pressure": 0.20,
    "credential_request": 0.25,
    "fake_reward": 0.10,
    "impersonation": 0.20,
    "suspicious_instructions": 0.15,
}


# ── Transformer Model Interface (MODEL PLACEHOLDER) ───────────────────────────

@runtime_checkable
class NLPModelInterface(Protocol):
    """
    ╔═════════════════════════════════════════════════════════════╗
    ║  MODEL PLACEHOLDER — NLP Social Engineering Classifier     ║
    ║                                                             ║
    ║  Replace this with your trained transformer model.         ║
    ║  The model must implement this Protocol.                   ║
    ║                                                             ║
    ║  Suggested architectures:                                  ║
    ║  • Fine-tuned DistilBERT on phishing text corpus           ║
    ║  • Fine-tuned RoBERTa                                      ║
    ║  • Local LLM (Mistral, Phi) with classification head       ║
    ║  • Gemini / OpenAI API with a classification prompt        ║
    ║                                                             ║
    ║  Input: raw text string (truncated to model max tokens)    ║
    ║  Output: dict with category scores [0.0–1.0]              ║
    ╚═════════════════════════════════════════════════════════════╝
    """
    def classify(self, text: str) -> dict[str, float]:
        """Return per-category scores. Keys must match CATEGORY_WEIGHTS keys."""
        ...


@dataclass
class NLPAnalysisResult:
    urgency_score: float = 0.0
    threat_score: float = 0.0
    financial_pressure_score: float = 0.0
    credential_request_score: float = 0.0
    fake_reward_score: float = 0.0
    impersonation_score: float = 0.0
    suspicious_instructions_score: float = 0.0
    overall_score: float = 0.0
    indicators: list[str] = field(default_factory=list)
    model_used: str = "rule_based_v1"


class SocialEngineeringAnalyzer:
    """
    Analyzes text for social-engineering patterns.

    Baseline: Pattern-matching rules (always active, fully explainable).
    Upgrade: Plug in a transformer model via the NLPModelInterface.
    """

    def __init__(self, nlp_model: Optional[NLPModelInterface] = None):
        self._model = nlp_model
        self._compiled = {
            cat: [re.compile(p, re.IGNORECASE) for p in patterns]
            for cat, patterns in SIGNAL_PATTERNS.items()
        }

    def analyze(self, text: str) -> NLPAnalysisResult:
        if not text or len(text.strip()) < 20:
            return NLPAnalysisResult()

        # Truncate to reasonable size
        text = text[:8000]

        if self._model is not None:
            return self._analyze_with_model(text)
        return self._analyze_with_rules(text)

    # ── Rule-based analysis ───────────────────────────────────────────────────

    def _analyze_with_rules(self, text: str) -> NLPAnalysisResult:
        scores: dict[str, float] = {}
        indicators: list[str] = []

        for category, patterns in self._compiled.items():
            matched = [p.pattern for p in patterns if p.search(text)]
            # Score = fraction of patterns matched, with diminishing returns
            raw = len(matched) / max(len(patterns), 1)
            # Apply sigmoid-like scaling so partial matches still register
            scores[category] = min(1.0, raw * 2.5)
            if matched:
                sample = matched[0].replace(r"\b", "").replace(r"\w+", "...").replace(r"\s+", " ")
                indicators.append(f"{category.replace('_', ' ').title()} pattern detected")

        overall = sum(
            scores.get(cat, 0.0) * weight
            for cat, weight in CATEGORY_WEIGHTS.items()
        )

        return NLPAnalysisResult(
            urgency_score=scores.get("urgency", 0.0),
            threat_score=scores.get("threat", 0.0),
            financial_pressure_score=scores.get("financial_pressure", 0.0),
            credential_request_score=scores.get("credential_request", 0.0),
            fake_reward_score=scores.get("fake_reward", 0.0),
            impersonation_score=scores.get("impersonation", 0.0),
            suspicious_instructions_score=scores.get("suspicious_instructions", 0.0),
            overall_score=min(1.0, overall),
            indicators=indicators,
            model_used="rule_based_v1",
        )

    # ── Model-assisted analysis ───────────────────────────────────────────────

    def _analyze_with_model(self, text: str) -> NLPAnalysisResult:
        """
        Use the provided NLPModelInterface for classification.
        Falls back to rules if model fails.
        """
        try:
            scores = self._model.classify(text)  # type: ignore
            overall = sum(
                scores.get(cat, 0.0) * weight
                for cat, weight in CATEGORY_WEIGHTS.items()
            )
            indicators = [
                f"{cat.replace('_', ' ').title()} detected (model)"
                for cat, score in scores.items() if score > 0.5
            ]
            return NLPAnalysisResult(
                urgency_score=scores.get("urgency", 0.0),
                threat_score=scores.get("threat", 0.0),
                financial_pressure_score=scores.get("financial_pressure", 0.0),
                credential_request_score=scores.get("credential_request", 0.0),
                fake_reward_score=scores.get("fake_reward", 0.0),
                impersonation_score=scores.get("impersonation", 0.0),
                suspicious_instructions_score=scores.get("suspicious_instructions", 0.0),
                overall_score=min(1.0, overall),
                indicators=indicators,
                model_used="transformer_model_v1",
            )
        except Exception as exc:
            logger.warning("NLP model inference failed, falling back to rules", exc_info=exc)
            result = self._analyze_with_rules(text)
            result.model_used = "rule_based_v1_fallback"
            return result
