"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
class MetricsCollector {
    constructor() {
        this.metrics = [];
        this.maxMetrics = 10000;
    }
    recordMetrics(sriResult, taskId, agentId, contextType = 'simple') {
        const metric = {
            timestamp: new Date(),
            originalTokens: sriResult.originalTokens,
            optimizedTokens: sriResult.optimizedTokens,
            reductionPercentage: sriResult.reductionPercentage,
            injectedMemories: sriResult.injectedMemories.length,
            taskId,
            agentId,
            contextType
        };
        this.metrics.push(metric);
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    }
    getPerformanceMetrics() {
        if (this.metrics.length === 0) {
            return {
                totalRequests: 0,
                averageReduction: 0,
                totalTokensSaved: 0,
                averageInjectedMemories: 0,
                topPerformingAgents: [],
                hourlyStats: []
            };
        }
        const totalRequests = this.metrics.length;
        const averageReduction = this.metrics.reduce((sum, m) => sum + m.reductionPercentage, 0) / totalRequests;
        const totalTokensSaved = this.metrics.reduce((sum, m) => sum + (m.originalTokens - m.optimizedTokens), 0);
        const averageInjectedMemories = this.metrics.reduce((sum, m) => sum + m.injectedMemories, 0) / totalRequests;
        const agentStats = new Map();
        this.metrics.forEach(metric => {
            if (metric.agentId) {
                const existing = agentStats.get(metric.agentId) || { count: 0, totalReduction: 0 };
                existing.count++;
                existing.totalReduction += metric.reductionPercentage;
                agentStats.set(metric.agentId, existing);
            }
        });
        const topPerformingAgents = Array.from(agentStats.entries())
            .map(([agentId, stats]) => ({
            agentId,
            averageReduction: stats.totalReduction / stats.count
        }))
            .sort((a, b) => b.averageReduction - a.averageReduction)
            .slice(0, 5);
        const now = new Date();
        const hourlyStats = [];
        for (let i = 23; i >= 0; i--) {
            const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
            const hourMetrics = this.metrics.filter(m => m.timestamp >= hourStart && m.timestamp < hourEnd);
            const requests = hourMetrics.length;
            const averageReduction = requests > 0
                ? hourMetrics.reduce((sum, m) => sum + m.reductionPercentage, 0) / requests
                : 0;
            hourlyStats.push({
                hour: hourStart.toISOString().slice(0, 13) + ':00',
                requests,
                averageReduction
            });
        }
        return {
            totalRequests,
            averageReduction,
            totalTokensSaved,
            averageInjectedMemories,
            topPerformingAgents,
            hourlyStats
        };
    }
    getMetricsForRange(startDate, endDate) {
        return this.metrics.filter(m => m.timestamp >= startDate && m.timestamp <= endDate);
    }
    getAgentMetrics(agentId) {
        return this.metrics.filter(m => m.agentId === agentId);
    }
    clearMetrics() {
        this.metrics = [];
    }
    exportMetrics() {
        return JSON.stringify(this.metrics, null, 2);
    }
    getAlerts() {
        const alerts = [];
        const recentMetrics = this.metrics.slice(-100);
        if (recentMetrics.length < 10)
            return alerts;
        const avgReduction = recentMetrics.reduce((sum, m) => sum + m.reductionPercentage, 0) / recentMetrics.length;
        const avgTokensSaved = recentMetrics.reduce((sum, m) => sum + (m.originalTokens - m.optimizedTokens), 0) / recentMetrics.length;
        if (avgReduction < 20) {
            alerts.push({
                type: 'low_reduction',
                message: `Token reduction is below 20% (current: ${avgReduction.toFixed(1)}%)`,
                severity: 'medium'
            });
        }
        if (avgTokensSaved < 100) {
            alerts.push({
                type: 'low_savings',
                message: `Average token savings is low (${avgTokensSaved.toFixed(0)} tokens per request)`,
                severity: 'low'
            });
        }
        const avgMemories = recentMetrics.reduce((sum, m) => sum + m.injectedMemories, 0) / recentMetrics.length;
        if (avgMemories === 0 && avgReduction < 10) {
            alerts.push({
                type: 'no_memories',
                message: 'No memories are being injected, consider lowering emotion threshold',
                severity: 'high'
            });
        }
        return alerts;
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metricsCollector.js.map