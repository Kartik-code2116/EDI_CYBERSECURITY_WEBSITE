"""
Test suite — URL Analyzer
Tests rule-based feature extraction and risk scoring.
Uses synthetic URLs — never real malicious websites.
"""

import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.url_analyzer.analyzer import URLAnalyzer


@pytest.fixture
def analyzer():
    return URLAnalyzer()


# ── Safe URL tests ────────────────────────────────────────────────────────────

class TestSafeURLs:
    def test_google_is_safe(self, analyzer):
        result = analyzer.analyze("https://www.google.com")
        assert result.risk_score < 30
        assert len(result.risk_flags) == 0 or all("suspicious" not in f.lower() for f in result.risk_flags[:1])

    def test_github_is_safe(self, analyzer):
        result = analyzer.analyze("https://github.com/user/repo")
        assert result.risk_score < 30

    def test_https_boosts_safety(self, analyzer):
        safe = analyzer.analyze("https://example.com")
        unsafe = analyzer.analyze("http://example.com")
        assert safe.risk_score < unsafe.risk_score

    def test_features_extracted(self, analyzer):
        result = analyzer.analyze("https://www.example.com/path?q=1")
        assert result.features.has_https is True
        assert result.features.domain == "example.com"
        assert result.features.query_param_count >= 1
        assert result.features.length > 0


# ── Suspicious URL tests ──────────────────────────────────────────────────────

class TestSuspiciousURLs:
    def test_ip_address_is_suspicious(self, analyzer):
        result = analyzer.analyze("http://192.168.1.1/login")
        assert result.risk_score > 30
        assert any("IP address" in f for f in result.risk_flags)

    def test_no_https_is_flagged(self, analyzer):
        result = analyzer.analyze("http://example-bank.com/signin")
        assert result.risk_score > 20
        assert any("HTTPS" in f for f in result.risk_flags)

    def test_suspicious_tld(self, analyzer):
        result = analyzer.analyze("https://mybank.tk/login")
        assert any("suspicious" in f.lower() for f in result.risk_flags)

    def test_excessive_hyphens(self, analyzer):
        result = analyzer.analyze("https://my-very-strange-domain-name.com")
        assert result.features.hyphen_count >= 4

    def test_at_symbol_in_url(self, analyzer):
        result = analyzer.analyze("http://google.com@evil.com/path")
        assert result.features.has_at_symbol is True
        assert result.risk_score > 30

    def test_long_url(self, analyzer):
        long_url = "https://example.com/" + "a" * 200
        result = analyzer.analyze(long_url)
        assert result.features.length > 200

    def test_punycode_detected(self, analyzer):
        result = analyzer.analyze("https://xn--ggle-0nda.com")
        assert result.features.has_punycode is True

    def test_suspicious_keywords(self, analyzer):
        result = analyzer.analyze("http://secure-verify-paypal-account.com/login")
        assert len(result.features.suspicious_keywords_found) > 0
        assert result.risk_score > 30


# ── Phishing URL tests ────────────────────────────────────────────────────────

class TestPhishingURLs:
    def test_brand_in_subdomain(self, analyzer):
        result = analyzer.analyze("http://paypal.fake-domain.com/login")
        assert result.features.has_brand_in_subdomain is True
        assert result.risk_score > 40

    def test_multiple_signals_compound(self, analyzer):
        """Multiple suspicious signals should compound to high risk."""
        result = analyzer.analyze("http://192.168.0.1/paypal-secure-verify-account-login")
        # Has: no HTTPS, IP address, suspicious keywords, brand reference
        assert result.risk_score > 60

    def test_high_entropy_url(self, analyzer):
        result = analyzer.analyze("https://abc123xyz987.com/aB3xY7mN2pQ5")
        assert result.features.url_entropy > 3.0


# ── Feature tests ─────────────────────────────────────────────────────────────

class TestURLFeatureExtraction:
    def test_subdomain_count(self, analyzer):
        result = analyzer.analyze("https://a.b.c.example.com")
        assert result.features.subdomain_count >= 3

    def test_scheme_detection(self, analyzer):
        result = analyzer.analyze("https://example.com")
        assert result.features.scheme == "https"

    def test_tld_extraction(self, analyzer):
        result = analyzer.analyze("https://example.co.uk")
        assert "uk" in result.features.tld or "co" in result.features.tld

    def test_model_used_reported(self, analyzer):
        result = analyzer.analyze("https://example.com")
        assert result.model_used == "rule_based_v1"

    def test_risk_score_bounded(self, analyzer):
        """Risk score must always be in [0, 100]."""
        urls = [
            "https://google.com",
            "http://192.168.0.1/paypal-secure-verify-account-login",
            "https://xn--pple-43d.com/signin?redirect=http://evil.com",
        ]
        for url in urls:
            result = analyzer.analyze(url)
            assert 0 <= result.risk_score <= 100, f"Score out of bounds for {url}: {result.risk_score}"
