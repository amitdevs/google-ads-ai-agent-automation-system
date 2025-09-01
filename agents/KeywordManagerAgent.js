const axios = require('axios');
const config = require('../config/config');

class KeywordManagerAgent {
  constructor() {
    this.name = 'Keyword Manager Agent';
    this.status = 'idle';
    this.lastAction = null;
    this.discoveredKeywords = [];
    this.negativeKeywords = [];
  }

  async fetchAndOptimizeKeywords(baseKeywords, campaignData = {}) {
    try {
      this.status = 'working';
      console.log(`[${this.name}] Starting keyword optimization...`);

      // Step 1: Expand base keywords using AI and industry knowledge
      const expandedKeywords = await this.expandKeywords(baseKeywords);
      
      // Step 2: Analyze keyword performance and filter
      const optimizedKeywords = await this.analyzeAndFilterKeywords(expandedKeywords);
      
      // Step 3: Generate negative keywords
      const negativeKeywords = await this.generateNegativeKeywords(optimizedKeywords);
      
      // Step 4: Organize keywords by match type and bid suggestions
      const keywordStructure = this.organizeKeywordStructure(optimizedKeywords);

      this.discoveredKeywords = optimizedKeywords;
      this.negativeKeywords = negativeKeywords;
      this.status = 'completed';
      this.lastAction = `Optimized ${optimizedKeywords.length} keywords, added ${negativeKeywords.length} negative keywords`;

      console.log(`[${this.name}] Keyword optimization completed`);
      console.log(`Total keywords: ${optimizedKeywords.length}`);
      console.log(`Negative keywords: ${negativeKeywords.length}`);

      return {
        keywords: keywordStructure,
        negativeKeywords: negativeKeywords,
        summary: {
          totalKeywords: optimizedKeywords.length,
          negativeKeywords: negativeKeywords.length,
          categories: this.categorizeKeywords(optimizedKeywords)
        }
      };

    } catch (error) {
      this.status = 'error';
      this.lastAction = `Error: ${error.message}`;
      console.error(`[${this.name}] Error optimizing keywords:`, error.message);
      throw error;
    }
  }

  async expandKeywords(baseKeywords) {
    console.log(`[${this.name}] Expanding keywords from base set...`);
    
    // Security services specific keyword expansion
    const securityServiceTypes = config.campaignSettings.services;
    const locationVariations = [
      'london', 'central london', 'east london', 'north london', 
      'south london', 'west london', 'greater london', 'chingford',
      'waltham forest', 'hackney', 'islington', 'tower hamlets'
    ];
    
    const serviceModifiers = [
      'professional', 'certified', 'licensed', 'experienced', 'reliable',
      'trusted', '24 hour', '24/7', 'emergency', 'mobile', 'static'
    ];

    const businessTypes = [
      'commercial', 'residential', 'industrial', 'retail', 'office',
      'construction site', 'warehouse', 'hospital', 'school', 'hotel'
    ];

    let expandedKeywords = [...baseKeywords];

    // Expand with service types
    securityServiceTypes.forEach(service => {
      expandedKeywords.push(service);
      expandedKeywords.push(`${service} london`);
      expandedKeywords.push(`professional ${service}`);
      expandedKeywords.push(`certified ${service}`);
    });

    // Expand with location variations
    baseKeywords.forEach(keyword => {
      locationVariations.forEach(location => {
        if (!keyword.toLowerCase().includes(location)) {
          expandedKeywords.push(`${keyword} ${location}`);
        }
      });
    });

    // Expand with service modifiers
    baseKeywords.forEach(keyword => {
      serviceModifiers.forEach(modifier => {
        expandedKeywords.push(`${modifier} ${keyword}`);
      });
    });

    // Expand with business types
    businessTypes.forEach(businessType => {
      expandedKeywords.push(`${businessType} security`);
      expandedKeywords.push(`${businessType} security services`);
      expandedKeywords.push(`${businessType} security london`);
    });

    // Add long-tail keywords based on 2015 Security's specific services
    const longTailKeywords = [
      'sia licensed security guards london',
      'construction site security services london',
      'empty property security monitoring',
      'key holding services london',
      'mobile security patrol services',
      'reception security staff london',
      'front of house security personnel',
      'commercial property security guards',
      'residential security services london',
      'professional security company london',
      'certified security guards hire',
      'business security solutions london',
      'property protection services',
      'security risk assessment london',
      'manned guarding services london',
      'security consultation services',
      'event security personnel london',
      'retail security guards london',
      'office building security services',
      'warehouse security monitoring'
    ];

    expandedKeywords = [...expandedKeywords, ...longTailKeywords];

    // Remove duplicates and clean up
    expandedKeywords = [...new Set(expandedKeywords.map(k => k.toLowerCase().trim()))];
    
    console.log(`[${this.name}] Expanded to ${expandedKeywords.length} keywords`);
    return expandedKeywords;
  }

