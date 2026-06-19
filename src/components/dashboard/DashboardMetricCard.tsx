import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { cn } from "#/lib/utils";

type DashboardMetricCardProps = {
	label: string;
	value: string | number;
	subtitle?: string;
	icon?: ReactNode;
	className?: string;
};

export function DashboardMetricCard({
	label,
	value,
	subtitle,
	icon,
	className,
}: DashboardMetricCardProps) {
	return (
		<Card
			className={cn(
				"border-zinc-800/50 bg-zinc-800/20 py-2 gap-1 ring-0",
				className,
			)}
		>
			<CardHeader className="px-4 py-0">
				<CardTitle className="text-[10px] uppercase tracking-wider text-zinc-400 font-normal">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-4 pt-0">
				<div className="flex items-center gap-1.5">
					{icon}
					<span className="text-2xl font-bold tabular-nums text-zinc-100">
						{value}
					</span>
				</div>
				{subtitle ? (
					<p className="text-[10px] text-zinc-500 mt-0.5">{subtitle}</p>
				) : null}
			</CardContent>
		</Card>
	);
}
