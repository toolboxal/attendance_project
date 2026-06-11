import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "#/lib/utils";

export function CollapsibleBottomPanel({
	children,
	panelLabel,
	open,
	onOpenChange,
}: {
	children: React.ReactNode;
	panelLabel: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = open !== undefined;
	const isOpen = isControlled ? open : internalOpen;

	const setIsOpen = (next: boolean | ((prev: boolean) => boolean)) => {
		const resolved =
			typeof next === "function"
				? next(isControlled ? (open ?? false) : internalOpen)
				: next;
		if (!isControlled) {
			setInternalOpen(resolved);
		}
		onOpenChange?.(resolved);
	};

	return (
		<div className="fixed bottom-16 left-1/2 z-40 flex w-[calc(100%-1rem)] max-w-md -translate-x-1/2 flex-col items-start">
			<button
				type="button"
				onClick={() => setIsOpen((open) => !open)}
				aria-expanded={isOpen}
				aria-label={isOpen ? `Hide ${panelLabel}` : `Show ${panelLabel}`}
				className="mb-1 flex w-fit h-fit p-2 items-center justify-center rounded-lg border border-emerald-600/30 bg-emerald-800/30 text-emerald-500 shadow-sm backdrop-blur-sm transition-colors hover:border-emerald-500 hover:bg-emerald-700 hover:text-emerald-300"
			>
				{isOpen ? (
					<div className="flex flex-row items-center gap-1">
						<ChevronDown className="size-3.5" strokeWidth={2.5} />
						<span className="text-xs font-medium">close panel</span>
					</div>
				) : (
					<div className="flex flex-row items-center gap-1">
						<ChevronUp className="size-3.5" strokeWidth={2.5} />
						<span className="text-xs font-medium">open panel</span>
					</div>
				)}
			</button>
			<div
				className={cn(
					"grid w-full transition-[grid-template-rows,opacity] duration-300 ease-out",
					isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
				)}
			>
				<div className="overflow-hidden">
					<div className="flex flex-col gap-3 rounded-2xl border-[0.5px] border-zinc-500 bg-zinc-800 p-3 shadow-2xl backdrop-blur-2xl">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
