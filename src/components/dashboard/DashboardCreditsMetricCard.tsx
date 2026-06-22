import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { cn } from "#/lib/utils";

type DashboardCreditsMetricCardProps = {
	label: string;
	value: string | number;
	subtitle?: string;
	className?: string;
};

export function DashboardCreditsMetricCard({
	label,
	value,
	subtitle,
	className,
}: DashboardCreditsMetricCardProps) {
	return (
		<Card
			className={cn(
				"bg-linear-to-r from-yellow-950/50 to-yellow-950/30 py-2 gap-1 ring-0",
				className,
			)}
		>
			<CardHeader className="px-4 py-0">
				<CardTitle className="text-[10px] uppercase tracking-wider font-medium text-zinc-200">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-4 pt-0">
				<span className="text-2xl font-bold tabular-nums text-zinc-100">
					{value}
				</span>
				{subtitle ? (
					<p className="text-xs text-zinc-400 font-mono tracking-tight mt-0.5">
						{subtitle}
					</p>
				) : null}
			</CardContent>
		</Card>
	);
}
