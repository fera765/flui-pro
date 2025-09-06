import { controller, httpPost, httpGet } from 'inversify-express-utils';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { ILlmService } from '../interfaces/ILlmService';

@controller('/llm')
export class LlmController {
  constructor(
    @inject('ILlmService') private llmService: ILlmService
  ) {}

  @httpPost('/generate')
  public async generateResponse(req: Request, res: Response): Promise<Response> {
    try {
      const { prompt, tools } = req.body;
      
      if (!prompt || prompt.trim() === '') {
        return res.status(400).json({
          error: 'Prompt is required'
        });
      }

      const response = tools 
        ? await this.llmService.generateResponseWithTools(prompt, tools)
        : await this.llmService.generateResponse(prompt);

      return res.status(200).json({
        response,
        prompt,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  @httpGet('/status')
  public async getStatus(req: Request, res: Response): Promise<Response> {
    try {
      const isConnected = await this.llmService.isConnected();
      const configuration = this.llmService.getConfiguration();

      return res.status(200).json({
        connected: isConnected,
        configuration: {
          baseUrl: configuration.baseUrl,
          model: configuration.model,
          maxTokens: configuration.maxTokens,
          temperature: configuration.temperature
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}