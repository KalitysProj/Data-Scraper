import { ScrapingRequest, ScrapingResponse, CompanyData } from '../types/api';

// Configuration de l'API backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Lancer un scraping
  async startScraping(request: ScrapingRequest): Promise<ScrapingResponse> {
    return this.request<ScrapingResponse>('/scrape', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Récupérer les données
  async getData(filters?: any): Promise<CompanyData[]> {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.request<CompanyData[]>(`/companies${queryParams}`);
  }

  // Exporter en CSV
  async exportCsv(companyIds?: string[]): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyIds }),
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  // Supprimer des données
  async deleteCompanies(companyIds: string[]): Promise<void> {
    await this.request('/companies', {
      method: 'DELETE',
      body: JSON.stringify({ companyIds }),
    });
  }

  // Tester la connexion à la base de données
  async testDatabaseConnection(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/test-db');
  }
}

export const apiService = new ApiService();