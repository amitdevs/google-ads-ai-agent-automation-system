const CampaignSetupAgent = require('./agents/CampaignSetupAgent');
const KeywordManagerAgent = require('./agents/KeywordManagerAgent');
const AdCopyAgent = require('./agents/AdCopyAgent');
const BidOptimizerAgent = require('./agents/BidOptimizerAgent');
const PerformanceMonitorAgent = require('./agents/PerformanceMonitorAgent');
const ReportingAgent = require('./agents/ReportingAgent');
const config = require('./config/config');

class GoogleAdsOrchestrator {
  constructor() {
    this.name = 'Google Ads AI Orchestrator';
    this.status = 'idle';
    this.currentWorkflow = null;
    this.workflowHistory = [];
    
    // Initialize all agents
    this.agents = {
      campaignSetup: new CampaignSetupAgent(),
      keywordManager: new KeywordManagerAgent(),
      adCopy: new AdCopyAgent(),
      bidOptimizer: new BidOptimizerAgent(),
      performanceMonitor: new PerformanceMonitorAgent(),
      reporting: new ReportingAgent()
    };

    console.log(`[${this.name}] Initialized with ${Object.keys(this.agents).length} agents`);
  }

  async executeWorkflow(workflowType = 'full_automation') {
    try {
      this.status = 'working';
      const workflowId = `workflow_${Date.now()}`;
      
      console.log(`\n🚀 [${this.name}] Starting ${workflowType} workflow (ID: ${workflowId})`);
      console.log('=' .repeat(80));

      // Validate configuration
      const configValid = config.validateConfig();
      if (!configValid) {
        console.warn('⚠️  Some configuration values are missing. Using fallback values where possible.');
      }

      this.currentWorkflow = {
        id: workflowId,
        type: workflowType,
        startTime: new Date().toISOString(),
        stages: [],
        results: {}
      };

      // Execute workflow stages
      await this.executeStage1_Setup();
      await this.executeStage2_Optimization();
      await this.executeStage3_Monitoring();
      await this.executeStage4_Reporting();

      // Complete workflow
      this.currentWorkflow.endTime = new Date().toISOString();
      this.currentWorkflow.duration = this.calculateDuration(this.currentWorkflow.startTime, this.currentWorkflow.endTime);
      this.currentWorkflow.status = 'completed';

      this.workflowHistory.push(this.currentWorkflow);
      this.status = 'completed';

      console.log('\n✅ [Orchestrator] Workflow completed successfully!');
      console.log(`Duration: ${this.currentWorkflow.duration}`);
      console.log('=' .repeat(80));

      return this.currentWorkflow;

    } catch (error) {
      this.status = 'error';
      console.error(`\n❌ [${this.name}] Workflow failed:`, error.message);
      
      if (this.currentWorkflow) {
        this.currentWorkflow.status = 'failed';
        this.currentWorkflow.error = error.message;
        this.currentWorkflow.endTime = new Date().toISOString();
      }
      
      throw error;
    }
  }

  async executeStage1_Setup() {
    console.log('\n📋 STAGE 1: Campaign Setup & Initialization');
    console.log('-'.repeat(50));

    const stageStart = Date.now();
    
    try {
      // Prepare campaign data for 2015 Security Services
      const campaignData = {
        budget: config.campaignSettings.budgetDaily,
        campaignType: 'Search',
        targeting: {
          location: config.campaignSettings.region,
          radius: 25,
          keywords: [
            'security services london',
            'security guards london',
            'manned guarding london',
            'construction site security',
            'residential security services'
          ]
        }
      };

      // Execute campaign setup
      const campaignResult = await this.agents.campaignSetup.setupCampaign(campaignData);
      
      this.currentWorkflow.results.campaignSetup = campaignResult;
      this.currentWorkflow.stages.push({
        stage: 1,
        name: 'Campaign Setup',
        status: 'completed',
        duration: Date.now() - stageStart,
        result: campaignResult
      });

      console.log('✅ Stage 1 completed successfully');
      return campaignResult;

    } catch (error) {
      console.error('❌ Stage 1 failed:', error.message);
      this.currentWorkflow.stages.push({
        stage: 1,
        name: 'Campaign Setup',
        status: 'failed',
        duration: Date.now() - stageStart,
        error: error.message
      });
      throw error;
    }
  }

