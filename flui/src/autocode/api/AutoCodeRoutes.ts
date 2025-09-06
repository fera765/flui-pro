import { Router } from 'express';
import { container } from '../../config/container';
import { AutoCodeController } from './AutoCodeController';

const router = Router();
const autoCodeController = container.get<AutoCodeController>('AutoCodeController');

// POST /task - Criar nova task
router.post('/task', (req, res) => autoCodeController.createTask(req, res));

// GET /task/:id - Obter task
router.get('/task/:id', (req, res) => autoCodeController.getTask(req, res));

// PATCH /task/:id - Atualizar task
router.patch('/task/:id', (req, res) => autoCodeController.updateTask(req, res));

// DELETE /task/:id - Deletar task
router.delete('/task/:id', (req, res) => autoCodeController.deleteTask(req, res));

// POST /task/:id/iterate - Iterar task
router.post('/task/:id/iterate', (req, res) => autoCodeController.iterateTask(req, res));

// GET /task/:id/stream - Stream de logs da task
router.get('/task/:id/stream', (req, res) => autoCodeController.getTaskStream(req, res));

// GET /task/:id/logs - Obter logs da task
router.get('/task/:id/logs', (req, res) => autoCodeController.getTaskLogs(req, res));

// GET /task/:id/status - Obter status da task
router.get('/task/:id/status', (req, res) => autoCodeController.getTaskStatus(req, res));

// GET /health - Health check
router.get('/health', (req, res) => autoCodeController.healthCheck(req, res));

export default router;