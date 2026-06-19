import { format } from "date-fns";

export const DASHBOARD_JOB_BUCKET_MINUTES = 5;

export type JobActivityBucket = {
	bucketStart: number;
	count: number;
};

function floorToWallClockBucketMs(
	ms: number,
	bucketMinutes: number,
): number {
	const date = new Date(ms);
	const localMinutes = date.getHours() * 60 + date.getMinutes();
	const flooredMinutes =
		Math.floor(localMinutes / bucketMinutes) * bucketMinutes;
	const hour = Math.floor(flooredMinutes / 60);
	const minute = flooredMinutes % 60;

	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		hour,
		minute,
		0,
		0,
	).getTime();
}

function addWallClockMinutes(ms: number, minutesToAdd: number): number {
	const date = new Date(ms);
	date.setMinutes(date.getMinutes() + minutesToAdd);
	return date.getTime();
}

export function bucketJobCreationTimes(
	creationTimes: number[],
	windowStart: number,
	windowEnd: number,
	bucketMinutes = DASHBOARD_JOB_BUCKET_MINUTES,
): {
	buckets: JobActivityBucket[];
	peakCount: number;
	peakBucketStart: number | null;
} {
	const alignedStart = floorToWallClockBucketMs(windowStart, bucketMinutes);

	const buckets: JobActivityBucket[] = [];
	let bucketStart = alignedStart;
	while (bucketStart < windowEnd) {
		buckets.push({ bucketStart, count: 0 });
		bucketStart = addWallClockMinutes(bucketStart, bucketMinutes);
	}

	if (buckets.length === 0) {
		buckets.push({ bucketStart: alignedStart, count: 0 });
	}

	const bucketIndexByStart = new Map(
		buckets.map((bucket, index) => [bucket.bucketStart, index]),
	);

	for (const createdAt of creationTimes) {
		if (createdAt < windowStart || createdAt >= windowEnd) continue;

		const jobBucketStart = floorToWallClockBucketMs(createdAt, bucketMinutes);
		const index = bucketIndexByStart.get(jobBucketStart);
		if (index !== undefined) {
			buckets[index].count += 1;
		}
	}

	let peakBucket: JobActivityBucket | null = null;
	for (const bucket of buckets) {
		if (!peakBucket || bucket.count > peakBucket.count) {
			peakBucket = bucket;
		}
	}

	return {
		buckets,
		peakCount: peakBucket?.count ?? 0,
		peakBucketStart:
			peakBucket && peakBucket.count > 0 ? peakBucket.bucketStart : null,
	};
}

function formatHour12(date: Date): number {
	return date.getHours() % 12 || 12;
}

/** e.g. "11-11:15am", "11:15-11:30am" */
export function formatBucketRangeLabel(
	bucketStartMs: number,
	bucketMinutes: number,
): string {
	const start = new Date(bucketStartMs);
	const end = new Date(bucketStartMs + bucketMinutes * 60 * 1000);
	const period = format(end, "a").toLowerCase();

	const startHour = formatHour12(start);
	const startPart =
		start.getMinutes() === 0
			? `${startHour}`
			: `${startHour}:${String(start.getMinutes()).padStart(2, "0")}`;

	const endHour = formatHour12(end);
	const endPart =
		end.getMinutes() === 0
			? `${endHour}`
			: `${endHour}:${String(end.getMinutes()).padStart(2, "0")}`;

	return `${startPart}-${endPart}${period}`;
}
