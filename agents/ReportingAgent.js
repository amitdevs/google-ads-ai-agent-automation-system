const config = require('../config/config');

class ReportingAgent {
  constructor() {
    this.name = 'Reporting Agent';
    this.status = 'idle';
    this.lastAction = null;
    this.reports = [];
    this.dashboardData = {};
  }

  async generateReport(campaignData, performanceData, agentStatuses = {}) {
    try {
      this.status = 'working';
      console.log(`[${this.name}] Generating comprehensive campaign report...`);

      // Generate different types of reports
      const performanceReport = this.generatePerformanceReport(campaignData, performanceData);
      const kpiReport = this.generateKPIReport(performanceData);
      const agentActivityReport = this.generateAgentActivityReport(agentStatuses);
      const insightsReport = this.generateInsightsReport(performanceData);
      const recommendationsReport = this.generateRecommendationsReport(performanceData);

      // Compile comprehensive report
      const comprehensiveReport = {
        id: `report_${Date.now()}`,
        campaignId: campaignData.id || 'unknown',
        reportType: 'comprehensive',
        generatedAt: new Date().toISOString(),
        reportPeriod: this.getReportPeriod(),
        businessInfo: config.campaignSettings.businessInfo,
        
        // Main report sections
        executiveSummary: this.generateExecutiveSummary(performanceData, agentStatuses),
        performanceOverview: performanceReport,
        kpiAnalysis: kpiReport,
        agentActivity: agentActivityReport,
        insights: insightsReport,
        recommendations: recommendationsReport,
        
        // Additional data
        rawData: {
          campaignData: campaignData,
          performanceData: performanceData,
          agentStatuses: agentStatuses
        }
      };

      // Update dashboard data
      this.updateDashboardData(comprehensiveReport);

      // Store report
      this.reports.push(comprehensiveReport);
      this.cleanupOldReports();

      this.status = 'completed';
      this.lastAction = `Generated comprehensive report for campaign ${campaignData.id}`;

      console.log(`[${this.name}] Report generation completed`);
      console.log(`Report ID: ${comprehensiveReport.id}`);
      console.log(`Overall Performance Score: ${performanceData.analysis?.overallScore || 'N/A'}`);

      return comprehensiveReport;

    } catch (error) {
      this.status = 'error';
      this.lastAction = `Error: ${error.message}`;
      console.error(`[${this.name}] Error generating report:`, error.message);
      throw error;
    }
  }

  generateExecutiveSummary(performanceData, agentStatuses) {
    const metrics = performanceData.metrics || {};
    const analysis = performanceData.analysis || {};
    
    return {
      campaignHealth: this.getCampaignHealthStatus(analysis.overallScore),
      keyMetrics: {
        totalImpressions: metrics.impressions || 0,
        totalClicks: metrics.clicks || 0,
        totalCost: `£${(metrics.cost || 0).toFixed(2)}`,
        totalConversions: metrics.conversions || 0,
        currentCTR: `${(metrics.CTR || 0).toFixed(2)}%`,
        currentCPC: `£${(metrics.CPC || 0).toFixed(2)}`,
        currentCPA: `£${(metrics.CPA || 0).toFixed(2)}`,
        currentROAS: `${(metrics.ROAS || 0).toFixed(2)}x`
      },
      performanceHighlights: this.getPerformanceHighlights(analysis),
      criticalIssues: analysis.topIssues || [],
      agentStatus: this.getAgentStatusSummary(agentStatuses),
      budgetUtilization: this.calculateBudgetUtilization(metrics.cost),
      nextActions: this.getNextActions(analysis, agentStatuses)
    };
  }

  getCampaignHealthStatus(overallScore) {
    if (!overallScore) return { status: 'unknown', color: 'gray', message: 'Insufficient data' };
    
    if (overallScore >= 85) {
      return { status: 'excellent', color: 'green', message: 'Campaign performing excellently' };
    } else if (overallScore >= 70) {
      return { status: 'good', color: 'blue', message: 'Campaign performing well' };
    } else if (overallScore >= 50) {
      return { status: 'needs_attention', color: 'orange', message: 'Campaign needs optimization' };
    } else {
      return { status: 'critical', color: 'red', message: 'Campaign requires immediate attention' };
    }
  }

