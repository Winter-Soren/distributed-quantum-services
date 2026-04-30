'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NavUser } from '@/components/nav-user';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenuSub,
	SidebarMenuSubItem,
	SidebarMenuSubButton
} from '@/components/ui/sidebar';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
	LayoutDashboardIcon,
	PlayCircleIcon,
	NetworkIcon,
	BarChart3Icon,
	Settings2Icon,
	ChevronRightIcon,
	WalletIcon,
	CommandIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const data = {
	user: {
		name: 'Winter-Soren',
		email: 'winter@quantum.dev',
		avatar: '/avatars/default.jpg'
	}
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const [dashboardOpen, setDashboardOpen] = React.useState(pathname === '/dashboard' || pathname.startsWith('/dashboard'));
	const [runsOpen, setRunsOpen] = React.useState(pathname === '/runs' || pathname.startsWith('/runs') || pathname === '/finance');

	// Auto-open sections based on current path
	React.useEffect(() => {
		if (pathname === '/dashboard' || pathname.startsWith('/dashboard')) {
			setDashboardOpen(true);
		}
		if (pathname === '/runs' || pathname.startsWith('/runs') || pathname === '/finance') {
			setRunsOpen(true);
		}
	}, [pathname]);

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId);
		if (element) {
			const offset = 80; // Account for sticky header
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - offset;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
		}
	};

	const isDashboardActive = pathname === '/dashboard' || pathname.startsWith('/dashboard');
	const isRunsActive = pathname === '/runs' || pathname.startsWith('/runs');
	const isFinanceActive = pathname === '/finance' || pathname.startsWith('/finance');
	const isNetworkActive = pathname.startsWith('/network');
	const isAnalyticsActive = pathname.startsWith('/analytics');
	const isSettingsActive = pathname.startsWith('/settings');

	return (
		<Sidebar
			collapsible='icon'
			{...props}
		>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							size='lg'
							className='data-[slot=sidebar-menu-button]:h-12'
						>
							<Link href='/dashboard'>
								<div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
									<CommandIcon className='size-4' />
								</div>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-semibold'>Quantum Network</span>
									<span className='truncate text-xs text-muted-foreground'>py-libp2p</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{/* Dashboard with scroll-to sections */}
				<SidebarGroup>
					<Collapsible
						open={dashboardOpen}
						onOpenChange={setDashboardOpen}
						className='group/collapsible'
					>
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton
									tooltip='Dashboard'
									className={cn(isDashboardActive && 'bg-sidebar-accent text-sidebar-accent-foreground')}
								>
									<LayoutDashboardIcon className='size-4' />
									<span>Dashboard</span>
									<ChevronRightIcon className='ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
								</SidebarMenuButton>
							</CollapsibleTrigger>
						</SidebarMenuItem>
						<CollapsibleContent>
							<SidebarMenuSub>
								<SidebarMenuSubItem>
									<SidebarMenuSubButton
										asChild
										onClick={() => scrollToSection('network-topology')}
									>
										<button type='button'>
											<span>Network Topology</span>
										</button>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
								<SidebarMenuSubItem>
									<SidebarMenuSubButton
										asChild
										onClick={() => scrollToSection('service-registry')}
									>
										<button type='button'>
											<span>Service Registry</span>
										</button>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
								<SidebarMenuSubItem>
									<SidebarMenuSubButton
										asChild
										onClick={() => scrollToSection('metrics')}
									>
										<button type='button'>
											<span>Metrics</span>
										</button>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
								<SidebarMenuSubItem>
									<SidebarMenuSubButton
										asChild
										onClick={() => scrollToSection('overview')}
									>
										<button type='button'>
											<span>Overview</span>
										</button>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							</SidebarMenuSub>
						</CollapsibleContent>
					</Collapsible>
				</SidebarGroup>

				{/* Runs with Finance accordion */}
				<SidebarGroup>
					<Collapsible
						open={runsOpen}
						onOpenChange={setRunsOpen}
						className='group/collapsible'
					>
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton
									tooltip='Runs'
									className={cn((isRunsActive || isFinanceActive) && 'bg-sidebar-accent text-sidebar-accent-foreground')}
								>
									<PlayCircleIcon className='size-4' />
									<span>Runs</span>
									<ChevronRightIcon className='ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
								</SidebarMenuButton>
							</CollapsibleTrigger>
						</SidebarMenuItem>
						<CollapsibleContent>
							<SidebarMenuSub>
								<SidebarMenuSubItem>
									<SidebarMenuSubButton
										asChild
										isActive={isRunsActive}
									>
										<Link href='/runs'>
											<span>All Runs</span>
										</Link>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
								<SidebarMenuSubItem>
									<SidebarMenuSubButton
										asChild
										isActive={isFinanceActive}
									>
										<Link href='/finance'>
											<WalletIcon className='size-3' />
											<span>Finance</span>
										</Link>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							</SidebarMenuSub>
						</CollapsibleContent>
					</Collapsible>
				</SidebarGroup>

				{/* Network */}
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								tooltip='Network'
								className={cn(isNetworkActive && 'bg-sidebar-accent text-sidebar-accent-foreground')}
							>
								<Link href='/network'>
									<NetworkIcon className='size-4' />
									<span>Network</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>

				{/* Analytics */}
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								tooltip='Analytics'
								className={cn(isAnalyticsActive && 'bg-sidebar-accent text-sidebar-accent-foreground')}
							>
								<Link href='/analytics'>
									<BarChart3Icon className='size-4' />
									<span>Analytics</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>

				{/* Settings */}
				<SidebarGroup className='mt-auto'>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								tooltip='Settings'
								className={cn(isSettingsActive && 'bg-sidebar-accent text-sidebar-accent-foreground')}
							>
								<Link href='/settings'>
									<Settings2Icon className='size-4' />
									<span>Settings</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
