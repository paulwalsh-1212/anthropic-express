# anthropic-express

A lightweight Express.js middleware that adds Claude-powered natural language HTTP configuration generation to your API.

## Installation

```bash
npm install anthropic-express
# or
yarn add anthropic-express
# or
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
    apiKeyEnvVar: 'ANTHROPIC_API_KEY', // optional, defaults to ANTHROPIC_API_KEY
    model: 'claude-3-5-sonnet-20241022', // optional, defaults to claude-3-5-sonnet-20241022
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

Now you can make requests to get HTTP configurations by describing what you want to do in natural language:

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

- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)

## Options

The middleware accepts the following options:

```typescript
interface LLMExpressConfigOptions {
  apiKeyEnvVar?: string; // Custom env var name for API key
  model?: string; // Claude model to use
  promptTemplate?: string; // Custom prompt template
}
```

## Features

- Automatically extracts available routes from your Express app
- Generates appropriate HTTP configurations based on natural language input
- Supports URL parameters, query strings, and request bodies
- Customizable prompt template and model selection
- TypeScript support out of the box

## Testing

```bash
npm test
```

## License

MIT

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b feature/my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-new-feature`)
5. Create new Pull Request

## Requirements

- Node.js >= 14
- Express.js >= 4.x

## Related

- [Anthropic Claude](https://www.anthropic.com/claude)
- [Express.js](https://expressjs.com/)
