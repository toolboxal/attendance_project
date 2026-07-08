const FEATURES = [
	{
		title: "Up to 50 staff interacting in real time",
		description:
			"Supervisors, ushers, door teams. You set the team, you set the rules.",
	},
	{
		title: "Alerts and broadcasts, instantly",
		description:
			"Send incident alerts or floor-wide broadcasts to everyone at once. No group chat scroll, no missed messages.",
	},
	{
		title: "Structured coordination",
		description: "Everyone knows where to be and when to be there.",
	},
] as const;

export function MissionStatement() {
	return (
		<section className="border-y border-white/5">
			<div className="spine py-16 md:py-24">
				<p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-6">
					An orchestrated floor
				</p>
				<h2 className="text-3xl md:text-5xl font-heading text-zinc-100 tracking-tight leading-[1.1] max-w-4xl">
					The tools to coordinate your team. <br />
					<span className="text-zinc-500">Everyone on the same page.</span>
				</h2>
				<ul className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
					{FEATURES.map((feature) => (
						<li key={feature.title} className="flex flex-col gap-3">
							<h3 className="text-md md:text-g font-heading text-zinc-100 tracking-tight">
								{feature.title}
							</h3>
							<p className="text-sm md:text-base text-zinc-400 font-light leading-relaxed">
								{feature.description}
							</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
