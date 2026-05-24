from pathlib import Path
import re
import textwrap


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "PROJECT_REPORT_ENGLISH.md"
OUTPUT = ROOT / "Cost_Time_Project_Analysis_Report.pdf"


def clean_line(line: str) -> str:
    line = line.rstrip()
    line = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", line)
    line = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", line)
    line = line.replace("`", "")
    line = line.replace("|", "  ")
    line = line.replace("•", "-")
    line = line.replace("–", "-")
    line = line.replace("—", "-")
    line = line.replace("’", "'").replace("‘", "'")
    line = line.replace("“", '"').replace("”", '"')
    return line


def markdown_to_lines(text: str) -> list[tuple[str, str]]:
    lines: list[tuple[str, str]] = []
    in_code = False
    for raw in text.splitlines():
        if raw.strip().startswith("```"):
            in_code = not in_code
            continue

        line = clean_line(raw)
        stripped = line.strip()
        if not stripped:
            lines.append(("blank", ""))
            continue

        if in_code:
            lines.append(("code", stripped))
            continue

        heading_match = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if heading_match:
            level = len(heading_match.group(1))
            title = heading_match.group(2).strip()
            lines.append((f"h{level}", title))
            continue

        stripped = re.sub(r"^\s*[-*]\s+", "- ", stripped)
        stripped = re.sub(r"^\s*(\d+)\.\s+", r"\1. ", stripped)
        lines.append(("body", stripped))
    return lines


def escape_pdf_text(text: str) -> str:
    safe = text.encode("latin-1", errors="replace").decode("latin-1")
    return safe.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


class SimplePDF:
    def __init__(self) -> None:
        self.objects: list[str] = []
        self.pages: list[int] = []
        self.font_obj = 0
        self.pages_obj = 0

    def add_object(self, content: str) -> int:
        self.objects.append(content)
        return len(self.objects)

    def add_page(self, stream: str) -> None:
        stream_bytes = stream.encode("latin-1", errors="replace")
        content_obj = self.add_object(
            f"<< /Length {len(stream_bytes)} >>\nstream\n"
            + stream_bytes.decode("latin-1")
            + "\nendstream"
        )
        page_obj = self.add_object(
            f"<< /Type /Page /Parent {self.pages_obj} 0 R /MediaBox [0 0 595 842] "
            f"/Resources << /Font << /F1 {self.font_obj} 0 R >> >> "
            f"/Contents {content_obj} 0 R >>"
        )
        self.pages.append(page_obj)

    def render(self, path: Path) -> None:
        kids = " ".join(f"{page} 0 R" for page in self.pages)
        self.objects[self.pages_obj - 1] = (
            f"<< /Type /Pages /Kids [{kids}] /Count {len(self.pages)} >>"
        )
        catalog_obj = self.add_object(f"<< /Type /Catalog /Pages {self.pages_obj} 0 R >>")

        output = ["%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"]
        offsets = []
        current = len(output[0].encode("latin-1"))
        for idx, obj in enumerate(self.objects, start=1):
            offsets.append(current)
            chunk = f"{idx} 0 obj\n{obj}\nendobj\n"
            output.append(chunk)
            current += len(chunk.encode("latin-1", errors="replace"))

        xref_offset = current
        output.append(f"xref\n0 {len(self.objects) + 1}\n")
        output.append("0000000000 65535 f \n")
        for offset in offsets:
            output.append(f"{offset:010d} 00000 n \n")
        output.append(
            f"trailer\n<< /Size {len(self.objects) + 1} /Root {catalog_obj} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        )
        path.write_bytes("".join(output).encode("latin-1", errors="replace"))


def build_pdf(lines: list[tuple[str, str]], output: Path) -> None:
    pdf = SimplePDF()
    pdf.font_obj = pdf.add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    pdf.pages_obj = pdf.add_object("")

    page_lines: list[tuple[str, int, int]] = []
    y = 790

    def flush_page() -> None:
        nonlocal page_lines, y
        if not page_lines:
            return
        commands = ["BT"]
        for text, size, ypos in page_lines:
            commands.append(f"/F1 {size} Tf 50 {ypos} Td ({escape_pdf_text(text)}) Tj")
        commands.append("ET")
        pdf.add_page("\n".join(commands))
        page_lines = []
        y = 790

    def add_text(text: str, size: int = 11, gap: int = 16) -> None:
        nonlocal y
        if y < 55:
            flush_page()
        page_lines.append((text, size, y))
        y -= gap

    for kind, text in lines:
        if kind == "blank":
            y -= 7
            if y < 55:
                flush_page()
            continue

        if kind == "h1":
            if page_lines and y < 690:
                flush_page()
            add_text(text.upper(), 18, 28)
            continue

        if kind == "h2":
            y -= 5
            add_text(text, 15, 23)
            continue

        if kind == "h3":
            add_text(text, 13, 20)
            continue

        width = 78 if kind != "code" else 90
        prefix = "    " if kind == "code" else ""
        for wrapped in textwrap.wrap(text, width=width, replace_whitespace=False) or [""]:
            add_text(prefix + wrapped, 10 if kind == "code" else 11, 15)

    flush_page()
    pdf.render(output)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Report source not found: {SOURCE}")
    lines = markdown_to_lines(SOURCE.read_text(encoding="utf-8"))
    build_pdf(lines, OUTPUT)
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    main()
