const axios = require('axios');
const config = require('../config/config');

class AdCopyAgent {
  constructor() {
    this.name = 'Ad Copy Agent';
    this.status = 'idle';
    this.lastAction = null;
    this.generatedAds = [];
  }

  async generateAdCopy(campaignData, keywords = []) {
    try {
      this.status = 'working';
      console.log(`[${this.name}] Starting ad copy generation...`);

      // Generate different types of ad copy
      const adVariations = await this.createAdVariations(campaignData, keywords);
      
      // Validate and optimize ad copy
      const validatedAds = this.validateAdCopy(adVariations);
      
      // A/B test variations
      const testGroups = this.createTestGroups(validatedAds);

      this.generatedAds = validatedAds;
      this.status = 'completed';
      this.lastAction = `Generated ${validatedAds.length} ad variations across ${testGroups.length} test groups`;

      console.log(`[${this.name}] Ad copy generation completed`);
      console.log(`Total ads generated: ${validatedAds.length}`);
      console.log(`Test groups created: ${testGroups.length}`);

      return {
        ads: validatedAds,
        testGroups: testGroups,
        summary: {
          totalAds: validatedAds.length,
          testGroups: testGroups.length,
          adTypes: this.getAdTypeDistribution(validatedAds)
        }
      };

    } catch (error) {
      this.status = 'error';
      this.lastAction = `Error: ${error.message}`;
      console.error(`[${this.name}] Error generating ad copy:`, error.message);
      throw error;
    }
  }

  async createAdVariations(campaignData, keywords) {
    console.log(`[${this.name}] Creating ad variations using AI...`);
    
    const businessInfo = config.campaignSettings.businessInfo;
    const services = config.campaignSettings.services;
    
    // Create different ad copy prompts for various scenarios
    const adPrompts = [
      {
        type: 'trust_focused',
        prompt: `Create professional Google Ads copy for ${businessInfo.name}, a London-based security company established in ${businessInfo.established}. 
        Focus on trust, SIA licensing, and 10+ years experience. 
        Services: ${services.join(', ')}. 
        Target: London businesses and homeowners.
        Include compelling headlines, descriptions, and call-to-action.
        Format: JSON with headline1, headline2, headline3, description1, description2, path1, path2, callToAction`
      },
      {
        type: 'service_focused',
        prompt: `Generate Google Ads copy for ${businessInfo.name} highlighting specific security services.
        Key services: manned guarding, construction site security, reception security, mobile patrols.
        Location: London (${businessInfo.address}).
        Emphasize 24/7 availability and professional SIA-licensed staff.
        Format: JSON with headline1, headline2, headline3, description1, description2, path1, path2, callToAction`
      },
      {
        type: 'urgency_focused',
        prompt: `Create urgent, action-oriented Google Ads copy for ${businessInfo.name}.
        Focus on immediate security needs, emergency response, 24/7 availability.
        Phone: ${businessInfo.phone[0]}.
        Emphasize quick response and professional service.
        Format: JSON with headline1, headline2, headline3, description1, description2, path1, path2, callToAction`
      },
      {
        type: 'local_focused',
        prompt: `Generate location-specific Google Ads copy for ${businessInfo.name}.
        Emphasize London coverage, local expertise, Chingford base.
        Target local businesses, construction sites, residential properties.
        Highlight community trust and local knowledge.
        Format: JSON with headline1, headline2, headline3, description1, description2, path1, path2, callToAction`
      }
    ];

    const adVariations = [];

    // Generate AI-powered ad copy
    for (const promptData of adPrompts) {
      try {
        const aiGeneratedAds = await this.callAIProvider(promptData.prompt);
        if (aiGeneratedAds && aiGeneratedAds.length > 0) {
          aiGeneratedAds.forEach(ad => {
            adVariations.push({
              ...ad,
              type: promptData.type,
              source: 'ai_generated',
              keywords: keywords.slice(0, 10) // Associate with top keywords
            });
          });
        }
      } catch (error) {
        console.warn(`[${this.name}] AI generation failed for ${promptData.type}, using fallback`);
      }
    }

    // Add manually crafted high-performing ad templates as fallback
    const fallbackAds = this.getFallbackAdTemplates();
    adVariations.push(...fallbackAds);

    console.log(`[${this.name}] Created ${adVariations.length} ad variations`);
    return adVariations;
  }

