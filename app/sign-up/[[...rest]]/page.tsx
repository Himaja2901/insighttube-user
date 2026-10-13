import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-700">
            InsightTube AI
          </h1>

          <p className="mt-3 text-gray-600">
            Create your account to get started.
          </p>
        </div>

        <div className="flex justify-center">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/"
          />
        </div>
      </div>
    </main>
  );
}