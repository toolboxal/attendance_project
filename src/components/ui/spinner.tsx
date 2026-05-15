import { cn } from "#/lib/utils";
import { Loader, LoaderPinwheelIcon } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<LoaderPinwheelIcon
			role="status"
			aria-label="Loading"
			className={cn("size-10 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
