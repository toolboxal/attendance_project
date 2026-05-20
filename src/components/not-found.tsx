import { ErrorView } from "./error-view";

export function NotFoundComponent() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950">
			<ErrorView
				errorType={404}
				reason="Page Not Found"
				actionNeeded="The page you are looking for doesn't exist. Please check the URL or go back to the home page."
			/>
		</div>
	);
}
