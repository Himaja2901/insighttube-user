import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-700">
            InsightTube AI
          </h1>

          <p className="mt-3 text-gray-600">
            Welcome back! Sign in to explore your documents.
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/"
          />
        </div>
      </div>
    </main>
  );
}