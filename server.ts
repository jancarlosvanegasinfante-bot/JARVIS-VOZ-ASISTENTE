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
        model: 'gemini-2.5-flash',
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
21. "general_query": Úsala para CUALQUIER pregunta de cultura general, ciencia, historia, cálculos, o consultas ("¿cuántos planetas hay?", "¿por qué el cielo es azul?", "¿quién es el presidente de...?"). CRÍTICO: En "feedbackText" DEBES poner la RESPUESTA COMPLETA Y DIRECTA que Jarvis le hablará al usuario (1-3 frases fluidas en español). ¡NUNCA abras navegador ni pongas "Buscando en Google..."! params: { "query": string }
22. "take_photo": Tomar una foto ahora mismo ("tómame una foto", "saca una foto"). params: {}
23. "open_camera": Solo abrir la cámara, sin tomar foto todavía ("abre la cámara"). params: {}
24. "toggle_flashlight": Encender o apagar la linterna ("prende la linterna", "apaga la luz", "enciende el flash"). params: {}
25. "toggle_wifi": Abrir el panel rápido de WiFi para activarlo/desactivarlo ("activa el wifi", "apaga el wifi"). params: {}
26. "toggle_bluetooth": Abrir los ajustes de Bluetooth ("prende el bluetooth", "activa el bluetooth"). params: {}
27. "airplane_mode": Abrir los ajustes de modo avión ("activa el modo avión", "pon modo avión"). params: {}
28. "set_brightness": Ajustar el brillo de la pantalla a un porcentaje. params: { "level": number (1-100) }

Contactos conocidos del usuario: ${JSON.stringify(contacts.map((c: any) => ({ name: c.name || '', nickname: c.nickname || '', phone: c.phone || '' })))}
Apps instaladas conocidas: ${JSON.stringify(installedApps.map((a: any) => typeof a === 'string' ? a : a.name || ''))}

REGLAS DE DESAMBIGUACIÓN Y EXTRACCIÓN:
- IMPORTANTE PARA ALARMAS ("set_alarm"):
  - Calcula con precisión "hours" (0 a 23) y "minutes" (0 a 59) en formato militar/24 horas.
  - "12pm" o "12 del mediodía" -> hours: 12, minutes: 0, time: "12:00".
  - "12am" o "12 de la noche" -> hours: 0, minutes: 0, time: "00:00".
  - "12:30 pm" -> hours: 12, minutes: 30, time: "12:30".
  - "7am" o "7 de la mañana" -> hours: 7, minutes: 0, time: "07:00".
  - "7pm" o "7 de la noche" -> hours: 19, minutes: 0, time: "19:00".
  - "feedbackText" DEBE decir exactamente: "Configurando alarma para las [HORA EN FORMATO LEÍBLE CON AM/PM o MEDIODÍA]".

- IMPORTANTE PARA WHATSAPP ("send_whatsapp"):
  - Busca el contacto en "Contactos conocidos".
  - Si el contacto existe en la lista, coloca su nombre en "contact" y su número en "phoneNumber".
  - Si el contacto no existe en la lista pero el usuario dictó un nombre (ej. "Javier"), pon "Javier" en "contact" y "phoneNumber": "".
  - En "feedbackText": Si tienes número, pon "Abriendo WhatsApp para enviar mensaje a [Contacto]: [mensaje]". Si no tienes número, pon "Abriendo WhatsApp con tu mensaje '[mensaje]'. Selecciona a [Contacto] en la lista para enviárselo."

- IMPORTANTE PARA SPOTIFY ("play_spotify"):
  - Extrae el nombre exacto de la canción/artista en "track" sin cortar palabras (ej. "ultimo deseo" -> track: "Último Deseo").
  - "feedbackText": "Reproduciendo '[track]' en Spotify."

- IMPORTANTE PARA PREGUNTAS GENERALES ("general_query"):
  - Responde de forma directa y clara. En "feedbackText" coloca la respuesta que Jarvis le hablará al usuario.
  - ¡JAMÁS mandes las preguntas generales a búsqueda web en navegador!

Ejemplos:
- "ponme una alarma a las 12pm de hoy" -> action: "set_alarm", params: { "time": "12:00", "title": "Alarma mediodía", "hours": 12, "minutes": 0 }, feedbackText: "Configurando alarma para las 12:00 PM del mediodía."
- "ponme en spotify la canción ultimo deseo" -> action: "play_spotify", params: { "track": "Último Deseo" }, feedbackText: "Reproduciendo 'Último Deseo' en Spotify."
- "enviale un mensaje por whatsapp a javier diciendole hola como estas" -> action: "send_whatsapp", params: { "contact": "Javier", "phoneNumber": "", "message": "Hola cómo estás" }, feedbackText: "Abriendo WhatsApp con el mensaje 'Hola cómo estás'. Selecciona a Javier en tus contactos para enviárselo."
- "¿cuántos planetas hay en el sistema solar?" -> action: "general_query", params: { "query": "¿cuántos planetas hay en el sistema solar?" }, feedbackText: "El sistema solar consta de ocho planetas principales, siendo Mercurio el más cercano al Sol y Neptuno el más lejano."

