import { Request, Response } from 'express';
import { ActiveUserData } from '../../auth/auth.types';

export interface GraphqlContext {
  req: Request;
  res: Response;
  requestId: string;
  user?: ActiveUserData | null;
}
