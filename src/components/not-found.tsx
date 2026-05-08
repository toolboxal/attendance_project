import { Link, useRouter } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";

export function NotFoundComponent() {
	const router = useRouter();

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 px-6 py-24 sm:py-32 lg:px-8">
			{/* Decorative background glows */}
			<div className="absolute top-1/4 left-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
			<div className="absolute bottom-1/4 left-1/2 -z-10 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-pink-500/10 blur-[100px]" />

			<div className="relative group w-full max-w-md rounded-2xl bg-neutral-900/40 p-8 text-center backdrop-blur-xl border border-neutral-800/50 shadow-2xl transition-all duration-300 hover:border-neutral-700/50">
				{/* Ambient Glow Border Effect */}
				<div className="absolute -inset-[1px] -z-10 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-transparent to-pink-500/20 opacity-0 group-hover:opacity-100 transition duration-700" />

				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 mb-6 animate-pulse">
					<AlertCircle className="h-8 w-8" />
				</div>

				<h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-white to-pink-200 bg-clip-text text-transparent sm:text-5xl">
					404
				</h1>
				<h2 className="mt-4 text-xl font-semibold text-neutral-200">
					Page Not Found
				</h2>
				<p className="mt-3 text-sm leading-6 text-neutral-400">
					The page you are looking for doesn't exist or has been moved to
					another URL.
				</p>

				<div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
					<button
						type="button"
						onClick={() => router.history.back()}
						className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-200 hover:bg-neutral-700 active:scale-95 transition-all border border-neutral-700/50 cursor-pointer"
					>
						<ArrowLeft className="h-4 w-4" />
						Go Back
					</button>
					<Link
						to="/"
						className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-indigo-500 active:scale-95 transition-all cursor-pointer"
					>
						<Home className="h-4 w-4" />
						Go Home
					</Link>
				</div>
			</div>
		</div>
	);
}