  async analyzeAndFilterKeywords(keywords) {
    console.log(`[${this.name}] Analyzing and filtering keywords...`);
    
    // Filter out keywords that are too generic or irrelevant
    const filteredKeywords = keywords.filter(keyword => {
      // Remove single words (too broad)
      if (keyword.split(' ').length < 2 && !this.isAcceptableSingleWord(keyword)) {
        return false;
      }
      
      // Remove keywords that are too long (over 80 characters)
      if (keyword.length > 80) {
        return false;
      }
      
      // Remove keywords with irrelevant terms
      const irrelevantTerms = [
        'free', 'cheap', 'discount', 'sale', 'offer', 'deal',
        'job', 'career', 'recruitment', 'training', 'course',
        'diy', 'self', 'home alarm', 'cctv camera', 'software'
      ];
      
      if (irrelevantTerms.some(term => keyword.includes(term))) {
        return false;
      }
      
      return true;
    });

    // Score keywords based on relevance to 2015 Security Services
    const scoredKeywords = filteredKeywords.map(keyword => ({
      keyword,
      score: this.calculateKeywordScore(keyword),
      estimatedCPC: this.estimateCPC(keyword),
      searchVolume: this.estimateSearchVolume(keyword),
      competition: this.estimateCompetition(keyword)
    }));

    // Sort by score and take top keywords within limit
    const topKeywords = scoredKeywords
      .sort((a, b) => b.score - a.score)
      .slice(0, config.automationSettings.keywordExpansionLimit)
      .map(item => item.keyword);

    console.log(`[${this.name}] Filtered to ${topKeywords.length} high-quality keywords`);
    return topKeywords;
  }

  isAcceptableSingleWord(word) {
    const acceptableSingleWords = [
      'security', 'guards', 'protection', 'surveillance', 
      'monitoring', 'patrol', 'guarding'
    ];
    return acceptableSingleWords.includes(word.toLowerCase());
  }

  calculateKeywordScore(keyword) {
    let score = 0;
    
    // Higher score for keywords containing business services
    const serviceTerms = ['security', 'guard', 'protection', 'patrol', 'monitoring'];
    serviceTerms.forEach(term => {
      if (keyword.includes(term)) score += 10;
    });
    
    // Higher score for location relevance
    const locationTerms = ['london', 'chingford', 'e4'];
    locationTerms.forEach(term => {
      if (keyword.includes(term)) score += 15;
    });
    
    // Higher score for specific services offered
    const specificServices = config.campaignSettings.services;
    specificServices.forEach(service => {
      if (keyword.includes(service.toLowerCase())) score += 20;
    });
    
    // Higher score for professional terms
    const professionalTerms = ['professional', 'certified', 'licensed', 'sia', 'qualified'];
    professionalTerms.forEach(term => {
      if (keyword.includes(term)) score += 8;
    });
    
    // Bonus for commercial intent keywords
    const commercialTerms = ['hire', 'services', 'company', 'solutions', 'consultation'];
    commercialTerms.forEach(term => {
      if (keyword.includes(term)) score += 5;
    });
    
    return score;
  }

  estimateCPC(keyword) {
    // Estimate CPC based on keyword characteristics
    let baseCPC = 1.20; // Base CPC for security services in London
    
    if (keyword.includes('london')) baseCPC *= 1.3;
    if (keyword.includes('commercial') || keyword.includes('business')) baseCPC *= 1.2;
    if (keyword.includes('emergency') || keyword.includes('24')) baseCPC *= 1.4;
    if (keyword.includes('construction')) baseCPC *= 1.1;
    if (keyword.split(' ').length > 4) baseCPC *= 0.8; // Long-tail keywords typically cheaper
    
    return Math.round(baseCPC * 100) / 100; // Round to 2 decimal places
  }

