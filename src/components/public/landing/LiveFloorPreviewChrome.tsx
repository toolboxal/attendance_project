import type { ReactNode } from "react";
import { tv } from "tailwind-variants";

const navBarItem = tv({
	slots: {
		navBar:
			"absolute bottom-1 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] h-14 bg-zinc-800 rounded-3xl flex items-center justify-around px-2 z-50 border-t border-zinc-700",
		tab: "flex flex-col items-center gap-1 text-zinc-400 text-[11px] font-bold uppercase px-3 py-2",
		activeTab:
			"flex flex-col items-center gap-1 text-yellow-500 text-[11px] font-bold uppercase scale-110 px-3 py-2",
	},
});

export function PhoneMockupShell({
	children,
	heightClass = "h-[640px]",
}: {
	children: ReactNode;
	heightClass?: string;
}) {
	return (
		<div className="relative w-full max-w-md shrink-0 md:ml-auto">
			<div className="absolute -inset-px rounded-2xl bg-linear-to-b from-white/10 to-transparent opacity-60" />
			<div className="relative overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl shadow-black/40 p-2">
				<div
					className={`relative ${heightClass} flex flex-col bg-zinc-950 text-zinc-100 px-1 pt-2 overflow-hidden`}
				>
					{children}
				</div>
			</div>
		</div>
	);
}

export function PreviewBottomNav({
	activeTab,
}: {
	activeTab: "traffic" | "roster";
}) {
	const { navBar, tab, activeTab: activeTabClass } = navBarItem();

	return (
		<nav className={navBar()}>
			<span className={activeTab === "traffic" ? activeTabClass() : tab()}>
				Traffic
			</span>
			<span className={tab()}>Alert</span>
			<span className={activeTab === "roster" ? activeTabClass() : tab()}>
				Roster
			</span>
		</nav>
	);
}
