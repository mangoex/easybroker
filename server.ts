import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { INITIAL_PROPERTIES, Property } from "./src/data/properties";
import { Lead, Message, Criteria, BotConfig } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini client (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not set. Chatbot responses will be mocked.");
}

// In-memory databases
let properties: Property[] = [...INITIAL_PROPERTIES];

const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Sofía Martínez",
    phone: "+52 55 1234 5678",
    status: "conversando",
    lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    criteria: {
      operation: "renta",
      location: null,
      maxPrice: null,
      initialCapital: null,
      bedrooms: null,
      features: []
    },
    messages: [
      {
        id: "msg-1-1",
        sender: "user",
        text: "Hola, buenas tardes. Estoy buscando rentar un departamento.",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: "msg-1-2",
        sender: "bot",
        text: "¡Hola, Sofía! Un gusto saludarte. Claro que sí, con mucho gusto te ayudo a encontrar tu departamento ideal. Para empezar, ¿en qué zona o colonia te gustaría vivir?",
        timestamp: new Date(Date.now() - 29 * 60 * 1000).toISOString()
      },
      {
        id: "msg-1-3",
        sender: "user",
        text: "Me gustaría en la Roma Norte o la Condesa en CDMX.",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "lead-2",
    name: "Carlos Ortega",
    phone: "+52 81 9876 5432",
    status: "calificado",
    lastActivity: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    criteria: {
      operation: "venta",
      location: "Juriquilla",
      maxPrice: 5000000,
      initialCapital: 1000000,
      bedrooms: 3,
      features: ["jardin", "seguridad"]
    },
    messages: [
      {
        id: "msg-2-1",
        sender: "user",
        text: "Hola, busco comprar casa en Juriquilla, Querétaro. Mi presupuesto es de máximo 5 millones.",
        timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString()
      },
      {
        id: "msg-2-2",
        sender: "bot",
        text: "¡Excelente elección Carlos! Juriquilla es una zona con gran plusvalía. Para darte opciones viables, ¿cuentas con algún capital para el enganche? Por ejemplo, unos 900,000 o 1 millón de pesos.",
        timestamp: new Date(Date.now() - 2.4 * 3600 * 1000).toISOString()
      },
      {
        id: "msg-2-3",
        sender: "user",
        text: "Sí, tengo 1 millón para el enganche. Y busco que tenga 3 recámaras y jardín, de preferencia en privada con seguridad.",
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: "msg-2-4",
        sender: "bot",
        text: "¡Perfecto Carlos! He guardado tus especificaciones. He conectado con nuestros brokers asociados y encontré una opción espectacular en Juriquilla con 3 recámaras, amplio jardín y fraccionamiento cerrado por $4,800,000 MXN. ¿Te gustaría agendar una visita virtual o presencial?",
        timestamp: new Date(Date.now() - 1.9 * 3600 * 1000).toISOString(),
        matchedProperties: ["prop-3"]
      }
    ]
  },
  {
    id: "lead-3",
    name: "Diana Ruiz",
    phone: "+52 33 2244 6688",
    status: "conversando",
    lastActivity: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    criteria: {
      operation: "renta",
      location: "Guadalajara",
      maxPrice: 16000,
      initialCapital: null,
      bedrooms: null,
      features: []
    },
    messages: [
      {
        id: "msg-3-1",
        sender: "user",
        text: "Hola, ando buscando departamento para rentar en Guadalajara.",
        timestamp: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString()
      },
      {
        id: "msg-3-2",
        sender: "bot",
        text: "¡Hola Diana! Qué gusto saludarte. Guadalajara tiene excelentes zonas. ¿De cuánto es tu límite de pago mensual aproximado?",
        timestamp: new Date(Date.now() - 1.4 * 3600 * 1000).toISOString()
      },
      {
        id: "msg-3-3",
        sender: "user",
        text: "Como máximo puedo pagar unos 16,000 pesos al mes.",
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      }
    ]
  }
];

let leads: Lead[] = [...INITIAL_LEADS];

let config: BotConfig = {
  whatsappNumber: "+52 55 9000 1234",
  whatsappToken: "wh_tok_live_8f3d11b22e9a7810c8bc",
  webhookUrl: "https://api.asisteinmobiliario.com/v1/whatsapp/webhook",
  brokerApiUrl: "https://api.brokersasociados.mx/v2/properties",
  brokerApiKey: "",
  isAutoReplyEnabled: true,
};

