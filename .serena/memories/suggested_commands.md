# Suggested Commands

## Development
```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Database
```bash
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database (no migrations)
pnpm db:migrate   # Run database migrations
pnpm db:studio    # Open Prisma Studio (database GUI)
pnpm db:seed      # Seed database with sample data
```

## Installation
```bash
pnpm install      # Install dependencies (also runs prisma generate via postinstall)
```

## Environment Setup
```bash
cp .env.example .env  # Create .env file
# Required variables:
# - DATABASE_URL (PostgreSQL connection string)
# - GOOGLE_CLIENT_ID (OAuth)
# - GOOGLE_CLIENT_SECRET (OAuth)
# - AUTH_SECRET (NextAuth secret)
```
