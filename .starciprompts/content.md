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

## 3. The five parts

A lesson page has five parts, as tabs in this order (owner-approved 2026-11-21). Each part has one job; content of one part never
moves into another.

### 3.1 Mở đầu

Five interview questions on one story (`sections/1-essential/quiz.yaml`, schema `essentials-quiz@1`): one situation, five moments of it,
each moment one essence of the concept. A wrong choice shows its "vì sao sai", locks that choice and lets the learner choose again, and
points to its section of part 2 (`readSection`) and its scenario. A right choice shows the insight. Five right answers pass the opener.
How each question reads is section 4 below.

### 3.2 Bản chất

Practice-led reading in the owner's lesson template (`sections/2-essence/vi.md` and `en.md`), in this order:

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
- **"Vì sao sai" is one sentence**: why this choice does not explain the symptom. Right: "Replica chậm vài mili giây, không phải nửa
  phút." Wrong: a paragraph that also teaches the right answer.
- **Answers are simple, like a real interview.** No trick options, no option that is right "in theory"; exactly one option is right.
  **(đề xuất)**
- The insight after a right answer stays short: the essence in one sentence, the why in at most three, the interview answer as one
  sentence a candidate would say aloud. **(đề xuất)**
- Numbers come from the lesson's real scenarios (`scenarios.yaml`), never invented. **(đề xuất, as the current openers already do)**

## 5. Technical audience

StarCi Next declares `audience: technical` (harness `contexts/ui/content.md` CONTENT-2): technical terms are allowed, and each finding
is led by the human sentence, the code after it. Right: "Deploy chờ database rồi bỏ cuộc sau 60 giây", then the exit code and the log
line. Wrong: the log line alone. English terms stay English where a developer says them in English (cache-aside, TTL, outbox, retry);
the sentence around them is Vietnamese. **(đề xuất)**

## 6. Vietnamese

Every Vietnamese string goes through the translationese-cleaner-vi, grammar-checker-vi, style-guide-vi and humanizer-vi passes. Terms:
"xóa", "khóa", "bảo đảm", "chống trùng". Thousands take a dot: 499.000đ.
