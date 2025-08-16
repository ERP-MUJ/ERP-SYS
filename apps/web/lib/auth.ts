import { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthService } from "@/services";

// const googleAuthProvider = GoogleProvider({
//   clientId: envConfig.providers.google.clientId,
//   clientSecret: envConfig.providers.google.clientSecret,
// });

const credentialsAuthProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password", required: false },
    otp: { label: "OTP", type: "text", required: false },
    role: { label: "Role", type: "text", required: false },
  },
  async authorize(credentials) {
    try {
      if (!credentials?.email) {
        throw new Error("Email is required");
      }
      let res;
      if (credentials.password) {
        res = await AuthService.loginWithPassword(
          credentials.email,
          credentials.password,
          credentials.role ? getExpectedRole(credentials.role) : undefined,
        );
      } else if (credentials.otp) {
        res = await AuthService.verifyOtp(
          credentials.email,
          credentials.otp,
          credentials.role ? getExpectedRole(credentials.role) : undefined,
        );
      } else {
        throw new Error("Password or OTP required");
      }
      if (res.data) {
        return {
          id: res.data.user.id,
          email: res.data.user.email,
          token: res.data.token,
          role: res.data.user.role,
          name: res.data.user.name ?? "Unknown",
        } satisfies User;
      }
      throw new Error("Invalid credentials");
    } catch (error) {
      throw new Error((error as Error)?.message || "Invalid credentials");
    }
  },
});

// Helper function to map frontend roles to backend roles
function getExpectedRole(frontendRole: string): string {
  const roleMapping = {
    qac: "QAC",
    hod: "HOD",
    faculty: "FACULTY",
    "kpi-coordinator": "KPI_COORDINATOR",
  };
  return roleMapping[frontendRole as keyof typeof roleMapping] || "FACULTY";
}

export const authOptions: AuthOptions = {
  providers: [credentialsAuthProvider],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email;

        if (email && account.id_token) {
          try {
            const resp = await AuthService.handleGoogleAuth(account.id_token);
            if (resp.data) {
              user.id = resp.data.user.id;
              user.name = resp.data.user.name ?? "Unknown";
              user.email = resp.data.user.email;
              user.token = resp.data.token;
            } else {
              console.error("Error signing in:", resp.error);
              return false;
            }
          } catch (error) {
            console.error("Error signing in:", error);
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        return { ...token, ...session.user };
      }
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.token = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.token = token.token as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth",
  },
};
