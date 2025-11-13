export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/api/patients/:path*", "/api/files/:path*", "/api/analyze/:path*", "/api/chat/:path*"],
};
