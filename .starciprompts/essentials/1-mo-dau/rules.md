# Rules: Mở đầu (owner-locked 2026-11-23, the "human version")

The owner's test: anyone who reads it understands it, and it is honest ("ai đọc cũng hiểu và thật tâm"). The opener stays a real
interview: five questions on one night, each one essence of the concept.

## 1. Situation (Bối cảnh)

- Business story first, in the words the business lives it. Then what the system does as **numbered steps**, at most three, one line
  each. Then **Kết quả**: the symptom, with a number from the lesson's runs.
- Code, table and service names only in a collapsed **Chi tiết kỹ thuật** line.
- Wrong: "Loyalty `SELECT` khóa trong `processed_events`, chưa có thì cộng điểm rồi `INSERT` khóa. 12 bản trùng của cùng một sự kiện
  tới gần như cùng lúc."
- Right: "Hệ thống gửi lại lời báo, và lần này 12 lời báo của cùng một đơn tới gần như cùng lúc. Mỗi lần nhận, dịch vụ tích điểm làm 3
  bước: 1. Tra sổ… 2. Chưa thì cộng 499 điểm. 3. Ghi vào sổ… **Kết quả:** khách được cộng 499 điểm 12 lần."
- Each question opens from the previous fix or from the load growing, so the five read as one night.

## 2. Question

- One line, and it **states its constraint**: "Sửa sao cho dù bao nhiêu lời báo tới cùng lúc, điểm chỉ được cộng một lần?"
- Never a bare "Bạn sửa thế nào?". The constraint is what separates the right option from the plausible ones.

## 3. Options

- Four options, exactly one right. Each wrong one is something a normal engineer really picks ("gói vào transaction", "khóa trong code",
  "chuyển sổ sang Redis"); no strawman ("tăng TTL lên 24 giờ").
- Options stay short, about eight words (2026-11-22 ruling, kept). **(đề xuất)**
- Every option has its own one-sentence reason in plain words, shown under it when picked. A wrong pick locks; the right pick reveals all.

## 4. Vì sao (after the right answer only), in this order

1. **Chuyện gì đã xảy ra**: two columns of numbered steps side by side (e.g. Lời báo 1 / Lời báo 2), the faulty step in danger.
2. **Gốc rễ**: one bold sentence. "Tra sổ và ghi sổ là hai bước tách rời, nên ở giữa có một khe."
3. **Cách sửa bằng lời thường**: an everyday analogy is welcome ("giống bốc số thứ tự: chỉ một người cầm được số đó").
4. The explanation diagram (diagrams.md), with its one-line caption.
5. **Cái giá**: what the fix costs. Every fix has one; a fix without a cost is not finished.
6. **Code**: collapsed; real lines from `solution/` or `bugs/source/` with file path and highlighted lines.
7. **Người phỏng vấn muốn biết**: the skill the question tests. Never before the answer: it names the answer.
8. **Trả lời phỏng vấn** in four beats: Triệu chứng / Nguyên nhân / Cách sửa / Cái giá.

## 5. Terms and honesty

- First use of a term (TTL, `DEL`, replica, shard, tombstone, single-flight, bulkhead, idempotency key, lease) is a glossary term with a
  one-line definition; one glossary per lesson.
- No invented numbers or claims. Every figure comes from the lesson's scenario runs; a sentence the data does not support is cut.
