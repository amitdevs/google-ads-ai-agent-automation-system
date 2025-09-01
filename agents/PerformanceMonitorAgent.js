const config = require('../config/config');

class PerformanceMonitorAgent {
  constructor() {
    this.name = 'Performance Monitor Agent';
    this.status = 'idle';
    this.lastAction = null;
    this.monitoringActive = false;
    this.performanceHistory = [];
    this.alerts = [];
    this.thresholds = config.kpiThresholds;
  }

  async monitorCampaign(campaignId, campaignData = {}) {
    try {
      this.status = 'working';
      console.log(`[${this.name}] Starting performance monitoring for campaign ${campaignId}...`);

      // Fetch current performance metrics
      const currentMetrics = await this.fetchPerformanceMetrics(campaignId);
      
      // Analyze performance against thresholds
      const performanceAnalysis = this.analyzePerformanceMetrics(currentMetrics);
      
      // Check for performance issues and generate alerts
      const alerts = this.checkPerformanceAlerts(performanceAnalysis, campaignId);
      
      // Take automated actions if needed
      const actions = await this.executeAutomatedActions(performanceAnalysis, campaignId);
      
      // Record performance data
      this.recordPerformanceHistory(campaignId, currentMetrics, performanceAnalysis);

      this.status = 'monitoring';
      this.lastAction = `Monitored campaign ${campaignId} - ${alerts.length} alerts, ${actions.length} actions taken`;

      console.log(`[${this.name}] Performance monitoring completed`);
      console.log(`Current CTR: ${currentMetrics.CTR}%`);
      console.log(`Current CPA: £${currentMetrics.CPA}`);
      console.log(`Alerts generated: ${alerts.length}`);
      console.log(`Actions taken: ${actions.length}`);

      return {
        campaignId: campaignId,
        status: this.determineOverallStatus(performanceAnalysis),
        metrics: currentMetrics,
        analysis: performanceAnalysis,
        alerts: alerts,
        actions: actions,
        recommendations: this.generateRecommendations(performanceAnalysis),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.status = 'error';
      this.lastAction = `Error: ${error.message}`;
      console.error(`[${this.name}] Error monitoring campaign:`, error.message);
      throw error;
    }
  }

  async fetchPerformanceMetrics(campaignId) {
    console.log(`[${this.name}] Fetching performance metrics...`);
    
    // In a real implementation, this would call Google Ads API
    // For now, we'll simulate realistic performance data
    const simulatedMetrics = this.generateSimulatedMetrics(campaignId);
    
    // Add some realistic variation based on time and campaign age
    const timeVariation = this.applyTimeBasedVariation(simulatedMetrics);
    
    return timeVariation;
  }

  generateSimulatedMetrics(campaignId) {
    // Generate realistic metrics for a security services campaign
    const baseMetrics = {
      impressions: Math.floor(Math.random() * 5000) + 1000,
      clicks: 0,
      cost: 0,
      conversions: 0,
      CTR: 0,
      CPC: 0,
      CPA: 0,
      ROAS: 0,
      qualityScore: Math.floor(Math.random() * 4) + 6, // 6-10
      searchImpressionShare: Math.random() * 0.4 + 0.3, // 30-70%
      avgPosition: Math.random() * 2 + 1.5, // 1.5-3.5
      conversionRate: 0
    };

    // Calculate dependent metrics
    baseMetrics.CTR = (Math.random() * 0.04 + 0.015) * 100; // 1.5-5.5%
    baseMetrics.clicks = Math.floor(baseMetrics.impressions * (baseMetrics.CTR / 100));
    baseMetrics.CPC = Math.random() * 1.5 + 0.8; // £0.80-£2.30
    baseMetrics.cost = baseMetrics.clicks * baseMetrics.CPC;
    
    // Conversion metrics (security services typically have lower conversion rates)
    baseMetrics.conversionRate = (Math.random() * 0.03 + 0.01) * 100; // 1-4%
    baseMetrics.conversions = Math.floor(baseMetrics.clicks * (baseMetrics.conversionRate / 100));
    baseMetrics.CPA = baseMetrics.conversions > 0 ? baseMetrics.cost / baseMetrics.conversions : 0;
    
    // ROAS calculation (assuming average order value of £500 for security services)
    const avgOrderValue = 500;
    baseMetrics.ROAS = baseMetrics.conversions > 0 ? (baseMetrics.conversions * avgOrderValue) / baseMetrics.cost : 0;

    // Round values for realism
    baseMetrics.CTR = Math.round(baseMetrics.CTR * 100) / 100;
    baseMetrics.CPC = Math.round(baseMetrics.CPC * 100) / 100;
    baseMetrics.CPA = Math.round(baseMetrics.CPA * 100) / 100;
    baseMetrics.ROAS = Math.round(baseMetrics.ROAS * 100) / 100;
    baseMetrics.cost = Math.round(baseMetrics.cost * 100) / 100;
    baseMetrics.conversionRate = Math.round(baseMetrics.conversionRate * 100) / 100;
    baseMetrics.searchImpressionShare = Math.round(baseMetrics.searchImpressionShare * 100);
    baseMetrics.avgPosition = Math.round(baseMetrics.avgPosition * 10) / 10;

    return baseMetrics;
  }

  applyTimeBasedVariation(metrics) {
    const currentHour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Business hours boost (9 AM - 6 PM)
    if (currentHour >= 9 && currentHour <= 18) {
      metrics.impressions *= 1.3;
      metrics.CTR *= 1.1;
      metrics.conversionRate *= 1.2;
    }
    
    // Weekday vs weekend variation
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      metrics.impressions *= 1.2;
      metrics.conversionRate *= 1.15;
    }
    
    // Recalculate dependent metrics
    metrics.clicks = Math.floor(metrics.impressions * (metrics.CTR / 100));
    metrics.cost = metrics.clicks * metrics.CPC;
    metrics.conversions = Math.floor(metrics.clicks * (metrics.conversionRate / 100));
    metrics.CPA = metrics.conversions > 0 ? metrics.cost / metrics.conversions : 0;
    
    return metrics;
  }

