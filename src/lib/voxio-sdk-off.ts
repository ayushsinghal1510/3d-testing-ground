// Stand-in for @voxio/client, /react, /server and /widget while the SDK isn't
// published. The real packages were linked from a local checkout
// (../../voice-bot-sdk) that the deployed build doesn't have, which broke the
// whole site. tsconfig.json points the four names here instead. Only the
// dashboard's Test tab uses them; it fails when used, and the rest of the site
// is unaffected.
//
// To bring the SDK back: remove the @voxio/* entries from tsconfig "paths" and
// re-add the packages to package.json.

/* eslint-disable @typescript-eslint/no-explicit-any */

const OFF = 'Testing is turned off: the Voxio SDK isn’t installed in this build.'
const off = (): never => { throw new Error(OFF) }

export class VoxioServerError extends Error {
  status?: number
  code?: string
}

export const Voxio: any = class { constructor() { off() } }
export const ChatbotLogic: any = class { constructor() { off() } }
export const useVoxioSession: any = off
export const createSession: any = off

export type Call = any
export type SessionRecord = any
