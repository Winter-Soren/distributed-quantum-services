'use client';

import { ChevronsUpDown, LogOut, Settings, User } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function NavUser() {
	const { isMobile } = useSidebar();
	const { user, signOut } = useAuth();

	if (!user) return null;

	const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<SidebarMenuButton
						size="lg"
						className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<Avatar className="h-8 w-8 rounded-lg bg-[var(--ds-bg-elevated)] border border-[var(--ds-border)]">
							<AvatarFallback className="rounded-lg bg-[var(--ds-bg-hover)] text-[var(--ds-text-primary)] text-xs font-medium">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium text-[var(--ds-text-primary)]">
								{user.firstName} {user.lastName}
							</span>
							<span className="truncate text-xs text-[var(--ds-text-secondary)]">{user.email}</span>
						</div>
						<ChevronsUpDown className="ml-auto size-4 text-[var(--ds-text-secondary)]" />
					</SidebarMenuButton>
				</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-[var(--ds-bg-elevated)] border-[var(--ds-border)]"
						side={isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
					<DropdownMenuLabel className="p-0 font-normal">
						<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
							<Avatar className="h-8 w-8 rounded-lg bg-[var(--ds-bg-elevated)] border border-[var(--ds-border)]">
								<AvatarFallback className="rounded-lg bg-[var(--ds-bg-hover)] text-[var(--ds-text-primary)] text-xs font-medium">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium text-[var(--ds-text-primary)]">
									{user.firstName} {user.lastName}
								</span>
								<span className="truncate text-xs text-[var(--ds-text-secondary)]">{user.email}</span>
							</div>
						</div>
					</DropdownMenuLabel>
						<DropdownMenuSeparator className="bg-[var(--ds-border)]" />
					<DropdownMenuGroup>
						<DropdownMenuItem asChild className="text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-hover)]">
							<Link href="/settings/profile" className="flex items-center cursor-pointer">
								<User className="mr-2 h-4 w-4" />
								Profile
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild className="text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-hover)]">
							<Link href="/settings" className="flex items-center cursor-pointer">
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Link>
						</DropdownMenuItem>
					</DropdownMenuGroup>
						<DropdownMenuSeparator className="bg-[var(--ds-border)]" />
						{!user.hasSubscription && (
							<>
								<DropdownMenuLabel className="text-xs text-[var(--ds-text-secondary)] px-2 py-1">
									Trial: {user.trialDaysLeft} day{user.trialDaysLeft !== 1 ? 's' : ''} left
								</DropdownMenuLabel>
								<DropdownMenuSeparator className="bg-[var(--ds-border)]" />
							</>
						)}
					<DropdownMenuItem
						onClick={() => signOut()}
						className="text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-hover)] cursor-pointer"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Sign out
					</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
