import GeminiAI from './gemini-integration.js';
import config from './config.js';

class SelfCareManager {
    constructor() {
        this.geminiAI = new GeminiAI(config.geminiApiKey);
        this.displayLoadingState();
        this.loadSelfCareRecommendations();
        this.setupEventListeners();
    }

    async loadSelfCareRecommendations() {
        try {
            // Check cache first
            const cachedData = this.getCachedData();
            if (cachedData && this.isCacheValid(cachedData.timestamp)) {
                this.displayRecommendations(cachedData.analysis);
                this.displayDailyChallenge(cachedData.challenge);
                return;
            }

            // If no cache or expired, fetch new data
            const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
            const recentEntries = journalEntries.slice(-5);

            // Fetch analysis and challenge in parallel
            const [analysis, challenge] = await Promise.all([
                this.geminiAI.analyzeSelfCareNeeds(recentEntries),
                this.geminiAI.generateDailyChallenge(this.getRecentMoods(), this.getCompletedChallenges())
            ]);

            // Cache the results
            this.cacheData({ analysis, challenge });
            
            // Display results
            this.displayRecommendations(analysis);
            this.displayDailyChallenge(challenge);

        } catch (error) {
            console.error('Error loading self-care recommendations:', error);
            // Fallback to cached data if available
            const cachedData = this.getCachedData();
            if (cachedData) {
                this.displayRecommendations(cachedData.analysis);
                this.displayDailyChallenge(cachedData.challenge);
            }
        }
    }

    getCachedData() {
        return JSON.parse(localStorage.getItem('selfCareCache'));
    }

    cacheData(data) {
        localStorage.setItem('selfCareCache', JSON.stringify({
            ...data,
            timestamp: new Date().toISOString()
        }));
    }

    isCacheValid(timestamp) {
        // Cache valid for 24 hours
        const cacheAge = new Date() - new Date(timestamp);
        return cacheAge < 24 * 60 * 60 * 1000;
    }

    getCompletedChallenges() {
        return JSON.parse(localStorage.getItem('completedChallenges') || '[]');
    }

    displayRecommendations(analysis) {
        // Parse the AI response and distribute to different categories
        const categories = {
            emotional: document.getElementById('emotionalCare'),
            physical: document.getElementById('physicalCare'),
            mental: document.getElementById('mentalCare'),
            social: document.getElementById('socialCare')
        };

        // Clear existing content
        Object.values(categories).forEach(ul => ul.innerHTML = '');

        // Split analysis into sections and populate
        const sections = analysis.split(/\d\.\s+/);
        sections.forEach((section, index) => {
            if (section.trim()) {
                const categoryKey = Object.keys(categories)[index - 1];
                if (categoryKey) {
                    const suggestions = section.split('\n')
                        .filter(line => line.trim())
                        .map(suggestion => `<li class="care-item">${suggestion}</li>`)
                        .join('');
                    categories[categoryKey].innerHTML = suggestions;
                }
            }
        });
    }

    displayDailyChallenge(challenge) {
        const stepsContainer = document.getElementById('challengeSteps');
        const steps = this.extractSteps(challenge);
        
        stepsContainer.innerHTML = steps.map((step, index) => `
            <div class="challenge-step-item" data-step-id="${index}">
                <input type="checkbox" class="step-checkbox">
                <span class="step-text">${step}</span>
                <button class="step-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    extractSteps(challenge) {
        // Extract numbered steps from the challenge text
        return challenge.split('\n')
            .filter(line => /^\d+\./.test(line))
            .map(line => line.replace(/^\d+\.\s*/, '').trim());
    }

    toggleStepCompletion(checkbox) {
        const stepItem = checkbox.closest('.challenge-step-item');
        stepItem.classList.toggle('completed', checkbox.checked);
        
        // Check if all steps are completed
        const allSteps = document.querySelectorAll('.step-checkbox');
        const allCompleted = Array.from(allSteps).every(cb => cb.checked);
        
        if (allCompleted) {
            this.handleChallengeCompletion();
        }
    }

    deleteStep(stepItem) {
        stepItem.remove();
        // If no steps remain, generate new challenge
        if (document.querySelectorAll('.challenge-step-item').length === 0) {
            this.generateNewChallenge();
        }
    }

    handleChallengeCompletion() {
        const completed = JSON.parse(localStorage.getItem('completedChallenges') || '[]');
        completed.push({
            date: new Date().toISOString(),
            steps: Array.from(document.querySelectorAll('.challenge-step-item'))
                .map(item => item.querySelector('.step-text').textContent)
        });
        localStorage.setItem('completedChallenges', JSON.stringify(completed));
    }

    getRecentMoods() {
        const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
        return moodHistory.slice(-3).map(entry => entry.mood).join(', ');
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generateNewChallenge');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateNewChallenge());
        }

        // Listen for step completion and deletion
        const challengeSteps = document.getElementById('challengeSteps');
        if (challengeSteps) {
            challengeSteps.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    this.toggleStepCompletion(e.target);
                }
            });

            challengeSteps.addEventListener('click', (e) => {
                if (e.target.classList.contains('step-delete')) {
                    this.deleteStep(e.target.closest('.challenge-step-item'));
                }
            });
        }
    }

    async generateNewChallenge() {
        try {
            const recentMoods = this.getRecentMoods();
            const completedChallenges = this.getCompletedChallenges();
            const challenge = await this.geminiAI.generateDailyChallenge(recentMoods, completedChallenges);
            this.displayDailyChallenge(challenge);
        } catch (error) {
            console.error('Error generating new challenge:', error);
        }
    }

    displayLoadingState() {
        const categories = ['emotional', 'physical', 'mental', 'social'];
        categories.forEach(category => {
            document.getElementById(`${category}Care`).innerHTML = `
                <li class="care-item loading">
                    <div class="loading-shimmer"></div>
                </li>
            `.repeat(3);
        });

        document.getElementById('dailyChallenge').innerHTML = `
            <div class="challenge-title loading">
                <div class="loading-shimmer"></div>
            </div>
            <div class="challenge-text loading">
                <div class="loading-shimmer"></div>
            </div>
        `;
    }
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    new SelfCareManager();
}); 