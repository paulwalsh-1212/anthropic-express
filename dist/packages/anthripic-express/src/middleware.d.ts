import { Request, Response, NextFunction } from 'express';
import { LLMExpressConfigOptions } from './types';
export declare function createLLMConfigHandler(options?: LLMExpressConfigOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
