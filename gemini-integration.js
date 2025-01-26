class GeminiAI {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    // Mood Analysis
    async analyzeMood(moodData, notes) {
        const prompt = `Analyze the following mood data and notes to provide personalized support:
            Mood: ${moodData}
            Notes: ${notes}`;
        return await this.generateResponse(prompt);
    }

    // Journal Analysis
    async analyzeJournalEntry(entry) {
        const prompt = `Analyze this journal entry and provide supportive insights:
            Entry: ${entry}`;
        return await this.generateResponse(prompt);
    }

    // Goal Planning Assistant
    async suggestGoalSteps(goal) {
        const prompt = `Help break down this goal into actionable steps:
            Goal: ${goal}`;
        return await this.generateResponse(prompt);
    }

    // Meditation Guide
    async generateMeditationScript(duration, type) {
        const prompt = `Create a gentle meditation script for:
            Duration: ${duration} minutes
            Type: ${type}`;
        return await this.generateResponse(prompt);
    }

    // Resource Recommendations
    async getResourceRecommendations(userState) {
        const prompt = `Suggest personalized mental health resources based on:
            Current State: ${userState}`;
        return await this.generateResponse(prompt);
    }

    // Main Gemini API call
    async generateResponse(prompt) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API call failed: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
        }
    }

    // Add new method for mood analysis
    async analyzeMoodAndSuggest(mood, notes = '') {
        const prompt = `As an AI wellness companion, analyze this mood data and provide:
        1. A brief empathetic response
        2. 2-3 personalized activity suggestions
        3. A relevant wellness tip
        
        User's mood: ${mood}
        ${notes ? `Additional context: ${notes}` : ''}
        
        Keep the total response under 150 words and format with clear sections.`;

        return await this.generateResponse(prompt);
    }
}

// Export the class
export default GeminiAI;

async function getMoodSuggestions(mood, notes = '') {
    try {
        const prompt = `As an AI wellness companion, provide 2-3 brief, personalized activity suggestions for someone feeling ${mood}. ${notes ? `Context about their mood: ${notes}` : ''} Keep suggestions practical, supportive, and under 100 words total.`;

        const result = await genAI.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error getting mood suggestions:', error);
        return 'I apologize, I cannot provide suggestions at the moment. Please try again later.';
    }
}

// Add event listeners for mood tracking
document.addEventListener('DOMContentLoaded', function() {
    const geminiAI = new GeminiAI(config.apiKey);
    const moodButtons = document.querySelectorAll('.mood-btn');
    const moodNotes = document.getElementById('moodNotes');
    const saveMoodBtn = document.getElementById('saveMoodBtn');
    const chatBox = document.getElementById('chatBox');

    // Track currently selected mood
    let currentMood = null;

    moodButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            moodButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            currentMood = this.dataset.mood;
        });
    });

    saveMoodBtn.addEventListener('click', async function() {
        if (!currentMood) {
            alert('Please select a mood first');
            return;
        }

        // Show loading state
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'message bot-message';
        loadingMessage.textContent = 'Analyzing your mood...';
        chatBox.appendChild(loadingMessage);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Get AI analysis and suggestions
        const analysis = await geminiAI.analyzeMoodAndSuggest(currentMood, moodNotes.value);

        // Remove loading message
        loadingMessage.remove();

        // Add user's mood entry to chat
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.textContent = `Mood: ${currentMood}${moodNotes.value ? '\nNotes: ' + moodNotes.value : ''}`;
        chatBox.appendChild(userMessage);

        // Add AI response to chat
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot-message';
        botMessage.textContent = analysis;
        chatBox.appendChild(botMessage);

        // Scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;

        // Store mood data
        const moodData = {
            mood: currentMood,
            notes: moodNotes.value,
            timestamp: new Date().toISOString(),
            analysis: analysis
        };
        const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
        moodHistory.push(moodData);
        localStorage.setItem('moodHistory', JSON.stringify(moodHistory));

        // Reset form
        moodButtons.forEach(btn => btn.classList.remove('active'));
        moodNotes.value = '';
        currentMood = null;
    });
});

// Add after GeminiAI class
class MoodTracker {
    constructor() {
        this.chart = null;
        this.initializeChart();
        this.setupEventListeners();
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
        this.updateChartData();
    }

    updateChartData() {
        const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
        const last7Days = moodHistory.slice(-7);

        this.chart.data.labels = last7Days.map(entry => 
            new Date(entry.timestamp).toLocaleDateString()
        );
        this.chart.data.datasets[0].data = last7Days.map(entry => 
            parseInt(entry.value)
        );
        this.chart.update();

        this.updateStats(moodHistory);
    }

    updateStats(moodHistory) {
        const weeklyAverage = document.getElementById('weeklyAverage');
        const commonMood = document.getElementById('commonMood');
        
        if (moodHistory.length > 0) {
            // Calculate weekly average
            const last7Days = moodHistory.slice(-7);
            const avg = last7Days.reduce((sum, entry) => sum + parseInt(entry.value), 0) / last7Days.length;
            weeklyAverage.textContent = avg.toFixed(1) + '/5';

            // Calculate most common mood
            const moodCounts = moodHistory.reduce((acc, entry) => {
                acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                return acc;
            }, {});
            const mostCommon = Object.entries(moodCounts)
                .sort((a, b) => b[1] - a[1])[0][0];
            commonMood.textContent = mostCommon.charAt(0).toUpperCase() + 
                                   mostCommon.slice(1);
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

        saveMoodBtn.addEventListener('click', () => {
            if (!selectedMood) {
                alert('Please select a mood first');
                return;
            }

            const moodData = {
                mood: selectedMood.mood,
                value: selectedMood.value,
                notes: moodNotes.value,
                timestamp: new Date().toISOString()
            };

            const moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');
            moodHistory.push(moodData);
            localStorage.setItem('moodHistory', JSON.stringify(moodHistory));

            this.updateChartData();

            // Reset form
            moodButtons.forEach(btn => btn.classList.remove('active'));
            moodNotes.value = '';
            selectedMood = null;
        });
    }
}

// Initialize mood tracker when document loads
document.addEventListener('DOMContentLoaded', () => {
    new MoodTracker();
});