// The railway site's data — one source for the page that draws it and the
// prompt that tells the clerk what is on it, so the two cannot disagree.

import { addDays, DAYS, hash, MONTHS } from './util'

export type Station = { name: string; code: string }

/* Real station names and codes. The Delhi and Jaipur look-alikes are the point:
   type "Delhi" into the real site and you get a list of them, and the train you
   wanted arrives at a different one from the one you picked. */
export const STATIONS: Station[] = [
  { name: 'NEW DELHI', code: 'NDLS' },
  { name: 'DELHI', code: 'DLI' },
  { name: 'DELHI SARAI ROHILLA', code: 'DEE' },
  { name: 'HAZRAT NIZAMUDDIN', code: 'NZM' },
  { name: 'ANAND VIHAR TRM', code: 'ANVT' },
  { name: 'DELHI CANTT', code: 'DEC' },
  { name: 'DELHI SHAHDARA', code: 'DSA' },
  { name: 'DELHI KISHANGANJ', code: 'DKZ' },
  { name: 'DELHI AZADPUR', code: 'DAZ' },
  { name: 'JAIPUR', code: 'JP' },
  { name: 'GANDHINAGAR JAIPUR', code: 'GADJ' },
  { name: 'DURGAPURA', code: 'DPA' },
  { name: 'AJMER JN', code: 'AII' },
  { name: 'AGRA CANTT', code: 'AGC' },
  { name: 'AGRA FORT', code: 'AF' },
  { name: 'JODHPUR JN', code: 'JU' },
  { name: 'KOTA JN', code: 'KOTA' },
  { name: 'ALWAR', code: 'AWR' },
  { name: 'REWARI', code: 'RE' },
  { name: 'GURGAON', code: 'GGN' },
  { name: 'MUMBAI CENTRAL', code: 'MMCT' },
  { name: 'CST MUMBAI', code: 'CSMT' },
  { name: 'BANDRA TERMINUS', code: 'BDTS' },
  { name: 'LOKMANYATILAK T', code: 'LTT' },
  { name: 'AHMEDABAD JN', code: 'ADI' },
  { name: 'VADODARA JN', code: 'BRC' },
  { name: 'SURAT', code: 'ST' },
  { name: 'LUCKNOW NR', code: 'LKO' },
  { name: 'LUCKNOW NE', code: 'LJN' },
  { name: 'KANPUR CENTRAL', code: 'CNB' },
  { name: 'PRAYAGRAJ JN', code: 'PRYJ' },
  { name: 'VARANASI JN', code: 'BSB' },
  { name: 'PATNA JN', code: 'PNBE' },
  { name: 'HOWRAH JN', code: 'HWH' },
  { name: 'SEALDAH', code: 'SDAH' },
  { name: 'BHOPAL JN', code: 'BPL' },
  { name: 'JABALPUR', code: 'JBP' },
  { name: 'GWALIOR JN', code: 'GWL' },
  { name: 'JHANSI JN', code: 'VGLJ' },
  { name: 'CHANDIGARH', code: 'CDG' },
  { name: 'AMRITSAR JN', code: 'ASR' },
  { name: 'LUDHIANA JN', code: 'LDH' },
  { name: 'JAMMU TAWI', code: 'JAT' },
  { name: 'DEHRADUN', code: 'DDN' },
  { name: 'HARIDWAR JN', code: 'HW' },
  { name: 'MGR CHENNAI CTL', code: 'MAS' },
  { name: 'KSR BENGALURU', code: 'SBC' },
  { name: 'SECUNDERABAD JN', code: 'SC' },
  { name: 'PUNE JN', code: 'PUNE' },
  { name: 'NAGPUR', code: 'NGP' },
  { name: 'UDAIPUR CITY', code: 'UDZ' },
  { name: 'BIKANER JN', code: 'BKN' },
  { name: 'SAWAI MADHOPUR', code: 'SWM' },
  { name: 'MATHURA JN', code: 'MTJ' },
  { name: 'BHARATPUR JN', code: 'BTE' },
]

export const stationLabel = (s: Station) => `${s.name} - ${s.code}`

/** What the From/To box suggests for what has been typed so far. */
export function suggestStations(q: string): string[] {
  const t = q.trim().toUpperCase()
  if (!t) return []
  // Matched against the whole label, so typing a suggestion out in full
  // ("JAIPUR - JP") still finds it, as well as the name or the code alone.
  const starts = STATIONS.filter((s) => stationLabel(s).startsWith(t) || s.code === t)
  const has = STATIONS.filter((s) => !starts.includes(s) && (stationLabel(s).includes(t) || s.code.startsWith(t)))
  return [...starts, ...has].slice(0, 9).map(stationLabel)
}

