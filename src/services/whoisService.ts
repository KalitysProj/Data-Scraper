import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../lib/supabase';

type DomainWhois = Database['public']['Tables']['domain_whois']['Row'];
type DomainWhoisInsert = Database['public']['Tables']['domain_whois']['Insert'];

// Configuration centralisée pour optimiser la maintenance
const WHOIS_CONFIG = {
  CACHE: {
    TTL: 24 * 60 * 60 * 1000, // 24 heures
    MAX_SIZE: 100
  },
  TIMEOUTS: {
    WHOIS_LOOKUP: 10000,
    DNS_LOOKUP: 5000
  },
  SCORE_WEIGHTS: {
    EXPIRATION_SOON: 30,
    NO_PRIVACY_PROTECTION: 10,
    SUSPICIOUS_REGISTRAR: 20,
    RECENT_CHANGES: 15,
    NO_AUTO_RENEWAL: 10
  }
} as const;

export interface WhoisAnalysisDetailed {
  id: string;
  websiteId: string;
  domain: string;
  registrar: string;
  registrarUrl?: string;
  registrarIanaId?: string;
  registrarAbuseContactEmail?: string;
  registrarAbuseContactPhone?: string;
  ownerName?: string;
  ownerOrganization?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerAddress?: any;
  adminContact?: any;
  techContact?: any;
  billingContact?: any;
  creationDate: Date;
  expirationDate: Date;
  lastUpdated: Date;
  nameServers: string[];
  status: string[];
  dnssecEnabled: boolean;
  privacyProtection: boolean;
  autoRenewal: boolean;
  domainLock: boolean;
  daysUntilExpiration: number;
  domainAge: number;
  securityScore: number;
  trustScore: number;
  issues: string[];
  recommendations: string[];
  analyzedAt: Date;
}

class WhoisService {
  private cache = new Map<string, { data: WhoisAnalysisDetailed; timestamp: number }>();

