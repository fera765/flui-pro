"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamRoutes = streamRoutes;
const express_1 = require("express");
function streamRoutes(orchestrator) {
    const router = (0, express_1.Router)();
    router.get('/:id', async (req, res) => {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Task ID is required' });
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });
        res.write(`event: connected\ndata: ${JSON.stringify({
            taskId: id,
            timestamp: new Date().toISOString(),
            message: 'SSE connection established'
        })}\n\n`);
        const historicalEvents = orchestrator.getTaskEvents(id);
        for (const event of historicalEvents) {
            res.write(`event: ${event.type}\ndata: ${JSON.stringify({
                ...event,
                timestamp: event.timestamp.toISOString()
            })}\n\n`);
        }
        res.write(`event: stream_start\ndata: ${JSON.stringify({
            taskId: id,
            timestamp: new Date().toISOString(),
            message: 'Real-time events will follow',
            historicalCount: historicalEvents.length
        })}\n\n`);
        const checkInterval = setInterval(async () => {
            try {
                const currentEvents = orchestrator.getTaskEvents(id);
                const newEvents = currentEvents.slice(historicalEvents.length);
                for (const event of newEvents) {
                    res.write(`event: ${event.type}\ndata: ${JSON.stringify({
                        ...event,
                        timestamp: event.timestamp.toISOString()
                    })}\n\n`);
                }
                historicalEvents.length = currentEvents.length;
                const task = orchestrator.getTask(id);
                if (task && (task.status === 'completed' || task.status === 'failed')) {
                    res.write(`event: stream_end\ndata: ${JSON.stringify({
                        taskId: id,
                        timestamp: new Date().toISOString(),
                        message: 'Task completed, ending stream',
                        finalStatus: task.status
                    })}\n\n`);
                    clearInterval(checkInterval);
                    res.end();
                }
            }
            catch (error) {
                console.error('Stream monitoring error:', error);
                res.write(`event: error\ndata: ${JSON.stringify({
                    taskId: id,
                    timestamp: new Date().toISOString(),
                    error: 'Stream monitoring error',
                    details: error instanceof Error ? error.message : 'Unknown error'
                })}\n\n`);
            }
        }, 1000);
        req.on('close', () => {
            clearInterval(checkInterval);
            console.log(`SSE stream closed for task ${id}`);
        });
        req.on('error', (error) => {
            clearInterval(checkInterval);
            console.error(`SSE stream error for task ${id}:`, error);
        });
    });
    router.get('/health', (_req, res) => {
        return res.json({
            status: 'healthy',
            service: 'SSE Stream',
            timestamp: new Date().toISOString()
        });
    });
    return router;
}
//# sourceMappingURL=stream.js.map