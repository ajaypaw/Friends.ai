import GeminiAI from './gemini-integration.js';
import config from './config.js';

class MoodTracker {
    constructor() {
        this.chart = null;
        this.geminiAI = new GeminiAI(config.geminiApiKey);
        
        // Test localStorage
        if (!this.testLocalStorage()) {
            alert('Warning: Local storage is not available. Mood history will not be saved.');
        }
        
        this.initializeChart();
        this.setupEventListeners();
        this.loadMoodHistory();
    }

    initializeChart() {
        const ctx = document.getElementById('moodChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Mood',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 1,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return ['', 'Awful', 'Bad', 'Okay', 'Good', 'Great'][value];
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    loadMoodHistory() {
        const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
        this.updateChartData(moodHistory);
        this.updateStats(moodHistory);
        this.displayMoodEntries(moodHistory);
    }

    updateChartData(moodHistory) {
        const last7Days = moodHistory.slice(-7);
        this.chart.data.labels = last7Days.map(entry => 
            new Date(entry.timestamp).toLocaleDateString()
        );
        this.chart.data.datasets[0].data = last7Days.map(entry => 
            parseInt(entry.value)
        );
        this.chart.update();
    }

    updateStats(moodHistory) {
        const weeklyAverage = document.getElementById('weeklyAverage');
        const commonMood = document.getElementById('commonMood');
        const totalEntries = document.getElementById('totalEntries');
        
        if (moodHistory.length > 0) {
            const last7Days = moodHistory.slice(-7);
            const avg = last7Days.reduce((sum, entry) => sum + parseInt(entry.value), 0) / last7Days.length;
            weeklyAverage.textContent = avg.toFixed(1) + '/5';

            const moodCounts = moodHistory.reduce((acc, entry) => {
                acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                return acc;
            }, {});
            const mostCommon = Object.entries(moodCounts)
                .sort((a, b) => b[1] - a[1])[0][0];
            commonMood.textContent = mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1);
            
            totalEntries.textContent = moodHistory.length;
        }
    }

    displayMoodEntries(moodHistory) {
        const entriesContainer = document.getElementById('moodEntries');
        entriesContainer.innerHTML = '';

        moodHistory.slice(-5).reverse().forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.className = 'mood-entry';
            entryElement.innerHTML = `
                <div class="mood-entry-header">
                    <span class="mood-emoji">${this.getMoodEmoji(entry.mood)}</span>
                    <span class="mood-date">${new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
                ${entry.notes ? `<p class="mood-notes-text">${entry.notes}</p>` : ''}
            `;
            entriesContainer.appendChild(entryElement);
        });
    }

    getMoodEmoji(mood) {
        const emojis = {
            'great': '😊',
            'good': '🙂',
            'okay': '😐',
            'bad': '😔',
            'awful': '😢'
        };
        return emojis[mood] || '😐';
    }

    async getAIAnalysis(moodData) {
        return await this.geminiAI.analyzeMoodAndSuggest(moodData.mood, moodData.notes);
    }

    getRecentMoodTrend() {
        const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
        return moodHistory.slice(-3).map(entry => entry.mood).join(', ');
    }

    async saveMoodEntry(selectedMood, notes) {
        try {
            console.log('Saving mood:', selectedMood, notes); // Debug log

            const moodData = {
                mood: selectedMood.mood,
                value: selectedMood.value,
                notes: notes,
                timestamp: new Date().toISOString()
            };

            // Get AI analysis
            console.log('Getting AI analysis...'); // Debug log
            const aiAnalysis = await this.getAIAnalysis(moodData);
            console.log('AI Analysis received:', aiAnalysis); // Debug log
            moodData.aiAnalysis = aiAnalysis;

            // Save to localStorage
            const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
            moodHistory.push(moodData);
            localStorage.setItem('moodHistory', JSON.stringify(moodHistory));
            console.log('Mood saved to localStorage:', moodData); // Debug log

            // Display AI insights
            this.displayAIInsights(aiAnalysis);
            
            // Update chart and stats
            this.updateChartData(moodHistory);
            this.updateStats(moodHistory);
            this.displayMoodEntries(moodHistory);

            return moodData;
        } catch (error) {
            console.error('Error saving mood:', error);
            throw error;
        }
    }

    displayAIInsights(analysis) {
        const insightsContainer = document.createElement('div');
        insightsContainer.className = 'ai-insights';
        insightsContainer.innerHTML = `
            <h3>AI Insights</h3>
            <p>${analysis}</p>
        `;

        // Find or create insights section
        let insightsSection = document.querySelector('.ai-insights');
        if (insightsSection) {
            insightsSection.replaceWith(insightsContainer);
        } else {
            document.querySelector('.mood-analytics').prepend(insightsContainer);
        }
    }

    setupEventListeners() {
        const moodButtons = document.querySelectorAll('.mood-btn');
        const moodNotes = document.getElementById('moodNotes');
        const saveMoodBtn = document.getElementById('saveMoodBtn');
        let selectedMood = null;

        moodButtons.forEach(button => {
            button.addEventListener('click', () => {
                moodButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                selectedMood = {
                    mood: button.dataset.mood,
                    value: parseInt(button.dataset.value)
                };
            });
        });

        saveMoodBtn.addEventListener('click', async () => {
            if (!selectedMood) {
                alert('Please select a mood first');
                return;
            }

            // Show loading state
            saveMoodBtn.disabled = true;
            saveMoodBtn.textContent = 'Saving...';

            try {
                console.log('Starting mood save...'); // Debug log
                await this.saveMoodEntry(selectedMood, moodNotes.value);
                console.log('Mood saved successfully'); // Debug log

                // Reset form
                moodButtons.forEach(btn => btn.classList.remove('active'));
                moodNotes.value = '';
                selectedMood = null;
            } catch (error) {
                console.error('Error in save button click:', error);
                alert('Error saving mood entry. Please try again.');
            } finally {
                saveMoodBtn.disabled = false;
                saveMoodBtn.textContent = 'Save Mood';
            }
        });
    }

    // Add this method to test localStorage
    testLocalStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            console.error('localStorage not available:', e);
            return false;
        }
    }
}

// Initialize mood tracker when document loads
document.addEventListener('DOMContentLoaded', () => {
    new MoodTracker();
}); 