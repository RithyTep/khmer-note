# Task Completion Checklist

When completing a task, ensure the following:

## Code Quality
- [ ] TypeScript compiles without errors
- [ ] ESLint passes (`pnpm lint`)
- [ ] No console.log statements left (except in catch blocks)

## Database Changes
If Prisma schema was modified:
- [ ] Run `pnpm db:generate` to regenerate client
- [ ] Run `pnpm db:push` or `pnpm db:migrate` to update database

## Testing
- [ ] Test the feature manually in development (`pnpm dev`)
- [ ] Verify API endpoints work correctly
- [ ] Check responsive design on mobile viewport

## Before Commit
- [ ] Run `pnpm build` to ensure production build succeeds
- [ ] Verify no secrets are committed (.env is gitignored)