// Helper to filter matching properties
function findMatchingProperties(criteria: Criteria, list: Property[]): Property[] {
  return list.filter((prop) => {
    // 1. Operation match
    if (criteria.operation && criteria.operation !== prop.operation) {
      return false;
    }

    // 2. Max Price match
    if (criteria.maxPrice && prop.price > criteria.maxPrice) {
      return false;
    }

    // 3. Location match (case insensitive, substring)
    if (criteria.location) {
      const criteriaLoc = criteria.location.toLowerCase();
      const propLoc = prop.location.toLowerCase();
      const propTitle = prop.title.toLowerCase();

      // Check if location words match or are contained
      const words = criteriaLoc.replace(",", "").split(" ");
      const hasWordMatch = words.some(word => word.length > 3 && (propLoc.includes(word) || propTitle.includes(word)));
      if (!propLoc.includes(criteriaLoc) && !criteriaLoc.includes(propLoc) && !hasWordMatch) {
        return false;
      }
    }

    // 4. Bedrooms match
    if (criteria.bedrooms && prop.bedrooms < criteria.bedrooms) {
      return false;
    }

    // 5. Initial Capital match
    // Simple verification: if buying, they need some capital (usually >= 5% of price). If renting, they need deposit + rental.
    if (criteria.initialCapital) {
      if (prop.operation === "venta") {
        const minimumDownpaymentRequired = prop.price * 0.05; // 5% minimum
        if (criteria.initialCapital < minimumDownpaymentRequired) {
          return false;
        }
      } else {
        // Renting
        const minimumCapitalRequired = prop.price * 1.5; // Rent + half deposit at least
        if (criteria.initialCapital < minimumCapitalRequired) {
          return false;
        }
      }
    }

    return true;
  });
}

// API Routes
// 1. Get properties
app.get("/api/properties", (req, res) => {
  res.json(properties);
});

// 2. Create property
app.post("/api/properties", (req, res) => {
  const newProp: Property = {
    id: "prop-" + Date.now(),
    ...req.body,
  };
  properties.push(newProp);
  res.status(201).json(newProp);
});

// 3. Delete property
app.delete("/api/properties/:id", (req, res) => {
  properties = properties.filter((p) => p.id !== req.params.id);
  res.json({ success: true });
});

// 4. Get leads
app.get("/api/leads", (req, res) => {
  res.json(leads);
});

// 5. Reset leads
app.post("/api/leads/reset", (req, res) => {
  leads = [...INITIAL_LEADS];
  properties = [...INITIAL_PROPERTIES];
  res.json({ success: true, leads, properties });
});

// 6. Get bot config
app.get("/api/config", (req, res) => {
  res.json(config);
});

// 7. Update bot config
app.post("/api/config", (req, res) => {
  config = { ...config, ...req.body };
  res.json(config);
});

// 8. Create a new lead/contact
app.post("/api/leads", (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Nombre y teléfono son obligatorios." });
  }

  // Check if phone already exists
  const existing = leads.find((l) => l.phone === phone);
  if (existing) {
    return res.json(existing);
  }

  const newLead: Lead = {
    id: "lead-" + Date.now(),
    name,
    phone,
    status: "conversando",
    lastActivity: new Date().toISOString(),
    criteria: {
      operation: null,
      location: null,
      maxPrice: null,
      initialCapital: null,
      bedrooms: null,
      features: []
    },
    messages: [
      {
        id: "msg-" + Date.now() + "-welcome",
        sender: "bot",
        text: `¡Hola, ${name}! Te saluda BrokerBot, tu asistente inmobiliario inteligente. 🏠 Estoy aquí para ayudarte a comprar o rentar tu próxima casa o departamento. ¿Cuéntame, qué tipo de operación estás buscando? ¿Comprar o rentar?`,
        timestamp: new Date().toISOString()
      }
    ]
  };

  leads.unshift(newLead);
  res.status(201).json(newLead);
});

