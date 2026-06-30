import React from "react";
import { User, Phone, CheckCircle2, Circle, AlertCircle, RefreshCw, Layers, Calendar, Landmark, MapPin, DollarSign, Home, Check } from "lucide-react";
import { Lead } from "../types";
import { Property } from "../data/properties";

interface LeadDashboardProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onResetAll: () => void;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onAddNewSimulation: () => void;
}

export default function LeadDashboard({
  leads,
  selectedLead,
  onSelectLead,
  onResetAll,
  properties,
  onSelectProperty,
  onAddNewSimulation,
}: LeadDashboardProps) {

  // Function to calculate qualification metrics
  const getQualificationStatus = (lead: Lead) => {
    const { operation, location, maxPrice, initialCapital, bedrooms } = lead.criteria;
    const items = [
      { key: "operation", name: "Operación (Comprar/Rentar)", val: operation },
      { key: "location", name: "Ubicación (Zona/Colonia)", val: location },
      { key: "maxPrice", name: "Límite de Pago (Presupuesto)", val: maxPrice },
      { key: "initialCapital", name: "Enganche o Capital Inicial", val: initialCapital },
      { key: "bedrooms", name: "Características (Recámaras/Amenities)", val: bedrooms }
    ];
    
    const qualifiedCount = items.filter(item => item.val !== null && item.val !== undefined).length;
    return {
      percentage: Math.round((qualifiedCount / 5) * 100),
      count: qualifiedCount,
      items
    };
  };

  // Function to filter matches for the selected lead
  const getMatchedPropertiesForLead = (lead: Lead): Property[] => {
    const { operation, location, maxPrice, initialCapital, bedrooms } = lead.criteria;
    
    return properties.filter((prop) => {
      if (operation && operation !== prop.operation) return false;
      if (maxPrice && prop.price > maxPrice) return false;
      
      if (location) {
        const criteriaLoc = location.toLowerCase();
        const propLoc = prop.location.toLowerCase();
        const propTitle = prop.title.toLowerCase();
        
        const words = criteriaLoc.replace(",", "").split(" ");
        const hasWordMatch = words.some(word => word.length > 3 && (propLoc.includes(word) || propTitle.includes(word)));
        
        if (!propLoc.includes(criteriaLoc) && !criteriaLoc.includes(propLoc) && !hasWordMatch) {
          return false;
        }
      }
      
      if (bedrooms && prop.bedrooms < bedrooms) return false;
      
      if (initialCapital) {
        if (prop.operation === "venta") {
          if (initialCapital < prop.price * 0.05) return false;
        } else {
          if (initialCapital < prop.price * 1.5) return false;
        }
      }
      
      return true;
    });
  };

  const selectedLeadQual = selectedLead ? getQualificationStatus(selectedLead) : null;
  const matchedProps = selectedLead ? getMatchedPropertiesForLead(selectedLead) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left panel: List of Leads (5 columns) */}
      <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl p-5 border border-slate-200 shadow-sm h-[650px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Prospectos Activos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Embudos calificados por WhatsApp</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetAll}
              title="Restablecer simulación"
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onAddNewSimulation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
            >
              + Nuevo Cliente
            </button>
          </div>
        </div>

        {/* Lead List Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {leads.map((lead) => {
            const metrics = getQualificationStatus(lead);
            const isSelected = selectedLead?.id === lead.id;
            
            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-50/40 border-indigo-600 border-l-4"
                    : "bg-slate-50 hover:bg-slate-100/70 border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white uppercase ${
                      lead.status === "calificado" ? "bg-indigo-600" : "bg-slate-400"
                    }`}>
                      {lead.name.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{lead.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5" /> {lead.phone}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                    lead.status === "calificado"
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-250"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {lead.status === "calificado" ? "Calificado" : "Conversando"}
                  </span>
                </div>

                {/* Lead Progress metrics */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1 text-[10px]">
                      <span className="text-slate-500 font-medium">Progreso Perfilado:</span>
                      <span className="font-extrabold text-slate-700">{metrics.count}/5 campos</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${metrics.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium block">Último contacto</span>
                    <span className="text-[11px] text-slate-600 font-semibold">
                      {new Date(lead.lastActivity).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: Detail, Checklist, dynamic matches & Code Debug payload (7 columns) */}
      <div className="lg:col-span-7 flex flex-col gap-6 h-[650px] overflow-y-auto pr-1">
        {selectedLead && selectedLeadQual ? (
          <>
            {/* Lead Qualification Details Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold font-display text-slate-800 text-base">
                    Calificación de {selectedLead.name}
                  </h3>
                  <p className="text-xs text-slate-500">Parámetros requeridos para conectar con API de brokers</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-extrabold text-indigo-600">{selectedLeadQual.count} de 5</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Calificados</span>
                </div>
              </div>

              {/* 5-Item Checklist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedLeadQual.items.map((item, idx) => {
                  const hasValue = item.val !== null && item.val !== undefined;
                  return (
                    <div
                      key={item.key}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        hasValue ? "bg-indigo-50/20 border-indigo-100" : "bg-slate-50/50 border-slate-200/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${hasValue ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-400"}`}>
                          {item.key === "operation" && <Landmark className="w-4 h-4" />}
                          {item.key === "location" && <MapPin className="w-4 h-4" />}
                          {item.key === "maxPrice" && <DollarSign className="w-4 h-4" />}
                          {item.key === "initialCapital" && <Landmark className="w-4 h-4" />}
                          {item.key === "bedrooms" && <Home className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none mb-0.5">{item.name}</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {hasValue ? (
                              item.key === "maxPrice" || item.key === "initialCapital" ? (
                                `$${(item.val as number).toLocaleString("es-MX")} MXN`
                              ) : item.key === "operation" ? (
                                (item.val as string).toUpperCase()
                              ) : item.key === "bedrooms" ? (
                                `${item.val} recámaras`
                              ) : (
                                (item.val as string)
                              )
                            ) : (
                              "Pendiente de calificar"
                            )}
                          </span>
                        </div>
                      </div>
                      <div>
                        {hasValue ? (
                          <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 stroke-[1.5]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Extras/Features chips */}
              {selectedLead.criteria.features && selectedLead.criteria.features.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1.5">Otras características detectadas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLead.criteria.features.map((feat, i) => (
                      <span key={i} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] text-slate-600 font-medium capitalize">
                        ✨ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Matching Properties section */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="font-bold font-display text-slate-800 text-sm flex items-center gap-2">
                  <Home className="w-4.5 h-4.5 text-indigo-600" /> Propiedades Compatibles ({matchedProps.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Búsqueda automática realizada en la API de Brokers asociados</p>
              </div>

              {matchedProps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedProps.map((prop) => (
                    <div
                      key={prop.id}
                      onClick={() => onSelectProperty(prop)}
                      className="group border border-slate-200 hover:border-indigo-600 rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer bg-slate-50/50 flex flex-col justify-between"
                    >
                      <div className="relative h-28 bg-slate-200">
                        <img
                          src={prop.imageUrl}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow-xs ${
                          prop.operation === "renta" ? "bg-indigo-600 text-white" : "bg-emerald-500 text-white"
                        }`}>
                          {prop.operation}
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">
                          {prop.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mb-2">📍 {prop.location}</p>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-xs font-extrabold text-indigo-600">
                            ${prop.price.toLocaleString("es-MX")}
                            <span className="text-[10px] font-normal text-slate-500">
                              {prop.operation === "renta" ? "/mes" : ""}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {prop.bedrooms} recámaras
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    Aún no hay propiedades que coincidan perfectamente con los criterios extraídos.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Continúa la conversación por WhatsApp para calificar más campos y afinar la búsqueda.
                  </p>
                </div>
              )}
            </div>

            {/* API Code Payload Panel */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs text-slate-200 font-mono flex items-center gap-1.5 uppercase">
                    🚀 Payload de API de Brokers
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Estructura JSON lista para enviarse al servicio del Broker</p>
                </div>
                <span className="bg-slate-800 text-[10px] text-indigo-400 font-semibold font-mono px-2 py-0.5 rounded border border-slate-700 uppercase">
                  POST /v2/leads/sync
                </span>
              </div>
              <pre className="bg-slate-950 p-3.5 rounded-xl text-[11px] text-indigo-300 font-mono overflow-x-auto border border-slate-800 select-all leading-relaxed max-h-48 overflow-y-auto">
                {JSON.stringify({
                  sync_timestamp: new Date().toISOString(),
                  lead_channel: "whatsapp",
                  lead_contact: {
                    fullName: selectedLead.name,
                    telephone: selectedLead.phone,
                    status: selectedLead.status
                  },
                  qualification_parameters: {
                    operation_type: selectedLead.criteria.operation || "UNKNOWN",
                    target_location: selectedLead.criteria.location || "UNKNOWN",
                    max_budget_limit: selectedLead.criteria.maxPrice || 0,
                    available_capital_downpayment: selectedLead.criteria.initialCapital || 0,
                    required_bedrooms_count: selectedLead.criteria.bedrooms || 0,
                    tags_amenities: selectedLead.criteria.features || []
                  },
                  broker_match_count: matchedProps.length,
                  compatible_property_ids: matchedProps.map(p => p.id)
                }, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl p-8 border border-slate-200 text-slate-500 shadow-sm">
            <User className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-base font-semibold text-slate-700">Selecciona un prospecto</h3>
            <p className="text-xs text-slate-500 text-center max-w-xs mt-1">
              Haz clic en uno de los prospectos de la lista para ver su reporte detallado de calificación e inmuebles recomendados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
