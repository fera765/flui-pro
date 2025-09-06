"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Classifier = void 0;
const pollinationsTool_1 = require("../tools/pollinationsTool");
class Classifier {
    constructor(knowledgeManager) {
        this.pollinationsTool = new pollinationsTool_1.PollinationsTool();
        this.knowledgeManager = knowledgeManager;
    }
    async classifyTask(prompt) {
        try {
            const contextualKnowledge = this.knowledgeManager.getContextualKnowledge(prompt, 3);
            const classificationTools = [
                {
                    type: "function",
                    function: {
                        name: "classify_task",
                        description: "Classify a user request into appropriate categories",
                        parameters: {
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["conversation", "task"],
                                    description: "Main type of the request"
                                },
                                subtype: {
                                    type: "string",
                                    enum: ["text_generation", "image_generation", "audio", "composite", null],
                                    description: "Specific subtype for task requests"
                                },
                                confidence: {
                                    type: "number",
                                    minimum: 0,
                                    maximum: 1,
                                    description: "Confidence level of the classification"
                                },
                                parameters: {
                                    type: "object",
                                    properties: {
                                        subject: {
                                            type: "string",
                                            description: "Main subject of the task"
                                        },
                                        language: {
                                            type: "string",
                                            description: "Detected language"
                                        },
                                        complexity: {
                                            type: "string",
                                            enum: ["simple", "medium", "complex"],
                                            description: "Complexity level"
                                        },
                                        knowledgeUsed: {
                                            type: "boolean",
                                            description: "Whether contextual knowledge was used"
                                        }
                                    },
                                    required: ["subject", "language", "complexity", "knowledgeUsed"]
                                }
                            },
                            required: ["type", "subtype", "confidence", "parameters"]
                        }
                    }
                }
            ];
            const classificationPrompt = `
Analise a seguinte solicitação e classifique-a de forma precisa usando a função de classificação.

Solicitação: "${prompt}"

${contextualKnowledge ? `CONHECIMENTO RELEVANTE DISPONÍVEL:
${contextualKnowledge}

Use este conhecimento para melhorar a classificação e compreensão da tarefa.` : ''}

Classifique esta solicitação usando os seguintes critérios:

**TIPO PRINCIPAL:**
1. **conversation**: Tarefas SIMPLES que podem ser resolvidas em uma única operação:
   - Criar um arquivo simples (HTML, texto, script)
   - Gerar texto curto ou conteúdo direto
   - Perguntas simples, cumprimentos, ajuda geral
   - Qualquer solicitação que não requer planejamento complexo
   
2. **task**: Tarefas COMPLEXAS que requerem múltiplas etapas ou planejamento:
   - Criar projetos completos (aplicações, sistemas)
   - Tarefas que envolvem múltiplos arquivos ou componentes
   - Processos que requerem análise, pesquisa e implementação
   - Workflows complexos com dependências

**SUBTIPOS (apenas para type: "task"):**
- **text_generation**: Criação de texto, artigos, documentos complexos
- **image_generation**: Criação de imagens, arte, designs visuais
- **audio**: Geração/processamento de áudio
- **composite**: Tarefas multi-etapas envolvendo diferentes tipos

IMPORTANTE: 
- Para tarefas simples como "criar um arquivo HTML", use type: "conversation"
- Para projetos complexos como "criar uma aplicação web", use type: "task"
- A complexidade é o fator decisivo, não o tipo de conteúdo
`;
            const response = await this.pollinationsTool.generateTextWithTools(classificationPrompt, classificationTools, {
                temperature: 0.1,
                maxTokens: 300
            });
            if (response.toolCalls && response.toolCalls.length > 0) {
                const toolCall = response.toolCalls[0];
                if (toolCall.function.name === 'classify_task') {
                    const classification = JSON.parse(toolCall.function.arguments);
                    if (this.isValidClassification(classification)) {
                        return classification;
                    }
                }
            }
            return this.getFallbackClassification(prompt);
        }
        catch (error) {
            console.error('Error in LLM classification:', error);
            return this.getFallbackClassification(prompt);
        }
    }
    isValidClassification(classification) {
        return (classification &&
            typeof classification === 'object' &&
            (classification.type === 'conversation' || classification.type === 'task') &&
            typeof classification.confidence === 'number' &&
            classification.confidence >= 0 && classification.confidence <= 1 &&
            typeof classification.parameters === 'object');
    }
    getFallbackClassification(prompt) {
        console.warn('Using LLM fallback classification - this indicates an issue with the main LLM classification');
        return {
            type: 'task',
            subtype: 'text_generation',
            confidence: 0.3,
            parameters: {
                subject: prompt.substring(0, 100),
                language: 'unknown',
                complexity: 'unknown',
                knowledgeUsed: false
            }
        };
    }
}
exports.Classifier = Classifier;
//# sourceMappingURL=classifier.js.map