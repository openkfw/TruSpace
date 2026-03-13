# Architecture Documentation

This folder contains TruSpace architecture documentation, including:

- **Current Architecture** — descriptions of the existing system (DB, backend, frontend, IPFS, AI, etc.)
- **Established Workflows** — approved, implemented workflows
- **Proposed Workflows** — drafts or experimental workflows under discussion
- **Architecture Decisions (ADRs)** — rationale behind design choices
- **Diagrams** — visual representations of workflows and architecture

It centralizes discussions, provides historical context, and supports collaboration on architectural decisions.

---

## Folder Structure

```
doc/architecture/
├─ README.md                                 # This overview file
├─ current/                                  # Documentation of the existing architecture
├─ workflows/
│   ├─ established/                          # Approved, implemented workflows
│   └─ proposed/                             # Draft or experimental workflows under discussion
├─ decisions/                                # Architecture Decision Records (ADRs)
└─ diagrams/                                 # Diagrams organized per issue or topic
    ├─ <issue-number>-<short-title>/
    │   ├─ <issue-number>-<short-title>.mmd   # Editable Mermaid source
    │   └─ <issue-number>-<short-title>.png   # Exported image for Markdown or presentations
    └─ ...
```

---

## Workflow for Diagrams

All diagrams are stored per issue or feature in:

```
doc/architecture/diagrams/<issue-number>-<short-title>/
```

Each folder contains:

1. **Mermaid source** (`.mmd`) — editable, version-controlled
2. **Rendered image** (`.png` or `.svg`) — used in Markdown previews or external documentation

### Generating an image from a Mermaid file

To generate an image from a Mermaid source file, install the **Mermaid CLI globally**:

```bash
# Install Mermaid CLI globally
npm install -g @mermaid-js/mermaid-cli
```

Generate an image from the Mermaid source:

```bash
# Generate PNG from Mermaid source
mmdc -i doc/architecture/diagrams/<issue-folder>/<file>.mmd \
     -o doc/architecture/diagrams/<issue-folder>/<file>.png
```

Reference the generated image in Markdown:

```markdown
![Workflow Description](../diagrams/<issue-folder>/<file>.png)
```


## Current Architecture vs Workflows

- **Current Architecture (`current/`)**:  
  Detailed description of the existing system, including databases, backend, frontend, decentralized storage, AI components, and how they interact.

- **Workflows (`workflows/`)**:  
  Step-by-step processes for system operations or feature flows.
    - **Established**: Approved and implemented workflows
    - **Proposed**: Drafts or experimental workflows under discussion

This separation helps distinguish **what exists** from **what is being planned or debated**.

---

## Architecture Decision Records (ADRs)

The `decisions/` folder contains formal ADRs describing **why** a particular design decision was made, including context, alternatives considered, and trade-offs.

- Each ADR should have a unique identifier, title, status (proposed/accepted/archived), and rationale
- Example naming convention: `001-use-ipfs-for-document-storage.md`

---

## How to Contribute

1. Document current architecture in the `current/` folder.
2. Add new workflows to `workflows/proposed/` as Markdown files.
3. Include Mermaid diagrams inline or as referenced images from `diagrams/`.
4. Once a workflow is approved, move it to `workflows/established/`.
5. Document architecture decisions in `decisions/`.
6. Regenerate images from `.mmd` files using the Mermaid CLI whenever workflows are updated.

---

## Notes

- Keep Mermaid source files and exported images together in the same folder for each issue/feature.
- Use meaningful folder names: `<issue-number>-<short-title>` (e.g., `292-private-workspace-permissions`)
- This structure ensures traceability, version control, and easier collaboration.
- Separating `current` architecture from workflows keeps a clear distinction between **what exists** and **what is proposed**.
