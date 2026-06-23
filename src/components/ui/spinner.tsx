import { Clock6 } from "lucide-react";
import { cn } from "#/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<Clock6
			role="status"
			aria-label="Loading"
			className={cn("size-6 text-zinc-400 animate-spin stroke-1", className)}
			{...props}
		/>
	);
}

export { Spinner };
