"""Deck B5 — Executive / Stakeholder Pitch (≈10 slides)."""
D = 'docs/diagrams/'
S = 'docs/screenshots/'

SLIDES = [
    dict(kind='title', title='Amaranth v2', subtitle='A modern newsroom and live sports-results platform for VSU’s official student publication', kicker='AMARANTH · FOR STAKEHOLDERS', meta='Version 1.0 · 2026-10-19 · [TO CONFIRM: audience and date]',
         notes='This short presentation is for the administration and other stakeholders. It explains what Amaranth version 2 delivers, why it matters, what it costs and what we need next.'),
    dict(kind='bullets', title='Why it matters', bullets=['The publication now runs its whole editorial process online', 'Readers get fast, accessible news on their phones', 'Salingkusog results are live and official', 'Built for accountability and privacy'],
         notes='Amaranth now runs its whole editorial process in one system with clear responsibilities. Students and the community get fast, accessible news on their phones. Salingkusog results are live and computed automatically, and the system was designed with accountability and data privacy in mind.'),
    dict(kind='stats', title='What was delivered', stats=[('12', 'site sections with their own layouts'), ('7', 'staff roles enforced by the database'), ('74', 'Salingkusog 2026 events set up'), ('100', 'accessibility score (Lighthouse)')], cols=4,
         notes='Concretely: twelve site sections each with its own layout, seven staff roles whose permissions are enforced by the database, seventy-four Salingkusog events already configured for the 2026 games, and an accessibility score of one hundred.'),
    dict(kind='split', title='For readers', bullets=['News, features, literary, opinion, sports', 'Search and archives', 'Submit stories and report events', 'Follow Salingkusog live'], image=S + 'pub-home-mobile.png', left_w=640,
         notes='Readers get a modern news site that works well on phones, with search and archives, safe forms to submit stories and report events, and live Salingkusog results.'),
    dict(kind='bullets', title='For the newsroom', bullets=['Draft → review → publish with notes and history', 'Only authorised people publish — audited', 'Media library, moderation, statistics', 'Staff trained with manuals'],
         notes='For the newsroom, every article follows a clear review path with notes and history, only authorised people can publish, and every change to access is recorded. Editors have a media library, moderation tools and privacy-friendly statistics.'),
    dict(kind='split', title='For Salingkusog', bullets=['Brackets fill in automatically', 'Live scores from phones', 'Official medal table, computed', 'Staff confirm every medal'], image=S + 'sk-tally-mobile.png', left_w=640,
         notes='For the intramural games, brackets fill themselves in, scores come live from scorekeepers’ phones, and the medal table is computed by the system. Every medal is confirmed by a person before it counts, which protects the official result.'),
    dict(kind='table', title='Costs and resources', rows=[['Item', 'Cost'], ['Hosting (Vercel) and database (Supabase)', '[TO CONFIRM plan]'], ['CAPTCHA (Cloudflare Turnstile)', 'Free'], ['Software libraries', 'Open source, free'], ['Domain', '[TO CONFIRM]'], ['People', 'Student developers, editorial board, adviser']],
         col_widths=[1.3, 1], notes='The system runs on managed cloud services with free or low-cost tiers, and all libraries are open source. Exact plan costs and the domain are to be confirmed. The main resource is people: student developers, the editorial board and the adviser.'),
    dict(kind='bullets', title='Risks and safeguards', bullets=['Permissions enforced by the database', 'Automated tests: 255 + 278 checks passing', 'Backups and a runbook for incidents', 'Privacy: minimal athlete data, no reader tracking cookies'],
         notes='Risks are managed: permissions are enforced by the database, more than five hundred automated checks pass, there is a runbook for backups and incidents, and data privacy is respected by collecting only minimal athlete data and using no tracking cookies.'),
    dict(kind='table', title='Next steps — what we need', rows=[['Step', 'Owner'], ['Privacy notice for athletes; photo consent process', 'Editorial board, organisers'], ['Two-factor sign-in for administrators', 'Technical lead'], ['Confirm hosting plan, domain and backups', 'Administration'], ['Continuous testing pipeline', 'Technical lead'], ['Handover to next year’s staff', 'Adviser']],
         col_widths=[1.5, 1], notes='We ask for support on five next steps: a privacy notice and consent process for athletes, two-factor sign-in for administrators, a confirmed hosting plan and backups, a continuous testing pipeline, and a handover plan so next year’s staff can maintain the system.'),
    dict(kind='closing', title='Thank you', subtitle='Amaranth v2 — ready for Salingkusog 2026 and beyond.\nQuestions and support?',
         notes='Thank you. Amaranth version 2 is ready for the Salingkusog 2026 games and for the years ahead. We welcome your questions and your support for the next steps.'),
]
