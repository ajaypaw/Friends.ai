class GeminiAI {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

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

    async analyzeMoodAndSuggest(mood, notes = '') {
        const prompt = `As a friendly AI companion, analyze this mood data and provide a cheerful response with emojis:
        1. A warm, empathetic response with relevant emojis
        2. 2-3 fun activity suggestions, each with a matching emoji
        3. An uplifting wellness tip with emojis
        
        User's mood: ${mood}
        ${notes ? `Additional context: ${notes}` : ''}
        
        Keep the response friendly and upbeat, using emojis to add personality! Format with clear sections.`;

        return await this.generateResponse(prompt);
    }

    async analyzeJournalAndSuggestTasks(journalText) {
        const prompt = `As a supportive AI friend, analyze this journal entry and provide a fun, emoji-rich response:
        1. 🌟 A warm, understanding response to their entry (use relevant mood emojis)
        2. 📝 3-5 actionable tasks/goals based on their entry (add a fitting emoji for each task)
        3. ✨ An encouraging message with motivational emojis
        
        Journal Entry: ${journalText}
        
        Make the response friendly and engaging, using emojis to bring the suggestions to life! Keep it structured and supportive.`;

        return await this.generateResponse(prompt);
    }

    async extractTasksFromAnalysis(analysis) {
        const prompt = `Extract the tasks from this AI analysis and add fun, relevant emojis:

        Analysis: ${analysis}

        Return each task with a matching emoji at the start of the line. Make sure each task is practical and actionable.`;

        const response = await this.generateResponse(prompt);
        return response.split('\n').filter(task => task.trim());
    }

    async analyzeSelfCareNeeds(journalEntries) {
        const prompt = `As a wellness AI, analyze these journal entries and provide personalized self-care recommendations in four categories:
        1. 🫂 Emotional Wellness
        2. 💪 Physical Wellness
        3. 🧠 Mental Wellness
        4. 👥 Social Wellness

        Journal Entries: ${JSON.stringify(journalEntries)}

        For each category, provide 3-4 specific, actionable self-care activities that would benefit this person based on their journal content.
        Make suggestions engaging and specific, using emojis for visual appeal.
        Focus on practical, achievable activities that can make a real difference.`;

        return await this.generateResponse(prompt);
    }

    async generateDailyChallenge(recentMoods, completedChallenges) {
        const prompt = `Create a step-by-step self-care challenge for today, considering:
        Recent moods: ${recentMoods}
        Previously completed challenges: ${completedChallenges}

        Format the challenge as:
        1. Title with emoji
        2. Brief encouraging intro
        3. 3-4 clear, numbered steps
        4. Each step should:
           - Start with an emoji
           - Be specific and actionable
           - Take 5-15 minutes
           - Build upon previous steps
        5. End with a motivational note

        Make it:
        - Completable in one day
        - Different from previous challenges
        - Relevant to their emotional state
        - Easy to follow
        `;

        return await this.generateResponse(prompt);
    }
}

export default GeminiAI; 