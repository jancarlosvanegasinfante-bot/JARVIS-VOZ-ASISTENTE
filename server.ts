import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Instancia compartida de Gemini 3.6 Flash
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

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Endpoint: Direct QA con Gemini (Respuesta hablada completa)
  app.post('/api/ask', async (req, res) => {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Pregunta requerida' });
      return;
    }
    const ai = getGemini();
    if (!ai) {
      res.json({ answer: 'No tengo conexión al motor de inteligencia en este momento.' });
      return;
    }
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `El usuario te pregunta por voz en su smartphone: "${question}".
Responde de forma directa, conversacional, clara y concisa en español (máximo 2-3 frases), ideal para ser leída por voz por Jarvis.`,
      });
      res.json({ answer: response.text ? response.text.trim() : 'No pude encontrar una respuesta clara.' });
    } catch (err) {
      console.error('Error en /api/ask:', err);
      res.json({ answer: 'Tuve un inconveniente al procesar tu consulta.' });
    }
  });

  // API Endpoint: Jarvis Intent Extractor Engine
  app.post(['/api/intent', '/api/parse-intent', '/api/process-command'], async (req, res) => {
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
Eres el motor de inteligencia y extracción de intenciones para "Jarvis Voice Assistant" en un smartphone Android.
Tu función es interpretar el comando de voz del usuario (en español) y estructurarlo exactamente en formato JSON.

Acciones permitidas y sus parámetros:
1. "send_whatsapp": Enviar mensaje por WhatsApp. params: { "contact": string, "phoneNumber": string, "message": string }
2. "make_call": Hacer llamada telefónica. params: { "contact": string, "phoneNumber": string }
3. "answer_call": Descolgar o contestar llamada entrante. params: {}
4. "who_is_calling": Preguntar quién llama por voz (Modo Moto). params: {}
5. "who_messaged": Leer último mensaje o notificación de WhatsApp/SMS. params: {}
6. "reply_message": Responder al último mensaje recibido. params: { "message": string }
7. "send_sms": Enviar SMS nativo. params: { "contact": string, "phoneNumber": string, "message": string }
8. "set_alarm": Poner una alarma o despertar a una hora específica. params: { "title": string, "time": string, "hours": number, "minutes": number }
9. "set_timer": Configurar un temporizador o cuenta regresiva en segundos/minutos. params: { "title": string, "seconds": number, "minutes": number }
10. "set_reminder": Configurar un recordatorio en el calendario. params: { "title": string, "time": string, "date": string }
11. "open_calculator": Abrir la aplicación de calculadora del teléfono. params: {}
12. "open_gallery": Abrir la galería de fotos, imágenes o álbum del celular. params: {}
13. "open_contacts": Abrir la agenda de contactos o directorio telefónico. params: {}
14. "open_calendar": Abrir el calendario del celular. params: {}
15. "play_youtube": Buscar y reproducir canciones o videos en YouTube. params: { "query": string }
16. "play_spotify": Buscar y reproducir música en Spotify. params: { "track": string }
17. "open_app": Abrir una aplicación instalada. params: { "appName": string }
18. "close_app": Cerrar la aplicación actual o volver a la pantalla de inicio. params: {}
19. "search_web": Buscar en la web sólo si dice explícitamente "busca en google" o "busca en la web". params: { "query": string }
20. "control_music": Controlar reproducción multimedia. params: { "command": "play"|"pause"|"next"|"prev"|"volume_up"|"volume_down", "track": string }
21. "general_query": Úsala para CUALQUIER pregunta de cultura general, ciencia, historia, cálculos, o consultas ("¿cuántos planetas hay?", "¿por qué el cielo es azul?", "¿quién es el presidente de...?"). CRÍTICO: En "feedbackText" DEBES poner la RESPUESTA COMPLETA Y DIRECTA que Jarvis le hablará al usuario (1-3 frases fluidas en español). ¡NUNCA pongas "Buscando en Google..."! params: { "query": string }
22. "take_photo": Tomar una foto ahora mismo ("tómame una foto", "saca una foto"). params: {}
23. "open_camera": Solo abrir la cámara, sin tomar foto todavía ("abre la cámara"). params: {}
24. "toggle_flashlight": Encender o apagar la linterna ("prende la linterna", "apaga la luz", "enciende el flash"). params: {}
25. "toggle_wifi": Abrir el panel rápido de WiFi para activarlo/desactivarlo ("activa el wifi", "apaga el wifi"). params: {}
26. "toggle_bluetooth": Abrir los ajustes de Bluetooth ("prende el bluetooth", "activa el bluetooth"). params: {}
27. "airplane_mode": Abrir los ajustes de modo avión ("activa el modo avión", "pon modo avión"). params: {}
28. "set_brightness": Ajustar el brillo de la pantalla a un porcentaje. params: { "level": number (1-100) }

Contactos conocidos del usuario: ${JSON.stringify(contacts.map((c: any) => c.name || c.nickname || ''))}
Apps instaladas conocidas: ${JSON.stringify(installedApps.map((a: any) => typeof a === 'string' ? a : a.name || ''))}

REGLAS DE DESAMBIGUACIÓN:
- Si el usuario dice "abre [nombre_de_app]" (ej. "abre Nequi", "abre Bancolombia", "abre Instagram", "abre Uber", "abre ChatGPT", "abre MercadoLibre", "abre TikTok", "abre Facebook", "abre Gmail", "abre CapCut", "abre Canva", "abre Didi", "abre Rappi", "abre Netflix", etc.) -> DEBES USAR "open_app" con params: { "appName": "[nombre_de_app]" }. NO uses "search_web" ni hagas búsquedas en google si es una aplicación real del teléfono.
- "pon" / "ponme" es AMBIGUO:
  - Si menciona "alarma", "despiértame" o una hora para sonar (ej "a las 7", "a las 6:30") -> es "set_alarm".
  - Si menciona "temporizador", "cuenta regresiva", "timer" o un tiempo ("en 5 minutos") -> es "set_timer".
  - Si menciona "recordatorio" o "recuérdame" -> es "set_reminder".
  - Si menciona una canción, artista, género ("pon bachata", "pon reggaeton") -> es "play_spotify" (o "play_youtube").
- Para "pausa la música", "siguiente canción", "canción anterior", "reproduce" -> es "control_music".
- Para preguntas ("¿cuántos planetas hay?", "quién descubrió América", "cuánto es 15 por 8") -> es "general_query" y pon la respuesta completa hablada en "feedbackText".
- Para "calculadora" -> es "open_calculator".
- Para "fotos", "galería", "imágenes" -> es "open_gallery".
- Para "contactos", "agenda" -> es "open_contacts".
- Para números de teléfono dictados por voz (ej "3133615984"): ponlos en "phoneNumber".

Ejemplos:
- "¿cuántos planetas hay en el sistema solar?" -> action: "general_query", params: { "query": "¿cuántos planetas hay en el sistema solar?" }, feedbackText: "El sistema solar consta de ocho planetas principales, siendo Neptuno el más lejano y Mercurio el más cercano al Sol."
- "pausa la música" -> action: "control_music", params: { "command": "pause" }, feedbackText: "Pausando la música."
- "siguiente canción" -> action: "control_music", params: { "command": "next" }, feedbackText: "Siguiente canción."
- "abre Nequi" -> action: "open_app", params: { "appName": "Nequi" }
- "ponme una alarma a las 7 de la mañana" -> action: "set_alarm", params: { "time": "07:00", "title": "Alarma", "hours": 7, "minutes": 0 }
- "pon un temporizador de 5 minutos" -> action: "set_timer", params: { "minutes": 5, "seconds": 300, "title": "Temporizador" }

Devuelve un objeto JSON estricto con:
{
  "action": string (una de las acciones permitidas),
  "params": object (parámetros requeridos),
  "confidence": number (entre 0.85 y 1.0),
  "explanation": string,
  "feedbackText": string
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
                    time: { type: Type.STRING },
                    date: { type: Type.STRING },
                    query: { type: Type.STRING },
                    track: { type: Type.STRING },
                    appName: { type: Type.STRING },
                    command: { type: Type.STRING },
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

        // Enrich open_app with exact packageName from installedApps
        if (parsed && parsed.action === 'open_app' && Array.isArray(installedApps)) {
          const target = (parsed.params?.appName || '').toLowerCase().trim();
          if (target) {
            const found = installedApps.find((a: any) => {
              const name = (typeof a === 'string' ? a : a.name || '').toLowerCase();
              const pkg = (typeof a === 'string' ? '' : a.packageName || '').toLowerCase();
              return name.includes(target) || target.includes(name) || pkg.includes(target);
            });
            if (found && typeof found !== 'string' && found.packageName) {
              parsed.params.packageName = found.packageName;
            }
          }
        }

        res.json({
          intent: parsed,
          latencyMs: duration,
          providerUsed: 'Gemini 3.6 Flash (Railway Server)',
        });
        return;
      } catch (err) {
        console.error('Error en Gemini Intent Parser, ejecutando motor de reglas inteligente:', err);
      }
    }

    // Fallback determinista ultra-inteligente (procesamiento local sin conexión)
    const textLower = transcript.toLowerCase();
    let action = 'search_web';
    let params: Record<string, any> = {};
    let feedbackText = 'Buscando en Google...';
    let explanation = 'Búsqueda web por defecto';

    // Extracción de número de teléfono dictado directo por voz (ej "3133615984" o "313 361 5984")
    const extractPhoneNumber = (text: string): string => {
      const digitsOnly = text.replace(/[^0-9]/g, '');
      // Un celular colombiano tiene 10 dígitos; aceptamos 7-10 para cubrir fijos también
      if (digitsOnly.length >= 7 && digitsOnly.length <= 12) {
        return digitsOnly;
      }
      return '';
    };

    // Extracción de Alarma
    const extractAlarmDetails = (text: string) => {
      const textL = text.toLowerCase();
      let time = '07:00';
      const timeRegex = /(\d{1,2})[:h](\d{2})?\s*(am|pm)?/i;
      const match = textL.match(timeRegex);
      if (match) {
        let hour = parseInt(match[1], 10);
        let min = match[2] ? parseInt(match[2], 10) : 0;
        if (textL.includes('pm') || textL.includes('tarde') || textL.includes('noche')) {
          if (hour < 12) hour += 12;
        }
        time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      }
      return { time, title: 'Alarma de Jarvis', feedbackText: `Alarma configurada para las ${time}.` };
    };

    // Extracción de Contacto
    const extractContact = (text: string) => {
      const textL = text.toLowerCase();
      let contactName = 'Contacto';
      for (const c of contacts) {
        const name = (typeof c === 'string' ? c : c.name || c.nickname || '').toLowerCase();
        if (name && textL.includes(name)) {
          contactName = c.name || c.nickname || name;
          break;
        }
      }
      if (contactName === 'Contacto') {
        if (textL.includes('mamá') || textL.includes('mama')) contactName = 'Mamá';
        else if (textL.includes('papá') || textL.includes('papa')) contactName = 'Papá';
        else if (textL.includes('carlos')) contactName = 'Carlos';
        else if (textL.includes('maria') || textL.includes('maría')) contactName = 'María';
        else if (textL.includes('juan')) contactName = 'Juan';
      }
      return contactName;
    };

    // Ruteo de reglas para intenciones
    if (textLower.includes('quién llama') || textLower.includes('quien llama') || textLower.includes('quién me llama')) {
      action = 'who_is_calling';
      feedbackText = 'Consultando llamada entrante...';
      explanation = 'Lectura de remitente de llamada entrante';
    } else if (textLower.includes('contesta') || textLower.includes('responder la llamada') || textLower.includes('descolgar')) {
      action = 'answer_call';
      feedbackText = 'Listo, contestando la llamada...';
      explanation = 'Descolgar llamada por voz';
    } else if (textLower.includes('quién escribe') || textLower.includes('quien escribe') || textLower.includes('qué dice el mensaje') || textLower.includes('lee el mensaje')) {
      action = 'who_messaged';
      feedbackText = 'Leyendo la última notificación...';
      explanation = 'Lectura de mensaje o notificación por voz';
    } else if (textLower.includes('respóndele') || textLower.includes('respondele') || textLower.includes('contéstale')) {
      action = 'reply_message';
      const msg = transcript.replace(/.*(respóndele|respondele|contéstale)\s*(que)?/i, '').trim();
      params = { message: msg || 'Llego pronto' };
      feedbackText = `Enviando respuesta: "${params.message}"`;
      explanation = 'Respuesta por voz a notificación recibida';
    } else if (textLower.includes('alarma') || textLower.includes('despiértame') || textLower.includes('despierta')) {
      action = 'set_alarm';
      const details = extractAlarmDetails(transcript);
      params = { title: details.title, time: details.time };
      feedbackText = `Configurando alarma a las ${details.time}...`;
      explanation = 'Configuración de alarma nativa';
    } else if (textLower.includes('temporizador') || textLower.includes('cuenta regresiva') || textLower.includes('timer')) {
      action = 'set_timer';
      params = { minutes: 5, seconds: 300, title: 'Temporizador' };
      feedbackText = 'Configurando temporizador...';
      explanation = 'Configuración de temporizador';
    } else if (textLower.includes('recordatorio') || textLower.includes('recuérdame') || textLower.includes('recuerdame')) {
      action = 'set_reminder';
      const details = extractAlarmDetails(transcript);
      params = { title: details.title, time: details.time, date: 'hoy' };
      feedbackText = `Recordatorio guardado para las ${details.time}.`;
      explanation = 'Creación de recordatorio';
    } else if (textLower.includes('calculadora') || textLower.includes('calcula')) {
      action = 'open_calculator';
      feedbackText = 'Abriendo la calculadora...';
      explanation = 'Apertura de calculadora';
    } else if (textLower.includes('galería') || textLower.includes('galeria') || textLower.includes('mis fotos') || textLower.includes('álbum') || textLower.includes('album')) {
      action = 'open_gallery';
      feedbackText = 'Abriendo tu galería de fotos...';
      explanation = 'Apertura de galería';
    } else if (textLower.includes('contactos') || textLower.includes('agenda')) {
      action = 'open_contacts';
      feedbackText = 'Abriendo tu lista de contactos...';
      explanation = 'Apertura de contactos';
    } else if (textLower.includes('calendario')) {
      action = 'open_calendar';
      feedbackText = 'Abriendo el calendario...';
      explanation = 'Apertura de calendario';
    } else if (textLower.includes('youtube') || textLower.includes('video') || textLower.includes('pon en youtube')) {
      action = 'play_youtube';
      const q = transcript.replace(/.*(youtube|pon|video|busca en youtube)\s*/i, '').trim();
      params = { query: q || transcript };
      feedbackText = `Buscando en YouTube: "${params.query}"`;
      explanation = 'Reproducción de audio/video en YouTube';
    } else if (textLower.includes('spotify') || textLower.includes('música') || textLower.includes('musica') || textLower.includes('canción') || textLower.includes('cancion') || textLower.includes('reggaeton') || textLower.includes('rola')) {
      action = 'play_spotify';
      const trk = transcript.replace(/.*(spotify|ponme|pon|música|musica|canción|cancion|la canción de|de)\s*/i, '').trim();
      params = { track: trk || transcript };
      feedbackText = `Reproduciendo en Spotify: "${params.track}"`;
      explanation = 'Reproducción multimedia en Spotify';
    } else if (textLower.includes('sms') || textLower.includes('mensaje de texto')) {
      action = 'send_sms';
      const cName = extractContact(transcript);
      const msg = transcript.replace(/.*(diciendo|que)\s*/i, '').trim();
      params = { contact: cName, message: msg };
      feedbackText = `Enviando SMS a ${cName}...`;
      explanation = 'Envío de SMS nativo';
    } else if (textLower.includes('whatsapp') || textLower.includes('escríbele a') || textLower.includes('mensaje a')) {
      action = 'send_whatsapp';
      const rawPhone = extractPhoneNumber(transcript);
      const cName = rawPhone ? '' : extractContact(transcript);
      const msg = transcript.replace(/.*(diciendo|que)\s*/i, '').trim();
      params = { contact: cName, phoneNumber: rawPhone, message: msg };
      feedbackText = `Abriendo WhatsApp para enviarle a ${rawPhone || cName}: "${params.message}"`;
      explanation = `Envío de WhatsApp a ${rawPhone || cName}`;
    } else if (textLower.includes('llama') || textLower.includes('llamar') || textLower.includes('marcar')) {
      action = 'make_call';
      const rawPhone = extractPhoneNumber(transcript);
      const cName = rawPhone ? '' : extractContact(transcript);
      params = { contact: cName, phoneNumber: rawPhone };
      feedbackText = `Iniciando llamada a ${rawPhone || cName}...`;
      explanation = `Llamada telefónica a ${rawPhone || cName}`;
    } else if (textLower.includes('foto') || textLower.includes('toma una foto') || textLower.includes('saca una foto')) {
      action = 'take_photo';
      feedbackText = 'Abriendo cámara para la foto...';
      explanation = 'Captura de foto';
    } else if (textLower.includes('cámara') || textLower.includes('camara')) {
      action = 'open_camera';
      feedbackText = 'Abriendo cámara...';
      explanation = 'Apertura de cámara';
    } else if (textLower.includes('linterna') || textLower.includes('flash') || textLower.includes('la luz')) {
      action = 'toggle_flashlight';
      feedbackText = 'Cambiando la linterna...';
      explanation = 'Control de linterna';
    } else if (textLower.includes('wifi') || textLower.includes('wi-fi')) {
      action = 'toggle_wifi';
      feedbackText = 'Abriendo el panel de WiFi...';
      explanation = 'Control de WiFi';
    } else if (textLower.includes('bluetooth')) {
      action = 'toggle_bluetooth';
      feedbackText = 'Abriendo Bluetooth...';
      explanation = 'Control de Bluetooth';
    } else if (textLower.includes('modo avión') || textLower.includes('modo avion')) {
      action = 'airplane_mode';
      feedbackText = 'Abriendo modo avión...';
      explanation = 'Control de modo avión';
    } else if (textLower.includes('brillo')) {
      action = 'set_brightness';
      let level = 50;
      if (textLower.includes('máximo') || textLower.includes('maximo') || textLower.includes('full')) level = 100;
      else if (textLower.includes('mínimo') || textLower.includes('minimo')) level = 5;
      else {
        const numMatch = textLower.match(/(\d{1,3})\s*(%|por ciento)?/);
        if (numMatch) level = parseInt(numMatch[1], 10);
      }
      params = { level };
      feedbackText = `Ajustando el brillo al ${level}%...`;
      explanation = 'Ajuste de brillo de pantalla';
    } else if (textLower.includes('cierra') || textLower.includes('cerrar') || textLower.includes('inicio') || textLower.includes('atrás')) {
      action = 'close_app';
      feedbackText = 'Cerrando aplicación...';
      explanation = 'Navegación nativa de retorno';
    } else if (textLower.includes('abre') || textLower.includes('abrir')) {
      action = 'open_app';
      const appName = transcript.replace(/.*(abre|abrir)\s*/i, '').trim();
      params = { appName: appName || 'App' };
      if (Array.isArray(installedApps)) {
        const target = appName.toLowerCase().trim();
        const found = installedApps.find((a: any) => {
          const name = (typeof a === 'string' ? a : a.name || '').toLowerCase();
          const pkg = (typeof a === 'string' ? '' : a.packageName || '').toLowerCase();
          return name.includes(target) || target.includes(name) || pkg.includes(target);
        });
        if (found && typeof found !== 'string' && found.packageName) {
          params.packageName = found.packageName;
          if (found.name) params.appName = found.name;
        }
      }
      feedbackText = `Abriendo ${params.appName}...`;
      explanation = `Apertura de app ${params.appName}`;
    } else {
      action = 'search_web';
      params = { query: transcript };
      feedbackText = `Buscando en Google: "${transcript}"`;
      explanation = 'Búsqueda web general';
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
      latencyMs: Math.max(duration, 100),
      providerUsed: 'Motor de Reglas Inteligente Local',
    });
  });

  app.use(express.static(path.join(process.cwd(), 'public')));

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
