import { create } from "zustand";

interface HeaderState {
	title: string;
	showBackButton: boolean;
	backAction: (() => void) | null;
	setPageHeader: (config: {
		title: string;
		showBackButton?: boolean;
		backAction?: (() => void) | null;
	}) => void;
	resetHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
	title: "Asistir",
	showBackButton: false,
	backAction: null,
	setPageHeader: (config) =>
		set({
			title: config.title,
			showBackButton: config.showBackButton ?? false,
			backAction: config.backAction ?? null,
		}),
	resetHeader: () =>
		set({
			title: "Asistir",
			showBackButton: false,
			backAction: null,
		}),
}));
