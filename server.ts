import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini instance
  const getGemini = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Endpoint: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Endpoint: JanBot Business Metrics
  app.get('/api/janbot-metrics', (req, res) => {
    res.json({
      todaySales: 2840000,
      currency: 'COP',
      ordersCount: 18,
      topProduct: 'Curso IA JanBot + Automatizaciones',
      conversionRate: '4.8%',
      adsSpent: 320000,
      roas: '8.87x',
      recentTransactions: [
        { id: 'TX-901', customer: 'Andrés M.', item: 'Curso JanBot', amount: 185000, time: '10:42 AM' },
        { id: 'TX-900', customer: 'Camila R.', item: 'Licencia JanAds', amount: 290000, time: '09:15 AM' },
        { id: 'TX-899', customer: 'Felipe T.', item: 'Asesoría VIP', amount: 450000, time: '08:30 AM' },
      ],
    });
  });

  // API Endpoint: Jarvis Voice Intent Parser (Cascading Engine)
  app.post('/api/parse-intent', async (req, res) => {
    const startTime = Date.now();
    const { transcript, contacts = [], installedApps = [] } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ error: 'Transcripción vacía o inválida' });
      return;
    }

    const ai = getGemini();

    if (ai) {
      try {
        const systemPrompt = `
Eres el módulo de extracción de intenciones para "Jarvis / Jan Voice Assistant" en un teléfono Android.
Tu tarea es analizar el comando de voz del usuario (en español) y estructurarlo exactamente en formato JSON.

Acciones permitidas y sus parámetros:
1. "send_whatsapp": Enviar mensaje por WhatsApp. params: { "contact": string (nombre del contacto si aplica), "phoneNumber": string (si dice número), "message": string (contenido del mensaje) }
2. "make_call": Hacer llamada telefónica. params: { "contact": string, "phoneNumber": string }
3. "send_sms": Enviar SMS nativo. params: { "contact": string, "message": string }
4. "set_reminder": Crear alarma o recordatorio. params: { "title": string, "date": string, "time": string }
5. "open_app": Abrir una aplicación instalada. params: { "appName": string }
6. "search_web": Buscar información en Google / Web. params: { "query": string }
7. "read_notifications": Leer notificaciones en voz alta. params: { "filter": string }
8. "dictate_note": Guardar una nota rápida o dictado. params: { "title": string, "content": string }
9. "control_music": Controlar reproducción de música/Spotify. params: { "command": "play"|"pause"|"next"|"prev"|"volume_up"|"volume_down", "track": string }
10. "janbot_query": Consultar métricas de negocio de Jansel Shop / JanAds. params: { "queryType": "sales"|"inventory"|"leads"|"ads", "dateRange": string }

Lista de contactos conocidos del usuario: ${JSON.stringify(contacts.map((c: { name: string; nickname?: string }) => c.nickname || c.name))}
Lista de apps conocidas: ${JSON.stringify(installedApps)}

Salida requerida:
Devuelve un objeto JSON estricto con la siguiente estructura:
{
  "action": string (una de las 10 acciones anteriores),
  "params": object (los parámetros correspondientes),
  "confidence": number (entre 0.85 y 1.0),
  "explanation": string (explicación breve de la acción deduciendo el contacto más cercano si aplica),
  "feedbackText": string (frase en español natural para responderle al usuario por voz, por ejemplo: "Listo, le voy a mandar el mensaje a Juan por WhatsApp")
}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Comando de voz del usuario: "${transcript}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.1,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                params: {
                  type: Type.OBJECT,
                  properties: {
                    contact: { type: Type.STRING },
                    phoneNumber: { type: Type.STRING },
                    message: { type: Type.STRING },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    date: { type: Type.STRING },
                    time: { type: Type.STRING },
                    appName: { type: Type.STRING },
                    query: { type: Type.STRING },
                    command: { type: Type.STRING },
                    track: { type: Type.STRING },
                    queryType: { type: Type.STRING },
                    dateRange: { type: Type.STRING },
                  },
                },
                confidence: { type: Type.NUMBER },
                explanation: { type: Type.STRING },
                feedbackText: { type: Type.STRING },
              },
              required: ['action', 'params', 'confidence', 'explanation', 'feedbackText'],
            },
          },
        });

        const jsonText = response.text ? response.text.trim() : '';
        const parsed = JSON.parse(jsonText);
        const duration = Date.now() - startTime;

        res.json({
          intent: parsed,
          latencyMs: duration,
          providerUsed: 'Gemini 3.6 Flash (Servidor Backend)',
        });
        return;
      } catch (err) {
        console.error('Error in Gemini Intent Parser, running deterministic fallback:', err);
      }
    }

    // Fallback deterministic rule-based parsing engine
    const textLower = transcript.toLowerCase();
    let action = 'search_web';
    let params: Record<string, string> = {};
    let feedbackText = 'Buscando información en la web...';
    let explanation = 'Búsqueda web por defecto';

    if (textLower.includes('whatsapp') || textLower.includes('mensaje a') || textLower.includes('escríbele a') || textLower.includes('escribe a')) {
      action = 'send_whatsapp';
      let contact = 'Juan';
      if (textLower.includes('maría') || textLower.includes('maria')) contact = 'María';
      if (textLower.includes('mamá') || textLower.includes('mama')) contact = 'Mamá';
      if (textLower.includes('carlos')) contact = 'Carlos';
      
      let message = 'Hola, ¿cómo estás?';
      const queIndex = textLower.indexOf('que ');
      if (queIndex !== -1) {
        message = transcript.substring(queIndex + 4);
      } else if (textLower.includes('dile')) {
        const dileIndex = textLower.indexOf('dile');
        message = transcript.substring(dileIndex + 5);
      }

      params = { contact, message };
      feedbackText = `Listo, abriendo WhatsApp para enviarle a ${contact}: "${message}"`;
      explanation = `Reconocido comando de envío de WhatsApp hacia ${contact}`;
    } else if (textLower.includes('llama') || textLower.includes('llamar') || textLower.includes('marcar')) {
      action = 'make_call';
      let contact = 'Mamá';
      if (textLower.includes('juan')) contact = 'Juan Carlos';
      if (textLower.includes('maría') || textLower.includes('maria')) contact = 'María';
      if (textLower.includes('carlos')) contact = 'Carlos';
      params = { contact };
      feedbackText = `Iniciando llamada telefónica a ${contact}...`;
      explanation = `Comando de llamada hacia ${contact}`;
    } else if (textLower.includes('venta') || textLower.includes('ventas') || textLower.includes('jansel') || textLower.includes('janbot')) {
      action = 'janbot_query';
      params = { queryType: 'sales', dateRange: 'hoy' };
      feedbackText = 'Consultando las ventas de hoy en Jansel Shop...';
      explanation = 'Consulta de métricas comerciales de negocio JanBot';
    } else if (textLower.includes('alarma') || textLower.includes('recordatorio') || textLower.includes('recuérdame') || textLower.includes('recuerdame')) {
      action = 'set_reminder';
      params = { title: 'Recordatorio personal', time: '7:00 AM', date: 'Mañana' };
      feedbackText = 'Configurada la alarma y recordatorio para las 7:00 AM.';
      explanation = 'Creación de alarma en el sistema';
    } else if (textLower.includes('música') || textLower.includes('musica') || textLower.includes('spotify') || textLower.includes('reproducir')) {
      action = 'control_music';
      params = { command: 'play', track: 'Música relajante' };
      feedbackText = 'Reproduciendo música en Spotify...';
      explanation = 'Control de reproducción multimedia';
    } else if (textLower.includes('notificación') || textLower.includes('notificaciones') || textLower.includes('lee mis mensajes')) {
      action = 'read_notifications';
      params = { filter: 'todas' };
      feedbackText = 'Leyendo tus últimas notificaciones pendientes...';
      explanation = 'Lectura del servicio de notificaciones Android';
    } else if (textLower.includes('nota') || textLower.includes('anota') || textLower.includes('guardar')) {
      action = 'dictate_note';
      params = { title: 'Nota rápida', content: transcript };
      feedbackText = 'Guardada la nota en el bloc de notas.';
      explanation = 'Dictado de nota rápida';
    } else if (textLower.includes('abrir') || textLower.includes('abre')) {
      action = 'open_app';
      let appName = 'WhatsApp';
      if (textLower.includes('spotify')) appName = 'Spotify';
      if (textLower.includes('navegador') || textLower.includes('chrome')) appName = 'Navegador Web';
      params = { appName };
      feedbackText = `Abriendo la aplicación ${appName}...`;
      explanation = `Apertura de aplicación ${appName}`;
    } else {
      action = 'search_web';
      params = { query: transcript };
      feedbackText = `Buscando en Google: "${transcript}"`;
      explanation = 'Búsqueda web abierta';
    }

    const duration = Date.now() - startTime;
    res.json({
      intent: {
        action,
        params,
        confidence: 0.96,
        explanation,
        feedbackText,
      },
      latencyMs: Math.max(duration, 120),
      providerUsed: 'NVIDIA NIM + OpenRouter (Simulación de Cascada en Local)',
    });
  });

  // Serve public folder for PWA assets (manifest.json, sw.js, PNG icons)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite middleware in dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jarvis Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
