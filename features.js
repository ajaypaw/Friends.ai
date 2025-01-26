class FeatureManager {
    constructor() {
        this.initializeFeatures();
    }

    initializeFeatures() {
        this.initializeMoodTracker();
        this.initializeJournal();
        this.initializeMeditation();
        this.initializeGoals();
        this.initializeTabs();
    }

    // Mood Tracker
    initializeMoodTracker() {
        const moodButtons = document.querySelectorAll('.mood-btn');
        const moodNotes = document.getElementById('moodNotes');
        const saveMoodBtn = document.getElementById('saveMoodBtn');
        let selectedMood = null;

        moodButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all mood buttons
                moodButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
                selectedMood = button.getAttribute('data-mood');
            });
        });

        saveMoodBtn.addEventListener('click', async () => {
            if (!selectedMood) {
                alert('Please select a mood first!');
                return;
            }

            const moodData = {
                mood: selectedMood,
                notes: moodNotes.value,
                timestamp: new Date().toISOString()
            };

            // Store mood data in localStorage
            const moods = JSON.parse(localStorage.getItem('moods') || '[]');
            moods.push(moodData);
            localStorage.setItem('moods', JSON.stringify(moods));

            // Clear the form
            moodButtons.forEach(btn => btn.classList.remove('active'));
            moodNotes.value = '';
            selectedMood = null;

            alert('Mood saved successfully!');
        });
    }

    // Journal
    initializeJournal() {
        const journalEntry = document.getElementById('journalEntry');
        const saveJournalBtn = document.getElementById('saveJournalBtn');
        const journalHistory = document.querySelector('.journal-history');

        if (saveJournalBtn) {
            saveJournalBtn.addEventListener('click', () => {
                if (!journalEntry.value.trim()) {
                    alert('Please write something in your journal!');
                    return;
                }

                const entry = {
                    content: journalEntry.value,
                    timestamp: new Date().toISOString()
                };

                // Save to localStorage
                const entries = JSON.parse(localStorage.getItem('journal') || '[]');
                entries.push(entry);
                localStorage.setItem('journal', JSON.stringify(entries));

                // Clear the entry
                journalEntry.value = '';
                alert('Journal entry saved!');
            });
        }
    }

    // Meditation
    initializeMeditation() {
        const timerDisplay = document.querySelector('.timer-display');
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        const resetBtn = document.getElementById('resetTimer');
        let timer = null;
        let timeLeft = 300; // 5 minutes
        let isRunning = false;

        // Update timer display
        const updateDisplay = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        // Start timer
        startBtn.addEventListener('click', () => {
            if (!isRunning) {
                isRunning = true;
                timer = setInterval(() => {
                    if (timeLeft > 0) {
                        timeLeft--;
                        updateDisplay();
                        this.updateBreathingAnimation(timeLeft);
                    } else {
                        clearInterval(timer);
                        isRunning = false;
                        alert('Meditation session completed! 🌟');
                    }
                }, 1000);
            }
        });

        // Pause timer
        pauseBtn.addEventListener('click', () => {
            clearInterval(timer);
            isRunning = false;
        });

        // Reset timer
        resetBtn.addEventListener('click', () => {
            clearInterval(timer);
            isRunning = false;
            timeLeft = 300;
            updateDisplay();
            this.resetBreathingAnimation();
        });

        // Initialize breathing circle
        this.initializeBreathingCircle();
    }

    // Add breathing circle to meditation-timer div
    initializeBreathingCircle() {
        const meditationTimer = document.querySelector('.meditation-timer');
        const breathingCircle = document.createElement('div');
        breathingCircle.className = 'breathing-circle';
        breathingCircle.innerHTML = '<div class="instruction">Breathe naturally</div>';
        meditationTimer.appendChild(breathingCircle);
    }

    // Update breathing animation
    updateBreathingAnimation(timeLeft) {
        const circle = document.querySelector('.breathing-circle');
        const instruction = circle.querySelector('.instruction');
        
        // 4-7-8 breathing pattern (4s inhale, 7s hold, 8s exhale)
        const totalCycle = 19; // 4 + 7 + 8 seconds
        const cyclePosition = timeLeft % totalCycle;
        
        if (cyclePosition >= 0 && cyclePosition < 4) {
            instruction.textContent = 'Breathe in';
            circle.style.transform = 'scale(1.5)';
        } else if (cyclePosition >= 4 && cyclePosition < 11) {
            instruction.textContent = 'Hold';
            circle.style.transform = 'scale(1.5)';
        } else {
            instruction.textContent = 'Breathe out';
            circle.style.transform = 'scale(1)';
        }
    }

    // Reset breathing animation
    resetBreathingAnimation() {
        const circle = document.querySelector('.breathing-circle');
        const instruction = circle.querySelector('.instruction');
        circle.style.transform = 'scale(1)';
        instruction.textContent = 'Breathe naturally';
    }

    // Goals
    initializeGoals() {
        const newGoal = document.getElementById('newGoal');
        const addGoalBtn = document.getElementById('addGoalBtn');
        const goalsList = document.getElementById('goalsList');

        // Display existing goals when page loads
        this.displayGoals();

        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => {
                if (!newGoal.value.trim()) {
                    alert('Please enter a goal!');
                    return;
                }

                const goal = {
                    id: Date.now(), // Add unique ID for each goal
                    content: newGoal.value,
                    completed: false,
                    timestamp: new Date().toISOString()
                };

                // Save to localStorage
                const goals = JSON.parse(localStorage.getItem('goals') || '[]');
                goals.push(goal);
                localStorage.setItem('goals', JSON.stringify(goals));

                // Clear the input and refresh display
                newGoal.value = '';
                this.displayGoals();
            });
        }

        // Handle enter key press
        if (newGoal) {
            newGoal.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addGoalBtn.click();
                }
            });
        }
    }

    // Display goals
    displayGoals() {
        const goalsList = document.getElementById('goalsList');
        if (!goalsList) return;

        // Clear current list
        goalsList.innerHTML = '';

        // Get goals from localStorage
        const goals = JSON.parse(localStorage.getItem('goals') || '[]');

        // Sort goals: incomplete first, then by timestamp
        goals.sort((a, b) => {
            if (a.completed === b.completed) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            return a.completed ? 1 : -1;
        });

        goals.forEach(goal => {
            const li = document.createElement('li');
            li.className = 'goal-item';
            if (goal.completed) {
                li.classList.add('completed');
            }

            li.innerHTML = `
                <div class="goal-content">
                    <input type="checkbox" ${goal.completed ? 'checked' : ''}>
                    <span>${goal.content}</span>
                </div>
                <button class="delete-goal">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            // Handle checkbox change
            const checkbox = li.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                goal.completed = checkbox.checked;
                localStorage.setItem('goals', JSON.stringify(goals));
                this.displayGoals();
            });

            // Handle delete button
            const deleteBtn = li.querySelector('.delete-goal');
            deleteBtn.addEventListener('click', () => {
                const index = goals.findIndex(g => g.id === goal.id);
                if (index > -1) {
                    goals.splice(index, 1);
                    localStorage.setItem('goals', JSON.stringify(goals));
                    this.displayGoals();
                }
            });

            goalsList.appendChild(li);
        });
    }

    // Tab System
    initializeTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabs.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }
}

// Initialize features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const featureManager = new FeatureManager();
});