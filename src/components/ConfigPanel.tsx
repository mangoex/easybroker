import React from "react";
import { Settings, ShieldCheck, Key, HelpCircle, Code, Copy, ToggleLeft, ToggleRight, Check } from "lucide-react";
import { BotConfig } from "../types";

interface ConfigPanelProps {
  config: BotConfig;
  onUpdateConfig: (newConfig: Partial<BotConfig>) => void;
}

export default function ConfigPanel({ config, onUpdateConfig }: ConfigPanelProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const webhookCodeSnippet = `// EJEMPLO DE WEBHOOK REAL EN NODE.JS / EXPRESS
// Este script recibe los mensajes entrantes de tu proveedor de WhatsApp (ej: Twilio o Meta API),
// llama a Gemini para calificar al cliente, busca en el Broker API y devuelve la respuesta.

import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import axios from 'axios';

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const BROKER_API_URL = "https://api.brokersasociados.mx/v2/properties";
const WHATSAPP_API_URL = "https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages";
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// Webhook para recibir mensajes de WhatsApp (POST)
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200); // No es un mensaje
    }

    const clientPhone = message.from;
    const clientMessageText = message.text?.body;
    const clientName = value?.contacts?.[0]?.profile?.name || "Prospecto WhatsApp";

    // 1. Llamar a Gemini con el historial del cliente para extraer criterios (5 aspectos)
    const geminiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Conversación del cliente: " + clientMessageText,
      config: {
        systemInstruction: "Eres un bot inmobiliario de WhatsApp. Extrae en JSON: operation, location, maxPrice, initialCapital, bedrooms.",
        responseMimeType: "application/json",
        // Aquí pasas el esquema JSON para que devuelva estructura limpia
      }
    });

    const parsedResult = JSON.parse(geminiResponse.text);
    const { message: replyText, extracted_criteria } = parsedResult;

    // 2. Conectarse a la API de Brokers si ya tenemos ubicación y presupuesto
    let propertiesMatches = [];
    if (extracted_criteria.location && extracted_criteria.maxPrice) {
      const brokerRes = await axios.get(BROKER_API_URL, {
        params: {
          type: extracted_criteria.operation,
          zone: extracted_criteria.location,
          budget_max: extracted_criteria.maxPrice
        }
      });
      propertiesMatches = brokerRes.data;
    }

    // 3. Formatear la respuesta e incluir las propiedades si existen
    let finalWhatsAppText = replyText;
    if (propertiesMatches.length > 0) {
      finalWhatsAppText += "\\n\\nTe comparto las opciones que encontré en la API del Broker:\\n";
      propertiesMatches.slice(0, 3).forEach(prop => {
        finalWhatsAppText += \`\\n🏠 \${prop.title}\\n📍 Ubicación: \${prop.location}\\n💵 Precio: \$\${prop.price.toLocaleString('es-MX')} MXN\\n🔑 Requisitos: \${prop.requirements || 'N/A'}\\n\`;
      });
    }

    // 4. Enviar respuesta final vía WhatsApp API del text provider
    await axios.post(WHATSAPP_API_URL, {
      messaging_product: "whatsapp",
      to: clientPhone,
      text: { body: finalWhatsAppText }
    }, {
      headers: { 'Authorization': \`Bearer \${WHATSAPP_TOKEN}\` }
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Error en webhook de WhatsApp:", err);
    res.sendStatus(500);
  }
});`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
       {/* Configuration Forms Panel (5 columns) */}
      <div className="lg:col-span-5 flex flex-col gap-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" /> Configuración de Canales y APIs
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Define los tokens, webhooks e integraciones con brokers</p>
        </div>

        {/* Integration switches */}
        <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700 block">Bot Auto-Respuesta IA</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Gemini procesará los mensajes automáticamente</span>
          </div>
          <button
            onClick={() => onUpdateConfig({ isAutoReplyEnabled: !config.isAutoReplyEnabled })}
            className="text-slate-600 transition-transform"
          >
            {config.isAutoReplyEnabled ? (
              <ToggleRight className="w-12 h-12 text-indigo-600 cursor-pointer" />
            ) : (
              <ToggleLeft className="w-12 h-12 text-slate-400 cursor-pointer" />
            )}
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Key className="w-3.5 h-3.5 text-slate-400" /> Parámetros del Proveedor de WhatsApp (Text Provider)
          </h4>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Número de WhatsApp (Remitente)</label>
            <input
              type="text"
              value={config.whatsappNumber}
              onChange={e => onUpdateConfig({ whatsappNumber: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">WhatsApp API Token / Key</label>
            <input
              type="password"
              value={config.whatsappToken}
              onChange={e => onUpdateConfig({ whatsappToken: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Webhook URL de Destino</label>
            <input
              type="text"
              value={config.webhookUrl}
              onChange={e => onUpdateConfig({ webhookUrl: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">A esta URL se enviarán los mensajes entrantes en formato JSON</span>
          </div>

          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2 flex items-center gap-1 border-t border-slate-100">
            🏢 Endpoint de Brokers de Propiedades (Broker API)
          </h4>

          {/* EasyBroker Environment Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Ambiente de EasyBroker</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateConfig({
                  brokerApiUrl: "https://api.stagingeb.com",
                  brokerApiKey: "l7u502p8v46ba3ppgvj5y2aad50lb9"
                })}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  config.brokerApiUrl === "https://api.stagingeb.com" && config.brokerApiKey === "l7u502p8v46ba3ppgvj5y2aad50lb9"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Playground Pruebas
                </div>
                <p className="text-[9px] text-slate-400 leading-tight">Credenciales públicas de staging para pruebas.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateConfig({
                    brokerApiUrl: config.brokerApiUrl === "https://api.stagingeb.com" ? "https://api.easybroker.com/v1" : config.brokerApiUrl,
                    brokerApiKey: config.brokerApiKey === "l7u502p8v46ba3ppgvj5y2aad50lb9" ? "" : config.brokerApiKey
                  });
                }}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  config.brokerApiUrl !== "https://api.stagingeb.com" || config.brokerApiKey !== "l7u502p8v46ba3ppgvj5y2aad50lb9"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Producción / Real
                </div>
                <p className="text-[9px] text-slate-400 leading-tight">Configura tus llaves de producción reales.</p>
              </button>
            </div>

            {config.brokerApiUrl === "https://api.stagingeb.com" && config.brokerApiKey === "l7u502p8v46ba3ppgvj5y2aad50lb9" && (
              <div className="bg-indigo-50 border border-indigo-150 text-indigo-900 text-[10px] p-2 rounded-lg leading-relaxed flex gap-1.5 items-start">
                <span className="text-indigo-600 font-bold">🧪</span>
                <div>
                  <strong>Staging Activado:</strong> El sistema está preconfigurado con el Playground de pruebas de EasyBroker para validar la integración.
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Broker API Endpoint URL</label>
            <input
              type="text"
              value={config.brokerApiUrl}
              onChange={e => onUpdateConfig({ brokerApiUrl: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Ruta del servicio REST de los brokers de propiedades</span>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">EasyBroker API Key (X-Authorization)</label>
            <input
              type="text"
              value={config.brokerApiKey || ""}
              onChange={e => onUpdateConfig({ brokerApiKey: e.target.value })}
              placeholder="Ej: l7u502p8v46ba3ppgvj5y2aad50lb9"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Llave de autenticación para consultar propiedades en EasyBroker</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2.5 mt-2">
          <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-500 leading-relaxed">
            <strong>¿Cómo conectarlo con un canal real?</strong> Registra una cuenta en Twilio o Meta Developer Console, obtén tu número verificado y configura la Webhook URL apuntando a tu servidor para recibir los mensajes entrantes de WhatsApp.
          </div>
        </div>
      </div>

      {/* Code Snippet and Architecture Overview (7 columns) */}
      <div className="lg:col-span-7 flex flex-col gap-5 h-[600px]">
        {/* Architecture Flow */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-3">
          <h3 className="font-bold font-display text-slate-800 text-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" /> Arquitectura de la Integración
          </h3>
          
          {/* Diagrams step list */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center mt-1.5">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="bg-slate-800 text-white text-[10px] font-bold w-5 h-5 rounded-full inline-flex items-center justify-center mb-1">1</span>
              <h5 className="font-bold text-[10px] text-slate-700 uppercase">Mensaje WhatsApp</h5>
              <p className="text-[10px] text-slate-500 mt-1">El cliente escribe a tu número</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="bg-slate-800 text-white text-[10px] font-bold w-5 h-5 rounded-full inline-flex items-center justify-center mb-1">2</span>
              <h5 className="font-bold text-[10px] text-slate-700 uppercase">Text Provider</h5>
              <p className="text-[10px] text-slate-500 mt-1">Envía webhook JSON a tu app</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="bg-slate-800 text-white text-[10px] font-bold w-5 h-5 rounded-full inline-flex items-center justify-center mb-1">3</span>
              <h5 className="font-bold text-[10px] text-slate-700 uppercase">Extracción IA</h5>
              <p className="text-[10px] text-slate-500 mt-1">Gemini califica los 5 datos clave</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="bg-slate-800 text-white text-[10px] font-bold w-5 h-5 rounded-full inline-flex items-center justify-center mb-1">4</span>
              <h5 className="font-bold text-[10px] text-slate-700 uppercase">API Brokers</h5>
              <p className="text-[10px] text-slate-500 mt-1">Consulta ofertas y responde</p>
            </div>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 border border-slate-800 shadow-md flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-xs font-mono text-slate-200 flex items-center gap-1.5 uppercase">
              <Code className="w-4 h-4 text-indigo-400" /> Código del Webhook de WhatsApp (Node.js)
            </h4>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded border border-slate-700 transition-colors cursor-pointer font-bold"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-indigo-450" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copiar Código
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[340px] bg-slate-950 rounded-xl p-4 border border-slate-850">
            <pre className="text-[11px] font-mono text-indigo-300 leading-relaxed select-all">
              {webhookCodeSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
