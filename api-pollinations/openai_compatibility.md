# OpenAI Compatibility Guide

Este documento descreve como usar o SDK OpenAI com o proxy Pollinations API.

## Configuração

Para usar o SDK OpenAI com o proxy Pollinations, configure o `baseURL` para apontar para o servidor proxy:

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", // Pode ficar vazio
  baseURL: "http://localhost:4000", // URL do proxy Pollinations
});
```

## Endpoints Mapeados

### 1. Image Generation

#### OpenAI SDK Call
```typescript
const response = await client.images.generate({
  prompt: "A beautiful sunset over the ocean",
  n: 1,
  size: "1024x1024",
  model: "dall-e-3",
  quality: "standard"
});
```

#### Proxy Mapping
- **Endpoint**: `POST /v1/images/generations`
- **Pollinations**: `GET https://image.pollinations.ai/prompt/{prompt}`
- **Model Mapping**: `dall-e-2`/`dall-e-3` → `flux`
- **Size Mapping**: `1024x1024` → `width=1024, height=1024`
- **Quality Mapping**: `hd` → `enhance=true`

#### Response Format
```json
{
  "created": 1703123456,
  "data": [
    {
      "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "revised_prompt": "A beautiful sunset over the ocean"
    }
  ]
}
```

### 2. Chat Completions

#### OpenAI SDK Call
```typescript
const response = await client.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, how are you?" }
  ],
  temperature: 0.7,
  stream: false
});
```

#### Proxy Mapping
- **Endpoint**: `POST /v1/chat/completions`
- **Pollinations**: `POST https://text.pollinations.ai/openai`
- **Model Mapping**: 
  - `gpt-4` → `openai`
  - `gpt-3.5-turbo` → `openai`
  - `claude-3` → `claude-hybridspace`
  - `mistral` → `mistral`

#### Response Format
```json
{
  "choices": [
    {
      "message": {
        "content": "Hello! I'm doing well, thank you for asking.",
        "role": "assistant"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "created": 1703123456,
  "id": "chatcmpl-123",
  "model": "openai",
  "object": "chat.completion"
}
```

### 3. Audio Generation (Text-to-Speech)

#### OpenAI SDK Call
```typescript
const response = await client.audio.speech.create({
  model: "tts-1",
  input: "Hello, world!",
  voice: "alloy",
  response_format: "mp3"
});
```

#### Proxy Mapping
- **Endpoint**: `POST /v1/audio/speech`
- **Pollinations**: `GET https://text.pollinations.ai/{text}?model=openai-audio&voice={voice}`
- **Model Mapping**: `tts-1`/`tts-1-hd` → `openai-audio`
- **Voice Mapping**: Suporta todas as vozes Pollinations (`alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`)

#### Response Format
- **Content-Type**: `audio/mpeg`
- **Body**: Buffer de áudio MP3

### 4. Audio Transcription (Speech-to-Text)

#### OpenAI SDK Call
```typescript
const response = await client.audio.transcriptions.create({
  model: "whisper-1",
  file: audioBuffer,
  response_format: "text"
});
```

#### Proxy Mapping
- **Endpoint**: `POST /v1/audio/transcriptions`
- **Pollinations**: `POST https://text.pollinations.ai/openai` com `model: "openai-audio"`
- **Model Mapping**: `whisper-1` → `openai-audio`

#### Response Format
- **Content-Type**: `text/plain` ou `application/json`
- **Body**: Texto transcrito ou JSON com metadados

### 5. Models List

#### OpenAI SDK Call
```typescript
const response = await client.models.list();
```

#### Proxy Mapping
- **Endpoint**: `GET /v1/models`
- **Pollinations**: Combina `GET https://image.pollinations.ai/models` e `GET https://text.pollinations.ai/models`

#### Response Format
```json
{
  "object": "list",
  "data": [
    {
      "id": "flux",
      "object": "model",
      "created": 1703123456,
      "owned_by": "pollinations"
    },
    {
      "id": "openai",
      "object": "model",
      "created": 1703123456,
      "owned_by": "pollinations"
    }
  ]
}
```

## Streaming Support

### Chat Completions Streaming
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

