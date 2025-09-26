export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface AnalysisResult {
  id: string;
  url: string;
  userId: string;
  timestamp: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  results?: {
    seo: SEOResult;
    links: LinkResult;
    forms: FormResult;
    security: SecurityResult;
    performance: PerformanceResult;
    accessibility: AccessibilityResult;
  };
}

export interface SEOResult {
  score: number;
  issues: SEOIssue[];
  recommendations: string[];
}

export interface SEOIssue {
  type: 'title' | 'meta' | 'headings' | 'images' | 'content';
  severity: 'low' | 'medium' | 'high';
  message: string;
  page?: string;
  url?: string;
  element?: string;
  currentValue?: string;
  recommendedValue?: string;
  solution: string;
}

export interface LinkResult {
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  brokenLinksList: BrokenLink[];
}

export interface BrokenLink {
  url: string;
  page: string;
  status: number;
  message: string;
  linkText?: string;
  linkType: 'internal' | 'external';
}

export interface FormResult {
  formsFound: number;
  workingForms: number;
  brokenForms: number;
  formDetails: FormDetail[];
  hasRecaptcha: boolean;
  recaptchaSecure: boolean;
  captchaInfo?: {
    type: 'none' | 'recaptcha-v2' | 'recaptcha-v3' | 'hcaptcha' | 'turnstile' | 'other';
    version?: string;
    siteKey?: string;
    provider?: string;
    confidence: number;
  };
}

export interface FormDetail {
  id: string;
  action: string;
  method: string;
  fields: FormField[];
  hasValidation: boolean;
  isSecure: boolean;
  emailDestinations?: string[];
  functionality?: {
    isWorking: boolean;
    issues: string[];
    recommendations: string[];
  };
  isWorking?: boolean;
  fieldCount?: number;
  hasEmailField?: boolean;
  hasRequiredFields?: boolean;
  captcha?: {
    present: boolean;
    type?: string;
    version?: string;
    provider?: string;
    siteKey?: string;
  };
}

export interface FormField {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

export interface SecurityResult {
  httpsEnabled: boolean;
  securityHeaders: SecurityHeader[];
  vulnerabilities: string[];
  sslInfo?: {
    issuer: string;
    validFrom: string;
    validTo: string;
  };
}

export interface SecurityHeader {
  name: string;
  present: boolean;
  value?: string;
}

export interface PerformanceResult {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  score: number;
}

export interface AccessibilityResult {
  score: number;
  issues: AccessibilityIssue[];
}

export interface AccessibilityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  element: string;
  xpath?: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  solution: string;
}

export interface PageDetail {
  url: string;
  title: string;
  metaDescription: string;
  wordCount: number;
  loadTime: number;
  statusCode: number;
  seoScore: number;
  seoIssues: SEOIssue[];
  h1Tags: string[];
  h2Tags: string[];
  imagesCount: number;
  imagesWithoutAlt: number;
  internalLinksCount: number;
  externalLinksCount: number;
  technologies?: {
    wordpress?: {
      version: string;
      confidence: number;
    };
    elementor?: {
      version: string;
      confidence: number;
    };
  };
}

export interface RealAnalysisResult {
  url: string;
  seoData: {
    title: string;
    metaDescription: string;
    h1Tags: string[];
    h2Tags: string[];
    wordCount: number;
    images: Array<{
      src: string;
      alt: string;
      hasAlt: boolean;
      filename?: string;
    }>;
    internalLinks: string[];
    externalLinks: string[];
  };
}