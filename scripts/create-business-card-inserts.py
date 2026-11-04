from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen.canvas import Canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


W, H = 55 * mm, 85 * mm
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
WHITE_LOGO = Path("/Users/onur/.codex/generated_images/019f93a8-e06d-79e0-b8d7-bf3ac9ffd40a/exec-645faf05-4604-476d-8c41-1627016e271c.png")
FONT_DIR = Path("/System/Library/Fonts/Supplemental")
pdfmetrics.registerFont(TTFont("CardSans", str(FONT_DIR / "Arial.ttf")))
pdfmetrics.registerFont(TTFont("CardSansBold", str(FONT_DIR / "Arial Bold.ttf")))
pdfmetrics.registerFont(TTFont("CardSerif", str(FONT_DIR / "Georgia.ttf")))


def text(c, value, x, y, size, color, font="CardSans"):
    c.setFillColor(color)
    c.setFont(font, size)
    if pdfmetrics.stringWidth(value, font, size) > W - x - 5 * mm:
        raise ValueError(f"Text wider than card: {value}")
    c.drawString(x, y, value)


def draw_front(c, v):
    ink = HexColor("#252B2A")
    muted = HexColor("#5C6561")
    paper = HexColor("#F9F9F5")
    c.setFillColor(paper)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(v["accent"])
    c.rect(0, H - 2.1 * mm, W, 2.1 * mm, fill=1, stroke=0)

    text(c, "Gua Sha", 6 * mm, H - 9.2 * mm, 14.8, ink, "CardSerif")
    text(c, v["material"], 6.3 * mm, H - 14.7 * mm, 5.8, muted, "CardSansBold")
    c.setStrokeColor(v["accent"])
    c.setLineWidth(.52)
    c.line(6 * mm, H - 18.4 * mm, W - 6 * mm, H - 18.4 * mm)

    text(c, "GEBRAUCHSANWEISUNG", 6 * mm, H - 23.4 * mm, 5.3, v["accent"], "CardSansBold")
    steps = [
        ("01", "Haut reinigen und Öl oder Serum auftragen."),
        ("02", "Flach anlegen, sanft nach außen führen."),
        ("03", "Abwischen und trocken lagern."),
    ]
    for index, (number, copy) in enumerate(steps):
        y = H - (29.2 + index * 4.7) * mm
        text(c, number, 6 * mm, y, 5.4, v["accent"], "CardSansBold")
        text(c, copy, 13 * mm, y, 5.2, ink)

    # The warning is set as a distinct block, not a row of tiny footnotes.
    c.setFillColor(v["pale"])
    c.roundRect(5.4 * mm, 32.2 * mm, W - 10.8 * mm, 11.7 * mm, 1.5 * mm, fill=1, stroke=0)
    text(c, "WICHTIG", 7 * mm, 41.2 * mm, 5.2, v["accent"], "CardSansBold")
    text(c, "Nicht auf verletzter oder gereizter Haut anwenden.", 7 * mm, 37.7 * mm, 5.2, ink)
    text(c, "Bei Irritation stoppen. Kein Medizinprodukt.", 7 * mm, 34.8 * mm, 5.2, ink)

    text(c, "HERSTELLER", 6 * mm, 26.8 * mm, 5.2, v["accent"], "CardSansBold")
    text(c, "RHODIDE · Onur Arda Küçük", 6 * mm, 23.7 * mm, 5.2, ink)
    text(c, "Saalmannstraße 9 · 13403 Berlin", 6 * mm, 20.6 * mm, 5.2, muted)
    text(c, "info@guasha-shop.de", 6 * mm, 17.5 * mm, 5.2, ink)

    c.setStrokeColor(HexColor("#D7DCD8"))
    c.setLineWidth(.45)
    c.line(6 * mm, 11.5 * mm, W - 6 * mm, 11.5 * mm)
    text(c, "ID " + v["sku"], 6 * mm, 7.3 * mm, 5.2, ink, "CardSansBold")
    text(c, "CHARGE", 26 * mm, 7.3 * mm, 5.2, ink, "CardSansBold")
    c.setStrokeColor(ink)
    c.setLineWidth(.5)
    c.line(36 * mm, 7.6 * mm, W - 6 * mm, 7.6 * mm)


def draw_back(c, v):
    c.setFillColor(v["reverse"])
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.drawImage(ImageReader(WHITE_LOGO), 12 * mm, (H - 31 * mm) / 2, width=31 * mm, height=31 * mm, mask="auto", preserveAspectRatio=True, anchor="c")


def create(name, v):
    c = Canvas(str(OUT / name), pagesize=(W, H), pageCompression=1)
    c.setTitle("RHODIDE Gua Sha Beipackkarte - " + v["material"])
    c.setAuthor("RHODIDE")
    draw_front(c, v)
    c.showPage()
    draw_back(c, v)
    c.save()


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    create("guasha-shop-edelstahl-business-card.pdf", {"material": "304 EDELSTAHL", "sku": "GS-STEEL-01", "accent": HexColor("#596B77"), "pale": HexColor("#E8ECEF"), "reverse": HexColor("#5E6971")})
    create("guasha-shop-jade-business-card.pdf", {"material": "JADE", "sku": "GS-JADE-01", "accent": HexColor("#286D55"), "pale": HexColor("#E4EFE8"), "reverse": HexColor("#286D55")})