  async executeStage2_Optimization() {
    console.log('\n🎯 STAGE 2: Keyword & Ad Copy Optimization');
    console.log('-'.repeat(50));

    const stageStart = Date.now();
    
    try {
      // Base keywords for 2015 Security Services
      const baseKeywords = [
        'security services',
        'security guards',
        'manned guarding',
        'construction security',
        'residential security',
        'commercial security',
        'london security'
      ];

      // Execute keyword optimization
      console.log('🔍 Optimizing keywords...');
      const keywordResult = await this.agents.keywordManager.fetchAndOptimizeKeywords(baseKeywords);
      
      // Execute ad copy generation
      console.log('✍️  Generating ad copy...');
      const campaignData = this.currentWorkflow.results.campaignSetup || {};
      const adCopyResult = await this.agents.adCopy.generateAdCopy(campaignData, keywordResult.keywords.exact.slice(0, 10));

      this.currentWorkflow.results.keywordOptimization = keywordResult;
      this.currentWorkflow.results.adCopyGeneration = adCopyResult;
      
      this.currentWorkflow.stages.push({
        stage: 2,
        name: 'Optimization',
        status: 'completed',
        duration: Date.now() - stageStart,
        results: {
          keywords: keywordResult.summary,
          adCopy: adCopyResult.summary
        }
      });

      console.log('✅ Stage 2 completed successfully');
      return { keywordResult, adCopyResult };

    } catch (error) {
      console.error('❌ Stage 2 failed:', error.message);
      this.currentWorkflow.stages.push({
        stage: 2,
        name: 'Optimization',
        status: 'failed',
        duration: Date.now() - stageStart,
        error: error.message
      });
      throw error;
    }
  }

  async executeStage3_Monitoring() {
    console.log('\n📊 STAGE 3: Performance Monitoring & Bid Optimization');
    console.log('-'.repeat(50));

    const stageStart = Date.now();
    
    try {
      const campaignId = this.currentWorkflow.results.campaignSetup?.id || 'demo_campaign';
      
      // Execute performance monitoring
      console.log('📈 Monitoring campaign performance...');
      const performanceResult = await this.agents.performanceMonitor.monitorCampaign(campaignId);
      
      // Execute bid optimization based on performance
      console.log('💰 Optimizing bids...');
      const keywords = this.currentWorkflow.results.keywordOptimization?.keywords?.exact || [];
      const bidOptimizationResult = await this.agents.bidOptimizer.adjustBids(
        campaignId, 
        performanceResult.metrics,
        keywords.slice(0, 5)
      );

      this.currentWorkflow.results.performanceMonitoring = performanceResult;
      this.currentWorkflow.results.bidOptimization = bidOptimizationResult;
      
      this.currentWorkflow.stages.push({
        stage: 3,
        name: 'Monitoring & Optimization',
        status: 'completed',
        duration: Date.now() - stageStart,
        results: {
          performance: {
            status: performanceResult.status,
            overallScore: performanceResult.analysis?.overallScore,
            alerts: performanceResult.alerts?.length || 0
          },
          bidOptimization: bidOptimizationResult.summary
        }
      });

      console.log('✅ Stage 3 completed successfully');
      return { performanceResult, bidOptimizationResult };

    } catch (error) {
      console.error('❌ Stage 3 failed:', error.message);
      this.currentWorkflow.stages.push({
        stage: 3,
        name: 'Monitoring & Optimization',
        status: 'failed',
        duration: Date.now() - stageStart,
        error: error.message
      });
      throw error;
    }
  }

