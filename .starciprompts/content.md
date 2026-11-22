# Content rules

How StarCi Next writes a lesson. The reader is a developer (`audience: technical`), the language is Vietnamese with English terms, and the
lesson teaches one concept. Where a rule names a file, the file is in the content repository (`starci-next-seed-standard`,
`raw/essentials/<topic>/<lesson>/`), never in this app ([content concept](../.starciwork/concepts/content.md)).

## 1. Lesson title

- The title is the concept's keyword, **100% English**: "Distributed Cache", "Outbox Pattern", "Idempotency". Title case. **(đề xuất)**
  Owner, 2026-11-22: "title phải là tên từ khóa khái niệm (Distributed Cache - 100% eng)".
- Never a Vietnamese sentence as the title. Wrong: "Cache phân tán: đọc nhanh mà không bán sai giá". Right: "Distributed Cache".
- A one-line Vietnamese subtitle may follow the title: what the learner will be able to do, in one sentence. It is the lesson's
  `description` field. **(đề xuất)** Right: "Đọc nhanh mà không bán sai giá, kể cả lúc 5.000 request mỗi giây đổ về một key."
- The title is the same in `vi.md` and `en.md`. **(đề xuất)**
- Two concepts taught together keep both keywords: "Outbox + Idempotency" stays, "Outbox Pattern and Idempotency in Webhooks" does
  not. **(đề xuất)** At most four words. **(đề xuất)**

## 2. Images

- No hero image by default. A lesson page opens on its title and its first part, not on a picture.
- An illustration only when the lesson truly needs it to be understood: a flow, a timeline or an architecture a sentence cannot carry.
  Such a figure is a `mermaid` fence with its caption ("Hình N: …"), not a decorative image. **(đề xuất: mermaid before any drawn
  image)**
- Opener diagrams (owner, 2026-11-23): each opener question carries **0–1** Mermaid diagram, in exactly three places:
  1. once at the top of Mở đầu: the full system of the story (`flowchart LR`);
  2. per question, a small copy of that same system inside the collapsible Bối cảnh with the parts this question touches highlighted
     (no sequence there: it would give the answer away);
  3. in Vì sao, right after "Cách sửa bằng lời thường": the diagram of what happened or of the fix (`sequenceDiagram` or `flowchart`),
     the faulty step marked danger, the fix marked success.
  Every diagram has a one-line caption that says where to look ("Nhìn bước 2: lời báo 2 cũng thấy chưa cộng"). At most 4
  participants or 7 nodes; labels are the same plain words as the text ("Sổ", "Lời báo"), not table names. The app renders them through
  Grammar's MermaidDiagram (click to zoom; on a phone a sequence becomes a numbered step list).

## 3. The five parts

A lesson page has five parts, as tabs in this order (owner-approved 2026-11-21). Each part has one job; content of one part never
moves into another.

### 3.1 Mở đầu

One shared interview scenario and five questions asked in sequence on it (`sections/1-essential/quiz.yaml`, schema
`essentials-quiz@1`), each question one essence of the concept. Each question has **four plausible options**, and **every option carries a
one-sentence reason** (why it is right, or why it is wrong). A wrong pick is crossed out and locked, and the learner picks again; a right
pick reveals the reasons of all four options. Five right answers pass the opener. A wrong pick also points to its section of part 2
(`readSection`) and its scenario. **(đề xuất: keep these two links)** How each question reads is section 4 below.

### 3.2 Bản chất

Part 2 is written like an engineering blog post: it leads the reader through the opener's scenario, one mechanism at a time (the
symptom, why it happens, the mechanism that fixes it, the code), with real code the reader can copy, paste and run at home, and it closes
with a **"Mang về"** checklist: the few things to apply in their own system. Prose carries the reader from one mechanism to the next; a
section is never a bare list of facts.

The owner's lesson template (`sections/2-essence/vi.md` and `en.md`) stays the skeleton the post is written in, in this order
**(đề xuất: the blog voice fills the template; the "Mang về" checklist closes part 3 Tổng kết)**:

