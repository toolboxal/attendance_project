import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import type { SectionReportFormState } from "#/components/roster/SectionReportPanel";
import { createDemoFloorState } from "#/demo/seed";
import type { DemoFloorState, DemoJob, DemoTab } from "#/demo/types";

type DemoFloorContextValue = {
	state: DemoFloorState;
	activeTab: DemoTab;
	setActiveTab: (tab: DemoTab) => void;
	resetDemo: () => void;
	activeJobs: DemoJob[];
	dispatchJob: (input: {
		personCount: number;
		requestType: string;
		description?: string;
	}) => void;
	acceptJob: (jobId: string) => void;
	rejectJob: (jobId: string) => void;
	resolveJob: (jobId: string) => void;
	cancelJob: (jobId: string) => void;
	createAlert: (input: { alertType: string; body: string }) => void;
	addAlertUpdate: (alertId: string, content: string) => void;
	resolveAlert: (alertId: string) => void;
	reportSection: (
		sectionKey: string,
		report: SectionReportFormState,
	) => void;
	toggleIncludeInTotal: (sectionKey: string, includeInTotal: boolean) => void;
};

const DemoFloorContext = createContext<DemoFloorContextValue | null>(null);

const MAX_ACTIVE_JOBS = 10;
const MAX_ACTIVE_ALERTS = 10;

function nextId(prefix: string) {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function DemoFloorProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<DemoFloorState>(createDemoFloorState);
	const [activeTab, setActiveTab] = useState<DemoTab>("jobs");

	const resetDemo = useCallback(() => {
		setState(createDemoFloorState());
		setActiveTab("jobs");
	}, []);

	const activeJobs = useMemo(
		() => state.jobs.filter((job) => job.status !== "resolved"),
		[state.jobs],
	);

	const activeAlerts = useMemo(
		() => state.alerts.filter((alert) => alert.status === "open"),
		[state.alerts],
	);

	const dispatchJob = useCallback(
		(input: {
			personCount: number;
			requestType: string;
			description?: string;
		}) => {
			if (activeJobs.length >= MAX_ACTIVE_JOBS) {
				return;
			}

			const { profile } = state;
			const job: DemoJob = {
				id: nextId("demo_job"),
				creatorId: profile.id,
				personCount: input.personCount,
				requestType: input.requestType,
				description: input.description,
				status: "pending",
				creatorName: profile.name,
				creatorRole: profile.role,
				creatorRoleTitle: profile.roleTitle,
				claimerRoleTitle: "",
				originSectionName: profile.sectionName,
				creatorMissing: false,
				claimerMissing: false,
			};

			setState((prev) => ({ ...prev, jobs: [job, ...prev.jobs] }));
		},
		[activeJobs.length, state],
	);

	const acceptJob = useCallback((jobId: string) => {
		setState((prev) => {
			const job = prev.jobs.find((item) => item.id === jobId);
			if (!job || job.status !== "pending" || job.creatorId === prev.profile.id) {
				return prev;
			}

			return {
				...prev,
				jobs: prev.jobs.map((item) =>
					item.id === jobId
						? {
								...item,
								status: "accepted" as const,
								claimerId: prev.profile.id,
								claimerName: prev.profile.name,
								claimerRole: prev.profile.role,
								claimerRoleTitle: prev.profile.roleTitle,
								destinationSectionName: prev.profile.sectionName,
							}
						: item,
				),
			};
		});
	}, []);

	const rejectJob = useCallback((jobId: string) => {
		setState((prev) => ({
			...prev,
			jobs: prev.jobs.map((item) =>
				item.id === jobId
					? {
							...item,
							status: "pending" as const,
							claimerId: undefined,
							claimerName: undefined,
							claimerRole: undefined,
							claimerRoleTitle: "",
							destinationSectionName: undefined,
						}
					: item,
			),
		}));
	}, []);

	const resolveJob = useCallback((jobId: string) => {
		setState((prev) => ({
			...prev,
			jobs: prev.jobs.map((item) =>
				item.id === jobId ? { ...item, status: "resolved" as const } : item,
			),
		}));
	}, []);

	const cancelJob = useCallback((jobId: string) => {
		setState((prev) => ({
			...prev,
			jobs: prev.jobs.filter((item) => item.id !== jobId),
		}));
	}, []);

	const createAlert = useCallback(
		(input: { alertType: string; body: string }) => {
			if (activeAlerts.length >= MAX_ACTIVE_ALERTS) {
				return;
			}

			const { profile } = state;
			setState((prev) => ({
				...prev,
				alerts: [
					{
						id: nextId("demo_alert"),
						creatorId: profile.id,
						creatorName: profile.name,
						creatorRole: profile.role,
						creatorRoleTitle: profile.roleTitle,
						sectionName: profile.sectionName,
						alertType: input.alertType,
						body: input.body,
						status: "open",
						isPinned: false,
						createdAt: Date.now(),
						updates: [],
					},
					...prev.alerts,
				],
			}));
		},
		[activeAlerts.length, state],
	);

	const addAlertUpdate = useCallback((alertId: string, content: string) => {
		setState((prev) => ({
			...prev,
			alerts: prev.alerts.map((alert) =>
				alert.id === alertId
					? {
							...alert,
							updates: [
								...alert.updates,
								{
									id: nextId("demo_alert_update"),
									authorId: prev.profile.id,
									authorName: prev.profile.name,
									authorRole: prev.profile.role,
									content,
									createdAt: Date.now(),
								},
							],
						}
					: alert,
			),
		}));
	}, []);

	const resolveAlert = useCallback((alertId: string) => {
		setState((prev) => ({
			...prev,
			alerts: prev.alerts.map((alert) =>
				alert.id === alertId ? { ...alert, status: "resolved" as const } : alert,
			),
		}));
	}, []);

	const reportSection = useCallback(
		(sectionKey: string, report: SectionReportFormState) => {
			setState((prev) => ({
				...prev,
				sections: prev.sections.map((section) =>
					section.sectionKey === sectionKey
						? {
								...section,
								activity: report.activity,
								headcountReporting: report.headcountReporting,
								occupancyFill: report.occupancyFill,
								headcount: report.headcountReporting ? report.headcount : 0,
							}
						: section,
				),
			}));
		},
		[],
	);

	const toggleIncludeInTotal = useCallback(
		(sectionKey: string, includeInTotal: boolean) => {
			setState((prev) => ({
				...prev,
				sections: prev.sections.map((section) =>
					section.sectionKey === sectionKey
						? { ...section, includeInTotal }
						: section,
				),
			}));
		},
		[],
	);

	const value = useMemo(
		() => ({
			state,
			activeTab,
			setActiveTab,
			resetDemo,
			activeJobs,
			dispatchJob,
			acceptJob,
			rejectJob,
			resolveJob,
			cancelJob,
			createAlert,
			addAlertUpdate,
			resolveAlert,
			reportSection,
			toggleIncludeInTotal,
		}),
		[
			state,
			activeTab,
			resetDemo,
			activeJobs,
			dispatchJob,
			acceptJob,
			rejectJob,
			resolveJob,
			cancelJob,
			createAlert,
			addAlertUpdate,
			resolveAlert,
			reportSection,
			toggleIncludeInTotal,
		],
	);

	return (
		<DemoFloorContext.Provider value={value}>
			{children}
		</DemoFloorContext.Provider>
	);
}

export function useDemoFloor() {
	const context = useContext(DemoFloorContext);
	if (!context) {
		throw new Error("useDemoFloor must be used within DemoFloorProvider");
	}
	return context;
}
