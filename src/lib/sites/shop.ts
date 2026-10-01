// The shop's catalogue. Generated, but from a fixed seed, so the page the
// visitor sees and the stock list the assistant is given are the same list —
// the assistant is a person who knows the shelf, not a search box guessing.

import { seeded } from './util'

export type Product = {
  id: number
  brand: string
  title: string
  category: 'Footwear' | 'Toys' | 'Electronics' | 'Fitness'
  sub: string
  gender?: 'Men' | 'Women' | 'Unisex' | 'Boys' | 'Girls'
  price: number
  mrp: number
  rating: number
  ratings: number
  stock: boolean
  fewLeft?: boolean
  sponsored?: boolean
  assured?: boolean
  sizes?: number[]
  /** Sizes listed but sold out — the size picker shows them struck through. */
  soldSizes?: number[]
  age?: string
  material?: string
  color: string
  badge?: string
  /** The one line the floor staff would say about it. */
  note?: string
}

/* The ones the conversation is about, written by hand so the story holds:
   the best-selling trail pair, the better-rated road pair that is over budget,
   a sponsored pair that is worse than it looks, a cheap pair that is gone, and
   the toys and audio the other asks point at. */
const STORY: Omit<Product, 'id'>[] = [
  { brand: 'Trailcraft', title: 'Trailcraft Ridge 2 Trail Running Shoes For Men', category: 'Footwear', sub: 'Running Shoes', gender: 'Men', price: 3199, mrp: 4999, rating: 4.4, ratings: 18204, stock: true, assured: true, sizes: [6, 7, 8, 9, 10, 11], soldSizes: [11], color: 'Grey', badge: 'Bestseller', note: 'best selling running shoe on the site, grippy, fine on roads too' },
  { brand: 'Nimbus Run', title: 'Nimbus Run Glide 5 Road Running Shoes For Men', category: 'Footwear', sub: 'Running Shoes', gender: 'Men', price: 4499, mrp: 6499, rating: 4.6, ratings: 9412, stock: true, assured: true, sizes: [7, 8, 9, 10, 11], color: 'Blue', note: 'better rated, cushioned, built for tarmac, over four thousand' },
  { brand: 'Stridex', title: 'Stridex Pro Max Running Shoes For Men', category: 'Footwear', sub: 'Running Shoes', gender: 'Men', price: 3899, mrp: 7999, rating: 3.6, ratings: 2210, stock: true, sponsored: true, sizes: [6, 7, 8, 9, 10], color: 'Black', badge: 'Hot Deal', note: 'SPONSORED — big discount on paper but rated three point six, returns are high' },
  { brand: 'Aeroflex', title: 'Aeroflex Dash Lightweight Running Shoes For Men', category: 'Footwear', sub: 'Running Shoes', gender: 'Men', price: 2799, mrp: 3999, rating: 4.3, ratings: 6120, stock: false, sizes: [7, 8, 9, 10], color: 'White', note: 'OUT OF STOCK — good value when it is in' },
  { brand: 'Nimbus Run', title: 'Nimbus Run Glide 5 Road Running Shoes For Women', category: 'Footwear', sub: 'Running Shoes', gender: 'Women', price: 4299, mrp: 6299, rating: 4.6, ratings: 5530, stock: true, assured: true, sizes: [4, 5, 6, 7, 8], color: 'Pink', note: 'the women\'s road pair' },
  { brand: 'Trailcraft', title: 'Trailcraft Ridge 2 Trail Running Shoes For Women', category: 'Footwear', sub: 'Running Shoes', gender: 'Women', price: 3099, mrp: 4799, rating: 4.4, ratings: 7702, stock: true, assured: true, sizes: [4, 5, 6, 7, 8], color: 'Teal', note: 'the women\'s trail pair' },
  { brand: 'Lakdi Toys', title: 'Lakdi Toys Wooden Stacking Blocks, 30 Pieces (Ages 1+)', category: 'Toys', sub: 'Blocks & Stacking', gender: 'Unisex', price: 899, mrp: 1299, rating: 4.8, ratings: 3308, stock: true, assured: true, age: '1 - 3 Years', material: 'Wood', color: 'Multicolor', badge: 'Top rated', note: 'solid neem wood, water based paint, right for a two year old' },
  { brand: 'Lakdi Toys', title: 'Lakdi Toys Wooden Train Set With Track (Ages 3+)', category: 'Toys', sub: 'Vehicles', gender: 'Unisex', price: 2599, mrp: 3499, rating: 4.6, ratings: 1240, stock: true, age: '3 - 5 Years', material: 'Wood', color: 'Natural', note: 'lovely but small parts, rated three and up' },
  { brand: 'Tinytots', title: 'Tinytots Plastic Ride-On Car With Music (Ages 1-3)', category: 'Toys', sub: 'Ride-ons', gender: 'Unisex', price: 3399, mrp: 4499, rating: 3.9, ratings: 880, stock: false, age: '1 - 3 Years', material: 'Plastic', color: 'Red', note: 'OUT OF STOCK, and plastic' },
  { brand: 'Chanakya Learning', title: 'Chanakya Learning Wooden Shape Sorter Puzzle (Ages 1+)', category: 'Toys', sub: 'Puzzles', gender: 'Unisex', price: 649, mrp: 999, rating: 4.5, ratings: 2150, stock: true, fewLeft: true, age: '1 - 3 Years', material: 'Wood', color: 'Multicolor', note: 'wooden, cheap, only a few left' },
  { brand: 'Sonora', title: 'Sonora Hush 700 Active Noise Cancelling Headphones', category: 'Electronics', sub: 'Headphones', gender: 'Unisex', price: 9399, mrp: 12999, rating: 4.7, ratings: 4411, stock: true, assured: true, color: 'Black', badge: 'Sale', note: 'best rated audio on the site and in the sale' },
  { brand: 'Bassline', title: 'Bassline Pods 3 Wireless Earbuds With ENC Mic', category: 'Electronics', sub: 'Earbuds', gender: 'Unisex', price: 2899, mrp: 4999, rating: 4.2, ratings: 21880, stock: true, color: 'White', badge: 'Hot Deal', note: 'on offer; call noise reduction only, not proper noise cancelling' },
]

