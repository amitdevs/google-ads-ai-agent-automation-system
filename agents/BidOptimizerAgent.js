const config = require('../config/config');

class BidOptimizerAgent {
  constructor() {
    this.name = 'Bid Optimizer Agent';
    this.status = 'idle';
    this.lastAction = null;
    this.bidHistory = [];
    this.optimizationRules = this.initializeOptimizationRules();
  }

  async adjustBids(campaignId, performanceMetrics, keywords = []) {
    try {
      this.status = 'working';
      console.log(`[${this.name}] Starting bid optimization for campaign ${campaignId}...`);

      // Analyze current performance against targets
      const performanceAnalysis = this.analyzePerformance(performanceMetrics);
      
      // Calculate bid adjustments based on performance
      const bidAdjustments = await this.calculateBidAdjustments(performanceAnalysis, keywords);
      
      // Apply bid optimization rules
      const optimizedBids = this.applyOptimizationRules(bidAdjustments, performanceMetrics);
      
      // Validate bid changes are within acceptable limits
      const validatedBids = this.validateBidChanges(optimizedBids);
      
      // Record bid changes for analysis
      this.recordBidHistory(campaignId, validatedBids, performanceMetrics);

      this.status = 'completed';
      this.lastAction = `Optimized ${validatedBids.length} bids based on performance data`;

      console.log(`[${this.name}] Bid optimization completed`);
      console.log(`Bid adjustments made: ${validatedBids.length}`);
      console.log(`Average bid change: ${this.calculateAverageBidChange(validatedBids)}%`);

      return {
        bidAdjustments: validatedBids,
        performanceAnalysis: performanceAnalysis,
        summary: {
          totalAdjustments: validatedBids.length,
          averageChange: this.calculateAverageBidChange(validatedBids),
          reasoning: this.getBidReasoningSummary(validatedBids)
        }
      };

    } catch (error) {
      this.status = 'error';
      this.lastAction = `Error: ${error.message}`;
      console.error(`[${this.name}] Error optimizing bids:`, error.message);
      throw error;
    }
  }

  initializeOptimizationRules() {
    const thresholds = config.kpiThresholds;
    
    return {
      // CPA-based rules
      cpa: {
        increase_bid: {
          condition: (metrics) => metrics.CPA < thresholds.maxCPA * 0.7,
          adjustment: 0.15, // 15% increase
          reason: 'CPA well below target - increasing bid to capture more volume'
        },
        decrease_bid: {
          condition: (metrics) => metrics.CPA > thresholds.maxCPA,
          adjustment: -0.20, // 20% decrease
          reason: 'CPA above target - decreasing bid to improve efficiency'
        }
      },
      
      // CTR-based rules
      ctr: {
        increase_bid: {
          condition: (metrics) => metrics.CTR > thresholds.minCTR * 2,
          adjustment: 0.10, // 10% increase
          reason: 'High CTR indicates strong relevance - increasing bid'
        },
        decrease_bid: {
          condition: (metrics) => metrics.CTR < thresholds.minCTR,
          adjustment: -0.15, // 15% decrease
          reason: 'Low CTR indicates poor relevance - decreasing bid'
        }
      },
      
      // ROAS-based rules
      roas: {
        increase_bid: {
          condition: (metrics) => metrics.ROAS > thresholds.minROAS * 1.5,
          adjustment: 0.12, // 12% increase
          reason: 'Excellent ROAS - increasing bid to maximize profitable traffic'
        },
        decrease_bid: {
          condition: (metrics) => metrics.ROAS < thresholds.minROAS,
          adjustment: -0.18, // 18% decrease
          reason: 'Poor ROAS - decreasing bid to improve profitability'
        }
      },
      
      // Quality Score rules
      qualityScore: {
        increase_bid: {
          condition: (metrics) => metrics.qualityScore >= 8,
          adjustment: 0.08, // 8% increase
          reason: 'High quality score - can afford higher bids'
        },
        decrease_bid: {
          condition: (metrics) => metrics.qualityScore <= 4,
          adjustment: -0.12, // 12% decrease
          reason: 'Low quality score - reducing bid until improved'
        }
      },
      
      // Conversion rate rules
      conversionRate: {
        increase_bid: {
          condition: (metrics) => metrics.conversionRate > 0.05, // 5%+
          adjustment: 0.10,
          reason: 'High conversion rate - increasing bid for more traffic'
        },
        decrease_bid: {
          condition: (metrics) => metrics.conversionRate < 0.01, // <1%
          adjustment: -0.15,
          reason: 'Low conversion rate - decreasing bid'
        }
      }
    };
  }

