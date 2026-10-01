// Engine workflow JSON <-> canvas graph. Pure: no React, no React Flow import,
// so it can be round-trip tested in plain node.
//
// The engine reads only `workflow.nodes` (agent/.../workflow.py):
//   { nodes: { <name>: { type, parameters, next: name | name[] } } }
// The start node is the first key. A conditional's `parameters.mappings`
// ({value: route | route[]}) overrides `next` when a value matches, so each
// mapping becomes its own output handle. Layout lives in `workflow.ui`, which
// the engine ignores.

export type EngineNode = {
  type: string
  parameters?: Record<string, unknown>
  next?: string | string[]
  [extra: string]: unknown
}

export type Workflow = {
  nodes: Record<string, EngineNode>
  ui?: { positions?: Record<string, { x: number; y: number }> }
  [extra: string]: unknown
}

export type NodeData = {
  type: string
  parameters: Record<string, unknown>
  /** Keys on the engine node other than type / parameters / next, kept verbatim. */
  extra: Record<string, unknown>
  /** `next` targets that name no node; kept so saving never loses them. */
  missing: string[]
  /** Whether the source had a `parameters` key at all. */
  hadParams: boolean
}

export type GraphNode = { id: string; position: { x: number; y: number } | null; data: NodeData }
export type GraphEdge = { id: string; source: string; target: string; sourceHandle: string }
export type Graph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  /** Top-level workflow keys other than nodes / ui. */
  extra: Record<string, unknown>
}

export const NEXT_HANDLE = 'next'
export const mapHandle = (value: string) => `m:${value}`
export const isMapHandle = (h: string) => h.startsWith('m:')
export const mapValue = (h: string) => h.slice(2)

const asList = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

const edgeId = (source: string, handle: string, target: string) => `${source}|${handle}|${target}`

export function toGraph(wf: Workflow): Graph {
  const { nodes = {}, ui, ...extra } = wf
  const names = new Set(Object.keys(nodes))
  const positions = ui?.positions ?? {}
  const gNodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  for (const [name, node] of Object.entries(nodes)) {
    const { type, parameters, next, ...rest } = node
    const missing: string[] = []

    for (const target of asList(next)) {
      if (names.has(target)) edges.push({ id: edgeId(name, NEXT_HANDLE, target), source: name, target, sourceHandle: NEXT_HANDLE })
      else missing.push(target)
    }

    const mappings = (parameters?.mappings ?? null) as Record<string, unknown> | null
    if (type === 'conditional' && mappings && typeof mappings === 'object') {
      for (const [value, route] of Object.entries(mappings)) {
        for (const target of asList(route)) {
          if (names.has(target)) {
            const h = mapHandle(value)
            edges.push({ id: edgeId(name, h, target), source: name, target, sourceHandle: h })
          }
        }
      }
    }

    gNodes.push({
      id: name,
      position: positions[name] ?? null,
      data: {
        type,
        parameters: { ...(parameters ?? {}) },
        extra: rest,
        missing,
        hadParams: parameters !== undefined,
      },
    })
  }

  return { nodes: gNodes, edges, extra }
}

export function toWorkflow(graph: Graph, opts: { start?: string; withUi?: boolean } = {}): Workflow {
  const { withUi = true } = opts
  const ordered = [...graph.nodes]
  if (opts.start) {
    const i = ordered.findIndex((n) => n.id === opts.start)
    if (i > 0) ordered.unshift(...ordered.splice(i, 1))
  }

  const nodes: Record<string, EngineNode> = {}
  const positions: Record<string, { x: number; y: number }> = {}

  for (const n of ordered) {
    const out = graph.edges.filter((e) => e.source === n.id)
    const nextTargets = [...out.filter((e) => e.sourceHandle === NEXT_HANDLE).map((e) => e.target), ...n.data.missing]

    let parameters = n.data.parameters
    const mappings = parameters.mappings as Record<string, unknown> | undefined
    if (n.data.type === 'conditional' && mappings && typeof mappings === 'object') {
      const rebuilt: Record<string, unknown> = {}
      for (const [value, original] of Object.entries(mappings)) {
        const targets = out.filter((e) => e.sourceHandle === mapHandle(value)).map((e) => e.target)
        // A route to a node that doesn't exist has no edge; keep what was written.
        const kept = asList(original).filter((t) => !graph.nodes.some((g) => g.id === t))
        const all = [...targets, ...kept]
        rebuilt[value] = all.length === 1 ? all[0] : Array.isArray(original) || all.length > 1 ? all : ''
      }
      parameters = { ...parameters, mappings: rebuilt }
    }

    const node: EngineNode = { type: n.data.type }
    if (n.data.hadParams || Object.keys(parameters).length) node.parameters = parameters
    if (nextTargets.length === 1) node.next = nextTargets[0]
    else if (nextTargets.length > 1) node.next = nextTargets
    Object.assign(node, n.data.extra)

    nodes[n.id] = node
    if (n.position) positions[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) }
  }

  const wf: Workflow = { ...graph.extra, nodes }
  if (withUi && Object.keys(positions).length) wf.ui = { positions }
  return wf
}

/** The engine's start node: the first key. */
export const startOf = (graph: Graph): string | undefined => graph.nodes[0]?.id

/** Pull the workflow out of whatever JSON shape was pasted or fetched. */
export function extractWorkflow(doc: unknown): Workflow | null {
  if (!doc || typeof doc !== 'object') return null
  const d = doc as Record<string, any>
  if (d.nodes && typeof d.nodes === 'object') return d as Workflow
  return (
    extractWorkflow(d.workflow) ??
    extractWorkflow(d.agent_id) ??
    extractWorkflow(d.agent) ??
    null
  )
}