  async callAIProvider(prompt) {
    try {
      const { aiProvider } = config;
      
      if (!aiProvider.apiKey || aiProvider.apiKey.includes('INSERT_')) {
        console.warn(`[${this.name}] AI API key not configured, using fallback templates`);
        return [];
      }

      const response = await axios.post(aiProvider.endpoint, {
        model: aiProvider.model,
        messages: [
          {
            role: "system",
            content: "You are an expert Google Ads copywriter specializing in security services. Create compelling, compliant ad copy that drives conversions. Always return valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${aiProvider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const aiResponse = response.data.choices[0].message.content;
      
      // Parse AI response and extract ad copy
      try {
        const parsedAds = JSON.parse(aiResponse);
        return Array.isArray(parsedAds) ? parsedAds : [parsedAds];
      } catch (parseError) {
        // If JSON parsing fails, extract ad copy manually
        return this.extractAdCopyFromText(aiResponse);
      }

    } catch (error) {
      console.warn(`[${this.name}] AI API call failed:`, error.message);
      return [];
    }
  }

  extractAdCopyFromText(text) {
    // Fallback method to extract ad copy from unstructured AI response
    const ads = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    // Simple extraction logic - this would be more sophisticated in production
    let currentAd = {};
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('headline') && line.includes(':')) {
        const headline = line.split(':')[1].trim().replace(/['"]/g, '');
        if (!currentAd.headline1) currentAd.headline1 = headline;
        else if (!currentAd.headline2) currentAd.headline2 = headline;
        else if (!currentAd.headline3) currentAd.headline3 = headline;
      } else if (line.toLowerCase().includes('description') && line.includes(':')) {
        const description = line.split(':')[1].trim().replace(/['"]/g, '');
        if (!currentAd.description1) currentAd.description1 = description;
        else if (!currentAd.description2) currentAd.description2 = description;
      }
    });
    
    if (Object.keys(currentAd).length > 0) {
      ads.push(currentAd);
    }
    
    return ads;
  }

  getFallbackAdTemplates() {
    const businessInfo = config.campaignSettings.businessInfo;
    
    return [
      {
        headline1: "Professional Security Services London",
        headline2: "SIA Licensed Guards Available 24/7",
        headline3: "Trusted Since 2015",
        description1: "Expert security solutions for homes & businesses. SIA-licensed professionals, 10+ years experience. Call for free quote.",
        description2: "Manned guarding, mobile patrols, construction site security. Professional, reliable, certified. Get protected today.",
        path1: "Security-Services",
        path2: "London",
        callToAction: "Get Free Quote",
        type: 'trust_focused',
        source: 'template',
        keywords: []
      },
      {
        headline1: "24/7 Security Guards London",
        headline2: "Construction Site Security",
        headline3: "Call 0800 112 3232",
        description1: "Immediate security response. Manned guarding, mobile patrols, key holding. SIA certified professionals.",
        description2: "Protect your property with London's trusted security experts. Commercial & residential services available.",
        path1: "24-7-Security",
        path2: "London",
        callToAction: "Call Now",
        type: 'urgency_focused',
        source: 'template',
        keywords: []
      },
      {
        headline1: "London Security Company",
        headline2: "Manned Guarding Services",
        headline3: "Free Security Assessment",
        description1: "Professional security services across London. Reception security, empty property protection, mobile patrols.",
        description2: "Established 2015. SIA licensed. Serving businesses & homeowners. Get your free security consultation today.",
        path1: "Manned-Guarding",
        path2: "London",
        callToAction: "Free Assessment",
        type: 'service_focused',
        source: 'template',
        keywords: []
      },
      {
        headline1: "Chingford Security Services",
        headline2: "Local London Security Experts",
        headline3: "Professional & Reliable",
        description1: "Your local security specialists. Serving London businesses & residents. Professional, certified, trusted.",
        description2: "From our Chingford base, we protect properties across London. SIA licensed guards, competitive rates.",
        path1: "Local-Security",
        path2: "Chingford",
        callToAction: "Contact Us",
        type: 'local_focused',
        source: 'template',
        keywords: []
      },
      {
        headline1: "Commercial Security London",
        headline2: "Office & Retail Protection",
        headline3: "Professional Guards",
        description1: "Comprehensive commercial security solutions. Reception staff, manned guarding, access control.",
        description2: "Protect your business with London's security experts. SIA licensed, insured, professional service.",
        path1: "Commercial-Security",
        path2: "London",
        callToAction: "Get Quote",
        type: 'service_focused',
        source: 'template',
        keywords: []
      },
      {
        headline1: "Residential Security Services",
        headline2: "Home Protection London",
        headline3: "Peace of Mind Guaranteed",
        description1: "Keep your family safe with professional residential security. Mobile patrols, key holding, property checks.",
        description2: "Trusted by London homeowners. SIA certified guards, 24/7 monitoring, competitive pricing.",
        path1: "Home-Security",
        path2: "London",
        callToAction: "Protect Home",
        type: 'service_focused',
        source: 'template',
        keywords: []
      }
    ];
  }

  validateAdCopy(ads) {
    console.log(`[${this.name}] Validating ad copy compliance...`);
    
    const validatedAds = ads.filter(ad => {
      // Check headline length limits (30 characters each)
      if (ad.headline1 && ad.headline1.length > 30) return false;
      if (ad.headline2 && ad.headline2.length > 30) return false;
      if (ad.headline3 && ad.headline3.length > 30) return false;
      
      // Check description length limits (90 characters each)
      if (ad.description1 && ad.description1.length > 90) return false;
      if (ad.description2 && ad.description2.length > 90) return false;
      
      // Check path length limits (15 characters each)
      if (ad.path1 && ad.path1.length > 15) return false;
      if (ad.path2 && ad.path2.length > 15) return false;
      
      // Ensure required fields exist
      if (!ad.headline1 || !ad.description1) return false;
      
      // Check for prohibited content
      const prohibitedTerms = ['guaranteed', 'best', 'cheapest', 'free money'];
      const adText = `${ad.headline1} ${ad.headline2} ${ad.headline3} ${ad.description1} ${ad.description2}`.toLowerCase();
      if (prohibitedTerms.some(term => adText.includes(term))) return false;
      
      return true;
    }).map(ad => {
      // Add additional metadata
      return {
        ...ad,
        id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created: new Date().toISOString(),
        status: 'active',
        performance: {
          impressions: 0,
          clicks: 0,
          ctr: 0,
          cost: 0,
          conversions: 0
        }
      };
    });

    console.log(`[${this.name}] Validated ${validatedAds.length} ads`);
    return validatedAds;
  }

  createTestGroups(ads) {
    console.log(`[${this.name}] Creating A/B test groups...`);
    
    // Group ads by type for testing
    const adsByType = ads.reduce((groups, ad) => {
      if (!groups[ad.type]) groups[ad.type] = [];
      groups[ad.type].push(ad);
      return groups;
    }, {});

    const testGroups = Object.keys(adsByType).map(type => ({
      id: `test_group_${type}_${Date.now()}`,
      name: `${type.replace('_', ' ').toUpperCase()} Test Group`,
      type: type,
      ads: adsByType[type],
      trafficSplit: Math.floor(100 / Object.keys(adsByType).length), // Equal traffic split
      status: 'active',
      created: new Date().toISOString()
    }));

    return testGroups;
  }

  getAdTypeDistribution(ads) {
    const distribution = ads.reduce((dist, ad) => {
      dist[ad.type] = (dist[ad.type] || 0) + 1;
      return dist;
    }, {});
    
    return distribution;
  }

  // Method to update ad performance (called by Performance Monitor Agent)
  updateAdPerformance(adId, performanceData) {
    const ad = this.generatedAds.find(a => a.id === adId);
    if (ad) {
      ad.performance = { ...ad.performance, ...performanceData };
      ad.lastUpdated = new Date().toISOString();
    }
  }

  // Method to pause underperforming ads
  pauseAd(adId, reason) {
    const ad = this.generatedAds.find(a => a.id === adId);
    if (ad) {
      ad.status = 'paused';
      ad.pauseReason = reason;
      ad.pausedAt = new Date().toISOString();
      console.log(`[${this.name}] Paused ad ${adId}: ${reason}`);
    }
  }

  getStatus() {
    return {
      agent: this.name,
      status: this.status,
      lastAction: this.lastAction,
      adsGenerated: this.generatedAds.length,
      activeAds: this.generatedAds.filter(ad => ad.status === 'active').length,
      pausedAds: this.generatedAds.filter(ad => ad.status === 'paused').length,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AdCopyAgent;
