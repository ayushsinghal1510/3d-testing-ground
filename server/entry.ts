// Everything the API needs from the vx code, in one module, so prod can build
// it as a single SSR bundle (dist/server/entry.js) and dev can ssrLoadModule it.

export { DEMOS, demoById } from '../src/lib/demos'
export { buildRoomCustoms } from '../src/server/voice/roomCustoms'
export { ACCENTS, DEFAULT_ACCENT, accentById } from '../src/lib/accents'
