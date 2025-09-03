# Pollinations API Documentation - Parsed Analysis

## Overview
Pollinations.AI é uma plataforma de GenAI acessível que oferece APIs diretas para Text, Image & Audio sem necessidade de cadastro.

## Base URLs
- **Image API**: `https://image.pollinations.ai`
- **Text API**: `https://text.pollinations.ai`

## Authentication Methods
- **Referrer**: Para aplicações frontend (automático via browser ou manual via query param)
- **Token**: Para backend services via `Authorization: Bearer YOUR_TOKEN`
- **Tiers**: anonymous (15s), Seed (5s), Flower (3s), Nectar (unlimited)

## Endpoints Mapeados

### 1. Image Generation API 🖼️

#### GET /prompt/{prompt}
**Path**: `https://image.pollinations.ai/prompt/{prompt}`

**Parameters**:
- `prompt` (required): Text description (URL-encoded)
- `model` (optional): Model for generation (default: `flux`)
- `seed` (optional): Seed for reproducible results
- `width` (optional): Width in pixels (default: 1024)
- `height` (optional): Height in pixels (default: 1024)
- `image` (optional): Input image URL for image-to-image (kontext model)
- `nologo` (optional): Disable logo overlay (default: false)
- `private` (optional): Prevent public feed appearance (default: false)
- `enhance` (optional): Enhance prompt using LLM (default: false)
- `safe` (optional): Strict NSFW filtering (default: false)
- `referrer` (optional): Referrer URL/Identifier

**Return**: Image file (JPEG)
**Rate Limit**: 1 concurrent request / 5 sec interval (anonymous)

#### GET /models
**Path**: `https://image.pollinations.ai/models`
**Return**: JSON list of available image models

### 2. Text Generation API 📝

#### GET /{prompt}
**Path**: `https://text.pollinations.ai/{prompt}`

**Parameters**:
- `prompt` (required): Text prompt (URL-encoded)
- `model` (optional): Model for generation (default: `openai`)
- `seed` (optional): Seed for reproducible results
- `temperature` (optional): Randomness control (0.0 to 3.0)
- `top_p` (optional): Nucleus sampling (0.0 to 1.0)
- `presence_penalty` (optional): Presence penalty (-2.0 to 2.0)
- `frequency_penalty` (optional): Frequency penalty (-2.0 to 2.0)
- `json` (optional): JSON response format (true/false)
- `system` (optional): System prompt (URL-encoded)
- `stream` (optional): Streaming via SSE (true/false)
- `private` (optional): Prevent public feed (true/false)
- `referrer` (optional): Referrer URL/Identifier

**Return**: Generated text or JSON string
**Rate Limit**: 1 concurrent request / 3 sec interval (anonymous)

#### GET /models
**Path**: `https://text.pollinations.ai/models`
**Return**: JSON list of available text models and voices

#### POST /openai
**Path**: `https://text.pollinations.ai/openai`

**Request Body** (OpenAI-compatible):
```json
{
  "model": "openai",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is the capital of France?"}
  ],
  "temperature": 0.7,
  "stream": true,
  "private": false
}
```

**Features**:
- Chat Completions
- Vision (image analysis)
- Speech-to-Text
- Function Calling
- Streaming Responses (SSE)

**Return**: OpenAI-style chat completion response

### 3. Audio API 🎤

#### Text-to-Speech (GET)
**Path**: `https://text.pollinations.ai/{prompt}?model=openai-audio&voice={voice}`

**Parameters**:
- `prompt` (required): Text to synthesize (URL-encoded)
- `model` (required): Must be `openai-audio`
- `voice` (optional): Voice selection (alloy, echo, fable, onyx, nova, shimmer)

**Return**: Audio file (MP3 format)

#### Speech-to-Text (POST)
**Path**: `https://text.pollinations.ai/openai`

**Request Body**:
```json
{
  "model": "openai-audio",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "Transcribe this:"},
        {
          "type": "input_audio",
          "input_audio": {
            "data": "{base64_audio_string}",
            "format": "wav"
          }
        }
      ]
    }
  ]
}
```

**Return**: Standard OpenAI chat completion with transcription

### 4. Vision API 🖼️➡️📝

**Models**: `openai`, `openai-large`, `claude-hybridspace`

