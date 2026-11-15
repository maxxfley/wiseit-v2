import { groupByDifficulty, type RoadmapNodeView } from "../utils/node-status";

function NodeItem({ node }: { node: RoadmapNodeView }) {
  return (
    <li className="relative pl-6">
      <span
        aria-hidden="true"
        className="absolute -left-[5px] top-2 size-2.5 rounded-full border border-primary bg-background"
      />
      <p className="font-mono text-xs text-subtle">Paso {node.orderIndex + 1}</p>
      <h4 className="mt-1 text-lg font-medium text-foreground">{node.title}</h4>
      <p className="mt-2 max-w-[72ch] text-body">{node.description}</p>
      {node.key_concepts.length > 0 ? (
        <ul aria-label="Conceptos clave" className="mt-3 flex flex-wrap gap-1.5">
          {node.key_concepts.map((concept) => (
            <li key={concept} className="rounded-xs border border-border px-2 py-0.5 font-mono text-xs text-body">
              {concept}
            </li>
          ))}
        </ul>
      ) : null}
      {node.practice ? (
        <p className="mt-3 max-w-[72ch] rounded-md border border-border bg-surface px-4 py-3 text-sm text-body">
          <span className="font-medium text-foreground">Practicá: </span>
          {node.practice}
        </p>
      ) : null}
    </li>
  );
}

/** Timeline vertical agrupada por nivel; los nodos llegan ya ordenados por `order_index`. */
export function RoadmapTimeline({ nodes }: { nodes: readonly RoadmapNodeView[] }) {
  return (
    <div className="space-y-12">
      {groupByDifficulty(nodes).map(({ level, nodes: levelNodes }) => (
        <section key={level} aria-labelledby={`nivel-${level}`}>
          <h3
            id={`nivel-${level}`}
            className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent"
          >
            {level}
          </h3>
          <ol className="space-y-8 border-l border-border-strong">
            {levelNodes.map((node) => (
              <NodeItem key={node.id} node={node} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