  analyzePerformanceMetrics(metrics) {
    console.log(`[${this.name}] Analyzing performance metrics...`);
    
    const analysis = {
      ctr: this.analyzeMetric(metrics.CTR, this.thresholds.minCTR * 100, 'higher_better', 'CTR'),
      cpc: this.analyzeMetric(metrics.CPC, this.thresholds.maxCPC, 'lower_better', 'CPC'),
      cpa: this.analyzeMetric(metrics.CPA, this.thresholds.maxCPA, 'lower_better', 'CPA'),
      roas: this.analyzeMetric(metrics.ROAS, this.thresholds.minROAS, 'higher_better', 'ROAS'),
      qualityScore: this.analyzeMetric(metrics.qualityScore, this.thresholds.qualityScoreMin, 'higher_better', 'Quality Score'),
      conversionRate: this.analyzeMetric(metrics.conversionRate, 2.0, 'higher_better', 'Conversion Rate'), // 2% target
      searchImpressionShare: this.analyzeMetric(metrics.searchImpressionShare, 50, 'higher_better', 'Search Impression Share')
    };

    // Calculate overall performance score
    analysis.overallScore = this.calculateOverallScore(analysis);
    analysis.performanceGrade = this.getPerformanceGrade(analysis.overallScore);
    
    // Identify top issues
    analysis.topIssues = this.identifyTopIssues(analysis);
    
    // Performance trends (if historical data available)
    analysis.trends = this.calculateTrends(metrics);

    return analysis;
  }

