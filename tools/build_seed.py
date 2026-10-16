#!/usr/bin/env python3
"""
build_seed.py — menghasilkan DUA file dari satu sumber data supaya selalu konsisten:

    supabase/seed.sql            → isi awal database Supabase (instalasi baru)
    supabase/migration-2026-10-redesign.sql → peningkatan database yang SUDAH berjalan (non-destruktif)
    assets/js/fallback-data.js   → data cadangan di website (dipakai bila Supabase belum
                                   diisi / tidak terjangkau)

Sumber data:
  1. GLOBAL      : teks header/footer (kunci "global.*"), didefinisikan di bawah.
     JavaScript : setiap t('kunci', 'teks') di assets/js/*.js otomatis ikut diseed.
  2. File HTML   : setiap elemen ber-atribut data-cms / data-cms-src / data-cms-href /
                   data-cms-content otomatis diekstrak (teks bawaan di HTML = nilai awal DB).
  3. TABLES      : data daftar berulang (dosen, FAQ, berita, kurikulum, dst.) di bawah.

Jalankan dari folder proyek:   python3 tools/build_seed.py
(Tidak perlu dijalankan ulang kecuali Anda mengubah teks bawaan di HTML / data di file ini.
 File ini TIDAK perlu diunggah ke hosting.)
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent

# --------------------------------------------------------------------------
# 1. KONTEN GLOBAL (header, footer, label umum)
# --------------------------------------------------------------------------
# (key, kind, value, alt_text)
GLOBAL = [
    ("global.brand.name", "text", "IBM Institut Asia", None),
    ("global.brand.subname", "text", "Malang", None),
    ("global.brand.logo", "image", "assets/img/logo-mark.svg", "IBM Malang Asia Institute logo"),
    ("global.brand.logo_alt", "text", "IBM Malang Asia Institute logo", None),
    ("global.nav.home", "text", "Home", None),
    ("global.nav.about", "text", "About IBM", None),
    ("global.nav.admission", "text", "Admission", None),
    ("global.nav.news", "text", "News", None),
    ("global.nav.profile", "text", "Profile", None),
    ("global.nav.profile_lecturers", "text", "Lecturer Profiles", None),
    ("global.nav.profile_students", "text", "Student Profiles", None),
    ("global.nav.gallery", "text", "Gallery", None),
    ("global.nav.gallery_activities", "text", "Student Activities", None),
    ("global.nav.gallery_facilities", "text", "Learning Facilities", None),
    ("global.nav.simaka", "text", "SIMAKA", None),
    ("global.nav.menu_label", "text", "Open navigation menu", None),
    ("global.nav.aria_label", "text", "Main navigation", None),
    ("global.simaka.url", "link", "https://mahasiswa.asia.ac.id/", None),
    # Footer
    ("global.footer.tagline", "text", "International Business Management — Start Your Future Here", None),
    ("global.footer.address", "text", "Jl. Soekarno Hatta Jl. Rembuksari No.1 A, Mojolangu, Kec. Lowokwaru, Kota Malang, Jawa Timur 65113", None),
    ("global.footer.email", "text", "ibm@asia.ac.id", None),
    ("global.footer.phone", "text", "0851-7433-4514", None),
    ("global.footer.map_url", "link", "", None),
    ("global.footer.map_title", "text", "Campus location map", None),
    ("global.footer.nav_title", "text", "Footer links", None),
    ("global.footer.group_1_title", "text", "New Student Admission", None),
    ("global.footer.group_2_title", "text", "Institutions/Agencies", None),
    ("global.footer.group_3_title", "text", "Student Services", None),
    ("global.footer.contact_title", "text", "Contact", None),
    ("global.footer.hours_title", "text", "Opening Hours", None),
    ("global.footer.clock_label", "text", "Current time in Malang", None),
    ("global.footer.social_title", "text", "Our Socials", None),
    ("global.footer.copyright", "text", "© {2026} IBM Malang Asia Institute. All rights reserved.", None),
    # Media sosial (isi tautan lewat Supabase; kosong = ikon redup tanpa tautan)
    ("global.social.whatsapp", "link", "https://wa.me/6285174334514", None),
    ("global.social.instagram", "link", "", None),
    ("global.social.tiktok", "link", "", None),
    ("global.social.youtube", "link", "", None),
    ("global.contact.whatsapp", "text", "6285174334514", None),
    # Menu bahasa
    ("global.lang.label", "text", "Language", None),
    ("global.lang.note", "text", "Automatic translation by Google Translate", None),
    ("global.lang.options", "text", "en:English|id:Bahasa Indonesia|ms:Bahasa Melayu|tl:Filipino|pt:Português|zh-CN:中文 (Chinese)|ja:日本語 (Japanese)|ko:한국어 (Korean)|ar:العربية (Arabic)", None),
    # Aksesibilitas & SEO
    ("global.a11y.photo_prefix", "text", "Photo", None),
    ("global.a11y.zoom_image", "text", "Enlarge photo", None),
    ("global.seo.og_image", "image", "", None),
]

# Teks yang dipakai langsung oleh JavaScript (tidak ada di HTML) diambil otomatis dari
# panggilan t('kunci', 'teks bawaan') di assets/js/*.js — lihat scan_js_keys().
JS_FILES = ["cms.js", "layout.js", "ui.js", "features.js"]
JS_LINK_KEYS = {"global.footer.map_url"}

# Teks bawaan lama (Indonesia/versi awal) yang HARUS diperbarui di database bila belum Anda ubah.
# {kunci: nilai_lama_persis} → nilai baru diambil dari HTML. Dipakai di migrasi.
STALE_VALUES = {
    "admission.scholarship.title": "Four Scholarship Pathways Available",
    "admission.tuition.title": "Tuition Fee Details",
    "admission.tuition.description": "Estimated total cost of education per study program. Costs are subject to change in accordance with the campus's current-year policies.",
}

# --------------------------------------------------------------------------
# 2. DATA DAFTAR BERULANG
# --------------------------------------------------------------------------
PH = "https://placehold.co"


def ph(w, h, bg, fg, text):
    return f"{PH}/{w}x{h}/{bg}/{fg}?text={text.replace(' ', '+')}"


PROGRAMS = ["Information Systems", "Informatics Engineering", "Business Management", "Accounting"]

NEWS_TEXT = ('Sample article — replace it with your real news through the content column of the news table.\n\n'
             'The opening paragraph summarises the story clearly and briefly.\n\n'
             'Closing paragraph: share the next steps or contact information where relevant.')

TABLES = {
    "list_items": [
        # Hero statistics (Home)
        dict(group_key="home.hero_stats", title="25+", body="Years of excellence"),
        dict(group_key="home.hero_stats", title="12", body="Double Degree partners"),
        dict(group_key="home.hero_stats", title="4,500+", body="Employed alumni"),
        # Double Degree bullet points (Home)
        dict(group_key="home.double_degree", title="", body="Two degrees from a domestic and an overseas institution"),
        dict(group_key="home.double_degree", title="", body="Credit transfer recognised by both institutions"),
        dict(group_key="home.double_degree", title="", body="Cross-cultural and international language experience"),
        # About at a glance
        dict(group_key="about.glimpse_facts", title="Official Partnership", body="Trent Global College, Singapore"),
        dict(group_key="about.glimpse_facts", title="Programme Focus", body="International business & industry readiness"),
        dict(group_key="about.glimpse_facts", title="Study Levels", body="Diploma to Applied Bachelor's Degree"),
        # Opening hours (footer, all pages): title = days, body = hours
        dict(group_key="global.opening_hours", title="Monday – Friday", body="08:00 – 16:00 WIB"),
    ],
    "why_items": [
        dict(icon="book", title="Industry-Based Curriculum",
             description="Courses are designed with business practitioners so they stay relevant to the global job market."),
        dict(icon="briefcase", title="Practitioner Lecturers",
             description="Learn from instructors with hands-on experience in international trade, finance, and cross-border management."),
        dict(icon="globe", title="Global Partner Network",
             description="Partnerships with universities and companies in Indonesia and overseas."),
        dict(icon="compass", title="Career Guidance",
             description="Internship preparation, career consulting, and access to the alumni network."),
    ],
    "partners": (
        [dict(name="Trent Global College", logo_url=ph(440, 180, "FFFFFF", "173671", "Trent Global College"),
              website_url="", is_official=True)]
        + [dict(name=f"Partner {i}", logo_url=ph(320, 128, "E3E9F5", "173671", f"Partner {i}"), website_url="", is_official=False)
           for i in range(1, 7)]
    ),
    "people": (
        [
            dict(kind="lecturer", name=n, program=p, detail=d, position=pos, company="IBM Malang Asia Institute",
                 specialty=d, achievements="Achievement or credential 1 — edit in Supabase\nAchievement or credential 2 — edit in Supabase",
                 photo_url=ph(480, 600, "2A52A0", "FFFFFF", f"Lecturer {i}"), batch=None, is_featured=(i <= 8))
            for i, (n, p, d, pos) in enumerate([
                ("Lecturer Name One, M.Kom.", "Information Systems", "Databases & Analytics", "Lecturer, Information Systems"),
                ("Lecturer Name Two, M.T.", "Informatics Engineering", "Networks & Cyber Security", "Lecturer, Informatics Engineering"),
                ("Lecturer Name Three, M.M.", "Business Management", "Entrepreneurship", "Lecturer, Business Management"),
                ("Lecturer Name Four, M.Ak.", "Accounting", "Taxation", "Lecturer, Accounting"),
                ("Lecturer Name Five, M.Kom.", "Informatics Engineering", "Software Development", "Lecturer, Informatics Engineering"),
                ("Lecturer Name Six, M.Si.", "Information Systems", "Data Science", "Lecturer, Information Systems"),
                ("Lecturer Name Seven, M.M.", "Business Management", "Digital Marketing", "Lecturer, Business Management"),
                ("Lecturer Name Eight, M.Ak.", "Accounting", "Audit & Finance", "Lecturer, Accounting"),
            ], start=1)
        ] + [
            dict(kind="student", name=f"Student Name {i}", program=PROGRAMS[(i - 1) % 4], detail=f"Batch {b}",
                 position="", company="", specialty="", achievements="",
                 photo_url=ph(480, 600, "2A52A0", "FFFFFF", f"Batch {b} Student {i}"), batch=b, is_featured=False)
            for b in range(1, 5) for i in range(1, 16)
        ]
    ),
    "testimonials": [
        dict(name=f"Student Name {i}", batch=f"Batch {i} · {PROGRAMS[i - 1]}",
             quote="Testimonial text will be published here. Edit it in the testimonials table in Supabase.",
             photo_url=ph(400, 500, "2A52A0", "FFFFFF", f"Student {i}"))
        for i in range(1, 4)
    ],
    "footer_links": [
        dict(group_no=1, label="Register", url="https://pendaftaran.asia.ac.id/"),
        dict(group_no=1, label="Scholarships", url="https://api.whatsapp.com/send/?phone=6285174334514&text=Halo+WA+Center+IBM+Asia+Malang%2C+Saya+mau+tanya+tentang+beasiswa+IBM&type=phone_number&app_absent=0"),
        dict(group_no=2, label="Business Incubator", url="https://inbis.asia.ac.id/"),
        dict(group_no=2, label="Asia's Partnership Bureau", url="https://kerma.asia.ac.id/"),
        dict(group_no=2, label="Institute for Research and Community Service (LP2M)", url="https://lp2m.asia.ac.id/"),
        dict(group_no=2, label="Internal Quality Assurance Agency (LPMI)", url="https://lpmi.asia.ac.id/"),
        dict(group_no=3, label="Administrative and Academic Bureau (BAA)", url="https://akademik.asia.ac.id/public/"),
        dict(group_no=3, label="Career Center", url="https://careercenter.asia.ac.id/"),
        dict(group_no=3, label="Professional Certification Unit", url="https://usp.asia.ac.id/"),
        dict(group_no=3, label="Counseling and Guidance", url="https://konseling.asia.ac.id/"),
        dict(group_no=3, label="Digital Learning", url="https://sites.google.com/asia.ac.id/d-learning/beranda"),
    ],
    "buttons": [
        dict(group_key="home.simaka", label="For Students", url="https://mahasiswa.asia.ac.id/", variant="gold"),
        dict(group_key="home.simaka", label="For Lecturers", url="", variant="light"),
        dict(group_key="admission.scholarship_registration", label="Apply Now", url="", variant="gold"),
        dict(group_key="admission.scholarship_test", label="TPA Test", url="", variant="light"),
        dict(group_key="admission.scholarship_test", label="TPE Test", url="", variant="light"),
    ],
    "news": [
        dict(title="IBM Class of 2026 Student Orientation Officially Opens",
             excerpt="New students join an orientation programme introducing the campus, the curriculum, and the Double Degree pathway.",
             image_url=ph(720, 450, "173671", "EBB213", "Featured News"), published_at="2026-08-12", is_featured=True, link_url="",
             slug="ibm-class-of-2026-student-orientation",
             content='<p>Sample article — replace it with your real news through the content column of the news table.</p><h2>Programme highlights</h2><p>Summarise what happened, who was involved, and why it matters to students.</p><ul><li>First point</li><li>Second point</li><li>Third point</li></ul><blockquote>A quote from a speaker can be placed here.</blockquote><p>You can also add a <a href="admission.html">link</a> to another page.</p>'),
        dict(title="Guest Lecture: Export Strategies for SMEs",
             excerpt="An export practitioner shares the steps to enter overseas markets, from legal requirements to logistics.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "News 2"), published_at="2026-08-05", is_featured=False, link_url="",
             slug="guest-lecture-export-strategies-for-smes", content=NEWS_TEXT),
        dict(title="Industry Visit to an International Logistics Company",
             excerpt="Students see the supply chain and export-import operations first-hand.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "News 3"), published_at="2026-07-28", is_featured=False, link_url="",
             slug="industry-visit-international-logistics-company", content=NEWS_TEXT),
        dict(title="First-Wave Achievement Scholarship Registration Now Open",
             excerpt="Achievement scholarships are available for academic and non-academic tracks. Check the requirements on the Admission page.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "News 4"), published_at="2026-07-15", is_featured=False, link_url="",
             slug="first-wave-achievement-scholarship-registration-open", content=NEWS_TEXT),
        dict(title="Business English Workshop for Global Career Readiness",
             excerpt="Practice presentations, negotiation, and business correspondence in English with our lecturers.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "News 5"), published_at="2026-07-02", is_featured=False, link_url="",
             slug="business-english-workshop-global-career", content=NEWS_TEXT),
        dict(title="IBM Students Win Regional Business Plan Competition",
             excerpt="A student team won the competition with an export-oriented business plan.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "News 6"), published_at="2026-06-20", is_featured=False, link_url="",
             slug="ibm-students-win-regional-business-plan-competition", content=NEWS_TEXT),
        dict(title="Partnership Signed with a New Double Degree Partner",
             excerpt="The new partnership widens the choice of partner universities for IBM students.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "News 7"), published_at="2026-06-09", is_featured=False, link_url="",
             slug="partnership-signed-new-double-degree-partner", content=NEWS_TEXT),
        dict(title="Career Seminar: Opportunities at Multinational Companies",
             excerpt="Alumni and HR practitioners explain the competencies multinational companies look for.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "News 8"), published_at="2026-05-27", is_featured=False, link_url="",
             slug="career-seminar-multinational-companies", content=NEWS_TEXT),
        dict(title="Community Service: Digital Marketing Support for SMEs",
             excerpt="Students help local SMEs use social media to reach new markets.",
             image_url=ph(640, 400, "2A52A0", "FFFFFF", "News 9"), published_at="2026-05-14", is_featured=False, link_url="",
             slug="community-service-digital-marketing-smes", content=NEWS_TEXT),
    ],
    "faqs": [
        dict(question="What registration paths are available at IBM Malang Asia Institute?",
             answer="You can register online through the registration portal, or offline by visiting the admissions office on campus. The full steps are on the Admission page."),
        dict(question="Are scholarships available?",
             answer="Yes. Several scholarship pathways are available, including academic and non-academic tracks. Details are on the Admission page."),
        dict(question="How does the Double Degree programme work?",
             answer="Students complete part of their studies at IBM Malang Asia Institute and part at a partner university, then earn two degrees. The academic office provides the requirements and schedule."),
        dict(question="How much is the tuition fee per semester?",
             answer="The tuition fee is a flat rate for every semester. See the Tuition Fees section on the Admission page for the current amount."),
    ],
    "curriculum_courses": [
        dict(semester=sem, course_name=name, credits=sks)
        for sem, items in {
            1: [("Introduction to International Business", 3), ("Principles of Management", 3), ("Business English I", 2), ("Business Mathematics", 2), ("Pancasila Education", 2)],
            2: [("Introduction to Accounting", 3), ("Microeconomics", 3), ("Business English II", 2), ("Business Statistics", 2), ("Civic Education", 2)],
            3: [("Organisational Behaviour", 3), ("Marketing Management", 3), ("Business Law", 2), ("Cross-Cultural Communication", 2)],
            4: [("Financial Management", 3), ("International Trade", 3), ("Operations & Supply Chain Management", 3), ("Research Methodology", 2)],
            5: [("Global Marketing", 3), ("Digital Business & E-Commerce", 3), ("Human Resource Management", 2), ("Elective Course I", 2)],
            6: [("Internship / Work Practice", 4), ("Strategic Management", 3), ("Entrepreneurship", 2), ("Elective Course II", 2)],
            7: [("Thesis / Final Project", 6), ("Proposal Seminar", 2), ("Community Service Programme", 2)],
        }.items()
        for name, sks in items
    ],
    "academic_calendar": [
        dict(activity="Online Course Registration (KRS)", start_date="2026-08-01", end_date="2026-08-10"),
        dict(activity="Start of Lectures", start_date="2026-08-18", end_date=None),
        dict(activity="Midterm Examinations", start_date="2026-10-13", end_date="2026-10-18"),
        dict(activity="Course Withdrawal Deadline", start_date="2026-10-25", end_date=None),
        dict(activity="Study Week", start_date="2026-12-07", end_date="2026-12-12"),
        dict(activity="Final Examinations", start_date="2026-12-14", end_date="2026-12-23"),
        dict(activity="Odd Semester Break", start_date="2026-12-26", end_date="2027-01-17"),
        dict(activity="Start of Even Semester", start_date="2027-01-18", end_date=None),
    ],
    "admission_steps": [
        dict(track="online", title="Complete the Online Form", description="Open the official registration page and fill in your personal details.",
             link_label="Register Now", link_url="https://pendaftaran.asia.ac.id/"),
        dict(track="online", title="Upload Documents", description="Upload the required documents in PDF or JPG format.", link_label="", link_url=""),
        dict(track="online", title="Pay the Registration Fee", description="Pay by bank transfer or any of the available payment channels.", link_label="", link_url=""),
        dict(track="online", title="Take the Online Test and Interview", description="The test and interview schedule is emailed once your payment is verified.", link_label="", link_url=""),
        dict(track="online", title="Admission Announcement", description="Check your result directly in your online registration account.", link_label="", link_url=""),
        dict(track="offline", title="Visit the Campus", description="Visit the IBM Malang Asia Institute admissions office during office hours to collect the form.", link_label="", link_url=""),
        dict(track="offline", title="Complete the Form and Submit Documents", description="Fill in the registration form and hand in the required documents in person.", link_label="", link_url=""),
        dict(track="offline", title="Pay at the Campus Cashier", description="Pay the registration fee directly at the campus finance counter.", link_label="", link_url=""),
        dict(track="offline", title="Test and Interview on Campus", description="Attend the test and interview session at the time given by the admissions officer.", link_label="", link_url=""),
        dict(track="offline", title="Admission Announcement", description="Results are communicated by phone, email, or the campus notice board.", link_label="", link_url=""),
    ],
    "admission_documents": [
        dict(document_name=t) for t in [
            "Copy of High School Diploma / Certificate of Graduation",
            "Copy of Report Card / Academic Transcript",
            "Copy of Family Card",
            "Copy of National ID / Student Card",
            "Colour Passport Photos 3x4 (4 copies)",
            "School Recommendation Letter (if available)",
            "Completed Registration Form",
            "Proof of Registration Fee Payment",
        ]
    ],
    "scholarships": [
        dict(label="Subsidy Scholarship", title="IDR 10,000,000 Discount",
             description="Exclusively for graduates of official partner high schools of IBM Malang Asia Institute. The discount is applied directly to first-semester tuition.",
             points=["Open to students from partner schools", "Tuition discount of IDR 10,000,000", "Apply through the school partnership track"]),
        dict(label="Achievement Scholarship", title="Academic & Non-Academic Achievement Track",
             description="For applicants with academic, sports, or arts achievements, supported by certificates or report cards.",
             points=["Report card average above the requirement", "Holds a certificate of championship or achievement", "Passes the scholarship interview stage"]),
        dict(label="Scholarship Pathway 3", title="Details Coming Soon",
             description="Information about the third scholarship pathway will be published here. Edit this card in the scholarships table in Supabase.",
             points=["Eligibility requirement 1", "Eligibility requirement 2"]),
        dict(label="Scholarship Pathway 4", title="Details Coming Soon",
             description="Information about the fourth scholarship pathway will be published here. Edit this card in the scholarships table in Supabase.",
             points=["Eligibility requirement 1", "Eligibility requirement 2"]),
    ],
    "reregistration_fees": [
        dict(period_label="Period 1", fee=0),
        dict(period_label="Period 2", fee=0),
        dict(period_label="Period 3", fee=0),
        dict(period_label="Period 4", fee=0),
    ],
    "gallery_items": (
        [dict(gallery="activities", caption=c, image_url=ph(640, 480, "173671" if i % 2 else "2A52A0", "EBB213" if i % 2 else "FFFFFF", f"Activity {i}"), alt_text=f"Photo of {c}")
         for i, c in enumerate(["New Student Orientation", "Computer Lab Practicum", "Industry Seminar & Workshop",
                                 "Student Organisation Activities", "Class of 2025 Graduation", "Double Degree Exchange",
                                 "Inter-Class Sports Tournament", "Industry Visit"], start=1)]
        + [dict(gallery="facilities", caption=c, image_url=ph(640, 480, "173671" if i % 2 else "2A52A0", "EBB213" if i % 2 else "FFFFFF", f"Facility {i}"), alt_text=f"Photo of {c}")
           for i, c in enumerate(["Air-Conditioned Classrooms", "Computer Laboratory", "Campus Library", "Multipurpose Auditorium",
                                   "Student Discussion Room", "Canteen & Lounge Area", "Campus Prayer Room", "Campus Parking Area"], start=1)]
    ),
}

# Kolom per tabel (urutan INSERT)
COLUMNS = {
    "list_items": ["group_key", "title", "body", "sort_order"],
    "why_items": ["icon", "title", "description", "sort_order"],
    "partners": ["name", "logo_url", "website_url", "is_official", "sort_order"],
    "people": ["kind", "name", "program", "detail", "position", "company", "specialty", "achievements",
               "photo_url", "batch", "is_featured", "sort_order"],
    "testimonials": ["name", "batch", "quote", "photo_url", "sort_order"],
    "footer_links": ["group_no", "label", "url", "sort_order"],
    "buttons": ["group_key", "label", "url", "variant", "sort_order"],
    "news": ["title", "excerpt", "image_url", "published_at", "is_featured", "link_url", "slug", "content"],
    "faqs": ["question", "answer", "sort_order"],
    "curriculum_courses": ["semester", "course_name", "credits", "sort_order"],
    "academic_calendar": ["activity", "start_date", "end_date", "sort_order"],
    "admission_steps": ["track", "title", "description", "link_label", "link_url", "sort_order"],
    "admission_documents": ["document_name", "sort_order"],
    "scholarships": ["label", "title", "description", "points", "sort_order"],
    "reregistration_fees": ["period_label", "fee", "sort_order"],
    "gallery_items": ["gallery", "caption", "image_url", "alt_text", "sort_order"],
}
# Kolom pengelompok untuk penomoran sort_order (10, 20, 30, ...)
GROUP_BY = {
    "list_items": ("group_key",), "people": ("kind", "batch"), "admission_steps": ("track",),
    "curriculum_courses": ("semester",), "gallery_items": ("gallery",), "footer_links": ("group_no",),
    "buttons": ("group_key",),
}

# Migrasi pada database yang SUDAH berisi: tabel/kelompok di bawah diganti dengan data baru
# HANYA bila semua barisnya belum pernah Anda edit (updated_at ≈ created_at).
# (tabel, SQL pembatas kelompok, filter Python untuk baris yang masuk kelompok itu)
REPLACE_SCOPES = [
    ("list_items", "group_key = 'home.hero_stats'", lambda r: r["group_key"] == "home.hero_stats"),
    ("list_items", "group_key = 'home.double_degree'", lambda r: r["group_key"] == "home.double_degree"),
    ("list_items", "group_key = 'about.glimpse_facts'", lambda r: r["group_key"] == "about.glimpse_facts"),
    ("partners", "true", None),
    ("people", "kind = 'lecturer'", lambda r: r["kind"] == "lecturer"),
    ("people", "kind = 'student'", lambda r: r["kind"] == "student"),
    ("news", "true", None),
    ("curriculum_courses", "true", None),
    ("academic_calendar", "true", None),
    ("admission_steps", "true", None),
    ("admission_documents", "true", None),
    ("scholarships", "true", None),
    ("gallery_items", "true", None),
]
# Tabel/kelompok yang hanya diisi bila masih kosong
INSERT_IF_EMPTY = [
    ("list_items", "group_key = 'global.opening_hours'", lambda r: r["group_key"] == "global.opening_hours"),
    ("testimonials", "true", None),
    ("footer_links", "true", None),
    ("buttons", "true", None),
    ("reregistration_fees", "true", None),
]

# Koleksi di website (nama di cms.js) → (tabel, filter, urutan, limit)
VIEWS = {
    "hero_stats": ("list_items", lambda r: r["group_key"] == "home.hero_stats", "sort", None),
    "double_degree_points": ("list_items", lambda r: r["group_key"] == "home.double_degree", "sort", None),
    "glimpse_facts": ("list_items", lambda r: r["group_key"] == "about.glimpse_facts", "sort", None),
    "opening_hours": ("list_items", lambda r: r["group_key"] == "global.opening_hours", "sort", None),
    "why_items": ("why_items", None, "sort", None),
    "partners": ("partners", None, "partners", None),
    "home_lecturers": ("people", lambda r: r["kind"] == "lecturer" and r["is_featured"], "sort", 24),
    "lecturers": ("people", lambda r: r["kind"] == "lecturer", "sort", None),
    "students": ("people", lambda r: r["kind"] == "student", "students", None),
    "testimonials": ("testimonials", None, "sort", None),
    "footer_links": ("footer_links", None, "footer", None),
    "simaka_buttons": ("buttons", lambda r: r["group_key"] == "home.simaka", "sort", None),
    "scholarship_registration_buttons": ("buttons", lambda r: r["group_key"] == "admission.scholarship_registration", "sort", None),
    "scholarship_test_buttons": ("buttons", lambda r: r["group_key"] == "admission.scholarship_test", "sort", None),
    "home_news": ("news", None, "news", 4),
    "news_all": ("news", None, "date", 60),
    "news_related": ("news", None, "date", 5),
    "faqs": ("faqs", None, "sort", None),
    "curriculum": ("curriculum_courses", None, "curriculum", None),
    "calendar": ("academic_calendar", None, "sort", None),
    "steps_online": ("admission_steps", lambda r: r["track"] == "online", "sort", None),
    "steps_offline": ("admission_steps", lambda r: r["track"] == "offline", "sort", None),
    "documents": ("admission_documents", None, "sort", None),
    "scholarships": ("scholarships", None, "sort", None),
    "reregistration": ("reregistration_fees", None, "sort", None),
    "gallery_activities": ("gallery_items", lambda r: r["gallery"] == "activities", "sort", None),
    "gallery_facilities": ("gallery_items", lambda r: r["gallery"] == "facilities", "sort", None),
}

# --------------------------------------------------------------------------
# 3. EKSTRAKSI DARI HTML & JAVASCRIPT
# --------------------------------------------------------------------------
PAGE_FILES = ["index.html", "about.html", "admission.html", "profile-lecturers.html",
              "profile-students.html", "gallery-activities.html", "gallery-facilities.html", "news.html", "news-detail.html", "404.html"]

PAGE_LABELS = {
    "global": "Global (all pages)", "home": "Home", "about": "About IBM", "admission": "Admission",
    "lecturers": "Lecturer Profiles", "students": "Student Profiles",
    "news": "News", "news_detail": "News Detail", "gallery_activities": "Activities Gallery",
    "gallery_facilities": "Facilities Gallery", "notfound": "404 Page",
}
NAME_LABELS = {
    "title": "Title", "description": "Description", "eyebrow": "Small text above the title", "tag": "Label",
    "cta": "Button text", "cta_url": "Button link", "cta_primary": "Primary button (text)",
    "cta_primary_url": "Primary button (link)", "cta_secondary": "Secondary button (text)",
    "cta_secondary_url": "Secondary button (link)", "image": "Image", "note": "Note",
    "more_label": "'View all' link text", "more_url": "'View all' link", "badge_mark": "Badge letter",
    "badge_text": "Badge text", "paragraph_1": "Paragraph 1", "paragraph_2": "Paragraph 2",
    "partner_logo": "Partner logo", "countdown_target": "Countdown end date/time (e.g. 2026-12-31T23:59:00+07:00)",
    "whatsapp_template": "WhatsApp message template ({name}, {school}, {message})",
    "map_url": "Google Maps embed URL (https://www.google.com/maps/embed?pb=...)",
}


def humanize(key):
    parts = key.split(".")
    page = PAGE_LABELS.get(parts[0], parts[0])
    middle = [p.replace("_", " ").capitalize() for p in parts[1:-1]]
    last = NAME_LABELS.get(parts[-1], parts[-1].replace("_", " ").capitalize())
    return " › ".join([page] + middle + [last])


def norm_text(el):
    classes = el.get("class") or []
    text = el.get_text()
    if "pre-line" in classes:
        return "\n".join(line.strip() for line in text.strip().splitlines())
    return re.sub(r"\s+", " ", text).strip()


def inner_html(el):
    html = "".join(str(c) for c in el.contents)
    return re.sub(r"\s+", " ", html).strip()


def parse_page(html, fname, put):
    soup = BeautifulSoup(html, "html.parser")
    for el in soup.find_all(attrs={"data-cms": True}):
        kind = "richtext" if el.get("data-cms-kind") == "richtext" else "text"
        value = inner_html(el) if kind == "richtext" else norm_text(el)
        put(el["data-cms"], kind, value, None, fname)
    for el in soup.find_all(attrs={"data-cms-src": True}):
        put(el["data-cms-src"], "image", el.get("src", ""), el.get("alt"), fname)
    for el in soup.find_all(attrs={"data-cms-href": True}):
        href = el.get("href", "")
        put(el["data-cms-href"], "link", "" if href in ("#", None) else href, None, fname)
    for el in soup.find_all(attrs={"data-cms-content": True}):
        put(el["data-cms-content"], "text", el.get("content", ""), None, fname)
    for el in soup.find_all(attrs={"data-cms-placeholder": True}):
        put(el["data-cms-placeholder"], "text", el.get("placeholder", ""), None, fname)


def layout_snippets():
    """Strip 'IBM News' & 'Our Partners' disisipkan oleh layout.js sebagai string HTML — ambil data-cms di dalamnya."""
    text = (ROOT / "assets" / "js" / "layout.js").read_text(encoding="utf-8")
    a = text.index("var NEWS_STRIP =")
    b = text.index("injectShared()", a)
    chunk = text[a:b]
    literals = re.findall(r"'((?:[^'\\]|\\.)*)'", chunk)
    return "".join(x.replace("\\'", "'") for x in literals)


def extract_html():
    rows = {}   # key -> dict(kind, value, alt)
    warnings = []

    def put(key, kind, value, alt=None, src=""):
        if key.startswith("global.") and any(g[0] == key for g in GLOBAL):
            return  # nilai global ditentukan di GLOBAL
        if key in rows:
            if rows[key]["value"] != value:
                warnings.append(f"Default-value conflict for '{key}' ({src}): {rows[key]['value']!r} != {value!r}")
            return
        rows[key] = dict(kind=kind, value=value, alt=alt)

    for fname in PAGE_FILES:
        parse_page((ROOT / fname).read_text(encoding="utf-8"), fname, put)
    parse_page(layout_snippets(), "layout.js", put)
    return rows, warnings


def old_html_defaults():
    """Teks bawaan versi SEBELUM redesain (git HEAD) — dipakai untuk memperbarui baris DB yang belum diedit."""
    old = {}

    def put(key, kind, value, alt=None, src=""):
        old.setdefault(key, value)

    for fname in PAGE_FILES:
        try:
            html = subprocess.run(["git", "show", f"HEAD:{fname}"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
        except Exception:
            continue
        parse_page(html, fname, put)
    return old


def scan_js_keys():
    """Ambil semua pasangan t('kunci', 'teks bawaan') dari JavaScript supaya teks tersebut bisa diedit di DB."""
    found = {}
    pat = re.compile(r"""\bt\(\s*'([a-z0-9_.]+)'\s*,\s*('(?:[^'\\]|\\.)*')""")
    for fn in JS_FILES:
        text = (ROOT / "assets" / "js" / fn).read_text(encoding="utf-8")
        for m in pat.finditer(text):
            key, raw = m.group(1), m.group(2)[1:-1].replace("\\'", "'")
            found.setdefault(key, raw)
    return found


