// Case Management System - Connected to Backend
class JudiciarySystem {
    constructor() {
        this.backendUrl = 'http://localhost:5000';
        this.cases = [];
        this.init();
    }

    async init() {
        await this.loadCasesFromBackend();
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        document.getElementById('caseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCase();
        });

        document.getElementById('searchInput').addEventListener('input', () => {
            this.searchCases();
        });
    }

    async loadCasesFromBackend() {
        try {
            const response = await fetch(`${this.backendUrl}/cases`);
            this.cases = await response.json();
            this.loadCases();
            console.log('✅ Loaded cases from backend');
        } catch (error) {
            console.log('❌ Backend not available, using local storage');
            this.cases = JSON.parse(localStorage.getItem('judiciaryCases')) || [];
            this.loadCases();
        }
    }

    async saveToBackend() {
        try {
            const response = await fetch(`${this.backendUrl}/cases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.cases)
            });
            
            const result = await response.json();
            console.log('✅ Saved to backend:', result);
        } catch (error) {
            console.log('❌ Backend save failed, using local storage');
            localStorage.setItem('judiciaryCases', JSON.stringify(this.cases));
        }
    }

    async addCase() {
        const caseData = {
            id: Date.now(),
            caseNumber: document.getElementById('caseNumber').value,
            type: document.getElementById('caseType').value,
            description: document.getElementById('caseDescription').value,
            severity: document.getElementById('severityLevel').value,
            status: document.getElementById('caseStatus').value,
            timestamp: new Date().toLocaleString(),
            solvedDate: null
        };

        this.cases.unshift(caseData);
        await this.saveToBackend();
        this.loadCases();
        this.updateStats();
        document.getElementById('caseForm').reset();
        
        this.showNotification('Case added successfully!', 'success');
    }

    loadCases() {
        const casesList = document.getElementById('casesList');
        casesList.innerHTML = '';

        if (this.cases.length === 0) {
            casesList.innerHTML = '<div class="case-item">No cases found. Add your first case above.</div>';
            return;
        }

        this.cases.forEach(caseItem => {
            const caseElement = this.createCaseElement(caseItem);
            casesList.appendChild(caseElement);
        });
    }

    createCaseElement(caseItem) {
        const div = document.createElement('div');
        div.className = `case-item ${caseItem.type.toLowerCase()} ${caseItem.status.toLowerCase()}`;
        
        div.innerHTML = `
            <div class="case-header">
                <span class="case-number">${caseItem.caseNumber}</span>
                <span class="case-type">${caseItem.type}</span>
                <span class="status-badge status-${caseItem.status.toLowerCase()}">${caseItem.status}</span>
            </div>
            <div class="case-description">${caseItem.description}</div>
            <div class="case-meta">
                <span>Severity: <strong>${caseItem.severity}</strong></span>
                <span>Filed: ${caseItem.timestamp}</span>
                ${caseItem.solvedDate ? `<span>Solved: ${caseItem.solvedDate}</span>` : ''}
            </div>
            <div class="case-actions">
                ${this.getActionButtons(caseItem)}
            </div>
        `;
        
        return div;
    }

    getActionButtons(caseItem) {
        let buttons = '';
        
        switch(caseItem.status) {
            case 'Pending':
                buttons = `
                    <button class="action-btn btn-activate" onclick="judiciarySystem.updateCaseStatus(${caseItem.id}, 'Active')">
                        Mark Active
                    </button>
                    <button class="action-btn btn-solve" onclick="judiciarySystem.updateCaseStatus(${caseItem.id}, 'Solved')">
                        Mark Solved
                    </button>
                `;
                break;
                
            case 'Active':
                buttons = `
                    <button class="action-btn btn-pending" onclick="judiciarySystem.updateCaseStatus(${caseItem.id}, 'Pending')">
                        Mark Pending
                    </button>
                    <button class="action-btn btn-solve" onclick="judiciarySystem.updateCaseStatus(${caseItem.id}, 'Solved')">
                        Mark Solved
                    </button>
                `;
                break;
                
            case 'Solved':
                buttons = `
                    <button class="action-btn btn-activate" onclick="judiciarySystem.updateCaseStatus(${caseItem.id}, 'Active')">
                        Reopen Case
                    </button>
                    <button class="action-btn btn-pending" onclick="judiciarySystem.updateCaseStatus(${caseItem.id}, 'Pending')">
                        Mark Pending
                    </button>
                `;
                break;
        }
        
        return buttons;
    }

    async updateCaseStatus(caseId, newStatus) {
        const caseIndex = this.cases.findIndex(c => c.id === caseId);
        
        if (caseIndex !== -1) {
            this.cases[caseIndex].status = newStatus;
            
            if (newStatus === 'Solved') {
                this.cases[caseIndex].solvedDate = new Date().toLocaleString();
            } else {
                this.cases[caseIndex].solvedDate = null;
            }
            
            await this.saveToBackend();
            this.loadCases();
            this.updateStats();
            
            this.showNotification(`Case marked as ${newStatus}`, 'success');
        }
    }

    searchCases() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const filteredCases = this.cases.filter(caseItem => 
            caseItem.caseNumber.toLowerCase().includes(query) ||
            caseItem.type.toLowerCase().includes(query) ||
            caseItem.description.toLowerCase().includes(query) ||
            caseItem.severity.toLowerCase().includes(query) ||
            caseItem.status.toLowerCase().includes(query)
        );

        this.displayFilteredCases(filteredCases);
    }

    displayFilteredCases(filteredCases) {
        const casesList = document.getElementById('casesList');
        casesList.innerHTML = '';

        if (filteredCases.length === 0) {
            casesList.innerHTML = '<div class="case-item">No cases match your search.</div>';
            return;
        }

        filteredCases.forEach(caseItem => {
            const caseElement = this.createCaseElement(caseItem);
            casesList.appendChild(caseElement);
        });
    }

    updateStats() {
        document.getElementById('totalCases').textContent = this.cases.length;
        
        const criminalCount = this.cases.filter(c => c.type === 'Criminal').length;
        const highSeverityCount = this.cases.filter(c => 
            ['High', 'Critical'].includes(c.severity)).length;
        
        const pendingCount = this.cases.filter(c => c.status === 'Pending').length;
        const activeCount = this.cases.filter(c => c.status === 'Active').length;
        const solvedCount = this.cases.filter(c => c.status === 'Solved').length;

        document.getElementById('criminalCount').textContent = criminalCount;
        document.getElementById('highSeverityCount').textContent = highSeverityCount;
        document.getElementById('pendingCount').textContent = pendingCount;

        this.updateStatsDisplay(pendingCount, activeCount, solvedCount);
    }

    updateStatsDisplay(pending, active, solved) {
        const statsContainer = document.querySelector('.stats');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>Pending Cases</h3>
                <span style="color: #f39c12;">${pending}</span>
            </div>
            <div class="stat-card">
                <h3>Active Cases</h3>
                <span style="color: #3498db;">${active}</span>
            </div>
            <div class="stat-card">
                <h3>Solved Cases</h3>
                <span style="color: #27ae60;">${solved}</span>
            </div>
        `;
    }

    async analyzeCases() {
        this.showNotification('Analyzing cases with AI...', 'info');
        
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const analysis = this.performAIAnalysis();
        this.displayAIAnalysis(analysis);
    }

    performAIAnalysis() {
        if (this.cases.length === 0) {
            return { error: "No cases to analyze" };
        }

        const criminalCases = this.cases.filter(c => c.type === 'Criminal');
        const highSeverityCases = this.cases.filter(c => 
            ['High', 'Critical'].includes(c.severity));
        
        const pendingCases = this.cases.filter(c => c.status === 'Pending');
        const activeCases = this.cases.filter(c => c.status === 'Active');
        const solvedCases = this.cases.filter(c => c.status === 'Solved');

        const caseTypes = {};
        this.cases.forEach(c => {
            caseTypes[c.type] = (caseTypes[c.type] || 0) + 1;
        });

        const mostCommonType = Object.keys(caseTypes).reduce((a, b) => 
            caseTypes[a] > caseTypes[b] ? a : b);

        const riskAssessment = this.cases.map(c => ({
            caseNumber: c.caseNumber,
            status: c.status,
            riskScore: this.calculateRiskScore(c),
            recommendation: this.generateRecommendation(c)
        }));

        return {
            totalCases: this.cases.length,
            criminalCaseCount: criminalCases.length,
            highRiskCases: highSeverityCases.length,
            pendingCases: pendingCases.length,
            activeCases: activeCases.length,
            solvedCases: solvedCases.length,
            mostCommonCaseType: mostCommonType,
            riskAssessment: riskAssessment,
            summary: this.generateSummary(this.cases)
        };
    }

    calculateRiskScore(caseItem) {
        let score = 0;
        
        if (caseItem.type === 'Criminal') score += 30;
        if (caseItem.type === 'Property') score += 20;
        
        if (caseItem.severity === 'Low') score += 10;
        if (caseItem.severity === 'Medium') score += 25;
        if (caseItem.severity === 'High') score += 50;
        if (caseItem.severity === 'Critical') score += 75;
        
        if (caseItem.status === 'Active') score += 10;
        if (caseItem.status === 'Solved') score -= 40;
        
        if (caseItem.description.length > 100) score += 15;
        
        return Math.min(Math.max(score, 0), 100);
    }

    generateRecommendation(caseItem) {
        const riskScore = this.calculateRiskScore(caseItem);
        
        if (caseItem.status === 'Solved') {
            return "Case Completed: No action needed";
        }
        
        if (riskScore >= 70) {
            return "Urgent: Immediate judicial attention required";
        } else if (riskScore >= 50) {
            return "High Priority: Schedule hearing within 2 weeks";
        } else if (riskScore >= 30) {
            return "Medium Priority: Normal scheduling";
        } else {
            return "Low Priority: Routine processing";
        }
    }

    generateSummary(cases) {
        if (cases.length === 0) return "No cases available for analysis";
        
        const avgRisk = cases.reduce((sum, c) => 
            sum + this.calculateRiskScore(c), 0) / cases.length;
        
        const pendingCount = cases.filter(c => c.status === 'Pending').length;
        const activeCount = cases.filter(c => c.status === 'Active').length;
        const solvedCount = cases.filter(c => c.status === 'Solved').length;
        
        return `System has ${cases.length} cases (${pendingCount} pending, ${activeCount} active, ${solvedCount} solved). 
                Average risk score: ${avgRisk.toFixed(1)}. 
                ${cases.filter(c => this.calculateRiskScore(c) > 60 && c.status !== 'Solved').length} cases require urgent attention.`;
    }

    displayAIAnalysis(analysis) {
        const analysisDiv = document.getElementById('aiAnalysis');
        const resultsDiv = document.getElementById('analysisResults');
        
        if (analysis.error) {
            resultsDiv.innerHTML = `<div class="analysis-item">${analysis.error}</div>`;
            analysisDiv.style.display = 'block';
            return;
        }

        let html = `
            <div class="analysis-item">
                <h4>📊 Case Statistics</h4>
                <p>Total Cases: ${analysis.totalCases}</p>
                <p>Pending: ${analysis.pendingCases} | Active: ${analysis.activeCases} | Solved: ${analysis.solvedCases}</p>
                <p>Criminal Cases: ${analysis.criminalCaseCount}</p>
                <p>High Risk Cases: ${analysis.highRiskCases}</p>
                <p>Most Common Type: ${analysis.mostCommonCaseType}</p>
            </div>
            
            <div class="analysis-item">
                <h4>📈 Risk Assessment</h4>
                ${analysis.riskAssessment.slice(0, 5).map(item => `
                    <p><strong>${item.caseNumber}</strong> [${item.status}]: 
                    Risk Score ${item.riskScore}/100 - ${item.recommendation}</p>
                `).join('')}
            </div>
            
            <div class="analysis-item">
                <h4>💡 Summary</h4>
                <p>${analysis.summary}</p>
            </div>
        `;

        resultsDiv.innerHTML = html;
        analysisDiv.style.display = 'block';
        this.showNotification('AI analysis completed!', 'success');
    }

    showNotification(message, type) {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize the system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.judiciarySystem = new JudiciarySystem();
});

// Global functions for HTML buttons
function searchCases() {
    window.judiciarySystem.searchCases();
}

function analyzeCases() {
    window.judiciarySystem.analyzeCases();
}
