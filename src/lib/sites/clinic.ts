// The hospital booking portal's data — states, hospitals, departments and the
// OPD calendar. Shared with the prompt so the desk knows the calendar the page
// is showing, for whatever today happens to be.

import { addDays, DAYS, hash, MONTHS } from './util'

export const STATES = [
  'Andaman & Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra & Nagar Haveli', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

const DELHI_PLACES = [
  'Shastri Nagar', 'Shastri Park', 'Civil Lines', 'Patparganj', 'Dakshinpuri', 'Sagarpur West', 'Rajapuri',
  'Ghitorni', 'Janakpuri', 'Rohini Sector 7', 'Dwarka Sector 10', 'Mayur Vihar Phase 1', 'Lajpat Nagar',
  'Karol Bagh', 'Shahdara', 'Narela', 'Mangolpuri', 'Jahangirpuri', 'Malviya Nagar', 'Kalkaji', 'Tilak Nagar',
  'Vasant Kunj', 'Seelampur', 'Khichripur', 'Babarpur', 'Burari', 'Mehrauli', 'Najafgarh', 'Punjabi Bagh',
  'Moti Nagar', 'Defence Colony', 'Greater Kailash', 'Kirti Nagar', 'Hari Nagar', 'Jaffarpur', 'Bawana',
]
const KINDS = ['Allopathic Dispensary', 'Polyclinic', 'Maternity Home', 'Seed PUHC', 'Urban Health Centre', 'Chest Clinic', 'Hospital']

/* Delhi's list, as long as the real one is. The hospital the desk works for
   is in it once, between two names that look like it. */
export const HOME_HOSPITAL = 'Civil Hospital, Shastri Nagar'

function delhi(): string[] {
  const out = new Set<string>([
    HOME_HOSPITAL,
    'Civil Dispensary, Shastri Park',
    'Civil Lines Polyclinic',
    'Shastri Nagar Maternity Home',
    'Guru Teg Bahadur Hospital',
    'Lok Nayak Hospital',
    'Deen Dayal Upadhyay Hospital',
    'Dr. Ram Manohar Lohia Hospital',
    'Safdarjung Hospital',
    'Sanjay Gandhi Memorial Hospital',
    'Lal Bahadur Shastri Hospital',
    'Rao Tula Ram Memorial Hospital',
    'Acharyashree Bhikshu Govt Hospital',
    'Ambedkar Nagar Hospital, Dakshinpuri',
  ])
  let i = 0
  while (out.size < 96) {
    const place = DELHI_PLACES[i % DELHI_PLACES.length]!
    const kind = KINDS[Math.floor(i / DELHI_PLACES.length) % KINDS.length]!
    out.add(kind === 'Hospital' ? `${place} District Hospital` : `${kind} ${place}`)
    i++
  }
  return [...out].sort((a, b) => a.localeCompare(b))
}

export const HOSPITALS: Record<string, string[]> = {
  Delhi: delhi(),
}
for (const s of STATES) {
  if (HOSPITALS[s]) continue
  const n = 4 + (hash(s) % 9)
  HOSPITALS[s] = Array.from({ length: n }, (_, i) => `${['District Hospital', 'Government Medical College Hospital', 'Civil Hospital', 'Community Health Centre'][i % 4]}, ${s.split(' ')[0]} ${i + 1}`)
}

export const DEPARTMENTS = [
  'Anaesthesiology',
  'Cardiology',
  'Cardiothoracic & Vascular Surgery (CTVS)',
  'Dental Surgery',
  'Dermatology & Venereology',
  'Emergency Medicine (Casualty)',
  'Endocrinology',
  'ENT (Otorhinolaryngology)',
  'Gastroenterology',
  'General Medicine - Unit I',
  'General Medicine - Unit II',
  'General Surgery',
  'Geriatric Medicine',
  'Nephrology',
  'Neurology',
  'Obstetrics & Gynaecology',
  'Ophthalmology',
  'Orthopaedics',
  'Paediatrics',
  'Physical Medicine & Rehabilitation',
  'Psychiatry',
  'Pulmonary Medicine (Chest & TB)',
  'Radiodiagnosis',
  'Urology',
]

/** Which weekdays each department sees outpatients. Sun=0. */
const OPD_DAYS: Record<string, number[]> = {
  Cardiology: [1, 3, 5],
  'Cardiothoracic & Vascular Surgery (CTVS)': [2],
  'General Medicine - Unit I': [1, 2, 3, 4, 5, 6],
  'General Medicine - Unit II': [1, 2, 3, 4, 5, 6],
  'Geriatric Medicine': [2, 4],
  Neurology: [2, 5],
  Orthopaedics: [1, 3, 5],
  'Pulmonary Medicine (Chest & TB)': [1, 4],
  Endocrinology: [3],
  'Emergency Medicine (Casualty)': [],
}
export const opdDays = (dept: string) => OPD_DAYS[dept] ?? [1, 2, 3, 4, 5]

export const WALK_IN_ONLY = 'Emergency Medicine (Casualty)'

export const SLOT_WINDOWS = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00']

export type DayState = { date: Date; open: boolean; slots: { window: string; left: number }[] }

/* The calendar. The nearest cardiology day is full — that is the day
   everybody tries — and the one after has a handful left, mostly early. */
export function dayState(dept: string, today: Date, offset: number): DayState {
  const date = addDays(today, offset)
  const open = offset >= 1 && opdDays(dept).includes(date.getDay())
  if (!open) return { date, open, slots: [] }

  const nth = (() => {
    let k = 0
    for (let i = 1; i <= offset; i++) if (opdDays(dept).includes(addDays(today, i).getDay())) k++
    return k
  })()

  const slots = SLOT_WINDOWS.map((window, i) => {
    let left = hash(`${dept}${date.toDateString()}${window}`) % 14
    if (nth === 1) left = 0
    if (nth === 2) left = [3, 1, 0, 0, 2][i]!
    if (i === 4 && nth > 2) left = Math.min(left, 4)
    return { window, left }
  })
  return { date, open, slots }
}

export const dayLabel = (d: Date) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`

/* ---------- for the prompt ---------- */

export function opdForPrompt(today: Date): string {
  const lines: string[] = []
  for (const dept of ['Cardiology', 'General Medicine - Unit I', 'Geriatric Medicine', 'Orthopaedics', 'Neurology', 'Pulmonary Medicine (Chest & TB)']) {
    const days: string[] = []
    for (let i = 1; i <= 14 && days.length < 4; i++) {
      const s = dayState(dept, today, i)
      if (!s.open) continue
      const free = s.slots.filter((x) => x.left > 0)
      days.push(
        free.length
          ? `${dayLabel(s.date)}: ${free.map((x) => `${x.window.slice(0, 5)} (${x.left} left)`).join(', ')}`
          : `${dayLabel(s.date)}: FULL`,
      )
    }
    lines.push(`- ${dept}: ${days.join(' | ')}`)
  }
  return lines.join('\n')
}
