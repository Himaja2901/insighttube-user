
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/sign-in") ||
    request.nextUrl.pathname.startsWith("/sign-up");

  if (!userId && !isPublicRoute) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set(
      "redirect_url",
      request.nextUrl.pathname + request.nextUrl.search
    );

    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
