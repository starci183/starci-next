# StarCi Relay

The `starci-relay` command runs the labs and scenarios of StarCi Next on your own machine, then sends the results back to the lesson page.

```bash
npm i -g @starci/next-relay
starci-relay login
```

It needs Node.js 22 or later.

| Command | What it does |
| --- | --- |
| `starci-relay --version` | Prints the installed version |
| `starci-relay status` | Says whether the machine is linked to your account and whether Relay starts on its own when you sign in |
| `starci-relay login` | Prints an 8-character code to enter on the Your machines page |
| `starci-relay pair <code>` | Links the machine with a code copied from the Your machines page, then creates the device key the machine signs lab grading results with |
| `starci-relay listen` | Takes run requests from StarCi (scenarios, labs) and runs each one after you agree |
| `starci-relay install-service` | Makes Relay start on its own when you sign in, at user level, with no admin rights |
| `starci-relay uninstall-service` | Turns that start off |
| `starci-relay run`, `pull`, `up`, `check` | Runs the lesson the way the lesson page guides you |
| `starci-relay lab start <course>/<lesson> [--dir <folder>]` | Picks the folder of the lab (by default `~/starci/<course>/<lesson>`), then waits for the lesson page to press Start |
| `starci-relay case list` | The cases of the lab in this folder, in learning order, with the result of their latest run |
| `starci-relay case run <id>` | Runs that case and every case before it |
| `starci-relay case diff <id>` | Once the case is green and StarCi has recorded it: the reference fix of that case on the file you edit (fetched from StarCi) |
| `starci-relay case reset-to <id>` | When you are stuck: saves your work on the branch `cua-toi-luu-<id>`, then fetches from StarCi the file you edit at the case's reference step and commits it (StarCi records the reset) |
| `starci-relay mcp [--dir <lab folder>]` | The lab's MCP server for the assistant in your editor (see below) |

## The lab's MCP server

`starci-relay mcp` is an MCP server (stdio) for the lab in the current folder: it reads the lab's `<lab folder>/starci-lab.yaml` and gives the
assistant the tools `lesson_context`, `case_list`, `case_run`, `case_status`, `inspect`, `hint` and `explain`. It never reads the reference
steps, the `main` branch or the grader, only calls the read-only views on localhost the lab declares, and only explains the concepts this
lesson has reached.

Claude Code (run in the lab folder):

```bash
claude mcp add starci-lab -- starci-relay mcp
```

Cursor (`<lab folder>/.cursor/mcp.json`):

```json
{ "mcpServers": { "starci-lab": { "command": "starci-relay", "args": ["mcp", "--dir", "${workspaceFolder}"] } } }
```

Codex (`~/.codex/config.toml`, with the path replaced by your lab folder):

```toml
[mcp_servers.starci-lab]
command = "starci-relay"
args = ["mcp", "--dir", "/home/you/starci/shop-giay/saga-compensation"]
```

Update: `npm i -g @starci/next-relay@latest`. Remove: `starci-relay uninstall-service`, then `npm rm -g @starci/next-relay`.

The full guide is in the Help section of StarCi Next, in the article on installing StarCi Relay.
