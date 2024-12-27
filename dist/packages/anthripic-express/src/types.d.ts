export interface LLMExpressConfigOptions {
    apiKeyEnvVar?: string;
    promptTemplate?: string;
    model?: string;
}
export interface RouteInfo {
    path: string;
    method: string;
    params?: string[];
}
export interface LLMResponse {
    config: {
        url: string;
        method: string;
        params?: Record<string, any>;
        query?: Record<string, any>;
        body?: any;
    };
}
