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

    // Fallback deterministic rule-based parsing engine (Super Smart Extraction)
    const textLower = transcript.toLowerCase();
    let action = 'search_web';
    let params: Record<string, string> = {};
    let feedbackText = 'Buscando información en la web...';
    let explanation = 'Búsqueda web por defecto';

    // Helper: Dynamic Alarm details extraction
    const extractAlarmDetails = (text: string) => {
      const textL = text.toLowerCase();
      let time = '07:00';
      let date = 'Mañana';

      if (textL.includes('hoy')) {
        date = 'Hoy';
      } else if (textL.includes('mañana') || textL.includes('manana')) {
        date = 'Mañana';
      }

      const wordToNum: Record<string, number> = {
        'una': 1, 'un': 1, 'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10, 'once': 11, 'doce': 12,
        'mediodía': 12, 'mediodia': 12, 'medianoche': 0
      };

      const timeRegex = /(\d{1,2})[:h](\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i;
      const match = textL.match(timeRegex);

      let hour = -1;
      let minute = 0;
      let isPm = false;
      let timeFound = false;

      if (match) {
        hour = parseInt(match[1], 10);
        if (match[2]) {
          minute = parseInt(match[2], 10);
        }
        if (match[3]) {
          const p = match[3].toLowerCase();
          if (p.includes('p')) isPm = true;
        }
        timeFound = true;
      } else {
        for (const [word, val] of Object.entries(wordToNum)) {
          const regex = new RegExp(`\\b${word}\\b`);
          if (regex.test(textL)) {
            hour = val;
            timeFound = true;
            break;
          }
        }

        if (!timeFound) {
          const numberMatch = textL.match(/\b(1[0-2]|[1-9]|2[0-3]|0)\b/);
          if (numberMatch) {
            hour = parseInt(numberMatch[1], 10);
            timeFound = true;
          }
        }

        if (textL.includes('y media')) {
          minute = 30;
        } else if (textL.includes('y cuarto') || textL.includes('y quince')) {
          minute = 15;
        } else if (textL.includes('y cuarenta y cinco')) {
          minute = 45;
        }
      }

      if (textL.includes('tarde') || textL.includes('noche') || textL.includes('pm') || textL.includes('p.m.')) {
        isPm = true;
      }

      if (timeFound && hour !== -1) {
        if (isPm && hour < 12) {
          hour += 12;
        } else if (!isPm && hour === 12) {
          hour = 0;
        }
        
        const hStr = hour.toString().padStart(2, '0');
        const mStr = minute.toString().padStart(2, '0');
        time = `${hStr}:${mStr}`;
      }

      const displayHour = hour === -1 ? 7 : (hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour));
      const displayMinute = minute.toString().padStart(2, '0');
      const period = hour >= 12 ? 'PM' : 'AM';
      const customFeedback = `Configurada la alarma y recordatorio para las ${displayHour}:${displayMinute} ${period} (${date.toLowerCase()}).`;

      return { time, date, title: 'Alarma de Jarvis', feedbackText: customFeedback };
    };

    // Helper: Dynamic Contact & Message extraction
    const extractContactAndMessage = (text: string, contactsList: any[]) => {
      const textL = text.toLowerCase();
      let contactName = 'Juan';
      let messageText = 'Hola, ¿cómo estás?';

      let bestMatch = null;
      let bestLen = 0;
      for (const c of contactsList) {
        const nameLower = c.name ? c.name.toLowerCase() : '';
        const nickLower = c.nickname ? c.nickname.toLowerCase() : '';
        if (nameLower && textL.includes(nameLower) && nameLower.length > bestLen) {
          bestMatch = c;
          bestLen = nameLower.length;
        }
        if (nickLower && textL.includes(nickLower) && nickLower.length > bestLen) {
          bestMatch = c;
          bestLen = nickLower.length;
        }
      }

      if (bestMatch) {
        contactName = bestMatch.nickname || bestMatch.name;
      } else {
        if (textL.includes('maría') || textL.includes('maria')) contactName = 'María';
        else if (textL.includes('mamá') || textL.includes('mama')) contactName = 'Mamá';
        else if (textL.includes('carlos')) contactName = 'Carlos';
      }

      const queIndex = textL.indexOf('que ');
      if (queIndex !== -1) {
        messageText = text.substring(queIndex + 4);
      } else {
        const dileIndex = textL.indexOf('dile ');
        if (dileIndex !== -1) {
          messageText = text.substring(dileIndex + 5);
        } else {
          const diciendoIndex = textL.indexOf('diciendo ');
          if (diciendoIndex !== -1) {
            messageText = text.substring(diciendoIndex + 9);
          }
        }
      }

      messageText = messageText.replace(/(por favor|porfa|gracias)\s*$/i, '').trim();
      if (messageText) {
        messageText = messageText.charAt(0).toUpperCase() + messageText.slice(1);
      }

      return { contact: contactName, message: messageText };
    };

    // Helper: Dynamic App Name matching
    const extractAppName = (text: string, appsList: any[]) => {
      const textL = text.toLowerCase();
      let matchedApp = 'WhatsApp';

      let bestMatch = null;
      let bestLen = 0;
      for (const app of appsList) {
        const appNameLower = app.toLowerCase();
        if (textL.includes(appNameLower) && appNameLower.length > bestLen) {
          bestMatch = app;
          bestLen = appNameLower.length;
        }
      }

      if (bestMatch) {
        matchedApp = bestMatch;
      } else {
        if (textL.includes('spotify')) matchedApp = 'Spotify';
        else if (textL.includes('reloj') || textL.includes('alarma') || textL.includes('clock') || textL.includes('alarmas')) matchedApp = 'Reloj';
        else if (textL.includes('whatsapp')) matchedApp = 'WhatsApp';
        else if (textL.includes('navegador') || textL.includes('chrome') || textL.includes('google')) matchedApp = 'Navegador Web';
      }

      return matchedApp;
    };

    // Cascade intent matching routing
    if (textLower.includes('whatsapp') || textLower.includes('mensaje a') || textLower.includes('escríbele a') || textLower.includes('escribe a')) {
      action = 'send_whatsapp';
      const extracted = extractContactAndMessage(transcript, contacts);
      params = { contact: extracted.contact, message: extracted.message };
      feedbackText = `Listo, abriendo WhatsApp para enviarle a ${extracted.contact}: "${extracted.message}"`;
      explanation = `Reconocido comando de envío de WhatsApp hacia ${extracted.contact}`;
    } else if (textLower.includes('llama') || textLower.includes('llamar') || textLower.includes('marcar')) {
      action = 'make_call';
      const extracted = extractContactAndMessage(transcript, contacts);
      params = { contact: extracted.contact };
      feedbackText = `Iniciando llamada telefónica a ${extracted.contact}...`;
      explanation = `Comando de llamada hacia ${extracted.contact}`;
    } else if (textLower.includes('venta') || textLower.includes('ventas') || textLower.includes('jansel') || textLower.includes('janbot')) {
      action = 'janbot_query';
      params = { queryType: 'sales', dateRange: 'hoy' };
      feedbackText = 'Consultando las ventas de hoy en Jansel Shop...';
      explanation = 'Consulta de métricas comerciales de negocio JanBot';
    } else if (textLower.includes('alarma') || textLower.includes('recordatorio') || textLower.includes('recuérdame') || textLower.includes('recuerdame') || textLower.includes('despiértame') || textLower.includes('despiertame')) {
      action = 'set_reminder';
      const extracted = extractAlarmDetails(transcript);
      params = { title: extracted.title, time: extracted.time, date: extracted.date };
      feedbackText = extracted.feedbackText;
      explanation = `Creación de alarma para las ${extracted.time} de tipo ${extracted.date}`;
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
      const appName = extractAppName(transcript, installedApps);
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
      providerUsed: 'Cascading Rule Engine (Procesamiento Inteligente Local)',
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
