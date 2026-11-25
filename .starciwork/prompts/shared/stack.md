# Stack and commands

One language: TypeScript on Express, run directly by Node 24, with the logic written by hand. Owner, 2026-11-23: "viết logic thô", so the
learner sees every mechanism (single-flight, a versioned SET, an L1 copy, a circuit breaker, a bulkhead…) in plain code. A lesson's source
uses Express 5 and the database drivers it cannot avoid (`pg`, `ioredis`), nothing else; no framework (NestJS) and no library that hides
the mechanism (`cache-manager`). Lessons are never written in four languages; the old StarCi Academy lessons lend their writing style only.

Commands are given in the bash and curl form. Add a PowerShell line only where it differs in a way that matters (not for every command);
Windows readers run the bash form in Git Bash or WSL, and the lab block says so.
