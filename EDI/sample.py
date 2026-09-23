"""Generates the sample test images used to validate image_analyzer.py."""

import os

os.makedirs("sample_images", exist_ok=True)

import pytesseract


pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

#img.save("sample_images/clean_document.png")

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def font(size, bold=False):
    try:
        return ImageFont.truetype(FONT if bold else REG, size)
    except Exception:
        return ImageFont.load_default()

def make_qr_pil(data, module_px=10, border_modules=6):
    enc = cv2.QRCodeEncoder_create()
    raw = enc.encode(data).astype(np.uint8)
    raw = (raw > 127).astype(np.uint8) * 255
    big = cv2.resize(raw, (raw.shape[1]*module_px, raw.shape[0]*module_px),
                     interpolation=cv2.INTER_NEAREST)
    pad = border_modules * module_px
    out = np.full((big.shape[0]+2*pad, big.shape[1]+2*pad), 255, np.uint8)
    out[pad:pad+big.shape[0], pad:pad+big.shape[1]] = big
    return Image.fromarray(out, "L").convert("RGB")

# --- 1. Clean document (benign) ---
img = Image.new("RGB", (1000, 700), "#f0f4f8")
d = ImageDraw.Draw(img)
d.rectangle([0, 0, 1000, 120], fill="#2b6cb0")
d.text((40, 35), "Acme Corporation - Quarterly Team Update",
       font=font(36, True), fill="white")
body = ["Hello team,", "",
        "Reminder: our quarterly planning meeting is scheduled",
        "for Friday at 10:00 AM in the main conference room.",
        "Please review the agenda on the internal wiki before",
        "the meeting. Looking forward to seeing everyone there.",
        "", "Best regards,", "Sarah - Project Management Office"]
y = 180
for line in body:
    d.text((60, y), line, font=font(28), fill="#1a202c")
    y += 48
img.save("sample_images/clean_document.png")

# --- 2. Phishing screenshot (HIGH RISK) ---
img = Image.new("RGB", (1100, 900), "white")
d = ImageDraw.Draw(img)
d.rectangle([0, 0, 1100, 100], fill="#c53030")
d.text((330, 28), "SECURITY ALERT", font=font(44, True), fill="white")
msg = ["URGENT: Your account has been suspended", "",
       "We detected unusual activity on your account.",
       "Your account will be blocked permanently within 24 hours",
       "unless you verify your identity immediately.", "",
       "Click here to verify your account:",
       "http://secure-verify-account.tk/login", "",
       "Enter your password and OTP verification code",
       "to restore full access to your account."]
y = 150
for line in msg:
    color = "#c53030" if "URGENT" in line else "#1a202c"
    d.text((80, y), line, font=font(30), fill=color)
    y += 52
d.rounded_rectangle([330, 730, 770, 810], radius=12, fill="#c53030")
d.text((400, 750), "VERIFY NOW", font=font(32, True), fill="white")
img.save("sample_images/phishing_screenshot.png")

# --- 3. Bare QR code -> IP-based URL (Suspicious) ---
qr1 = make_qr_pil("http://192.168.44.7:8080/update-wallet")
canvas = Image.new("RGB", (640, 700), "white")
canvas.paste(qr1, ((640 - qr1.width) // 2, 40))
d = ImageDraw.Draw(canvas)
d.text((220, 560), "Scan to Pay", font=font(38, True), fill="black")
d.text((170, 620), "Fast & Secure Payment", font=font(24), fill="#333333")
canvas.save("sample_images/qr_code.png")

# --- 4. Prize scam + QR (Low/Medium risk) ---
canvas2 = Image.new("RGB", (900, 1250), "#fffaf0")
d = ImageDraw.Draw(canvas2)
d.rectangle([0, 0, 900, 130], fill="#d69e2e")
d.text((130, 40), "CONGRATULATIONS!", font=font(48, True), fill="white")
lines2 = ["You WON a $1000 Gift Card!", "",
          "You are one of our selected lucky winners.",
          "Scan the code below and enter your details",
          "to claim your prize immediately.",
          "Offer expires within 24 hours!"]
y = 180
for line in lines2:
    d.text((120, y), line, font=font(30), fill="#1a202c")
    y += 50
qr2 = make_qr_pil("http://prize-claim.xyz")
canvas2.paste(qr2, ((900 - qr2.width) // 2, 480))
d.rounded_rectangle([280, 860, 620, 940], radius=12, fill="#c53030")
d.text((300, 880), "CLAIM NOW", font=font(34, True), fill="white")
canvas2.save("sample_images/prize_scam_qr.png")

# --- 5 & 6. Negative tests ---
with open("sample_images/corrupted.png", "wb") as f:
    f.write(b"\x89PNG\r\n\x1a\n" + b"GARBAGE" * 100)
with open("sample_images/fake_image.png", "w") as f:
    f.write("this is not an image at all")

print("Sample images generated in sample_images/")