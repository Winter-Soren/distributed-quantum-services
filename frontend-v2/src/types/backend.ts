export type BackendHealthResponse = {
	status: string;
	service: string;
	version: string;
	environment: string;
	uptime_seconds: number;
};

export type BackendServiceResponse = {
	node_id: string;
	listen_addrs: string[];
	service_type: string;
	fidelity: number;
	qubit_min: number;
	qubit_max: number;
	availability: boolean;
	updated_at: string;
};

export type BackendFidelitySampleResponse = {
	service_type: string;
	fidelity: number;
	availability: boolean;
	updated_at: string;
};

export type BackendFidelityMetricsResponse = {
	node_id: string;
	sample_count: number;
	average_fidelity: number;
	min_fidelity: number;
	max_fidelity: number;
	samples: BackendFidelitySampleResponse[];
};
