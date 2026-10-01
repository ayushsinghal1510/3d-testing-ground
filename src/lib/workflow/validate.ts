// Static checks on a workflow graph. Errors block saving; warnings don't.

import { type Graph, isMapHandle, mapValue } from './convert'
import { specFor } from './registry'

export type Issue = { level: 'error' | 'warning'; node?: string; message: string }

const LLM_TYPES = new Set(['llm', 'llm-streaming', 'llm_shopify', 'shopify_llm', 'rag_shopify'])

const keysOf = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string') : v && typeof v === 'object' ? Object.keys(v) : []

export function validate(graph: Graph): Issue[] {
  const issues: Issue[] = []
  const ids = graph.nodes.map((n) => n.id)
  const start = ids[0]

  if (!graph.nodes.length) return [{ level: 'error', message: 'Add a first step to get started.' }]

  const out = new Map<string, string[]>()
  for (const e of graph.edges) out.set(e.source, [...(out.get(e.source) ?? []), e.target])

  // Reachability from the start node.
  const seen = new Set<string>()
  const stack = [start]
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    stack.push(...(out.get(id) ?? []))
  }

  // A cycle that never passes an input node spins forever inside one turn.
  const type = new Map(graph.nodes.map((n) => [n.id, n.data.type]))
  const state = new Map<string, 0 | 1 | 2>()
  const reported = new Set<string>()
  const visit = (id: string): void => {
    state.set(id, 1)
    for (const t of out.get(id) ?? []) {
      if (type.get(t) === 'input') continue
      if (state.get(t) === 1 && !reported.has(t)) {
        reported.add(t)
        issues.push({ level: 'error', node: t, message: 'Loop with no “Wait for caller” in it — it would run forever within one turn.' })
      } else if (!state.get(t)) visit(t)
    }
    state.set(id, 2)
  }
  for (const id of ids) if (!state.get(id) && type.get(id) !== 'input') visit(id)

  // Variables available: anything any node declares it writes. Coarse, but catches typos.
  const produced = new Set<string>()
  for (const n of graph.nodes) {
    const p = n.data.parameters
    if (n.data.type === 'input') keysOf(p.input_variables).forEach((k) => produced.add(k))
    keysOf(p.output_variables).forEach((k) => produced.add(k))
    keysOf(p.llm_return_type).forEach((k) => produced.add(k))
  }

  for (const n of graph.nodes) {
    const spec = specFor(n.data.type)
    const p = n.data.parameters
    const at = (level: Issue['level'], message: string) => issues.push({ level, node: n.id, message })

    if (spec.unsupported) at('error', spec.unsupported)
    if (!seen.has(n.id)) at('warning', 'Never reached from the start node.')
    for (const m of n.data.missing) at('error', `Goes to “${m}”, which doesn’t exist.`)

    if (n.data.type === 'conditional') {
      const vars = keysOf(p.input_variables)
      if (vars.length !== 1) at('error', 'A branch needs exactly one variable.')
      const maps = keysOf(p.mappings)
      if (!maps.length) at('error', 'A branch needs at least one route.')
      const wired = new Set(graph.edges.filter((e) => e.source === n.id && isMapHandle(e.sourceHandle)).map((e) => mapValue(e.sourceHandle)))
      for (const m of maps) if (!wired.has(m)) at('warning', `Route “${m}” goes nowhere.`)
    }

    if (n.data.type !== 'input') {
      for (const v of keysOf(p.input_variables)) if (!produced.has(v)) at('warning', `Reads “${v}”, which no node writes.`)
    }
    for (const v of keysOf(p.variables)) if (!produced.has(v)) at('warning', `Passes “${v}”, which no node writes.`)

    if (LLM_TYPES.has(n.data.type) && !keysOf(p.llm_return_type).includes('speak'))
      at('warning', 'No “speak” in Returns — this node will be silent.')
    if ((n.data.type === 'llm' || n.data.type === 'llm-streaming') && !String(p.system_prompt ?? '').trim())
      at('warning', 'Empty system prompt.')
    if (n.data.type === 'rag' && !String(p.collection_name ?? '').trim()) at('error', 'Pick a knowledge base.')
  }

  return issues
}

export function issuesByNode(issues: Issue[]): Map<string, Issue[]> {
  const m = new Map<string, Issue[]>()
  for (const i of issues) if (i.node) m.set(i.node, [...(m.get(i.node) ?? []), i])
  return m
}
