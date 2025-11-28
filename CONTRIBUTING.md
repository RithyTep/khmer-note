# Contributing to Khmer Note

## Git Branching Strategy

We follow a modified Git Flow branching model for development.

### Branch Structure

```
main (production)
  │
  └── develop (staging/integration)
        │
        ├── feature/* (new features)
        ├── fix/* (bug fixes)
        ├── hotfix/* (urgent production fixes)
        └── release/* (release preparation)
```

### Branch Types

| Branch | Purpose | Base | Merges Into |
|--------|---------|------|-------------|
| `main` | Production-ready code | - | - |
| `develop` | Integration branch for features | `main` | `main` (via release) |
| `feature/*` | New features | `develop` | `develop` |
| `fix/*` | Bug fixes | `develop` | `develop` |
| `hotfix/*` | Urgent production fixes | `main` | `main` & `develop` |
| `release/*` | Release preparation | `develop` | `main` & `develop` |

### Branch Naming Convention

```
feature/short-description    # New features
fix/issue-number-description # Bug fixes
hotfix/critical-issue        # Urgent production fixes
release/v1.2.0              # Release branches
```

**Examples:**
- `feature/ai-chat-history`
- `feature/dark-mode-toggle`
- `fix/123-login-error`
- `hotfix/security-patch`
- `release/v1.1.0`

## Workflow

### Starting a New Feature

```bash
# Make sure develop is up to date
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature...
git add .
git commit -m "feat: add your feature description"

# Push feature branch
git push -u origin feature/your-feature-name

# Create Pull Request to develop branch
```

### Bug Fixes

```bash
git checkout develop
git pull origin develop
git checkout -b fix/issue-description

# Fix the bug...
git add .
git commit -m "fix: resolve issue description"
git push -u origin fix/issue-description

# Create Pull Request to develop branch
```

### Hotfixes (Urgent Production Issues)

```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Apply fix...
git add .
git commit -m "hotfix: fix critical issue"
git push -u origin hotfix/critical-issue

# Create Pull Request to main AND develop branches
```

### Creating a Release

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Update version in package.json
# Update CHANGELOG.md
# Final testing...

git add .
git commit -m "chore: prepare release v1.2.0"
git push -u origin release/v1.2.0

# Create Pull Request to main
# After merge, tag the release
```

## Version Tagging

We use [Semantic Versioning](https://semver.org/) (SemVer):

```
v{MAJOR}.{MINOR}.{PATCH}

MAJOR: Breaking changes
MINOR: New features (backwards compatible)
PATCH: Bug fixes (backwards compatible)
```

### Creating Tags

```bash
# After merging to main
git checkout main
git pull origin main

# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0: Initial stable release"

# Push tag
git push origin v1.0.0

# Push all tags
git push origin --tags
```

### Tag Naming Examples

- `v1.0.0` - Initial release
- `v1.1.0` - New feature added
- `v1.1.1` - Bug fix
- `v2.0.0` - Breaking changes

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |
| `build` | Build system changes |

### Examples

```bash
feat(ai): add chat history pagination
fix(auth): resolve session timeout issue
docs: update README with setup instructions
refactor(hooks): optimize useProject callbacks
perf(images): add lazy loading to gallery
chore: update dependencies
```

## Pull Request Guidelines

### PR Title Format

```
[TYPE] Brief description
```

Examples:
- `[Feature] Add AI chat export functionality`
- `[Fix] Resolve login redirect issue`
- `[Hotfix] Security patch for auth`

### PR Description Template

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Hotfix
- [ ] Refactoring
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No console errors

## Screenshots (if applicable)

## Related Issues
Closes #123
```

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Added necessary documentation
- [ ] No new warnings or errors
- [ ] Tests pass locally
- [ ] Branch is up to date with target branch

## Environment Branches

| Branch | Environment | URL |
|--------|-------------|-----|
| `main` | Production | khmer-note.vercel.app |
| `develop` | Staging | khmer-note-dev.vercel.app |
| `feature/*` | Preview | Auto-generated preview URL |

## Code Review Process

1. Create PR from feature branch to `develop`
2. Automated checks run (lint, build, tests)
3. Request review from team member
4. Address feedback
5. Squash and merge when approved

## Quick Reference

```bash
# Update develop
git checkout develop && git pull

# Start feature
git checkout -b feature/name

# Commit changes
git add . && git commit -m "feat: description"

# Push and create PR
git push -u origin feature/name

# After PR merged, clean up
git checkout develop && git pull
git branch -d feature/name
```