**Request Body**:
```json
{
  "model": "openai",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "Describe this image:"},
        {
          "type": "image_url",
          "image_url": {"url": "data:image/jpeg;base64,{base64_string}"}
        }
      ]
    }
  ]
}
```

### 5. Function Calling ⚙️

**Models**: Check compatibility via `/models` endpoint

**Request Body**:
```json
{
  "model": "openai",
  "messages": [{"role": "user", "content": "What's the weather in Tokyo?"}],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_current_weather",
        "description": "Get current weather in a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {"type": "string", "description": "City and state"},
            "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
          },
          "required": ["location"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

### 6. Real-time Feeds API 🔄

#### Image Feed
**Path**: `GET https://image.pollinations.ai/feed`
**Return**: SSE stream of new public images
**Event Format**:
```json
{
  "width": 1024,
  "height": 1024,
  "seed": 42,
  "model": "flux",
  "imageURL": "https://image.pollinations.ai/prompt/a_radiant_visage",
  "prompt": "A radiant visage in the style of renaissance painting"
}
```

#### Text Feed
**Path**: `GET https://text.pollinations.ai/feed`
**Return**: SSE stream of new public text responses
**Event Format**:
```json
{
  "response": "Cherry Blossom Pink represents gentleness...",
  "model": "openai",
  "messages": [
    {"role": "user", "content": "What does the color cherry blossom pink represent?"}
  ]
}
```

## MCP Server 🤖🔧

**Server Name**: `pollinations-multimodal-api`

**Available Tools**:
- **Image**: `generateImageUrl`, `generateImage`, `listImageModels`
- **Audio**: `respondAudio`, `sayText`, `listAudioVoices`
- **Text**: `listTextModels`
- **General**: `listModels`

## React Hooks ⚛️

**Package**: `@pollinations/react`

**Available Hooks**:
- `usePollinationsImage(prompt, options)`
- `usePollinationsText(prompt, options)`
- `usePollinationsChat(initialMessages, options)`

## Rate Limits & Recommendations

### Timeouts
- **Image Generation**: 300 seconds (long timeout recommended)
- **Audio Generation**: 300 seconds (long timeout recommended)
- **Text Generation**: Standard timeout (3-15 seconds based on tier)

### Retry Strategy
- Implement exponential backoff for 5xx errors
- Maximum 3 retry attempts per request
- Respect rate limits per tier

### Authentication Priority
1. **Backend Services**: Use Bearer tokens for highest priority
2. **Frontend Apps**: Use referrer-based authentication
3. **Anonymous**: Limited functionality and rate limits

## Error Handling

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid token/referrer)
- `429`: Rate Limited
- `500`: Internal Server Error

### Error Response Format
```json
{
  "error": {
    "message": "Error description",
    "type": "error_type",
    "code": "error_code"
  }
}
```

## Streaming Support

### Server-Sent Events (SSE)
- **Text Generation**: `stream=true` parameter
- **Feeds**: Real-time updates via SSE
- **Format**: Standard SSE with `data:` prefix

### OpenAI Compatibility
- Streaming responses follow OpenAI format
- Chunk processing: `data: {"choices": [{"delta": {"content": "..."}}]}`
- End marker: `data: [DONE]`

## Security Considerations

### API Key Management
- Never expose tokens in frontend code
- Use environment variables for backend services
- Rotate tokens regularly

### Referrer Validation
- Register domains at auth.pollinations.ai
- Validate referrer headers
- Implement proper CORS policies

## Integration Examples

### Basic Image Generation
```bash
curl -o image.jpg "https://image.pollinations.ai/prompt/A%20beautiful%20sunset?width=1280&height=720&model=flux"
```

### Streaming Text Generation
```bash
curl -N "https://text.pollinations.ai/Tell%20me%20a%20story?stream=true&model=openai"
```

### OpenAI-Compatible Chat
```bash
curl https://text.pollinations.ai/openai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"model": "openai", "messages": [{"role": "user", "content": "Hello"}]}'
```

## Notes
- All endpoints support both referrer and token authentication
- Streaming is available for text generation and feeds
- Vision and audio capabilities require specific models
- Function calling follows OpenAI standards
- MCP server enables AI assistant integration