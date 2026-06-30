import React, { useState, useRef, useEffect } from "react";
import { Send, Phone, Video, MoreVertical, CheckCheck, Smile, Paperclip, MessageSquare, ShieldAlert, ArrowRight, Home } from "lucide-react";
import { Lead, Message } from "../types";
import { Property } from "../data/properties";

interface WhatsAppChatProps {
  lead: Lead | null;
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export default function WhatsAppChat({
  lead,
  onSendMessage,
  isLoading,
  properties,
  onSelectProperty,
}: WhatsAppChatProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggestion chips for testing
  const suggestions = [
    "Hola, busco rentar algo por la Roma",
    "Quiero comprar una casa con jardín de 3 recámaras",
    "Mi presupuesto máximo es de $25,000 al mes",
    "Cuento con $800,000 para el enganche",
    "Prefiero departamento con alberca y seguridad",
  ];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lead?.messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleSuggestionClick = (text: string) => {
    if (isLoading) return;
    onSendMessage(text);
  };

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-500 p-8 border border-slate-200 rounded-2xl">
        <MessageSquare className="w-16 h-16 text-slate-300 mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold text-slate-700">Sin chat activo</h3>
        <p className="text-sm text-center max-w-xs mt-1">
          Selecciona un prospecto del dashboard o inicia una simulación para comenzar la conversación por WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[650px] bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      {/* Geometric Terminal Header */}
      <div className="bg-white border-b border-slate-200 text-slate-800 p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white uppercase text-base tracking-wider shadow-xs">
              {lead.name.substring(0, 2)}
            </div>
            <span className="absolute bottom-[-1px] right-[-1px] w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-slate-800">{lead.name}</div>
            <div className="text-[11px] text-slate-500 flex items-center font-mono mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-1.5"></span>
              {lead.phone} • En línea (Simulado)
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-slate-400">
          <button className="hover:text-slate-800 transition-colors cursor-pointer" title="Simular llamada de voz">
            <Phone className="w-4 h-4" />
          </button>
          <button className="hover:text-slate-800 transition-colors cursor-pointer" title="Simular videollamada">
            <Video className="w-4 h-4" />
          </button>
          <button className="hover:text-slate-800 transition-colors cursor-pointer">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 whatsapp-bg overflow-y-auto p-4 space-y-4 flex flex-col">
        {/* System welcome notice */}
        <div className="self-center bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 max-w-md text-[11px] text-indigo-900 text-center shadow-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
          <div>
            <strong>Simulador de Canal:</strong> InmobiAI calificará al cliente de forma automática. Elige una de las respuestas recomendadas abajo o escribe en el chat.
          </div>
        </div>

        {lead.messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                isUser ? "self-end items-end" : "self-start items-start"
              }`}
            >
              {/* Message bubble */}
              <div
                className={`rounded-2xl p-3.5 shadow-xs relative text-sm leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {/* Timestamp and delivery indicator */}
                <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 select-none ${isUser ? "text-indigo-200" : "text-slate-400"}`}>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-white opacity-85" />}
                </div>
              </div>

              {/* Renders property matches if this message returned them */}
              {msg.matchedProperties && msg.matchedProperties.length > 0 && (
                <div className="mt-3 w-full space-y-3 pl-1 self-start">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-indigo-600" /> Matches de la API de Brokers:
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 overflow-x-auto pb-1 max-w-full">
                    {msg.matchedProperties.map((propId) => {
                      const prop = properties.find((p) => p.id === propId);
                      if (!prop) return null;
                      return (
                        <div
                          key={prop.id}
                          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all shrink-0 w-[240px] flex flex-col"
                        >
                          <div className="relative h-28 bg-slate-100">
                            <img
                              src={prop.imageUrl}
                              alt={prop.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className={`absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded uppercase shadow-xs ${
                              prop.operation === "renta" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                            }`}>
                              {prop.operation}
                            </span>
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between bg-white">
                            <div>
                              <h4 className="text-[12px] font-bold text-slate-800 line-clamp-1 mb-1 leading-snug">
                                {prop.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium mb-1.5 line-clamp-1">
                                📍 {prop.location}
                              </p>
                              <div className="text-sm font-black text-indigo-600 mb-1.5">
                                ${prop.price.toLocaleString("es-MX")}
                                <span className="text-[10px] font-normal text-slate-400">
                                  {prop.operation === "renta" ? " /mes" : " MXN"}
                                </span>
                              </div>
                            </div>
                            <div className="border-t border-slate-100 pt-2.5 mt-1 flex items-center justify-between gap-1">
                              <span className="text-[10px] text-slate-500 font-medium font-mono">
                                {prop.bedrooms} Rec • {prop.bathrooms} Bañ
                              </span>
                              <button
                                onClick={() => onSelectProperty(prop)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 shrink-0 uppercase tracking-wider"
                              >
                                Ver Ficha <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="self-start bg-white rounded-xl p-3 shadow-xs rounded-tl-none border border-slate-200/50 flex items-center space-x-2">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="flex space-x-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </span>
              BrokerBot está escribiendo...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips Panel */}
      <div className="bg-slate-50 p-3 border-t border-slate-200">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-1 select-none">
          Simular Respuesta del Cliente (Clic para enviar):
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((text, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(text)}
              disabled={isLoading}
              className="bg-white border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/20 text-xs text-slate-600 hover:text-indigo-600 px-3.5 py-1.5 rounded-lg shadow-2xs whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp Input Footer */}
      <form onSubmit={handleSubmit} className="bg-white p-3 flex items-center space-x-3 border-t border-slate-200">
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          title="Simular enviar emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          title="Simular adjuntar archivo/ficha"
        >
          <Paperclip className="w-4.5 h-4.5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe una respuesta como si fueras el cliente..."
          className="flex-1 bg-slate-50 rounded-lg py-2 px-4 text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg shadow-sm transition-colors shrink-0 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
          title="Enviar mensaje"
        >
          <Send className="w-4 h-4 fill-white" />
        </button>
      </form>
    </div>
  );
}