### Feed Streaming
```typescript
// Conectar ao feed de imagens
const eventSource = new EventSource('http://localhost:4000/v1/feed/image');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New image generated:', data);
};
```

## Parâmetros Específicos do Pollinations

### Image Generation
- `enhance`: Melhora o prompt usando LLM
- `safe`: Filtro NSFW estrito
- `nologo`: Remove logo Pollinations (usuários registrados)
- `private`: Previne aparecimento no feed público

### Text Generation
- `seed`: Semente para resultados reproduzíveis
- `system`: Prompt do sistema
- `json`: Resposta em formato JSON

### Audio Generation
- `voice`: Seleção de voz específica
- `model`: Sempre `openai-audio`

## Limitações e Diferenças

### 1. Rate Limits
- **Pollinations**: 1 request / 5s (imagens), 1 request / 3s (texto)
- **Proxy**: Implementa retry automático com backoff exponencial

### 2. Modelos Suportados
- **Imagens**: `flux`, `kontext` (mapeados de `dall-e-2`, `dall-e-3`)
- **Texto**: `openai`, `mistral`, `claude-hybridspace`
- **Áudio**: `openai-audio` com 6 vozes disponíveis

### 3. Tamanhos de Imagem
- **Suportados**: `256x256`, `512x512`, `1024x1024`, `1792x1024`, `1024x1792`
- **Padrão**: `1024x1024`

### 4. Formatos de Resposta
- **Imagens**: Sempre base64 data URL (JPEG)
- **Áudio**: Sempre MP3
- **Texto**: Texto plano ou JSON conforme solicitado

## Exemplos de Uso

### Exemplo Completo
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: "http://localhost:4000",
  apiKey: "" // Não necessário para o proxy
});

async function generateContent() {
  try {
    // Gerar imagem
    const imageResponse = await client.images.generate({
      prompt: "A cyberpunk city at night",
      size: "1024x1024",
      quality: "hd"
    });
    console.log('Image URL:', imageResponse.data[0].url);

    // Gerar texto
    const textResponse = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: "Describe a cyberpunk city" }
      ]
    });
    console.log('Text:', textResponse.choices[0].message.content);

    // Gerar áudio
    const audioResponse = await client.audio.speech.create({
      model: "tts-1",
      input: "Welcome to the future",
      voice: "nova"
    });
    // audioResponse é um Buffer que pode ser salvo como arquivo

  } catch (error) {
    console.error('Error:', error);
  }
}

generateContent();
```

### Teste de Conectividade
```typescript
// Verificar se o proxy está funcionando
const healthCheck = await fetch('http://localhost:4000/health');
const health = await healthCheck.json();
console.log('Proxy status:', health);
```

## Troubleshooting

### Erro: "POLLINATIONS_API_KEY is required"
- Configure a variável de ambiente `POLLINATIONS_API_KEY`
- Ou adicione ao arquivo `.env`

### Erro: "Max retries exceeded"
- O proxy tentou 3 vezes e falhou
- Verifique a conectividade com Pollinations
- Verifique se a API key é válida

### Erro: "Invalid size format"
- Use apenas os tamanhos suportados: `256x256`, `512x512`, `1024x1024`, `1792x1024`, `1024x1792`

### Erro: "Invalid voice"
- Use apenas as vozes suportadas: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

## Performance e Otimizações

### Timeouts
- **Imagens**: 300 segundos (recomendado)
- **Áudio**: 300 segundos (recomendado)
- **Texto**: 30 segundos (padrão)

### Retry Strategy
- **Máximo**: 3 tentativas
- **Delay inicial**: 1 segundo
- **Backoff**: Multiplicador de 2x

### Caching
- O proxy não implementa cache
- Considere implementar cache no lado do cliente para resultados estáticos

## Segurança

### Autenticação
- **Proxy**: Usa `POLLINATIONS_API_KEY` do servidor
- **Cliente**: Não precisa de chave OpenAI válida
- **Rate Limiting**: Implementado por IP

### CORS
- **Desenvolvimento**: Permite todas as origens
- **Produção**: Restrito a origens específicas

### Headers de Segurança
- `helmet()` para headers de segurança
- `Content-Security-Policy` configurado
- Validação de entrada em todos os endpoints