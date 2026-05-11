import type { ReactNode } from "react";
import { create } from "zustand";

interface HeaderState {
	title: string;
	showBackButton: boolean;
	backAction: (() => void) | null;
	setPageHeader: (config: {
		title: string;
		showBackButton?: boolean;
		backAction?: (() => void) | null;
		showLeftButton?: boolean;
		leftButton?: ReactNode | null;
	}) => void;
	resetHeader: () => void;
	showLeftButton: boolean;
	leftButton: ReactNode | null;
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
			showLeftButton: config.showLeftButton ?? false,
			leftButton: config.leftButton ?? null,
		}),
	resetHeader: () =>
		set({
			title: "Asistir",
			showBackButton: false,
			backAction: null,
			showLeftButton: false,
			leftButton: null,
		}),
	showLeftButton: false,
	leftButton: null,
}));
