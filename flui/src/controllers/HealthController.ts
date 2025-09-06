import { controller, httpGet } from 'inversify-express-utils';
import { Request, Response } from 'express';

@controller('/health')
export class HealthController {
  @httpGet('/')
  public async getHealth(req: Request, res: Response): Promise<Response> {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'flui-agent',
      version: '1.0.0'
    });
  }
}