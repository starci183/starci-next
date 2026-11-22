# Diagrams: Mở đầu (owner-locked 2026-11-23)

Each question carries 0–1 explanation diagram. Diagrams sit in exactly three places:

1. **Once, at the top of Mở đầu**: the full system of the story, `flowchart LR` (who calls whom, the stores, the outside service).
2. **Per question, inside Bối cảnh**: the same system, small, with the parts this question touches listed in `contextHighlight[]`. No
   sequence here: it would give the answer away.
3. **In Vì sao, right after "Cách sửa bằng lời thường"**: what happened or the fix, `sequenceDiagram` (order of events) or `flowchart`
   (a decision or a split). Mark the faulty step `:::danger` and the fix `:::success`.

Rules:
- Every diagram has a one-line caption saying where to look: "Nhìn bước 2: lời báo 2 cũng thấy chưa cộng."
- At most 4 participants or 7 nodes; more → split into two or cut.
- Labels use the same plain words as the text ("Sổ", "Lời báo", "Dịch vụ tích điểm"), not table names.
- Words before picture: the reader reads the fix in words, then the diagram confirms it.
- The app renders through Grammar's MermaidDiagram (click to zoom; on a phone a sequence becomes a numbered step list, a flowchart
  stacks vertically). Never draw what the renderer can't show.