  analyzePerformance(metrics) {
    const thresholds = config.kpiThresholds;
    
    const analysis = {
      cpa: {
        current: metrics.CPA || 0,
        target: thresholds.maxCPA,
        status: this.getPerformanceStatus(metrics.CPA, thresholds.maxCPA, 'lower_better'),
        variance: this.calculateVariance(metrics.CPA, thresholds.maxCPA)
      },
      ctr: {
        current: metrics.CTR || 0,
        target: thresholds.minCTR,
        status: this.getPerformanceStatus(metrics.CTR, thresholds.minCTR, 'higher_better'),
        variance: this.calculateVariance(metrics.CTR, thresholds.minCTR)
      },
      roas: {
        current: metrics.ROAS || 0,
        target: thresholds.minROAS,
        status: this.getPerformanceStatus(metrics.ROAS, thresholds.minROAS, 'higher_better'),
        variance: this.calculateVariance(metrics.ROAS, thresholds.minROAS)
      },
      cpc: {
        current: metrics.CPC || 0,
        target: thresholds.maxCPC,
        status: this.getPerformanceStatus(metrics.CPC, thresholds.maxCPC, 'lower_better'),
        variance: this.calculateVariance(metrics.CPC, thresholds.maxCPC)
      }
    };

    // Overall performance score (0-100)
    analysis.overallScore = this.calculateOverallPerformanceScore(analysis);
    
    return analysis;
  }

  getPerformanceStatus(current, target, direction) {
    if (!current || current === 0) return 'no_data';
    
    const ratio = current / target;
    
    if (direction === 'lower_better') {
      if (ratio <= 0.8) return 'excellent';
      if (ratio <= 1.0) return 'good';
      if (ratio <= 1.2) return 'poor';
      return 'critical';
    } else {
      if (ratio >= 1.5) return 'excellent';
      if (ratio >= 1.0) return 'good';
      if (ratio >= 0.8) return 'poor';
      return 'critical';
    }
  }

  calculateVariance(current, target) {
    if (!current || !target) return 0;
    return ((current - target) / target) * 100;
  }

  calculateOverallPerformanceScore(analysis) {
    let score = 0;
    let factors = 0;
    
    Object.keys(analysis).forEach(metric => {
      if (analysis[metric].status) {
        factors++;
        switch (analysis[metric].status) {
          case 'excellent': score += 100; break;
          case 'good': score += 75; break;
          case 'poor': score += 40; break;
          case 'critical': score += 10; break;
          default: score += 50; break;
        }
      }
    });
    
    return factors > 0 ? Math.round(score / factors) : 50;
  }

  async calculateBidAdjustments(performanceAnalysis, keywords) {
    console.log(`[${this.name}] Calculating bid adjustments...`);
    
    const bidAdjustments = [];
    
    // If no keywords provided, create a general campaign-level adjustment
    if (!keywords || keywords.length === 0) {
      const generalAdjustment = this.calculateGeneralBidAdjustment(performanceAnalysis);
      if (generalAdjustment) {
        bidAdjustments.push(generalAdjustment);
      }
    } else {
      // Calculate keyword-specific adjustments
      keywords.forEach(keyword => {
        const keywordMetrics = this.getKeywordMetrics(keyword, performanceAnalysis);
        const adjustment = this.calculateKeywordBidAdjustment(keyword, keywordMetrics);
        if (adjustment) {
          bidAdjustments.push(adjustment);
        }
      });
    }
    
    return bidAdjustments;
  }

