// Service de détection de technologies optimisé
export interface TechnologyDetection {
  name: string;
  category: 'CMS' | 'Page Builder' | 'Plugin' | 'Theme' | 'Framework' | 'Analytics' | 'Security';
  confidence: number; // 0-1
  version?: string;
  indicators: string[];
  details?: {
    theme?: string;
    plugins?: string[];
    features?: string[];
  };
}

export interface WordPressDetection extends TechnologyDetection {
  isWordPress: boolean;
  version?: string;
  theme?: {
    name: string;
    version?: string;
    confidence: number;
  };
  plugins: Array<{
    name: string;
    version?: string;
    confidence: number;
    slug?: string;
  }>;
  adminPath?: string;
  restApiEnabled: boolean;
  multisite: boolean;
}

export interface ElementorDetection extends TechnologyDetection {
  isElementor: boolean;
  version?: string;
  proVersion: boolean;
  widgets: string[];
  templates: number;
  customCss: boolean;
  features: string[];
}

// Configuration centralisée pour optimiser la maintenance
const DETECTION_CONFIG = {
  WORDPRESS: {
    // Indicateurs HTML/CSS
    HTML_INDICATORS: [
      'wp-content',
      'wp-includes',
      'wp-admin',
      'wp-json',
      'wordpress',
      '/wp/',
      'wp_',
      'wp-',
      'wlwmanifest',
      'xmlrpc.php'
    ],
    // Meta tags WordPress
    META_INDICATORS: [
      'generator.*wordpress',
      'wp-block-',
      'wp-embed',
      'wp-emoji'
    ],
    // Scripts et styles
    SCRIPT_INDICATORS: [
      'wp-includes/js',
      'wp-content/themes',
      'wp-content/plugins',
      'wp-content/uploads',
      'wp-admin/admin-ajax.php',
      'wp-json/wp/v2',
      'wp-embed.min.js',
      'jquery/jquery.js'
    ],
    // Headers HTTP
    HEADER_INDICATORS: [
      'x-powered-by.*wordpress',
      'server.*wordpress',
      'wp-super-cache'
    ],
    // Chemins spécifiques
    PATHS: [
      '/wp-admin/',
      '/wp-login.php',
      '/wp-content/',
      '/wp-includes/',
      '/wp-json/',
      '/xmlrpc.php',
      '/wp-cron.php'
    ]
  },
  ELEMENTOR: {
    // Classes CSS Elementor
    CSS_CLASSES: [
      'elementor',
      'elementor-element',
      'elementor-widget',
      'elementor-section',
      'elementor-column',
      'elementor-container',
      'elementor-row',
      'elementor-inner',
      'elementor-background',
      'elementor-heading',
      'elementor-button',
      'elementor-image',
      'elementor-text-editor'
    ],
    // Scripts Elementor
    SCRIPTS: [
      'elementor-frontend',
      'elementor-pro-frontend',
      'elementor/assets',
      'elementor-pro/assets',
      'elementor.min.js',
      'elementor-pro.min.js'
    ],
    // Styles Elementor
    STYLES: [
      'elementor-frontend.min.css',
      'elementor-pro.min.css',
      'elementor-icons.min.css',
      'elementor-animations.min.css'
    ],
    // Data attributes
    DATA_ATTRIBUTES: [
      'data-elementor-type',
      'data-elementor-id',
      'data-elementor-settings',
      'data-widget_type'
    ],
    // Widgets communs
    WIDGETS: [
      'heading.default',
      'text-editor.default',
      'image.default',
      'button.default',
      'spacer.default',
      'divider.default',
      'icon.default',
      'image-box.default',
      'icon-box.default',
      'testimonial.default',
      'tabs.default',
      'accordion.default',
      'toggle.default',
      'social-icons.default',
      'alert.default',
      'html.default'
    ]
  },
  CONFIDENCE_THRESHOLDS: {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5
  }
} as const;