  getPerformanceHighlights(analysis) {
    const highlights = [];
    
    if (!analysis) return highlights;

    // Check each metric for highlights
    Object.keys(analysis).forEach(metric => {
      const metricData = analysis[metric];
      if (metricData && metricData.status) {
        if (metricData.status === 'excellent') {
          highlights.push({
            type: 'positive',
            metric: metricData.metricName || metric,
            message: `${metricData.metricName || metric} performing excellently at ${metricData.current}`
          });
        } else if (metricData.status === 'critical') {
          highlights.push({
            type: 'negative',
            metric: metricData.metricName || metric,
            message: `${metricData.metricName || metric} needs immediate attention: ${metricData.current} vs target ${metricData.target}`
          });
        }
      }
    });

    return highlights.slice(0, 5); // Top 5 highlights
  }

  getAgentStatusSummary(agentStatuses) {
    const summary = {
      totalAgents: Object.keys(agentStatuses).length,
      activeAgents: 0,
      completedAgents: 0,
      errorAgents: 0,
      agentDetails: []
    };

    Object.keys(agentStatuses).forEach(agentName => {
      const status = agentStatuses[agentName];
      
      summary.agentDetails.push({
        name: agentName,
        status: status.status,
        lastAction: status.lastAction,
        timestamp: status.timestamp
      });

      switch (status.status) {
        case 'working':
        case 'monitoring':
          summary.activeAgents++;
          break;
        case 'completed':
          summary.completedAgents++;
          break;
        case 'error':
          summary.errorAgents++;
          break;
      }
    });

    return summary;
  }

  calculateBudgetUtilization(currentSpend) {
    const dailyBudget = config.campaignSettings.budgetDaily;
    const monthlyBudget = config.campaignSettings.budgetMonthly;
    
    // Calculate daily utilization
    const dailyUtilization = dailyBudget > 0 ? (currentSpend / dailyBudget) * 100 : 0;
    
    // Estimate monthly pace
    const daysInMonth = new Date().getDate();
    const estimatedMonthlySpend = (currentSpend / daysInMonth) * 30;
    const monthlyPace = monthlyBudget > 0 ? (estimatedMonthlySpend / monthlyBudget) * 100 : 0;

    return {
      dailySpend: `£${(currentSpend || 0).toFixed(2)}`,
      dailyBudget: `£${dailyBudget}`,
      dailyUtilization: `${dailyUtilization.toFixed(1)}%`,
      estimatedMonthlySpend: `£${estimatedMonthlySpend.toFixed(2)}`,
      monthlyBudget: `£${monthlyBudget}`,
      monthlyPace: `${monthlyPace.toFixed(1)}%`,
      status: this.getBudgetStatus(dailyUtilization, monthlyPace)
    };
  }

  getBudgetStatus(dailyUtil, monthlyPace) {
    if (dailyUtil > 120 || monthlyPace > 120) return 'overspend';
    if (dailyUtil > 90 || monthlyPace > 90) return 'on_track_high';
    if (dailyUtil > 70 || monthlyPace > 70) return 'on_track';
    return 'underspend';
  }

  getNextActions(analysis, agentStatuses) {
    const actions = [];
    
    // Based on performance issues
    if (analysis.topIssues && analysis.topIssues.length > 0) {
      actions.push({
        priority: 'high',
        action: 'Address Critical Performance Issues',
        description: `Focus on: ${analysis.topIssues.map(i => i.metric).join(', ')}`,
        assignedAgent: 'Performance Monitor Agent'
      });
    }

    // Based on agent statuses
    Object.keys(agentStatuses).forEach(agentName => {
      const status = agentStatuses[agentName];
      if (status.status === 'error') {
        actions.push({
          priority: 'high',
          action: `Resolve ${agentName} Error`,
          description: status.lastAction || 'Agent encountered an error',
          assignedAgent: agentName
        });
      }
    });

    // Based on overall performance
    if (analysis.overallScore && analysis.overallScore < 60) {
      actions.push({
        priority: 'medium',
        action: 'Campaign Optimization Required',
        description: 'Overall performance below acceptable threshold',
        assignedAgent: 'All Agents'
      });
    }

    return actions.slice(0, 5); // Top 5 actions
  }

