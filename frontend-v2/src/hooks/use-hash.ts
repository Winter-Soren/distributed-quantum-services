'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Current URL hash without `#`, updated on navigation and `hashchange`. */
export function useHash(): string {
	const pathname = usePathname();
	const [hash, setHash] = useState('');

	useEffect(() => {
		const read = () => {
			if (typeof window === 'undefined') return;
			setHash(window.location.hash.replace(/^#/, ''));
		};
		read();
		window.addEventListener('hashchange', read);
		return () => window.removeEventListener('hashchange', read);
	}, [pathname]);

	return hash;
}
