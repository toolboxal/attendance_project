import { Link } from "@tanstack/react-router";
import { cn } from "#/lib/utils";
import { buttonVariants } from "../ui/button";

function NavBar() {
	return (
		<div className="sticky top-0 flex justify-between w-full z-30 border-b border-neutral-800 bg-zinc-950/80 backdrop-blur-md">
			<div className="spine flex justify-between items-center py-4 w-full">
				<Link to="/">
					<p className="logo">Asistir</p>
				</Link>
				<div className="flex space-x-4">
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
					<Link
						to="/signin"
						className={cn(
							buttonVariants({
								variant: "secondary",
								size: "lg",
							}),

							"px-4",
						)}
					>
						Sign In
					</Link>
				</div>
			</div>
		</div>
	);
}

export default NavBar;
