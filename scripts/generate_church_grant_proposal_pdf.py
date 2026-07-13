from datetime import date
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUTPUT_FILE = "CHURCH_GRANT_BUSINESS_PROPOSAL_KIAKIA_FOODS.pdf"
LOGO_CANDIDATES = [
    Path("public/exports/logo.png"),
    Path("public/logo.png"),
]


def money(value: int) -> str:
    return f"N{value:,.0f}"


def build_story():
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#184D2F"),
        spaceAfter=14,
    )
    sub_style = ParagraphStyle(
        "SubTitle",
        parent=styles["Normal"],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#555555"),
        spaceAfter=14,
    )
    h_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0F3D91"),
        spaceBefore=10,
        spaceAfter=6,
    )
    p_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["BodyText"],
        fontSize=10.5,
        leading=15,
        spaceAfter=6,
    )

    ask_amount = 2_000_000

    story = []
    logo_path = next((path for path in LOGO_CANDIDATES if path.exists()), None)
    if logo_path:
      story.append(Image(str(logo_path), width=3.0 * cm, height=3.0 * cm))
      story.append(Spacer(1, 0.2 * cm))

    story.append(Paragraph("BUSINESS PROPOSAL FOR CHURCH GRANT SUPPORT", title_style))
    story.append(Paragraph("KiaKia Foods", ParagraphStyle("bizname", parent=styles["Heading1"], fontSize=16, textColor=colors.HexColor("#222222"), spaceAfter=4)))
    story.append(
        Paragraph(
            f"Date: {date.today().strftime('%d %B %Y')}<br/>"
            "Submitted To: CYON, Holy Family Catholic Church, Life Camp, Abuja<br/>"
            "Prepared by: KiaKia Foods Management Team<br/>"
            "Location: Abuja, Nigeria",
            sub_style,
        )
    )

    story.append(Paragraph("Recipient Context (Research Snapshot)", h_style))
    story.append(
        Paragraph(
            "This proposal is specifically prepared for CYON at Holy Family Catholic Church, Life Camp, Abuja. "
            "Public information indicates the parish has an active youth body (CYON), a parish website presence, and regular community programs. "
            "The requested support is designed to align with youth empowerment, service outreach, and accountable stewardship.",
            p_style,
        )
    )

    story.append(Paragraph("1. Executive Summary", h_style))
    story.append(
        Paragraph(
            "KiaKia Foods is a growing grocery sourcing and last-mile delivery business serving households and professionals in Abuja. "
            "Our model helps families save time, avoid market stress, and receive affordable groceries at their doorstep. "
            "We are applying for a church grant to strengthen our operations, serve more families, and create dignified jobs for young people in our community.",
            p_style,
        )
    )

    story.append(Paragraph("2. Problem Statement", h_style))
    story.append(
        Paragraph(
            "Many households in our service area face three recurring challenges: (1) limited time to shop physically, (2) unstable access to fresh and reliable market goods, "
            "and (3) expensive, uncoordinated delivery options. These challenges affect working families, elderly people, and single parents most.",
            p_style,
        )
    )

    story.append(Paragraph("3. Our Solution", h_style))
    story.append(
        Paragraph(
            "KiaKia Foods aggregates customer orders, assigns trained runners for market sourcing, and coordinates grouped estate deliveries. "
            "This method lowers delivery cost per household, improves service reliability, and supports transparent order tracking.",
            p_style,
        )
    )

    story.append(Paragraph("4. Mission Alignment with CYON and Parish Community Impact", h_style))
    story.append(
        Paragraph(
            "This proposal aligns with CYON and parish values of service, stewardship, and youth formation through practical economic opportunity. "
            "The business creates impact through household food access, fair work opportunities, and skill development pathways for young adults in the church community. "
            "Our service also supports vulnerable members through planned and assisted grocery access.",
            p_style,
        )
    )

    story.append(Paragraph("5. Target Beneficiaries", h_style))
    story.append(
        Paragraph(
            "Primary beneficiaries include working families, church members, elderly households, and low-mobility customers in Abuja estates. "
            "Secondary beneficiaries include runners, dispatch riders, and support staff employed through expanded operations.",
            p_style,
        )
    )

    story.append(Paragraph("6. Operational Plan (12-Month)", h_style))
    story.append(
        Paragraph(
            "Phase 1 (Months 1-3): Increase sourcing capacity, standardize operations, and onboard additional runners and dispatch riders.<br/>"
            "Phase 2 (Months 4-8): Expand to additional estates and improve service reliability through route batching.<br/>"
            "Phase 3 (Months 9-12): Consolidate quality controls, retention programs, and financial reporting.",
            p_style,
        )
    )

    story.append(Paragraph("7. Grant Request and Use of Funds", h_style))
    story.append(
        Paragraph(
            f"Requested Church Grant: <b>{money(ask_amount)}</b>",
            p_style,
        )
    )

    fund_rows = [
        ["Budget Item", "Amount (NGN)", "Purpose"],
        ["Working Capital for Bulk Sourcing", money(700_000), "Stabilize product availability and pricing"],
        ["Logistics and Delivery Expansion", money(450_000), "Rider support, fuel, route execution, service consistency"],
        ["Operations Technology and Tools", money(250_000), "Order management improvements and reporting tools"],
        ["Staff Recruitment and Training", money(250_000), "Onboard and train runners/operations assistants"],
        ["Customer Growth and Outreach", money(200_000), "Community awareness and service adoption"],
        ["Contingency and Risk Buffer", money(150_000), "Manage volatility and emergency needs"],
        ["Total", money(ask_amount), ""],
    ]

    fund_table = Table(fund_rows, colWidths=[7.2 * cm, 3.5 * cm, 7.3 * cm])
    fund_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#184D2F")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#888888")),
                ("BACKGROUND", (0, 1), (-1, -2), colors.HexColor("#F6FBF7")),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#EAF4EC")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    story.append(fund_table)
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("8. Financial Outlook (Year 1)", h_style))
    finance_rows = [
        ["Metric", "Projected Amount (NGN)"],
        ["Projected Annual Revenue", money(42_000_000)],
        ["Projected Direct Operating Costs", money(28_500_000)],
        ["Projected Gross Margin", money(13_500_000)],
        ["Projected Net Surplus (after overhead)", money(6_800_000)],
    ]
    finance_table = Table(finance_rows, colWidths=[11 * cm, 7 * cm])
    finance_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F3D91")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#888888")),
                ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F7F9FF")),
            ]
        )
    )
    story.append(finance_table)

    story.append(Paragraph("9. Key Performance Indicators", h_style))
    story.append(
        Paragraph(
            "We will track measurable outcomes monthly:<br/>"
            "- Number of active households served<br/>"
            "- On-time delivery rate<br/>"
            "- Cost-per-delivery and delivery margin<br/>"
            "- Runner productivity and retention<br/>"
            "- Number of jobs sustained/created<br/>"
            "- Number of vulnerable households supported",
            p_style,
        )
    )

    story.append(Paragraph("10. Governance, Accountability, and Reporting", h_style))
    story.append(
        Paragraph(
            "KiaKia Foods commits to transparent stewardship of grant funds. We will submit periodic reports to the church covering fund utilization, impact metrics, "
            "business performance, and lessons learned. We welcome oversight and advisory support from church leadership.",
            p_style,
        )
    )

    story.append(Paragraph("11. Risk Management", h_style))
    story.append(
        Paragraph(
            "Main risks include market price volatility, logistics delays, and demand fluctuations. Mitigation actions include bulk purchase planning, estate-based batching, "
            "reserve buffers, and ongoing process controls through our order management system.",
            p_style,
        )
    )

    story.append(Paragraph("12. Closing Statement", h_style))
    story.append(
        Paragraph(
            "With church grant support, KiaKia Foods will scale responsibly, deepen community service, and strengthen household food access while creating meaningful livelihoods. "
            "We respectfully request your partnership to make this expansion possible.",
            p_style,
        )
    )

    story.append(Spacer(1, 0.8 * cm))
    story.append(Paragraph("Prepared by:", p_style))
    story.append(Paragraph("______________________________", p_style))
    story.append(Paragraph("KiaKia Foods Management Team", p_style))

    return story


def main():
    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        rightMargin=1.6 * cm,
        leftMargin=1.6 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title="KiaKia Foods Church Grant Business Proposal",
        author="KiaKia Foods",
    )
    doc.build(build_story())
    print(f"Created {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
