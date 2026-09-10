# Product Delivery Documentation

This directory organizes product-delivery documentation by roadmap phase.

Each PRD has a globally unique, immutable number and owns its tickets:

```text
docs/phases/
  phase-XX-phase-name/
    NNN-prd-name/
      prd.md
      tickets/
        NNN-ticket-name.md
```

Use English lowercase kebab-case for phase directories, PRD directories, and ticket filenames. PRD numbering is global across the project; ticket numbering restarts for each PRD.

Place PRDs for roadmap work in their corresponding `phase-XX-*` directory. Use a descriptive `phase-future-*` directory for approved work that has no numbered roadmap phase yet.
