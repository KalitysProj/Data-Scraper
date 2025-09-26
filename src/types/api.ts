// Types pour l'API backend
export interface ScrapingRequest {
  apeCode: string;
  department: string;
  siegeOnly: boolean;
}

export interface ScrapingResponse {
  success: boolean;
  message: string;
  data?: CompanyData[];
  error?: string;
}

export interface CompanyData {
  id: string;
  denomination: string;
  siren: string;
  startDate: string;
  representatives: string[];
  legalForm: string;
  establishments: number;
  department: string;
  apeCode: string;
  scrapedAt: string;
}

export interface DatabaseConfig {
  host: string;
  database: string;
  username: string;
  password: string;
  port: number;
}

export interface ApiEndpoints {
  scrape: string;
  getData: string;
  exportCsv: string;
  deleteData: string;
}