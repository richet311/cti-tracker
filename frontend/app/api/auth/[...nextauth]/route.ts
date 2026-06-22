import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: credentials?.username,
            password: credentials?.password,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail ?? "Invalid credentials");
        }

        const data = (await res.json()) as { access_token: string; username: string; role: string };
        return {
          id:          data.username,
          name:        data.username,
          email:       null,
          role:        data.role,
          accessToken: data.access_token,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${API_URL}/api/auth/google-signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: profile?.email, name: profile?.name }),
          });
          if (res.ok) {
            const data = (await res.json()) as { access_token: string; username: string; role: string };
            (user as unknown as Record<string, unknown>).accessToken = data.access_token;
            (user as unknown as Record<string, unknown>).role        = data.role;
            (user as unknown as Record<string, unknown>).name        = data.username;
          }
        } catch {
          // allow sign-in even if Express is temporarily unreachable
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role        = (user as unknown as Record<string, unknown>).role as string;
        token.accessToken = (user as unknown as Record<string, unknown>).accessToken as string;
      }
      return token;
    },

    async session({ session, token }) {
      (session.user as unknown as Record<string, unknown>).role = token.role as string;
      (session as unknown as Record<string, unknown>).accessToken = token.accessToken as string;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
