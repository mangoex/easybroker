export interface Property {
  id: string;
  title: string;
  type: "casa" | "departamento";
  operation: "renta" | "venta";
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  size: number; // m²
  features: string[];
  imageUrl: string;
  brokerName: string;
  requirements?: string;
}

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: "prop-1",
    title: "Departamento Moderno en Roma Norte",
    type: "departamento",
    operation: "renta",
    price: 24000,
    location: "Roma Norte, CDMX",
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    size: 85,
    features: ["Balcón", "Seguridad 24/7", "Roof Garden Común", "Pet Friendly"],
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
    brokerName: "Inmobiliaria Century Alfa",
    requirements: "1 mes de depósito, 1 mes de renta anticipada y póliza jurídica."
  },
  {
    id: "prop-2",
    title: "Penthouse de Lujo con Terraza en Polanco",
    type: "departamento",
    operation: "venta",
    price: 12500000,
    location: "Polanco, CDMX",
    bedrooms: 3,
    bathrooms: 3.5,
    parking: 2,
    size: 190,
    features: ["Terraza Privada", "Elevador Directo", "Acabados de Mármol", "Bodega"],
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
    brokerName: "Prime Real Estate",
    requirements: "Enganche mínimo del 10% ($1,250,000 MXN) y pre-aprobación de crédito bancario."
  },
  {
    id: "prop-3",
    title: "Casa Familiar con Amplio Jardín en Juriquilla",
    type: "casa",
    operation: "venta",
    price: 4800000,
    location: "Juriquilla, Querétaro",
    bedrooms: 3,
    bathrooms: 2.5,
    parking: 3,
    size: 240,
    features: ["Jardín de 80m²", "Estudio", "Cocina Integral", "Fraccionamiento Cerrado"],
    imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80",
    brokerName: "Brokers Asociados del Bajío",
    requirements: "Enganche sugerido del 20% ($960,000 MXN). Acepta créditos Infonavit y bancarios."
  },
  {
    id: "prop-4",
    title: "Loft Tipo Estudio Amueblado en Condesa",
    type: "departamento",
    operation: "renta",
    price: 185000,
    location: "Condesa, CDMX",
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    size: 55,
    features: ["Amueblado", "Estilo Industrial", "Luz Natural", "Cerca de Parque México"],
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
    brokerName: "Inmuebles Condesa",
    requirements: "1 mes de depósito, aval con propiedad en CDMX u opción de obligado solidario."
  },
  {
    id: "prop-5",
    title: "Casa Residencial en San Pedro Garza García",
    type: "casa",
    operation: "venta",
    price: 18900000,
    location: "Valle Oriente, San Pedro Garza García, NL",
    bedrooms: 4,
    bathrooms: 4.5,
    parking: 4,
    size: 450,
    features: ["Alberca", "Paneles Solares", "Vistas a la Huasteca", "Cuarto de Servicio"],
    imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80",
    brokerName: "Regio Brokers",
    requirements: "Enganche mínimo de 15% ($2,835,000 MXN) mediante transferencia bancaria."
  },
  {
    id: "prop-6",
    title: "Departamento Confortable Cerca de Chapultepec",
    type: "departamento",
    operation: "renta",
    price: 15000,
    location: "Guadalajara Centro, Jal",
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    size: 75,
    features: ["Vigilancia", "Estacionamiento Techado", "Excelente Ubicación", "Cocina Equipada"],
    imageUrl: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80",
    brokerName: "Tapatía Bienes Raíces",
    requirements: "Mes de depósito, mes corriente y fiador con propiedad libre de gravamen en Jalisco."
  },
  {
    id: "prop-7",
    title: "Casa de Campo Estilo Rústico en San Miguel",
    type: "casa",
    operation: "venta",
    price: 6200000,
    location: "San Miguel de Allende, Gto",
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    size: 280,
    features: ["Chimenea", "Estilo Colonial", "Bóveda Catalana", "Terraza con Vista"],
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    brokerName: "Bajío Luxury Homes",
    requirements: "Enganche del 20% ($1,240,000 MXN). Trato directo ante Notario Público."
  },
  {
    id: "prop-8",
    title: "Departamento Minimalista en Santa Fe",
    type: "departamento",
    operation: "renta",
    price: 28000,
    location: "Santa Fe, CDMX",
    bedrooms: 1,
    bathrooms: 1.5,
    parking: 2,
    size: 90,
    features: ["Gimnasio", "Alberca Techada", "Piso Alto", "Bodega Privada"],
    imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80",
    brokerName: "Inmobiliaria Century Alfa",
    requirements: "Mes de renta, mes de depósito, póliza jurídica obligatoria."
  },
  {
    id: "prop-9",
    title: "Casa Nueva en Privada con Amenidades",
    type: "casa",
    operation: "venta",
    price: 3200000,
    location: "Zibatá, Querétaro",
    bedrooms: 3,
    bathrooms: 2.5,
    parking: 2,
    size: 165,
    features: ["Casa Club", "Juegos Infantiles", "Asador", "Áreas Verdes"],
    imageUrl: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=600&q=80",
    brokerName: "Brokers Asociados del Bajío",
    requirements: "Enganche desde 10% ($320,000 MXN). Compatible con créditos Cofinavit."
  }
];