export function stationFromLabel(label: string): Station | undefined {
  return STATIONS.find((s) => stationLabel(s) === label)
}

export const CLASSES = [
  'All Classes',
  'Anubhuti Class (EA)',
  'AC First Class (1A)',
  'Vistadome AC (EV)',
  'Exec. Chair Car (EC)',
  'AC 2 Tier (2A)',
  'First Class (FC)',
  'AC 3 Tier (3A)',
  'AC 3 Economy (3E)',
  'Vistadome Chair Car (VC)',
  'AC Chair car (CC)',
  'Sleeper (SL)',
  'Vistadome Non AC (VS)',
  'Second Sitting (2S)',
] as const

export const QUOTAS = [
  'GENERAL',
  'LADIES',
  'LOWER BERTH/SR.CITIZEN',
  'PERSON WITH DISABILITY',
  'DUTY PASS',
  'TATKAL',
  'PREMIUM TATKAL',
] as const

export const classCode = (label: string) => /\(([^)]+)\)/.exec(label)?.[1] ?? label

export type Train = {
  no: string
  name: string
  type: string
  dep: string
  arr: string
  dur: string
  /** Where it actually terminates in Delhi — not always the station you typed. */
  to: string
  from: string
  /** Sun..Sat */
  runs: boolean[]
  classes: { code: string; fare: number }[]
  /** Seat position on the travel date, by class code. */
  status: Record<string, string>
  /** The clerk's one line about it. */
  note: string
}

const DAILY = [true, true, true, true, true, true, true]
const except = (...off: number[]) => DAILY.map((_, i) => !off.includes(i))
const only = (...on: number[]) => DAILY.map((_, i) => on.includes(i))

export const TRAINS: Train[] = [
  {
    no: '12015', name: 'AJMER SHATABDI', type: 'SHATABDI', from: 'JP', to: 'NDLS',
    dep: '06:05', arr: '10:40', dur: '04:35', runs: except(3),
    classes: [{ code: 'CC', fare: 1120 }, { code: 'EC', fare: 2140 }],
    status: { CC: 'RAC 11', EC: 'AVAILABLE-0006' },
    note: 'fastest in the morning; chair car is RAC eleven, executive has six seats; does not run Wednesdays',
  },
  {
    no: '12985', name: 'JP DEE DOUBLE DECKER', type: 'DOUBLE DECKER', from: 'JP', to: 'DEE',
    dep: '06:00', arr: '10:30', dur: '04:30', runs: DAILY,
    classes: [{ code: 'CC', fare: 845 }],
    status: { CC: 'AVAILABLE-0112' },
    note: 'plenty of chair car seats, cheapest AC seat, BUT it terminates at Delhi Sarai Rohilla, not New Delhi',
  },
  {
    no: '12916', name: 'ASHRAM EXPRESS', type: 'SUPERFAST', from: 'JP', to: 'DLI',
    dep: '01:10', arr: '06:45', dur: '05:35', runs: DAILY,
    classes: [{ code: 'SL', fare: 285 }, { code: '3A', fare: 755 }, { code: '2A', fare: 1060 }, { code: '1A', fare: 1790 }],
    status: { SL: 'WL 34', '3A': 'AVAILABLE-0019', '2A': 'AVAILABLE-0008', '1A': 'AVAILABLE-0002' },
    note: 'overnight, leaves at ten past one in the morning, arrives Old Delhi (DLI)',
  },
  {
    no: '12951', name: 'MUMBAI RAJDHANI', type: 'RAJDHANI', from: 'JP', to: 'NDLS',
    dep: '16:35', arr: '22:10', dur: '05:35', runs: DAILY,
    classes: [{ code: '3A', fare: 1845 }, { code: '2A', fare: 2560 }, { code: '1A', fare: 4210 }],
    status: { '3A': 'AVAILABLE-0024', '2A': 'AVAILABLE-0009', '1A': 'RAC 2' },
    note: 'the comfortable one, meals included, AC only, three tier has twenty four seats',
  },
  {
    no: '22477', name: 'JP NDLS VANDE BHARAT', type: 'VANDE BHARAT', from: 'JP', to: 'NDLS',
    dep: '13:15', arr: '17:25', dur: '04:10', runs: except(2),
    classes: [{ code: 'CC', fare: 1285 }, { code: 'EC', fare: 2410 }],
    status: { CC: 'AVAILABLE-0041', EC: 'WL 3' },
    note: 'fastest of all, midday, chair car available; does not run Tuesdays',
  },
  {
    no: '19711', name: 'JP BPL INTERCITY', type: 'MAIL/EXP', from: 'JP', to: 'NZM',
    dep: '14:40', arr: '21:15', dur: '06:35', runs: only(2, 4, 6),
    classes: [{ code: 'SL', fare: 245 }, { code: '3A', fare: 465 }],
    status: { SL: 'AVAILABLE-0063', '3A': 'WL 8' },
    note: 'cheap and slow, arrives Hazrat Nizamuddin; three tier is waiting list eight; runs Tue, Thu, Sat only',
  },
  {
    no: '12413', name: 'PURI EXPRESS', type: 'SUPERFAST', from: 'JP', to: 'DLI',
    dep: '08:55', arr: '14:15', dur: '05:20', runs: only(0, 3),
    classes: [{ code: 'SL', fare: 265 }, { code: '3A', fare: 715 }, { code: '2A', fare: 1010 }],
    status: { SL: 'REGRET/WL', '3A': 'WL 21', '2A': 'RAC 4' },
    note: 'nearly full; runs Sun and Wed only',
  },
  {
    no: '14660', name: 'JAISALMER EXP', type: 'MAIL/EXP', from: 'JP', to: 'DEE',
    dep: '21:20', arr: '04:35', dur: '07:15', runs: DAILY,
    classes: [{ code: 'SL', fare: 255 }, { code: '3A', fare: 690 }, { code: '2A', fare: 975 }],
    status: { SL: 'AVAILABLE-0088', '3A': 'AVAILABLE-0031', '2A': 'AVAILABLE-0012' },
    note: 'night train, arrives Sarai Rohilla at half past four in the morning',
  },
  {
    no: '12462', name: 'MANDOR EXPRESS', type: 'SUPERFAST', from: 'JP', to: 'DLI',
    dep: '23:40', arr: '05:15', dur: '05:35', runs: DAILY,
    classes: [{ code: 'SL', fare: 285 }, { code: '3A', fare: 755 }, { code: '2A', fare: 1060 }, { code: '1A', fare: 1790 }],
    status: { SL: 'WL 12', '3A': 'RAC 6', '2A': 'AVAILABLE-0004', '1A': 'AVAILABLE-0001' },
    note: 'late night, arrives Old Delhi quarter past five',
  },
  {
    no: '20973', name: 'AII FZR EXPRESS', type: 'SUPERFAST', from: 'JP', to: 'DEE',
    dep: '10:10', arr: '15:55', dur: '05:45', runs: only(1, 5),
    classes: [{ code: 'SL', fare: 275 }, { code: '3A', fare: 735 }],
    status: { SL: 'AVAILABLE-0140', '3A': 'AVAILABLE-0052' },
    note: 'mid morning, lots of seats, arrives Sarai Rohilla; Mon and Fri only',
  },
]

