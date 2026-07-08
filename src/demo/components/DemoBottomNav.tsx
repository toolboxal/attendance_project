import { tv } from "tailwind-variants";
import { useDemoFloor } from "#/demo/DemoFloorContext";
import type { DemoTab } from "#/demo/types";

const navBarItem = tv({
	slots: {
		navBar:
			"fixed bottom-1 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md h-14 bg-zinc-800 rounded-3xl flex items-center justify-around px-2 z-50 border-t border-zinc-700",
		tab: "flex flex-col items-center gap-1 text-zinc-400 text-[11px] font-bold uppercase hover:text-zinc-100 transition-all px-3 py-2",
		activeTab:
			"flex flex-col items-center gap-1 text-yellow-500 text-[11px] font-bold uppercase scale-110 px-3 py-2",
	},
});

const TABS: { id: DemoTab; label: string }[] = [
	{ id: "jobs", label: "Traffic" },
	{ id: "alert", label: "Alert" },
	{ id: "roster", label: "Roster" },
];

export function DemoBottomNav() {
	const { activeTab, setActiveTab } = useDemoFloor();
	const { navBar, tab, activeTab: activeTabClass } = navBarItem();

	return (
		<nav className={navBar()}>
			{TABS.map((item) => (
				<button
					key={item.id}
					type="button"
					onClick={() => setActiveTab(item.id)}
					className={activeTab === item.id ? activeTabClass() : tab()}
				>
					<span>{item.label}</span>
				</button>
			))}
		</nav>
	);
}
