// Configuration de l'API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token d'authentification (pour les tests)
let authToken: string | null = null;

// Interface pour les réponses API
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Interface pour les données d'entreprise
export interface CompanyData {
  id: string;
  denomination: string;
  siren: string;
  start_date: string;
  representatives: string[];
  legal_form: string;
  establishments: number;
  department: string;
  ape_code: string;
  address?: string;
  postal_code?: string;
  city?: string;
  status: string;
  scraped_at: string;
  created_at: string;
}

// Interface pour les statistiques
export interface StatsData {
  total: number;
  monthly: number;
  byDepartment: Array<{ department: string; count: number }>;
  byApeCode: Array<{ ape_code: string; count: number }>;
}

// Interface pour les tâches de scraping
export interface ScrapingJob {
  id: string;
  ape_code: string;
  department: string;
  siege_only: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  results_found: number;
  results_processed: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

class ApiService {
  private token: string | null = null;
  private backendAvailable: boolean = false;

  constructor() {
    // Récupérer le token depuis localStorage si disponible
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async checkBackendAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Vérifier la disponibilité du backend
    const isAvailable = await this.checkBackendAvailability();
    if (!isAvailable) {
      throw new Error('Mode démonstration - Backend non disponible');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers as Record<string, string>,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur API: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Mode démonstration')) {
          throw error;
        }
        throw error;
      }
      throw new Error('Erreur de connexion au serveur');
    }
  }

  // Scraping
  async startScraping(config: { apeCode: string; department: string; siegeOnly: boolean }): Promise<{ jobId: string }> {
    const response = await this.request<ApiResponse<{ jobId: string }>>('/scraping/start', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    
    if (response.success && response.data) {
      return { jobId: response.data.jobId };
    }

    throw new Error(response.error || 'Erreur lors du démarrage du scraping');
  }

  async stopScraping(jobId: string): Promise<void> {
    const response = await this.request<ApiResponse>(`/scraping/stop/${jobId}`, {
      method: 'POST',
    });

    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de l\'arrêt du scraping');
    }
  }

  async getScrapingStatus(jobId: string): Promise<ScrapingJob> {
    const response = await this.request<ApiResponse<{ job: ScrapingJob }>>(`/scraping/status/${jobId}`);
    
    if (response.success && response.data) {
      return response.data.job;
    }

    throw new Error(response.error || 'Erreur lors de la récupération du statut');
  }

  async getScrapingJobs(limit = 10, offset = 0): Promise<ScrapingJob[]> {
    const response = await this.request<ApiResponse<{ jobs: ScrapingJob[] }>>(`/scraping/jobs?limit=${limit}&offset=${offset}`);
    
    if (response.success && response.data) {
      return response.data.jobs;
    }

    return [];
  }

  // Données des entreprises
  async getCompanies(params: {
    search?: string;
    department?: string;
    apeCode?: string;
    legalForm?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{ companies: CompanyData[]; total: number; pagination: any }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await this.request<ApiResponse<{ companies: CompanyData[]; total: number; pagination: any }>>(`/companies?${queryParams}`);
    
    if (response.success && response.data) {
      return response.data;
    }

    return { companies: [], total: 0, pagination: {} };
  }

  async getCompanyById(id: string): Promise<CompanyData> {
    const response = await this.request<ApiResponse<{ company: CompanyData }>>(`/companies/${id}`);
    
    if (response.success && response.data) {
      return response.data.company;
    }

    throw new Error(response.error || 'Entreprise non trouvée');
  }

  async deleteCompanies(companyIds: string[]): Promise<void> {
    const response = await this.request<ApiResponse>('/companies', {
      method: 'DELETE',
      body: JSON.stringify({ companyIds }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la suppression');
    }
  }

  async exportToCsv(companyIds?: string[]): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/companies/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
      body: JSON.stringify({ companyIds: companyIds || [] }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'export');
    }

    return response.blob();
  }

  async getStats(): Promise<StatsData> {
    const response = await this.request<ApiResponse<{ stats: StatsData }>>('/companies/stats');
    
    if (response.success && response.data) {
      return response.data.stats;
    }

    return { total: 0, monthly: 0, byDepartment: [], byApeCode: [] };
  }

  // Test de connexion
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const isAvailable = await this.checkBackendAvailability();
      if (!isAvailable) {
        return { success: false, message: 'Backend non disponible' };
      }
      
      const response = await this.request<{ success: boolean; message: string }>('/health');
      return { success: true, message: 'Connexion réussie' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur de connexion' 
      };
    }
  }

  // Authentification (pour les tests)
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
}

export const apiService = new ApiService();