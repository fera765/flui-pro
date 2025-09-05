import { SRIResult } from '../../types/emotionMemory';

export interface TokenMetrics {
  timestamp: Date;
  originalTokens: number;
  optimizedTokens: number;
  reductionPercentage: number;
  injectedMemories: number;
  taskId: string;
  agentId?: string | undefined;
  contextType: 'simple' | 'complex';
}

export interface PerformanceMetrics {
  totalRequests: number;
  averageReduction: number;
  totalTokensSaved: number;
  averageInjectedMemories: number;
  topPerformingAgents: Array<{ agentId: string; averageReduction: number }>;
  hourlyStats: Array<{ hour: string; requests: number; averageReduction: number }>;
}

export class MetricsCollector {
  private metrics: TokenMetrics[] = [];
  private readonly maxMetrics = 10000; // Keep last 10k metrics

  /**
   * Record token optimization metrics
   */
  recordMetrics(
    sriResult: SRIResult,
    taskId: string,
    agentId?: string,
    contextType: 'simple' | 'complex' = 'simple'
  ): void {
    const metric: TokenMetrics = {
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
    
    // Cleanup old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance metrics summary
   */
  getPerformanceMetrics(): PerformanceMetrics {
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

    // Top performing agents
    const agentStats = new Map<string, { count: number; totalReduction: number }>();
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

    // Hourly stats (last 24 hours)
    const now = new Date();
    const hourlyStats = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours());
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourMetrics = this.metrics.filter(m => 
        m.timestamp >= hourStart && m.timestamp < hourEnd
      );
      
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

  /**
   * Get metrics for specific time range
   */
  getMetricsForRange(startDate: Date, endDate: Date): TokenMetrics[] {
    return this.metrics.filter(m => 
      m.timestamp >= startDate && m.timestamp <= endDate
    );
  }

  /**
   * Get agent-specific metrics
   */
  getAgentMetrics(agentId: string): TokenMetrics[] {
    return this.metrics.filter(m => m.agentId === agentId);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Get real-time alerts for performance issues
   */
  getAlerts(): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];
    const recentMetrics = this.metrics.slice(-100); // Last 100 requests

    if (recentMetrics.length < 10) return alerts;

    const avgReduction = recentMetrics.reduce((sum, m) => sum + m.reductionPercentage, 0) / recentMetrics.length;
    const avgTokensSaved = recentMetrics.reduce((sum, m) => sum + (m.originalTokens - m.optimizedTokens), 0) / recentMetrics.length;

    // Low reduction alert
    if (avgReduction < 20) {
      alerts.push({
        type: 'low_reduction',
        message: `Token reduction is below 20% (current: ${avgReduction.toFixed(1)}%)`,
        severity: 'medium'
      });
    }

    // High token usage alert
    if (avgTokensSaved < 100) {
      alerts.push({
        type: 'low_savings',
        message: `Average token savings is low (${avgTokensSaved.toFixed(0)} tokens per request)`,
        severity: 'low'
      });
    }

    // Memory injection issues
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