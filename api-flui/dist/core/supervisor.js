"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supervisor = void 0;
const pollinationsTool_1 = require("../tools/pollinationsTool");
class Supervisor {
    constructor() {
        this.pollinationsTool = new pollinationsTool_1.PollinationsTool();
    }
    async reviewTask(task) {
        try {
            const reviewTools = [
                {
                    type: "function",
                    function: {
                        name: "review_task",
                        description: "Review a task for safety, appropriateness, and feasibility",
                        parameters: {
                            type: "object",
                            properties: {
                                approved: {
                                    type: "boolean",
                                    description: "Whether the task is approved for execution"
                                },
                                riskLevel: {
                                    type: "string",
                                    enum: ["low", "medium", "high"],
                                    description: "Risk level of the task"
                                },
                                feedback: {
                                    type: "string",
                                    description: "Detailed feedback about the task review"
                                },
                                suggestions: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "Suggestions for improving the task"
                                },
                                issues: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "List of identified issues or concerns"
                                }
                            },
                            required: ["approved", "riskLevel", "feedback", "suggestions", "issues"]
                        }
                    }
                }
            ];
            const reviewPrompt = `
Analise a seguinte tarefa para segurança, apropriação e viabilidade usando a função de revisão.

Tarefa: "${task.prompt}"
Tipo: ${task.type}
Subtipo: ${task.metadata?.classification?.subtype || 'N/A'}
Profundidade: ${task.depth}
Tentativas: ${task.retries}/${task.maxRetries}

Avalie:
1. **Segurança**: A tarefa pode causar danos, violar privacidade ou ser perigosa?
2. **Apropriação**: O conteúdo é apropriado e não ofensivo?
3. **Viabilidade**: A tarefa é tecnicamente viável e bem definida?
4. **Complexidade**: A tarefa não é excessivamente complexa?
5. **Recursos**: A tarefa não consome recursos excessivos?

Considere:
- Tarefas que envolvem operações do sistema (delete, remove, destroy)
- Tarefas que podem acessar informações privadas ou confidenciais
- Tarefas que podem gerar conteúdo inapropriado ou ofensivo
- Tarefas muito complexas ou com muitas dependências
- Tarefas que podem consumir muitos recursos

IMPORTANTE: Use a função review_task para estruturar sua resposta.
`;
            const response = await this.pollinationsTool.generateTextWithTools(reviewPrompt, reviewTools, {
                temperature: 0.1,
                maxTokens: 500
            });
            if (response.toolCalls && response.toolCalls.length > 0) {
                const toolCall = response.toolCalls[0];
                if (toolCall.function.name === 'review_task') {
                    const review = JSON.parse(toolCall.function.arguments);
                    if (this.isValidReview(review)) {
                        return {
                            approved: review.approved,
                            riskLevel: review.riskLevel,
                            feedback: review.feedback,
                            suggestions: review.suggestions
                        };
                    }
                }
            }
            return this.createBasicReview(task);
        }
        catch (error) {
            console.error('Error in LLM review:', error);
            return this.createBasicReview(task);
        }
    }
    createBasicReview(task) {
        const prompt = task.prompt.toLowerCase();
        let riskLevel = 'low';
        let approved = true;
        const issues = [];
        if (prompt.includes('delete') || prompt.includes('remove') || prompt.includes('destroy')) {
            riskLevel = 'high';
            approved = false;
            issues.push('Task involves destructive operations');
        }
        else if (prompt.includes('system') || prompt.includes('admin')) {
            riskLevel = 'medium';
            issues.push('Task involves system operations');
        }
        if (task.depth > 3) {
            approved = false;
            issues.push('Task depth exceeds limit');
        }
        return {
            approved,
            riskLevel,
            feedback: issues.length > 0 ? issues.join('. ') : 'Task approved for execution',
            suggestions: issues.length > 0 ? ['Review task parameters', 'Simplify task complexity'] : []
        };
    }
    isValidReview(review) {
        return (review &&
            typeof review === 'object' &&
            typeof review.approved === 'boolean' &&
            ['low', 'medium', 'high'].includes(review.riskLevel) &&
            typeof review.feedback === 'string' &&
            Array.isArray(review.suggestions));
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
}
exports.Supervisor = Supervisor;
//# sourceMappingURL=supervisor.js.map