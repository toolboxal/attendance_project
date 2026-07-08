import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="spine border-t border-white/5 py-8">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
				<p>&copy; {new Date().getFullYear()} Asistir</p>
				<Link to="/signin" className="hover:text-zinc-300 transition-colors">
					Sign in
				</Link>
			</div>
		</footer>
	);
}
