# Git Workflow & Branching Strategy

## Branch Structure

```
main (production) - Protected, auto-deploys to khmer-note.vercel.app
  │
  └── develop (staging) - Integration branch for features
        │
        ├── feature/* - New features
        ├── fix/* - Bug fixes
        ├── hotfix/* - Urgent production fixes
        └── release/* - Release preparation
```

## Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/short-description` | `feature/ai-chat-export` |
| Bug Fix | `fix/issue-description` | `fix/login-redirect` |
| Hotfix | `hotfix/critical-issue` | `hotfix/security-patch` |
| Release | `release/vX.Y.Z` | `release/v1.1.0` |

## Common Git Commands

### Starting a New Feature
```bash
git checkout develop && git pull origin develop
git checkout -b feature/feature-name
# ... work on feature
git add . && git commit -m "feat: description"
git push -u origin feature/feature-name
# Create PR to develop
```

### Creating a Release
```bash
git checkout develop && git pull
git checkout -b release/v1.1.0
# Update package.json version
# Update CHANGELOG.md
git commit -m "chore: prepare release v1.1.0"
git push -u origin release/v1.1.0
# Create PR to main, after merge:
git checkout main && git pull
git tag -a v1.1.0 -m "Release v1.1.0: Description"
git push origin v1.1.0
```

### Hotfix (Urgent Production Fix)
```bash
git checkout main && git pull
git checkout -b hotfix/issue-name
# Apply fix
git commit -m "hotfix: fix critical issue"
git push -u origin hotfix/issue-name
# Create PR to main AND develop
```

## Commit Message Convention (Conventional Commits)

```
<type>(<scope>): <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Code style (formatting)
- refactor: Code refactoring
- perf: Performance improvement
- test: Tests
- chore: Maintenance
- ci: CI/CD changes
```

## Version Tagging (Semantic Versioning)

```
v{MAJOR}.{MINOR}.{PATCH}

MAJOR: Breaking changes (v2.0.0)
MINOR: New features, backwards compatible (v1.1.0)
PATCH: Bug fixes, backwards compatible (v1.0.1)
```

### Tag Commands
```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0: Description"

# Push single tag
git push origin v1.0.0

# Push all tags
git push origin --tags

# List tags
git tag -l

# Delete tag locally
git tag -d v1.0.0

# Delete tag remotely
git push origin --delete v1.0.0
```

## Current Version Info

- **Current Version**: v1.0.0
- **Main Branch**: `main` (production)
- **Development Branch**: `develop`
- **Repository**: https://github.com/RithyTep/khmer-note

## Files Related to Versioning

- `package.json` - Contains version number
- `CHANGELOG.md` - Version history and changes
- `CONTRIBUTING.md` - Branching guidelines for contributors