  generatePerformanceReport(campaignData, performanceData) {
    const metrics = performanceData.metrics || {};
    const analysis = performanceData.analysis || {};

    return {
      campaignOverview: {
        campaignId: campaignData.id,
        campaignName: campaignData.name,
        campaignType: campaignData.campaignType,
        status: campaignData.status,
        budget: campaignData.budget,
        created: campaignData.created
      },
      
      currentMetrics: {
        impressions: {
          value: metrics.impressions || 0,
          change: this.calculateChange('impressions', metrics.impressions),
          status: 'neutral'
        },
        clicks: {
          value: metrics.clicks || 0,
          change: this.calculateChange('clicks', metrics.clicks),
          status: 'neutral'
        },
        ctr: {
          value: `${(metrics.CTR || 0).toFixed(2)}%`,
          change: this.calculateChange('CTR', metrics.CTR),
          status: analysis.ctr?.status || 'unknown',
          target: `${(config.kpiThresholds.minCTR * 100).toFixed(2)}%`
        },
        cpc: {
          value: `£${(metrics.CPC || 0).toFixed(2)}`,
          change: this.calculateChange('CPC', metrics.CPC),
          status: analysis.cpc?.status || 'unknown',
          target: `£${config.kpiThresholds.maxCPC}`
        },
        cpa: {
          value: `£${(metrics.CPA || 0).toFixed(2)}`,
          change: this.calculateChange('CPA', metrics.CPA),
          status: analysis.cpa?.status || 'unknown',
          target: `£${config.kpiThresholds.maxCPA}`
        },
        roas: {
          value: `${(metrics.ROAS || 0).toFixed(2)}x`,
          change: this.calculateChange('ROAS', metrics.ROAS),
          status: analysis.roas?.status || 'unknown',
          target: `${config.kpiThresholds.minROAS}x`
        },
        conversions: {
          value: metrics.conversions || 0,
          change: this.calculateChange('conversions', metrics.conversions),
          status: 'neutral'
        },
        cost: {
          value: `£${(metrics.cost || 0).toFixed(2)}`,
          change: this.calculateChange('cost', metrics.cost),
          status: 'neutral'
        }
      },

      performanceAnalysis: analysis,
      
      timeSeriesData: this.generateTimeSeriesData(metrics),
      
      comparisonData: this.generateComparisonData(metrics)
    };
  }

  generateKPIReport(performanceData) {
    const analysis = performanceData.analysis || {};
    const thresholds = config.kpiThresholds;

    return {
      kpiSummary: {
        totalKPIs: 4,
        meetingTargets: this.countKPIsMeetingTargets(analysis),
        criticalKPIs: this.countCriticalKPIs(analysis),
        overallGrade: analysis.performanceGrade || 'N/A'
      },

      kpiDetails: [
        {
          name: 'Click-Through Rate (CTR)',
          current: analysis.ctr?.current || 0,
          target: thresholds.minCTR * 100,
          unit: '%',
          status: analysis.ctr?.status || 'unknown',
          variance: analysis.ctr?.variance || 0,
          trend: 'stable',
          importance: 'high',
          description: 'Measures ad relevance and appeal to target audience'
        },
        {
          name: 'Cost Per Click (CPC)',
          current: analysis.cpc?.current || 0,
          target: thresholds.maxCPC,
          unit: '£',
          status: analysis.cpc?.status || 'unknown',
          variance: analysis.cpc?.variance || 0,
          trend: 'stable',
          importance: 'medium',
          description: 'Average cost paid for each click on ads'
        },
        {
          name: 'Cost Per Acquisition (CPA)',
          current: analysis.cpa?.current || 0,
          target: thresholds.maxCPA,
          unit: '£',
          status: analysis.cpa?.status || 'unknown',
          variance: analysis.cpa?.variance || 0,
          trend: 'stable',
          importance: 'critical',
          description: 'Cost to acquire each new customer or lead'
        },
        {
          name: 'Return on Ad Spend (ROAS)',
          current: analysis.roas?.current || 0,
          target: thresholds.minROAS,
          unit: 'x',
          status: analysis.roas?.status || 'unknown',
          variance: analysis.roas?.variance || 0,
          trend: 'stable',
          importance: 'critical',
          description: 'Revenue generated for every pound spent on advertising'
        }
      ],

      kpiTrends: this.generateKPITrends(),
      
      benchmarkComparison: this.generateBenchmarkComparison(analysis)
    };
  }

