import { Router, Request, Response } from 'express';
import { PollinationsClient } from '../lib/pollinationsClient';

export function audioRoutes(client: PollinationsClient): Router {
  const router = Router();

  // POST /v1/audio/speech - OpenAI-compatible TTS endpoint
  router.post('/speech', async (req: Request, res: Response) => {
    try {
      const { model, text, voice = 'alloy' } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Input text is required' });
      }

      if (!model) {
        return res.status(400).json({ error: 'Model is required' });
      }

      // Validate voice
      const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      if (!validVoices.includes(voice)) {
        return res.status(400).json({ 
          error: `Invalid voice. Allowed voices: ${validVoices.join(', ')}` 
        });
      }

      // Generate audio
      const audioBuffer = await client.generateAudio(text, {
        voice,
        model: 'openai-audio'
      });

      // Set appropriate headers
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length.toString());
      
      // Send audio buffer
      return res.send(audioBuffer);

    } catch (error: any) {
      console.error('Audio generation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /v1/audio/speech/:text - Simple TTS endpoint
  router.get('/speech/:text', async (req: Request, res: Response) => {
    try {
      const { text } = req.params;
      const { voice = 'alloy', model = 'openai-audio' } = req.query;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      // Decode URL-encoded text
      const decodedText = decodeURIComponent(text);

      // Validate voice
      const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      if (!validVoices.includes(voice as string)) {
        return res.status(400).json({ 
          error: `Invalid voice. Allowed voices: ${validVoices.join(', ')}` 
        });
      }

      // Generate audio
      const audioBuffer = await client.generateAudio(decodedText, {
        voice: voice as string,
        model: model as string
      });

      // Set appropriate headers
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length.toString());
      
      // Send audio buffer
      return res.send(audioBuffer);

    } catch (error: any) {
      console.error('Audio generation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /v1/audio/transcriptions - OpenAI-compatible STT endpoint
  router.post('/transcriptions', async (req: Request, res: Response) => {
    try {
      const { model, file, response_format = 'text', language } = req.body;

      if (!file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      if (!model) {
        return res.status(400).json({ error: 'Model is required' });
      }

      // Convert file to base64 if it's not already
      let base64Audio: string;
      if (Buffer.isBuffer(file)) {
        base64Audio = file.toString('base64');
      } else if (typeof file === 'string') {
        base64Audio = file;
      } else {
        return res.status(400).json({ error: 'Invalid file format' });
      }

      // Determine audio format (simplified - in production you'd detect from file headers)
      let format = 'mp3';
      if (base64Audio.startsWith('data:audio/')) {
        const match = base64Audio.match(/data:audio\/([^;]+);base64,/);
        if (match && match[1]) {
          format = match[1];
        }
      }

      // Transcribe audio
      const transcription = await client.speechToText(base64Audio, format);

      // Return response based on format
      if (response_format === 'json') {
        return res.json({
          text: transcription,
          language: language || 'en'
        });
      } else {
        res.setHeader('Content-Type', 'text/plain');
        return res.send(transcription);
      }

    } catch (error: any) {
      console.error('Audio transcription error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /v1/audio/transcriptions/multipart - Speech to text with multipart form
  router.post('/transcriptions/multipart', async (_req: Request, res: Response) => {
    // This endpoint would handle multipart form data for file uploads
    // For now, return not implemented
    return res.status(501).json({ 
      error: 'Not implemented',
      message: 'Multipart form uploads not yet supported. Use base64 data instead.'
    });
  });

  return router;
}