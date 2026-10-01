// The university site's content — menus, notices, fees, certificates — with
// every date worked out from today, so "closes in three days" is true on the
// page and in the prompt on whatever day someone tries it.

import { addDays, MONTHS } from './util'

export type Menu = { title: string; groups: { head: string; links: string[] }[] }

export const MENUS: Menu[] = [
  { title: 'About', groups: [
    { head: 'The Institute', links: ['About Meridian', 'Vision & Mission', 'History', 'Institution of Eminence', 'Rankings & Accreditation', 'Annual Reports'] },
    { head: 'Leadership', links: ['Chancellor', 'Vice Chancellor', 'Pro Vice Chancellor', 'Registrar', 'Deans of Faculties', 'Controller of Examinations'] },
    { head: 'Statutory Bodies', links: ['Executive Council', 'Academic Council', 'Finance Committee', 'Court'] },
  ] },
  { title: 'Academics', groups: [
    { head: 'Programmes', links: ['Undergraduate Programmes', 'Postgraduate Programmes', 'Ph.D. Programmes', 'Diploma & Certificate Courses', 'Online Programmes'] },
    { head: 'Academic Resources', links: ['Academic Calendar', 'Syllabus & Curriculum', 'Ordinances', 'NEP 2020 Implementation', 'Credit Transfer (ABC)', 'Timetables'] },
    { head: 'Faculties', links: ['Faculty of Technology', 'Faculty of Management', 'Faculty of Design', 'Faculty of Sciences', 'Faculty of Humanities'] },
  ] },
  { title: 'Examinations', groups: [
    { head: 'Examination Branch', links: ['About Examination Branch', 'Notifications & Circulars', 'Date Sheets', 'Results', 'Admit Cards'] },
    { head: 'Services', links: ['Degree Verification', 'Transcripts', 'Duplicate Marksheet', 'Migration Certificate', 'Examination Fee Structure'] },
    { head: 'Contacts', links: ['Controller of Examinations', 'Examination Helpline', 'Grievance Cell (Exams)'] },
  ] },
  { title: 'Students', groups: [
    { head: 'Student Services', links: ['Fee Payment', 'Certificates & Documents', 'Scholarships', 'Hostel Allotment', 'Student Grievance Redressal', 'Anti-Ragging'] },
    { head: 'Student Life', links: ['Clubs & Societies', 'Sports', 'NSS / NCC', 'Counselling Centre', 'Health Centre'] },
    { head: 'Portals', links: ['Student Login', 'LMS', 'Library Account', 'Email Services'] },
  ] },
  { title: 'Admissions', groups: [
    { head: 'Admissions 2026-27', links: ['UG Admissions', 'PG Admissions', 'Ph.D. Admissions', 'International Students', 'Fee Structure 2026-27 (New Admissions)', 'Admission FAQs'] },
    { head: 'Important', links: ['Prospectus / Bulletin of Information', 'Seat Matrix', 'Reservation Policy', 'Admission Helpline'] },
  ] },
  { title: 'Research', groups: [
    { head: 'Research', links: ['Research Centres', 'Funded Projects', 'Patents', 'Publications', 'Research Policy', 'Ethics Committee'] },
    { head: 'Innovation', links: ['Incubation Centre', 'Technology Transfer', 'Startups'] },
  ] },
  { title: 'Libraries', groups: [
    { head: 'Central Library', links: ['About Library', 'OPAC', 'E-Resources', 'Institutional Repository', 'Library Rules', 'Timings'] },
  ] },
  { title: 'Campus Life', groups: [
    { head: 'Campus', links: ['Hostels', 'Cafeteria', 'Transport', 'Sports Complex', 'Auditorium', 'Campus Map'] },
    { head: 'Culture', links: ['Annual Fest — Meridia', 'Tech Fest', 'Cultural Societies'] },
  ] },
  { title: 'Administration', groups: [
    { head: 'Offices', links: ['Registrar Office', 'Finance Office', 'Estate Office', 'Recruitment Cell', 'Right to Information (RTI)', 'Internal Complaints Committee'] },
    { head: 'Notices', links: ['Tenders', 'Recruitment Notices', 'Office Orders'] },
  ] },
  { title: 'Alumni', groups: [
    { head: 'Alumni', links: ['Alumni Association', 'Alumni Registration', 'Distinguished Alumni', 'Give Back'] },
  ] },
  { title: 'News & Events', groups: [
    { head: 'Media', links: ['News', 'Events', 'Press Releases', 'Photo Gallery', 'Newsletter', 'Meridian in Media'] },
  ] },
]

