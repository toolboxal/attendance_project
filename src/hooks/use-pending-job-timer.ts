import { useEffect, useState } from "react";

/** Pending wait age: `45s`, then `1m 20s`, then `1h 5m`. */
export function formatPendingAge(elapsedMs: number): string {
	const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
	if (totalSec < 60) return `${totalSec}s`;

	const mins = Math.floor(totalSec / 60);
	const secs = totalSec % 60;
	if (mins < 60) return `${mins}m ${String(secs).padStart(2, "0")}s`;

	const hours = Math.floor(mins / 60);
	const remMins = mins % 60;
	return `${hours}h ${remMins}m`;
}

/**
 * Live count-up from creation time while the job is pending.
 * Stops ticking when not pending; release → pending resumes from the same creation time.
 */
export function usePendingJobTimer(
	creationTime: number,
	isPending: boolean,
): { label: string; elapsedMs: number } {
	const [elapsedMs, setElapsedMs] = useState(0);

	useEffect(() => {
		if (!isPending || creationTime <= 0) {
			setElapsedMs(0);
			return;
		}

		const tick = () => {
			setElapsedMs(Date.now() - creationTime);
		};

		tick();
		const interval = setInterval(tick, 1000);
		return () => clearInterval(interval);
	}, [creationTime, isPending]);

	return {
		label: formatPendingAge(elapsedMs),
		elapsedMs,
	};
}