  async executeStage4_Reporting() {
    console.log('\n📋 STAGE 4: Report Generation & Dashboard Update');
    console.log('-'.repeat(50));

    const stageStart = Date.now();
    
    try {
      const campaignData = this.currentWorkflow.results.campaignSetup || {};
      const performanceData = this.currentWorkflow.results.performanceMonitoring || {};
      
      // Get all agent statuses
      const agentStatuses = this.getAllAgentStatuses();
      
      // Generate comprehensive report
      console.log('📊 Generating comprehensive report...');
      const reportResult = await this.agents.reporting.generateReport(
        campaignData,
        performanceData,
        agentStatuses
      );

      this.currentWorkflow.results.reporting = reportResult;
      
      this.currentWorkflow.stages.push({
        stage: 4,
        name: 'Reporting',
        status: 'completed',
        duration: Date.now() - stageStart,
        result: {
          reportId: reportResult.id,
          overallScore: reportResult.executiveSummary?.campaignHealth?.status,
          insights: reportResult.insights?.totalInsights || 0,
          recommendations: reportResult.recommendations?.totalRecommendations || 0
        }
      });

      console.log('✅ Stage 4 completed successfully');
      return reportResult;

    } catch (error) {
      console.error('❌ Stage 4 failed:', error.message);
      this.currentWorkflow.stages.push({
        stage: 4,
        name: 'Reporting',
        status: 'failed',
        duration: Date.now() - stageStart,
        error: error.message
      });
      throw error;
    }
  }

  getAllAgentStatuses() {
    const statuses = {};
    Object.keys(this.agents).forEach(agentKey => {
      statuses[agentKey] = this.agents[agentKey].getStatus();
    });
    return statuses;
  }

  calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  // Method to start continuous monitoring
  async startContinuousMonitoring(intervalMinutes = 15) {
    console.log(`\n🔄 Starting continuous monitoring (every ${intervalMinutes} minutes)`);
    
    const monitoringInterval = setInterval(async () => {
      try {
        console.log('\n🔍 Continuous monitoring cycle...');
        
        // Get latest campaign data
        const latestWorkflow = this.workflowHistory[this.workflowHistory.length - 1];
        if (!latestWorkflow) {
          console.log('No previous workflow found, skipping monitoring cycle');
          return;
        }

        const campaignId = latestWorkflow.results.campaignSetup?.id;
        if (!campaignId) {
          console.log('No campaign ID found, skipping monitoring cycle');
          return;
        }

        // Monitor performance
        const performanceResult = await this.agents.performanceMonitor.monitorCampaign(campaignId);
        
        // Check if optimization is needed
        if (performanceResult.alerts && performanceResult.alerts.length > 0) {
          console.log(`⚠️  ${performanceResult.alerts.length} alerts detected, running optimization...`);
          
          // Run bid optimization
          await this.agents.bidOptimizer.adjustBids(campaignId, performanceResult.metrics);
          
          // Generate updated report
          const agentStatuses = this.getAllAgentStatuses();
          await this.agents.reporting.generateReport(
            latestWorkflow.results.campaignSetup,
            performanceResult,
            agentStatuses
          );
        }

      } catch (error) {
        console.error('❌ Error in continuous monitoring:', error.message);
      }
    }, intervalMinutes * 60 * 1000);

    return monitoringInterval;
  }

  // Method to get current status for dashboard
  getDashboardStatus() {
    const agentStatuses = this.getAllAgentStatuses();
    const dashboardData = this.agents.reporting.getDashboardData();
    
    return {
      orchestrator: {
        status: this.status,
        currentWorkflow: this.currentWorkflow?.id,
        totalWorkflows: this.workflowHistory.length,
        lastWorkflow: this.workflowHistory.length > 0 ? 
          this.workflowHistory[this.workflowHistory.length - 1].startTime : null
      },
      agents: agentStatuses,
      dashboard: dashboardData,
      timestamp: new Date().toISOString()
    };
  }

  // Method to get workflow summary
  getWorkflowSummary() {
    return {
      totalWorkflows: this.workflowHistory.length,
      successfulWorkflows: this.workflowHistory.filter(w => w.status === 'completed').length,
      failedWorkflows: this.workflowHistory.filter(w => w.status === 'failed').length,
      averageDuration: this.calculateAverageDuration(),
      lastWorkflow: this.workflowHistory.length > 0 ? 
        this.workflowHistory[this.workflowHistory.length - 1] : null
    };
  }