  generateAgentActivityReport(agentStatuses) {
    return {
      agentSummary: this.getAgentStatusSummary(agentStatuses),
      
      agentPerformance: Object.keys(agentStatuses).map(agentName => {
        const status = agentStatuses[agentName];
        return {
          name: agentName,
          status: status.status,
          lastAction: status.lastAction,
          timestamp: status.timestamp,
          uptime: this.calculateAgentUptime(status),
          tasksCompleted: this.getAgentTasksCompleted(status),
          efficiency: this.calculateAgentEfficiency(status)
        };
      }),

      workflowStatus: this.getWorkflowStatus(agentStatuses),
      
      automationMetrics: {
        totalAutomatedActions: this.getTotalAutomatedActions(agentStatuses),
        successRate: this.getAutomationSuccessRate(agentStatuses),
        timesSaved: this.calculateTimeSaved(agentStatuses)
      }
    };
  }

  generateInsightsReport(performanceData) {
    const insights = [];
    const analysis = performanceData.analysis || {};
    const metrics = performanceData.metrics || {};

    // Performance insights
    if (analysis.overallScore) {
      if (analysis.overallScore > 80) {
        insights.push({
          type: 'positive',
          category: 'performance',
          title: 'Strong Campaign Performance',
          description: `Campaign is performing well with an overall score of ${analysis.overallScore}/100`,
          impact: 'high',
          actionable: false
        });
      } else if (analysis.overallScore < 50) {
        insights.push({
          type: 'negative',
          category: 'performance',
          title: 'Performance Below Expectations',
          description: `Campaign performance needs improvement (score: ${analysis.overallScore}/100)`,
          impact: 'high',
          actionable: true,
          suggestedActions: ['Review targeting', 'Optimize ad copy', 'Adjust bids']
        });
      }
    }

    // Cost efficiency insights
    if (metrics.CPA && metrics.CPA > config.kpiThresholds.maxCPA) {
      insights.push({
        type: 'warning',
        category: 'cost_efficiency',
        title: 'High Cost Per Acquisition',
        description: `CPA of £${metrics.CPA.toFixed(2)} exceeds target of £${config.kpiThresholds.maxCPA}`,
        impact: 'high',
        actionable: true,
        suggestedActions: ['Optimize targeting', 'Improve landing pages', 'Reduce bids on low-performing keywords']
      });
    }

    // Quality insights
    if (metrics.qualityScore && metrics.qualityScore < 6) {
      insights.push({
        type: 'warning',
        category: 'quality',
        title: 'Low Quality Score',
        description: `Quality score of ${metrics.qualityScore}/10 may be limiting ad performance`,
        impact: 'medium',
        actionable: true,
        suggestedActions: ['Improve ad relevance', 'Optimize landing pages', 'Refine keyword targeting']
      });
    }

    // Opportunity insights
    if (metrics.searchImpressionShare && metrics.searchImpressionShare < 50) {
      insights.push({
        type: 'opportunity',
        category: 'growth',
        title: 'Low Search Impression Share',
        description: `Only capturing ${metrics.searchImpressionShare}% of available impressions`,
        impact: 'medium',
        actionable: true,
        suggestedActions: ['Increase bids', 'Expand keyword targeting', 'Increase budget']
      });
    }

    return {
      totalInsights: insights.length,
      insights: insights,
      insightsByCategory: this.groupInsightsByCategory(insights),
      actionableInsights: insights.filter(i => i.actionable).length
    };
  }

