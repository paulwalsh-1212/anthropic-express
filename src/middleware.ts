// src/middleware.ts
import { Request, Response, NextFunction } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { LLMExpressConfigOptions, RouteInfo, LLMResponse } from './types';

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

export function createLLMConfigHandler(options: LLMExpressConfigOptions = {}) {
  const {
    apiKeyEnvVar = 'ANTHROPIC_API_KEY',
    model = 'claude-3-5-sonnet-20241022',
    promptTemplate = DEFAULT_PROMPT_TEMPLATE,
  } = options;

  const anthropic = new Anthropic({
    apiKey: process.env[apiKeyEnvVar],
  });

  return async function llmConfigHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
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
      const completion = await anthropic.messages.create({
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
        if (!content || content.type !== 'text') {
          throw new Error('Bad LLM Completion');
        }
        const response = JSON.parse(content.text) as LLMResponse;

        // Validate the response structure
        if (
          !response.config ||
          !response.config.url ||
          !response.config.method
        ) {
          throw new Error('Invalid response structure');
        }

        res.json(response);
      } catch (parseError) {
        console.error('Failed to parse Claude response:', parseError);
        res.status(500).json({ error: 'Invalid response from LLM' });
      }
    } catch (error) {
      console.error('LLM Config Handler Error:', error);
      res.status(500).json({ error: 'Failed to generate configuration' });
    }
  };
}

function extractRoutes(app: any): RouteInfo[] {
  const routes: RouteInfo[] = [];

  function processRoute(route: any) {
    if (!route.route) return;
    const methods = route.route.methods;
    routes.push({
      path: route.route.path,
      method: Object.keys(methods)[0]?.toUpperCase() || '',
      params: route.keys?.map((k: any) => k.name),
    });
  }

  const stack = app._router?.stack;
  if (stack) {
    stack.forEach((middleware: any) => {
      if (middleware.route) {
        processRoute(middleware);
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler: any) => {
          processRoute(handler);
        });
      }
    });
  }

  return routes;
}

function formatRoutes(routes: RouteInfo[]): string {
  return routes
    .map((route) => {
      const paramsStr = route.params?.length
        ? ` (params: ${route.params.join(', ')})`
        : '';
      return `${route.method} ${route.path}${paramsStr}`;
    })
    .join('\n');
}