  calculateGeneralBidAdjustment(performanceAnalysis) {
    const currentBid = 1.50; // Default current bid
    let totalAdjustment = 0;
    let adjustmentReasons = [];
    
    // Apply optimization rules
    Object.keys(this.optimizationRules).forEach(ruleCategory => {
      const rules = this.optimizationRules[ruleCategory];
      const metrics = this.createMetricsFromAnalysis(performanceAnalysis);
      
      Object.keys(rules).forEach(ruleType => {
        const rule = rules[ruleType];
        if (rule.condition(metrics)) {
          totalAdjustment += rule.adjustment;
          adjustmentReasons.push(rule.reason);
        }
      });
    });
    
    // Cap total adjustment to prevent extreme changes
    totalAdjustment = Math.max(-0.5, Math.min(0.5, totalAdjustment)); // Max ±50%
    
    if (Math.abs(totalAdjustment) < 0.05) return null; // Skip small adjustments
    
    const newBid = Math.max(0.10, currentBid * (1 + totalAdjustment));
    
    return {
      type: 'campaign',
      target: 'campaign_level',
      currentBid: currentBid,
      newBid: Math.round(newBid * 100) / 100,
      adjustment: totalAdjustment,
      adjustmentPercent: Math.round(totalAdjustment * 100),
      reasons: adjustmentReasons,
      timestamp: new Date().toISOString()
    };
  }

  calculateKeywordBidAdjustment(keyword, keywordMetrics) {
    const currentBid = keyword.suggestedBid || keyword.estimatedCPC || 1.20;
    let adjustment = 0;
    let reasons = [];
    
    // Keyword-specific logic
    if (keywordMetrics.conversions > 0) {
      const conversionRate = keywordMetrics.conversions / keywordMetrics.clicks;
      if (conversionRate > 0.05) {
        adjustment += 0.15;
        reasons.push('High conversion rate');
      } else if (conversionRate < 0.01) {
        adjustment -= 0.10;
        reasons.push('Low conversion rate');
      }
    }
    
    // CTR-based adjustments
    if (keywordMetrics.CTR > 0.03) {
      adjustment += 0.10;
      reasons.push('Above average CTR');
    } else if (keywordMetrics.CTR < 0.015) {
      adjustment -= 0.08;
      reasons.push('Below average CTR');
    }
    
    // Competition-based adjustments
    if (keyword.competition === 'HIGH') {
      adjustment += 0.05;
      reasons.push('High competition keyword');
    } else if (keyword.competition === 'LOW') {
      adjustment -= 0.03;
      reasons.push('Low competition keyword');
    }
    
    if (Math.abs(adjustment) < 0.05) return null;
    
    const newBid = Math.max(0.10, currentBid * (1 + adjustment));
    
    return {
      type: 'keyword',
      target: keyword.keyword || keyword,
      currentBid: currentBid,
      newBid: Math.round(newBid * 100) / 100,
      adjustment: adjustment,
      adjustmentPercent: Math.round(adjustment * 100),
      reasons: reasons,
      timestamp: new Date().toISOString()
    };
  }

  getKeywordMetrics(keyword, performanceAnalysis) {
    // In a real implementation, this would fetch keyword-specific metrics
    // For now, we'll use campaign-level metrics with some variation
    return {
      CTR: (performanceAnalysis.ctr.current || 0.02) * (0.8 + Math.random() * 0.4),
      CPC: (performanceAnalysis.cpc.current || 1.20) * (0.9 + Math.random() * 0.2),
      conversions: Math.floor(Math.random() * 5),
      clicks: Math.floor(Math.random() * 100) + 10,
      impressions: Math.floor(Math.random() * 1000) + 100
    };
  }

  createMetricsFromAnalysis(analysis) {
    return {
      CPA: analysis.cpa.current,
      CTR: analysis.ctr.current,
      ROAS: analysis.roas.current,
      CPC: analysis.cpc.current,
      qualityScore: 7, // Default quality score
      conversionRate: 0.025 // Default conversion rate
    };
  }