  analyzeMetric(current, target, direction, metricName) {
    const analysis = {
      current: current,
      target: target,
      variance: this.calculateVariance(current, target),
      status: this.getMetricStatus(current, target, direction),
      direction: direction,
      metricName: metricName
    };

    // Add severity level
    analysis.severity = this.getMetricSeverity(analysis.status);
    
    // Add improvement suggestion
    analysis.suggestion = this.getImprovementSuggestion(analysis, metricName);

    return analysis;
  }

  getMetricStatus(current, target, direction) {
    if (!current || current === 0) return 'no_data';
    
    const ratio = current / target;
    
    if (direction === 'lower_better') {
      if (ratio <= 0.7) return 'excellent';
      if (ratio <= 0.9) return 'good';
      if (ratio <= 1.1) return 'acceptable';
      if (ratio <= 1.3) return 'poor';
      return 'critical';
    } else {
      if (ratio >= 1.5) return 'excellent';
      if (ratio >= 1.1) return 'good';
      if (ratio >= 0.9) return 'acceptable';
      if (ratio >= 0.7) return 'poor';
      return 'critical';
    }
  }

  getMetricSeverity(status) {
    const severityMap = {
      'excellent': 'low',
      'good': 'low',
      'acceptable': 'medium',
      'poor': 'high',
      'critical': 'critical',
      'no_data': 'medium'
    };
    return severityMap[status] || 'medium';
  }

  getImprovementSuggestion(analysis, metricName) {
    const { status, direction } = analysis;
    
    const suggestions = {
      'CTR': {
        'poor': 'Improve ad relevance, test new ad copy, refine keyword targeting',
        'critical': 'Urgent: Review ad copy quality, pause low-performing keywords, check landing page relevance'
      },
      'CPC': {
        'poor': 'Optimize bids, improve quality scores, add negative keywords',
        'critical': 'Urgent: Reduce bids, pause expensive keywords, improve ad relevance'
      },
      'CPA': {
        'poor': 'Optimize conversion tracking, improve landing pages, refine targeting',
        'critical': 'Urgent: Pause high-cost keywords, review conversion funnel, adjust bids'
      },
      'ROAS': {
        'poor': 'Focus on high-value keywords, improve conversion rates, optimize bids',
        'critical': 'Urgent: Pause unprofitable campaigns, review pricing strategy, improve targeting'
      },
      'Quality Score': {
        'poor': 'Improve ad relevance, optimize landing pages, refine keyword groups',
        'critical': 'Urgent: Rewrite ads, improve landing page experience, restructure campaigns'
      }
    };

    return suggestions[metricName]?.[status] || 'Monitor performance and optimize as needed';
  }

  calculateVariance(current, target) {
    if (!current || !target) return 0;
    return Math.round(((current - target) / target) * 100);
  }