class TechnologyDetectionService {
  // Détection WordPress complète et optimisée
  detectWordPress(html: string, url: string): WordPressDetection {
    console.log('🔍 Détection WordPress avancée pour:', url);
    
    // Vérification de sécurité
    if (!html || typeof html !== 'string') {
      console.log('⚠️ HTML invalide pour détection WordPress');
      return this.createEmptyWordPressDetection();
    }
    
    const indicators: string[] = [];
    let confidence = 0;
    let version: string | undefined;
    let adminPath: string | undefined;
    
    const htmlLower = html.toLowerCase();
    
    // 1. Détection par indicateurs HTML/CSS (poids: 40%)
    const htmlMatches = DETECTION_CONFIG.WORDPRESS.HTML_INDICATORS.filter(indicator => 
      htmlLower.includes(indicator.toLowerCase())
    );
    indicators.push(...htmlMatches.map(m => `HTML: ${m}`));
    confidence += (htmlMatches.length / DETECTION_CONFIG.WORDPRESS.HTML_INDICATORS.length) * 0.4;
    
    // 2. Détection par meta tags (poids: 20%)
    const metaMatches = DETECTION_CONFIG.WORDPRESS.META_INDICATORS.filter(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(html);
    });
    indicators.push(...metaMatches.map(m => `Meta: ${m}`));
    confidence += (metaMatches.length / DETECTION_CONFIG.WORDPRESS.META_INDICATORS.length) * 0.2;
    
    // 3. Détection par scripts et styles (poids: 30%)
    const scriptMatches = DETECTION_CONFIG.WORDPRESS.SCRIPT_INDICATORS.filter(indicator => 
      htmlLower.includes(indicator.toLowerCase())
    );
    indicators.push(...scriptMatches.map(m => `Script: ${m}`));
    confidence += (scriptMatches.length / DETECTION_CONFIG.WORDPRESS.SCRIPT_INDICATORS.length) * 0.3;
    
    // 4. Détection de version WordPress
    const versionMatches = [
      html.match(/generator.*wordpress\s+([\d.]+)/i),
      html.match(/wp-includes\/js\/wp-embed\.min\.js\?ver=([\d.]+)/i),
      html.match(/wp-content\/themes\/.*\/style\.css\?ver=([\d.]+)/i)
    ].filter(Boolean);
    
    if (versionMatches.length > 0) {
      version = versionMatches[0]![1];
      indicators.push(`Version: ${version}`);
      confidence += 0.1;
    }
    
    // 5. Détection du chemin admin
    if (htmlLower.includes('wp-admin')) {
      adminPath = '/wp-admin/';
      indicators.push('Admin path: /wp-admin/');
    }
    
    // 6. Détection REST API
    const restApiEnabled = htmlLower.includes('wp-json/wp/v2') || htmlLower.includes('rest_route');
    if (restApiEnabled) {
      indicators.push('REST API enabled');
      confidence += 0.05;
    }
    
    // 7. Détection multisite
    const multisite = htmlLower.includes('wp-content/mu-plugins') || htmlLower.includes('multisite');
    if (multisite) {
      indicators.push('Multisite detected');
    }
    
    // 8. Détection du thème
    const theme = this.detectWordPressTheme(html);
    if (theme) {
      indicators.push(`Theme: ${theme.name}`);
      confidence += 0.05;
    }
    
    // 9. Détection des plugins
    const plugins = this.detectWordPressPlugins(html);
    indicators.push(...plugins.map(p => `Plugin: ${p.name}`));
    confidence += Math.min(plugins.length * 0.02, 0.1);
    
    const isWordPress = confidence >= DETECTION_CONFIG.CONFIDENCE_THRESHOLDS.LOW;
    
    console.log(`✅ WordPress détecté: ${isWordPress} (confiance: ${(confidence * 100).toFixed(1)}%)`);
    
