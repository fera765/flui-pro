"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedTaskRoutes = advancedTaskRoutes;
const express_1 = require("express");
function advancedTaskRoutes(orchestrator) {
    const router = (0, express_1.Router)();
    router.post('/', async (req, res) => {
        try {
            const { prompt } = req.body;
            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }
            console.log('=== FLUI TASK CREATION ===');
            console.log('Prompt:', prompt);
            console.log('========================');
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
            console.log('=== FLUI TASK EXECUTION ===');
            console.log('Task ID:', id);
            console.log('===========================');
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
                error: 'Task execution failed',
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
                return res.status(404).json({ error: 'Task not found' });
            }
            const context = orchestrator.getContext(id);
            return res.json({
                success: true,
                data: {
                    task,
                    context: context ? {
                        mainTask: context.mainTask,
                        todos: context.todos,
                        completedTasks: context.completedTasks,
                        generatedFiles: context.generatedFiles,
                        globalContext: context.globalContext
                    } : undefined
                }
            });
        }
        catch (error) {
            console.error('Task retrieval error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve task',
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
                data: events
            });
        }
        catch (error) {
            console.error('Events retrieval error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve events',
                details: error.message
            });
        }
    });
    router.get('/:id/stream', async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'Task ID is required' });
            }
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
            const existingEvents = orchestrator.getTaskEvents(id);
            for (const event of existingEvents) {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
            }
            const interval = setInterval(() => {
                const newEvents = orchestrator.getTaskEvents(id);
                if (newEvents.length > existingEvents.length) {
                    const latestEvents = newEvents.slice(existingEvents.length);
                    for (const event of latestEvents) {
                        res.write(`data: ${JSON.stringify(event)}\n\n`);
                    }
                }
            }, 1000);
            req.on('close', () => {
                clearInterval(interval);
            });
            return;
        }
        catch (error) {
            console.error('Stream error:', error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
            return;
        }
    });
    router.get('/', async (req, res) => {
        try {
            const tasks = orchestrator.getAllTasks();
            return res.json({
                success: true,
                data: tasks
            });
        }
        catch (error) {
            console.error('Tasks retrieval error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve tasks',
                details: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=advancedTasks.js.map