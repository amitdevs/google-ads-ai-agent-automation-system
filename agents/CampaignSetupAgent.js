const axios = require('axios');
const config = require('../config/config');

class CampaignSetupAgent {
  constructor() {
    this.name = 'Campaign Setup Agent';
    this.status = 'idle';
    this.lastAction = null;
  }

  async setupCampaign(campaignData) {
    try {
      this.status = 'working';
      console.log(`[${this.name}] Starting campaign setup...`);

      // Validate campaign data
      this.validateCampaignData(campaignData);

      // Prepare campaign configuration for 2015 Security Services
      const campaignConfig = this.prepareCampaignConfig(campaignData);

      // In a real implementation, this would call Google Ads API
      // For now, we'll simulate the API call
      const campaignResponse = await this.simulateGoogleAdsAPI(campaignConfig);

      this.status = 'completed';
      this.lastAction = `Campaign created: ${campaignResponse.id}`;
      
      console.log(`[${this.name}] Campaign setup completed successfully`);
      console.log(`Campaign ID: ${campaignResponse.id}`);
      console.log(`Budget: £${campaignResponse.budget}/day`);
      console.log(`Targeting: ${campaignResponse.targeting.location}`);

      return campaignResponse;

    } catch (error) {
      this.status = 'error';
      this.lastAction = `Error: ${error.message}`;
      console.error(`[${this.name}] Error setting up campaign:`, error.message);
      throw error;
    }
  }

  validateCampaignData(data) {
    const required = ['budget', 'campaignType', 'targeting'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required campaign data: ${missing.join(', ')}`);
    }

    if (data.budget <= 0) {
      throw new Error('Budget must be greater than 0');
    }
  }

  prepareCampaignConfig(data) {
    const businessInfo = config.campaignSettings.businessInfo;
    
    return {
      name: `${businessInfo.name} - ${data.campaignType} Campaign`,
      budget: data.budget,
      campaignType: data.campaignType,
      targeting: {
        location: data.targeting.location || config.campaignSettings.region,
        radius: data.targeting.radius || 25, // 25 mile radius around London
        demographics: {
          ageRange: '25-65',
          interests: [
            'Home Security',
            'Business Security', 
            'Construction',
            'Property Management',
            'Commercial Services'
          ]
        },
        keywords: data.targeting.keywords || this.getDefaultKeywords(),
        negativeKeywords: this.getDefaultNegativeKeywords()
      },
      adSchedule: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '09:00', end: '17:00' },
        sunday: { start: '10:00', end: '16:00' }
      },
      bidStrategy: 'TARGET_CPA',
      targetCPA: config.kpiThresholds.maxCPA
    };
  }

  getDefaultKeywords() {
    return [
      // Core security services
      'security services london',
      'security guards london',
      'manned guarding london',
      'construction site security',
      'residential security services',
      'commercial security london',
      
      // Specific services from website
      'reception security',
      'front of house security',
      'empty property security',
      'key holding services',
      'mobile security patrols',
      
      // Location-based
      'london security company',
      'chingford security services',
      'e4 security services',
      
      // Certification-focused
      'sia licensed security',
      'certified security guards',
      'professional security services',
      
      // Business-specific
      'office security services',
      'retail security london',
      'warehouse security',
      'event security london'
    ];
  }

  getDefaultNegativeKeywords() {
    return [
      'free',
      'cheap',
      'diy',
      'volunteer',
      'part time',
      'jobs',
      'careers',
      'recruitment',
      'training',
      'course',
      'alarm systems',
      'cctv only',
      'software',
      'app'
    ];
  }

  async simulateGoogleAdsAPI(campaignConfig) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate successful campaign creation
    const campaignId = `campaign_${Date.now()}`;
    
    return {
      id: campaignId,
      name: campaignConfig.name,
      status: 'ENABLED',
      budget: campaignConfig.budget,
      campaignType: campaignConfig.campaignType,
      targeting: campaignConfig.targeting,
      created: new Date().toISOString(),
      metrics: {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0
      }
    };
  }

  // Real Google Ads API implementation (commented for reference)
  /*
  async createRealCampaign(campaignConfig) {
    const { googleAds } = config;
    
    const headers = {
      'Authorization': `Bearer ${googleAds.accessToken}`,
      'developer-token': googleAds.developerToken,
      'Content-Type': 'application/json'
    };

    const campaignData = {
      operations: [{
        create: {
          name: campaignConfig.name,
          advertisingChannelType: 'SEARCH',
          status: 'ENABLED',
          campaignBudget: {
            amountMicros: campaignConfig.budget * 1000000, // Convert to micros
            deliveryMethod: 'STANDARD'
          },
          targetCpa: {
            targetCpaMicros: campaignConfig.targetCPA * 1000000
          }
        }
      }]
    };

    const response = await axios.post(
      `https://googleads.googleapis.com/v14/customers/${googleAds.customerId}/campaigns:mutate`,
      campaignData,
      { headers }
    );

    return response.data;
  }
  */

  getStatus() {
    return {
      agent: this.name,
      status: this.status,
      lastAction: this.lastAction,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = CampaignSetupAgent;
