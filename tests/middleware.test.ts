// src/__tests__/middleware.test.ts

import express, { Express } from 'express';
import request from 'supertest';
import { createLLMConfigHandler } from '../src/middleware';

describe('LLM Express Config Middleware', () => {
  let app: Express;

  beforeAll(() => {
    // Create a test Express app with mock routes
    app = express();
    app.use(express.json());

    // Add some mock routes to the app
    app.get('/users', (_, res) => res.json([]));
    app.post('/users', (_, res) => res.json({}));
    app.get('/users/:id', (_, res) => res.json({}));
    app.put('/users/:id', (_, res) => res.json({}));
    app.delete('/users/:id', (_, res) => res.json({}));
    app.get('/posts', (_, res) => res.json([]));
    app.post('/posts', (_, res) => res.json({}));

    // Add our middleware
    app.use(
      createLLMConfigHandler({
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        model: 'claude-3-5-sonnet-20241022',
      })
    );
  });

  it('should generate correct HTTP config for natural language request', async () => {
    // Ensure API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ANTHROPIC_API_KEY environment variable is required for this test'
      );
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
      const response = await request(app)
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }, 30000); // Increase timeout to 30 seconds for API calls
});
