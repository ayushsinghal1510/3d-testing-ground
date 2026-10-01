// The desks you can ring from the /calling page.

export type DeskId = 'university' | 'school' | 'opd' | 'hotel' | 'nsdc' | 'lab'

export type Desk = {
  id: DeskId
  label: string
  role: string
  blurb: string
  orgLabel: string
  orgPlaceholder: string
  defaultBrand: string
  asks: string[]
}

export const DESKS: Desk[] = [
  {
    id: 'university',
    label: 'University',
    role: 'Admissions counsellor',
    blurb:
      'Inbound admissions. Course, fee and eligibility questions, in Hinglish or English — whichever you speak to it in.',
    orgLabel: 'Which university are you asking about?',
    orgPlaceholder: 'Singapore Institute of Technology',
    defaultBrand: 'NIMS University',
    asks: [
      'What are the fees for the BTech programme?',
      'Am I eligible with 72 percent?',
      'Kya hostel available hai?',
      'Cut in halfway through its answer — it stops.',
    ],
  },
  {
    id: 'school',
    label: 'School',
    role: 'Front office',
    blurb:
      'Admissions and parent enquiries for a school front office — timings, transport, fees, the forms nobody can find.',
    orgLabel: 'Which school are you asking about?',
    orgPlaceholder: 'Raffles Institution',
    defaultBrand: 'Greenwood School',
    asks: [
      'When do Class 6 admissions open?',
      'Is there a bus from Jayanagar?',
      'What documents do I bring to the interview?',
    ],
  },
  {
    id: 'opd',
    label: 'Hospital OPD',
    role: 'Patient simulation',
    blurb:
      'The other way round: it plays the patient, and you are the one being tested. It stays anxious, vague or stubborn until you handle it properly.',
    orgLabel: 'Which hospital or department?',
    orgPlaceholder: 'General medicine OPD',
    defaultBrand: 'City Hospital',
    asks: [
      'Ask it what brought it in today.',
      'Interrupt it — see what it does.',
      'Try to reassure it before you have the history.',
    ],
  },
  {
    id: 'hotel',
    label: 'Hotel',
    role: 'Front desk',
    blurb:
      'Reservations and guest requests at a front desk — availability, changes, the late checkout everyone asks for.',
    orgLabel: 'Which hotel are you asking about?',
    orgPlaceholder: 'The Oberoi, Bengaluru',
    defaultBrand: 'The Grand',
    asks: [
      'Do you have a room for two nights from Friday?',
      'Can I get a late checkout on Sunday?',
      'Change it to a twin room instead.',
    ],
  },
  /* The support desk, and the only one that is allowed to refuse. It decides
     between resolving, deflecting, ticketing and escalating every turn, and a
     money or grievance question is a ticket however simple it sounds — which
     is the behaviour worth hearing on this one. */
  {
    id: 'nsdc',
    label: 'NSDC Inquiry',
    role: 'Vidya, Skill India helpline',
    blurb:
      'A government helpline agent for Skill India. It resolves what it can, refuses what it must — stipends and complaints become tickets, never answers — and it will not invent a number, a date or an amount.',
    orgLabel: 'Which scheme or centre are you asking about?',
    orgPlaceholder: 'PMKVY 4.0',
    defaultBrand: 'Skill India Digital',
    asks: [
      'Mera certificate nahi aaya, course khatam ho gaya.',
      'Mera stipend teen mahine se nahi aaya.',
      'Will I definitely get a job after this?',
      'Ask it for a helpline number — it will not read one out.',
    ],
  },
  /* The same support engine as NSDC, as an equipment service desk: first-level
     checks it can walk through, everything else a ticket, and a safety stop
     that overrides the lot. */
  {
    id: 'lab',
    label: 'Lab Equipment Support',
    role: 'Rachel, analyser service desk',
    blurb:
      'A service desk for lab testing machines, in Hindi or English. It walks you through the safe first checks, turns error codes and upgrade requests into tickets, and stops you the moment something sounds unsafe.',
    orgLabel: 'Which equipment company are you calling?',
    orgPlaceholder: 'Roche Diagnostics',
    defaultBrand: 'Roche Diagnostics',
    asks: [
      'Machine pe error aa raha hai, samples nahi chal rahe.',
      'We run two hundred samples a day. How do we double that?',
      'QC fail ho raha hai since morning.',
      'Say you smell something burning — see what it does.',
    ],
  },
]

export const DEFAULT_DESK: DeskId = 'university'

export function deskById(id: string): Desk {
  return DESKS.find((d) => d.id === id) ?? DESKS[0]!
}
