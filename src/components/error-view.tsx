import { useRouter } from "@tanstack/react-router";
import { Button } from "./ui/button";

interface ErrorViewProps {
	errorType?: string | number;
	title?: string;
	reason: string;
	actionNeeded: string;
	showBackButton?: boolean;
	showHomeButton?: boolean;
	onBack?: () => void;
	onHome?: () => void;
}

export function ErrorView({
	errorType,
	title = "error",
	reason,
	actionNeeded,
	showBackButton = true,
	showHomeButton = true,
	onBack,
	onHome,
}: ErrorViewProps) {
	const router = useRouter();

	const handleBack = onBack || (() => router.history.back());
	const handleHome = onHome || (() => router.navigate({ to: "/" }));

	return (
		<div className="w-full max-w-md p-8 flex flex-col  justify-center">
			<p className="logo mb-4">Asistir</p>
			<div className="flex items-center gap-2 mb-2">
				<p className="text-md font-bold italic text-red-400 uppercase">
					{title} {errorType ? `: ${errorType}` : ""}
				</p>
			</div>
			<p className="text-sm font-bold text-neutral-200">{reason}</p>
			<p className="mt-1 text-sm leading-normal text-neutral-400">
				{actionNeeded}
			</p>
			<div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
				{showBackButton && (
					<Button
						type="button"
						onClick={handleBack}
						variant="secondary"
						size="lg"
						className="w-full sm:w-auto"
					>
						Go Back
					</Button>
				)}
				{showHomeButton && (
					<Button
						type="button"
						onClick={handleHome}
						variant="outline"
						size="lg"
						className="w-full sm:w-auto"
					>
						Go HomePage
					</Button>
				)}
			</div>
		</div>
	);
}
