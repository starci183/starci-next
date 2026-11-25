# Diagrams: Mở đầu (owner-locked 2026-11-23)

Each question carries 0–1 explanation diagram. Diagrams sit in exactly two places **(đề xuất)** (the 2026-11-23 rule had three; the per-question
"Hệ thống liên quan" diagram is dropped, see item 2):

1. **Once, at the top of Mở đầu**: the full system of the story, `flowchart LR` (who calls whom, the stores, the outside service).
2. ~~**Per question, "Hệ thống liên quan"**~~ **(đề xuất)**: dropped. The prose scene ([rules.md](rules.md) §1) names the parts the question
   touches, so a picture of them before the options repeats it. Leave `contextDiagram` and `contextCaption` empty. The old rule, kept
   for the owner to restore: the same system, small, with only the parts this question touches, named in `contextCaption`. Blocks and plain arrows only: no sequence, no order of events and no edge
   label or node name that names the mechanism ("request đọc chậm", "ghi lại sau khi xóa"): it would give the answer away.
3. **In Vì sao, inside the collapsed "Xem kỹ thuật"** **(đề xuất)** (was: right after "Cách sửa bằng lời thường"): what happened or the fix, `sequenceDiagram` (order of events) or `flowchart`
   (an if/else: it branches only out of a `{…?}` decision that asks the condition, its edges labelled `Có` / `Không`, the branches
   rejoining the next step with plain arrows, as [../../shared/diagrams.md](../../shared/diagrams.md) "Flowcharts" says). Point the caption at the faulty or deciding step; the faulty step of "Chuyện gì đã xảy ra" carries `fault: true`. Mermaid tone classes
   (`:::danger`, `:::success`) wait for Grammar: its MermaidDiagram does not paint them yet.

Rules:

- Every diagram has a one-line caption saying where to look: "Nhìn bước 2: event 2 cũng thấy chưa cộng." **(đề xuất)**
- At most 4 participants or 7 nodes; more → split into two or cut.
- A flowchart, wherever it sits, follows [../../shared/diagrams.md](../../shared/diagrams.md) "Flowcharts": no ordinary box has two or
  more labelled outgoing edges, so the system diagram's words for an always-taken edge sit in the nodes.
- Labels use the same plain words as the text ("Bảng đã xử lý", "Event 1", "Dịch vụ tích điểm"), not table names. **(đề xuất)** (was "Sổ",
  "Lời báo": calques, see [../../shared/voice.md](../../shared/voice.md) §3.2)
- Words before picture: the reader reads the fix in words, then the diagram confirms it.
- The app renders through Grammar's MermaidDiagram (click to zoom; on a phone a sequence becomes a numbered step list, a flowchart
  stacks vertically). Never draw what the renderer can't show.
