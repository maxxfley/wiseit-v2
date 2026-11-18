"use client"; // Lee el contexto de "Avanzar más".

import { GhostTopic } from "./ghost-topic";
import { ExtendControl } from "./extend-control";
import { useExtensions } from "./extensions-provider";

/** Final de la vista Lista: temas fantasma (gratis) y el control de "Avanzar más". */
export function ExtendSection() {
  const { ghosts, access } = useExtensions();
  return (
    <section className="mt-12 max-w-3xl space-y-4">
      {!access.premium && ghosts.length > 0 ? (
        <ol className="space-y-3 border-l border-dashed border-border-strong pl-6">
          {ghosts.map((title) => (
            <li key={title}>
              <GhostTopic title={title} />
            </li>
          ))}
        </ol>
      ) : null}
      <div className="max-w-sm">
        <ExtendControl />
      </div>
    </section>
  );
}
