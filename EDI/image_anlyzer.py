"""
image_analyzer.py
=================
Image Security Analyzer for the AI-Powered Cyber Threat Detection
and Security Analysis Platform.

Analyzes an uploaded image and identifies potentially malicious,
suspicious, or phishing-related content.

Public interface:
    result = analyze_image("sample.png")

Returns a JSON-compatible dictionary. Also usable from the CLI:
    python image_analyzer.py sample.png [--report]
"""

from __future__ import annotations

import argparse
import hashlib
import io
import mimetypes
import os
import re
import sys
from typing import Any, Dict, List, Optional

import numpy as np
from PIL import Image, ImageFile, UnidentifiedImageError

ImageFile.LOAD_TRUNCATED_IMAGES = False  # reject corrupted files strictly

# ---------------------------------------------------------------------------
# Optional heavy dependencies -- imported lazily so the module still works
# (with reduced functionality) when they are missing.
# ---------------------------------------------------------------------------
try:
    import cv2  # OpenCV: QR detection + OCR preprocessing
    _HAS_CV2 = True
except ImportError:
    _HAS_CV2 = False

try:
    import pyzbar.pyzbar as pyzbar  # preferred QR decoder
    _HAS_PYZBAR = True
except Exception:  # pyzbar also needs the zbar shared library
    _HAS_PYZBAR = False

try:
    import pytesseract  # preferred OCR
    _HAS_TESSERACT = True
except ImportError:
    _HAS_TESSERACT = False

SUPPORTED_FORMATS = {"JPEG", "PNG", "WEBP", "BMP"}
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


# ===========================================================================
# 1. File loading & basic metadata
# ===========================================================================

class ImageAnalysisError(Exception):
    """Raised when an image cannot be loaded or is unsupported/corrupted."""


def _sha256_of_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _get_exif(image: Image.Image) -> Dict[str, str]:
    """Extract human-readable EXIF metadata (best effort)."""
    exif: Dict[str, str] = {}
    try:
        raw = image.getexif()
        if not raw:
            return exif
        from PIL.ExifTags import TAGS
        for tag_id, value in raw.items():
            name = TAGS.get(tag_id, str(tag_id))
            if isinstance(value, bytes):
                value = value[:64].hex()
            exif[str(name)] = str(value)
    except Exception:
        pass
    return exif


def _load_image(path: str) -> Image.Image:
    """Validate extension, verify the file is a real image, return PIL Image."""
    if not os.path.isfile(path):
        raise ImageAnalysisError(f"File not found: {path}")

    ext = os.path.splitext(path)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ImageAnalysisError(
            f"Unsupported file extension '{ext}'. "
            f"Supported: {sorted(SUPPORTED_EXTENSIONS)}"
        )

    # Cheap magic-number check before handing to PIL (catches renamed files).
    with open(path, "rb") as f:
        header = f.read(16)
    magics = {
        b"\xff\xd8\xff": "JPEG", b"\x89PNG": "PNG",
        b"RIFF": "WEBP", b"BM": "BMP",
    }
    if not any(header.startswith(m) for m in magics):
        raise ImageAnalysisError("File content does not match any supported image format.")

    try:
        with Image.open(path) as probe:
            probe.verify()          # detect corruption without full decode
        image = Image.open(path)    # re-open after verify()
        image.load()
    except (UnidentifiedImageError, OSError, ValueError) as e:
        raise ImageAnalysisError(f"Corrupted or unreadable image: {e}")

    if (image.format or "").upper() not in SUPPORTED_FORMATS:
        raise ImageAnalysisError(f"Unsupported image format: {image.format}")
    return image


def extract_file_info(path: str, image: Image.Image) -> Dict[str, Any]:
    file_size = os.path.getsize(path)
    mime, _ = mimetypes.guess_type(path)
    return {
        "filename": os.path.basename(path),
        "file_size_bytes": file_size,
        "file_size_human": _human_size(file_size),
        "format": image.format,
        "mime_type": mime or "unknown",
        "width": image.width,
        "height": image.height,
        "color_mode": image.mode,
        "exif": _get_exif(image),
        "sha256": _sha256_of_file(path),
    }


def _human_size(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.1f} {unit}" if unit != "B" else f"{n} B"
        n /= 1024
    return f"{n} B"


# ===========================================================================
# 2. OCR
# ===========================================================================

