import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/signin', '/signup'];
const authPaths = ['/signin', '/signup'];

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Allow public paths
	if (publicPaths.some((path) => pathname.startsWith(path))) {
		return NextResponse.next();
	}

	// Check for auth token
	const token = request.cookies.get('auth_token');

	// Redirect to signin if no token and trying to access protected route
	if (!token && !publicPaths.some((path) => pathname.startsWith(path))) {
		const url = request.nextUrl.clone();
		url.pathname = '/signin';
		url.searchParams.set('redirect', pathname);
		return NextResponse.redirect(url);
	}

	// Redirect to home if authenticated user tries to access auth pages
	if (token && authPaths.some((path) => pathname.startsWith(path))) {
		const url = request.nextUrl.clone();
		url.pathname = '/';
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico|placeholder.svg).*)',
	],
};