const SHOE_BRANDS = ['Stridex', 'Trailcraft', 'Nimbus Run', 'Aeroflex', 'Urban Lace', 'Podium', 'Veloce', 'Kaveri', 'Marathon Co', 'Swift Step', 'Terra Grip', 'Pace Lab', 'Runwell', 'Kinetix', 'Ojas', 'Solemate', 'Zephyr', 'Ranger', 'Metro Walk', 'Footloose']
const SHOE_TYPES = [
  { sub: 'Running Shoes', words: ['Running Shoes', 'Road Running Shoes', 'Trail Running Shoes', 'Marathon Running Shoes'] },
  { sub: 'Walking Shoes', words: ['Walking Shoes', 'Comfort Walking Shoes'] },
  { sub: 'Sneakers', words: ['Sneakers', 'Casual Sneakers', 'Chunky Sneakers'] },
  { sub: 'Sports Shoes', words: ['Training Shoes', 'Badminton Shoes', 'Football Studs'] },
  { sub: 'Sandals & Floaters', words: ['Sandals', 'Floaters'] },
]
const MODELS = ['Aero', 'Flux', 'Pulse', 'Stride', 'Vortex', 'Glide', 'Rush', 'Nova', 'Drift', 'Blaze', 'Echo', 'Orbit', 'Surge', 'Tempo', 'Zoom', 'Apex', 'Kite', 'Rapid', 'Sprint', 'Volt']
const COLORS = ['Black', 'White', 'Grey', 'Navy', 'Blue', 'Red', 'Olive', 'Beige', 'Teal', 'Pink']