/* The six-day strip on each class tab: the travel date carries the status
   above, and the days either side drift from it the way real availability
   does, so the grid looks alive without the clerk's facts changing. */
export function availabilityAround(train: Train, cls: string, date: Date): { date: Date; status: string }[] {
  const base = train.status[cls] ?? 'NOT AVAILABLE'
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const d = addDays(date, i)
    if (!train.runs[d.getDay()]) return { date: d, status: 'TRAIN DEPARTED/NOT RUNNING' }
    if (i === 0) return { date: d, status: base }
    const h = hash(`${train.no}${cls}${d.toDateString()}`) % 100
    const n = Number(/(\d+)/.exec(base)?.[1] ?? 0)
    if (base.startsWith('AVAILABLE')) {
      const left = Math.max(0, n - 3 + (h % 9))
      return { date: d, status: left ? `AVAILABLE-${String(left).padStart(4, '0')}` : 'RAC 3' }
    }
    if (base.startsWith('RAC')) return { date: d, status: h < 50 ? `RAC ${n + (h % 6)}` : `WL ${(h % 9) + 1}` }
    if (base.startsWith('WL')) return { date: d, status: `WL ${n + (h % 7)}` }
    return { date: d, status: base }
  })
}

export const RUN_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/* ---------- for the prompt ---------- */

export function trainsForPrompt(): string {
  return TRAINS.map((t) => {
    const days = t.runs.every(Boolean)
      ? 'daily'
      : `runs ${t.runs.map((r, i) => (r ? DAYS[i] : null)).filter(Boolean).join('/')}`
    const cls = t.classes
      .map((c) => `${c.code} ₹${c.fare} ${t.status[c.code]}`)
      .join(', ')
    return `- ${t.name} (${t.no}) ${t.dep}→${t.arr} arr ${t.to}, ${t.dur}, ${days}. ${cls}. ${t.note}.`
  }).join('\n')
}

export function calendarForPrompt(today: Date, days = 35): string {
  const out: string[] = []
  for (let i = 0; i < days; i++) {
    const d = addDays(today, i)
    out.push(`${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} = ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`)
  }
  return out.join('; ')
}
