# Images and diagrams

- No hero image by default. A lesson page opens on its title and its first part, not on a picture.
- An illustration only when the lesson truly needs it to be understood: a flow, a timeline or an architecture a sentence cannot carry.
  Such a figure is a `mermaid` fence with its caption ("Hình N: …"), not a decorative image. **(đề xuất: mermaid before any drawn
  image)**
- **A drawn picture shows one literal scene (owner 2026-11-24: "update starciprompts là hình ảnh trực quan 1 nghĩa như là màn hình mà người ta click liên tục").** Each lesson or blog picture shows ONE literal, concrete scene that means exactly one thing: what the reader would actually see (a product page with many cursors clicking it at the same moment for "traffic spike"; a cache box and a DB box with one arrow for "cache miss"). No metaphors, no symbolic objects, no mascot unless the subject asks for it, no text; one idea per picture. The subject line describes the visible objects and the single action. The base prompt is `.starcistacks/brand/illustration.yaml` (v3).

## Flowcharts (owner-locked 2026-11-23)

A flowchart branches only at an if/else:

- A branch comes out of a decision node `{…?}` whose text asks the condition in words (`{Có giá trong Redis?}`), never out of an
  ordinary box.
- Each branch edge carries its own label at the split: `Có` / `Không` (`Yes` / `No` in the English files).
- The branches rejoin into the next step with plain arrows (`C --> R` and `D --> R`), so one arrow goes into the next node.
- An ordinary box never has two or more labelled outgoing edges. When both edges are always taken (a writer that does step 1 then
  step 2, a system diagram of who connects to whom), the words go in the nodes, not on the edges. A decision asks only the condition
  the lesson states; none is invented to make a branch.
- The renderer (Grammar's MermaidDiagram) warns in development about an ordinary box with two or more labelled outgoing edges.

The architecture on page 1 of an Essentials lesson is not drawn by hand: the app draws it from the lab manifest's `stack.services` and
`stack.deps`, each carrying an `icon` name ([../essentials/README.md](../essentials/README.md), [../essentials/lab.md](../essentials/lab.md)).
