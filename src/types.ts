// src/types.ts
export interface LLMExpressConfigOptions {
  apiKeyEnvVar?: string; // Custom env var name for API key
  promptTemplate?: string; // Custom prompt template
  model?: string; // Claude model to use
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
