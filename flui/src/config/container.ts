import { Container } from 'inversify';
import 'reflect-metadata';
import { ILlmService } from '../interfaces/ILlmService';
import { LlmService } from '../services/LlmService';

// Create the main container
export const container = new Container();

// Register services
container.bind<ILlmService>('ILlmService').to(LlmService).inSingletonScope();

// Export container for dependency injection
export default container;