const TOY_BRANDS = ['Lakdi Toys', 'Chanakya Learning', 'Tinytots', 'Khilona', 'Little Genius', 'Kidoz']
const TOYS = [
  { t: 'Wooden Puzzle Board', sub: 'Puzzles', material: 'Wood', age: '2 - 4 Years' },
  { t: 'Soft Plush Elephant', sub: 'Soft Toys', material: 'Fabric', age: '0 - 2 Years' },
  { t: 'Building Blocks Set, 120 Pieces', sub: 'Blocks & Stacking', material: 'Plastic', age: '3 - 5 Years' },
  { t: 'Musical Keyboard Toy', sub: 'Musical Toys', material: 'Plastic', age: '2 - 4 Years' },
  { t: 'Wooden Abacus', sub: 'Learning Toys', material: 'Wood', age: '3 - 5 Years' },
  { t: 'Pull Along Wooden Duck', sub: 'Push & Pull', material: 'Wood', age: '1 - 3 Years' },
  { t: 'Remote Control Car', sub: 'Vehicles', material: 'Plastic', age: '5 - 8 Years' },
  { t: 'Doctor Play Set', sub: 'Pretend Play', material: 'Plastic', age: '3 - 5 Years' },
  { t: 'Wooden Rattle Set', sub: 'Rattles', material: 'Wood', age: '0 - 1 Years' },
  { t: 'Magnetic Tiles, 60 Pieces', sub: 'Blocks & Stacking', material: 'Plastic', age: '3 - 6 Years' },
]
const AUDIO = [
  { t: 'Wireless Earbuds', sub: 'Earbuds' },
  { t: 'Bluetooth Neckband', sub: 'Neckbands' },
  { t: 'Over-Ear Headphones', sub: 'Headphones' },
  { t: 'Portable Bluetooth Speaker', sub: 'Speakers' },
]
const AUDIO_BRANDS = ['Bassline', 'Sonora', 'Echo Audio', 'Tarang', 'Boomcraft']
const FIT = ['Yoga Mat 6mm', 'Adjustable Dumbbells 10kg Pair', 'Resistance Bands Set', 'Skipping Rope', 'Gym Gloves', 'Foam Roller']

function build(): Product[] {
  const r = seeded(20260919)
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)]!
  const round = (n: number) => Math.round(n / 50) * 50 - 1
  const seen = new Set(STORY.map((p) => p.title))
  const out: Omit<Product, 'id'>[] = [...STORY]

  const add = (p: Omit<Product, 'id'>) => {
    if (seen.has(p.title)) return
    seen.add(p.title)
    out.push(p)
  }

  for (let i = 0; out.length < 110; i++) {
    const type = pick(SHOE_TYPES)
    const gender = r() < 0.62 ? 'Men' : r() < 0.8 ? 'Women' : pick(['Boys', 'Girls'] as const)
    const brand = pick(SHOE_BRANDS)
    const model = `${pick(MODELS)} ${Math.floor(r() * 9) + 1}`
    const mrp = round(1499 + r() * 7000)
    const price = round(mrp * (0.35 + r() * 0.5))
    const kid = gender === 'Boys' || gender === 'Girls'
    add({
      brand,
      title: `${brand} ${model} ${pick(type.words)} For ${gender}`,
      category: 'Footwear',
      sub: type.sub,
      gender,
      price,
      mrp,
      rating: Math.round((3.2 + r() * 1.5) * 10) / 10,
      ratings: Math.floor(40 + r() * 9000),
      stock: r() > 0.13,
      fewLeft: r() < 0.1,
      sponsored: r() < 0.09,
      assured: r() < 0.45,
      sizes: kid ? [11, 12, 13, 1, 2, 3] : gender === 'Women' ? [3, 4, 5, 6, 7, 8] : [6, 7, 8, 9, 10, 11],
      soldSizes: r() < 0.4 ? [kid ? 13 : 9] : [],
      color: pick(COLORS),
      badge: r() < 0.12 ? 'Hot Deal' : undefined,
    })
  }

  for (let i = 0; out.length < 140; i++) {
    const toy = pick(TOYS)
    const brand = pick(TOY_BRANDS)
    const mrp = round(499 + r() * 3500)
    add({
      brand,
      title: `${brand} ${toy.t} (Ages ${toy.age.replace(' Years', '').replace(' - ', '-')})`,
      category: 'Toys',
      sub: toy.sub,
      gender: 'Unisex',
      price: round(mrp * (0.5 + r() * 0.4)),
      mrp,
      rating: Math.round((3.4 + r() * 1.4) * 10) / 10,
      ratings: Math.floor(20 + r() * 4000),
      stock: r() > 0.12,
      sponsored: r() < 0.08,
      assured: r() < 0.4,
      age: toy.age,
      material: toy.material,
      color: 'Multicolor',
    })
  }

  for (let i = 0; out.length < 156; i++) {
    const a = pick(AUDIO)
    const brand = pick(AUDIO_BRANDS)
    const mrp = round(999 + r() * 9000)
    add({
      brand,
      title: `${brand} ${pick(MODELS)} ${a.t}`,
      category: 'Electronics',
      sub: a.sub,
      gender: 'Unisex',
      price: round(mrp * (0.4 + r() * 0.45)),
      mrp,
      rating: Math.round((3.5 + r() * 1.3) * 10) / 10,
      ratings: Math.floor(100 + r() * 30000),
      stock: r() > 0.1,
      sponsored: r() < 0.1,
      color: pick(['Black', 'White', 'Blue']),
    })
  }

  for (const f of FIT) {
    const mrp = round(399 + r() * 5000)
    add({
      brand: 'Mudra Fit',
      title: `Mudra Fit ${f}`,
      category: 'Fitness',
      sub: 'Fitness Accessories',
      gender: 'Unisex',
      price: round(mrp * 0.6),
      mrp,
      rating: Math.round((3.8 + r() * 1) * 10) / 10,
      ratings: Math.floor(100 + r() * 5000),
      stock: true,
      color: 'Black',
    })
  }

  // The story products are spread through the list the way a real ranking
  // would place them, not stacked at the top.
  const story = out.slice(0, STORY.length)
  const rest = out.slice(STORY.length)
  const placed = [...rest]
  const slots = [5, 1, 0, 9, 22, 17, 3, 12, 30, 7, 2, 6]
  story.forEach((p, i) => {
    const base = p.category === 'Footwear' ? 0 : p.category === 'Toys' ? 98 : 128
    placed.splice(Math.min(placed.length, base + slots[i]!), 0, p)
  })
  return placed.map((p, i) => ({ ...p, id: i + 1 }))
}

