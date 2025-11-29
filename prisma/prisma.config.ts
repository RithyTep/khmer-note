// @ts-nocheck
import path from "node:path";

export default {
  schema: path.join(__dirname, "schema.prisma"),

  migrate: {
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { Pool } = await import("pg");

      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      return new PrismaPg(pool);
    },
  },
};
