Commit Guidelines (Conventional + Repo Conventions)

Purpose
- Provide a simple, consistent commit message format so commits are readable and changelogs can be generated automatically.

Style
- Use the Conventional Commits format: `<type>(<scope>): <short summary>`
- Keep the short summary <= 72 characters when possible.
- Use the body to explain "what" and "why" (not "how"). Wrap lines at ~100 chars.
- Use bullet points in the body for lists of changes.

Types (common set for this repo)
- feat: a new feature
- fix: a bug fix
- docs: documentation only changes
- style: formatting, missing semi-colons, whitespace (no code changes)
- refactor: code change that neither fixes a bug nor adds a feature
- perf: code change that improves performance
- test: adding or updating tests
- chore: build tasks, tooling, package.json, scripts

Scope
- Scope is optional but recommended. Use the area changed, e.g. `transactions`, `hooks`, `balance-sync`, `ui`, `docs`.

Message Structure
1. Header: `<type>(<scope>): <short summary>`
2. Blank line
3. Body (optional): explanatory text, rationale, and more details
4. Blank line
5. Footer (optional): issue numbers or metadata

Example 1 - Feature
```
feat(transactions): replace infinite scroll with pagination (100/page)

- Add `Pagination` component and export
- Update `useTransactions` to support page/limit
- Replace IntersectionObserver infinite scroll on transactions page
```

Example 2 - Multi-area change
```
feat(balance-sync,transactions): add daily schedule processing & pagination

- Add scheduled processing to `balance-sync` to run daily at 05:00 UTC
- Add Pagination component and update transactions flow to 100 items per page
- Update READMEs and tests
```

Pre-commit Checklist
- [ ] Changes build locally (if applicable)
- [ ] Unit/integration tests updated or added
- [ ] Linting passes
- [ ] README or docs updated if feature changes behavior

Notes
- If your change touches many areas, consider splitting into multiple commits with focused scopes.
- For quick fixes, `fix(scope): short message` is fine.

Commit message template (copy/paste)
```
<type>(<scope>): <short summary>

<more detailed explanatory text, if needed>

- bullet of changes
- bullet of changes

ISSUES: #123, #456
```