  estimateSearchVolume(keyword) {
    // Estimate monthly search volume
    let baseVolume = 100;
    
    if (keyword.includes('security')) baseVolume += 200;
    if (keyword.includes('london')) baseVolume += 150;
    if (keyword.includes('guards')) baseVolume += 100;
    if (keyword.split(' ').length > 3) baseVolume *= 0.6; // Long-tail has lower volume
    
    return Math.floor(baseVolume);
  }

  estimateCompetition(keyword) {
    // Estimate competition level (LOW, MEDIUM, HIGH)
    const competitiveTerms = ['security', 'london', 'guards', 'services'];
    const competitionScore = competitiveTerms.reduce((score, term) => {
      return keyword.includes(term) ? score + 1 : score;
    }, 0);
    
    if (competitionScore >= 3) return 'HIGH';
    if (competitionScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  async generateNegativeKeywords(keywords) {
    console.log(`[${this.name}] Generating negative keywords...`);
    
    const negativeKeywords = [
      // Job-related
      'jobs', 'careers', 'employment', 'hiring', 'recruitment', 'vacancy',
      'cv', 'resume', 'interview', 'salary', 'wage',
      
      // Training/Education
      'training', 'course', 'certification', 'exam', 'study', 'learn',
      'school', 'college', 'university', 'qualification',
      
      // DIY/Self-service
      'diy', 'self', 'yourself', 'own', 'personal', 'home alarm',
      'install', 'installation', 'setup',
      
      // Technology-only solutions
      'software', 'app', 'system', 'camera', 'cctv', 'alarm',
      'technology', 'digital', 'smart', 'automated',
      
      // Irrelevant services
      'cleaning', 'maintenance', 'repair', 'construction work',
      'building', 'renovation', 'plumbing', 'electrical',
      
      // Price-focused (low-quality leads)
      'free', 'cheap', 'discount', 'sale', 'offer', 'deal',
      'budget', 'affordable', 'low cost', 'inexpensive',
      
      // Competitor brands (add major competitors)
      'g4s', 'securitas', 'mitie', 'churchill', 'chubb',
      
      // Irrelevant locations (outside service area)
      'manchester', 'birmingham', 'liverpool', 'leeds', 'glasgow',
      'edinburgh', 'cardiff', 'belfast', 'bristol', 'sheffield'
    ];
    
    return negativeKeywords;
  }

  organizeKeywordStructure(keywords) {
    console.log(`[${this.name}] Organizing keyword structure...`);
    
    const keywordStructure = {
      exact: [],
      phrase: [],
      broad: []
    };
    
    keywords.forEach(keyword => {
      const wordCount = keyword.split(' ').length;
      const estimatedCPC = this.estimateCPC(keyword);
      const competition = this.estimateCompetition(keyword);
      
      const keywordData = {
        keyword,
        estimatedCPC,
        competition,
        suggestedBid: Math.min(estimatedCPC * 1.2, config.kpiThresholds.maxCPC)
      };
      
      // Organize by match type based on keyword characteristics
      if (wordCount >= 4 || keyword.includes('london')) {
        // Long-tail or location-specific keywords work well with exact match
        keywordStructure.exact.push(keywordData);
      } else if (wordCount === 3 || competition === 'MEDIUM') {
        // Medium-length keywords work well with phrase match
        keywordStructure.phrase.push(keywordData);
      } else {
        // Shorter, broader keywords use broad match
        keywordStructure.broad.push(keywordData);
      }
    });
    
    return keywordStructure;
  }

  categorizeKeywords(keywords) {
    const categories = {
      'Core Services': [],
      'Location-Based': [],
      'Industry-Specific': [],
      'Service Types': [],
      'Commercial Intent': []
    };
    
    keywords.forEach(keyword => {
      if (keyword.includes('london') || keyword.includes('chingford')) {
        categories['Location-Based'].push(keyword);
      } else if (keyword.includes('commercial') || keyword.includes('business') || keyword.includes('office')) {
        categories['Industry-Specific'].push(keyword);
      } else if (keyword.includes('hire') || keyword.includes('services') || keyword.includes('company')) {
        categories['Commercial Intent'].push(keyword);
      } else if (keyword.includes('manned') || keyword.includes('mobile') || keyword.includes('reception')) {
        categories['Service Types'].push(keyword);
      } else {
        categories['Core Services'].push(keyword);
      }
    });
    
    return categories;
  }

  getStatus() {
    return {
      agent: this.name,
      status: this.status,
      lastAction: this.lastAction,
      keywordsDiscovered: this.discoveredKeywords.length,
      negativeKeywords: this.negativeKeywords.length,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = KeywordManagerAgent;
