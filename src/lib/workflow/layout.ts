// Left-to-right auto-layout for nodes that have no saved position. Sizes follow
// the real cards (a branch is taller: one row per path), so dagre leaves room
// and connections don't run through or on top of each other.

import dagre from '@dagrejs/dagre'

import type { Graph } from './convert'

export const NODE_W = 264
export const NODE_H = 128

/** Height of one card: the base plus a row per branch path (and "Otherwise"). */
function heightOf(n: Graph['nodes'][number]) {
  if (n.data.type !== 'conditional') return NODE_H
  const paths = Object.keys((n.data.parameters.mappings as object) ?? {}).length + 1
  return NODE_H + paths * 38
}

/** Positions every node (all = true) or only the ones without a position. */
export function layout(graph: Graph, all = false): Graph {
  if (!all && graph.nodes.every((n) => n.position)) return graph

  const g = new dagre.graphlib.Graph({ multigraph: true })
  g.setGraph({ rankdir: 'LR', nodesep: 70, ranksep: 140, edgesep: 30, marginx: 40, marginy: 40, ranker: 'network-simplex' })
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of graph.nodes) g.setNode(n.id, { width: NODE_W, height: heightOf(n) })
  for (const e of graph.edges) g.setEdge(e.source, e.target, {}, e.id)
  dagre.layout(g)

  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      if (n.position && !all) return n
      const p = g.node(n.id)
      return { ...n, position: { x: p.x - NODE_W / 2, y: p.y - heightOf(n) / 2 } }
    }),
  }
}
