import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="mb-6 text-5xl">🏃</div>
      <h1 className="text-4xl font-bold mb-3 text-white">FitLog</h1>
      <p className="text-gray-400 text-lg mb-8 max-w-md">
        Upload a screenshot of any workout. We extract the data, you track your progress.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
        >
          Sign In
        </Link>
      </div>
      <p className="mt-12 text-gray-600 text-sm">
        Works with Strava, Garmin, Apple Watch, Nike Run Club and more
      </p>
    </div>
  );
}
