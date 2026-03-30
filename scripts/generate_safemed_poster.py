#!/usr/bin/env python3
"""Generate a SafeMed academic poster from the provided PPTX template."""

from __future__ import annotations

import copy
import shutil
import tempfile
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path("/Users/ S580723/Documents/Github/GDP-Group5")
TEMPLATE = Path("/Users/ S580723/Downloads/sample_poster-1.pptx")
OUTPUT_DIR = ROOT / "final_submission" / "poster"
OUTPUT_PPTX = OUTPUT_DIR / "SafeMed_Poster.pptx"

SLIDE_PATH = "ppt/slides/slide1.xml"

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}

ET.register_namespace("a", NS["a"])
ET.register_namespace("p", NS["p"])
ET.register_namespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")


def qn(prefix: str, tag: str) -> str:
    return f"{{{NS[prefix]}}}{tag}"


def find_shape(root: ET.Element, shape_id: str) -> ET.Element:
    for shape in root.findall(".//p:sp", NS):
        nv = shape.find("p:nvSpPr/p:cNvPr", NS)
        if nv is not None and nv.get("id") == shape_id:
            return shape
    raise KeyError(f"Shape {shape_id} not found")


def find_picture(root: ET.Element, shape_id: str) -> ET.Element | None:
    for pic in root.findall(".//p:pic", NS):
        nv = pic.find("p:nvPicPr/p:cNvPr", NS)
        if nv is not None and nv.get("id") == shape_id:
            return pic
    return None


def get_sp_tree(root: ET.Element) -> ET.Element:
    sp_tree = root.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        raise RuntimeError("Slide shape tree not found")
    return sp_tree


def clear_text_body(shape: ET.Element) -> ET.Element:
    tx_body = shape.find("p:txBody", NS)
    if tx_body is None:
        tx_body = ET.SubElement(shape, qn("p", "txBody"))
        ET.SubElement(tx_body, qn("a", "bodyPr"))
        ET.SubElement(tx_body, qn("a", "lstStyle"))

    body_pr = tx_body.find("a:bodyPr", NS)
    lst_style = tx_body.find("a:lstStyle", NS)

    for child in list(tx_body):
        if child is not body_pr and child is not lst_style:
            tx_body.remove(child)

    if body_pr is None:
        body_pr = ET.Element(qn("a", "bodyPr"))
        tx_body.insert(0, body_pr)

    if lst_style is None:
        lst_style = ET.Element(qn("a", "lstStyle"))
        tx_body.insert(1, lst_style)

    return tx_body


def set_body_anchor(shape: ET.Element, *, anchor: str = "t") -> None:
    tx_body = shape.find("p:txBody", NS)
    if tx_body is None:
        tx_body = ET.SubElement(shape, qn("p", "txBody"))
        ET.SubElement(tx_body, qn("a", "bodyPr"))
        ET.SubElement(tx_body, qn("a", "lstStyle"))

    body_pr = tx_body.find("a:bodyPr", NS)
    if body_pr is None:
        body_pr = ET.Element(qn("a", "bodyPr"))
        tx_body.insert(0, body_pr)
    body_pr.set("anchor", anchor)
    body_pr.set("tIns", "45720")
    body_pr.set("bIns", "45720")
    body_pr.set("lIns", "45720")
    body_pr.set("rIns", "45720")


def make_paragraph(
    text: str,
    *,
    size: int,
    bold: bool = False,
    align: str = "l",
) -> ET.Element:
    paragraph = ET.Element(qn("a", "p"))
    p_pr = ET.SubElement(paragraph, qn("a", "pPr"))
    p_pr.set("algn", align)
    ET.SubElement(p_pr, qn("a", "buNone"))

    run = ET.SubElement(paragraph, qn("a", "r"))
    r_pr = ET.SubElement(run, qn("a", "rPr"))
    r_pr.set("lang", "en-US")
    r_pr.set("sz", str(size))
    r_pr.set("dirty", "0")
    if bold:
        r_pr.set("b", "1")

    run_text = ET.SubElement(run, qn("a", "t"))
    run_text.text = text

    end = ET.SubElement(paragraph, qn("a", "endParaRPr"))
    end.set("lang", "en-US")
    end.set("sz", str(size))
    end.set("dirty", "0")
    if bold:
        end.set("b", "1")
    return paragraph


