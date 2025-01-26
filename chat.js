// Get DOM elements
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const suggestionChips = document.querySelectorAll('.suggestion-chip');
const moodButtons = document.querySelectorAll('.mood-btn');
const resourceButtons = document.querySelectorAll('.resource-btn');
const toggleSpeechBtn = document.getElementById('toggleSpeech');
const darkModeToggle = document.getElementById('darkModeToggle');

// Get user info
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Chat state
let conversationStarted = false;
let userMood = null;
let speechEnabled = localStorage.getItem('speechEnabled') === 'true'; // Get saved preference

// Update toggle button state based on saved preference
if (toggleSpeechBtn) {
    toggleSpeechBtn.classList.toggle('muted', !speechEnabled);
}

// Store conversation history
let conversationHistory = [
    {
        role: "model",
        parts: [{
            text: `You are a supportive and empathetic AI companion named ${localStorage.getItem('aiName') || 'Friend'}. 
            You're talking to ${currentUser.firstName}, who is ${currentUser.age} years old.
            Always maintain a professional, caring, and non-judgmental tone.
            Never provide medical advice or diagnosis.
            If the user expresses serious mental health concerns or thoughts of self-harm,
            always encourage them to seek professional help and provide crisis hotline information.
            Start by asking how they're feeling today.`
        }]
    }
];

// Helper function to add messages to the chat
function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Speak the message if it's from the bot and speech is enabled
    if (!isUser && speechEnabled) {
        speakText(message);
    }
}

// Typing indicator
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message bot-message typing-indicator';
    indicator.textContent = 'Thinking...';
    chatBox.appendChild(indicator);
    chatBox.scrollTop = chatBox.scrollHeight;
    return indicator;
}

// Function to call Gemini API
async function getAIResponse(userMessage) {
    try {
        // Add user message to history
        conversationHistory.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: conversationHistory,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 150,
                }
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            
            // Add AI response to history
            conversationHistory.push({
                role: "model",
                parts: [{ text: aiResponse }]
            });
            
            return aiResponse;
        } else {
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return "I apologize, but I'm having trouble connecting right now. Could you please try again in a moment?";
    }
}

// Handle sending messages
async function sendMessage(message) {
    if (!message.trim()) return;
    
    // Add user message
    addMessage(message, true);
    userInput.value = '';
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    // Get and add AI response
    try {
        const response = await getAIResponse(message);
        typingIndicator.remove();
        addMessage(response);
    } catch (error) {
        typingIndicator.remove();
        addMessage("I apologize, but I'm having trouble connecting right now. Could you please try again in a moment?");
    }
}

// Event listeners
sendBtn.addEventListener('click', () => sendMessage(userInput.value));

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage(userInput.value);
    }
});

// Handle suggestion chips
suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
        sendMessage(chip.textContent);
    });
});

// Handle mood tracking
moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const mood = btn.dataset.mood;
        userMood = mood;
        sendMessage(`I'm feeling ${mood} today`);
    });
});

// Handle resource buttons
resourceButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        const resource = btn.textContent.trim();
        let message = "";
        
        switch(resource) {
            case 'Self-Care Tips':
                message = "Could you provide some personalized self-care tips for me?";
                break;
            case 'Breathing Exercises':
                message = "Can you guide me through a breathing exercise?";
                break;
            case 'Mental Health Guide':
                message = "What are some important things I should know about mental health?";
                break;
        }
        
        await sendMessage(message);
    });
});

// Toggle speech function
function toggleSpeech() {
    speechEnabled = !speechEnabled;
    localStorage.setItem('speechEnabled', speechEnabled); // Save preference
    
    if (toggleSpeechBtn) {
        toggleSpeechBtn.classList.toggle('muted');
    }
    
    if (!speechEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
    }
}

// Add click event listener to speech toggle button
if (toggleSpeechBtn) {
    toggleSpeechBtn.addEventListener('click', toggleSpeech);
}

// Function to speak text
function speakText(text) {
    if (!speechEnabled || !window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
}

// Dark mode functionality
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        }
    } else if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark-mode');
    }
}

// Toggle dark mode
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    } else {
        document.documentElement.classList.remove('dark-mode');
    }
}

// Event listeners
darkModeToggle.addEventListener('click', toggleDarkMode);
prefersDarkScheme.addEventListener('change', (e) => {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Speech Recognition Setup
let recognition = null;
try {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
} catch (e) {
    console.warn('Speech recognition not supported:', e);
    micBtn.style.display = 'none';
}

// Handle speech recognition results
if (recognition) {
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        micBtn.classList.remove('listening');
        sendMessage(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        micBtn.classList.remove('listening');
    };

    recognition.onend = () => {
        micBtn.classList.remove('listening');
    };

    // Toggle speech recognition
    micBtn.addEventListener('click', () => {
        if (micBtn.classList.contains('listening')) {
            recognition.stop();
            micBtn.classList.remove('listening');
        } else {
            recognition.start();
            micBtn.classList.add('listening');
            userInput.placeholder = 'Listening...';
        }
    });
}

// Initialize theme on load
initializeTheme();

// Start conversation
async function startConversation() {
    setTimeout(async () => {
        const typingIndicator = showTypingIndicator();
        const response = await getAIResponse("Hello");
        typingIndicator.remove();
        addMessage(response);
        conversationStarted = true;
    }, 1000);
}

// Initialize chat
startConversation();