    return {
      name: 'WordPress',
      category: 'CMS',
      confidence: Math.min(confidence, 1),
      version,
      indicators,
      isWordPress,
      theme,
      plugins,
      adminPath,
      restApiEnabled,
      multisite,
      details: {
        theme: theme?.name,
        plugins: plugins.map(p => p.name),
        features: [
          ...(restApiEnabled ? ['REST API'] : []),
          ...(multisite ? ['Multisite'] : []),
          ...(adminPath ? ['Admin Access'] : [])
        ]
      }
    };
  }
  
  // Détection Elementor complète et optimisée
  detectElementor(html: string, url: string): ElementorDetection {
    console.log('🎨 Détection Elementor avancée pour:', url);
    
    // Vérification de sécurité
    if (!html || typeof html !== 'string') {
      console.log('⚠️ HTML invalide pour détection Elementor');
      return this.createEmptyElementorDetection();
    }
    
    const indicators: string[] = [];
    let confidence = 0;
    let version: string | undefined;
    let proVersion = false;
    
    const htmlLower = html.toLowerCase();
    
    // 1. Détection par classes CSS (poids: 40%)
    const cssMatches = DETECTION_CONFIG.ELEMENTOR.CSS_CLASSES.filter(className => 
      htmlLower.includes(className.toLowerCase())
    );
    indicators.push(...cssMatches.map(m => `CSS: ${m}`));
    confidence += (cssMatches.length / DETECTION_CONFIG.ELEMENTOR.CSS_CLASSES.length) * 0.4;
    
    // 2. Détection par scripts (poids: 25%)
    const scriptMatches = DETECTION_CONFIG.ELEMENTOR.SCRIPTS.filter(script => 
      htmlLower.includes(script.toLowerCase())
    );
    indicators.push(...scriptMatches.map(m => `Script: ${m}`));
    confidence += (scriptMatches.length / DETECTION_CONFIG.ELEMENTOR.SCRIPTS.length) * 0.25;
    
    // 3. Détection par styles (poids: 20%)
    const styleMatches = DETECTION_CONFIG.ELEMENTOR.STYLES.filter(style => 
      htmlLower.includes(style.toLowerCase())
    );
    indicators.push(...styleMatches.map(m => `Style: ${m}`));
    confidence += (styleMatches.length / DETECTION_CONFIG.ELEMENTOR.STYLES.length) * 0.2;
    
    // 4. Détection par data attributes (poids: 15%)
    const dataMatches = DETECTION_CONFIG.ELEMENTOR.DATA_ATTRIBUTES.filter(attr => 
      htmlLower.includes(attr.toLowerCase())
    );
    indicators.push(...dataMatches.map(m => `Data: ${m}`));
    confidence += (dataMatches.length / DETECTION_CONFIG.ELEMENTOR.DATA_ATTRIBUTES.length) * 0.15;
    
    // 5. Détection de version
    const versionMatches = [
      html.match(/elementor-frontend.*?ver=([\d.]+)/i),
      html.match(/elementor\/assets.*?ver=([\d.]+)/i),
      html.match(/elementor.*version\s+([\d.]+)/i)
    ].filter(Boolean);
    
    if (versionMatches.length > 0) {
      version = versionMatches[0]![1];
      indicators.push(`Version: ${version}`);
      confidence += 0.1;
    }
    
    // 6. Détection Elementor Pro
    const proIndicators = [
      'elementor-pro',
      'elementor/pro',
      'elementor-pro-frontend',
      'elementor-pro.min'
    ];
    
    proVersion = proIndicators.some(indicator => htmlLower.includes(indicator));
    if (proVersion) {
      indicators.push('Elementor Pro detected');
      confidence += 0.1;
    }
    
    // 7. Détection des widgets utilisés
    const widgets = this.detectElementorWidgets(html);
    indicators.push(...widgets.map(w => `Widget: ${w}`));
    
    // 8. Détection des templates
    const templateCount = this.countElementorTemplates(html);
    if (templateCount > 0) {
      indicators.push(`Templates: ${templateCount}`);
    }
    
    // 9. Détection CSS personnalisé
    const customCss = htmlLower.includes('elementor-custom-css') || 
                     htmlLower.includes('elementor-post-css');
    if (customCss) {
      indicators.push('Custom CSS detected');
    }
    
    // 10. Détection des fonctionnalités avancées
    const features = this.detectElementorFeatures(html);
    indicators.push(...features.map(f => `Feature: ${f}`));
    
    const isElementor = confidence >= DETECTION_CONFIG.CONFIDENCE_THRESHOLDS.LOW;
    
    console.log(`✅ Elementor détecté: ${isElementor} (confiance: ${(confidence * 100).toFixed(1)}%)`);
    
    return {
      name: 'Elementor',
      category: 'Page Builder',
      confidence: Math.min(confidence, 1),
      version,
      indicators,
      isElementor,
      proVersion,
      widgets,
      templates: templateCount,
      customCss,
      features,
      details: {
        features: [
          ...(proVersion ? ['Pro Version'] : []),
          ...(customCss ? ['Custom CSS'] : []),
          ...features
        ]
      }
    };
  }
  
  // Détection du thème WordPress
  private detectWordPressTheme(html: string): { name: string; version?: string; confidence: number } | undefined {
    if (!html || typeof html !== 'string') return undefined;
    
    const themePatterns = [
      // Thème dans les styles
      /wp-content\/themes\/([^\/\?]+)/i,
      // Thème dans les commentaires
      /theme:\s*([^\n\r]+)/i,
      // Template dans les commentaires
      /template:\s*([^\n\r]+)/i
    ];
    
    for (const pattern of themePatterns) {
      const match = html.match(pattern);
      if (match) {
        const themeName = match[1] ? match[1].replace(/[_-]/g, ' ').trim() : 'Unknown Theme';
        return {
          name: themeName,
          confidence: 0.8
        };
      }
    }
    
    return undefined;
  }
  
  // Détection des plugins WordPress
  private detectWordPressPlugins(html: string): Array<{ name: string; version?: string; confidence: number; slug?: string }> {
    const plugins: Array<{ name: string; version?: string; confidence: number; slug?: string }> = [];
    
    if (!html || typeof html !== 'string') return plugins;
    
    const htmlLower = html.toLowerCase();
    
    // Plugins populaires avec leurs indicateurs
    const knownPlugins = [
      { name: 'Yoast SEO', indicators: ['yoast', 'wpseo'], slug: 'wordpress-seo' },
      { name: 'Contact Form 7', indicators: ['contact-form-7', 'wpcf7'], slug: 'contact-form-7' },
      { name: 'WooCommerce', indicators: ['woocommerce', 'wc-'], slug: 'woocommerce' },
      { name: 'Jetpack', indicators: ['jetpack'], slug: 'jetpack' },
      { name: 'Akismet', indicators: ['akismet'], slug: 'akismet' },
      { name: 'WP Rocket', indicators: ['wp-rocket'], slug: 'wp-rocket' },
      { name: 'Elementor', indicators: ['elementor'], slug: 'elementor' },
      { name: 'WP Super Cache', indicators: ['wp-super-cache'], slug: 'wp-super-cache' },
      { name: 'All in One SEO', indicators: ['aioseo'], slug: 'all-in-one-seo-pack' },
      { name: 'WP Bakery', indicators: ['wpbakery', 'js_composer'], slug: 'js_composer' }
    ];
    
    knownPlugins.forEach(plugin => {
      const matches = plugin.indicators.filter(indicator => htmlLower.includes(indicator));
      if (matches.length > 0) {
        plugins.push({
          name: plugin.name,
          confidence: Math.min(matches.length / plugin.indicators.length, 1),
          slug: plugin.slug
        });
      }
    });
    
    // Détection générique par wp-content/plugins
    const pluginMatches = html.match(/wp-content\/plugins\/([^\/\?]+)/gi);
    if (pluginMatches) {
      const uniquePlugins = [...new Set(pluginMatches.map(match => {
        const slug = match.match(/wp-content\/plugins\/([^\/\?]+)/i)?.[1];
        return slug?.replace(/[_-]/g, ' ').trim();
      }).filter(Boolean))];
      
      uniquePlugins.forEach(pluginName => {
        if (!plugins.some(p => p.name.toLowerCase() === pluginName!.toLowerCase())) {
          plugins.push({
            name: pluginName!,
            confidence: 0.6
          });
        }
      });
    }
    
    return plugins;
  }
  
  // Détection des widgets Elementor
  private detectElementorWidgets(html: string): string[] {
    const widgets: string[] = [];
    
    if (!html || typeof html !== 'string') return widgets;
    
    const htmlLower = html.toLowerCase();
    
    DETECTION_CONFIG.ELEMENTOR.WIDGETS.forEach(widget => {
      if (htmlLower.includes(`data-widget_type="${widget}"`)) {
        widgets.push(widget.replace('.default', ''));
      }
    });
    
    // Détection par classes CSS
    const widgetClasses = html.match(/elementor-widget-([a-zA-Z0-9_-]+)/g);
    if (widgetClasses) {
      const uniqueWidgets = [...new Set(widgetClasses.map(cls => 
        cls.replace('elementor-widget-', '').replace(/-/g, ' ')
      ))];
      widgets.push(...uniqueWidgets);
    }
    
    return [...new Set(widgets)];
  }
  
  // Compter les templates Elementor
  private countElementorTemplates(html: string): number {
    if (!html || typeof html !== 'string') return 0;
    
    const templateMatches = html.match(/data-elementor-type="[^"]*"/g);
    return templateMatches ? templateMatches.length : 0;
  }
  
  // Détection des fonctionnalités Elementor
  private detectElementorFeatures(html: string): string[] {
    const features: string[] = [];
    
    if (!html || typeof html !== 'string') return features;
    
    const htmlLower = html.toLowerCase();
    
    const featureIndicators = [
      { name: 'Animations', indicators: ['elementor-animation', 'elementor-invisible'] },
      { name: 'Popup Builder', indicators: ['elementor-popup', 'elementor-location-popup'] },
      { name: 'Theme Builder', indicators: ['elementor-location-header', 'elementor-location-footer'] },
      { name: 'WooCommerce Builder', indicators: ['elementor-woocommerce', 'elementor-product'] },
      { name: 'Form Builder', indicators: ['elementor-form', 'elementor-field-group'] },
      { name: 'Global Widgets', indicators: ['elementor-global', 'elementor-template'] },
      { name: 'Custom CSS', indicators: ['elementor-custom-css', 'elementor-post-css'] },
      { name: 'Motion Effects', indicators: ['elementor-motion-effects', 'elementor-sticky'] }
    ];
    
    featureIndicators.forEach(feature => {
      if (feature.indicators.some(indicator => htmlLower.includes(indicator))) {
        features.push(feature.name);
      }
    });
    
    return features;
  }
  
  // Méthode principale pour détecter toutes les technologies
  detectAllTechnologies(html: string, url: string): TechnologyDetection[] {
    const technologies: TechnologyDetection[] = [];
    
    // Détection WordPress
    const wpDetection = this.detectWordPress(html, url);
    if (wpDetection.isWordPress) {
      technologies.push(wpDetection);
    }
    
    // Détection Elementor
    const elementorDetection = this.detectElementor(html, url);
    if (elementorDetection.isElementor) {
      technologies.push(elementorDetection);
    }
    
    // Autres détections...
    const otherTechs = this.detectOtherTechnologies(html);
    technologies.push(...otherTechs);
    
    return technologies;
  }
  
  // Détection d'autres technologies
  private detectOtherTechnologies(html: string): TechnologyDetection[] {
    const technologies: TechnologyDetection[] = [];
    
    if (!html || typeof html !== 'string') return technologies;
    
    const htmlLower = html.toLowerCase();
    
    // jQuery
    if (htmlLower.includes('jquery')) {
      technologies.push({
        name: 'jQuery',
        category: 'Framework',
        confidence: 0.9,
        indicators: ['jQuery library detected']
      });
    }
    
    // Google Analytics
    if (htmlLower.includes('google-analytics') || htmlLower.includes('gtag')) {
      technologies.push({
        name: 'Google Analytics',
        category: 'Analytics',
        confidence: 0.95,
        indicators: ['Google Analytics tracking code']
      });
    }
    
    // Cloudflare
    if (htmlLower.includes('cloudflare') || htmlLower.includes('cf-ray')) {
      technologies.push({
        name: 'Cloudflare',
        category: 'Security',
        confidence: 0.9,
        indicators: ['Cloudflare CDN/Security']
      });
    }
    
    return technologies;
  }
  
  // Méthodes pour créer des détections vides en cas d'erreur
  private createEmptyWordPressDetection(): WordPressDetection {
    return {
      name: 'WordPress',
      category: 'CMS',
      confidence: 0,
      indicators: [],
      isWordPress: false,
      plugins: [],
      restApiEnabled: false,
      multisite: false
    };
  }
  
  private createEmptyElementorDetection(): ElementorDetection {
    return {
      name: 'Elementor',
      category: 'Page Builder',
      confidence: 0,
      indicators: [],
      isElementor: false,
      proVersion: false,
      widgets: [],
      templates: 0,
      customCss: false,
      features: []
    };
  }
}

export const technologyDetectionService = new TechnologyDetectionService();