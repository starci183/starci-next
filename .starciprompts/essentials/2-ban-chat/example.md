# Example: real passages of a current Bản chất

Quoted verbatim (headings moved to this page's levels) from the content repository `starci-next-seed-standard`, branch `content/lessons-3` at `8525be9`,
`raw/essentials/api-reliability/outbox-idempotency/sections/2-essence/vi.md`. Use them for voice and length: the symptom, why it
happens, the mechanism, then the code; the numbers come from that lesson.

## The opening: the night, the symptom, the mechanism (lines 19–25)

### 1. Đêm Black Friday: 37 khách thiếu điểm, một khoản tiền vào sổ ba lần

21:03, Mây Coffee đang chạy Black Friday, khoảng 3.000 đơn mỗi giờ. Team đẩy một bản vá, Kubernetes rolling restart lần lượt tắt từng pod. Không ai thấy gì bất thường cho tới sáng hôm sau: 37 khách nhắn fanpage rằng họ đã trả 499.000đ mà tài khoản không có 499 điểm.

Log cho thấy cả 37 đơn đều đã `paid`. Handler làm đúng hai việc theo thứ tự: `COMMIT` đơn sang `paid`, rồi gọi HTTP sang dịch vụ Loyalty. Pod bị tắt đúng giữa hai việc đó. Không còn ai nhớ rằng Loyalty vẫn đang chờ một tin nhắn.

Đây là **dual write**: ghi vào hai hệ thống (database của bạn và Loyalty) mà không có transaction nào bao cả hai. Cách sửa là **transactional outbox**: ghi “phải báo Loyalty” thành một dòng dữ liệu, commit cùng đơn, rồi để một relay gửi đi.

## One mechanism: root, fix, then code (lines 93–97)

### 2.1.3.1. 21:03 · Dual write và bảng outbox

Gốc rễ của 37 khách thiếu điểm: việc “phải báo Loyalty” chỉ sống trong bộ nhớ của process. Process chết là nó biến mất. Đảo thứ tự cũng không cứu được: gọi Loyalty trước rồi chết trước `COMMIT` thì khách có điểm cho một đơn chưa trả tiền.

Cách sửa là biến việc đó thành dữ liệu. Thêm bảng `outbox` vào **cùng database** với `orders`, rồi ghi sự kiện trong cùng transaction với việc đổi đơn. Hai dòng cùng commit hoặc cùng rollback, nên không còn khoảnh khắc nào đơn đã `paid` mà lời hứa gửi tin chưa có.

The section then shows the code and closes on its essence (line 144):

Bản chất: không đòi hai lần ghi cùng thành công; chỉ ghi một lần, vào database của mình, và để phần “gửi đi” thành việc làm lại được.

## A test flow ends with its conclusion (line 477)

*Kết luận: process chết ngay sau `COMMIT` mà sự kiện vẫn tới Loyalty, vì nó đã là một dòng của outbox. Tắt `GUARD_OUTBOX` thì sổ báo `missing 1`: đúng chuyện của 37 khách.*
