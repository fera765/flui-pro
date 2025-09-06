import { Container } from 'inversify';
import 'reflect-metadata';

// Create the main container
export const container = new Container();

// Export container for dependency injection
export default container;