// Dashboard JavaScript for Google Ads AI Automation System
class GoogleAdsDashboard {
    constructor() {
        this.isLoading = false;
        this.updateInterval = null;
        this.activityLog = [];
        this.chartData = {
            labels: [],
            datasets: []
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Google Ads AI Dashboard...');
        
        // Initialize dashboard
        this.setupEventListeners();
        this.initializeChart();
        this.loadInitialData();
        this.startAutoRefresh();
        
        // Hide loading overlay after initialization
        setTimeout(() => {
            this.hideLoading();
        }, 2000);
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Chart metric selector
        const chartMetric = document.getElementById('chartMetric');
        if (chartMetric) {
            chartMetric.addEventListener('change', (e) => this.updateChart(e.target.value));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.refreshData();
            }
        });

        // Window focus event to refresh data
        window.addEventListener('focus', () => {
            this.refreshData();
        });
    }

    async loadInitialData() {
        console.log('📊 Loading initial dashboard data...');
        
        try {
            // Simulate initial data load
            await this.fetchDashboardData();
            this.addActivity('System Initialized', 'Dashboard loaded successfully');
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.addActivity('System Error', 'Failed to load initial data');
        }
    }

    async fetchDashboardData() {
        try {
            // In a real implementation, this would fetch from the backend API
            // For now, we'll simulate the API response
            const response = await this.simulateAPICall('/api/campaign-status');
            
            if (response) {
                this.updateDashboard(response);
                this.updateLastUpdated();
            }
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            this.showError('Failed to fetch dashboard data');
        }
    }

    async simulateAPICall(endpoint) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Generate realistic simulated data
        return {
            campaignStatus: this.getRandomCampaignStatus(),
            KPIs: this.generateKPIData(),
            agents: this.generateAgentData(),
            budget: this.generateBudgetData(),
            alerts: this.generateAlerts(),
            performance: this.generatePerformanceData()
        };
    }

    getRandomCampaignStatus() {
        const statuses = ['excellent', 'good', 'needs_attention', 'critical'];
        const weights = [0.3, 0.4, 0.2, 0.1]; // Probability weights
        
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < statuses.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return statuses[i];
            }
        }
        
        return 'good';
    }

    generateKPIData() {
        // Generate realistic KPI data for security services
        const baseCTR = 2.1 + (Math.random() - 0.5) * 1.0; // 1.6% - 2.6%
        const baseCPC = 1.45 + (Math.random() - 0.5) * 0.6; // £1.15 - £1.75
        const baseCPA = 42.30 + (Math.random() - 0.5) * 20; // £32 - £52
        const baseROAS = 3.2 + (Math.random() - 0.5) * 1.0; // 2.7x - 3.7x
        
        return {
            CTR: `${baseCTR.toFixed(2)}%`,
            CPC: `£${baseCPC.toFixed(2)}`,
            CPA: `£${baseCPA.toFixed(2)}`,
            ROAS: `${baseROAS.toFixed(1)}x`
        };
    }

    generateAgentData() {
        const agents = [
            'campaignSetup',
            'keywordManager', 
            'adCopy',
            'bidOptimizer',
            'performanceMonitor',
            'reporting'
        ];
        
        const statuses = ['idle', 'working', 'completed', 'monitoring', 'error'];
        const agentData = {};
        
        agents.forEach(agent => {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            agentData[agent] = {
                status: status,
                lastAction: this.getAgentAction(agent, status),
                timestamp: new Date().toISOString()
            };
        });
        
        return agentData;
    }

    getAgentAction(agent, status) {
        const actions = {
            campaignSetup: {
                idle: 'Waiting for campaign setup request',
                working: 'Setting up new campaign structure',
                completed: 'Campaign setup completed successfully',
                monitoring: 'Monitoring campaign configuration',
                error: 'Failed to create campaign - API error'
            },
            keywordManager: {
                idle: 'No keyword optimization scheduled',
                working: 'Analyzing and expanding keyword list',
                completed: 'Optimized 47 keywords, added 12 negatives',
                monitoring: 'Monitoring keyword performance',
                error: 'Keyword analysis failed - insufficient data'
            },
            adCopy: {
                idle: 'Ready to generate ad variations',
                working: 'Generating AI-powered ad copy variations',
                completed: 'Generated 8 ad variations across 3 test groups',
                monitoring: 'Monitoring ad performance metrics',
                error: 'Ad generation failed - AI API timeout'
            },
            bidOptimizer: {
                idle: 'Bid optimization not required',
                working: 'Analyzing performance and adjusting bids',
                completed: 'Optimized bids for 15 keywords (-12% avg CPA)',
                monitoring: 'Continuous bid monitoring active',
                error: 'Bid adjustment failed - API rate limit'
            },
            performanceMonitor: {
                idle: 'Performance monitoring paused',
                working: 'Analyzing campaign performance metrics',
                completed: 'Performance analysis complete - 2 alerts generated',
                monitoring: 'Real-time performance monitoring active',
                error: 'Performance data fetch failed'
            },
            reporting: {
                idle: 'No reports scheduled',
                working: 'Generating comprehensive performance report',
                completed: 'Daily report generated and dashboard updated',
                monitoring: 'Monitoring for reporting triggers',
                error: 'Report generation failed - data incomplete'
            }
        };
        
        return actions[agent]?.[status] || 'No recent activity';
    }

    generateBudgetData() {
        const dailyBudget = 20.00;
        const currentSpend = Math.random() * dailyBudget * 1.2; // Can go slightly over
        const utilization = (currentSpend / dailyBudget) * 100;
        
        let status = 'on_track';
        if (utilization > 120) status = 'overspend';
        else if (utilization > 90) status = 'on_track_high';
        else if (utilization < 70) status = 'underspend';
        
        return {
            dailySpend: currentSpend.toFixed(2),
            dailyBudget: dailyBudget.toFixed(2),
            utilization: utilization.toFixed(1),
            status: status
        };
    }

    generateAlerts() {
        const alertCount = Math.floor(Math.random() * 4); // 0-3 alerts
        const alerts = [];
        
        const possibleAlerts = [
            'CPA above target threshold',
            'Low quality score detected',
            'Budget utilization high',
            'CTR below industry average',
            'Keyword performance declining'
        ];
        
        for (let i = 0; i < alertCount; i++) {
            alerts.push(possibleAlerts[i]);
        }
        
        return alerts;
    }

    generatePerformanceData() {
        const score = Math.floor(Math.random() * 40) + 60; // 60-100
        return {
            overallScore: score,
            grade: this.getPerformanceGrade(score)
        };
    }

    getPerformanceGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        return 'D';
    }

    updateDashboard(data) {
        console.log('📊 Updating dashboard with new data...');
        
        // Update campaign health
        this.updateCampaignHealth(data.campaignStatus);
        
        // Update KPIs
        this.updateKPIs(data.KPIs);
        
        // Update agent statuses
        this.updateAgentStatuses(data.agents);
        
        // Update budget information
        this.updateBudgetInfo(data.budget);
        
        // Update alerts
        this.updateAlerts(data.alerts);
        
        // Update performance score
        this.updatePerformanceScore(data.performance);
        
        // Update system status
        this.updateSystemStatus();
        
        // Add activity log entry
        this.addActivity('Data Updated', 'Dashboard refreshed with latest metrics');
    }

    updateCampaignHealth(status) {
        const healthElement = document.getElementById('campaignHealth');
        const indicator = healthElement?.querySelector('.health-indicator');
        const text = healthElement?.querySelector('.health-text');
        
        if (indicator && text) {
            // Remove existing classes
            indicator.className = 'health-indicator';
            
            // Add new status class
            indicator.classList.add(status);
            
            // Update text
            const statusTexts = {
                excellent: 'Excellent Performance',
                good: 'Good Performance', 
                needs_attention: 'Needs Attention',
                critical: 'Critical Issues'
            };
            
            text.textContent = statusTexts[status] || 'Unknown Status';
        }

        // Update campaign status card
        const statusCard = document.getElementById('campaignStatus');
        if (statusCard) {
            const statusValue = statusCard.querySelector('.status-value');
            const statusDesc = statusCard.querySelector('.status-description');
            
            if (statusValue) statusValue.textContent = statusTexts[status] || 'Unknown';
            if (statusDesc) {
                const descriptions = {
                    excellent: 'All metrics performing above targets',
                    good: 'Most metrics meeting expectations',
                    needs_attention: 'Some metrics require optimization',
                    critical: 'Multiple metrics below targets'
                };
                statusDesc.textContent = descriptions[status] || 'Status unknown';
            }
        }
    }

    updateKPIs(kpis) {
        // Update CTR
        this.updateKPI('ctr', kpis.CTR, 2.0, 'higher');
        
        // Update CPC
        this.updateKPI('cpc', kpis.CPC, 2.50, 'lower');
        
        // Update CPA
        this.updateKPI('cpa', kpis.CPA, 60.00, 'lower');
        
        // Update ROAS
        this.updateKPI('roas', kpis.ROAS, 2.0, 'higher');
    }

    updateKPI(kpiName, value, target, direction) {
        const valueElement = document.getElementById(`${kpiName}Value`);
        const statusElement = document.getElementById(`${kpiName}Status`);
        const changeElement = document.getElementById(`${kpiName}Change`);
        
        if (valueElement) {
            valueElement.textContent = value;
        }
        
        if (statusElement) {
            // Calculate status based on value vs target
            const numericValue = parseFloat(value.replace(/[£%x]/g, ''));
            const status = this.calculateKPIStatus(numericValue, target, direction);
            
            statusElement.className = `kpi-status ${status}`;
            statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }
        
        if (changeElement) {
            // Generate random change for demo
            const change = (Math.random() - 0.5) * 20; // -10% to +10%
            const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
            
            changeElement.className = `kpi-change ${changeClass}`;
            changeElement.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        }
    }

    calculateKPIStatus(value, target, direction) {
        const ratio = value / target;
        
        if (direction === 'higher') {
            if (ratio >= 1.2) return 'excellent';
            if (ratio >= 1.0) return 'good';
            if (ratio >= 0.8) return 'acceptable';
            if (ratio >= 0.6) return 'poor';
            return 'critical';
        } else {
            if (ratio <= 0.7) return 'excellent';
            if (ratio <= 0.9) return 'good';
            if (ratio <= 1.1) return 'acceptable';
            if (ratio <= 1.3) return 'poor';
            return 'critical';
        }
    }

    updateAgentStatuses(agents) {
        Object.keys(agents).forEach(agentKey => {
            const agentData = agents[agentKey];
            const agentCard = document.getElementById(`${agentKey}Agent`);
            
            if (agentCard) {
                const statusElement = agentCard.querySelector('.agent-status');
                const activityElement = agentCard.querySelector('.agent-activity');
                const timestampElement = agentCard.querySelector('.agent-timestamp');
                
                if (statusElement) {
                    statusElement.className = `agent-status ${agentData.status}`;
                    statusElement.textContent = agentData.status;
                }
                
                if (activityElement) {
                    activityElement.textContent = agentData.lastAction;
                }
                
                if (timestampElement) {
                    timestampElement.textContent = this.formatTimestamp(agentData.timestamp);
                }
            }
        });

        // Update workflow status
        this.updateWorkflowStatus(agents);
    }

    updateWorkflowStatus(agents) {
        const workflowStatus = document.getElementById('workflowStatus');
        if (!workflowStatus) return;
        
        const indicator = workflowStatus.querySelector('.workflow-indicator');
        const text = workflowStatus.querySelector('.workflow-text');
        
        // Check if any agents are working
        const workingAgents = Object.values(agents).filter(agent => 
            agent.status === 'working' || agent.status === 'monitoring'
        );
        
        if (workingAgents.length > 0) {
            indicator.className = 'workflow-indicator active';
            text.textContent = `Workflow Active (${workingAgents.length} agents)`;
        } else {
            indicator.className = 'workflow-indicator';
            text.textContent = 'Workflow Idle';
        }
    }

    updateBudgetInfo(budget) {
        const budgetInfo = document.getElementById('budgetInfo');
        if (!budgetInfo) return;
        
        const amountElement = budgetInfo.querySelector('.budget-amount');
        const progressElement = budgetInfo.querySelector('.budget-progress');
        const statusElement = budgetInfo.querySelector('.budget-status');
        
        if (amountElement) {
            amountElement.textContent = `£${budget.dailySpend} / £${budget.dailyBudget}`;
        }
        
        if (progressElement) {
            progressElement.style.width = `${Math.min(budget.utilization, 100)}%`;
            
            // Change color based on utilization
            if (budget.utilization > 100) {
                progressElement.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
            } else if (budget.utilization > 90) {
                progressElement.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
            } else {
                progressElement.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
            }
        }
        
        if (statusElement) {
            const statusTexts = {
                on_track: 'On track',
                on_track_high: 'High utilization',
                overspend: 'Over budget',
                underspend: 'Under budget'
            };
            statusElement.textContent = statusTexts[budget.status] || 'Unknown';
        }
    }

    updateAlerts(alerts) {
        const alertsInfo = document.getElementById('alertsInfo');
        if (!alertsInfo) return;
        
        const countElement = alertsInfo.querySelector('.alerts-count');
        const descElement = alertsInfo.querySelector('.alerts-description');
        
        if (countElement) {
            countElement.textContent = alerts.length;
        }
        
        if (descElement) {
            if (alerts.length === 0) {
                descElement.textContent = 'No active alerts';
            } else if (alerts.length === 1) {
                descElement.textContent = alerts[0];
            } else {
                descElement.textContent = `${alerts.length} active alerts`;
            }
        }
    }

    updatePerformanceScore(performance) {
        const scoreElement = document.getElementById('performanceScore');
        if (!scoreElement) return;
        
        const scoreValue = scoreElement.querySelector('.score-value');
        if (scoreValue) {
            scoreValue.textContent = `${performance.overallScore}/100`;
        }
    }

    updateSystemStatus() {
        const systemStatus = document.getElementById('systemStatus');
        if (!systemStatus) return;
        
        const statusText = systemStatus.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = 'System Active';
        }
    }

    updateLastUpdated() {
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) {
            const now = new Date();
            lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    addActivity(title, description) {
        const activity = {
            time: new Date().toLocaleTimeString(),
            title: title,
            description: description,
            timestamp: new Date().toISOString()
        };
        
        this.activityLog.unshift(activity);
        
        // Keep only last 20 activities
        if (this.activityLog.length > 20) {
            this.activityLog = this.activityLog.slice(0, 20);
        }
        
        this.updateActivityFeed();
    }

    updateActivityFeed() {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;
        
        activityFeed.innerHTML = '';
        
        this.activityLog.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item slide-in';
            
            activityItem.innerHTML = `
                <div class="activity-time">${activity.time}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
            `;
            
            activityFeed.appendChild(activityItem);
        });
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    async refreshData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            console.log('🔄 Refreshing dashboard data...');
            await this.fetchDashboardData();
            this.addActivity('Data Refresh', 'Manual refresh completed successfully');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.addActivity('Refresh Error', 'Failed to refresh dashboard data');
            this.showError('Failed to refresh data');
            
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.updateInterval = setInterval(() => {
            if (!this.isLoading) {
                this.fetchDashboardData();
            }
        }, 30000);
        
        console.log('🔄 Auto-refresh started (30 second intervals)');
    }

    stopAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('🛑 Auto-refresh stopped');
        }
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(message) {
        // Simple error notification
        console.error('Dashboard Error:', message);
        
        // You could implement a toast notification here
        this.addActivity('System Error', message);
    }

    initializeChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Simple chart implementation (you could use Chart.js for more advanced charts)
        this.drawSimpleChart(ctx, canvas.width, canvas.height);
    }

    drawSimpleChart(ctx, width, height) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Set up chart area
        const padding = 40;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);
        
        // Draw axes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        
        // Generate sample data points
        const dataPoints = 7;
        const data = [];
        for (let i = 0; i < dataPoints; i++) {
            data.push(Math.random() * 0.8 + 0.2); // Random values between 0.2 and 1.0
        }
        
        // Draw line chart
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < data.length; i++) {
            const x = padding + (i * chartWidth / (dataPoints - 1));
            const y = height - padding - (data[i] * chartHeight);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Draw data points
        ctx.fillStyle = '#3b82f6';
        for (let i = 0; i < data.length; i++) {
            const x = padding + (i * chartWidth / (dataPoints - 1));
            const y = height - padding - (data[i] * chartHeight);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Add labels
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        // X-axis labels (days)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        for (let i = 0; i < days.length; i++) {
            const x = padding + (i * chartWidth / (dataPoints - 1));
            ctx.fillText(days[i], x, height - 10);
        }
        
        // Chart title
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1e293b';
        ctx.fillText('Performance Trend (Last 7 Days)', width / 2, 20);
    }

    updateChart(metric) {
        // Update chart based on selected metric
        console.log(`📊 Updating chart for metric: ${metric}`);
        
        // Re-draw chart with new data
        this.initializeChart();
    }

    // Cleanup method
    destroy() {
        this.stopAutoRefresh();
        console.log('🧹 Dashboard cleanup completed');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new GoogleAdsDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.destroy();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleAdsDashboard;
}
