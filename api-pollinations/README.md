# Pollinations API Proxy

Um proxy API Node.js + TypeScript que implementa compatibilidade total com o SDK OpenAI, redirecionando chamadas para a API Pollinations.AI.

## 🚀 Características

- **100% Compatível com OpenAI SDK**: Use qualquer cliente OpenAI configurado com `baseURL`
- **Proxy Inteligente**: Mapeia automaticamente modelos OpenAI para modelos Pollinations
- **Streaming SSE**: Suporte completo para Server-Sent Events
- **Retry Automático**: Implementa backoff exponencial para falhas 5xx
- **Rate Limiting**: Respeita limites da API Pollinations
- **Logs Estruturados**: JSON logs com requestId e métricas
- **Health Checks**: Endpoint de monitoramento com status upstream

## 📋 Endpoints Suportados

### OpenAI-Compatible
- `POST /v1/images/generations` - Geração de imagens
- `POST /v1/chat/completions` - Chat completions
- `POST /v1/audio/speech` - Text-to-Speech
- `POST /v1/audio/transcriptions` - Speech-to-Text
- `GET /v1/models` - Lista de modelos

### Pollinations-Specific
- `GET /v1/images/generations/:prompt` - Geração de imagem via GET
- `GET /v1/text/:prompt` - Geração de texto via GET
- `GET /v1/audio/speech/:text` - TTS via GET
- `GET /v1/feed/*` - Feeds em tempo real (SSE)

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Chave de API Pollinations

### Setup
```bash
# Clone o repositório
git clone <repo-url>
cd api-pollinations

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com sua POLLINATIONS_API_KEY

# Build do projeto
npm run build

# Execute
npm start
```

### Variáveis de Ambiente
```bash
# Obrigatório
POLLINATIONS_API_KEY=your_api_key_here

# Opcional
PORT=4000
UPSTREAM_BASE_IMAGE=https://image.pollinations.ai
UPSTREAM_BASE_TEXT=https://text.pollinations.ai
NODE_ENV=development
```

## 🔧 Uso

### Configuração do Cliente OpenAI
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: "", // Pode ficar vazio
  baseURL: "http://localhost:4000", // URL do proxy
});
```

### Exemplos de Uso

#### Geração de Imagem
```typescript
const response = await client.images.generate({
  prompt: "A beautiful sunset over the ocean",
  size: "1024x1024",
  model: "dall-e-3",
  quality: "hd"
});

console.log('Image URL:', response.data[0].url);
```

#### Chat Completion
```typescript
const response = await client.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "user", content: "Hello, how are you?" }
  ],
  temperature: 0.7
});

console.log('Response:', response.choices[0].message.content);
```

#### Text-to-Speech
```typescript
const audioBuffer = await client.audio.speech.create({
  model: "tts-1",
  input: "Hello, world!",
  voice: "nova"
});

// Salvar como arquivo
fs.writeFileSync('output.mp3', audioBuffer);
```

### Streaming
```typescript
const stream = await client.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Tell me a story" }],
  stream: true
});

for await (const chunk of stream) {
  if (chunk.choices[0]?.delta?.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}
```

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm test

# Testes com watch
npm run test:watch

# Cobertura
npm run test:coverage

# Lint
npm run lint
```

### Cobertura Mínima
- **Unit Tests**: 90%
- **Integration Tests**: 90%
- **Total**: 90%

## 📊 Monitoramento

### Health Check
```bash
curl http://localhost:4000/health
```

Resposta:
```json
{
  "ok": true,
  "upstream": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req-1703123456-abc123"
}
```

### Logs Estruturados
```json
{
  "level": "info",
  "message": "Image generation completed",
  "requestId": "req-1703123456-abc123",
  "path": "/v1/images/generations",
  "upstreamLatency": 2500,
  "upstreamStatus": 200,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔄 Mapeamento de Modelos

### OpenAI → Pollinations

#### Imagens
- `dall-e-2` → `flux`
- `dall-e-3` → `flux`

#### Texto
- `gpt-4` → `openai`
- `gpt-3.5-turbo` → `openai`
- `claude-3` → `claude-hybridspace`
- `mistral` → `mistral`

#### Áudio
- `tts-1` → `openai-audio`
- `whisper-1` → `openai-audio`

## 📡 Feeds em Tempo Real

### Conectar ao Feed de Imagens
```typescript
const eventSource = new EventSource('http://localhost:4000/v1/feed/image');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New image:', data);
};
```

### Eventos Disponíveis
- `image.generated` - Nova imagem gerada
- `text.generated` - Novo texto gerado
- `connection` - Status da conexão
- `error` - Erros do feed

## 🚨 Tratamento de Erros

### Retry Strategy
- **Máximo de tentativas**: 3
- **Delay inicial**: 1 segundo
- **Backoff**: Multiplicador de 2x
- **Apenas para erros 5xx**

### Códigos de Erro
- `400` - Parâmetros inválidos
- `401` - API key inválida
- `429` - Rate limit excedido
- `500` - Erro interno do servidor
- `502` - Erro upstream (Pollinations)

## ⚡ Performance

### Timeouts Recomendados
- **Imagens**: 300 segundos
- **Áudio**: 300 segundos
- **Texto**: 30 segundos

### Rate Limits
- **Imagens**: 1 request / 5 segundos
- **Texto**: 1 request / 3 segundos
- **Áudio**: Herda limites de texto

## 🔒 Segurança

### Headers de Segurança
- `helmet()` para proteção básica
- `CORS` configurável
- `Content-Security-Policy`
- Validação de entrada

### Autenticação
- **Proxy**: Usa `POLLINATIONS_API_KEY`
- **Cliente**: Não precisa de chave válida
- **Rate Limiting**: Por IP

## 🏗️ Arquitetura

```
src/
├── lib/
│   ├── pollinationsClient.ts    # Cliente para API Pollinations
│   └── adapters/
│       └── openaiAdapter.ts     # Adaptador OpenAI → Pollinations
├── routes/
│   ├── image.ts                 # Rotas de imagem
│   ├── text.ts                  # Rotas de texto
│   ├── audio.ts                 # Rotas de áudio
│   ├── models.ts                # Rotas de modelos
│   └── feed.ts                  # Rotas de feed
├── tests/                       # Testes unitários e integração
└── server.ts                    # Servidor principal
```

## 📈 Métricas e Monitoramento

### Métricas Disponíveis
- Latência upstream
- Status codes
- Rate de erro
- Uptime
- Request count

### Logs
- Request ID único
- Timestamp ISO
- Path da requisição
- Status da resposta
- Latência upstream

## 🚀 Deploy

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

### PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Environment Variables
```bash
NODE_ENV=production
PORT=4000
POLLINATIONS_API_KEY=your_key
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente com TDD
4. Execute todos os testes
5. Submit um Pull Request

### Padrões de Código
- TypeScript strict mode
- ESLint + Prettier
- Jest para testes
- 90% cobertura mínima

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

### Issues
- [GitHub Issues](https://github.com/your-repo/issues)
- [Documentação](https://your-docs-url.com)

### Comunidade
- [Discord](https://discord.gg/your-server)
- [Discussions](https://github.com/your-repo/discussions)

## 🔗 Links Úteis

- [Pollinations.AI](https://pollinations.ai)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Node.js](https://nodejs.org)
- [TypeScript](https://www.typescriptlang.org)

---

**Desenvolvido com ❤️ pela comunidade Pollinations**