1. **Lời mở đầu**: a Senior/Mid dialogue, then "a correct flow must do N things", then what 2.1 and 2.2 cover.
2. **Các khái niệm cốt lõi**:
   - **2.1 Thực hành**: 2.1.1 source and clone; 2.1.2 architecture (a component, file and role table, a mermaid figure with its
     "Hình N:" caption); 2.1.3 code explanation (snippets with `// WHY` comments, each paragraph ending "Bản chất: …"); 2.1.4
     prerequisites and run; 2.1.5 test flows ("Luồng N": the command, the expected output, an italic "*Kết luận: …*"); 2.1.6 cleanup;
     2.1.7 further reading (real links); 2.1.8 asking AI through the lesson's MCP (its config and four sample questions).
   - **2.2 Lý thuyết**: 2.2.1 Bản chất (one bold sentence, then bullets "Vì sao quan trọng … Verify ở Luồng N"); 2.2.2 edge cases, each
     "**X:** the problem. **Giải pháp:** …".
3. **Tổng kết**: 3.1 interview questions, each with "Ý interviewer muốn nghe" and "Trả lời mẫu (ngắn)".

The source is one TypeScript program run directly by Node 24, with no library beyond Express and the unavoidable database drivers
(owner 2026-11-22: "code chạy không cài lib"): everything the part explains is written by hand and readable.

### 3.3 Tìm sạn

A buggy copy of the source (`bugs/source/`) with exactly five bugs, one per opener essence, in opener order; the learner fixes it until
every test passes through the relay. `bugs/tests.yaml` (schema `essentials-bugs@1`) has six tests: the happy path, one per bug, and a
final `ledger-under-chaos` that unlocks once the five pass. Each test carries:

- `fail`, "Vì sao chưa pass": the symptom and a guiding question, never the fix;
- `pass`, "Vì sao giờ đúng": shown only after it passes;
- three `hints`: the direction (the section), then the file, then the line.

### 3.4 Challenges

The ladder of `sections/4-apply/challenges.yaml`, its mechanism unchanged. Each tier's two essence questions are interviewer push-back
questions ("Nếu Redis chết thì sao?"), and from the Khó tier up the learner also writes a short explanation.

### 3.5 Pattern

Where the concept lives in a real framework (`sections/5-patterns/patterns.yaml`, schema `essentials-patterns@1`), per stack (nestjs, go,
spring, dotnet; `ready` or `soon`): three answers, `where` (where it sits in the code), `howFar` (how far the framework goes) and
`whenDown` (what happens when it fails), with its files and one snippet. Not graded.

## 4. Opener interview

It reads like a real interview: short questions, short answers. The owner criticized the current openers on 2026-11-22 for long
paragraphs in the story, the prompts and the explanations.

- **The scenario is one line of context.** The story is one sentence; each question's moment adds one line at most. Right: "Flash sale
  0h ở Bếp Xanh: 5.000 request mỗi giây vào một trang sản phẩm, giá đọc qua Redis (cache-aside, TTL 30 giây)." Wrong: a paragraph that
  explains the shop, the ads and the cache before any question.
- **The question is one line.** Right: "Giá mới đã ghi, sao trang vẫn hiện giá cũ nửa phút?" Wrong: two sentences of setup and then the
  question.
- **Options are a few words each.** Right: "Race giữa đọc nạp lại và `DEL`", "Replica chậm", "TTL quá dài", "Xóa cache trước khi ghi
  DB". Wrong: a full sentence that explains the mechanism inside the option. At most about eight words. **(đề xuất)**
- **Four plausible options.** Each is a mistake a real candidate makes, so none is ruled out by its wording alone.
- **Each option's reason is one sentence**: for a wrong one, why it does not explain the symptom; for the right one, the mechanism.
  Right: "Replica chậm vài mili giây, không phải nửa phút." Wrong: a paragraph that also teaches the right answer. A wrong pick shows
  its reason; the right pick shows all four.
- **Answers are simple, like a real interview.** No trick options, no option that is right "in theory"; exactly one option is right.
  **(đề xuất)**
