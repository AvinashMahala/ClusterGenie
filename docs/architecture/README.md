# Architecture docs — ClusterGenie

This directory contains architecture documentation and diagrams for ClusterGenie.

Files:
- `HLD.md` — High-Level Design with mermaid diagram inlined
- `LLD.md` — Low-Level Design with detailed component and sequence diagrams
- `diagrams/` — raw mermaid diagram files which can be previewed with a mermaid renderer or on GitHub if supported (or using a VS Code mermaid preview extension).

ASCII alternatives:
- `diagrams/HLD_ascii.txt` — plain-text version of the HLD diagram (good for terminals and editors without Mermaid support)
- `diagrams/LLD_component_ascii.txt` — plain-text LLD component diagram
- `diagrams/job_sequence_ascii.txt` — plain-text job-processing sequence diagram

Preview options:
- VS Code: Install a Mermaid diagram preview extension and open `*.mmd` or `*.md` files.
- Command-line (if you want PNG/SVG outputs): install `mmdc` (Mermaid CLI) — `npm i -g @mermaid-js/mermaid-cli` then run e.g.:

```bash
mmdc -i docs/architecture/diagrams/HLD.mmd -o docs/architecture/diagrams/HLD.svg
```

---

If you'd like, I can also commit generated SVG exports for the diagrams or add a rendered visualization to the repo. Let me know which format you prefer.
