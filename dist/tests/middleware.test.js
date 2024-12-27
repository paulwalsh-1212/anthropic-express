"use strict";
// src/__tests__/middleware.test.ts
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
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const middleware_1 = require("../packages/anthripic-express/src/middleware");
describe('LLM Express Config Middleware', () => {
    let app;
    beforeAll(() => {
        // Create a test Express app with mock routes
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        // Add some mock routes to the app
        app.get('/users', (req, res) => res.json([]));
        app.post('/users', (req, res) => res.json({}));
        app.get('/users/:id', (req, res) => res.json({}));
        app.put('/users/:id', (req, res) => res.json({}));
        app.delete('/users/:id', (req, res) => res.json({}));
        app.get('/posts', (req, res) => res.json([]));
        app.post('/posts', (req, res) => res.json({}));
        // Add our middleware
        app.use((0, middleware_1.createLLMConfigHandler)({
            apiKeyEnvVar: 'ANTHROPIC_API_KEY',
            model: 'claude-2',
        }));
    });
    it('should generate correct HTTP config for natural language request', () => __awaiter(void 0, void 0, void 0, function* () {
        // Ensure API key is set
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required for this test');
        }
        // Test different natural language inputs
        const testCases = [
            {
                input: 'Get all users',
                expectedMethod: 'GET',
                expectedUrlPattern: /^\/users$/,
            },
            {
                input: 'Get user with ID 123',
                expectedMethod: 'GET',
                expectedUrlPattern: /^\/users\/\d+$/,
            },
            {
                input: 'Create a new user',
                expectedMethod: 'POST',
                expectedUrlPattern: /^\/users$/,
            },
        ];
        for (const testCase of testCases) {
            const response = yield (0, supertest_1.default)(app)
                .post('/_llm/config')
                .send({ input: testCase.input })
                .expect('Content-Type', /json/)
                .expect(200);
            // Verify response structure
            expect(response.body).toHaveProperty('config');
            expect(response.body.config).toHaveProperty('url');
            expect(response.body.config).toHaveProperty('method');
            // Verify the generated config matches expectations
            const { config } = response.body;
            expect(config.method.toUpperCase()).toBe(testCase.expectedMethod);
            expect(config.url).toMatch(testCase.expectedUrlPattern);
            // Log the result for debugging
            console.log(`Test case: "${testCase.input}"`);
            console.log('Generated config:', config);
            console.log('---');
            // Add a small delay between requests to avoid rate limiting
            yield new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }), 30000); // Increase timeout to 30 seconds for API calls
});