def set_paragraphs(shape: ET.Element, paragraphs: list[dict[str, object]]) -> None:
    tx_body = clear_text_body(shape)
    for para in paragraphs:
        tx_body.append(
            make_paragraph(
                str(para["text"]),
                size=int(para["size"]),
                bold=bool(para.get("bold", False)),
                align=str(para.get("align", "l")),
            )
        )


def set_single_text(shape: ET.Element, text: str, *, size: int, bold: bool = False, align: str = "l") -> None:
    set_paragraphs(
        shape,
        [
            {
                "text": text,
                "size": size,
                "bold": bold,
                "align": align,
            }
        ],
    )


def update_shape_position(shape: ET.Element, *, x: int, y: int, cx: int, cy: int) -> None:
    xfrm = shape.find("p:spPr/a:xfrm", NS)
    if xfrm is None:
        sp_pr = shape.find("p:spPr", NS)
        if sp_pr is None:
            sp_pr = ET.SubElement(shape, qn("p", "spPr"))
        xfrm = ET.SubElement(sp_pr, qn("a", "xfrm"))
        ET.SubElement(xfrm, qn("a", "off"))
        ET.SubElement(xfrm, qn("a", "ext"))

    off = xfrm.find("a:off", NS)
    ext = xfrm.find("a:ext", NS)
    if off is None:
        off = ET.SubElement(xfrm, qn("a", "off"))
    if ext is None:
        ext = ET.SubElement(xfrm, qn("a", "ext"))

    off.set("x", str(x))
    off.set("y", str(y))
    ext.set("cx", str(cx))
    ext.set("cy", str(cy))


def clone_text_box(root: ET.Element, source_id: str, new_id: str, new_name: str) -> ET.Element:
    source = find_shape(root, source_id)
    clone = copy.deepcopy(source)
    nv = clone.find("p:nvSpPr/p:cNvPr", NS)
    if nv is None:
        raise RuntimeError("Missing non-visual properties on cloned text box")
    nv.set("id", new_id)
    nv.set("name", new_name)
    return clone


def remove_picture(root: ET.Element, picture_id: str) -> None:
    sp_tree = get_sp_tree(root)
    pic = find_picture(root, picture_id)
    if pic is not None:
        sp_tree.remove(pic)


def build_body(section_title: str, bullets: list[str], *, heading_size: int, body_size: int) -> list[dict[str, object]]:
    paragraphs: list[dict[str, object]] = [
        {"text": section_title, "size": heading_size, "bold": True},
    ]
    paragraphs.extend({"text": f"• {bullet}", "size": body_size} for bullet in bullets)
    return paragraphs


def build_bullets(bullets: list[str], *, body_size: int) -> list[dict[str, object]]:
    return [{"text": f"• {bullet}", "size": body_size} for bullet in bullets]


