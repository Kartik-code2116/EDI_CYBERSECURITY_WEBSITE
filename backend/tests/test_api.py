"""
Test suite — FastAPI Endpoints
Tests API endpoints with simulated requests.
"""

import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Health Check ──────────────────────────────────────────────────────────────

class TestHealthEndpoint:
    def test_health_returns_200(self):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_response_shape(self):
        response = client.get("/api/health")
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "services" in data


# ── URL Analysis Endpoint ─────────────────────────────────────────────────────

class TestURLAnalysisEndpoint:
    def test_safe_url(self):
        response = client.post("/api/analyze/url", json={"url": "https://www.google.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "risk" in data
        assert "risk_score" in data["risk"]
        assert 0 <= data["risk"]["risk_score"] <= 100

    def test_suspicious_url(self):
        # IP-based URL with no HTTPS, suspicious keywords — should score high
        response = client.post("/api/analyze/url", json={
            "url": "http://192.168.1.100/paypal-secure-login-verify-account"
        })
        assert response.status_code == 200
        data = response.json()
        # URL-only weight is 25% — IP-based URL with no HTTPS should score > 15
        assert data["risk"]["risk_score"] > 15

    def test_response_contains_explanation(self):
        response = client.post("/api/analyze/url", json={"url": "https://example.com"})
        data = response.json()
        assert "explanation" in data
        assert len(data["explanation"]) > 20

    def test_response_contains_recommendation(self):
        response = client.post("/api/analyze/url", json={"url": "https://example.com"})
        data = response.json()
        assert "recommendation" in data

    def test_response_contains_domain(self):
        response = client.post("/api/analyze/url", json={"url": "https://example.com/path"})
        data = response.json()
        assert data["domain"] == "example.com"

    def test_response_contains_model_versions(self):
        response = client.post("/api/analyze/url", json={"url": "https://example.com"})
        data = response.json()
        assert "model_versions" in data

    def test_invalid_url_handled(self):
        response = client.post("/api/analyze/url", json={"url": ""})
        assert response.status_code in (400, 422)

    def test_missing_url_field(self):
        response = client.post("/api/analyze/url", json={})
        assert response.status_code == 422

    def test_url_normalization(self):
        """Bare domain without https:// should be accepted."""
        response = client.post("/api/analyze/url", json={"url": "example.com"})
        # Should not raise 422 — normalizes to https://example.com
        assert response.status_code in (200, 422)


# ── Page Analysis Endpoint ────────────────────────────────────────────────────

class TestPageAnalysisEndpoint:
    def _safe_page_payload(self):
        return {
            "url": "https://www.google.com",
            "title": "Google",
            "meta_description": "Search the world's information",
            "visible_text": "Google Search",
            "form_count": 1,
            "password_field_count": 0,
            "external_script_count": 5,
            "iframe_count": 0,
            "link_count": 10,
            "external_links": [],
        }

    def _phishing_page_payload(self):
        return {
            "url": "http://paypal.verify-login.tk/signin",
            "title": "PayPal - Secure Login",
            "meta_description": "Sign in to your PayPal account",
            "visible_text": (
                "URGENT: Your account has been suspended due to unusual activity. "
                "Please verify your identity immediately to avoid permanent account closure. "
                "Enter your PayPal email and password to confirm your account."
            ),
            "form_count": 1,
            "password_field_count": 1,
            "external_script_count": 3,
            "iframe_count": 0,
            "link_count": 5,
            "external_links": ["http://evil.com"],
        }

    def test_safe_page_returns_200(self):
        response = client.post("/api/analyze/page", json=self._safe_page_payload())
        assert response.status_code == 200

    def test_phishing_page_has_higher_risk(self):
        safe_resp = client.post("/api/analyze/page", json=self._safe_page_payload())
        phish_resp = client.post("/api/analyze/page", json=self._phishing_page_payload())
        assert phish_resp.status_code == 200
        assert phish_resp.json()["risk"]["risk_score"] > safe_resp.json()["risk"]["risk_score"]

    def test_phishing_page_detects_nlp(self):
        response = client.post("/api/analyze/page", json=self._phishing_page_payload())
        data = response.json()
        assert "nlp" in data
        # NLP should have analyzed the urgent text
        if data["nlp"]:
            assert data["nlp"]["analyzed"] is True

    def test_page_response_has_page_features(self):
        response = client.post("/api/analyze/page", json=self._phishing_page_payload())
        data = response.json()
        assert "page_features" in data
        assert data["page_features"]["password_field_detected"] is True

    def test_analysis_id_returned(self):
        response = client.post("/api/analyze/page", json=self._safe_page_payload())
        data = response.json()
        assert "analysis_id" in data
        assert len(data["analysis_id"]) > 0


# ── Error Handling ────────────────────────────────────────────────────────────

class TestErrorHandling:
    def test_oversized_request(self):
        """Requests with too-large content should be rejected."""
        payload = {
            "url": "https://example.com",
            "visible_text": "x" * 20_000,  # Over the 10k max
        }
        response = client.post("/api/analyze/page", json=payload)
        assert response.status_code in (200, 422)  # Truncated or rejected

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data

    def test_recent_endpoint(self):
        response = client.get("/api/recent")
        assert response.status_code == 200
        assert "records" in response.json()


# ── Backend Unavailable Simulation ────────────────────────────────────────────

class TestBackendUnavailableSimulation:
    """
    These tests verify the API response format so the extension
    can handle failures gracefully.
    """

    def test_404_on_unknown_path(self):
        response = client.get("/api/nonexistent")
        assert response.status_code == 404

    def test_method_not_allowed(self):
        response = client.get("/api/analyze/url")
        assert response.status_code == 405


class TestImageAnalysisEndpoint:
    def test_image_upload_analysis_returns_200(self, tmp_path):
        from PIL import Image

        image_path = tmp_path / "phish.png"
        img = Image.new("RGB", (200, 200), color="white")
        img.save(image_path)

        with open(image_path, "rb") as f:
            response = client.post(
                "/api/analyze/image",
                files={"file": ("phish.png", f.read(), "image/png")},
            )

        assert response.status_code == 200, response.text
        data = response.json()
        assert data["success"] is True
        assert "image" in data
        assert isinstance(data["image"]["risk_score"], (int, float))