export const PRODUCTS: Product[] = build()

export const discount = (p: Product) => Math.round((1 - p.price / p.mrp) * 100)
export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

const STOP = new Set(['for', 'the', 'a', 'and', 'with', 'of', 'in'])

/** Whether a product answers a search box query, loosely, like a shop's. */
export function matches(p: Product, q: string): boolean {
  const hay = `${p.title} ${p.category} ${p.sub} ${p.brand} ${p.material ?? ''} ${p.gender ?? ''}`.toLowerCase()
  const words = q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w))
  return words.every((w) => hay.includes(w.replace(/s$/, '')) || hay.includes(w))
}

export const SEARCH_SUGGESTIONS = [
  'running shoes', 'running shoes for men', 'running shoes for women', 'trail running shoes',
  'sports shoes', 'sneakers for men', 'walking shoes', 'sandals', 'wooden toys', 'toys for 2 year old',
  'soft toys', 'building blocks', 'wireless earbuds', 'noise cancelling headphones', 'bluetooth speaker',
  'yoga mat', 'dumbbells',
]

/* ---------- for the prompt ---------- */

export function catalogForPrompt(): string {
  return PRODUCTS.map((p) => {
    const stock = p.stock ? (p.fewLeft ? 'few left' : 'in stock') : 'OUT OF STOCK'
    const sizes = p.sizes ? ` · UK ${p.sizes.join('/')}${p.soldSizes?.length ? ` (${p.soldSizes.join('/')} sold out)` : ''}` : ''
    // The ones the conversation turns on get the full line; the rest of the
    // shelf only needs enough to be recognised and ranked.
    if (p.note) {
      return `- ${p.title} · ₹${p.price} (MRP ${p.mrp}) · ${p.rating}★ ${p.ratings.toLocaleString('en-IN')} · ${stock}${p.sponsored ? ' · SPONSORED' : ''}${sizes} — ${p.note}`
    }
    return `- ${p.title} · ₹${p.price} · ${p.rating}★ · ${stock}${p.sponsored ? ' · SPONSORED' : ''}${sizes}`
  }).join('\n')
}
