# Images and diagrams

- No hero image by default. A lesson page opens on its title and its first part, not on a picture.
- An illustration only when the lesson truly needs it to be understood: a flow, a timeline or an architecture a sentence cannot carry.
  Such a figure is a `mermaid` fence with its caption ("Hình N: …"), not a decorative image. **(đề xuất: mermaid before any drawn
  image)**

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

The opener's diagrams (where they sit, their size, labels and captions, the renderer) are owner-locked in
[../essentials/1-mo-dau/diagrams.md](../essentials/1-mo-dau/diagrams.md).
