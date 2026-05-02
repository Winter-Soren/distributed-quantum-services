'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	organization: string;
	designation: string;
	trialEndsAt: string;
	trialDaysLeft: number;
	hasSubscription: boolean;
	hasAccess: boolean;
	accessMessage?: string;
}

interface AuthContextType {
	user: UserData | null;
	loading: boolean;
	signOut: () => Promise<void>;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	const fetchUser = async () => {
		try {
			const response = await fetch('/api/auth/me');
			if (response.ok) {
				const data = await response.json();
				setUser(data.user);
			} else {
				setUser(null);
			}
		} catch (error) {
			console.error('Failed to fetch user:', error);
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUser();
	}, []);

	const signOut = async () => {
		try {
			await fetch('/api/auth/signout', { method: 'POST' });
			setUser(null);
			router.push('/signin');
		} catch (error) {
			console.error('Failed to sign out:', error);
		}
	};

	const refreshUser = async () => {
		await fetchUser();
	};

	return (
		<AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
