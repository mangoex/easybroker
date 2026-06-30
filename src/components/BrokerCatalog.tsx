import React, { useState } from "react";
import { Home, Plus, Trash2, Search, Filter, Sparkles, Building, MapPin, DollarSign, Eye, EyeOff } from "lucide-react";
import { Property } from "../data/properties";

interface BrokerCatalogProps {
  properties: Property[];
  onAddProperty: (property: Omit<Property, "id">) => void;
  onDeleteProperty: (id: string) => void;
  selectedProperty: Property | null;
  onSelectProperty: (property: Property | null) => void;
}

export default function BrokerCatalog({
  properties,
  onAddProperty,
  onDeleteProperty,
  selectedProperty,
  onSelectProperty,
}: BrokerCatalogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOperation, setFilterOperation] = useState<"todos" | "venta" | "renta">("todos");
  const [filterType, setFilterType] = useState<"todos" | "casa" | "departamento">("todos");

  // New property form state
  const [newProp, setNewProp] = useState({
    title: "",
    type: "departamento" as "casa" | "departamento",
    operation: "renta" as "renta" | "venta",
    price: "",
    location: "",
    bedrooms: "2",
    bathrooms: "2",
    parking: "1",
    size: "80",
    features: "",
    imageUrl: "",
    brokerName: "Broker API Auto",
    requirements: ""
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.title || !newProp.price || !newProp.location) {
      alert("Por favor completa los campos principales: Título, Precio y Ubicación.");
      return;
    }

    onAddProperty({
      title: newProp.title,
      type: newProp.type,
      operation: newProp.operation,
      price: parseFloat(newProp.price),
      location: newProp.location,
      bedrooms: parseInt(newProp.bedrooms, 10),
      bathrooms: parseFloat(newProp.bathrooms),
      parking: parseInt(newProp.parking, 10),
      size: parseInt(newProp.size, 10),
      features: newProp.features ? newProp.features.split(",").map(f => f.trim()) : ["Acabados de lujo"],
      imageUrl: newProp.imageUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80",
      brokerName: newProp.brokerName,
      requirements: newProp.requirements || undefined
    });

    // Reset and close
    setShowAddForm(false);
    setNewProp({
      title: "",
      type: "departamento",
      operation: "renta",
      price: "",
      location: "",
      bedrooms: "2",
      bathrooms: "2",
      parking: "1",
      size: "80",
      features: "",
      imageUrl: "",
      brokerName: "Broker API Auto",
      requirements: ""
    });
  };

  // Filtered properties
  const filteredProperties = properties.filter((prop) => {
    const matchesSearch =
      prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.brokerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOperation =
      filterOperation === "todos" || prop.operation === filterOperation;

    const matchesType = filterType === "todos" || prop.type === filterType;

    return matchesSearch && matchesOperation && matchesType;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* List of current properties (8 columns) */}
      <div className={`${selectedProperty ? "xl:col-span-8" : "xl:col-span-12"} flex flex-col bg-white rounded-2xl p-5 border border-slate-200 shadow-sm min-h-[600px]`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" /> Inventario Inmobiliario (API de Brokers)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Base de datos de las propiedades registradas en los brokers asociados</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {showAddForm ? "Cerrar Formulario" : "Agregar Propiedad"}
          </button>
        </div>

        {/* Property Adder Form Modal-like collapse */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
            <h4 className="col-span-1 md:col-span-3 font-bold text-xs text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5">
              Registrar Nueva Propiedad en API del Broker
            </h4>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Título de Propiedad *</label>
              <input
                type="text"
                required
                placeholder="Ej: Loft de Lujo en Roma"
                value={newProp.title}
                onChange={e => setNewProp({...newProp, title: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ubicación y Zona *</label>
              <input
                type="text"
                required
                placeholder="Ej: Roma Norte, CDMX"
                value={newProp.location}
                onChange={e => setNewProp({...newProp, location: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Precio ($ MXN) *</label>
              <input
                type="number"
                required
                placeholder="Ej: 18000 o 3500000"
                value={newProp.price}
                onChange={e => setNewProp({...newProp, price: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Operación</label>
              <select
                value={newProp.operation}
                onChange={e => setNewProp({...newProp, operation: e.target.value as "renta" | "venta"})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="renta">Renta</option>
                <option value="venta">Venta</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo de Inmueble</label>
              <select
                value={newProp.type}
                onChange={e => setNewProp({...newProp, type: e.target.value as "casa" | "departamento"})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="departamento">Departamento</option>
                <option value="casa">Casa</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Recámaras</label>
              <input
                type="number"
                value={newProp.bedrooms}
                onChange={e => setNewProp({...newProp, bedrooms: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Baños</label>
              <input
                type="number"
                step="0.5"
                value={newProp.bathrooms}
                onChange={e => setNewProp({...newProp, bathrooms: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Estacionamiento</label>
              <input
                type="number"
                value={newProp.parking}
                onChange={e => setNewProp({...newProp, parking: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Área (m²)</label>
              <input
                type="number"
                value={newProp.size}
                onChange={e => setNewProp({...newProp, size: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="col-span-1 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Características / Amenidades (Separados por coma)</label>
              <input
                type="text"
                placeholder="Ej: Alberca, Vigilancia, Roof garden, Balcón, Mascotas permitidas"
                value={newProp.features}
                onChange={e => setNewProp({...newProp, features: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="col-span-1 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">URL de Imagen (Unsplash, etc.)</label>
              <input
                type="url"
                placeholder="Ej: https://images.unsplash.com/photo-..."
                value={newProp.imageUrl}
                onChange={e => setNewProp({...newProp, imageUrl: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="col-span-1 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Requisitos de entrada</label>
              <input
                type="text"
                placeholder="Ej: 1 mes de depósito, póliza jurídica, enganche mínimo"
                value={newProp.requirements}
                onChange={e => setNewProp({...newProp, requirements: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="col-span-1 md:col-span-3 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                Agregar a Base de Datos
              </button>
            </div>
          </form>
        )}

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por zona, broker..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Op:</span>
            <select
              value={filterOperation}
              onChange={e => setFilterOperation(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="todos">Todos</option>
              <option value="renta">Renta</option>
              <option value="venta">Venta</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Tipo:</span>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
            >
              <option value="todos">Todos</option>
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
            </select>
          </div>

          <div className="text-right flex items-center justify-end text-[11px] text-slate-400 font-medium">
            Mostrando {filteredProperties.length} de {properties.length} inmuebles
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto flex-1 max-h-[420px] pr-1">
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className={`border rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all bg-slate-50/50 flex flex-col justify-between ${
                selectedProperty?.id === prop.id ? "ring-2 ring-indigo-600 border-transparent" : "border-slate-200"
              }`}
            >
              <div className="relative h-32 bg-slate-200">
                <img
                  src={prop.imageUrl}
                  alt={prop.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className={`absolute top-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase text-white shadow-xs ${
                  prop.operation === "renta" ? "bg-indigo-600" : "bg-emerald-600"
                }`}>
                  {prop.operation}
                </span>
                <span className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-medium">
                  {prop.type.toUpperCase()}
                </span>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 line-clamp-1 mb-1">{prop.title}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3 text-indigo-600" /> {prop.location}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Broker Proveedor:</p>
                  <span className="text-[11px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium inline-block mb-3">
                    🏢 {prop.brokerName}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-indigo-600 flex items-center">
                    <DollarSign className="w-3.5 h-3.5" />
                    {prop.price.toLocaleString("es-MX")}
                    <span className="text-[10px] font-normal text-slate-500">
                      {prop.operation === "renta" ? "/mes" : ""}
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectProperty(prop)}
                      title="Ver detalles completos de Broker"
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteProperty(prop.id)}
                      title="Quitar de la API del broker"
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Property Details Side Panel (4 columns) */}
      {selectedProperty && (
        <div className="xl:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4 animate-slideIn max-h-[600px] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold font-display text-slate-800 text-sm">Ficha del Inmueble</h3>
            <button
              onClick={() => onSelectProperty(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Cerrar
            </button>
          </div>

          <div className="rounded-xl overflow-hidden h-40 bg-slate-100 border border-slate-200">
            <img
              src={selectedProperty.imageUrl}
              alt={selectedProperty.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase text-white ${
                selectedProperty.operation === "renta" ? "bg-cyan-500" : "bg-emerald-500"
              }`}>
                {selectedProperty.operation}
              </span>
              <span className="bg-slate-100 text-[10px] text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
                {selectedProperty.type}
              </span>
            </div>
            <h4 className="font-bold text-slate-800 text-sm">{selectedProperty.title}</h4>
            <p className="text-xs text-slate-500 mt-1">📍 {selectedProperty.location}</p>
          </div>

          <div className="border-y border-slate-100 py-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Precio total</span>
              <span className="font-extrabold text-indigo-600 text-sm">${selectedProperty.price.toLocaleString("es-MX")} MXN</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Área construida</span>
              <span className="font-bold text-slate-700">{selectedProperty.size} m²</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Distribución</span>
              <span className="font-bold text-slate-700">{selectedProperty.bedrooms} rec • {selectedProperty.bathrooms} ba</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Estacionamientos</span>
              <span className="font-bold text-slate-700">{selectedProperty.parking} cajones</span>
            </div>
          </div>

          {selectedProperty.requirements && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Requisitos de entrada / Broker</span>
              <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-xs text-amber-800 leading-relaxed font-medium">
                🔑 {selectedProperty.requirements}
              </div>
            </div>
          )}

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Amenidades & Características</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedProperty.features.map((feat, i) => (
                <span
                  key={i}
                  className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-[10px] text-slate-600 font-medium"
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 block mb-1">ID Propiedad: {selectedProperty.id}</span>
            <span className="text-xs text-slate-600 font-bold">Ofrecido por: {selectedProperty.brokerName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