// 9. Process WhatsApp Chat Message (Simulated Receive)
app.post("/api/chat/send", async (req, res) => {
  const { leadId, text } = req.body;
  if (!leadId || !text) {
    return res.status(400).json({ error: "leadId y texto son requeridos" });
  }

  // Find the lead
  const leadIndex = leads.findIndex((l) => l.id === leadId);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Prospecto no encontrado" });
  }

  const lead = leads[leadIndex];

  // Add the user's message
  const userMessage: Message = {
    id: "msg-" + Date.now() + "-user",
    sender: "user",
    text,
    timestamp: new Date().toISOString(),
  };

  lead.messages.push(userMessage);
  lead.lastActivity = new Date().toISOString();

  // If auto reply is disabled, just return the user message
  if (!config.isAutoReplyEnabled) {
    return res.json({ lead, reply: null });
  }

  let botReplyText = "";
  let updatedCriteria: Criteria = { ...lead.criteria };

  if (ai) {
    try {
      // Build conversation context for Gemini
      const conversationHistory = lead.messages
        .filter((m) => m.sender !== "system")
        .map((m) => `${m.sender === "user" ? "Prospecto" : "BrokerBot (Asistente)"}: ${m.text}`)
        .join("\n");

      const systemPrompt = `Eres "BrokerBot", un asistente inmobiliario virtual amigable, empático y muy profesional que atiende por WhatsApp.
Tu objetivo principal es CALIFICAR al prospecto que busca comprar o rentar un inmueble (casa o departamento).

Para poder buscar en la base de datos de los brokers (API), DEBES obtener información sobre estos 5 aspectos claves. No los preguntes todos juntos, hazlo de manera fluida y conversacional según vaya la plática:
1. "operation": Qué operación quiere hacer: si quiere COMPRAR o RENTAR.
2. "location": En qué ubicación, zona, colonia o ciudad busca el inmueble.
3. "maxPrice": Cuál es su presupuesto máximo de renta o compra (límite de pago).
4. "initialCapital": Con cuánto dinero cuenta actualmente para comenzar (para VENTA, se refiere al ENGANCHE disponible; para RENTA, se refiere al depósito y presupuesto inmediato).
5. "bedrooms": Cuántas recámaras o características especiales busca.

Historial de la conversación actual hasta el momento:
${conversationHistory}

Instrucciones de análisis:
- Lee el último mensaje del Prospecto e identifica si aportó algún dato nuevo para estos 5 aspectos.
- Actualiza el objeto "extracted_criteria" basándote en TODO lo que el prospecto ha dicho hasta ahora en el historial (no borres lo que ya se calificó antes, consérvalo o refínalo si cambió de opinión).
- Genera un mensaje de respuesta corto, natural y amigable (estilo chat de WhatsApp, usa emojis moderados de casas, llaves, etc.).
- Si falta alguno de los 5 datos, haz una pregunta directa pero cortés para obtener uno de los datos faltantes. Prioriza pedir la operación (renta/compra) o ubicación si son nulos.
- Si ya tienes la mayoría de los datos (operación, ubicación, presupuesto), puedes comentarle que estás buscando ofertas en la API de Brokers.
- Mantén las respuestas breves y directas, simulando el estilo de WhatsApp.`;

      // Define the output schema using `@google/genai` Type definitions
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            text: `Por favor analiza esta conversación inmobiliaria y responde siguiendo las instrucciones del sistema.`
          }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: {
                type: Type.STRING,
                description: "La respuesta de WhatsApp amable y profesional en español para el prospecto."
              },
              extracted_criteria: {
                type: Type.OBJECT,
                description: "Los criterios inmobiliarios extraídos de la conversación acumulada hasta ahora.",
                properties: {
                  operation: {
                    type: Type.STRING,
                    description: "El tipo de operación. Valores permitidos: 'venta' (comprar/adquirir), 'renta' (rentar/alquilar). O null si aún no se especifica."
                  },
                  location: {
                    type: Type.STRING,
                    description: "La ubicación, colonia, zona o ciudad. O null si aún no se especifica."
                  },
                  maxPrice: {
                    type: Type.INTEGER,
                    description: "El presupuesto o límite de pago en número (ej: 15000 o 3500000). O null si aún no se especifica."
                  },
                  initialCapital: {
                    type: Type.INTEGER,
                    description: "El capital inicial o enganche disponible en número. O null si aún no se especifica."
                  },
                  bedrooms: {
                    type: Type.INTEGER,
                    description: "Número de recámaras requeridas (entero). O null si aún no se especifica."
                  },
                  features: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Lista de palabras clave o amenidades especificadas (ej: 'jardin', 'alberca', 'seguridad', 'balcon', 'amueblado', 'estacionamiento')."
                  }
                },
              },
            },
            required: ["message", "extracted_criteria"]
          },
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        botReplyText = parsed.message || "";
        
        // Merge extracted criteria with existing criteria to avoid losing previously gathered parameters
        const ext = parsed.extracted_criteria || {};
        
        updatedCriteria = {
          operation: ext.operation !== undefined ? ext.operation : lead.criteria.operation,
          location: ext.location !== undefined ? ext.location : lead.criteria.location,
          maxPrice: ext.maxPrice !== undefined ? ext.maxPrice : lead.criteria.maxPrice,
          initialCapital: ext.initialCapital !== undefined ? ext.initialCapital : lead.criteria.initialCapital,
          bedrooms: ext.bedrooms !== undefined ? ext.bedrooms : lead.criteria.bedrooms,
          features: ext.features !== undefined ? ext.features : (lead.criteria.features || [])
        };
      } else {
        throw new Error("No text returned from Gemini");
      }
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      // Fallback response generator if Gemini fails or is unconfigured
      botReplyText = `¡Gracias por tu mensaje! Estoy buscando en nuestra base de datos. Para darte el mejor servicio, indícame: ¿buscas comprar o rentar?, ¿en qué zona?, ¿presupuesto?, ¿capital disponible? y ¿cuántas recámaras necesitas?`;
    }
  } else {
    // Local fallback heuristic rule-based bot for preview offline mode
    const textLower = text.toLowerCase();
    let reply = "";

    // Heuristics to update criteria
    if (textLower.includes("rent") || textLower.includes("alquilar")) {
      updatedCriteria.operation = "renta";
    } else if (textLower.includes("comprar") || textLower.includes("vent") || textLower.includes("adquirir")) {
      updatedCriteria.operation = "venta";
    }

    if (textLower.includes("roma") || textLower.includes("condesa") || textLower.includes("polanco") || textLower.includes("cdmx")) {
      updatedCriteria.location = "CDMX / Roma-Condesa";
    } else if (textLower.includes("queretaro") || textLower.includes("juriquilla") || textLower.includes("qro")) {
      updatedCriteria.location = "Juriquilla, Querétaro";
    } else if (textLower.includes("guadalajara") || textLower.includes("gdl") || textLower.includes("jal")) {
      updatedCriteria.location = "Guadalajara, Jalisco";
    } else if (textLower.includes("san pedro") || textLower.includes("monterrey") || textLower.includes("mty")) {
      updatedCriteria.location = "San Pedro Garza García, NL";
    }

    // Numbers search
    const numMatches = textLower.match(/\b\d+([.,]\d+)?\b/g);
    if (numMatches && numMatches.length > 0) {
      const numbers = numMatches.map(n => parseInt(n.replace(/[,.]/g, ""), 10)).filter(n => n > 100);
      if (numbers.length > 0) {
        // If operation is rent and value > 200000, probably it's initial capital or selling budget
        const primaryNumber = numbers[0];
        if (updatedCriteria.operation === "renta") {
          if (primaryNumber <= 40000) {
            updatedCriteria.maxPrice = primaryNumber;
          } else {
            updatedCriteria.initialCapital = primaryNumber;
          }
        } else if (updatedCriteria.operation === "venta") {
          if (primaryNumber >= 1000000) {
            updatedCriteria.maxPrice = primaryNumber;
          } else if (primaryNumber >= 100000 && primaryNumber < 1000000) {
            updatedCriteria.initialCapital = primaryNumber;
          }
        } else {
          // undetermined
          updatedCriteria.maxPrice = primaryNumber;
        }
      }
    }

    // Bedrooms heuristic
    if (textLower.includes("recámara") || textLower.includes("recamara") || textLower.includes("habitacion") || textLower.includes("habs")) {
      const bedMatch = textLower.match(/(\d+)\s*(recámara|recamara|habitacion|hab)/);
      if (bedMatch) {
        updatedCriteria.bedrooms = parseInt(bedMatch[1], 10);
      } else if (textLower.includes("dos") || textLower.includes("2")) {
        updatedCriteria.bedrooms = 2;
      } else if (textLower.includes("tres") || textLower.includes("3")) {
        updatedCriteria.bedrooms = 3;
      } else if (textLower.includes("una") || textLower.includes("1")) {
        updatedCriteria.bedrooms = 1;
      }
    }

    // Features
    if (textLower.includes("jardin") || textLower.includes("jardín")) {
      updatedCriteria.features = [...(updatedCriteria.features || []), "jardin"];
    }
    if (textLower.includes("alberca") || textLower.includes("piscina")) {
      updatedCriteria.features = [...(updatedCriteria.features || []), "alberca"];
    }
    if (textLower.includes("seguridad") || textLower.includes("privada") || textLower.includes("vigilancia")) {
      updatedCriteria.features = [...(updatedCriteria.features || []), "seguridad"];
    }

    // Build friendly reply based on missing things
    if (!updatedCriteria.operation) {
      reply = "¡Hola! Con mucho gusto te asesoro. Para darte las mejores opciones de casas y departamentos, ¿buscas rentar o comprar?";
    } else if (!updatedCriteria.location) {
      reply = `Perfecto, buscas ${updatedCriteria.operation === "renta" ? "rentar" : "comprar"}. ¿En qué zona, colonia o ciudad estás buscando tu nuevo hogar?`;
    } else if (!updatedCriteria.maxPrice) {
      reply = `Excelente. ¿Cuál es tu presupuesto límite mensual para la ${updatedCriteria.operation === "renta" ? "renta" : "compra"}?`;
    } else if (!updatedCriteria.initialCapital) {
      if (updatedCriteria.operation === "venta") {
        reply = `Muy bien. Al ser una compra, ¿con cuánto capital cuentas actualmente para tu enganche y gastos notariales?`;
      } else {
        reply = `Entendido. ¿Tienes contemplado algún monto para el depósito en garantía y primer mes de renta?`;
      }
    } else if (!updatedCriteria.bedrooms) {
      reply = `De acuerdo. ¿Cuántas recámaras o habitaciones como mínimo necesitas que tenga el inmueble?`;
    } else {
      reply = `¡Súper! He calificado tu perfil correctamente. Tengo toda la información que necesito: buscas ${updatedCriteria.operation === "renta" ? "rentar" : "comprar"} en ${updatedCriteria.location}, con presupuesto de $${updatedCriteria.maxPrice} MXN, contando con $${updatedCriteria.initialCapital} de capital inicial. ¡Permíteme buscar en nuestra API de brokers asociados!`;
    }

    botReplyText = reply;
  }

  // Update lead criteria
  lead.criteria = updatedCriteria;

  // Perform dynamic property matching
  const matches = findMatchingProperties(lead.criteria, properties);
  const matchedIds = matches.map((p) => p.id);

  // Check if we qualified all or have good criteria to mark as qualified
  const hasOperation = !!lead.criteria.operation;
  const hasLocation = !!lead.criteria.location;
  const hasMaxPrice = !!lead.criteria.maxPrice;
  const hasInitialCapital = !!lead.criteria.initialCapital;
  const hasBedrooms = !!lead.criteria.bedrooms;

  const qualifiedCount = [hasOperation, hasLocation, hasMaxPrice, hasInitialCapital, hasBedrooms].filter(Boolean).length;
  
  if (qualifiedCount === 5) {
    lead.status = "calificado";
  } else {
    lead.status = "conversando";
  }

  // If we have matches and we just updated critical criteria, we append properties inside the bot message
  let matchedPropertiesPayload: string[] | undefined = undefined;
  if (matches.length > 0 && (hasOperation && hasLocation && hasMaxPrice)) {
    // If it's a search-triggered moment, or we have matches
    matchedPropertiesPayload = matchedIds.slice(0, 3); // Max 3 properties in one WhatsApp turn
  }

  const botMessage: Message = {
    id: "msg-" + Date.now() + "-bot",
    sender: "bot",
    text: botReplyText,
    timestamp: new Date().toISOString(),
    matchedProperties: matchedPropertiesPayload,
  };

  lead.messages.push(botMessage);
  lead.lastActivity = new Date().toISOString();

  // Move lead to the top of the list
  leads = [lead, ...leads.filter((l) => l.id !== lead.id)];

  res.json({ lead, reply: botMessage });
});

// Start server
async function startServer() {
  // Vite middleware in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
