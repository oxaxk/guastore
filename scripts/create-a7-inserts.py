"""A7 Gua Sha insert cards, with 3 mm full bleed for print upload."""

from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
LOGO = Path("/Users/onur/.codex/generated_images/019f93a8-e06d-79e0-b8d7-bf3ac9ffd40a/exec-645faf05-4604-476d-8c41-1627016e271c.png")
FONT_DIR = Path("/System/Library/Fonts/Supplemental")
pdfmetrics.registerFont(TTFont("InsertSans", str(FONT_DIR / "Arial.ttf")))
pdfmetrics.registerFont(TTFont("InsertBold", str(FONT_DIR / "Arial Bold.ttf")))
pdfmetrics.registerFont(TTFont("InsertSerif", str(FONT_DIR / "Georgia.ttf")))

# 74 x 105 mm is the finished A7 card. The 3 mm edge is cut away.
PAGE_W, PAGE_H = 80 * mm, 111 * mm
TRIM = RectangleObject([3 * mm, 3 * mm, 77 * mm, 108 * mm])
BLEED = RectangleObject([0, 0, PAGE_W, PAGE_H])


def label(c, value, x, y, size, color, font="InsertSans", right_limit=72):
    if pdfmetrics.stringWidth(value, font, size) > right_limit * mm - x:
        raise ValueError(f"Text too wide for A7 card: {value}")
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(x, y, value)


def front(c, variant):
    ink = HexColor("#252B2A")
    muted = HexColor("#5C6561")
    c.setFillColor(HexColor("#F9F9F5"))
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(variant["accent"])
    c.rect(0, PAGE_H - 4 * mm, PAGE_W, 4 * mm, fill=1, stroke=0)

    label(c, "Gua Sha", 11 * mm, 98 * mm, 22, ink, "InsertSerif")
    label(c, variant["material"], 11 * mm, 89 * mm, 10, muted, "InsertBold")
    c.setStrokeColor(variant["accent"])
    c.setLineWidth(0.7)
    c.line(11 * mm, 84 * mm, 69 * mm, 84 * mm)

    label(c, "GEBRAUCHSANWEISUNG", 11 * mm, 78 * mm, 9.5, variant["accent"], "InsertBold")
    steps = (
        ("01", "Haut reinigen, Öl oder Serum auftragen."),
        ("02", "Flach anlegen, sanft nach außen führen."),
        ("03", "Abwischen und trocken lagern."),
    )
    for index, (number, copy) in enumerate(steps):
        y = (71 - index * 7) * mm
        label(c, number, 11 * mm, y, 9, variant["accent"], "InsertBold")
        label(c, copy, 18 * mm, y, 8.4, ink)

    c.setFillColor(variant["pale"])
    c.roundRect(9.5 * mm, 32 * mm, 61 * mm, 20.5 * mm, 2 * mm, fill=1, stroke=0)
    label(c, "WICHTIG", 13 * mm, 48 * mm, 9, variant["accent"], "InsertBold")
    label(c, "Nicht auf verletzter oder gereizter Haut", 13 * mm, 43.5 * mm, 8.4, ink)
    label(c, "anwenden. Bei Irritation stoppen.", 13 * mm, 39.5 * mm, 8.4, ink)
    label(c, "Kein Medizinprodukt.", 13 * mm, 35.5 * mm, 8.4, ink)

    label(c, "HERSTELLER", 11 * mm, 27.5 * mm, 8.5, variant["accent"], "InsertBold")
    label(c, "RHODIDE · Onur Arda Küçük", 11 * mm, 23 * mm, 8.4, ink)
    label(c, "Saalmannstraße 9 · 13403 Berlin", 11 * mm, 18.5 * mm, 8.4, muted)
    label(c, "info@guasha-shop.de", 11 * mm, 14 * mm, 8.4, ink)

    c.setStrokeColor(HexColor("#D7DCD8"))
    c.setLineWidth(0.5)
    c.line(11 * mm, 11 * mm, 69 * mm, 11 * mm)
    label(c, "ID " + variant["sku"], 11 * mm, 6.5 * mm, 7.8, ink, "InsertBold")
    label(c, "CHARGE", 39 * mm, 6.5 * mm, 7.8, ink, "InsertBold")
    c.setStrokeColor(ink)
    c.line(53 * mm, 6.8 * mm, 69 * mm, 6.8 * mm)


def back(c, variant):
    c.setFillColor(variant["reverse"])
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.drawImage(
        ImageReader(LOGO), 22 * mm, 37.5 * mm,
        width=36 * mm, height=36 * mm,
        mask="auto", preserveAspectRatio=True, anchor="c",
    )


def create(filename, variant):
    temp = OUT / (filename + ".working.pdf")
    output = OUT / filename
    c = Canvas(str(temp), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("Gua Sha Beipackkarte A7 - " + variant["material"])
    c.setAuthor("RHODIDE")
    front(c, variant)
    c.showPage()
    back(c, variant)
    c.save()

    reader = PdfReader(str(temp))
    writer = PdfWriter()
    writer.append_pages_from_reader(reader)
    for page in writer.pages:
        page.trimbox = TRIM
        page.bleedbox = BLEED
    with output.open("wb") as stream:
        writer.write(stream)
    temp.unlink()


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    create("guasha-shop-edelstahl-a7-druck.pdf", {
        "material": "EDELSTAHL", "sku": "GS-STEEL-01",
        "accent": HexColor("#596B77"), "pale": HexColor("#E8ECEF"),
        "reverse": HexColor("#5E6971"),
    })
    create("guasha-shop-jade-a7-druck.pdf", {
        "material": "NEUE JADE (XIUYAN)", "sku": "GS-JADE-01",
        "accent": HexColor("#286D55"), "pale": HexColor("#E4EFE8"),
        "reverse": HexColor("#286D55"),
    })
