import { format } from "date-fns";
import { formatStaffRoleLabel, formatTime12h } from "#/lib/utils";
import type { DemoProfile } from "#/demo/types";

export function DemoProfileHeader({ profile }: { profile: DemoProfile }) {
	return (
		<div className="flex flex-row items-start justify-between shrink-0">
			<div className="flex flex-col">
				<p className="text-xs font-extrabold text-zinc-100 tracking-tight">
					{profile.sectionName.toUpperCase()}
				</p>
				<p className="text-xs font-extrabold text-zinc-300 tracking-tight">
					{profile.roleTitle}
				</p>
				<div className="flex flex-row items-center gap-1">
					<p className="text-xs font-extrabold text-zinc-300 tracking-tight italic">
						{profile.name}
					</p>
					<p className="text-xs font-extrabold text-zinc-300 tracking-tight italic">
						{formatStaffRoleLabel(profile.role)}
					</p>
				</div>
			</div>
			<div className="flex flex-col">
				<span className="self-end text-xs font-semibold text-zinc-200">
					{format(new Date(profile.eventDate), "PPPP")}
				</span>
				<span className="self-end font-mono text-xs text-yellow-200">
					{formatTime12h(profile.sectionStartTime)} -{" "}
					{formatTime12h(profile.sectionEndTime)}
				</span>
			</div>
		</div>
	);
}
