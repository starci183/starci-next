# Rules: Mở đầu (owner-locked 2026-11-23, the "human version"; blog-voice form **(đề xuất)** 2026-11-24)

The owner's test: anyone who reads it understands it, and it is honest ("ai đọc cũng hiểu và thật tâm"). The opener stays a real
interview: five questions on one night, each one essence of the concept. Owner, on how it reads: "viết tự nhiên như blog ấy"; of the
old wording, "trò viết không giống tiếng Việt".

The 2026-11-23 form (numbered steps, a separate Kết quả line, a "Người phỏng vấn hỏi" block, a "Hệ thống liên quan" diagram, a fixed
eight-step Vì sao) read as a worksheet. The rules below replace it with the form the opener was rewritten in, a blog scene. Every
replaced rule is marked **(đề xuất)** and names what it replaces, so the owner can confirm or restore it. The two choices put to him
are decided (owner, 2026-11-24: "theo ý trò"): see "Owner decisions" at the end.

## 1. Situation (Bối cảnh)

- **(đề xuất)** One prose scene, a short paragraph in the voice of [../../shared/voice.md](../../shared/voice.md): what the business sees,
  what the system does, and the symptom with a number from the lesson's runs. It names the parts the way a developer says them: Redis,
  key, commit, retry, relay, cache, transaction. Replaces: "the system as at most three numbered steps" and "code, table and service
  names only in Chi tiết kỹ thuật".
- **(đề xuất)** Identifiers (table names, file paths, commands, `SELECT`, `processed_events`, service code names) stay out of the scene;
  they sit in the collapsed **Xem kỹ thuật** of Vì sao (§4). "Redis" is a part; `product:p-1` is an identifier.
- **(đề xuất)** The symptom and its number end the scene as a sentence ("Khách được cộng 499 điểm 12 lần."), not a separate
  **Kết quả:** line. Replaces: the Kết quả line. In `quiz.yaml`, `symptom` still holds that sentence, so the schema does not change.
- `event.text` is written without the time: the page shows `event.at` as the clock beside the question.
- Wrong (worksheet): "Mỗi lần nhận, dịch vụ tích điểm làm 3 bước: 1. Tra sổ… 2. Chưa thì cộng 499 điểm. 3. Ghi vào sổ… **Kết quả:**
  khách được cộng 499 điểm 12 lần."
- Right **(đề xuất)**: "Hệ thống thanh toán chưa nhận được xác nhận nên retry, và 12 event của cùng một đơn 499.000đ tới gần như cùng
  lúc. Event nào cũng tra bảng đã xử lý, thấy chưa có, cộng 499 điểm rồi mới ghi vào bảng. Khách được cộng 499 điểm 12 lần."
- No invented Vietnamese for a term: new text never writes one, and the seed's glossary and answer options are rewritten (owner
  decision 2 at the end, with the word list).
- Each question opens from the previous fix or from the load growing, so the five read as one night.

## 2. Question

- One line, and it **states its constraint**: "Sửa sao cho dù bao nhiêu event tới cùng lúc, điểm chỉ được cộng một lần?"
  **(đề xuất: wording)**
- Never a bare "Bạn sửa thế nào?". The constraint is what separates the right option from the plausible ones.
- **(đề xuất)** What the right option must satisfy is folded into the scene or the question, in the scenario's own facts, never naming
  the mechanism. Replaces: the separate `condition` line shown with the question in the "Người phỏng vấn hỏi" block (direction A, owner
  2026-11-23). The field stays optional in the schema; leave it empty when the scene already says it.

## 3. Options

- Four options, exactly one right. Each wrong one is something a normal engineer really picks ("gói vào transaction", "lock trong
  code", "chuyển bảng sang Redis").
- **(đề xuất)** A strawman is an option nobody would pick once they read the scene. An option that tempts under pressure is not one,
  even when it is wrong: "Tăng TTL lên 24 giờ" (cache, question 3) stays, because cutting load on the database by caching longer is
  what a tired engineer at 21:00 reaches for. Replaces: "no strawman ('tăng TTL lên 24 giờ')", which named that very option.
- Options stay short, about eight words (2026-11-22 ruling, kept). **(đề xuất)**
- Every option has its own one-sentence reason in plain words, shown under it when picked. A wrong pick locks; the right pick reveals all.

## 4. Vì sao (after the right answer only)

**(đề xuất)** In this order. Replaces the 2026-11-23 order (Chuyện gì đã xảy ra, Gốc rễ, Cách sửa bằng lời thường, diagram, Cái giá,
Code, Người phỏng vấn muốn biết, Trả lời phỏng vấn).

1. **The analogy**: one everyday picture of the fix, Vietnamese life ("giống bốc số thứ tự: chỉ một người cầm được số đó"). One or two
   sentences, and it says where it stops holding when that matters.
2. **The term**: the name developers use for what the analogy showed ("Kiểu lỗi này gọi là check-then-act."), glossed once if it is
   the term's first use.
3. **Cách sửa**: the fix in plain prose, subject and verb, a number from the runs where it helps.
4. **Xem kỹ thuật** (collapsed): what happened as steps (the two-column table, the faulty step marked), the explanation diagram
   ([diagrams.md](diagrams.md)), **Lưu ý** (what the fix costs, and when not to use it: every fix still has a cost, it just lives
   here), and the code: real lines from `source/` or `bugs/source/` with path and highlighted lines. The identifiers kept out of the
   scene (§1) are named here.
5. **Nói gọn**: one bold sentence the reader keeps. Replaces "Gốc rễ" (same job, moved to the end, where it reads as the take-away).

"Người phỏng vấn muốn biết" and "Trả lời phỏng vấn" (four beats) are kept and sit inside **Xem kỹ thuật**, after the code, never
before the answer (owner decision 1 at the end).

## 5. Terms and honesty

- First use of a term (TTL, `DEL`, replica, shard, tombstone, single-flight, bulkhead, idempotency key, lease) is a glossary term with a
  one-line definition that says what it does, in the words developers use ([../../shared/voice.md](../../shared/voice.md) §3.3); one
  glossary per lesson. **(đề xuất: the "what it does, no calque" part)**
- No invented numbers or claims. Every figure comes from the lesson's scenario runs; a sentence the data does not support is cut.

## Owner decisions (2026-11-24, "theo ý trò")

1. **"Người phỏng vấn muốn biết" and the four-beat "Trả lời phỏng vấn"** (Triệu chứng / Nguyên nhân / Cách sửa / Cái giá) move into the
   collapsed **Xem kỹ thuật**. They are not dropped.
2. **The calques in the seed are rewritten** in the new voice, in the glossary and the answer options of every lesson of
   `starci-next-seed-standard` that has them; no new text uses them.

   | Calque        | Write             |
   | ------------- | ----------------- |
   | sổ giá        | bảng giá trong DB |
   | lượt đọc      | request đọc       |
   | dấu xóa       | tombstone         |
   | người đưa thư | relay             |
   | hộp thư đi    | outbox            |
   | lời báo       | event, or message |
