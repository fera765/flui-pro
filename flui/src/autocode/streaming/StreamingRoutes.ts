import { Router } from 'express';
import { container } from '../../config/container';
import { StreamingController } from './StreamingController';

const router = Router();
const streamingController = container.get<StreamingController>('StreamingController');

// GET /callbacks/:taskId - Stream de callbacks em tempo real
router.get('/callbacks/:taskId', (req, res) => streamingController.getTaskStream(req, res));

// GET /callbacks/:taskId/status - Status do stream
router.get('/callbacks/:taskId/status', (req, res) => streamingController.getStreamStatus(req, res));

// POST /callbacks/:taskId/send - Enviar mensagem para stream
router.post('/callbacks/:taskId/send', (req, res) => streamingController.sendMessageToStream(req, res));

// GET /callbacks/stats - Estatísticas dos streams
router.get('/callbacks/stats', (req, res) => streamingController.getStreamStats(req, res));

// DELETE /callbacks/:taskId - Fechar stream
router.delete('/callbacks/:taskId', (req, res) => streamingController.closeStream(req, res));

export default router;