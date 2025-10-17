# Move Branching TODO

We need a first-class way to fork analysis from an imported PGN without losing the primary line. When the feature lands it should cover:

- Freezing the base game so side experiments can be created and discarded without touching the canonical move list.
- Navigating between variations with the same keyboard controls available in the terminal panel.
- Persisting both the original game and any saved branches so agents (and humans) can jump to a specific variation on load.

Until the branch toolkit ships, the terminal keeps a single linear history. Any experiments overwrite that line, so add safeguards before shipping multi-variation review tools.
