from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A6
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.utils import ImageReader


OUT = Path(__file__).resolve().parents[1] / "output" / "pdf"
ASSETS = Path(__file__).resolve().parents[1] / "public" / "img"
W, H = A6


def line(canvas, x1, y1, x2, y2, color, width=0.5):
    canvas.setStrokeColor(color)
    canvas.setLineWidth(width)
    canvas.line(x1, y1, x2, y2)


def center(canvas, text, y, size, color, font="Helvetica"):
    canvas.setFont(font, size)
    canvas.setFillColor(color)
    canvas.drawCentredString(W / 2, y, text)


def wrapped(canvas, text, x, y, width, size, leading, color, font="Helvetica"):
    canvas.setFont(font, size)
    canvas.setFillColor(color)
    words = text.split()
    rows, row = [], ""
    for word in words:
        candidate = f"{row} {word}".strip()
        if stringWidth(candidate, font, size) <= width:
            row = candidate
        else:
            rows.append(row)
            row = word
    if row:
        rows.append(row)
    for row in rows:
        canvas.drawString(x, y, row)
        y -= leading
    return y


def stone(canvas, cx, cy, scale, fill, stroke):
    """Own abstract tool mark; not a copied product silhouette."""
    p = canvas.beginPath()
    p.moveTo(cx - 31 * scale, cy - 2 * scale)
    p.curveTo(cx - 26 * scale, cy + 20 * scale, cx - 5 * scale, cy + 29 * scale, cx + 9 * scale, cy + 21 * scale)
    p.curveTo(cx + 18 * scale, cy + 16 * scale, cx + 21 * scale, cy + 6 * scale, cx + 15 * scale, cy - 1 * scale)
    p.curveTo(cx + 27 * scale, cy - 10 * scale, cx + 31 * scale, cy - 24 * scale, cx + 19 * scale, cy - 30 * scale)
    p.curveTo(cx + 7 * scale, cy - 35 * scale, cx - 4 * scale, cy - 26 * scale, cx - 12 * scale, cy - 18 * scale)
    p.curveTo(cx - 22 * scale, cy - 25 * scale, cx - 34 * scale, cy - 18 * scale, cx - 31 * scale, cy - 2 * scale)
    p.close()
    canvas.setFillColor(fill)
    canvas.setStrokeColor(stroke)
    canvas.setLineWidth(1.2)
    canvas.drawPath(p, fill=1, stroke=1)