def merged_content():
    """Gabungan: GLOBAL + HTML + teks di JavaScript. Mengembalikan (daftar baris, peringatan)."""
    html_rows, warnings = extract_html()
    out = [dict(key=k, kind=kind, value=v, alt=alt) for k, kind, v, alt in GLOBAL]
    have = {r["key"] for r in out}
    for k, r in html_rows.items():
        if k not in have:
            out.append(dict(key=k, kind=r["kind"], value=r["value"], alt=r["alt"]))
            have.add(k)
    for k, v in scan_js_keys().items():
        if k in have or k.endswith("_title") and k.startswith("global.footer.group_"):
            continue
        kind = "link" if (k in JS_LINK_KEYS or k.endswith(".url")) else "text"
        out.append(dict(key=k, kind=kind, value=v, alt=None))
        have.add(k)
    return out, warnings


# --------------------------------------------------------------------------
# 4. PEMBUAT OUTPUT
# --------------------------------------------------------------------------
def q(v):
    """Literal SQL."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (list, dict)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def number_rows():
    """Beri sort_order 10, 20, 30... per kelompok. Mengembalikan salinan tabel."""
    out = {}
    for table, rows in TABLES.items():
        counters = {}
        new = []
        gkeys = GROUP_BY.get(table, ())
        for r in rows:
            r = dict(r)
            g = tuple(r.get(k) for k in gkeys) if gkeys else "_"
            counters[g] = counters.get(g, 0) + 10
            r["sort_order"] = counters[g]
            r["id"] = len(new) + 1          # hanya untuk data cadangan (pop-up profil memerlukan id)
            new.append(r)
        out[table] = new
    return out


def insert_stmt(table, rows, indent="    "):
    cols = COLUMNS[table]
    body = ",\n".join(indent + "  (" + ", ".join(q(r[c]) for c in cols) + ")" for r in rows)
    return f"{indent}insert into public.{table} ({', '.join(cols)}) values\n{body};"


def content_insert_sql(content):
    vals = [f"  ({q(r['key'])}, {q(r['kind'])}, {q(r['value'])}, {q(r['alt'])}, {q(humanize(r['key']))})" for r in content]
    return ("insert into public.site_content (content_key, kind, value, alt_text, label) values\n"
            + ",\n".join(vals) + "\non conflict (content_key) do nothing;\n")


def build_sql(content, tables):
    L = []
    L.append("-- =====================================================================")
    L.append("-- seed.sql — INITIAL DATA for the IBM Malang Asia Institute website")
    L.append("-- GENERATED by tools/build_seed.py — do not edit by hand.")
    L.append("-- Safe to re-run: tables that already contain rows are never overwritten or duplicated,")
    L.append("-- and site_content uses 'on conflict do nothing', so your edits stay intact.")
    L.append("-- Run AFTER schema.sql.")
    L.append("-- =====================================================================\n")
    L.append(content_insert_sql(content))
    for table in COLUMNS:
        L.append(f"do $seed$ begin\n  if not exists (select 1 from public.{table}) then")
        L.append(insert_stmt(table, tables[table]))
        L.append("  end if;\nend $seed$;\n")
    return "\n".join(L)


def build_migration(content, tables, new_html, old_html):
    ddl = (ROOT / "tools" / "migration_ddl.sql").read_text(encoding="utf-8")
    L = []
    L.append("-- =====================================================================")
    L.append("-- migration-2026-10-redesign.sql")
    L.append("-- Upgrades an EXISTING database to the redesigned website (carousels, lecturer pop-up,")
    L.append("-- student batches, 3-column footer, testimonials, scholarship countdown, visitor form,")
    L.append("-- re-registration fees, action buttons).")
    L.append("-- GENERATED by tools/build_seed.py — do not edit by hand.")
    L.append("--")
    L.append("-- NON-DESTRUCTIVE POLICY")
    L.append("--   • New columns/tables are only ADDED (existing columns are never dropped).")
    L.append("--   • site_content: new keys are inserted; existing keys keep your text. Only keys whose")
    L.append("--     value still equals the ORIGINAL default are refreshed to the new English default.")
    L.append("--   • List tables are replaced with the new sample data ONLY IF none of their rows has")
    L.append("--     ever been edited. Edited tables (e.g. FAQs, Why IBM Asia) are left untouched.")
    L.append("-- Safe to run more than once.")
    L.append("-- =====================================================================\n")
    L.append(ddl.strip() + "\n")

    L.append("-- ---------- Content keys: add new ones ----------")
    L.append(content_insert_sql(content))

    L.append("-- ---------- Content keys: refresh values that still equal the original default ----------")
    for k in sorted(new_html):
        if k in old_html and old_html[k] != new_html[k]["value"] and not k.startswith("global."):
            L.append(f"update public.site_content set value = {q(new_html[k]['value'])} where content_key = {q(k)} and value = {q(old_html[k])};")
    for k, old in STALE_VALUES.items():
        if k in new_html:
            L.append(f"update public.site_content set value = {q(new_html[k]['value'])} where content_key = {q(k)} and value = {q(old)};")
    L.append("")
    L.append("-- ---------- Brand naming: one consistent English name across all texts ----------")
    L.append("update public.site_content set value = replace(value, 'IBM Institut Asia Malang', 'IBM Malang Asia Institute')")
    L.append("  where kind in ('text', 'richtext') and value like '%IBM Institut Asia Malang%' and content_key not like 'global.brand.%';")
    L.append("update public.site_content set value = replace(value, 'Institut Asia Malang', 'IBM Malang Asia Institute')")
    L.append("  where kind in ('text', 'richtext') and value like '%Institut Asia Malang%' and content_key not like 'global.brand.%';")
    L.append("update public.site_content set value = replace(value, 'IBM Institut Asia', 'IBM Asia')")
    L.append("  where kind in ('text', 'richtext') and value like '%IBM Institut Asia%' and content_key not like 'global.brand.%';")
    L.append("update public.site_content set value = replace(value, 'Logo IBM Malang Asia Institute', 'IBM Malang Asia Institute logo')")
    L.append("  where content_key = 'global.brand.logo_alt';\n")

    L.append("-- ---------- List data: replace untouched sample rows ----------")
    for table, scope, flt in REPLACE_SCOPES:
        rows = [r for r in tables[table] if flt is None or flt(r)]
        L.append(f"do $m$ begin\n  if not exists (select 1 from public.{table} where ({scope}) and updated_at > created_at + interval '1 minute') then")
        L.append(f"    delete from public.{table} where {scope};")
        L.append(insert_stmt(table, rows))
        L.append("  end if;\nend $m$;\n")

    L.append("-- ---------- New list tables: seed only when empty ----------")
    for table, scope, flt in INSERT_IF_EMPTY:
        rows = [r for r in tables[table] if flt is None or flt(r)]
        L.append(f"do $m$ begin\n  if not exists (select 1 from public.{table} where {scope}) then")
        L.append(insert_stmt(table, rows))
        L.append("  end if;\nend $m$;\n")

    L.append("-- ---------- Official partner logo: reuse the Trent logo already set on the About page ----------")
    L.append("update public.partners p set logo_url = c.value")
    L.append("  from public.site_content c")
    L.append("  where c.content_key = 'about.glimpse.partner_logo' and c.value <> '' and p.is_official and p.name = 'Trent Global College'")
    L.append("    and p.logo_url like 'https://placehold.co/%';\n")
    return "\n".join(L)


def build_fallback(content, tables):
    content_rows = [dict(content_key=r["key"], kind=r["kind"], value=r["value"], alt_text=r["alt"]) for r in content]
    collections = {}
    for name, (table, flt, order, limit) in VIEWS.items():
        rows = [dict(r, is_published=True) for r in tables[table] if (flt is None or flt(r))]
        if order == "sort":
            rows.sort(key=lambda r: r["sort_order"])
        elif order == "partners":
            rows.sort(key=lambda r: (not r["is_official"], r["sort_order"]))
        elif order == "students":
            rows.sort(key=lambda r: (r["batch"] or 0, r["sort_order"]))
        elif order == "footer":
            rows.sort(key=lambda r: (r["group_no"], r["sort_order"]))
        elif order == "curriculum":
            rows.sort(key=lambda r: (r["semester"], r["sort_order"]))
        elif order in ("date",):
            rows.sort(key=lambda r: r["published_at"], reverse=True)
        elif order == "news":
            rows.sort(key=lambda r: r["published_at"], reverse=True)
            rows.sort(key=lambda r: not r["is_featured"])
        if limit:
            rows = rows[:limit]
        if table == "news":
            for r in rows:
                r["has_content"] = bool(r["content"].strip())
                if name != "news_all":      # daftar lain tidak memuat isi artikel (hemat ukuran)
                    r.pop("content", None)
        collections[name] = rows
    payload = json.dumps(dict(content=content_rows, collections=collections), ensure_ascii=False, indent=1)
    return ("/* GENERATED by tools/build_seed.py — do not edit by hand.\n"
            "   Fallback data: shown when Supabase is not configured or unreachable. */\n"
            "window.IBM_FALLBACK = " + payload + ";\n")


def main():
    content, warnings = merged_content()
    html_rows, _ = extract_html()
    tables = number_rows()
    (ROOT / "supabase" / "seed.sql").write_text(build_sql(content, tables), encoding="utf-8")
    (ROOT / "supabase" / "migration-2026-10-redesign.sql").write_text(
        build_migration(content, tables, html_rows, old_html_defaults()), encoding="utf-8")
    (ROOT / "assets" / "js" / "fallback-data.js").write_text(build_fallback(content, tables), encoding="utf-8")
    print(f"site_content : {len(content)} keys (GLOBAL + HTML + JavaScript)")
    for t, rows in tables.items():
        print(f"{t:22s}: {len(rows)} rows")
    for w in warnings:
        print("WARNING:", w)
    if warnings:
        sys.exit(1)


if __name__ == "__main__":
    main()
