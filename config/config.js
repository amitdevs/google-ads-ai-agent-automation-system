require('dotenv').config();

const config = {
  googleAds: {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 'INSERT_DEVELOPER_TOKEN_HERE',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || 'INSERT_CLIENT_ID_HERE',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || 'INSERT_CLIENT_SECRET_HERE',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || 'INSERT_REFRESH_TOKEN_HERE',
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || 'INSERT_CUSTOMER_ID_HERE',
    apiKey: 'AIzaSyCjtl1mPcxqc5srEZOsL3hbJpfaFFQlxbs' // Provided Google Ads API Key
  },
  
  aiProvider: {
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "anthropic/claude-3-sonnet-20240229", // Using Claude Sonnet as default
    apiKey: process.env.OPENROUTER_API_KEY || 'INSERT_OPENROUTER_API_KEY_HERE'
  },
  
  campaignSettings: {
    budgetMonthly: 600, // £600/month
    budgetDaily: 20, // £20/day (600/30)
    region: "London",
    businessType: "Security Services",
    targetAudience: [
      "London-based businesses",
      "homeowners in London", 
      "construction site managers",
      "property managers",
      "SIA-licensed aware audience"
    ],
    services: [
      "residential security",
      "commercial security", 
      "construction site security",
      "reception security",
      "front-of-house security",
      "empty property security",
      "mobile patrols",
      "key holding services"
    ],
    businessInfo: {
      name: "2015 Security Services Ltd",
      address: "480 Larkshall Road, 1st Floor, E4 9HH London, United Kingdom",
      phone: ["+4408001123232", "+4402039272672"],
      website: "https://2015security.co.uk",
      established: "2015",
      certifications: ["SIA-licensed", "ISO certified"]
    }
  },
  
  kpiThresholds: {
    minCTR: 0.02, // 2% minimum CTR
    maxCPC: 2.50, // £2.50 maximum cost per click
    maxCPA: 60.00, // £60 maximum cost per acquisition
    minROAS: 2.0, // 2:1 minimum return on ad spend
    qualityScoreMin: 6 // Minimum quality score
  },
  
  automationSettings: {
    bidAdjustmentPercent: 0.15, // 15% bid adjustments
    performanceCheckInterval: 300000, // 5 minutes in milliseconds
    reportingInterval: 3600000, // 1 hour in milliseconds
    pauseThresholdDays: 3, // Pause ads after 3 days of poor performance
    keywordExpansionLimit: 50 // Maximum new keywords per cycle
  }
};

// Validation function
function validateConfig() {
  const required = [
    'googleAds.developerToken',
    'googleAds.clientId', 
    'googleAds.clientSecret',
    'googleAds.refreshToken',
    'aiProvider.apiKey'
  ];
  
  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj && obj[k], config);
    return !value || value.includes('INSERT_') || value.includes('HERE');
  });
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing configuration for: ${missing.join(', ')}`);
    console.warn('Please set these values in your .env file or update config.js');
  }
  
  return missing.length === 0;
}

module.exports = {
  ...config,
  validateConfig
};
