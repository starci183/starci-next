# StarCi Relay

Lệnh `starci-relay` chạy lab và kịch bản của StarCi Next ngay trên máy của bạn, rồi gửi kết quả về trang bài học.

```bash
npm i -g @starci/next-relay
starci-relay login
```

Cần Node.js 22 trở lên.

| Lệnh | Việc nó làm |
| --- | --- |
| `starci-relay --version` | In phiên bản đang cài |
| `starci-relay status` | Cho biết máy đã nối tài khoản chưa và Relay có tự chạy khi đăng nhập không |
| `starci-relay login` | In mã 8 ký tự để nhập ở trang Máy của bạn |
| `starci-relay pair <mã>` | Nối máy bằng mã sao chép từ trang Máy của bạn, rồi tạo khoá thiết bị để máy ký kết quả chấm lab |
| `starci-relay listen` | Nhận yêu cầu chạy từ StarCi (kịch bản, lab) và chạy sau khi bạn đồng ý |
| `starci-relay install-service` | Bật Relay tự chạy khi đăng nhập, ở mức người dùng, không cần quyền admin |
| `starci-relay uninstall-service` | Tắt tự chạy |
| `starci-relay run`, `pull`, `up`, `check` | Chạy bài như trang bài học hướng dẫn |
| `starci-relay lab start <khoá>/<bài> [--dir <thư mục>]` | Chọn thư mục cho lab (mặc định `~/starci/<khoá>/<bài>`) rồi chờ trang bài học bấm Bắt đầu |
| `starci-relay case list` | Các case của lab ở thư mục này, theo thứ tự học, với kết quả lần chạy gần nhất |
| `starci-relay case run <id>` | Chạy case đó cùng mọi case đứng trước nó |
| `starci-relay case diff <id>` | Khi case đã xanh: bản sửa tham chiếu của case đó trên file bạn sửa |
| `starci-relay case reset-to <id>` | Khi bí: lưu bài của bạn ở nhánh `cua-toi-luu-<id>`, rồi commit file bạn sửa ở bậc tham chiếu của case |
| `starci-relay mcp [--dir <thư mục lab>]` | MCP của lab cho trợ lý trong editor (xem dưới) |

## MCP của lab

`starci-relay mcp` là một MCP server (stdio) cho lab ở thư mục hiện tại: nó đọc `starci-lab.yaml` của lab và cho trợ lý các tool
`lesson_context`, `case_list`, `case_run`, `case_status`, `inspect`, `hint` và `explain`. Nó không bao giờ đọc bậc tham chiếu, nhánh `main`
hay bộ chấm, chỉ gọi các view chỉ-đọc trên localhost mà lab khai báo, và chỉ giải thích những khái niệm bài này đã tới.

Claude Code (chạy trong thư mục lab):

```bash
claude mcp add starci-lab -- starci-relay mcp
```

Cursor (`.cursor/mcp.json` trong thư mục lab):

```json
{ "mcpServers": { "starci-lab": { "command": "starci-relay", "args": ["mcp", "--dir", "${workspaceFolder}"] } } }
```

Codex (`~/.codex/config.toml`, thay đường dẫn bằng thư mục lab của bạn):

```toml
[mcp_servers.starci-lab]
command = "starci-relay"
args = ["mcp", "--dir", "/home/ban/starci/shop-giay/saga-compensation"]
```

Cập nhật: `npm i -g @starci/next-relay@latest`. Gỡ: `starci-relay uninstall-service`, rồi `npm rm -g @starci/next-relay`.

Hướng dẫn đầy đủ nằm ở mục Trợ giúp, bài "Cài StarCi Relay", trong StarCi Next.
