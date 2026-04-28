import 'server-only';

type FetchBackendJsonOptions = Omit<RequestInit, 'cache'>;

const DEFAULT_BACKEND_URL = 'http://127.0.0.1:8081';

type BackendErrorPayload = {
	detail?: unknown;
	message?: unknown;
	error?: unknown;
	details?: unknown;
};

export class BackendClientError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly details?: string
	) {
		super(message);
		this.name = 'BackendClientError';
	}
}

export function getBackendBaseUrl() {
	return (process.env.QUANTUM_BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/+$/, '');
}

export function applyBackendAuth(headers: Headers | Record<string, string>) {
	const token = process.env.QUANTUM_BACKEND_API_KEY?.trim();

	if (!token) {
		return;
	}

	const authorization = token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`;

	if (headers instanceof Headers) {
		headers.set('Authorization', authorization);
		return;
	}

	headers.Authorization = authorization;
}

function normalizeBackendErrorDetails(payload: BackendErrorPayload | null) {
	if (!payload) {
		return undefined;
	}

	if (typeof payload.detail === 'string' && payload.detail.trim()) {
		return payload.detail.trim();
	}

	if (Array.isArray(payload.detail)) {
		const joined = payload.detail
			.map(item => (item && typeof item === 'object' && 'msg' in item ? item.msg : item))
			.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
			.join(' ');

		if (joined) {
			return joined;
		}
	}

	const details =
		Array.isArray(payload.details)
			? payload.details
					.map(item =>
						item && typeof item === 'object' && 'message' in item && typeof item.message === 'string'
							? item.message
							: null
					)
					.filter((item): item is string => item !== null && item.trim().length > 0)
					.join(' ')
			: undefined;

	if (details) {
		return details;
	}

	if (typeof payload.message === 'string' && payload.message.trim()) {
		return payload.message.trim();
	}

	if (typeof payload.error === 'string' && payload.error.trim()) {
		return payload.error.trim();
	}

	return undefined;
}

export async function readBackendErrorDetails(response: Response) {
	try {
		const payload = (await response.json()) as BackendErrorPayload | null;
		return normalizeBackendErrorDetails(payload) ?? (response.statusText || undefined);
	} catch {
		return response.statusText || undefined;
	}
}

export async function fetchBackendJson<T>(pathname: string, init: FetchBackendJsonOptions = {}): Promise<T> {
	const url = new URL(pathname, `${getBackendBaseUrl()}/`);
	const headers = new Headers(init.headers);

	headers.set('Accept', 'application/json');
	applyBackendAuth(headers);

	let response: Response;

	try {
		response = await fetch(url, {
			...init,
			cache: 'no-store',
			headers
		});
	} catch (error) {
		throw new BackendClientError(
			`Failed to reach backend at ${getBackendBaseUrl()}.`,
			503,
			error instanceof Error ? error.message : 'Unknown network error.'
		);
	}

	if (!response.ok) {
		const details = await readBackendErrorDetails(response);

		throw new BackendClientError(`Backend request failed for ${pathname}.`, response.status, details);
	}

	return (await response.json()) as T;
}