def draw_front(canvas, variant):
    ink = HexColor("#151A20")
    muted = HexColor("#53606B")
    accent = variant["accent"]
    canvas.setFillColor(HexColor("#F9FAFA"))
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.setFillColor(variant["pale"])
    canvas.roundRect(0, H - 106, W, 106, 0, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.circle(W - 20, H - 20, 55, fill=1, stroke=0)
    canvas.drawImage(ImageReader(ASSETS / variant["image"]), 172, H - 101, 82, 82, mask="auto", preserveAspectRatio=True, anchor="c")
    canvas.setFillColor(ink)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.drawString(16, H - 22, "RHODIDE")
    canvas.setFillColor(accent)
    canvas.setFont("Helvetica-Bold", 5.6)
    canvas.drawString(16, H - 31, "GUA SHA TOOLS")
    canvas.setFillColor(ink)
    canvas.setFont("Helvetica-Bold", 13.5)
    canvas.drawString(16, H - 49, "GUA SHA TOOL")
    canvas.setFillColor(muted)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.drawString(16, H - 59, variant["subtitle"])

    x, y = 17, H - 126
    for label, body in [
        ("01  VORBEREITEN", "Auf gereinigter Haut mit etwas Öl oder Serum anwenden."),
        ("02  GLEITEN", "Tool flach anlegen. Mit sehr leichtem Druck von der Gesichtsmitte nach außen führen."),
        ("03  PFLEGEN", "Mit weichem Tuch reinigen und vollständig trocken aufbewahren."),
    ]:
        canvas.setFillColor(accent)
        canvas.setFont("Helvetica-Bold", 6.5)
        canvas.drawString(x, y, label)
        y -= 10
        y = wrapped(canvas, body, x, y, W - 34, 7.5, 9.2, ink)
        y -= 7
        line(canvas, x, y + 3, W - x, y + 3, HexColor("#D9DFE1"), 0.45)
        y -= 10

    canvas.setFillColor(HexColor("#20252A"))
    canvas.roundRect(15, 44, W - 30, 58, 8, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.drawString(25, 88, "ANWENDUNGSHINWEIS")
    wrapped(canvas, "Nur zur kosmetischen Wellness-Anwendung. Nicht auf verletzter, entzündeter oder gereizter Haut verwenden. Bei Irritation abbrechen. Kein Medizinprodukt.", 25, 76, W - 50, 6.4, 7.6, HexColor("#E6ECEE"))
    canvas.setFillColor(HexColor("#BFCBD0"))
    canvas.setFont("Helvetica", 5.3)
    canvas.drawString(25, 51, f"Produkt-ID: {variant['sku']}  ·  Charge: __________________")

    canvas.setFillColor(ink)
    canvas.setFont("Helvetica-Bold", 5.8)
    canvas.drawCentredString(W / 2, 33, "guasha-shop.de  ·  info@guasha-shop.de")
    canvas.setFillColor(muted)
    canvas.setFont("Helvetica", 4.8)
    canvas.drawCentredString(W / 2, 24, "Vertrieb: Onur Arda Küçük · Saalmannstraße 9 · 13403 Berlin")


def draw_back(canvas, variant):
    dark = variant["dark"]
    mid = variant["mid"]
    light = variant["light"]
    canvas.setFillColor(dark)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)

    canvas.setFillColor(Color(light.red, light.green, light.blue, alpha=0.1))
    canvas.circle(W / 2, H / 2 + 5, 96, fill=1, stroke=0)
    canvas.setStrokeColor(Color(light.red, light.green, light.blue, alpha=0.27))
    canvas.setLineWidth(0.5)
    for radius in range(31, 105, 14):
        canvas.circle(W / 2, H / 2 + 4, radius, stroke=1, fill=0)
    canvas.setStrokeColor(Color(1, 1, 1, alpha=0.28))
    canvas.roundRect(9, 9, W - 18, H - 18, 11, stroke=1, fill=0)
    center(canvas, "R H O D I D E", H - 27, 8.6, white, "Helvetica-Bold")
    center(canvas, "MATERIAL RITUAL", H - 37, 6.5, light, "Helvetica-Bold")
    canvas.drawImage(ImageReader(ASSETS / variant["image"]), 38, H / 2 - 42, 135, 135, mask="auto", preserveAspectRatio=True, anchor="c")
    center(canvas, "GUA SHA", H / 2 - 54, 12.8, white, "Helvetica-Bold")
    center(canvas, variant["back_label"], H / 2 - 64, 7.2, light, "Helvetica-Bold")
    center(canvas, "RUHIG. PRÄZISE. DEINS.", 28, 7.2, white, "Helvetica-Bold")
    center(canvas, "guasha-shop.de  ·  info@guasha-shop.de", 17, 5.7, light, "Helvetica")


def make_variant(filename, variant):
    canvas = Canvas(str(OUT / filename), pagesize=A6, pageCompression=1)
    canvas.setTitle(f"RHODIDE Gua Sha Beipackzettel - {variant['subtitle']}")
    canvas.setAuthor("RHODIDE")
    canvas.setSubject("Anwendung und Pflege")
    draw_front(canvas, variant)
    canvas.showPage()
    draw_back(canvas, variant)
    canvas.save()


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    make_variant("guasha-shop-beipackzettel-edelstahl-a6.pdf", {
        "subtitle": "304 EDELSTAHL",
        "back_label": "304 EDELSTAHL",
        "accent": HexColor("#728394"),
        "dark": HexColor("#20262C"),
        "mid": HexColor("#657586"),
        "light": HexColor("#D7E0E6"),
        "pale": HexColor("#E6EBEE"),
        "image": "guasteal.png",
        "sku": "GS-STEEL-01",
    })
    make_variant("guasha-shop-beipackzettel-jade-a6.pdf", {
        "subtitle": "JADE",
        "back_label": "JADE",
        "accent": HexColor("#39765E"),
        "dark": HexColor("#123E33"),
        "mid": HexColor("#35745C"),
        "light": HexColor("#B6DCC9"),
        "pale": HexColor("#DCECE3"),
        "image": "guagreen.png",
        "sku": "GS-JADE-01",
    })
