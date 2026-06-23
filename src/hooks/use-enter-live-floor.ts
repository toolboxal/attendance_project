import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toastMutationError } from "#/lib/error-utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useEnterLiveFloor(eventId: string) {
	const navigate = useNavigate();
	const enterLiveFloor = useMutation(api.liveStaff.enterLiveFloorAsAdmin);
	const [isEntering, setIsEntering] = useState(false);

	const handleEnterLiveFloor = async () => {
		try {
			setIsEntering(true);
			const { accessToken } = await enterLiveFloor({
				eventId: eventId as Id<"events">,
			});
			localStorage.setItem("asistir_staff_token", accessToken);
			navigate({ to: "/live/jobs" });
		} catch (err) {
			toastMutationError(err, "Failed to enter live floor");
		} finally {
			setIsEntering(false);
		}
	};

	return { handleEnterLiveFloor, isEntering };
}