  calculateOverallScore(analysis) {
    const weights = {
      ctr: 0.2,
      cpc: 0.15,
      cpa: 0.25,
      roas: 0.25,
      qualityScore: 0.1,
      conversionRate: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(weights).forEach(metric => {
      if (analysis[metric] && analysis[metric].status !== 'no_data') {
        const metricScore = this.getStatusScore(analysis[metric].status);
        totalScore += metricScore * weights[metric];
        totalWeight += weights[metric];
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  }

  getStatusScore(status) {
    const scoreMap = {
      'excellent': 100,
      'good': 80,
      'acceptable': 60,
      'poor': 30,
      'critical': 10,
      'no_data': 50
    };
    return scoreMap[status] || 50;
  }

  getPerformanceGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  identifyTopIssues(analysis) {
    const issues = [];
    
    Object.keys(analysis).forEach(metric => {
      if (analysis[metric].severity === 'critical' || analysis[metric].severity === 'high') {
        issues.push({
          metric: analysis[metric].metricName,
          severity: analysis[metric].severity,
          status: analysis[metric].status,
          current: analysis[metric].current,
          target: analysis[metric].target,
          suggestion: analysis[metric].suggestion
        });
      }
    });

    return issues.sort((a, b) => {
      const severityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  calculateTrends(currentMetrics) {
    // Calculate trends based on historical data
    const recentHistory = this.performanceHistory.slice(-5); // Last 5 data points
    
    if (recentHistory.length < 2) {
      return { message: 'Insufficient data for trend analysis' };
    }

    const trends = {};
    const metrics = ['CTR', 'CPC', 'CPA', 'ROAS', 'conversions'];
    
    metrics.forEach(metric => {
      const values = recentHistory.map(h => h.metrics[metric]).filter(v => v > 0);
      if (values.length >= 2) {
        const trend = this.calculateTrendDirection(values);
        trends[metric] = trend;
      }
    });

    return trends;
  }

  calculateTrendDirection(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3); // Last 3 values
    const older = values.slice(0, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  checkPerformanceAlerts(analysis, campaignId) {
    console.log(`[${this.name}] Checking for performance alerts...`);
    
    const alerts = [];
    
    // Critical performance alerts
    Object.keys(analysis).forEach(metric => {
      const metricData = analysis[metric];
      if (metricData.severity === 'critical') {
        alerts.push({
          id: `alert_${Date.now()}_${metric}`,
          type: 'critical_performance',
          metric: metricData.metricName,
          message: `Critical: ${metricData.metricName} is ${metricData.status} (${metricData.current} vs target ${metricData.target})`,
          severity: 'critical',
          campaignId: campaignId,
          suggestion: metricData.suggestion,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Budget alerts
    if (analysis.cpc && analysis.cpc.current > this.thresholds.maxCPC * 0.9) {
      alerts.push({
        id: `alert_${Date.now()}_budget`,
        type: 'budget_warning',
        message: `CPC approaching maximum threshold (£${analysis.cpc.current} vs £${this.thresholds.maxCPC})`,
        severity: 'high',
        campaignId: campaignId,
        timestamp: new Date().toISOString()
      });
    }

    // Quality score alerts
    if (analysis.qualityScore && analysis.qualityScore.current < 5) {
      alerts.push({
        id: `alert_${Date.now()}_quality`,
        type: 'quality_score',
        message: `Low quality score detected (${analysis.qualityScore.current}/10)`,
        severity: 'high',
        campaignId: campaignId,
        suggestion: 'Improve ad relevance and landing page experience',
        timestamp: new Date().toISOString()
      });
    }

    // Add alerts to history
    this.alerts.push(...alerts);
    
    return alerts;
  }

  async executeAutomatedActions(analysis, campaignId) {
    console.log(`[${this.name}] Executing automated actions...`);
    
    const actions = [];
    
    // Auto-pause if performance is critically poor for multiple metrics
    const criticalMetrics = Object.keys(analysis).filter(
      metric => analysis[metric].severity === 'critical'
    );
    
    if (criticalMetrics.length >= 2) {
      actions.push({
        type: 'pause_campaign',
        campaignId: campaignId,
        reason: `Multiple critical performance issues: ${criticalMetrics.join(', ')}`,
        timestamp: new Date().toISOString(),
        executed: false // Would be true after actual execution
      });
    }

    // Auto-adjust bids if CPA is too high
    if (analysis.cpa && analysis.cpa.severity === 'critical') {
      actions.push({
        type: 'reduce_bids',
        campaignId: campaignId,
        reason: `CPA too high (£${analysis.cpa.current} vs target £${analysis.cpa.target})`,
        adjustment: -0.20, // 20% reduction
        timestamp: new Date().toISOString(),
        executed: false
      });
    }

    // Auto-increase bids if performance is excellent and under budget
    if (analysis.overallScore > 85 && analysis.cpa && analysis.cpa.status === 'excellent') {
      actions.push({
        type: 'increase_bids',
        campaignId: campaignId,
        reason: 'Excellent performance with low CPA - opportunity to scale',
        adjustment: 0.15, // 15% increase
        timestamp: new Date().toISOString(),
        executed: false
      });
    }

    return actions;
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Priority recommendations based on analysis
    if (analysis.topIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'performance_issues',
        title: 'Address Critical Performance Issues',
        description: `Focus on improving: ${analysis.topIssues.map(i => i.metric).join(', ')}`,
        actions: analysis.topIssues.map(i => i.suggestion)
      });
    }

    // Optimization opportunities
    if (analysis.overallScore < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'optimization',
        title: 'Campaign Optimization Needed',
        description: 'Overall performance below target - comprehensive optimization required',
        actions: [
          'Review and optimize keyword targeting',
          'Test new ad copy variations',
          'Improve landing page experience',
          'Adjust bid strategy'
        ]
      });
    }

    // Scaling opportunities
    if (analysis.overallScore > 80 && analysis.roas && analysis.roas.status === 'excellent') {
      recommendations.push({
        priority: 'low',
        category: 'scaling',
        title: 'Scaling Opportunity',
        description: 'Strong performance indicates potential for increased investment',
        actions: [
          'Consider increasing daily budget',
          'Expand keyword targeting',
          'Test additional ad groups',
          'Explore new campaign types'
        ]
      });
    }

    return recommendations;
  }

  determineOverallStatus(analysis) {
    if (analysis.overallScore >= 80) return 'excellent';
    if (analysis.overallScore >= 60) return 'good';
    if (analysis.overallScore >= 40) return 'needs_attention';
    return 'critical';
  }

  recordPerformanceHistory(campaignId, metrics, analysis) {
    const historyEntry = {
      campaignId: campaignId,
      timestamp: new Date().toISOString(),
      metrics: metrics,
      analysis: analysis,
      overallScore: analysis.overallScore
    };
    
    this.performanceHistory.push(historyEntry);
    
    // Keep only last 100 entries
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
  }

  // Method to start continuous monitoring
  startContinuousMonitoring(campaignId, intervalMinutes = 5) {
    if (this.monitoringActive) {
      console.log(`[${this.name}] Monitoring already active`);
      return;
    }

    this.monitoringActive = true;
    console.log(`[${this.name}] Starting continuous monitoring every ${intervalMinutes} minutes`);

    const monitoringInterval = setInterval(async () => {
      if (!this.monitoringActive) {
        clearInterval(monitoringInterval);
        return;
      }

      try {
        await this.monitorCampaign(campaignId);
      } catch (error) {
        console.error(`[${this.name}] Error in continuous monitoring:`, error.message);
      }
    }, intervalMinutes * 60 * 1000);

    return monitoringInterval;
  }

  stopContinuousMonitoring() {
    this.monitoringActive = false;
    console.log(`[${this.name}] Continuous monitoring stopped`);
  }

  getStatus() {
    return {
      agent: this.name,
      status: this.status,
      lastAction: this.lastAction,
      monitoringActive: this.monitoringActive,
      performanceHistoryEntries: this.performanceHistory.length,
      activeAlerts: this.alerts.filter(alert => 
        new Date() - new Date(alert.timestamp) < 24 * 60 * 60 * 1000 // Last 24 hours
      ).length,
      timestamp: new Date().toISOString()
    };
  }

  // Method to get recent alerts
  getRecentAlerts(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => new Date(alert.timestamp) > cutoffTime);
  }

  // Method to get performance summary
  getPerformanceSummary(campaignId) {
    const recentHistory = this.performanceHistory
      .filter(entry => entry.campaignId === campaignId)
      .slice(-10); // Last 10 entries

    if (recentHistory.length === 0) {
      return { message: 'No performance data available' };
    }

    const latest = recentHistory[recentHistory.length - 1];
    const trends = this.calculateTrends(latest.metrics);

    return {
      currentPerformance: latest.analysis,
      trends: trends,
      recentAlerts: this.getRecentAlerts(24).filter(alert => alert.campaignId === campaignId),
      dataPoints: recentHistory.length
    };
  }
}

module.exports = PerformanceMonitorAgent;
