import { Router } from 'express';
import { container } from '../../config/container';
import { AutoCodeController } from './AutoCodeController';

const router = Router();
const autoCodeController = container.get<AutoCodeController>('AutoCodeController');

// POST /task - Criar nova task
router.post('/task', (req, res) => autoCodeController.createTask(req, res));

// GET /tasks - Listar tasks
router.get('/tasks', (req, res) => autoCodeController.listTasks(req, res));

// GET /task/:id - Obter task
router.get('/task/:id', (req, res) => autoCodeController.getTask(req, res));

// PATCH /task/:id - Atualizar task
router.patch('/task/:id', (req, res) => autoCodeController.updateTask(req, res));

// DELETE /task/:id - Deletar task
router.delete('/task/:id', (req, res) => autoCodeController.deleteTask(req, res));

// POST /task/:id/iterate - Iterar task
router.post('/task/:id/iterate', (req, res) => autoCodeController.iterateTask(req, res));

// POST /task/:id/retry - Tentar novamente task falhada
router.post('/task/:id/retry', (req, res) => autoCodeController.retryTask(req, res));

// GET /task/:id/stream - Stream de logs da task
router.get('/task/:id/stream', (req, res) => autoCodeController.getTaskStream(req, res));

// GET /task/:id/logs - Obter logs da task
router.get('/task/:id/logs', (req, res) => autoCodeController.getTaskLogs(req, res));

// GET /task/:id/status - Obter status da task
router.get('/task/:id/status', (req, res) => autoCodeController.getTaskStatus(req, res));

// GET /task/:id/emotion - Obter insights emocionais da task
router.get('/task/:id/emotion', (req, res) => autoCodeController.getTaskEmotionInsights(req, res));

// POST /task/:id/emotion/context - Obter contexto emocional para decisão
router.post('/task/:id/emotion/context', (req, res) => autoCodeController.getEmotionalContextForDecision(req, res));

// DELETE /task/:id/emotion - Limpar memória emocional da task
router.delete('/task/:id/emotion', (req, res) => autoCodeController.clearTaskEmotionMemory(req, res));

// GET /system/status - Status do sistema (removido - método não implementado)
// router.get('/system/status', (req, res) => autoCodeController.getSystemStatus(req, res));

// POST /system/optimize - Otimizar sistema (removido - método não implementado)
// router.post('/system/optimize', (req, res) => autoCodeController.optimizeSystem(req, res));

// GET /health - Health check
router.get('/health', (req, res) => autoCodeController.healthCheck(req, res));

// Security routes
// GET /task/:id/security - Obter auditoria de segurança da task
router.get('/task/:id/security', (req, res) => autoCodeController.getTaskSecurityAudit(req, res));

// POST /task/:id/security/audit - Executar nova auditoria de segurança
router.post('/task/:id/security/audit', (req, res) => autoCodeController.executeSecurityAudit(req, res));

// POST /task/:id/rollback - Criar ponto de rollback
router.post('/task/:id/rollback', (req, res) => autoCodeController.createRollbackPoint(req, res));

// GET /task/:id/rollback - Listar pontos de rollback
router.get('/task/:id/rollback', (req, res) => autoCodeController.getRollbackPoints(req, res));

// POST /task/:id/rollback/:rollbackId - Executar rollback
router.post('/task/:id/rollback/:rollbackId', (req, res) => autoCodeController.executeRollback(req, res));

// POST /security/check - Verificar segurança de operação
router.post('/security/check', (req, res) => autoCodeController.checkOperationSafety(req, res));

export default router;