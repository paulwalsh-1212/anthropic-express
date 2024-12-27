# LLM Express Config

A lightweight Express.js middleware that adds LLM-powered HTTP configuration generation to your API.

## Installation

```bash
pnpm add anthropic-express
```

## Usage

```typescript
import express from 'express';
import { createLLMConfigHandler } from 'anthropic-express';

const app = express();

// Add the middleware
app.use(express.json());
app.use(
  createLLMConfigHandler({
    apiKeyEnvVar: 'OPENAI_API_KEY', // optional, defaults to OPENAI_API_KEY
  })
);

// Your routes
app.get('/users', (req, res) => {
  /* ... */
});
app.post('/users', (req, res) => {
  /* ... */
});
app.get('/users/:id', (req, res) => {
  /* ... */
});

// Start server
app.listen(3000);
```

Now you can make requests to get HTTP configurations:

```bash
curl -X POST http://localhost:3000/_llm/config \
  -H "Content-Type: application/json" \
  -d '{"input": "Get all users"}'
```

Response:

```json
{
  "config": {
    "url": "/users",
    "method": "GET"
  }
}
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## Options

- `apiKeyEnvVar`: Custom environment variable name for the API key
- `promptTemplate`: Custom prompt template for the LLM
