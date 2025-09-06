"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRoutes = taskRoutes;
const express_1 = require("express");
function taskRoutes(orchestrator) {
    const router = (0, express_1.Router)();
    router.post('/', async (req, res) => {
        try {
            const { prompt } = req.body;
            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }
            const task = await orchestrator.createTask(prompt);
            return res.status(201).json({
                success: true,
                data: task
            });
        }
        catch (error) {
            console.error('Task creation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create task',
                details: error.message
            });
        }
    });
    router.post('/:id/execute', async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Task ID is required' });
            }
            const result = await orchestrator.executeTask(id);
            return res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Task execution error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to execute task',
                details: error.message
            });
        }
    });
    router.post('/:id/delegate', async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Task ID is required' });
            }
            const result = await orchestrator.delegateTask(id);
            return res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Task delegation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to delegate task',
                details: error.message
            });
        }
    });
    router.post('/:id/retry', async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Task ID is required' });
            }
            const result = await orchestrator.retryTask(id);
            return res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Task retry error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to retry task',
                details: error.message
            });
        }
    });
    router.get('/:id/status', async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Task ID is required' });
            }
            const status = orchestrator.getTaskStatus(id);
            if (!status) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }
            return res.json({
                success: true,
                data: status
            });
        }
        catch (error) {
            console.error('Task status error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get task status',
                details: error.message
            });
        }
    });
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Task ID is required' });
            }
            const task = orchestrator.getTask(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }
            return res.json({
                success: true,
                data: task
            });
        }
        catch (error) {
            console.error('Task retrieval error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get task',
                details: error.message
            });
        }
    });
    router.get('/', async (req, res) => {
        try {
            const { status, type, depth } = req.query;
            const filter = {};
            if (status)
                filter.status = status;
            if (type)
                filter.type = type;
            if (depth)
                filter.depth = parseInt(depth);
            const tasks = orchestrator.listTasks(filter);
            return res.json({
                success: true,
                data: {
                    tasks,
                    count: tasks.length,
                    filter
                }
            });
        }
        catch (error) {
            console.error('Task list error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to list tasks',
                details: error.message
            });
        }
    });
    router.get('/:id/events', async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Task ID is required' });
            }
            const events = orchestrator.getTaskEvents(id);
            return res.json({
                success: true,
                data: {
                    taskId: id,
                    events,
                    count: events.length
                }
            });
        }
        catch (error) {
            console.error('Task events error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get task events',
                details: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=tasks.js.map