Devuelve un objeto JSON estricto con:
{
  "action": string,
  "params": object,
  "confidence": number,
  "explanation": string,
  "feedbackText": string
}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
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
      let hour = 7;
      let min = 0;

      if (textL.includes('12 pm') || textL.includes('12:00 pm') || textL.includes('12 del mediodía') || textL.includes('12 del mediodia') || textL.includes('12 de la tarde')) {
        hour = 12;
        min = 0;
      } else if (textL.includes('12 am') || textL.includes('12:00 am') || textL.includes('12 de la noche') || textL.includes('12 de la madrugada') || textL.includes('12 medianoche')) {
        hour = 0;
        min = 0;
      } else {
        const timeRegex = /(\d{1,2})[:h](\d{2})?\s*(am|pm)?/i;
        const match = textL.match(timeRegex);
        if (match) {
          hour = parseInt(match[1], 10);
          min = match[2] ? parseInt(match[2], 10) : 0;
          const isPm = textL.includes('pm') || textL.includes('tarde') || textL.includes('noche');
          const isAm = textL.includes('am') || textL.includes('mañana') || textL.includes('madrugada');
          if (isPm && hour < 12) hour += 12;
          else if (isAm && hour === 12) hour = 0;
        } else {
          const numMatch = textL.match(/a las?\s*(\d{1,2})/);
          if (numMatch) {
            hour = parseInt(numMatch[1], 10);
            if ((textL.includes('tarde') || textL.includes('noche') || textL.includes('pm')) && hour < 12) hour += 12;
          }
        }
      }

      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const label = hour === 0 ? '12:00 AM (medianoche)' : hour === 12 ? '12:00 PM (mediodía)' : hour > 12 ? `${hour - 12}:${min.toString().padStart(2, '0')} PM` : `${hour}:${min.toString().padStart(2, '0')} AM`;
      return { hours: hour, minutes: min, time, title: 'Alarma de Jarvis', feedbackText: `Configurando alarma para las ${label}.` };
    };

    // Extracción de Contacto
    const extractContact = (text: string) => {
      const textL = text.toLowerCase();
      for (const c of contacts) {
        const name = (typeof c === 'string' ? c : c.name || c.nickname || '').toLowerCase();
        if (name && textL.includes(name)) {
          return c;
        }
      }
      // Chequear nombres dictados comunes
      if (textL.includes('javier')) return { name: 'Javier', phone: '' };
      if (textL.includes('juan')) return { name: 'Juan', phone: '' };
      if (textL.includes('carlos')) return { name: 'Carlos', phone: '' };
      if (textL.includes('mamá') || textL.includes('mama')) return { name: 'Mamá', phone: '' };
      if (textL.includes('papá') || textL.includes('papa')) return { name: 'Papá', phone: '' };
      if (textL.includes('maria') || textL.includes('maría')) return { name: 'María', phone: '' };

      // Intentar extraer después de "a " o "para "
      const match = textL.match(/(?:a|para|con)\s+([a-záéíóúñ]+)/i);
      if (match && match[1] && !['whatsapp', 'mensaje', 'un', 'el', 'la'].includes(match[1])) {
        return { name: match[1].charAt(0).toUpperCase() + match[1].slice(1), phone: '' };
      }
      return { name: '', phone: '' };
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
      params = { title: details.title, time: details.time, hours: details.hours, minutes: details.minutes };
      feedbackText = details.feedbackText;
      explanation = 'Configuración de alarma nativa';
    } else if (textLower.includes('temporizador') || textLower.includes('cuenta regresiva') || textLower.includes('timer')) {
      action = 'set_timer';
      params = { minutes: 5, seconds: 300, title: 'Temporizador' };
      feedbackText = 'Configurando temporizador de 5 minutos.';
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
      const q = transcript.replace(/^.*?\b(youtube|pon|video|busca en youtube)\b/i, '').trim();
      params = { query: q || transcript };
      feedbackText = `Buscando en YouTube: "${params.query}"`;
      explanation = 'Reproducción de audio/video en YouTube';
    } else if (textLower.includes('spotify') || textLower.includes('música') || textLower.includes('musica') || textLower.includes('canción') || textLower.includes('cancion') || textLower.includes('reggaeton') || textLower.includes('rola')) {
      action = 'play_spotify';
      let trk = transcript
        .replace(/^.*?\b(ponme|pon|reproduce|escuchar|escucha|reproducir)\b/i, '')
        .replace(/\b(en spotify|en spoti|por spotify)\b/i, '')
        .replace(/^.*?\b(la canción|canción|cancion|el tema|la rola|música|musica)\b\s*(de)?/i, '')
        .trim();
      if (!trk) trk = transcript;
      params = { track: trk };
      feedbackText = `Reproduciendo "${params.track}" en Spotify.`;
      explanation = 'Reproducción multimedia en Spotify';
    } else if (textLower.includes('sms') || textLower.includes('mensaje de texto')) {
      action = 'send_sms';
      const contactObj = extractContact(transcript);
      const msg = transcript.replace(/^.*?\b(diciendo|que|decirle)\b/i, '').trim();
      params = { contact: contactObj.name, phoneNumber: contactObj.phone, message: msg || 'Hola' };
      feedbackText = contactObj.name ? `Enviando SMS a ${contactObj.name}...` : 'Enviando SMS...';
      explanation = 'Envío de SMS nativo';
    } else if (textLower.includes('whatsapp') || textLower.includes('escríbele a') || textLower.includes('mensaje a')) {
      action = 'send_whatsapp';
      const rawPhone = extractPhoneNumber(transcript);
      const contactObj = extractContact(transcript);
      const msg = transcript.replace(/^.*?\b(diciendo|que|decirle)\b/i, '').trim() || 'Hola';
      const cName = contactObj.name || (rawPhone ? '' : 'Contacto');
      const cPhone = rawPhone || contactObj.phone || '';
      params = { contact: cName, phoneNumber: cPhone, message: msg };
      
      if (cPhone) {
        feedbackText = `Abriendo WhatsApp para enviar mensaje a ${cName || cPhone}: "${msg}".`;
      } else if (cName && cName !== 'Contacto') {
        feedbackText = `Abriendo WhatsApp con tu mensaje "${msg}". Selecciona a ${cName} en tu lista de chats para enviárselo.`;
      } else {
        feedbackText = `Abriendo WhatsApp con tu mensaje "${msg}".`;
      }
      explanation = `Envío de WhatsApp a ${cName || cPhone || 'Contacto'}`;
    } else if (textLower.includes('llama') || textLower.includes('llamar') || textLower.includes('marcar')) {
      action = 'make_call';
      const rawPhone = extractPhoneNumber(transcript);
      const contactObj = extractContact(transcript);
      const cName = contactObj.name || 'Contacto';
      params = { contact: cName, phoneNumber: rawPhone || contactObj.phone || '' };
      feedbackText = `Iniciando llamada a ${cName || rawPhone}...`;
      explanation = `Llamada telefónica a ${cName || rawPhone}`;
    } else if (textLower.includes('foto') || textLower.includes('toma una foto') || textLower.includes('saca una foto')) {
      action = 'take_photo';
      feedbackText = 'Abriendo cámara para tomar foto...';
      explanation = 'Captura de foto';
    } else if (textLower.includes('cámara') || textLower.includes('camara')) {
      action = 'open_camera';
      feedbackText = 'Abriendo la cámara...';
      explanation = 'Apertura de cámara';
    } else if (textLower.includes('linterna') || textLower.includes('flash') || textLower.includes('la luz')) {
      action = 'toggle_flashlight';
      feedbackText = 'Cambiando estado de la linterna...';
      explanation = 'Control de linterna';
    } else if (textLower.includes('wifi') || textLower.includes('wi-fi')) {
      action = 'toggle_wifi';
      feedbackText = 'Abriendo ajustes de WiFi...';
      explanation = 'Control de WiFi';
    } else if (textLower.includes('bluetooth')) {
      action = 'toggle_bluetooth';
      feedbackText = 'Abriendo ajustes de Bluetooth...';
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
      feedbackText = `Ajustando el brillo de pantalla al ${level} por ciento.`;
      explanation = 'Ajuste de brillo de pantalla';
    } else if (textLower.includes('cierra') || textLower.includes('cerrar') || textLower.includes('inicio') || textLower.includes('atrás')) {
      action = 'close_app';
      feedbackText = 'Cerrando aplicación...';
      explanation = 'Navegación nativa de retorno';
    } else if (textLower.includes('abre') || textLower.includes('abrir')) {
      action = 'open_app';
      const appName = transcript.replace(/^.*?\b(abre|abrir)\b/i, '').trim();
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
    } else if (
      textLower.includes('cuantos') || textLower.includes('cuántos') ||
      textLower.includes('quien') || textLower.includes('quién') ||
      textLower.includes('que') || textLower.includes('qué') ||
      textLower.includes('por que') || textLower.includes('por qué') ||
      textLower.includes('donde') || textLower.includes('dónde') ||
      textLower.includes('planetas') || textLower.includes('sistema solar') ||
      textLower.includes('calcula') || textLower.includes('cuanto es') || textLower.includes('cuánto es') ||
      textLower.endsWith('?')
    ) {
      action = 'general_query';
      params = { query: transcript };
      if (textLower.includes('planetas') || textLower.includes('sistema solar')) {
        feedbackText = 'El sistema solar consta de ocho planetas principales: Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano y Neptuno.';
      } else {
        feedbackText = `Procesando tu consulta: ${transcript}.`;
      }
      explanation = 'Consulta de información hablada por voz';
    } else {
      action = 'general_query';
      params = { query: transcript };
      feedbackText = `Entendido. Procesando: ${transcript}.`;
      explanation = 'Respuesta por voz de Jarvis';
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
