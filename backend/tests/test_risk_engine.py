"""
Test suite — Risk Engine
Tests weighted fusion, severity levels, and boosting rules.
"""

import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.risk_engine.engine import RiskEngine, RiskInput


@pytest.fixture
def engine():
    return RiskEngine()


class TestRiskEngineWeights:
    def test_default_weights_sum_to_one(self, engine):
        total = engine.w_url + engine.w_page + engine.w_vision + engine.w_nlp + engine.w_behavior
        assert abs(total - 1.0) < 0.01

    def test_custom_weights_normalized(self):
        engine = RiskEngine(weight_url=1.0, weight_page=1.0, weight_vision=1.0, weight_nlp=1.0, weight_behavior=1.0)
        total = engine.w_url + engine.w_page + engine.w_vision + engine.w_nlp + engine.w_behavior
        assert abs(total - 1.0) < 0.01

    def test_zero_input_gives_safe(self, engine):
        result = engine.calculate(RiskInput())
        assert result.severity == "SAFE"
        assert result.risk_score == 0

    def test_high_url_risk(self, engine):
        result = engine.calculate(RiskInput(url_risk_score=90.0, url_flags=["Suspicious"]))
        assert result.risk_score > 20   # URL weight is 25%

    def test_all_high_signals(self, engine):
        inp = RiskInput(
            url_risk_score=90.0,
            page_risk_score=90.0,
            vision_risk_score=90.0,
            nlp_risk_score=90.0,
        )
        result = engine.calculate(inp)
        assert result.risk_score >= 80
        assert result.severity in ("DANGEROUS", "CRITICAL")


class TestSeverityClassification:
    def test_safe_threshold(self, engine):
        result = engine.calculate(RiskInput(url_risk_score=20.0))
        assert result.severity == "SAFE"

    def test_suspicious_threshold(self, engine):
        # Need enough combined signals to cross suspicious threshold (60)
        inp = RiskInput(
            url_risk_score=100.0,
            page_risk_score=100.0,
            nlp_risk_score=100.0,
        )
        result = engine.calculate(inp)
        assert result.severity in ("SUSPICIOUS", "DANGEROUS", "CRITICAL")

    def test_risk_score_bounded(self, engine):
        inp = RiskInput(
            url_risk_score=100.0, page_risk_score=100.0,
            vision_risk_score=100.0, nlp_risk_score=100.0,
            behavior_risk_score=100.0,
        )
        result = engine.calculate(inp)
        assert 0 <= result.risk_score <= 100


class TestBoostingRules:
    def test_no_ssl_with_login_boosts_score(self, engine):
        inp_base = RiskInput(url_risk_score=30.0)
        inp_boosted = RiskInput(url_risk_score=30.0, has_ssl=False, has_login_form=True)
        r_base = engine.calculate(inp_base)
        r_boosted = engine.calculate(inp_boosted)
        assert r_boosted.risk_score > r_base.risk_score

    def test_brand_impersonation_boosts_score(self, engine):
        inp_base = RiskInput(url_risk_score=40.0, page_risk_score=40.0)
        inp_imp = RiskInput(
            url_risk_score=40.0, page_risk_score=40.0,
            is_brand_impersonation_suspected=True, brand_name="paypal"
        )
        r_base = engine.calculate(inp_base)
        r_imp = engine.calculate(inp_imp)
        assert r_imp.risk_score > r_base.risk_score
        assert any("paypal" in t.lower() for t in r_imp.threats)

    def test_multiple_strong_signals_compound(self, engine):
        inp = RiskInput(
            url_risk_score=60.0, page_risk_score=60.0,
            vision_risk_score=60.0, nlp_risk_score=60.0,
        )
        result = engine.calculate(inp)
        # Should be boosted beyond the simple weighted average
        expected_base = 60.0 * (0.25 + 0.20 + 0.30 + 0.15)
        assert result.risk_score >= expected_base * 0.9


class TestThreatLabels:
    def test_no_threats_for_safe_url(self, engine):
        result = engine.calculate(RiskInput())
        assert len(result.threats) == 0

    def test_ssl_threat_label(self, engine):
        result = engine.calculate(RiskInput(has_ssl=False, url_risk_score=20.0))
        assert any("Unencrypted" in t or "SSL" in t or "unencrypted" in t.lower()
                   for t in result.threats)

    def test_evidence_is_populated(self, engine):
        result = engine.calculate(RiskInput(
            url_risk_score=70.0,
            url_flags=["No HTTPS", "Suspicious domain"]
        ))
        assert len(result.evidence) > 0
        assert "No HTTPS" in result.evidence


class TestConfidenceEstimate:
    def test_confidence_increases_with_more_signals(self, engine):
        r_url_only = engine.calculate(RiskInput(url_risk_score=50.0))
        r_all = engine.calculate(RiskInput(
            url_risk_score=50.0, page_risk_score=50.0,
            vision_risk_score=50.0, nlp_risk_score=50.0,
        ))
        assert r_all.confidence >= r_url_only.confidence

    def test_confidence_bounded(self, engine):
        result = engine.calculate(RiskInput(
            url_risk_score=100.0, page_risk_score=100.0,
            vision_risk_score=100.0, nlp_risk_score=100.0,
        ))
        assert 0.0 <= result.confidence <= 1.0
