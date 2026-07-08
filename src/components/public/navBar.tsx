import { Link } from "@tanstack/react-router";
import { cn } from "#/lib/utils";
import { buttonVariants } from "../ui/button";
import { Separator } from "../ui/separator";

function NavBar() {
	return (
		<header className="sticky top-0 z-30 bg-zinc-950/60 backdrop-blur-xl">
			<div className="spine flex justify-between items-center py-4 w-full">
				<Link to="/">
					<p className="logo">Asistir</p>
				</Link>
				<div className="flex items-center gap-3">
					<Link
						to="/demo"
						className={cn(
							buttonVariants({
								variant: "ghost",
								size: "lg",
							}),
							"text-yellow-400 hover:text-yellow-300 px-4",
						)}
					>
						Try Demo
					</Link>
					<Separator orientation="vertical" className="bg-zinc-700" />
					<Link
						to="/signin"
						className={cn(
							buttonVariants({
								variant: "ghost",
								size: "lg",
							}),
							"text-zinc-400 hover:text-zinc-100 px-4",
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
								size: "lg",
							}),
							"px-4",
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
