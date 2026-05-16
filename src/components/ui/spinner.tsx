import { cn } from "#/lib/utils";
import { Clock12 } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<Clock12
			role="status"
			aria-label="Loading"
			className={cn("size-10 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
