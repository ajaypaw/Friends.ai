import GeminiAI from './gemini-integration.js';
import config from './config.js';

class JournalManager {
    constructor() {
        this.geminiAI = new GeminiAI(config.geminiApiKey);
        this.setupEventListeners();
        this.loadJournalEntries();
        this.loadTasks();
    }

    setupEventListeners() {
        const saveJournalBtn = document.getElementById('saveJournalBtn');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const newTaskInput = document.getElementById('newTask');
        const tasksList = document.getElementById('tasksList');

        saveJournalBtn.addEventListener('click', async () => {
            const journalText = document.getElementById('journalEntry').value;
            if (!journalText.trim()) {
                alert('Please write something in your journal first');
                return;
            }

            saveJournalBtn.disabled = true;
            saveJournalBtn.textContent = 'Saving...';

            try {
                await this.saveJournalEntry(journalText);
                document.getElementById('journalEntry').value = '';
            } catch (error) {
                console.error('Error saving journal:', error);
                alert('Error saving journal entry. Please try again.');
            } finally {
                saveJournalBtn.disabled = false;
                saveJournalBtn.textContent = 'Save Entry';
            }
        });

        addTaskBtn.addEventListener('click', () => {
            const taskText = newTaskInput.value.trim();
            if (taskText) {
                this.addTask(taskText);
                newTaskInput.value = '';
            }
        });

        newTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTaskBtn.click();
            }
        });

        tasksList.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') {
                this.updateTaskStatus(e.target.dataset.id, e.target.checked);
            } else if (e.target.classList.contains('delete-task')) {
                this.deleteTask(e.target.dataset.id);
            }
        });
    }

    async saveJournalEntry(text) {
        const entry = {
            text,
            timestamp: new Date().toISOString(),
            id: Date.now().toString()
        };

        // Get AI analysis and task suggestions
        try {
            const aiSuggestions = await this.geminiAI.analyzeJournalAndSuggestTasks(text);
            entry.aiSuggestions = aiSuggestions;
            
            // Display AI suggestions
            this.displayAISuggestions(aiSuggestions);

            // Add suggested tasks
            const suggestedTasks = await this.geminiAI.extractTasksFromAnalysis(aiSuggestions);
            suggestedTasks.forEach(task => {
                this.addTask(task, true); // true indicates it's an AI suggestion
            });
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
        }

        // Save to localStorage
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        entries.unshift(entry); // Add to beginning of array
        localStorage.setItem('journalEntries', JSON.stringify(entries));

        this.loadJournalEntries(); // Refresh the display
    }

    loadJournalEntries() {
        const entriesContainer = document.getElementById('journalEntries');
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        
        entriesContainer.innerHTML = entries.map((entry, index) => `
            <div class="journal-entry-item" data-id="${index}">
                <div class="entry-header">
                    <span class="entry-date">${new Date(entry.timestamp).toLocaleString()}</span>
                    <button class="delete-entry-btn" data-id="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="entry-content">
                    <p>${entry.text}</p>
                </div>
                <div class="entry-footer">
                    <div class="ai-analysis">
                        ${entry.aiSuggestions ? `<h3>Analysis & Suggestions</h3><p>${entry.aiSuggestions}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-entry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.deleteJournalEntry(id);
            });
        });
    }

    displayAISuggestions(suggestions) {
        const container = document.querySelector('.ai-insights');
        container.innerHTML = `
            <div class="ai-analysis">
                <h3>Analysis & Suggestions</h3>
                <p>${suggestions}</p>
            </div>
            <div class="suggested-tasks">
                <h3>Suggested Tasks</h3>
                <div id="suggestedTasksList" class="suggestions-list">
                    <!-- Tasks will be added here -->
                </div>
            </div>
        `;

        // Add suggested tasks with "Add to List" buttons
        this.geminiAI.extractTasksFromAnalysis(suggestions)
            .then(tasks => {
                const tasksList = document.getElementById('suggestedTasksList');
                tasks.forEach(task => {
                    const taskElement = document.createElement('div');
                    taskElement.className = 'suggested-task-item';
                    taskElement.innerHTML = `
                        <span class="task-text">${task}</span>
                        <button class="add-to-list-btn">
                            <i class="fas fa-plus"></i> Add to List
                        </button>
                    `;
                    
                    // Add click handler for the "Add to List" button
                    const addButton = taskElement.querySelector('.add-to-list-btn');
                    addButton.addEventListener('click', () => {
                        this.addTask(task, true);
                        addButton.disabled = true;
                        addButton.innerHTML = '<i class="fas fa-check"></i> Added';
                        addButton.classList.add('added');
                    });

                    tasksList.appendChild(taskElement);
                });
            })
            .catch(error => console.error('Error extracting tasks:', error));
    }

    addTask(text, isAISuggestion = false) {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const newTask = {
            id: Date.now().toString(),
            text,
            completed: false,
            isAISuggestion,
            timestamp: new Date().toISOString()
        };

        tasks.push(newTask);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        this.loadTasks();
    }

    updateTaskStatus(taskId, completed) {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = completed;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    }

    deleteTask(taskId) {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        this.loadTasks();
    }

    loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = '';

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.isAISuggestion ? 'ai-suggested' : ''}`;
            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                    <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                </div>
                <button class="delete-task" data-id="${task.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            tasksList.appendChild(li);
        });
    }

    deleteJournalEntry(id) {
        if (confirm('Are you sure you want to delete this entry?')) {
            const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
            entries.splice(id, 1);
            localStorage.setItem('journalEntries', JSON.stringify(entries));
            this.loadJournalEntries();
        }
    }
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    new JournalManager();
}); 