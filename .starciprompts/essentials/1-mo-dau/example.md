# Example: one finished opener question (owner-approved 2026-11-23; blog-voice form **(đề xuất)** 2026-11-24)

Outbox & Idempotency, question 4. Use it for voice and length; the numbers (499.000đ, 499 điểm, 12 event) come from that lesson. The
facts, options and reasons are the owner-approved ones. The form follows [rules.md](rules.md) as revised **(đề xuất)**: one prose
scene instead of numbered steps and a Kết quả line, no "Hệ thống liên quan" diagram, Vì sao as analogy, term, Cách sửa, Xem kỹ thuật,
Nói gọn. The words follow [../../shared/voice.md](../../shared/voice.md): the approved text said "lời báo" for event and "sổ" for the
table, two calques the owner's "trò viết không giống tiếng Việt" is about.

**23:15 · Câu 4 / 5 · Mây Coffee, đêm Black Friday**

## Bối cảnh

Khách trả 499.000đ cho một đơn. Hệ thống thanh toán gửi event "đơn đã trả tiền" sang dịch vụ tích điểm, chưa thấy xác nhận thì retry,
và lần này 12 event của cùng đơn đó tới gần như cùng lúc. Event nào cũng tra bảng đã xử lý, thấy chưa có, cộng 499 điểm rồi mới ghi
vào bảng. Khách được cộng 499 điểm 12 lần.

## Câu hỏi

Sửa sao cho dù bao nhiêu event tới cùng lúc, điểm chỉ được cộng một lần?

|       | Đáp án                                       | Lý do                                                                               |
| ----- | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| A     | Gói 3 bước vào một transaction               | Không ngăn 12 event cùng tra bảng ở bước đầu: lúc đó bảng chưa có dòng nào để lock. |
| **B** | **Ghi vào bảng trước, bảng không cho trùng** | **Chỉ một event ghi được; các event sau thấy "đã có".**                             |
| C     | Lock trong code quanh handler                | Chỉ chặn được trong một máy; dịch vụ chạy nhiều máy.                                |
| D     | Chuyển bảng sang Redis, tra trước khi cộng   | Vẫn là tra rồi mới làm; bảng và điểm lại không ghi cùng nhau.                       |

## Vì sao

Giống bốc số thứ tự ở quầy: chỉ một người cầm được số đó, người đến sau với cùng số bị trả về.

Kiểu lỗi ở đây gọi là check-then-act: tra rồi mới làm, và giữa hai bước có một khe cho 12 event cùng lọt qua.

**Cách sửa.** Đảo thứ tự: ghi mã đơn vào bảng trước, và bảng không cho ghi trùng một mã. Event nào ghi được thì cộng điểm. Event đến
sau thấy "đã có", nên trả lại đúng kết quả lần đầu mà không cộng nữa. Ghi bảng và cộng điểm nằm chung một transaction, nên máy chết
giữa chừng thì cả hai cùng hủy.

> **Xem kỹ thuật** (thu gọn)
>
> |     | Event 1             | Event 2                 |
> | --- | ------------------- | ----------------------- |
> | 1   | Tra bảng: chưa cộng | Tra bảng: chưa cộng     |
> | 2   | Cộng 499 điểm       | Cộng 499 điểm (lần hai) |
> | 3   | Ghi bảng: đã cộng   | Ghi bảng: đã cộng       |
>
> The sequence diagram of the fix: Event 1, Bảng đã xử lý, Event 2; event 2 "Ghi cùng mã: chờ", then "Đã có: trả kết quả cũ".
> Caption: _Nhìn bước 2: event 2 phải chờ, không tự tra bảng được nữa._
>
> Tên trong code: dịch vụ tích điểm là Loyalty, bảng đã xử lý là `processed_events`, bước tra là `SELECT`, bước ghi là `INSERT` idempotency
> key dưới unique constraint.
>
> **Lưu ý.** Event trùng xếp hàng chờ event đầu lưu xong. Bảng lớn dần, phải dọn những mã cũ quá thời gian hệ thống thanh toán còn có
> thể gửi lại.
>
> **Code**: the real lines from the lesson's `source/`, path and range, highlighted lines.
>
> _Open for the owner (rules.md, end): keep or drop these two._ **Người phỏng vấn muốn biết.** Bạn có nhận ra kiểu lỗi "tra rồi mới
> làm" ở bất cứ đâu (tồn kho, tên đăng ký, chống trùng), và biết để database phân xử thay vì code. **Trả lời phỏng vấn:** một đơn
> được cộng điểm 12 lần / check-then-act, 12 event cùng tra bảng thấy chưa có / `INSERT` idempotency key trước dưới unique constraint,
> cùng transaction với việc cộng điểm / event trùng xếp hàng sau một row lock, phải dọn key cũ.

**Nói gọn: đừng tra rồi mới ghi; ghi trước và để database chặn bản trùng.**