  generateRecommendationsReport(performanceData) {
    const recommendations = [];
    const analysis = performanceData.analysis || {};
    const metrics = performanceData.metrics || {};

    // Priority recommendations based on performance
    if (analysis.topIssues && analysis.topIssues.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'performance_optimization',
        title: 'Address Critical Performance Issues',
        description: 'Multiple KPIs are underperforming and require immediate attention',
        estimatedImpact: 'high',
        timeToImplement: 'immediate',
        actions: analysis.topIssues.map(issue => ({
          action: issue.suggestion,
          metric: issue.metric,
          expectedImprovement: this.estimateImprovement(issue)
        }))
      });
    }

    // Budget optimization recommendations
    const budgetUtil = this.calculateBudgetUtilization(metrics.cost);
    if (budgetUtil.status === 'underspend' && analysis.overallScore > 70) {
      recommendations.push({
        priority: 'medium',
        category: 'budget_optimization',
        title: 'Increase Budget for Better Performance',
        description: 'Campaign is performing well but underspending budget',
        estimatedImpact: 'medium',
        timeToImplement: '1-2 days',
        actions: [
          { action: 'Increase daily budget by 20%', expectedImprovement: 'More conversions' },
          { action: 'Expand keyword targeting', expectedImprovement: 'Increased reach' }
        ]
      });
    }

    // Automation recommendations
    recommendations.push({
      priority: 'low',
      category: 'automation',
      title: 'Enhance Automation Rules',
      description: 'Implement additional automated optimizations',
      estimatedImpact: 'medium',
      timeToImplement: '3-5 days',
      actions: [
        { action: 'Set up automated bid adjustments', expectedImprovement: 'Better CPA management' },
        { action: 'Implement dayparting optimization', expectedImprovement: 'Improved efficiency' },
        { action: 'Add negative keyword automation', expectedImprovement: 'Reduced wasted spend' }
      ]
    });

    return {
      totalRecommendations: recommendations.length,
      recommendations: recommendations,
      recommendationsByPriority: this.groupRecommendationsByPriority(recommendations),
      estimatedTotalImpact: this.calculateTotalEstimatedImpact(recommendations)
    };
  }

  // Helper methods
  calculateChange(metric, currentValue) {
    // In a real implementation, this would compare with historical data
    // For now, return a simulated change
    const changes = [-15, -10, -5, 0, 5, 10, 15];
    return changes[Math.floor(Math.random() * changes.length)];
  }

  countKPIsMeetingTargets(analysis) {
    let count = 0;
    ['ctr', 'cpc', 'cpa', 'roas'].forEach(kpi => {
      if (analysis[kpi] && ['excellent', 'good', 'acceptable'].includes(analysis[kpi].status)) {
        count++;
      }
    });
    return count;
  }

  countCriticalKPIs(analysis) {
    let count = 0;
    ['ctr', 'cpc', 'cpa', 'roas'].forEach(kpi => {
      if (analysis[kpi] && analysis[kpi].status === 'critical') {
        count++;
      }
    });
    return count;
  }

  generateTimeSeriesData(metrics) {
    // Generate sample time series data for charts
    const timePoints = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      timePoints.push({
        date: date.toISOString().split('T')[0],
        impressions: Math.floor((metrics.impressions || 1000) * (0.8 + Math.random() * 0.4)),
        clicks: Math.floor((metrics.clicks || 50) * (0.8 + Math.random() * 0.4)),
        cost: Math.round((metrics.cost || 60) * (0.8 + Math.random() * 0.4) * 100) / 100,
        conversions: Math.floor((metrics.conversions || 3) * (0.8 + Math.random() * 0.4))
      });
    }
    
    return timePoints;
  }

  generateComparisonData(metrics) {
    // Generate comparison with industry benchmarks
    return {
      industry: 'Security Services',
      benchmarks: {
        ctr: { industry: 2.1, campaign: metrics.CTR || 0 },
        cpc: { industry: 1.85, campaign: metrics.CPC || 0 },
        cpa: { industry: 55, campaign: metrics.CPA || 0 },
        conversionRate: { industry: 2.3, campaign: metrics.conversionRate || 0 }
      }
    };
  }

  generateKPITrends() {
    // Generate sample trend data
    return {
      ctr: 'improving',
      cpc: 'stable',
      cpa: 'declining',
      roas: 'improving'
    };
  }

  generateBenchmarkComparison(analysis) {
    return {
      industryBenchmarks: {
        'Security Services': {
          avgCTR: 2.1,
          avgCPC: 1.85,
          avgCPA: 55,
          avgROAS: 2.8
        }
      },
      performanceVsBenchmark: {
        ctr: this.compareToBenchmark(analysis.ctr?.current, 2.1),
        cpc: this.compareToBenchmark(analysis.cpc?.current, 1.85),
        cpa: this.compareToBenchmark(analysis.cpa?.current, 55),
        roas: this.compareToBenchmark(analysis.roas?.current, 2.8)
      }
    };
  }

  compareToBenchmark(current, benchmark) {
    if (!current || !benchmark) return 'no_data';
    const ratio = current / benchmark;
    if (ratio > 1.1) return 'above_benchmark';
    if (ratio < 0.9) return 'below_benchmark';
    return 'at_benchmark';
  }

  calculateAgentUptime(status) {
    // Calculate uptime percentage (simplified)
    return Math.floor(Math.random() * 20) + 80; // 80-100%
  }

  getAgentTasksCompleted(status) {
    // Get number of tasks completed (simplified)
    return Math.floor(Math.random() * 50) + 10;
  }

  calculateAgentEfficiency(status) {
    // Calculate efficiency score (simplified)
    return Math.floor(Math.random() * 30) + 70; // 70-100%
  }

  getWorkflowStatus(agentStatuses) {
    const totalAgents = Object.keys(agentStatuses).length;
    const workingAgents = Object.values(agentStatuses).filter(s => s.status === 'working' || s.status === 'monitoring').length;
    const completedAgents = Object.values(agentStatuses).filter(s => s.status === 'completed').length;
    
    return {
      status: workingAgents > 0 ? 'active' : 'idle',
      progress: totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0,
      activeAgents: workingAgents,
      totalAgents: totalAgents
    };
  }

  getTotalAutomatedActions(agentStatuses) {
    // Count total automated actions (simplified)
    return Object.keys(agentStatuses).length * Math.floor(Math.random() * 10 + 5);
  }

  getAutomationSuccessRate(agentStatuses) {
    // Calculate success rate (simplified)
    const errorAgents = Object.values(agentStatuses).filter(s => s.status === 'error').length;
    const totalAgents = Object.keys(agentStatuses).length;
    return totalAgents > 0 ? Math.round(((totalAgents - errorAgents) / totalAgents) * 100) : 100;
  }

  calculateTimeSaved(agentStatuses) {
    // Estimate time saved through automation
    return `${Object.keys(agentStatuses).length * 2.5} hours/week`;
  }

  groupInsightsByCategory(insights) {
    return insights.reduce((groups, insight) => {
      if (!groups[insight.category]) groups[insight.category] = [];
      groups[insight.category].push(insight);
      return groups;
    }, {});
  }

  groupRecommendationsByPriority(recommendations) {
    return recommendations.reduce((groups, rec) => {
      if (!groups[rec.priority]) groups[rec.priority] = [];
      groups[rec.priority].push(rec);
      return groups;
    }, {});
  }

  calculateTotalEstimatedImpact(recommendations) {
    const impactScores = { high: 3, medium: 2, low: 1 };
    const totalScore = recommendations.reduce((sum, rec) => sum + (impactScores[rec.estimatedImpact] || 1), 0);
    const maxScore = recommendations.length * 3;
    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  }

  estimateImprovement(issue) {
    const improvements = {
      'CTR': '+0.5-1.0%',
      'CPC': '-10-20%',
      'CPA': '-15-25%',
      'ROAS': '+0.3-0.8x'
    };
    return improvements[issue.metric] || '+5-15%';
  }

  getReportPeriod() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      start: yesterday.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
      type: 'daily'
    };
  }

  updateDashboardData(report) {
    this.dashboardData = {
      lastUpdated: new Date().toISOString(),
      campaignStatus: report.executiveSummary.campaignHealth.status,
      KPIs: {
        CTR: report.executiveSummary.keyMetrics.currentCTR,
        CPC: report.executiveSummary.keyMetrics.currentCPC,
        CPA: report.executiveSummary.keyMetrics.currentCPA,
        ROAS: report.executiveSummary.keyMetrics.currentROAS
      },
      alerts: report.executiveSummary.criticalIssues.length,
      agentStatus: report.executiveSummary.agentStatus,
      budgetUtilization: report.executiveSummary.budgetUtilization,
      overallScore: report.performanceOverview.performanceAnalysis.overallScore
    };
  }

  getDashboardData() {
    return this.dashboardData;
  }

  cleanupOldReports() {
    // Keep only last 50 reports
    if (this.reports.length > 50) {
      this.reports = this.reports.slice(-50);
    }
  }

  getRecentReports(limit = 10) {
    return this.reports.slice(-limit).reverse();
  }

  getReportById(reportId) {
    return this.reports.find(report => report.id === reportId);
  }

  exportReport(reportId, format = 'json') {
    const report = this.getReportById(reportId);
    if (!report) return null;

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        return this.convertReportToCSV(report);
      default:
        return report;
    }
  }

  convertReportToCSV(report) {
    // Simple CSV conversion for key metrics
    const metrics = report.performanceOverview.currentMetrics;
    let csv = 'Metric,Value,Status,Target\n';
    
    Object.keys(metrics).forEach(key => {
      const metric = metrics[key];
      csv += `${key},${metric.value},${metric.status || 'N/A'},${metric.target || 'N/A'}\n`;
    });
    
    return csv;
  }

  getStatus() {
    return {
      agent: this.name,
      status: this.status,
      lastAction: this.lastAction,
      reportsGenerated: this.reports.length,
      lastReportGenerated: this.reports.length > 0 ? this.reports[this.reports.length - 1].generatedAt : null,
      dashboardLastUpdated: this.dashboardData.lastUpdated,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ReportingAgent;
