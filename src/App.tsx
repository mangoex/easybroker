import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Users,
  Building2,
  Settings,
  RefreshCw,
  Plus,
  Terminal,
  Wifi,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Home,
  CheckCircle,
  Clock
} from "lucide-react";
import WhatsAppChat from "./components/WhatsAppChat";
import LeadDashboard from "./components/LeadDashboard";
import BrokerCatalog from "./components/BrokerCatalog";
import ConfigPanel from "./components/ConfigPanel";
import { Lead, BotConfig } from "./types";
import { Property } from "./data/properties";

interface SystemLog {
  id: string;
  time: string;
  type: "webhook" | "gemini" | "broker" | "success";
  text: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"simulator" | "leads" | "brokers" | "config">("simulator");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  // Modal State for adding a new lead
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");

  // Helper to add real-time system logs
  const addLog = (text: string, type: "webhook" | "gemini" | "broker" | "success" = "webhook") => {
    const newLog: SystemLog = {
      id: "log-" + Date.now() + Math.random().toString(36).substring(4),
      time: new Date().toLocaleTimeString(),
      type,
      text,
    };
    setSystemLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      addLog("Iniciando servicios de simulación...", "success");
      
      const propertiesRes = await fetch("/api/properties");
      const propertiesData = await propertiesRes.json();
      setProperties(propertiesData);
      addLog(`Cargados ${propertiesData.length} inmuebles de brokers asociados`, "broker");

      const leadsRes = await fetch("/api/leads");
      const leadsData = await leadsRes.json();
      setLeads(leadsData);
      addLog(`Sincronizados ${leadsData.length} prospectos desde base de datos`, "success");

      if (leadsData.length > 0) {
        setSelectedLead(leadsData[0]);
      }

      const configRes = await fetch("/api/config");
      const configData = await configRes.json();
      setConfig(configData);
    } catch (err) {
      console.error("Error fetching initial data:", err);
      addLog("Error al inicializar bases de datos locales.", "webhook");
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set initial custom logs to illustrate the system state
    setSystemLogs([
      { id: "1", time: new Date().toLocaleTimeString(), type: "success", text: "BrokerBot activado en puerto virtual 3000." },
      { id: "2", time: new Date().toLocaleTimeString(), type: "webhook", text: "Conexión de Text Provider lista para recibir Webhooks." },
      { id: "3", time: new Date().toLocaleTimeString(), type: "broker", text: "API del Broker conectada con 9 listados de propiedades activos." }
    ]);
  }, []);

  // Send message handler (Simulation)
  const handleSendMessage = async (text: string) => {
    if (!selectedLead) return;

    setIsChatLoading(true);
    addLog(`Mensaje recibido de ${selectedLead.name}: "${text}"`, "webhook");

    try {
      // Send optimistic message state to the UI before backend resolves
      const updatedLeadsList = leads.map((l) => {
        if (l.id === selectedLead.id) {
          return {
            ...l,
            lastActivity: new Date().toISOString(),
            messages: [
              ...l.messages,
              {
                id: "msg-optimistic-" + Date.now(),
                sender: "user" as const,
                text,
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return l;
      });
      setLeads(updatedLeadsList);

      addLog("Llamando a Gemini para calificar y extraer parámetros...", "gemini");

      // Post to chat send
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selectedLead.id, text }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update leads list and selected lead state
      const refreshedLeadsRes = await fetch("/api/leads");
      const refreshedLeads = await refreshedLeadsRes.json();
      setLeads(refreshedLeads);

      const updatedLead = refreshedLeads.find((l: Lead) => l.id === selectedLead.id);
      if (updatedLead) {
        setSelectedLead(updatedLead);
        
        // Log Gemini output and metrics
        addLog(`Gemini procesó respuesta. Criterios extraídos: ${JSON.stringify(updatedLead.criteria)}`, "gemini");
        
        const lastMsg = updatedLead.messages[updatedLead.messages.length - 1];
        if (lastMsg.matchedProperties && lastMsg.matchedProperties.length > 0) {
          addLog(`Búsqueda Broker API exitosa: Encontrados ${lastMsg.matchedProperties.length} inmuebles compatibles`, "broker");
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      addLog("Fallo al enviar mensaje al motor de análisis.", "webhook");
    } finally {
      setIsChatLoading(false);
    }
  };

  // Add a custom property to the broker API database
  const handleAddProperty = async (newPropData: Omit<Property, "id">) => {
    try {
      addLog(`Enviando POST a broker para registrar: "${newPropData.title}"`, "broker");
      
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPropData),
      });
      const data = await response.json();
      
      setProperties((prev) => [...prev, data]);
      addLog(`Propiedad registrada exitosamente con ID: ${data.id}`, "success");
    } catch (err) {
      console.error("Error registering property:", err);
      addLog("Error al registrar propiedad en el broker.", "webhook");
    }
  };

  // Delete a property from the broker API database
  const handleDeleteProperty = async (id: string) => {
    try {
      addLog(`Eliminando propiedad ID: ${id} en API de brokers`, "broker");
      await fetch(`/api/properties/${id}`, { method: "DELETE" });
      setProperties((prev) => prev.filter((p) => p.id !== id));
      if (selectedProperty?.id === id) {
        setSelectedProperty(null);
      }
      addLog("Propiedad dada de baja correctamente.", "success");
    } catch (err) {
      console.error("Error deleting property:", err);
    }
  };

  // Update integration/bot config
  const handleUpdateConfig = async (newConfig: Partial<BotConfig>) => {
    if (!config) return;
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig),
      });
      const data = await response.json();
      setConfig(data);
      addLog("Configuración de integración actualizada.", "success");
    } catch (err) {
      console.error("Error updating config:", err);
    }
  };

  // Reset simulator database
  const handleResetSimulator = async () => {
    if (confirm("¿Estás seguro de restablecer la simulación? Se borrarán todos los chats nuevos y propiedades personalizadas.")) {
      try {
        addLog("Restableciendo base de datos a valores iniciales...", "webhook");
        const response = await fetch("/api/leads/reset", { method: "POST" });
        const data = await response.json();
        
        setLeads(data.leads);
        setProperties(data.properties);
        setSelectedProperty(null);
        if (data.leads.length > 0) {
          setSelectedLead(data.leads[0]);
        }
        addLog("Simulación restablecida con éxito.", "success");
      } catch (err) {
        console.error("Error resetting simulator:", err);
      }
    }
  };

  // Add a new lead from form modal
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) return;

    try {
      addLog(`Creando nuevo canal de simulación para ${newLeadName}...`, "webhook");
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLeadName, phone: newLeadPhone }),
      });
      const data = await response.json();
      
      // Refresh leads
      const refreshedLeadsRes = await fetch("/api/leads");
      const refreshedLeads = await refreshedLeadsRes.json();
      setLeads(refreshedLeads);
      
      const created = refreshedLeads.find((l: Lead) => l.id === data.id || l.phone === newLeadPhone);
      if (created) {
        setSelectedLead(created);
        addLog(`Canal iniciado para ${created.name}. BrokerBot envió mensaje de bienvenida.`, "success");
      }
      
      setShowAddLeadModal(false);
      setNewLeadName("");
      setNewLeadPhone("");
      setActiveTab("simulator"); // focus on chat simulator
    } catch (err) {
      console.error("Error creating lead:", err);
      addLog("Error al registrar nuevo cliente simulado.", "webhook");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-600">
      
      {/* Top Professional Header Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo and App Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <div className="w-4 h-4 border-2 border-white rotate-45"></div>
              </div>
              <div>
                <h1 className="text-base font-bold font-display text-slate-800 tracking-tight flex items-center gap-1.5">
                  INMOBI<span className="text-indigo-600">AI</span> <span className="text-[10px] bg-indigo-100 text-indigo-600 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">BrokerLink Bot</span>
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">Asistente IA para Calificación de Prospectos Inmobiliarios</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => setActiveTab("simulator")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "simulator"
                    ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600 rounded-none"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-4 h-4 text-indigo-600" /> Simulador de Chat
              </button>
              <button
                onClick={() => setActiveTab("leads")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "leads"
                    ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600 rounded-none"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4" /> Panel de Leads
              </button>
              <button
                onClick={() => setActiveTab("brokers")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "brokers"
                    ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600 rounded-none"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Home className="w-4 h-4" /> Inventario Brokers (API)
              </button>
              <button
                onClick={() => setActiveTab("config")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "config"
                    ? "bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600 rounded-none"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Settings className="w-4 h-4" /> Configuración API
              </button>
            </nav>

            {/* Quick Action Reset */}
            <div className="flex items-center space-x-3">
              <div className="bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-1.5 hidden lg:flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Servidor Live</span>
              </div>
              <button
                onClick={handleResetSimulator}
                title="Restablecer base de datos"
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation tab bar */}
      <div className="md:hidden bg-white border-b border-slate-200 flex justify-around py-2">
        <button
          onClick={() => setActiveTab("simulator")}
          className={`flex flex-col items-center p-1.5 text-slate-500 hover:text-slate-955 ${activeTab === "simulator" ? "text-indigo-600 font-bold" : ""}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[9px] mt-0.5">Chat</span>
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`flex flex-col items-center p-1.5 text-slate-500 hover:text-slate-955 ${activeTab === "leads" ? "text-indigo-600 font-bold" : ""}`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[9px] mt-0.5">Leads</span>
        </button>
        <button
          onClick={() => setActiveTab("brokers")}
          className={`flex flex-col items-center p-1.5 text-slate-500 hover:text-slate-955 ${activeTab === "brokers" ? "text-indigo-600 font-bold" : ""}`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[9px] mt-0.5">Brokers</span>
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`flex flex-col items-center p-1.5 text-slate-500 hover:text-slate-955 ${activeTab === "config" ? "text-indigo-600 font-bold" : ""}`}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[9px] mt-0.5">API</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Active tab content render */}
        <div className="flex-1">
          {activeTab === "simulator" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Simulator Chat Frame (7 columns) */}
              <div className="lg:col-span-7">
                <WhatsAppChat
                  lead={selectedLead}
                  onSendMessage={handleSendMessage}
                  isLoading={isChatLoading}
                  properties={properties}
                  onSelectProperty={(prop) => {
                    setSelectedProperty(prop);
                    setActiveTab("brokers"); // Switch to broker tab to show the detail
                  }}
                />
              </div>

              {/* Status checklist and summary helper (5 columns) */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                
                {/* Active contact selector */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold font-display text-slate-400 text-[10px] uppercase tracking-widest">
                      Active Prospects
                    </h3>
                    <button
                      onClick={() => setShowAddLeadModal(true)}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      + Registrar nuevo
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-1">
                    {leads.map((lead) => {
                      const isSelected = selectedLead?.id === lead.id;
                      const hasAll = lead.status === "calificado";
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-indigo-50/40 border-indigo-600 border-l-4"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-700 uppercase text-xs">
                              {lead.name.substring(0, 2)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 text-xs block leading-tight">{lead.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{lead.phone}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${
                            hasAll ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {hasAll ? "Calificado" : "Pendiente"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Micro checklist preview */}
                {selectedLead && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                    <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold font-display text-slate-800 text-xs uppercase tracking-wider">
                          Embudo de Calificación WhatsApp
                        </h3>
                        <p className="text-[11px] text-slate-500">Detector automático de datos en tiempo real</p>
                      </div>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        {
                          [
                            selectedLead.criteria.operation,
                            selectedLead.criteria.location,
                            selectedLead.criteria.maxPrice,
                            selectedLead.criteria.initialCapital,
                            selectedLead.criteria.bedrooms
                          ].filter(Boolean).length
                        } / 5 calificados
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-150">
                        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                          {selectedLead.criteria.operation ? <CheckCircle className="w-4 h-4 text-indigo-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                          1. Tipo de operación
                        </span>
                        <span className="font-bold text-slate-800">
                          {selectedLead.criteria.operation ? (selectedLead.criteria.operation === "renta" ? "Renta" : "Compra / Venta") : "Pendiente"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-150">
                        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                          {selectedLead.criteria.location ? <CheckCircle className="w-4 h-4 text-indigo-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                          2. Ubicación / Zona
                        </span>
                        <span className="font-bold text-slate-800 max-w-[150px] truncate">
                          {selectedLead.criteria.location || "Pendiente"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-150">
                        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                          {selectedLead.criteria.maxPrice ? <CheckCircle className="w-4 h-4 text-indigo-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                          3. Presupuesto límite
                        </span>
                        <span className="font-bold text-slate-800">
                          {selectedLead.criteria.maxPrice ? `$${selectedLead.criteria.maxPrice.toLocaleString("es-MX")} MXN` : "Pendiente"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-150">
                        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                          {selectedLead.criteria.initialCapital ? <CheckCircle className="w-4 h-4 text-indigo-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                          4. Capital o Enganche
                        </span>
                        <span className="font-bold text-slate-800">
                          {selectedLead.criteria.initialCapital ? `$${selectedLead.criteria.initialCapital.toLocaleString("es-MX")} MXN` : "Pendiente"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-150">
                        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                          {selectedLead.criteria.bedrooms ? <CheckCircle className="w-4 h-4 text-indigo-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
                          5. Recámaras deseadas
                        </span>
                        <span className="font-bold text-slate-800">
                          {selectedLead.criteria.bedrooms ? `${selectedLead.criteria.bedrooms} recámaras` : "Pendiente"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab("leads")}
                      className="mt-2 w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-100 hover:border-indigo-300 py-2.5 rounded-xl bg-indigo-50/20 transition-all cursor-pointer"
                    >
                      Ver Análisis de Leads Completo &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "leads" && (
            <LeadDashboard
              leads={leads}
              selectedLead={selectedLead}
              onSelectLead={setSelectedLead}
              onResetAll={handleResetSimulator}
              properties={properties}
              onSelectProperty={(prop) => {
                setSelectedProperty(prop);
                setActiveTab("brokers");
              }}
              onAddNewSimulation={() => setShowAddLeadModal(true)}
            />
          )}

          {activeTab === "brokers" && (
            <BrokerCatalog
              properties={properties}
              onAddProperty={handleAddProperty}
              onDeleteProperty={handleDeleteProperty}
              selectedProperty={selectedProperty}
              onSelectProperty={setSelectedProperty}
            />
          )}

          {activeTab === "config" && config && (
            <ConfigPanel config={config} onUpdateConfig={handleUpdateConfig} />
          )}
        </div>

        {/* Real-Time Live Logs Terminal */}
        <div className="bg-slate-950 text-slate-300 rounded-2xl border border-slate-900 shadow-xl overflow-hidden mt-2">
          
          {/* Logs Header */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-850 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-xs font-mono uppercase tracking-wider text-slate-200">
                Simulador Webhook WhatsApp & Logs del Servidor
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-mono text-emerald-400">Escuchando eventos...</span>
            </div>
          </div>

          {/* Logs List Area */}
          <div className="p-4 font-mono text-xs max-h-40 overflow-y-auto space-y-2 flex flex-col-reverse h-36">
            {systemLogs.length > 0 ? (
              systemLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                  <span className={`font-extrabold uppercase shrink-0 select-none text-[10px] px-1.5 py-0.2 rounded border ${
                    log.type === "success" ? "bg-emerald-950 text-emerald-400 border-emerald-900" :
                    log.type === "gemini" ? "bg-indigo-950 text-indigo-400 border-indigo-900" :
                    log.type === "broker" ? "bg-cyan-950 text-cyan-400 border-cyan-900" :
                    "bg-slate-900 text-slate-400 border-slate-800"
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-slate-200 break-all">{log.text}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-center py-4">No hay eventos recientes en el webhook.</div>
            )}
          </div>
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200 py-4.5 text-center text-xs text-slate-400 font-medium">
        BrokerLink WhatsApp Real Estate Agent Hub • Desarrollado con React + Vite + Google Gemini 3.5
      </footer>

      {/* Add Lead Simulation Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-scaleUp">
            <h3 className="font-bold font-display text-slate-800 text-base mb-2">Simular Nuevo Prospecto</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registra un nuevo canal telefónico ficticio de WhatsApp para probar el embudo de respuestas automáticas de la IA.
            </p>
            
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Alejandro Gomez"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Número de Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: +52 55 5555 5555"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm cursor-pointer"
                >
                  Crear Simulador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
