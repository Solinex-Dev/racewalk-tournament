# Documentation

Documentation for the Racewalk Tournament tracking system.

## How to navigate

The docs are organized along four orthogonal axes plus supporting material:

| Folder | Axis | Answers |
|--------|------|---------|
| [product/](product/) | **What it is** | Concept, domain rules, terminology |
| [features/](features/) | **What it does** | Capabilities of the system (verbs) |
| [pages/](pages/) | **What users see** | Concrete UI surfaces (one doc per route) |
| [personas/](personas/) | **Who uses it** | Roles and the features they touch |
| [architecture/](architecture/) | **How it's built** | Tech stack, data model, data flow |
| [conventions/](conventions/) | **How we build** | Code style, component patterns |
| [operations/](operations/) | **How to run it** | Local setup, deployment |
| [decisions/](decisions/) | **Why** | Architecture Decision Records (ADRs) |

## Where to start

- **New to the project?** Read [product/overview.md](product/overview.md) → [product/domain-rules.md](product/domain-rules.md) → [features/README.md](features/README.md)
- **Looking for a specific screen?** [pages/README.md](pages/README.md) (sitemap + page index)
- **Understanding a user's journey?** [personas/README.md](personas/README.md) (role × feature matrix)
- **Setting up locally?** [operations/getting-started.md](operations/getting-started.md)
- **Want to know why X was done that way?** [decisions/README.md](decisions/README.md)

## Cross-linking convention

Docs link liberally. Every feature doc lists which roles use it, which pages implement it, and which entities it touches. Every page doc lists which features it surfaces. This turns the docs into a graph rather than isolated essays — pick any entry point and follow the links.

## Status conventions

When a doc describes something not yet implemented, it is marked:

- **Status: Implemented** — code exists and works
- **Status: UI only (mock data)** — UI exists, backed by `MOCK_*` constants
- **Status: Planned** — described in docs, no code yet

The system today is largely **UI only (mock data)**. The planned backend is Prisma + MySQL.