- The insight after a right answer stays short: the essence in one sentence, the why in at most three, the interview answer as one
  sentence a candidate would say aloud. **(đề xuất)**
- Numbers come from the lesson's real scenarios (`scenarios.yaml`), never invented. **(đề xuất, as the current openers already do)**

### 4.1 The human version (owner-locked 2026-11-23)

The owner's test: anyone who reads it understands it, and it is honest. It narrows section 4 as follows; where they differ, this
subsection wins (it is the later ruling).

- **Business story first, numbered steps.** The situation is told as the business lives it (bepxanh.com, Mây Coffee), then what the
  system does as **numbered steps** (at most three, one line each), then a **Kết quả** line with the real symptom. Code and table names
  only in a collapsed **Chi tiết kỹ thuật** line ("dịch vụ tích điểm = Loyalty · sổ = bảng `processed_events`"). Wrong: "Loyalty
  `SELECT` khóa trong `processed_events`, chưa có thì cộng điểm rồi `INSERT` khóa." Right: "Mỗi lần nhận, dịch vụ tích điểm làm 3 bước:
  1. Tra sổ… 2. Chưa thì cộng 499 điểm. 3. Ghi vào sổ…"
- **The question states its constraint.** Wrong: "Bạn sửa thế nào?". Right: "Sửa sao cho dù bao nhiêu lời báo tới cùng lúc, điểm chỉ
  được cộng một lần?". The constraint is what separates the right option from the plausible ones.
- **Distractors are what a normal engineer really picks** ("gói vào transaction", "khóa trong code", "chuyển sổ sang Redis"), each with
  its own one-sentence why-not in plain words, shown under it when picked.
- **Vì sao, after the right answer, in this order:** Chuyện gì đã xảy ra (two columns of numbered steps side by side, the faulty step in
  danger) → **Gốc rễ** (one bold sentence) → **Cách sửa bằng lời thường** (an everyday analogy is welcome: "giống bốc số thứ tự") → the
  diagram (section 2) → **Cái giá** (what the fix costs) → **Code** (collapsed; real lines from the lesson's `solution/` or `bugs/`, with
  file path and highlighted lines, never invented) → **Người phỏng vấn muốn biết** → **Trả lời phỏng vấn** in four beats: Triệu chứng /
  Nguyên nhân / Cách sửa / Cái giá.
- **"Người phỏng vấn muốn biết" never appears before the answer:** it names the skill tested, which gives the answer away.
- **The five questions are one night.** Each question opens from the previous fix ("Bạn đã gắn version. 0h tới, …").
- **Glossary.** The first use of a term (TTL, `DEL`, replica, shard, tombstone, single-flight, bulkhead, idempotency key, lease) is a
  glossary term with a one-line definition (dotted, hover or tap); one glossary per lesson.
- **No invented numbers or claims.** Every figure comes from the lesson's real scenario runs; a sentence the data does not support is
  cut.
- **Open with the owner (đề xuất):** section 4's "options at most about eight words" and "insight: why in at most three sentences" are
  kept for the options and the essence line; the longer Vì sao above is the owner's later choice for after the answer.

## 5. Technical audience

StarCi Next declares `audience: technical` (harness `contexts/ui/content.md` CONTENT-2): technical terms are allowed, and each finding
is led by the human sentence, the code after it. Right: "Deploy chờ database rồi bỏ cuộc sau 60 giây", then the exit code and the log
line. Wrong: the log line alone.

Technical terms stay English (cache-aside, TTL, outbox, retry, single-flight), each with a short Vietnamese gloss on its first use in a
lesson: "single-flight (gộp các lượt đọc trùng thành một truy vấn)". After that, the term alone. The sentence around them is
Vietnamese.

## 6. Vietnamese

All learner-facing Vietnamese goes through four passes, in this order: translationese-cleaner-vi, humanizer-vi, style-guide-vi,
grammar-checker-vi. Terms:
"xóa", "khóa", "bảo đảm", "chống trùng". Thousands take a dot: 499.000đ.
