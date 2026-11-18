## Project rules
- Domain logic lives in `src/domain` (pure TS, no React); UI only derives display from it — keeps rules testable and UI-independent.
- All data reads go through the `FamilyRepository` in `src/data` (currently the mock in `src/data/mock`); swap the implementation in `src/data/index.ts` only — keeps the data source replaceable.
- The profile selector is a demo view switch, never authentication; do not present it as security.
- Care task status is derived by `deriveTaskStatus`; a pending request must never count as confirmed coverage.
