// The pages the navigator demo can drive on /webnav.

export type SurfaceId = 'clinic' | 'university' | 'rail' | 'shop' | 'care'

export type Surface = {
  id: SurfaceId
  label: string
  /** the job the visitor is asking the agent to do */
  task: string
  /** the fake site's own name, shown on the frame */
  site: string
  /** what the address bar reads */
  host: string
  /** why this is hard, in our voice, said outside the frame */
  hard: string
  /** the fifteen-second dare, before the agent is allowed to help */
  dare: string
  blurb: string
  asks: string[]
}

export const SURFACES: Surface[] = [
  {
    id: 'clinic',
    label: 'A hospital portal',
    task: 'Get an appointment',
    site: 'Online OPD Registration — Government Hospitals',
    host: 'eopd-registration.gov.in',
    hard:
      'A seven-step wizard that starts with a map of India. Ninety-odd hospitals in Delhi alone, two named almost like yours; twenty-four departments in medical language; the nearest date always full; and a code sent to a phone before anything is booked.',
    dare: 'Try booking the earliest cardiology slot at Civil Hospital, Shastri Nagar.',
    blurb:
      'The national appointment portal every government hospital sits behind: state, hospital, mode, type, department, date, phone, form — each step empty until the one before it is right.',
    asks: [
      'My father has chest pain, earliest appointment please.',
      'Something this week, mornings only.',
      'He is sixty two, and he does not have the ABHA number.',
    ],
  },
  {
    id: 'university',
    label: 'A university portal',
    task: 'Find the thing that is buried',
    site: 'Meridian Institute of Technology',
    host: 'meridian.edu.in',
    hard:
      'Eleven menus of links, a ticker, a carousel and five tabs of announcements. The re-evaluation form is not in any menu — it is row sixteen of the examination branch’s notices. And the fee table parents find first is next year’s, for new admissions.',
    dare: 'Try to find the re-evaluation form yourself.',
    blurb:
      'A real university site’s shape: mega menus, announcement tabs, a notices table fifteen rows a page. Ask for what you actually want and watch it dig.',
    asks: [
      'I need the re-evaluation form for semester five.',
      'What are the BTech fees this semester?',
      'Where do I get a bonafide certificate?',
    ],
  },
  {
    id: 'rail',
    label: 'A train booking',
    task: 'Book a ticket',
    site: 'RailConnect — Passenger Reservation System',
    host: 'railconnect-reservation.in',
    hard:
      'A language popup before anything. Station boxes that only take a picked suggestion, with seven Delhis to pick from. A Book Now that stays dead until you load a class. A form that will not continue until you answer the insurance question.',
    dare: 'Try booking Jaipur to New Delhi on the twenty sixth, AC three tier.',
    blurb:
      'The railway booking flow, faithfully: popup, suggestion boxes, custom dropdowns, per-class availability, a login wall, passenger details and a captcha. Say where you are going and it does the rest.',
    asks: [
      'Book me Jaipur to Delhi on the twenty sixth, AC.',
      'The earliest train, whatever class.',
      'Add a passenger, twenty eight, male.',
    ],
  },
  {
    id: 'shop',
    label: 'A shop',
    task: 'Choose and add to cart',
    site: 'bazaar.in',
    host: 'bazaar.in/footwear',
    hard:
      'A login popup, a hundred and sixty products twenty four to a page, sponsored cards ranked first and dressed like the rest, and "exclude out of stock" hidden in a filter section that starts closed.',
    dare: 'Find running shoes under four thousand that are actually in stock.',
    blurb:
      'A real marketplace listing: search, a filter rail of collapsed sections, sort, pages, and a product page that will not take your order until you pick a size.',
    asks: [
      'I need running shoes under four thousand, size nine.',
      'Something for a two year old, not plastic.',
      'Noise cancelling headphones under five thousand.',
    ],
  },

  /* The odd one out, deliberately. The other four are an agent getting a
     visitor through a page written badly; this one is an agent doing the
     writing. A care worker who speaks Japanese but cannot write a legal
     record in it describes a fall out loud, and the report comes out in the
     Japanese the facility is required to file. The language barrier stops
     being the thing that breaks the demo and becomes the thing it is about. */
  {
    id: 'care',
    label: 'A Japanese care record',
    task: 'File an incident report',
    site: 'かわぐち介護記録システム',
    host: 'kaigo.kawaguchi-shisetsu.jp/kiroku',
    hard:
      'A legal record that has to be filed in formal written Japanese within twenty four hours — by a care worker from Manila or Hanoi who speaks Japanese perfectly well and cannot write it. Filing one takes forty minutes and a colleague.',
    dare: 'Try filling in the 発生状況 box yourself.',
    blurb:
      'Nine required fields, all of them in Japanese, on a report that is legally due within a day. Describe the fall in your own language and watch correct 敬体 Japanese appear in the boxes — including the distinction between 転倒 and 転落 that nobody outside the building knows.',
    asks: [
      'Tanaka-san fell. About seven forty, in his room.',
      'He came off the bed. Small cut on the arm.',
      'He says his hip hurts but that it is fine.',
    ],
  },
]

export const DEFAULT_SURFACE: SurfaceId = 'university'

export function surfaceById(id: string): Surface {
  return SURFACES.find((s) => s.id === id) ?? SURFACES[0]!
}
