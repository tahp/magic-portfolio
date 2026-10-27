import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        console.error("ADMIN_EMAIL environment variable is not set");
        return false;
      }
      // Only allow the specified admin email to sign in
      return user.email === adminEmail;
    },
  },
});