  applyOptimizationRules(bidAdjustments, performanceMetrics) {
    console.log(`[${this.name}] Applying optimization rules...`);
    
    return bidAdjustments.map(adjustment => {
      // Apply additional business rules
      
      // Don't bid above maximum CPC threshold
      if (adjustment.newBid > config.kpiThresholds.maxCPC) {
        adjustment.newBid = config.kpiThresholds.maxCPC;
        adjustment.reasons.push(`Capped at max CPC (£${config.kpiThresholds.maxCPC})`);
      }
      
      // Don't bid below minimum viable bid
      if (adjustment.newBid < 0.20) {
        adjustment.newBid = 0.20;
        adjustment.reasons.push('Set to minimum viable bid');
      }
      
      // Time-based adjustments (business hours)
      const currentHour = new Date().getHours();
      if (currentHour >= 9 && currentHour <= 17) {
        adjustment.newBid *= 1.1; // 10% increase during business hours
        adjustment.reasons.push('Business hours boost');
      }
      
      // Day of week adjustments
      const dayOfWeek = new Date().getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        adjustment.newBid *= 1.05; // 5% increase on weekdays
        adjustment.reasons.push('Weekday boost');
      }
      
      return adjustment;
    });
  }

  validateBidChanges(bidAdjustments) {
    console.log(`[${this.name}] Validating bid changes...`);
    
    return bidAdjustments.filter(adjustment => {
      // Skip if change is too small
      if (Math.abs(adjustment.adjustmentPercent) < 5) {
        return false;
      }
      
      // Skip if new bid is unreasonable
      if (adjustment.newBid < 0.10 || adjustment.newBid > 10.00) {
        return false;
      }
      
      // Skip if change is too extreme (more than 100% change)
      if (Math.abs(adjustment.adjustment) > 1.0) {
        return false;
      }
      
      return true;
    });
  }

  recordBidHistory(campaignId, bidAdjustments, performanceMetrics) {
    const historyEntry = {
      campaignId: campaignId,
      timestamp: new Date().toISOString(),
      adjustments: bidAdjustments,
      performanceMetrics: performanceMetrics,
      totalAdjustments: bidAdjustments.length
    };
    
    this.bidHistory.push(historyEntry);
    
    // Keep only last 100 entries
    if (this.bidHistory.length > 100) {
      this.bidHistory = this.bidHistory.slice(-100);
    }
  }

  calculateAverageBidChange(bidAdjustments) {
    if (bidAdjustments.length === 0) return 0;
    
    const totalChange = bidAdjustments.reduce((sum, adj) => sum + Math.abs(adj.adjustmentPercent), 0);
    return Math.round(totalChange / bidAdjustments.length);
  }

  getBidReasoningSummary(bidAdjustments) {
    const reasonCounts = {};
    
    bidAdjustments.forEach(adj => {
      adj.reasons.forEach(reason => {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    });
    
    return Object.keys(reasonCounts)
      .sort((a, b) => reasonCounts[b] - reasonCounts[a])
      .slice(0, 5) // Top 5 reasons
      .map(reason => ({ reason, count: reasonCounts[reason] }));
  }

  // Method to get bid recommendations without applying them
  getBidRecommendations(performanceMetrics, keywords = []) {
    const performanceAnalysis = this.analyzePerformance(performanceMetrics);
    const recommendations = [];
    
    // Generate recommendations similar to adjustBids but without applying
    if (keywords.length === 0) {
      const generalRec = this.calculateGeneralBidAdjustment(performanceAnalysis);
      if (generalRec) recommendations.push(generalRec);
    } else {
      keywords.forEach(keyword => {
        const keywordMetrics = this.getKeywordMetrics(keyword, performanceAnalysis);
        const rec = this.calculateKeywordBidAdjustment(keyword, keywordMetrics);
        if (rec) recommendations.push(rec);
      });
    }
    
    return {
      recommendations: recommendations,
      performanceAnalysis: performanceAnalysis,
      summary: `${recommendations.length} bid optimization opportunities identified`
    };
  }

  getStatus() {
    return {
      agent: this.name,
      status: this.status,
      lastAction: this.lastAction,
      bidHistoryEntries: this.bidHistory.length,
      lastOptimization: this.bidHistory.length > 0 ? this.bidHistory[this.bidHistory.length - 1].timestamp : null,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BidOptimizerAgent;
