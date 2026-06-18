import { useEffect, useState } from "react";

export function formatLiveCountdown(expiresAt: number): string {
	const diff = expiresAt - Date.now();
	if (diff <= 0) return "Expired";

	const hours = Math.floor(diff / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((diff % (1000 * 60)) / 1000);

	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function useLiveCountdown(expiresAt?: number | null): string {
	// Defer Date.now() until after mount so SSR and first client render match.
	const [timeLeft, setTimeLeft] = useState("—");

	useEffect(() => {
		if (expiresAt == null) {
			setTimeLeft("—");
			return;
		}

		const updateTimer = () => {
			setTimeLeft(formatLiveCountdown(expiresAt));
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, [expiresAt]);

	return timeLeft;
}
