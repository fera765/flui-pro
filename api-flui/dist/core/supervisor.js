"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supervisor = void 0;
class Supervisor {
    constructor() {
        this.riskKeywords = [
            'delete', 'remove', 'destroy', 'harm', 'dangerous', 'illegal',
            'private', 'secret', 'confidential', 'password', 'token'
        ];
        this.contentFilters = [
            'inappropriate', 'offensive', 'harmful', 'violent', 'explicit'
        ];
    }
    async reviewTask(task) {
        const riskLevel = this.assessRisk(task);
        const contentCheck = this.checkContent(task);
        const complexityCheck = this.checkComplexity(task);
        const approved = riskLevel === 'low' && contentCheck.approved && complexityCheck.approved;
        const feedback = this.generateFeedback(task, riskLevel, contentCheck, complexityCheck);
        const suggestions = this.generateSuggestions(task, riskLevel, contentCheck, complexityCheck);
        return {
            approved,
            feedback,
            suggestions,
            riskLevel
        };
    }
    async approveTask(task) {
        const review = await this.reviewTask(task);
        if (!review.approved) {
            return {
                success: false,
                error: `Task not approved: ${review.feedback}`,
                metadata: { review }
            };
        }
        return {
            success: true,
            data: { message: 'Task approved for execution', taskId: task.id },
            metadata: { review }
        };
    }
    async rejectTask(task) {
        const review = await this.reviewTask(task);
        return {
            success: true,
            data: { message: 'Task rejected', taskId: task.id, reason: review.feedback },
            metadata: { review }
        };
    }
    assessRisk(task) {
        const prompt = task.prompt.toLowerCase();
        let riskScore = 0;
        for (const keyword of this.riskKeywords) {
            if (prompt.includes(keyword)) {
                riskScore += 2;
            }
        }
        if (prompt.includes('system') || prompt.includes('admin') || prompt.includes('root')) {
            riskScore += 3;
        }
        if (prompt.includes('file') || prompt.includes('directory') || prompt.includes('folder')) {
            riskScore += 1;
        }
        if (prompt.includes('network') || prompt.includes('http') || prompt.includes('api')) {
            riskScore += 1;
        }
        if (riskScore >= 5)
            return 'high';
        if (riskScore >= 2)
            return 'medium';
        return 'low';
    }
    checkContent(task) {
        const prompt = task.prompt.toLowerCase();
        const issues = [];
        for (const filter of this.contentFilters) {
            if (prompt.includes(filter)) {
                issues.push(`Content may contain ${filter} material`);
            }
        }
        const personalInfoPatterns = [
            /\b\d{3}-\d{2}-\d{4}\b/,
            /\b\d{3}-\d{3}-\d{4}\b/,
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
        ];
        for (const pattern of personalInfoPatterns) {
            if (pattern.test(task.prompt)) {
                issues.push('Content may contain personal information');
            }
        }
        return {
            approved: issues.length === 0,
            issues
        };
    }
    checkComplexity(task) {
        const issues = [];
        if (task.depth > 3) {
            issues.push('Task depth exceeds recommended limit');
        }
        if (task.childTasks.length > 10) {
            issues.push('Task has too many subtasks');
        }
        if (task.prompt.length > 1000) {
            issues.push('Task prompt is too long');
        }
        return {
            approved: issues.length === 0,
            issues
        };
    }
    generateFeedback(task, riskLevel, contentCheck, complexityCheck) {
        const feedback = [];
        if (riskLevel === 'high') {
            feedback.push('High risk task detected');
        }
        else if (riskLevel === 'medium') {
            feedback.push('Medium risk task, proceed with caution');
        }
        if (!contentCheck.approved) {
            feedback.push(`Content issues: ${contentCheck.issues.join(', ')}`);
        }
        if (!complexityCheck.approved) {
            feedback.push(`Complexity issues: ${complexityCheck.issues.join(', ')}`);
        }
        if (feedback.length === 0) {
            return 'Task approved for execution';
        }
        return feedback.join('. ');
    }
    generateSuggestions(task, riskLevel, contentCheck, complexityCheck) {
        const suggestions = [];
        if (riskLevel === 'high') {
            suggestions.push('Consider breaking down into smaller, safer subtasks');
            suggestions.push('Review task parameters for potential security issues');
        }
        if (!contentCheck.approved) {
            suggestions.push('Review and sanitize input content');
            suggestions.push('Add content filtering rules');
        }
        if (!complexityCheck.approved) {
            suggestions.push('Break down complex tasks into simpler subtasks');
            suggestions.push('Limit task depth and number of subtasks');
        }
        if (task.prompt.length > 500) {
            suggestions.push('Consider simplifying the task prompt');
        }
        return suggestions;
    }
}
exports.Supervisor = Supervisor;
//# sourceMappingURL=supervisor.js.map