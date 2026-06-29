"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button"; // Replace with your button component if available
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
      <div className="max-w-md p-6 bg-white   shadow-lg">
        <img
          src="/assets/images/empty/but-fix.png"
          alt="Error Illustration"
          className="w-60 mx-auto mb-4"
        />
        <h1 className="text-4xl font-bold text-red-500 mb-4">Oops!</h1>
        <p className="text-lg text-gray-700 mb-4">
          Something went wrong. We're working to fix it as soon as possible.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          If you need immediate assistance, please contact support.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/">
            <Button>Home</Button>
          </Link>
          <Button variant="secondary" onClick={reset}>
            Try Again
          </Button>
        </div>
      </div>
      <p className="mt-6 text-sm text-gray-500">
        Error details:{" "}
        <code className="bg-gray-200 p-1 rounded">{error.message}</code>
      </p>
    </div>
  );
}
