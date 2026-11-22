# Rules: Tìm sạn

A buggy copy of the source (`bugs/source/`) with exactly five bugs, one per opener essence, in opener order; the learner fixes it until
every test passes through the relay. `bugs/tests.yaml` (schema `essentials-bugs@1`) has six tests: the happy path, one per bug, and a
final `ledger-under-chaos` that unlocks once the five pass. Each test carries:

- `fail`, "Vì sao chưa pass": the symptom and a guiding question, never the fix;
- `pass`, "Vì sao giờ đúng": shown only after it passes;
- three `hints`: the direction (the section), then the file, then the line.
