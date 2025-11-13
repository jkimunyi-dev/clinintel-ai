import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      hospitalId?: string;
      subscriptionStatus?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    hospitalId?: string;
    subscriptionStatus?: string;
  }
  
  interface JWT {
    id?: string;
    role?: string;
    hospitalId?: string;
    subscriptionStatus?: string;
  }
}