  async analyzeWhoisDetailed(
    domain: string,
    websiteId: string,
    userId: string
  ): Promise<WhoisAnalysisDetailed> {
    console.log('🔍 Analyse WHOIS détaillée pour:', domain);

    // Vérifier le cache
    const cached = this.getCached(domain);
    if (cached) {
      console.log('✅ WHOIS trouvé en cache');
      return cached;
    }

    try {
      // Simuler l'analyse WHOIS (en production, utiliser une API WHOIS réelle)
      const whoisData = await this.performWhoisLookup(domain);
      
      // Calculer les scores
      const securityScore = this.calculateSecurityScore(whoisData);
      const trustScore = this.calculateTrustScore(whoisData);
      
      // Générer les issues et recommandations
      const issues = this.generateIssues(whoisData);
      const recommendations = this.generateRecommendations(whoisData);

      // Créer l'ID pour l'analyse
      const analysisId = `whois-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Sauvegarder en base seulement si Supabase est configuré
      if (isSupabaseConfigured && supabase !== null) {
        try {
          // Préparer les données pour la base
          const whoisResultData: DomainWhoisInsert = {
            website_id: websiteId,
            domain,
            registrar: whoisData.registrar,
            registrar_url: whoisData.registrarUrl,
            registrar_iana_id: whoisData.registrarIanaId,
            registrar_abuse_contact_email: whoisData.registrarAbuseContactEmail,
            registrar_abuse_contact_phone: whoisData.registrarAbuseContactPhone,
            owner_name: whoisData.ownerName,
            owner_organization: whoisData.ownerOrganization,
            owner_email: whoisData.ownerEmail,
            owner_phone: whoisData.ownerPhone,
            owner_address: whoisData.ownerAddress,
            admin_contact: whoisData.adminContact,
            tech_contact: whoisData.techContact,
            billing_contact: whoisData.billingContact,
            creation_date: whoisData.creationDate.toISOString(),
            expiration_date: whoisData.expirationDate.toISOString(),
            last_updated: whoisData.lastUpdated.toISOString(),
            name_servers: whoisData.nameServers,
            status: whoisData.status,
            dnssec_enabled: whoisData.dnssecEnabled,
            privacy_protection: whoisData.privacyProtection,
            auto_renewal: whoisData.autoRenewal,
            domain_lock: whoisData.domainLock,
            days_until_expiration: whoisData.daysUntilExpiration,
            domain_age: whoisData.domainAge,
            security_score: securityScore,
            trust_score: trustScore,
            issues,
            recommendations
          };

          // Sauvegarder en base
          const { data: savedResult, error } = await supabase
            .from('domain_whois')
            .upsert(whoisResultData, { onConflict: 'website_id' })
            .select()
            .single();

          if (error) {
            console.warn('⚠️ Erreur sauvegarde WHOIS (mode dégradé):', error);
          } else {
            console.log('✅ Analyse WHOIS sauvegardée:', savedResult.id);
          }
        } catch (dbError) {
          console.warn('⚠️ Erreur base de données WHOIS (mode dégradé):', dbError);
        }
      } else {
        console.log('ℹ️ Mode hors ligne - WHOIS non sauvegardé en base');
      }

      // Créer l'analyse complète
      const detailedAnalysis: WhoisAnalysisDetailed = {
        id: analysisId,
        websiteId,
        domain,
        registrar: whoisData.registrar,
        registrarUrl: whoisData.registrarUrl,
        registrarIanaId: whoisData.registrarIanaId,
        registrarAbuseContactEmail: whoisData.registrarAbuseContactEmail,
        registrarAbuseContactPhone: whoisData.registrarAbuseContactPhone,
        ownerName: whoisData.ownerName,
        ownerOrganization: whoisData.ownerOrganization,
        ownerEmail: whoisData.ownerEmail,
        ownerPhone: whoisData.ownerPhone,
        ownerAddress: whoisData.ownerAddress,
        adminContact: whoisData.adminContact,
        techContact: whoisData.techContact,
        billingContact: whoisData.billingContact,
        creationDate: whoisData.creationDate,
        expirationDate: whoisData.expirationDate,
        lastUpdated: whoisData.lastUpdated,
        nameServers: whoisData.nameServers,
        status: whoisData.status,
        dnssecEnabled: whoisData.dnssecEnabled,
        privacyProtection: whoisData.privacyProtection,
        autoRenewal: whoisData.autoRenewal,
        domainLock: whoisData.domainLock,
        daysUntilExpiration: whoisData.daysUntilExpiration,
        domainAge: whoisData.domainAge,
        securityScore,
        trustScore,
        issues,
        recommendations,
        analyzedAt: new Date()
      };

      // Mettre en cache
      this.setCache(domain, detailedAnalysis);
      
      console.log('✅ Analyse WHOIS terminée:', analysisId);
      return detailedAnalysis;

    } catch (error) {
      console.error('❌ Erreur analyse WHOIS:', error);
      
      // En cas d'erreur, retourner des données par défaut plutôt que de faire échouer l'analyse
      const fallbackAnalysis: WhoisAnalysisDetailed = {
        id: `whois-fallback-${Date.now()}`,
        websiteId,
        domain,
        registrar: 'Inconnu',
        creationDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
        lastUpdated: new Date(),
        nameServers: [],
        status: [],
        dnssecEnabled: false,
        privacyProtection: false,
        autoRenewal: false,
        domainLock: false,
        daysUntilExpiration: 365,
        domainAge: 0,
        securityScore: 50,
        trustScore: 50,
        issues: ['Impossible de récupérer les informations WHOIS'],
        recommendations: ['Vérifier la configuration réseau'],
        analyzedAt: new Date()
      };
      
      console.log('⚠️ Utilisation des données WHOIS par défaut');
      return fallbackAnalysis;
    }
  }

  // Récupérer les résultats WHOIS d'un site
  async getWhoisResults(websiteId: string, userId: string): Promise<DomainWhois[]> {
    if (!isSupabaseConfigured || supabase === null) {
      console.log('ℹ️ Supabase non configuré - retour de données vides');
      return [];
    }
    
    const { data, error } = await supabase
      .from('domain_whois')
      .select(`
        *,
        websites!inner (
          user_id
        )
      `)
      .eq('website_id', websiteId)
      .eq('websites.user_id', userId)
      .order('analyzed_at', { ascending: false });

    if (error) {
      console.warn('⚠️ Erreur récupération WHOIS:', error);
      return [];
    }
    return data || [];
  }

  // Simulation de lookup WHOIS (en production, utiliser une vraie API)
  private async performWhoisLookup(domain: string): Promise<any> {
    // Simuler un délai de lookup
    await new Promise(resolve => setTimeout(resolve, 1000));

    const now = new Date();
    const creationDate = new Date(now.getTime() - (Math.random() * 5 + 1) * 365 * 24 * 60 * 60 * 1000);
    const expirationDate = new Date(now.getTime() + (Math.random() * 2 + 0.5) * 365 * 24 * 60 * 60 * 1000);
    const lastUpdated = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);

    return {
      registrar: 'OVH SAS',
      registrarUrl: 'https://www.ovh.com',
      registrarIanaId: '433',
      registrarAbuseContactEmail: 'abuse@ovh.net',
      registrarAbuseContactPhone: '+33.972101007',
      ownerName: 'John Doe',
      ownerOrganization: 'Example Corp',
      ownerEmail: 'contact@example.com',
      ownerPhone: '+33.123456789',
      ownerAddress: {
        street: '123 Rue Example',
        city: 'Paris',
        state: 'Île-de-France',
        postalCode: '75001',
        country: 'FR'
      },
      adminContact: {
        name: 'Admin Contact',
        email: 'admin@example.com',
        phone: '+33.123456789'
      },
      techContact: {
        name: 'Tech Contact',
        email: 'tech@example.com',
        phone: '+33.123456789'
      },
      billingContact: {
        name: 'Billing Contact',
        email: 'billing@example.com',
        phone: '+33.123456789'
      },
      creationDate,
      expirationDate,
      lastUpdated,
      nameServers: ['dns1.ovh.net', 'dns2.ovh.net'],
      status: ['clientTransferProhibited', 'clientDeleteProhibited'],
      dnssecEnabled: Math.random() > 0.5,
      privacyProtection: Math.random() > 0.3,
      autoRenewal: Math.random() > 0.2,
      domainLock: Math.random() > 0.1,
      daysUntilExpiration: Math.floor((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
      domainAge: Math.floor((now.getTime() - creationDate.getTime()) / (24 * 60 * 60 * 1000))
    };
  }

  // Calculer le score de sécurité
  private calculateSecurityScore(whoisData: any): number {
    let score = 100;
    const { SCORE_WEIGHTS } = WHOIS_CONFIG;

    // Pénalités
    if (whoisData.daysUntilExpiration < 30) {
      score -= SCORE_WEIGHTS.EXPIRATION_SOON;
    }

    if (!whoisData.privacyProtection) {
      score -= SCORE_WEIGHTS.NO_PRIVACY_PROTECTION;
    }

    if (!whoisData.autoRenewal) {
      score -= SCORE_WEIGHTS.NO_AUTO_RENEWAL;
    }

    if (!whoisData.domainLock) {
      score -= 5;
    }

    if (!whoisData.dnssecEnabled) {
      score -= 10;
    }

    return Math.max(0, Math.round(score));
  }

  // Calculer le score de confiance
  private calculateTrustScore(whoisData: any): number {
    let score = 100;

    // Âge du domaine (bonus pour les domaines anciens)
    if (whoisData.domainAge < 365) {
      score -= 20; // Domaine très récent
    } else if (whoisData.domainAge < 730) {
      score -= 10; // Domaine récent
    }

    // Stabilité (pas de changements récents)
    const daysSinceUpdate = (Date.now() - whoisData.lastUpdated.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceUpdate < 30) {
      score -= 15; // Changements récents
    }

    return Math.max(0, Math.round(score));
  }

  // Générer les issues
  private generateIssues(whoisData: any): string[] {
    const issues: string[] = [];

    if (whoisData.daysUntilExpiration < 30) {
      issues.push(`Domaine expire dans ${whoisData.daysUntilExpiration} jours !`);
    }

    if (!whoisData.privacyProtection) {
      issues.push('Protection de la confidentialité désactivée');
    }

    if (!whoisData.autoRenewal) {
      issues.push('Renouvellement automatique désactivé');
    }

    if (!whoisData.dnssecEnabled) {
      issues.push('DNSSEC non configuré');
    }

    if (!whoisData.domainLock) {
      issues.push('Verrouillage du domaine désactivé');
    }

    return issues;
  }

  // Générer les recommandations
  private generateRecommendations(whoisData: any): string[] {
    const recommendations: string[] = [];

    if (whoisData.daysUntilExpiration < 60) {
      recommendations.push('🔄 Renouveler le domaine rapidement');
    }

    if (!whoisData.autoRenewal) {
      recommendations.push('⚙️ Activer le renouvellement automatique');
    }

    if (!whoisData.privacyProtection) {
      recommendations.push('🔒 Activer la protection de confidentialité');
    }

    if (!whoisData.dnssecEnabled) {
      recommendations.push('🛡️ Configurer DNSSEC pour la sécurité');
    }

    if (!whoisData.domainLock) {
      recommendations.push('🔐 Activer le verrouillage du domaine');
    }

    recommendations.push('📊 Surveiller régulièrement les informations WHOIS');
    recommendations.push('📧 Maintenir les contacts à jour');

    return recommendations;
  }

  // Cache optimisé
  private getCached(domain: string): WhoisAnalysisDetailed | null {
    const entry = this.cache.get(domain);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > WHOIS_CONFIG.CACHE.TTL;
    if (isExpired) {
      this.cache.delete(domain);
      return null;
    }

    return entry.data;
  }

  private setCache(domain: string, data: WhoisAnalysisDetailed): void {
    if (this.cache.size >= WHOIS_CONFIG.CACHE.MAX_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(domain, { data, timestamp: Date.now() });
  }
}

export const whoisService = new WhoisService();