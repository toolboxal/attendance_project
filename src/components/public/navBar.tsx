import { Link } from "@tanstack/react-router";
import { cn } from "#/lib/utils";
import { buttonVariants } from "../ui/button";

function navBar() {
	return (
		<div className="fixed top-0 left-0 flex justify-between w-full z-50 border-b border-neutral-800">
			<div className="spine flex justify-between items-center py-4 w-full">
				<Link to="/">
					<p className="logo">Asistir</p>
				</Link>
				<div className="flex space-x-4">
					<Link
						to="/signup"
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

export default navBar;
