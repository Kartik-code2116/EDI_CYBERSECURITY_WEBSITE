"""
AI Security Analyst

Generates human-readable explanations from structured risk data.

╔═══════════════════════════════════════════════════════════╗
║  AI INTERFACE — Security Explanation Generator           ║
║                                                           ║
║  Current: Template-based explanation (always active)     ║
║  Upgrade: Gemini / OpenAI / local LLM via interface       ║
║                                                           ║
║  The LLM is ONLY given the structured risk data.         ║
║  It CANNOT invent evidence not present in the pipeline.  ║
║  It ONLY explains what the analyzers found.              ║
╚═══════════════════════════════════════════════════════════╝
"""

import logging
import textwrap
from dataclasses import dataclass
from typing import Protocol, Optional, runtime_checkable
from app.services.risk_engine.engine import RiskResult
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# ── LLM Interface ─────────────────────────────────────────────────────────────

@runtime_checkable
class LLMInterface(Protocol):
    """
    ╔═══════════════════════════════════════════════════════════════╗
    ║  MODEL PLACEHOLDER — LLM Security Explanation               ║
    ║                                                               ║
    ║  To integrate Gemini:                                        ║
    ║    import google.generativeai as genai                       ║
    ║    genai.configure(api_key=settings.gemini_api_key)          ║
    ║    model = genai.GenerativeModel("gemini-1.5-flash")         ║
    ║                                                               ║
    ║  To integrate OpenAI:                                        ║
    ║    from openai import OpenAI                                  ║
    ║    client = OpenAI(api_key=settings.openai_api_key)          ║
    ║                                                               ║
    ║  The generate() method receives a STRUCTURED PROMPT          ║
    ║  containing only verified evidence. The LLM must not         ║
    ║  add claims beyond what is in the prompt.                    ║
    ╚═══════════════════════════════════════════════════════════════╝
    """
    def generate(self, prompt: str) -> str:
        """Given a structured analysis prompt, return a plain-English explanation."""
        ...


# ── Template-based Analyst (always active) ────────────────────────────────────

@dataclass
class AnalystOutput:
    explanation: str
    recommendation: str
    analyst_used: str = "template_v1"


class SecurityAnalyst:
    """
    Generates human-readable security explanations.

    Template mode: deterministic, always explainable, no hallucination.
    LLM mode: natural language, uses structured prompt to prevent invention.
    """

    def __init__(self, llm: Optional[LLMInterface] = None):
        self._llm = llm
        if llm is not None:
            logger.info("SecurityAnalyst: LLM integration active")
        else:
            logger.info("SecurityAnalyst: template mode (no LLM configured)")

    def explain(self, risk: RiskResult, domain: str) -> AnalystOutput:
        if self._llm is not None:
            return self._explain_with_llm(risk, domain)
        return self._explain_with_template(risk, domain)

    # ── Template Explanation ──────────────────────────────────────────────────

    def _explain_with_template(self, risk: RiskResult, domain: str) -> AnalystOutput:
        severity = risk.severity
        score = risk.risk_score

        # Opening sentence based on severity
        openings = {
            "SAFE": f"This website ({domain}) appears to be legitimate based on available signals.",
            "SUSPICIOUS": f"This website ({domain}) has been flagged as suspicious and requires caution.",
            "DANGEROUS": f"This website ({domain}) has been classified as dangerous and may be attempting to steal your information.",
            "CRITICAL": f"This website ({domain}) is classified as CRITICAL RISK — it shows strong indicators of a phishing or malware attack.",
        }
        opening = openings.get(severity, f"Analysis completed for {domain}.")

        # Evidence section
        evidence_lines = ""
        if risk.evidence:
            top_evidence = risk.evidence[:5]
            evidence_lines = "\n".join(f"• {e}" for e in top_evidence)
            evidence_section = f"\n\nThe strongest indicators are:\n{evidence_lines}"
        else:
            evidence_section = ""

        # Threat section
        threat_section = ""
        if risk.threats:
            threat_list = ", ".join(risk.threats[:4])
            threat_section = f"\n\nDetected threat categories: {threat_list}."

        # Score context
        score_context = {
            "SAFE": "The risk score is low, indicating a low probability of malicious intent.",
            "SUSPICIOUS": f"The risk score of {score}/100 suggests moderate risk. Proceed carefully.",
            "DANGEROUS": f"The risk score of {score}/100 indicates high probability of malicious activity.",
            "CRITICAL": f"The risk score of {score}/100 indicates very high confidence in malicious activity.",
        }.get(severity, "")

        explanation = f"{opening}{evidence_section}{threat_section}\n\n{score_context}".strip()

        # Recommendation based on severity
        recommendations = {
            "SAFE": "This website appears safe. Continue browsing normally, but always stay vigilant.",
            "SUSPICIOUS": "Proceed with caution. Do not enter passwords or sensitive information until you verify the website's legitimacy.",
            "DANGEROUS": "⚠️ Do not enter passwords, payment information, or personal details. Consider leaving this website immediately.",
            "CRITICAL": "🚨 Leave this website immediately. Do not enter any information. If you already entered credentials, change your passwords now.",
        }
        recommendation = recommendations.get(severity, "Review this website carefully before proceeding.")

        return AnalystOutput(
            explanation=explanation,
            recommendation=recommendation,
            analyst_used="template_v1",
        )

    # ── LLM Explanation ───────────────────────────────────────────────────────

    def _explain_with_llm(self, risk: RiskResult, domain: str) -> AnalystOutput:
        """
        Generate explanation using the configured LLM.
        The prompt is STRICTLY structured to prevent the LLM from inventing evidence.
        """
        prompt = self._build_llm_prompt(risk, domain)
        try:
            full_response = self._llm.generate(prompt)  # type: ignore

            # Split response into explanation and recommendation if delimited
            if "RECOMMENDATION:" in full_response:
                parts = full_response.split("RECOMMENDATION:", 1)
                explanation = parts[0].strip()
                recommendation = parts[1].strip()
            else:
                explanation = full_response
                recommendation = self._explain_with_template(risk, domain).recommendation

            return AnalystOutput(
                explanation=explanation,
                recommendation=recommendation,
                analyst_used="llm_v1",
            )
        except Exception as exc:
            logger.warning("LLM explanation failed, falling back to template", exc_info=exc)
            result = self._explain_with_template(risk, domain)
            result.analyst_used = "template_v1_fallback"
            return result

    def _build_llm_prompt(self, risk: RiskResult, domain: str) -> str:
        """
        Builds a strict structured prompt.
        The LLM MUST only explain the evidence provided — nothing else.
        """
        evidence_str = "\n".join(f"- {e}" for e in risk.evidence[:8]) if risk.evidence else "- No specific evidence flagged"
        threats_str = ", ".join(risk.threats) if risk.threats else "None detected"

        return textwrap.dedent(f"""
        You are a cybersecurity analyst. Explain the following security analysis results to a non-technical user.
        
        STRICT RULES:
        1. Only explain the evidence listed below — do not add claims not in this data.
        2. Do not mention tools, methods, or technical details not provided.
        3. Be clear, factual, and non-alarmist. Be proportional to the risk level.
        4. Write 3–5 sentences for the explanation.
        5. End with "RECOMMENDATION:" followed by one actionable sentence.
        
        Analysis Data:
        - Website: {domain}
        - Risk Score: {risk.risk_score}/100
        - Severity: {risk.severity}
        - Threats: {threats_str}
        - Evidence:
        {evidence_str}
        
        Write the explanation now:
        """).strip()
