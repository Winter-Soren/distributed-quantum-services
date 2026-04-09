'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
	BellIcon,
	BotIcon,
	CalendarIcon,
	ChevronDownIcon,
	FileTextIcon,
	FolderKanbanIcon,
	GaugeIcon,
	HomeIcon,
	NetworkIcon,
	PlusIcon,
	SearchIcon,
	SettingsIcon,
	VideoIcon
} from 'lucide-react';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
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
	SidebarProvider
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type DashboardLayoutProps = {
	children: ReactNode;
};

const navItems = [
	{
		key: 'home',
		railLabel: 'Home',
		label: 'Home',
		icon: HomeIcon,
		emoji: 'HM'
	},
	{
		key: 'network',
		railLabel: 'Network',
		label: 'Network',
		icon: NetworkIcon,
		emoji: 'NW'
	},
	{
		key: 'runs-projects',
		railLabel: 'Runs',
		label: 'Runs & Projects',
		icon: FolderKanbanIcon,
		emoji: 'RP'
	},
	{
		key: 'analytics',
		railLabel: 'Analytics',
		label: 'Analytics',
		icon: GaugeIcon,
		emoji: 'AN'
	},
	{
		key: 'docs',
		railLabel: 'Docs',
		label: 'Docs',
		icon: FileTextIcon,
		emoji: 'DC'
	},
	{
		key: 'ai',
		railLabel: 'AI',
		label: 'AI Assistant',
		icon: BotIcon,
		emoji: 'AI'
	},
	{
		key: 'settings',
		railLabel: 'Settings',
		label: 'Settings',
		icon: SettingsIcon,
		emoji: 'ST'
	}
] as const;

