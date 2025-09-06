import { PollinationsTool } from '../tools/pollinationsTool';
import { KnowledgeManager } from './knowledgeManager';

export interface ClassificationResult {
  type: 'conversation' | 'task';
  subtype?: string;
  confidence: number;
  parameters: Record<string, any>;
}

export class Classifier {
  private pollinationsTool: PollinationsTool;
  private knowledgeManager: KnowledgeManager;

  constructor(knowledgeManager: KnowledgeManager) {
    this.pollinationsTool = new PollinationsTool();
    this.knowledgeManager = knowledgeManager;
  }

  async classifyTask(prompt: string): Promise<ClassificationResult> {
    try {
      // Get relevant knowledge for this task
      const contextualKnowledge = this.knowledgeManager.getContextualKnowledge(prompt, 3);
      
      // Create classification tools for the LLM
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

Classifique esta solicitação em uma das seguintes categorias:

1. **conversation**: Perguntas simples, cumprimentos, pedidos de ajuda geral, conversas casuais
2. **text_generation**: Criação de texto, redação, artigos, resumos, histórias, conteúdo escrito
3. **image_generation**: Criação de imagens, arte, ilustrações, designs visuais
4. **audio**: Geração de áudio, conversão de texto para fala, processamento de áudio
5. **composite**: Tarefas que envolvem múltiplas etapas ou tipos de conteúdo

IMPORTANTE: 
- Se for uma conversa simples, use type: "conversation" e subtype: null
- Se for uma tarefa, use type: "task" e o subtype apropriado
- Seja preciso na classificação baseado no conteúdo real da solicitação
- Para tarefas de texto (artigos, resumos, redação), use "text_generation"
- Para tarefas de imagem (criar, gerar, desenhar imagens), use "image_generation"
- Use o conhecimento disponível para melhorar a precisão da classificação
`;

      const response = await this.pollinationsTool.generateTextWithTools(classificationPrompt, classificationTools, {
        temperature: 0.1,
        maxTokens: 300
      });

      // Check if the LLM used the classification tool
      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolCall = response.toolCalls[0];
        if (toolCall.function.name === 'classify_task') {
          const classification = JSON.parse(toolCall.function.arguments);
          
          // Validate the response structure
          if (this.isValidClassification(classification)) {
            return classification;
          }
        }
      }

      // Fallback classification if LLM response is invalid
      return this.getFallbackClassification(prompt);
      
    } catch (error) {
      console.error('Error in LLM classification:', error);
      return this.getFallbackClassification(prompt);
    }
  }

  private isValidClassification(classification: any): boolean {
    return (
      classification &&
      typeof classification === 'object' &&
      (classification.type === 'conversation' || classification.type === 'task') &&
      typeof classification.confidence === 'number' &&
      classification.confidence >= 0 && classification.confidence <= 1 &&
      typeof classification.parameters === 'object'
    );
  }

  private getFallbackClassification(prompt: string): ClassificationResult {
    const lowerPrompt = prompt.toLowerCase();
    
    // Simple fallback logic
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('help')) {
      return {
        type: 'conversation',
        confidence: 0.6,
        parameters: { subject: 'general', language: 'unknown', complexity: 'simple' }
      };
    }
    
    if (lowerPrompt.includes('image') || lowerPrompt.includes('picture') || lowerPrompt.includes('draw')) {
      return {
        type: 'task',
        subtype: 'image_generation',
        confidence: 0.7,
        parameters: { subject: lowerPrompt, language: 'unknown', complexity: 'medium' }
      };
    }
    
    return {
      type: 'task',
      subtype: 'text_generation',
      confidence: 0.5,
      parameters: { subject: lowerPrompt, language: 'unknown', complexity: 'medium' }
    };
  }

}