import { Link, useRouter } from "@tanstack/react-router";
import { Bell, ChevronLeft } from "lucide-react";
import { useHeaderStore } from "#/lib/store/topHeaderStore";
import { cn } from "#/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import { Empty } from "../ui/empty";

function TopHeaderBar() {
	const { title, showBackButton, backAction, showLeftButton, leftButton } =
		useHeaderStore();
	const router = useRouter();
	const handleBack = () => {
		if (backAction) {
			backAction();
		} else {
			router.history.back();
		}
	};
	return (
		<div className="sticky top-0 w-full flex justify-between z-30 border-b border-neutral-800 bg-zinc-950/80 backdrop-blur-md">
			<div className="spine flex justify-between items-center py-4 w-full">
				{/* Unlocked Left Container to permit wider dynamic items like text buttons */}
				<div className="min-w-10 w-fit flex justify-start items-center shrink-0">
					{showLeftButton && leftButton ? (
						leftButton
					) : showBackButton ? (
						<Button
							onClick={handleBack}
							variant="secondary"
							size="icon"
							className="rounded-full w-9 h-9 p-0 flex items-center justify-center shrink-0"
						>
							<ChevronLeft className="w-5 h-5" />
						</Button>
					) : (
						<Empty className="invisible w-9 h-9 p-0 shrink-0 pointer-events-none" />
					)}
				</div>

				<p className="text-xl font-bold text-white text-center flex-1 truncate px-4">
					{title}
				</p>

				{/* Symmetrical Right Container (w-10) matching the left */}
				<div className="w-10 flex justify-end items-center text-zinc-400">
					<Bell className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
				</div>
			</div>
		</div>
	);
}

export default TopHeaderBar;