const panelData: Record<string, { group: string; items: string[] }[]> = {
	home: [
		{ group: 'Home', items: ['Overview', 'Activity', 'Quick Actions'] },
		{ group: 'Current Focus', items: ['Network Health', 'Open Runs', 'Recent Alerts'] }
	],
	network: [
		{ group: 'Network', items: ['Service Mesh', 'Nodes', 'Services', 'Fidelity'] },
		{ group: 'Topology', items: ['DAG View', 'Circuit Paths', 'Zones'] }
	],
	'runs-projects': [
		{ group: 'Runs', items: ['Active Run', 'Run History', 'Plans', 'Results'] },
		{ group: 'Projects', items: ['All Projects', 'Experiments', 'Reports', 'Artifacts'] }
	],
	analytics: [
		{ group: 'Analytics', items: ['Measurements', 'Geometry', 'Deep State', 'Comparisons'] },
		{ group: 'Insights', items: ['Trend Explorer', 'Anomalies', 'Forecasts'] }
	],
	docs: [
		{ group: 'Documentation', items: ['System Docs', 'Roadmap', 'API Reference'] },
		{ group: 'Developer', items: ['Schemas', 'Examples', 'Playbooks'] }
	],
	ai: [
		{ group: 'AI', items: ['Assistant', 'Prompt Studio', 'Automation'] },
		{ group: 'Knowledge', items: ['Context Packs', 'Model Runs', 'Suggestions'] }
	],
	settings: [
		{ group: 'Workspace', items: ['General', 'Integrations', 'Users'] },
		{ group: 'System', items: ['Security', 'Observability', 'Audit Logs'] }
	]
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
	const [activeItem, setActiveItem] = useState<(typeof navItems)[number]['key']>(navItems[0].key);
	const [activePanelItem, setActivePanelItem] = useState<string | null>(null);

	const activeNav = navItems.find(item => item.key === activeItem) ?? navItems[0];
	const activeGroups = panelData[activeItem] ?? [];

	return (
		<div className='flex h-svh max-h-svh flex-col overflow-hidden bg-muted/30 text-foreground'>
			{/* Top bar — workspace, search, actions */}
			<header className='flex h-11 shrink-0 items-center gap-3 border-b border-border bg-background px-3'>
				<div className='flex items-center gap-2'>
					<span className='flex size-7 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground shadow-sm'>
						QG
					</span>
					<button
						type='button'
						className='flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted'
					>
						Quantum Gates
						<ChevronDownIcon className='size-4 opacity-70' />
					</button>
					<button
						type='button'
						className='hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:block'
						aria-label='Open calendar'
					>
						<CalendarIcon className='size-4' />
					</button>
				</div>

				<div className='mx-auto flex max-w-xl flex-1'>
					<div className='flex w-full items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground shadow-inner'>
						<SearchIcon className='size-4 shrink-0 opacity-60' />
						<span className='flex-1 truncate'>Search</span>
						<kbd className='hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block'>
							⌘ K
						</kbd>
					</div>
				</div>

				<div className='flex items-center gap-1'>
					<Button
						type='button'
						variant='ghost'
						size='icon-sm'
						aria-label='Notifications'
					>
						<BellIcon className='size-4' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='icon-sm'
						aria-label='Video'
					>
						<VideoIcon className='size-4' />
					</Button>
					<button
						type='button'
						className='relative ml-1 flex size-8 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-background'
						aria-label='Account'
					>
						SB
						<span className='absolute bottom-0.5 right-0.5 size-1.5 rounded-full bg-emerald-500 ring-2 ring-background' />
					</button>
				</div>
			</header>

			<div className='flex min-h-0 min-w-0 flex-1 gap-2 overflow-hidden px-2 pb-2 pt-2'>
				{/* Floating rail — icons + short labels (no scroll; height follows viewport) */}
				<aside className='flex min-h-0 w-16 shrink-0 flex-col items-center overflow-hidden rounded-2xl border border-border bg-card py-2 shadow-lg ring-1 ring-black/5'>
					<div className='mb-1.5 flex size-8 items-center justify-center rounded-lg bg-primary/10 text-[9px] font-bold text-primary'>
						QG
					</div>

					<nav className='flex flex-1 flex-col items-center gap-1 px-0.5'>
						{navItems.map(item => {
							const Icon = item.icon;
							const isActive = activeItem === item.key;

							return (
								<button
									key={item.key}
									type='button'
									aria-label={item.label}
									aria-pressed={isActive}
									onClick={() => {
										setActiveItem(item.key);
										setActivePanelItem(null);
									}}
									className={cn(
										'flex w-full flex-col items-center gap-px rounded-lg px-1 py-1.5 transition-colors',
										isActive
											? 'bg-primary/15 text-primary shadow-sm ring-1 ring-primary/25'
											: 'text-muted-foreground hover:bg-muted hover:text-foreground'
									)}
								>
									<Icon className='size-4 shrink-0' />
									<span className='max-w-full truncate text-[9px] font-medium leading-tight'>
										{item.railLabel}
									</span>
								</button>
							);
						})}
					</nav>

					<button
						type='button'
						aria-label='Settings'
						className='mt-1 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
					>
						<SettingsIcon className='size-3.5' />
					</button>
				</aside>

				{/* Secondary sidebar (shadcn sidebar-01: grouped nav) + main */}
				<SidebarProvider className='!min-h-0 flex min-w-0 flex-1 flex-col overflow-hidden'>
					<div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl ring-1 ring-black/5'>
						<div className='flex min-h-0 min-w-0 flex-1 overflow-hidden'>
							<Sidebar
								collapsible='none'
								className='h-full min-h-0 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground'
							>
								<SidebarHeader className='gap-1 border-b border-sidebar-border px-4 py-3'>
									<div className='flex items-start justify-between gap-2'>
										<div className='min-w-0'>
											<p className='truncate text-sm font-semibold'>{activeNav.label}</p>
											<p className='text-xs text-sidebar-foreground/70'>Workspace navigation</p>
										</div>
										<Button
											type='button'
											size='icon'
											variant='outline'
											className='size-8 shrink-0 rounded-lg border-sidebar-border bg-sidebar-accent/50'
											aria-label='Add'
										>
											<PlusIcon className='size-4' />
										</Button>
									</div>
								</SidebarHeader>
								<SidebarContent className='gap-0 px-0 py-2'>
									{activeGroups.map(section => (
										<SidebarGroup key={section.group}>
											<SidebarGroupLabel className='px-4 text-xs font-medium text-sidebar-foreground/70'>
												{section.group}
											</SidebarGroupLabel>
											<SidebarGroupContent>
												<SidebarMenu>
													{section.items.map(item => (
														<SidebarMenuItem key={item}>
															<SidebarMenuButton
																type='button'
																isActive={activePanelItem === item}
																onClick={() => setActivePanelItem(item)}
																className='px-4'
															>
																<span className='truncate'>{item}</span>
															</SidebarMenuButton>
														</SidebarMenuItem>
													))}
												</SidebarMenu>
											</SidebarGroupContent>
										</SidebarGroup>
									))}
								</SidebarContent>
							</Sidebar>

							<div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background'>
							<header className='flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3'>
								<Breadcrumb>
									<BreadcrumbList>
										<BreadcrumbItem>
											<BreadcrumbLink asChild>
												<Link href='/dashboard'>Dashboard</Link>
											</BreadcrumbLink>
										</BreadcrumbItem>
										<BreadcrumbSeparator />
										{activePanelItem ? (
											<>
												<BreadcrumbItem className='max-w-[40vw] sm:max-w-none'>
													<BreadcrumbLink asChild>
														<Link
															href='/dashboard'
															className='truncate'
															onClick={() => setActivePanelItem(null)}
														>
															{activeNav.label}
														</Link>
													</BreadcrumbLink>
												</BreadcrumbItem>
												<BreadcrumbSeparator />
												<BreadcrumbItem className='min-w-0 max-w-[min(100%,12rem)] sm:max-w-md'>
													<BreadcrumbPage className='truncate'>{activePanelItem}</BreadcrumbPage>
												</BreadcrumbItem>
											</>
										) : (
											<BreadcrumbItem>
												<BreadcrumbPage>{activeNav.label}</BreadcrumbPage>
											</BreadcrumbItem>
										)}
									</BreadcrumbList>
								</Breadcrumb>
							</header>

							<main className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain'>
								{children}
							</main>
							</div>
						</div>
					</div>
				</SidebarProvider>
			</div>
		</div>
	);
}