def main() -> None:
    if not TEMPLATE.exists():
        raise FileNotFoundError(f"Template not found: {TEMPLATE}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(TEMPLATE, "r") as archive:
        slide_bytes = archive.read(SLIDE_PATH)
        members = [(info, archive.read(info.filename)) for info in archive.infolist()]

    root = ET.fromstring(slide_bytes)

    # Remove legacy sample images so the poster is fully SafeMed-focused.
    for picture_id in ("20", "21", "23", "26"):
        remove_picture(root, picture_id)

    # Reuse the results text box as a full-width lower-center panel.
    results_box = find_shape(root, "28")
    update_shape_position(
        results_box,
        x=11887200,
        y=18287998,
        cx=20116800,
        cy=8686801,
    )

    # Add a new methodology text box in the large upper-center image region.
    sp_tree = get_sp_tree(root)
    methodology_box = clone_text_box(root, "28", "29", "Methodology TextBox")
    update_shape_position(
        methodology_box,
        x=11887200,
        y=7557845,
        cx=20116799,
        cy=8592191,
    )
    set_body_anchor(methodology_box)
    set_paragraphs(
        methodology_box,
        build_bullets(
            [
                "Patient submits an ADR report from web or mobile using text, photo, or voice.",
                "Backend validates input, applies secure auth checks, and stores report data in MongoDB.",
                "Attachments are uploaded through MinIO-backed storage for shared web/mobile access.",
                "Duplicate screening compares recent reports in a 72-hour window with a 0.7 similarity threshold.",
                "RabbitMQ sends the report to an async AI consumer for severity, seriousness, priority, and guidance analysis.",
                "Clinicians review flagged cases, follow progression, receive notifications, and export reports.",
            ],
            body_size=2200,
        ),
    )
    sp_tree.append(methodology_box)

    # Title and byline.
    set_single_text(
        find_shape(root, "5"),
        "SafeMed: AI-Assisted ADR Reporting With Duplicate Detection and Severity Triage",
        size=4600,
        bold=True,
        align="ctr",
    )
    set_single_text(
        find_shape(root, "18"),
        "Imadeddin Ouahidi, Anji Reddy Modugula, Lohitha Vodnala",
        size=2400,
        align="ctr",
    )
    set_single_text(
        find_shape(root, "19"),
        "School of Computer Science and Information Systems, Northwest Missouri State University, Maryville, Missouri, USA | support@safemed.app",
        size=1700,
        align="ctr",
    )

    # Panel headers.
    set_single_text(find_shape(root, "6"), "Background & Problem", size=2400, bold=True)
    set_single_text(find_shape(root, "24"), "Methodology", size=2400, bold=True)
    set_single_text(find_shape(root, "7"), "Discussion & Conclusion", size=2400, bold=True)
    set_single_text(find_shape(root, "9"), "Objectives & Future Work", size=2400, bold=True)
    set_single_text(find_shape(root, "12"), "Results", size=2400, bold=True)
    set_single_text(find_shape(root, "16"), "Acknowledgments", size=2400, bold=True)
    set_single_text(find_shape(root, "11"), "References", size=2400, bold=True)
    set_single_text(find_shape(root, "14"), "Contact Information", size=2400, bold=True)

    # Body panels.
    set_paragraphs(
        find_shape(root, "2"),
        build_body(
            "INTRODUCTION / BACKGROUND",
            [
                "ADR reporting is often fragmented, slow to review, and hard to prioritize consistently.",
                "Patients need a simple way to submit side effects across desktop and mobile workflows.",
                "Clinicians need secure, structured, and searchable reports instead of scattered free-text evidence.",
            ],
            heading_size=2200,
            body_size=2000,
        )
        + build_body(
            "PROBLEM STATEMENT / RESEARCH QUESTION",
            [
                "How can one cross-platform system collect multimodal ADR evidence and support faster duplicate-aware triage?",
                "Gap: the project requirements combine secure intake, AI triage, duplicate screening, and role-based review in one workflow.",
            ],
            heading_size=2200,
            body_size=2000,
        ),
    )

    set_paragraphs(
        find_shape(root, "3"),
        build_body(
            "DISCUSSION",
            [
                "SafeMed demonstrates an end-to-end ADR workflow instead of isolated UI mockups.",
                "Queue-based AI processing keeps submission responsive while supporting later enrichment.",
                "Strengths: multimodal input, cross-platform clients, role-aware review, and a containerized service design.",
                "Limitations: duplicate merging, full multilingual coverage, graphing, urgent alerts, and print layout are still partial.",
            ],
            heading_size=2200,
            body_size=2000,
        )
        + build_body(
            "CONCLUSION",
            [
                "The project shows a credible CS prototype for AI-assisted ADR reporting across patient and clinician workflows.",
                "The strongest defensible claim is an implemented prototype with seeded scenarios and async analysis, not a finished production platform.",
            ],
            heading_size=2200,
            body_size=2000,
        ),
    )

    set_paragraphs(
        find_shape(root, "8"),
        build_body(
            "OBJECTIVES / CONTRIBUTIONS",
            [
                "Build a unified ADR reporting system for web and mobile users.",
                "Support text, image, and audio submission with AI-assisted structuring.",
                "Add secure authentication, role-based access, notifications, export, and symptom progression tracking.",
                "Use duplicate detection and severity prioritization to reduce review burden.",
            ],
            heading_size=2200,
            body_size=2000,
        )
        + build_body(
            "FUTURE WORK",
            [
                "Complete confirmed-duplicate merge workflows and urgent staff escalation.",
                "Finish multilingual coverage and analytics dashboards.",
                "Improve printable report layouts and deeper clinician review flows.",
                "Evaluate the system on larger or de-identified ADR datasets.",
            ],
            heading_size=2200,
            body_size=2000,
        ),
    )

    set_body_anchor(results_box)
    set_paragraphs(
        results_box,
        build_bullets(
            [
                "The deployed architecture uses 6 runtime services plus 1 MinIO initialization helper in Docker Compose.",
                "The backend exposes 7 major API areas: auth, medications, reports, symptom progression, uploads, notifications, and export.",
                "The repo includes seeded demo accounts for patient and doctor workflows and curated ADR report scenarios.",
                "Demo reports span mild, moderate, and severe cases with AI risk scores such as 15, 35, 45, and 75.",
                "Web and mobile clients both support shared uploads, notifications, and role-based navigation.",
            ],
            body_size=2200,
        ),
    )

    set_paragraphs(
        find_shape(root, "15"),
        [
            {"text": "• Northwest Missouri State University and the School of Computer Science and Information Systems.", "size": 1700},
            {"text": "• Group 5 contributors: Imadeddin Ouahidi, Anji Reddy Modugula, and Lohitha Vodnala.", "size": 1700},
            {"text": "• Project guidance and feedback documented in the SafeMed wiki and client meetings.", "size": 1700},
        ],
    )

    set_paragraphs(
        find_shape(root, "10"),
        [
            {"text": "Ouahidi, I., Modugula, A. R., & Vodnala, L. (n.d.). Functional requirements list - final - group 5. GDP-Group5 project wiki.", "size": 1500},
            {"text": "Ouahidi, I., Modugula, A. R., & Vodnala, L. (n.d.). Software requirements specification - group 5. GDP-Group5 project wiki.", "size": 1500},
            {"text": "Ouahidi, I., Modugula, A. R., & Vodnala, L. (n.d.). Use cases (Iteration 2). GDP-Group5 project wiki.", "size": 1500},
            {"text": "Ouahidi, I., Modugula, A. R., & Vodnala, L. (n.d.). Client meeting minutes IV. GDP-Group5 project wiki.", "size": 1500},
        ],
    )

    set_paragraphs(
        find_shape(root, "13"),
        [
            {"text": "Email: support@safemed.app", "size": 1900},
            {"text": "GitHub: github.com/ImadeddinOuahidi/GDP-Group5", "size": 1800},
            {"text": "Wiki: github.com/ImadeddinOuahidi/GDP-Group5/wiki", "size": 1700},
        ],
    )

    updated_slide = ET.tostring(root, encoding="utf-8", xml_declaration=True)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pptx") as tmp_file:
        temp_path = Path(tmp_file.name)

    with zipfile.ZipFile(temp_path, "w") as archive:
        for info, data in members:
            if info.filename == SLIDE_PATH:
                archive.writestr(info, updated_slide)
            else:
                archive.writestr(info, data)

    shutil.move(temp_path, OUTPUT_PPTX)

    print(f"Generated {OUTPUT_PPTX}")


if __name__ == "__main__":
    main()