def _ocr_with_tesseract(pil_image: Image.Image) -> str:
    img = pil_image.convert("L")  # grayscale improves accuracy
    if _HAS_CV2:
        # Upscale small images for better results
        arr = np.array(img)
        h, w = arr.shape[:2]
        if max(h, w) < 1000:
            scale = 1000 / max(h, w)
            arr = cv2.resize(arr, None, fx=scale, fy=scale,
                             interpolation=cv2.INTER_CUBIC)
        arr = cv2.threshold(arr, 0, 255,
                            cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        img = Image.fromarray(arr)
    return pytesseract.image_to_string(img)


def _ocr_with_easyocr(pil_image: Image.Image) -> str:
    import easyocr  # lazy: heavy import
    reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    arr = np.array(pil_image.convert("RGB"))
    results = reader.readtext(arr, detail=0)
    return "\n".join(results)


def extract_text(pil_image: Image.Image) -> Dict[str, Any]:
    """OCR with Tesseract (primary) / EasyOCR (fallback)."""
    if _HAS_TESSERACT:
        try:
            text = _ocr_with_tesseract(pil_image)
            if text.strip():
                return {"ocr_text": text.strip(), "ocr_engine": "tesseract"}
        except Exception:
            pass
    try:
        text = _ocr_with_easyocr(pil_image)
        return {"ocr_text": text.strip(), "ocr_engine": "easyocr"}
    except Exception as e:
        return {"ocr_text": "", "ocr_engine": "none",
                "ocr_error": f"OCR unavailable: {e}"}


# ===========================================================================
# 3. URL detection
# ===========================================================================

URL_PATTERN = re.compile(
    r"""(?xi)
    \b(
        (?:https?|ftp)://            # scheme
        [^\s<>"'\]\[)}"']+           # host + path
    |
        (?:www\.)                    # scheme-less www.
        [a-z0-9][a-z0-9.-]*\.[a-z]{2,}
        (?:/[^\s<>"'\]\[)}"']*)?
    |
        [a-z0-9][a-z0-9.-]*\.        # bare domain
        (?:com|net|org|io|info|biz|ru|cn|top|xyz|tk|ml|ga|cf|gq|click|link)
        (?:/[^\s<>"'\]\[)}"']*)?
    )
    """
)


def extract_urls(text: str) -> List[str]:
    """Return de-duplicated URLs found in text, preserving order."""
    seen, urls = set(), []
    for m in URL_PATTERN.finditer(text or ""):
        url = m.group(0).rstrip(".,;:!?)")
        key = url.lower()
        if url and key not in seen:
            seen.add(key)
            urls.append(url)
    return urls


# ===========================================================================
# 4. QR code detection
# ===========================================================================

def detect_qr_codes(pil_image: Image.Image) -> List[Dict[str, Any]]:
    """Decode all QR codes. pyzbar preferred, OpenCV fallback."""
    codes: List[Dict[str, Any]] = []

    if _HAS_PYZBAR:
        try:
            for obj in pyzbar.decode(pil_image):
                data = obj.data.decode("utf-8", errors="replace")
                codes.append({"data": data, "is_url": bool(URL_PATTERN.search(data)),
                              "decoder": "pyzbar"})
            return codes
        except Exception:
            pass

    if _HAS_CV2:
        detector = cv2.QRCodeDetector()
        arr = cv2.cvtColor(np.array(pil_image.convert("RGB")), cv2.COLOR_RGB2BGR)
        # Upscale small images -- OpenCV's detector is unreliable on small inputs
        h, w = arr.shape[:2]
        if max(h, w) < 1200:
            scale = 1200 / max(h, w)
            arr = cv2.resize(arr, None, fx=scale, fy=scale,
                             interpolation=cv2.INTER_CUBIC)
        # Multi-detect first
        try:
            ok, decoded, points, _ = detector.detectAndDecodeMulti(arr)
            if ok and decoded:
                for data in decoded:
                    if data:
                        codes.append({"data": data,
                                      "is_url": bool(URL_PATTERN.search(data)),
                                      "decoder": "opencv"})
                if codes:
                    return codes
        except Exception:
            pass
        # Single-detect fallback
        try:
            data, _, _ = detector.detectAndDecode(arr)
            if data:
                codes.append({"data": data,
                              "is_url": bool(URL_PATTERN.search(data)),
                              "decoder": "opencv"})
        except Exception:
            pass
    return codes


# ===========================================================================
# 5. Phishing / scam rule-based detection
# ===========================================================================

# (category, compiled regex, weight, indicator label)
_RULES = [
    ("urgency", re.compile(
        r"\b(urgent|immediately|within 24 hours?|right now|expires?|"
        r"final notice|last warning|act now|as soon as possible)\b", re.I),
     15, "Urgent language"),
    ("account_threat", re.compile(
        r"(account.{0,30}(suspend|block|clos|deactivat|lock|restrict|terminat)|"
        r"(suspend|block|clos|deactivat|lock).{0,20}account|"
        r"will be (blocked|suspended|locked|deactivated))", re.I),
     20, "Account suspension / blocking threat"),
    ("verify_request", re.compile(
        r"\b(verify|confirm|validate|re-?activate).{0,40}(account|identity|"
        r"information|details|credentials?)\b", re.I),
     20, "Account verification request"),
    ("credentials", re.compile(
        r"\b(password|passwd|passcode|login details?|credentials?|"
        r"sign.?in information)\b", re.I),
     25, "Credential request"),
    ("otp", re.compile(
        r"\b(otp|one.?time.?pass(?:word|code)|verification code|"
        r"security code|2fa code)\b", re.I),
     25, "OTP / verification code request"),
    ("banking", re.compile(
        r"\b(bank(?:ing)?|credit card|debit card|cvv|atm pin|"
        r"social security|ssn|iban|account number|payment details)\b", re.I),
     25, "Banking / financial information request"),
    ("prize", re.compile(
        r"\b(congratulations?|you('ve| have)? won|winner|prize|lottery|"
        r"jackpot|claim your|unclaimed (reward|funds|money)|"
        r"you are (selected|eligible))\b", re.I),
     15, "Prize / lottery scam pattern"),
    ("click_bait", re.compile(
        r"\b(click (here|the|below|this)|tap (here|below)|"
        r"press (here|this link))\b", re.I),
     10, "Call-to-action link prompt"),
    ("personal_info", re.compile(
        r"\b(date of birth|mother'?s maiden|full name|phone number|"
        r"email (address|password)|billing address)\b", re.I),
     15, "Personal information request"),
    ("crypto_scam", re.compile(
        r"\b(bitcoin|btc|crypto(?:currency)?|usdt|ethereum|wallet "
        r"(address|verification))\b", re.I),
     15, "Cryptocurrency reference"),
    ("impersonation", re.compile(
        r"\b(paypal|apple|netflix|amazon|microsoft|google|facebook|"
        r"instagram|whatsapp|bank of america|wells fargo|"
        r"irs|support team|customer service)\b.{0,40}"
        r"(suspend|verify|confirm|unusual|locked)", re.I),
     20, "Brand impersonation warning"),
]

# Suspicious TLD / URL-shape heuristics
_SUSPICIOUS_TLDS = {"tk", "ml", "ga", "cf", "gq", "xyz", "top", "click",
                    "link", "icu", "rest", "buzz", "live"}
_IP_URL = re.compile(r"https?://\d{1,3}(\.\d{1,3}){3}")
_SHORTENER = re.compile(
    r"\b(bit\.ly|tinyurl|t\.co|goo\.gl|shorturl|is\.gd|buff\.ly|"
    r"cutt\.ly|rebrand\.ly)\b", re.I)


def _url_risk_flags(url: str) -> List[str]:
    flags = []
    lowered = url.lower()
    host = re.sub(r"^https?://", "", lowered).split("/")[0]
    tld = host.rsplit(".", 1)[-1] if "." in host else ""
    if tld in _SUSPICIOUS_TLDS:
        flags.append("Suspicious TLD")
    if _IP_URL.search(url):
        flags.append("IP-address-based URL")
    if _SHORTENER.search(url):
        flags.append("URL shortener used")
    if "@" in url:
        flags.append("URL contains '@' (credential-obfuscation trick)")
    if re.search(r"(login|verify|secure|update|account|support|billing|"
                 r"confirm|wallet|signin)", host):
        flags.append("Sensitive keyword in domain")
    labels = host.split(".")
    if len(labels) > 3 and not lowered.startswith(("www.", "mail.")):
        flags.append("Excessive subdomains")
    return flags


def _score_phishing(ocr_text: str, urls: List[str],
                    qr_codes: List[Dict[str, Any]]) -> Dict[str, Any]:
    score = 0
    indicators: List[str] = []
    matched_rules: List[Dict[str, Any]] = []

    for category, pattern, weight, label in _RULES:
        hits = pattern.findall(ocr_text or "")
        if hits:
            score += weight
            if label not in indicators:
                indicators.append(label)
            matched_rules.append({
                "category": category,
                "label": label,
                "weight": weight,
                "hits": len(hits) if isinstance(hits, list) else 1,
            })

    for url in urls:
        flags = _url_risk_flags(url)
        if flags:
            score += 10
            for f in flags:
                if f not in indicators:
                    indicators.append(f)

    for qr in qr_codes:
        score += 5
        label = "QR code contains a URL" if qr.get("is_url") else "QR code detected"
        if label not in indicators:
            indicators.append(label)
        if qr.get("is_url"):
            for f in _url_risk_flags(qr["data"]):
                score += 10
                if f not in indicators:
                    indicators.append(f)

    # Penalize images that contain *only* a QR code (common phishing lure)
    text_len = len((ocr_text or "").strip())
    if qr_codes and text_len < 20:
        score += 10
        if "Bare QR code (no context text)" not in indicators:
            indicators.append("Bare QR code (no context text)")

    score = max(0, min(100, score))

    if score >= 70:
        classification = "HIGH RISK"
    elif score >= 40:
        classification = "Suspicious"
    elif score >= 15:
        classification = "Low Risk"
    else:
        classification = "Safe / Benign"

    return {
        "risk_score": score,
        "classification": classification,
        "indicators": indicators,
        "matched_rules": matched_rules,
    }


# ===========================================================================
# 6. Main entry point
# ===========================================================================

def analyze_image(path: str) -> Dict[str, Any]:
    """
    Analyze an image for phishing / scam / malicious content.

    Args:
        path: filesystem path to a JPG/PNG/WEBP/BMP image.

    Returns:
        JSON-compatible dictionary (see README for the full schema).

    Raises:
        ImageAnalysisError: unsupported extension, wrong magic bytes,
                            or corrupted image data.
    """
    image = _load_image(path)
    file_info = extract_file_info(path, image)

    ocr_result = extract_text(image)
    qr_codes = detect_qr_codes(image)

    ocr_text = ocr_result["ocr_text"]
    urls = extract_urls(ocr_text)
    # URLs hidden inside QR codes are surfaced separately but also merged
    for qr in qr_codes:
        if qr.get("is_url") and qr["data"] not in urls:
            urls.append(qr["data"])

    verdict = _score_phishing(ocr_text, urls, qr_codes)

    result: Dict[str, Any] = {
        **file_info,
        "ocr_text": ocr_text,
        "ocr_engine": ocr_result.get("ocr_engine"),
        "urls": urls,
        "qr_codes": qr_codes,
        "risk_score": verdict["risk_score"],
        "classification": verdict["classification"],
        "indicators": verdict["indicators"],
        "matched_rules": verdict["matched_rules"],
    }
    return result


# ---------------------------------------------------------------------------
# Human-readable report
# ---------------------------------------------------------------------------

def format_report(result: Dict[str, Any]) -> str:
    lines = [
        "IMAGE SECURITY REPORT",
        "---------------------",
        "",
        f"File: {result['filename']}",
        f"Type: {result['format']} ({result['mime_type']})",
        f"Size: {result['file_size_human']} ({result['file_size_bytes']} bytes)",
        f"Dimensions: {result['width']} x {result['height']} ({result['color_mode']})",
        f"SHA-256: {result['sha256']}",
    ]
    if result.get("exif"):
        lines.append("EXIF:")
        for k, v in list(result["exif"].items())[:10]:
            lines.append(f"  {k}: {v}")

    lines += ["", "OCR:"]
    if result.get("ocr_text"):
        preview = result["ocr_text"][:300].replace("\n", " | ")
        lines.append(f'"{preview}"')
    else:
        lines.append("(no text detected)")

    lines += ["", f"URLs: {len(result['urls'])} detected"]
    for i, u in enumerate(result["urls"], 1):
        lines.append(f"  {i}. {u}")

    lines.append(f"QR Codes: {len(result['qr_codes'])} detected")
    for qr in result["qr_codes"]:
        lines.append(f'  - "{qr["data"][:120]}"'
                     f'{" [URL]" if qr.get("is_url") else ""}')

    lines += [
        "",
        f"Risk Score: {result['risk_score']}%",
        f"Classification: {result['classification']}",
        "",
        "Indicators:",
    ]
    if result["indicators"]:
        lines += [f"  [x] {ind}" for ind in result["indicators"]]
    else:
        lines.append("  (none)")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Image Security Analyzer -- phishing/scam detection in images")
    parser.add_argument("image", help="Path to the image file")
    parser.add_argument("--report", action="store_true",
                        help="Print the human-readable report")
    parser.add_argument("--json", action="store_true",
                        help="Print raw JSON instead of the report")
    args = parser.parse_args(argv)

    try:
        result = analyze_image(args.image)
    except ImageAnalysisError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2

    if args.json:
        import json
        print(json.dumps(result, indent=2))
    else:
        print(format_report(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())