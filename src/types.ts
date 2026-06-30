import { Property } from "./data/properties";

export interface Criteria {
  operation?: "venta" | "renta" | null;
  location?: string | null;
  maxPrice?: number | null;
  initialCapital?: number | null; // Down payment for venta, or initial cash for renta
  bedrooms?: number | null;
  features?: string[] | null;
}

export interface Message {
  id: string;
  sender: "user" | "bot" | "system";
  text: string;
  timestamp: string;
  matchedProperties?: string[]; // IDs of properties that matched at this turn
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: "conversando" | "calificado" | "no_interesado";
  criteria: Criteria;
  lastActivity: string;
  messages: Message[];
}

export interface BotConfig {
  whatsappNumber: string;
  whatsappToken: string;
  webhookUrl: string;
  brokerApiUrl: string;
  brokerApiKey?: string;
  isAutoReplyEnabled: boolean;
}
