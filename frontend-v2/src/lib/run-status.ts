import type { BackendJobStatus } from '@/types/backend';
import type { FinancialJobStatus, RunBadgeVariant, RunListBackendStatus, RunStatusGroup } from '@/types/runs';

export function getRunStatusGroup(status: BackendJobStatus): RunStatusGroup {
	switch (status) {
		case 'QUEUED':
			return 'queued';
		case 'COMPILING':
		case 'RESERVING':
		case 'EXECUTING':
			return 'running';
		case 'COMPLETED':
			return 'completed';
		case 'FAILED':
			return 'failed';
	}
}

export function getRunStatusLabel(status: BackendJobStatus) {
	switch (status) {
		case 'QUEUED':
			return 'Queued';
		case 'COMPILING':
			return 'Compiling';
		case 'RESERVING':
			return 'Reserving';
		case 'EXECUTING':
			return 'Executing';
		case 'COMPLETED':
			return 'Completed';
		case 'FAILED':
			return 'Failed';
	}
}

export function getRunBadgeVariant(status: BackendJobStatus): RunBadgeVariant {
	switch (status) {
		case 'EXECUTING':
			return 'default';
		case 'QUEUED':
		case 'COMPILING':
		case 'RESERVING':
			return 'secondary';
		case 'COMPLETED':
			return 'outline';
		case 'FAILED':
			return 'destructive';
	}
}

export function isTerminalRunStatus(status: RunListBackendStatus) {
	return status === 'COMPLETED' || status === 'FAILED';
}

export function getRunStatusGroupFinancial(status: FinancialJobStatus): RunStatusGroup {
	switch (status) {
		case 'QUEUED':
			return 'queued';
		case 'INGESTING':
		case 'ANALYSING':
			return 'running';
		case 'COMPLETED':
			return 'completed';
		case 'FAILED':
			return 'failed';
	}
}

export function getRunStatusLabelFinancial(status: FinancialJobStatus): string {
	switch (status) {
		case 'QUEUED':
			return 'Queued';
		case 'INGESTING':
			return 'Ingesting';
		case 'ANALYSING':
			return 'Analysing';
		case 'COMPLETED':
			return 'Completed';
		case 'FAILED':
			return 'Failed';
	}
}

export function getRunBadgeVariantFinancial(status: FinancialJobStatus): RunBadgeVariant {
	switch (status) {
		case 'ANALYSING':
			return 'default';
		case 'QUEUED':
		case 'INGESTING':
			return 'secondary';
		case 'COMPLETED':
			return 'outline';
		case 'FAILED':
			return 'destructive';
	}
}
