"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLLMConfigHandler = createLLMConfigHandler;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const DEFAULT_PROMPT_TEMPLATE = `
You are an API configuration assistant. Based on the available routes and user request, generate an appropriate HTTP configuration.

Available API Routes:
{{routes}}

User Request:
{{userInput}}

Generate an HTTP configuration object that matches the user's request using the available routes.
The response must be valid JSON with this exact structure:
{
  "config": {
    "url": string,
    "method": string,
    "params": object (optional),
    "query": object (optional),
    "body": any (optional)
  }
}

Only respond with the JSON object, no additional text.
`;
function createLLMConfigHandler(options = {}) {
    const { apiKeyEnvVar = 'ANTHROPIC_API_KEY', model = 'claude-2', promptTemplate = DEFAULT_PROMPT_TEMPLATE, } = options;
    const anthropic = new sdk_1.default({
        apiKey: process.env[apiKeyEnvVar],
    });
    return function llmConfigHandler(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Only handle requests to the LLM config endpoint
                if (req.path !== '/_llm/config') {
                    return next();
                }
                const userInput = req.body.input;
                if (!userInput) {
                    return res.status(400).json({ error: 'Missing input in request body' });
                }
                // Get all routes from the Express app
                const routes = extractRoutes(req.app);
                // Generate prompt
                const prompt = promptTemplate
                    .replace('{{routes}}', formatRoutes(routes))
                    .replace('{{userInput}}', userInput);
                // Query Claude
                const completion = yield anthropic.messages.create({
                    model,
                    max_tokens: 1024,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                });
                try {
                    const content = completion.content[0];
                    const response = JSON.parse(content.type === 'text' ? content.text : '{}');
                    // Validate the response structure
                    if (!response.config ||
                        !response.config.url ||
                        !response.config.method) {
                        throw new Error('Invalid response structure');
                    }
                    res.json(response);
                }
                catch (parseError) {
                    console.error('Failed to parse Claude response:', parseError);
                    res.status(500).json({ error: 'Invalid response from LLM' });
                }
            }
            catch (error) {
                console.error('LLM Config Handler Error:', error);
                res.status(500).json({ error: 'Failed to generate configuration' });
            }
        });
    };
}
function extractRoutes(app) {
    var _a;
    const routes = [];
    function processRoute(route) {
        var _a;
        if (!route.route)
            return;
        routes.push({
            path: route.route.path,
            method: Object.keys(route.route.methods)[0].toUpperCase(),
            params: (_a = route.keys) === null || _a === void 0 ? void 0 : _a.map((k) => k.name),
        });
    }
    const stack = (_a = app._router) === null || _a === void 0 ? void 0 : _a.stack;
    if (stack) {
        stack.forEach((middleware) => {
            if (middleware.route) {
                processRoute(middleware);
            }
            else if (middleware.name === 'router') {
                middleware.handle.stack.forEach((handler) => {
                    processRoute(handler);
                });
            }
        });
    }
    return routes;
}
function formatRoutes(routes) {
    return routes
        .map((route) => {
        var _a;
        const paramsStr = ((_a = route.params) === null || _a === void 0 ? void 0 : _a.length)
            ? ` (params: ${route.params.join(', ')})`
            : '';
        return `${route.method} ${route.path}${paramsStr}`;
    })
        .join('\n');
}