export const UTILITY = ['Institution of Eminence', 'Student Portal', 'Student Grievance Redressal', 'RTI', 'Tenders', 'Careers', 'Contact Us', 'Hindi']

export const PROGRAMMES = [
  'B.Tech Computer Science & Engineering', 'B.Tech Electronics & Communication', 'B.Tech Mechanical Engineering',
  'B.Tech Civil Engineering', 'B.Tech Electrical Engineering', 'B.Tech Information Technology',
  'BBA', 'B.Des', 'B.Sc (Hons) Physics', 'B.Sc (Hons) Mathematics', 'BA (Hons) Economics', 'B.Com (Hons)',
  'M.Tech Computer Science', 'M.Tech VLSI Design', 'MBA', 'M.Des', 'M.Sc Data Science', 'MA English',
]

export const SEMESTERS = ['Semester I', 'Semester II', 'Semester III', 'Semester IV', 'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII']

const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
const words = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`

export type Notice = { date: Date; title: string; category: string; isNew?: boolean; pdf?: boolean }

/** The dates everything else hangs off. */
export function keyDates(today: Date) {
  return {
    resultsDeclared: addDays(today, -4),
    revalCloses: addDays(today, 2),
    feeOpens: addDays(today, -6),
    feeCloses: addDays(today, 29),
    lateFrom: addDays(today, 30),
    examRegCloses: addDays(today, 12),
  }
}

/* Forty notices, newest first, fifteen to a page. The re-evaluation form is a
   "Forms" row sitting on page two, under a result notice that does not mention
   it — which is exactly where students stop looking. */
export function examNotices(today: Date): Notice[] {
  const k = keyDates(today)
  const fixed: Notice[] = [
    { date: addDays(today, -1), title: 'Date Sheet — End Semester Examinations (Nov-Dec 2026), All UG Programmes (Tentative)', category: 'Date Sheet', isNew: true, pdf: true },
    { date: addDays(today, -2), title: 'Notice regarding submission of Examination Forms for Nov-Dec 2026 — last date ' + fmt(k.examRegCloses), category: 'Circular', isNew: true, pdf: true },
    { date: addDays(today, -3), title: 'Result — M.Tech Computer Science, Semester II (May-June 2026)', category: 'Result', isNew: true, pdf: true },
    { date: k.resultsDeclared, title: 'Result — B.Tech (All Branches), Semester V (May-June 2026)', category: 'Result', isNew: true, pdf: true },
    { date: k.resultsDeclared, title: 'Result — BBA, Semester V (May-June 2026)', category: 'Result', pdf: true },
    { date: addDays(today, -5), title: 'Instructions to candidates regarding use of unfair means', category: 'Circular', pdf: true },
    { date: addDays(today, -6), title: 'Result — B.Des, Semester IV (May-June 2026)', category: 'Result', pdf: true },
    { date: addDays(today, -7), title: 'Revised Date Sheet — Supplementary Examinations (Sep 2026)', category: 'Date Sheet', pdf: true },
    { date: addDays(today, -8), title: 'Notification — Special Examination for Sports Participants', category: 'Circular', pdf: true },
    { date: addDays(today, -9), title: 'Result — B.Sc (Hons) Physics, Semester VI (May-June 2026)', category: 'Result', pdf: true },
    { date: addDays(today, -10), title: 'Guidelines for Evaluation of Internal Assessment (2026-27)', category: 'Circular', pdf: true },
    { date: addDays(today, -11), title: 'Admit Card Download Instructions — Supplementary Examinations', category: 'Circular', pdf: true },
    { date: addDays(today, -12), title: 'Result — MBA, Semester II (May-June 2026)', category: 'Result', pdf: true },
    { date: addDays(today, -13), title: 'Examination Fee Structure (2026-27)', category: 'Forms', pdf: true },
    { date: addDays(today, -14), title: 'Result — B.Com (Hons), Semester IV (May-June 2026)', category: 'Result', pdf: true },
    { date: addDays(today, -3), title: `Re-evaluation of Answer Scripts — Semester V (May-June 2026): Application Form & Instructions (last date ${fmt(k.revalCloses)})`, category: 'Forms', pdf: true },
    { date: addDays(today, -15), title: 'Backlog / Supplementary Examination Form (All Semesters)', category: 'Forms', pdf: true },
    { date: addDays(today, -16), title: 'Transcript Request Form', category: 'Forms', pdf: true },
    { date: addDays(today, -17), title: 'Photocopy of Answer Script — Application Form', category: 'Forms', pdf: true },
  ]
  const filler: Notice[] = []
  const kinds = ['Result', 'Date Sheet', 'Circular']
  for (let i = 0; filler.length + fixed.length < 42; i++) {
    const p = PROGRAMMES[(i * 5) % PROGRAMMES.length]!
    const s = SEMESTERS[(i * 3) % 8]!
    const kind = kinds[i % 3]!
    filler.push({
      date: addDays(today, -18 - i),
      title: kind === 'Result' ? `Result — ${p}, ${s} (Dec 2025)` : kind === 'Date Sheet' ? `Date Sheet — ${p}, ${s} Practical Examinations` : `Circular No. EX/${2026}/${140 - i} regarding ${['re-appear candidates', 'change of examination centre', 'scribe facility', 'grace marks policy', 'moderation of results'][i % 5]}`,
      category: kind,
      pdf: true,
    })
  }
  // Listed in the order the CMS was fed, not strictly by date — which is how
  // the re-evaluation form ends up as the first row of page two.
  return [...fixed, ...filler]
}

export const NOTICE_CATEGORIES = ['All', 'Circular', 'Date Sheet', 'Result', 'Forms']

export const HOME_TABS: Record<string, string[]> = {
  Notices: [
    'Semester V results declared — see Examinations › Results',
    'Fee payment for the odd semester is open — see Students › Fee Payment',
    'Notice regarding Hindi Pakhwada celebrations',
    'Library will remain open till 10 PM during examinations',
    'Campus will remain closed on account of Gandhi Jayanti',
    'Registration for Annual Fest — Meridia 2026',
    'Notice for students regarding ABC ID creation',
    'Walk-in for Teaching Assistants (Faculty of Technology)',
    'Hostel room change requests — last date extended',
    'Blood donation camp at the Health Centre',
  ],
  Circulars: [
    'Circular on attendance requirement (75%) for 2026-27',
    'Circular regarding anti-ragging undertaking',
    'Circular on use of mobile phones in examination halls',
    'Revised academic calendar for odd semester 2026',
    'Circular regarding wearing of ID cards on campus',
    'Circular on NEP credit framework — minors and electives',
  ],
  Admissions: [
    'Admissions 2026-27: Spot round for B.Tech (vacant seats)',
    'PG admissions: second merit list',
    'Ph.D. entrance test — result',
    'International student admissions — document verification',
  ],
  Tenders: [
    'Tender for supply of laboratory equipment (Physics)',
    'Tender for annual maintenance of CCTV systems',
    'Tender for housekeeping services — Hostel Block C',
    'Corrigendum: tender for campus Wi-Fi upgrade',
  ],
  Events: [
    'National Conference on Sustainable Computing',
    'Industry Connect: Placement Preparation Workshop',
    'Guest Lecture: Semiconductors and India\'s next decade',
    'Inter-college debate — Meridian Cup',
  ],
}

export const TICKER = [
  'Semester V results declared',
  'Re-evaluation window closing soon — see Examinations › Notifications & Circulars',
  'Portal maintenance on Sunday, 2 AM to 5 AM',
  'Fee payment for odd semester open',
  'Admissions 2026-27: spot round',
]

export type FeeRow = { head: string; amount: number; note?: string }

export function currentFees(programme: string): FeeRow[] {
  const tech = programme.startsWith('B.Tech')
  const pg = /^M\.|^MBA|^MA/.test(programme)
  const tuition = tech ? 62000 : pg ? 71000 : 38000
  return [
    { head: 'Tuition Fee', amount: tuition },
    { head: 'Examination Fee', amount: tech ? 3500 : 2800 },
    { head: 'Development Fund', amount: tech ? 4500 : 3000 },
    { head: 'Student Activities & Welfare', amount: 1200 },
    { head: 'Hostel & Mess (optional)', amount: 48000, note: 'only for students allotted a hostel seat' },
  ]
}

export function newAdmissionFees(programme: string): FeeRow[] {
  const tech = programme.startsWith('B.Tech')
  return [
    { head: 'Admission Fee (one-time)', amount: 15000 },
    { head: 'Tuition Fee (per semester)', amount: tech ? 68000 : 42000 },
    { head: 'Caution Money (refundable)', amount: 10000 },
    { head: 'Examination Fee', amount: 3500 },
    { head: 'Development Fund', amount: 6000 },
    { head: 'Hostel & Mess (optional)', amount: 52000 },
  ]
}

export const CERTIFICATES = [
  { name: 'Bonafide Certificate', days: '3 working days', fee: 100 },
  { name: 'Character Certificate', days: '5 working days', fee: 100 },
  { name: 'Transfer Certificate', days: '10 working days', fee: 500 },
  { name: 'Migration Certificate', days: '15 working days', fee: 750 },
  { name: 'Provisional Degree Certificate', days: '7 working days', fee: 500 },
  { name: 'Duplicate Marksheet', days: '15 working days', fee: 1000 },
  { name: 'Medium of Instruction Certificate', days: '5 working days', fee: 300 },
  { name: 'Course Completion Certificate', days: '5 working days', fee: 200 },
]

export function calendar(today: Date) {
  const k = keyDates(today)
  return [
    { what: 'Commencement of classes (odd semester)', when: fmt(addDays(today, -45)) },
    { what: 'Fee payment window (odd semester)', when: `${fmt(k.feeOpens)} to ${fmt(k.feeCloses)}` },
    { what: 'Late fee (₹1,000) applicable from', when: fmt(k.lateFrom) },
    { what: 'Re-evaluation applications (Semester V)', when: `till ${fmt(k.revalCloses)}` },
    { what: 'Examination form submission', when: `till ${fmt(k.examRegCloses)}` },
    { what: 'Mid-semester break', when: `${fmt(addDays(today, 18))} to ${fmt(addDays(today, 22))}` },
    { what: 'End semester examinations begin', when: fmt(addDays(today, 60)) },
    { what: 'Winter vacation', when: `${fmt(addDays(today, 90))} to ${fmt(addDays(today, 104))}` },
  ]
}

/* ---------- for the prompt ---------- */

export function datesForPrompt(today: Date): string {
  const k = keyDates(today)
  return [
    `Semester V results declared ${words(k.resultsDeclared)}.`,
    `Re-evaluation for semester V closes ${words(k.revalCloses)} — that is in two days.`,
    `Fee window ${words(k.feeOpens)} to ${words(k.feeCloses)}; late fee of one thousand from ${words(k.lateFrom)}; online only.`,
    `Examination forms for Nov-Dec close ${words(k.examRegCloses)}.`,
  ].join('\n')
}
