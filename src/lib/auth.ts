import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/server/db/client";

const isLocalDev = process.env.NODE_ENV === "development";

async function getOrCreateLocalUser() {
  const localEmail = "local@khmer-note.dev";

  let user = await db.user.findUnique({
    where: { email: localEmail },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email: localEmail,
        name: "Local Developer",
        image: null,
      },
    });
  }

  return user;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...(isLocalDev
      ? [
          Credentials({
            id: "local-dev",
            name: "Local Development",
            credentials: {},
            async authorize() {
              const user = await getOrCreateLocalUser();
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              };
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: isLocalDev ? "jwt" : "database",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        if (isLocalDev && token) {
          session.user.id = token.sub!;
        } else if (user) {
          session.user.id = user.id;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
