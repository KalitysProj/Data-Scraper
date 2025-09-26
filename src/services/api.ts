// Configuration de l'API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Vérifier si le backend est disponible
let isBackendAvailable = false;

// Test de connexion au démarrage
const testBackendConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    isBackendAvailable = response.ok;
  } catch (error) {
    isBackendAvailable = false;
  }
};

// Tester la connexion au démarrage
testBackendConnection();

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
  private isBackendAvailable: boolean = false;

  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.checkBackendAvailability();
  }

  private async checkBackendAvailability(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      this.isBackendAvailable = response.ok;
    } catch (error) {
      this.isBackendAvailable = false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Check if backend is available first
    if (!this.isBackendAvailable) {
      throw new Error('Backend non disponible. Veuillez démarrer le serveur backend.');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur API: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur de connexion au serveur');
    }
  }

  // Authentification
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.request<ApiResponse<{ token: string; user: any }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
      return response.data;
    }

    throw new Error(response.error || 'Erreur de connexion');
  }

  async register(userData: { email: string; password: string; firstName?: string; lastName?: string }) {
    const response = await this.request<ApiResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
      return response.data;
    }

    throw new Error(response.error || 'Erreur lors de l\'inscription');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Scraping
  async startScraping(config: { apeCode: string; department: string; siegeOnly: boolean }): Promise<{ jobId: string }> {
    const response = await this.request<ApiResponse<{ jobId: string }>>('/scraping/start', {
      method: 'POST',
      body: JSON.stringify(config),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Erreur lors du lancement du scraping');
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
        'Authorization': this.token ? `Bearer ${this.token}` : '',
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
      const response = await this.request<{ success: boolean; message: string }>('/test-db');
      return response;
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur de connexion' 
      };
    }
  }
}

export const apiService = new ApiService();