import { Link } from "@tanstack/react-router";
import { cn } from "#/lib/utils";
import { buttonVariants } from "../ui/button";

function NavBar() {
	return (
		<header className="sticky top-0 z-30 bg-zinc-950/60 backdrop-blur-xl">
			<div className="spine flex justify-between items-center py-3 md:py-4 w-full">
				<Link to="/">
					<p className="logo">Asistir</p>
				</Link>
				<div className="flex items-center gap-1.5 md:gap-3">
					<Link
						to="/demo"
						className={cn(
							buttonVariants({
								variant: "ghost",
								size: "sm",
							}),
							"text-emerald-200 hover:text-emerald-100 px-2.5 md:h-9 md:px-4 md:text-sm",
						)}
					>
						Try Demo
					</Link>
					<div className="h-4 self-center bg-zinc-700 md:h-5 w-px" />
					<Link
						to="/signin"
						className={cn(
							buttonVariants({
								variant: "ghost",
								size: "sm",
							}),
							"text-zinc-400 hover:text-zinc-100 px-2.5 md:h-9 md:px-4 md:text-sm",
						)}
					>
						Sign In
					</Link>
					<Link
						to="/signup"
						search={{ checkoutSlug: undefined }}
						className={cn(
							buttonVariants({
								variant: "default",
								size: "sm",
							}),
							"px-2.5 md:h-9 md:px-4 md:text-sm",
						)}
					>
						Sign Up
					</Link>
				</div>
			</div>
		</header>
	);
}

export default NavBar;