  calculateAverageDuration() {
    const completedWorkflows = this.workflowHistory.filter(w => w.status === 'completed' && w.duration);
    if (completedWorkflows.length === 0) return 'N/A';
    
    const totalSeconds = completedWorkflows.reduce((sum, workflow) => {
      const duration = workflow.duration;
      const seconds = this.parseDurationToSeconds(duration);
      return sum + seconds;
    }, 0);
    
    const avgSeconds = Math.floor(totalSeconds / completedWorkflows.length);
    const minutes = Math.floor(avgSeconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${avgSeconds % 60}s`;
    }
    return `${avgSeconds}s`;
  }

  parseDurationToSeconds(duration) {
    if (!duration) return 0;
    const parts = duration.split(' ');
    let seconds = 0;
    
    parts.forEach(part => {
      if (part.includes('m')) {
        seconds += parseInt(part) * 60;
      } else if (part.includes('s')) {
        seconds += parseInt(part);
      }
    });
    
    return seconds;
  }

  // Method to export workflow data
  exportWorkflowData(format = 'json') {
    const data = {
      orchestrator: this.name,
      workflows: this.workflowHistory,
      summary: this.getWorkflowSummary(),
      exportedAt: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertWorkflowsToCSV(this.workflowHistory);
      default:
        return data;
    }
  }

  convertWorkflowsToCSV(workflows) {
    let csv = 'Workflow ID,Type,Status,Start Time,End Time,Duration,Stages Completed\n';
    
    workflows.forEach(workflow => {
      csv += `${workflow.id},${workflow.type},${workflow.status},${workflow.startTime},${workflow.endTime || 'N/A'},${workflow.duration || 'N/A'},${workflow.stages.length}\n`;
    });
    
    return csv;
  }
}

// Main execution function
async function main() {
  console.log('🤖 Google Ads AI Agent Automation System');
  console.log('🏢 Client: 2015 Security Services Ltd');
  console.log('📍 Location: London, UK');
  console.log('💰 Budget: £600/month (£20/day)');
  console.log('🎯 Goal: Increase qualified leads, improve ROI, reduce CPL\n');

  const orchestrator = new GoogleAdsOrchestrator();
  
  try {
    // Execute full automation workflow
    const workflowResult = await orchestrator.executeWorkflow('full_automation');
    
    // Display results summary
    console.log('\n📊 WORKFLOW RESULTS SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Workflow ID: ${workflowResult.id}`);
    console.log(`Status: ${workflowResult.status}`);
    console.log(`Duration: ${workflowResult.duration}`);
    console.log(`Stages Completed: ${workflowResult.stages.length}/4`);
    
    // Display key metrics
    const performanceData = workflowResult.results.performanceMonitoring;
    if (performanceData && performanceData.metrics) {
      console.log('\n📈 KEY PERFORMANCE METRICS:');
      console.log(`CTR: ${performanceData.metrics.CTR}%`);
      console.log(`CPC: £${performanceData.metrics.CPC}`);
      console.log(`CPA: £${performanceData.metrics.CPA}`);
      console.log(`ROAS: ${performanceData.metrics.ROAS}x`);
      console.log(`Conversions: ${performanceData.metrics.conversions}`);
      console.log(`Overall Score: ${performanceData.analysis?.overallScore || 'N/A'}/100`);
    }

    // Display agent statuses
    console.log('\n🤖 AGENT STATUS:');
    const agentStatuses = orchestrator.getAllAgentStatuses();
    Object.keys(agentStatuses).forEach(agentKey => {
      const status = agentStatuses[agentKey];
      console.log(`${status.agent}: ${status.status} - ${status.lastAction}`);
    });

    // Start continuous monitoring (optional)
    console.log('\n🔄 Starting continuous monitoring...');
    const monitoringInterval = await orchestrator.startContinuousMonitoring(15); // Every 15 minutes
    
    // Keep the process running for demonstration
    console.log('\n✅ System is now running in continuous monitoring mode');
    console.log('Press Ctrl+C to stop the system');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down gracefully...');
      clearInterval(monitoringInterval);
      console.log('✅ System stopped');
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ System Error:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = GoogleAdsOrchestrator;

// Run if this file is executed directly
if (require.main === module) {
  main();
}
