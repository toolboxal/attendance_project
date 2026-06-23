import { Link } from "@tanstack/react-router";
import { Calendar, CreditCard, LayoutDashboard, Settings } from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "#/components/ui/sidebar";

// Menu items.
const items = [
	{
		title: "Dashboard",
		url: "/app/dashboard",
		icon: LayoutDashboard,
	},
	{
		title: "Events",
		url: "/app/events",
		icon: Calendar,
	},
	{
		title: "Billing",
		url: "/app/billing",
		icon: CreditCard,
	},
	{
		title: "Settings",
		url: "/app/settings",
		icon: Settings,
	},
];

export function AppSidebar() {
	return (
		<Sidebar>
			<SidebarHeader>
				<p className="logo ml-2 mt-2">Asistir</p>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Application</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<Link
											to={item.url as any} // Cast to any temporarily if routes don't exist yet
											activeProps={{
												className:
													"bg-sidebar-accent text-sidebar-accent-foreground",
											}}
										>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
