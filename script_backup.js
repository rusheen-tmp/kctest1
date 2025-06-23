// Error handling - only initialize when needed
let errorBoundaryInitialized = false;
function initializeErrorBoundary() {
    if (errorBoundaryInitialized) return;
    
    window.addEventListener('error', function(e) {
        console.error('Game error:', e.error);
        showError('The castle encountered an unexpected error');
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        showError('The castle systems are experiencing difficulties');
    });
    
    errorBoundaryInitialized = true;
}

function showError(message) {
    document.getElementById('errorBoundary').classList.remove('hidden');
    document.getElementById('errorBoundary').querySelector('p').textContent = message;
}

// Main game variables - lazy initialization
let gameElements = null;
function getGameElements() {
    if (!gameElements) {
        gameElements = {
            messagesEl: document.getElementById('messages'),
            input: document.getElementById('userInput'),
            sendBtn: document.getElementById('sendBtn'),
            keyButton: document.getElementById('keyButton'),
            chatbox: document.getElementById('chatbox')
        };
    }
    return gameElements;
}

// Game state - lazy initialization
let gameState = null;
function getGameState() {
    if (!gameState) {
        gameState = {
            gameStage: 0, // 0: intro, 1: business, 2: riddle, 3: doors, 4: success
            currentPath: null,
            currentRiddle: null,
            isTyping: false,
            recent: [],
            userResponses: []
        };
    }
    return gameState;
}

// Utility functions - only create when needed
let utilityFunctions = null;
function getUtilityFunctions() {
    if (!utilityFunctions) {
        const elements = getGameElements();
        utilityFunctions = {
            setInput: function(en) {
                elements.input.disabled = !en;
                elements.sendBtn.disabled = !en;
                if (en) {
                    elements.input.focus();
                    elements.chatbox.classList.remove('typing');
                } else {
                    elements.chatbox.classList.add('typing');
                }
            },
            
            typeWriter: function(txt, cls = '') {
                return new Promise(res => {
                    const span = document.createElement('span');
                    if (cls) span.className = cls;
                    elements.messagesEl.appendChild(span);
                    let i = 0;
                    getGameState().isTyping = true;
                    utilityFunctions.setInput(false);
                    
                    const it = setInterval(() => {
                        span.textContent = txt.slice(0, ++i);
                        elements.messagesEl.scrollTop = elements.messagesEl.scrollHeight;
                        if (i === txt.length) {
                            clearInterval(it);
                            elements.messagesEl.appendChild(document.createElement('br'));
                            getGameState().isTyping = false;
                            utilityFunctions.setInput(true);
                            res();
                        }
                    }, 35);
                });
            }
        };
    }
    return utilityFunctions;
}

// Guard communication functions - lazy loaded
let guardFunctions = null;
function getGuardFunctions() {
    if (!guardFunctions) {
        const utils = getUtilityFunctions();
        guardFunctions = {
            guardSay: async function(t) {
                await utils.typeWriter('Guard: ', 'nameGuard');
                await utils.typeWriter(t);
            },
            
            youSay: async function(t) {
                await utils.typeWriter('You: ', 'nameYou');
                await utils.typeWriter(t);
            }
        };
    }
    return guardFunctions;
}

// Conversation paths - lazy loaded
let conversationPaths = null;
function getConversationPaths() {
    if (!conversationPaths) {
        conversationPaths = [
            {
                id: 'echo',
                name: 'Guard Cain',
                greeting: "Halt! Who approaches the gates of Kafka's Castle?",
                business: "What business brings you to our ancient fortress?",
                loreResponse: "The castle has stood for centuries, its halls echoing with the whispers of countless souls who sought entry. Beyond these gates lies the heart of bureaucracy itself - where every decision is processed, every request filed, every life catalogued. The clerks within have processed petitions since before your grandfather's time. Do you truly know what you seek, or are you merely another echo in these halls?",
                riddleIntro: "Very well. To prove your worth, you must answer a riddle. Answer correctly, and you may be granted a chance to enter. Fail, and you shall remain outside these walls.",
                riddle: {
                    question: "Before you may enter, answer this riddle: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?'",
                    answers: ['echo', 'an echo', 'the echo'],
                    hint: "Think about what repeats what you say in empty halls...",
                    success: "Excellent! You have a sharp mind indeed."
                }
            },
            {
                id: 'keyboard',
                name: 'Guard Seraphina',
                greeting: "Greetings, traveler! I am Guard Seraphina. What brings you to our castle?",
                business: "Your purpose intrigues me. But first, you must prove your wit.",
                loreResponse: "Ah, a seeker of knowledge! The castle beyond these gates is no ordinary fortress. It houses the Central Bureaucratic Authority - where every document ever written is stored, every form ever filed is processed, and every request ever made is still being considered. The clerks work ceaselessly, their quills never resting. Some say they've been processing the same applications for decades. The castle's archives stretch deeper than any dungeon, and its procedures are older than the stones themselves. Are you prepared to face such endless order?",
                riddleIntro: "The castle demands proof of your intelligence. I shall present you with a riddle. Answer it correctly, and the gates may open for you. Answer poorly, and you shall be turned away.",
                riddle: {
                    question: "Solve this: 'What has keys, but no locks; space, but no room; and you can enter, but not go in?'",
                    answers: ['keyboard', 'a keyboard', 'computer keyboard', 'typing'],
                    hint: "Think about what you're using to communicate with us right now...",
                    success: "Brilliant deduction! You understand technology well."
                }
            },
            {
                id: 'towel',
                name: 'Guard Mortimer',
                greeting: "Well met! I am Guard Mortimer. What brings you to Kafka's Castle?",
                business: "Interesting business you have. The castle has many secrets, you know.",
                loreResponse: "Secrets... yes, the castle is built upon them. Beyond these gates lies the Department of Eternal Processing, where applications from centuries past still await approval. The clerks there are... different. They don't age, they don't sleep, they simply process. Some say they're not entirely human anymore. The castle's bureaucracy has consumed them, turned them into extensions of its endless filing system. Every corridor leads to another office, every office to another form, every form to another delay. The castle feeds on patience and paperwork. Do you have enough of both?",
                riddleIntro: "Secrets require wisdom to uncover. I will test you with a riddle. Answer wisely, and you may find yourself within these walls. Answer foolishly, and the secrets remain hidden from you.",
                riddle: {
                    question: "Before you may enter, answer this: 'What gets wetter and wetter the more it dries?'",
                    answers: ['towel', 'a towel', 'the towel'],
                    hint: "You use this after washing your hands...",
                    success: "Practical thinking! The castle appreciates those who understand simple truths."
                }
            },
            {
                id: 'shadow',
                name: 'Guard Vesper',
                greeting: "Another seeker at the gates. How... predictable.",
                business: "Your purpose is noted. But the castle requires proof of wisdom.",
                loreResponse: "Predictable indeed. They all come seeking something - answers, approvals, permissions. Beyond these gates lies the Shadow Bureau, where nothing is as it seems. The clerks there work in perpetual twilight, processing requests that may or may not exist. Some say the castle itself is alive, that the bureaucracy has become sentient, feeding on the hopes and frustrations of those who seek entry. The forms multiply faster than they can be filled, the procedures change while you're following them, and the clerks... well, let's just say they cast long shadows. Are you sure you want to step into such darkness?",
                riddleIntro: "Wisdom is not easily gained. I shall test you with a riddle. Answer correctly, and you may step beyond these gates. Answer incorrectly, and you shall remain in the shadows where you belong.",
                riddle: {
                    question: "Answer this: 'I follow you all the time and copy your every move, but you can't touch me or catch me. What am I?'",
                    answers: ['shadow', 'a shadow', 'the shadow', 'my shadow'],
                    hint: "I'm always with you when there's light...",
                    success: "Ah, you understand the nature of things that cannot be grasped."
                }
            },
            {
                id: 'time',
                name: 'Guard Chronos',
                greeting: "Welcome to Kafka's Castle. I am Guard Chronos. What brings you here?",
                business: "Your quest sounds noble! But the castle demands a test of logic.",
                loreResponse: "Time... ah, time works differently within these walls. Beyond the gates lies the Temporal Processing Center, where yesterday's applications are still being reviewed and tomorrow's decisions were made last week. The clerks there exist in a perpetual state of 'almost finished' - their work never truly complete, their deadlines always approaching but never arriving. Some say the castle exists outside of normal time, that centuries pass in its corridors while mere minutes go by outside. The bureaucracy is eternal, unchanging, and utterly indifferent to the passage of time. Are you prepared to lose yourself in such endless waiting?",
                riddleIntro: "Logic is the key to understanding. I will present you with a riddle. Answer it with reason, and the castle may welcome you. Answer without thought, and time will pass you by.",
                riddle: {
                    question: "Solve this riddle: 'What is always coming but never arrives?'",
                    answers: ['tomorrow', 'the future', 'next day', 'next year'],
                    hint: "It's always one day away...",
                    success: "You grasp the nature of time itself. Impressive."
                }
            }
        ];
    }
    return conversationPaths;
}

// Door choices - lazy loaded
let doorChoices = null;
function getDoorChoices() {
    if (!doorChoices) {
        doorChoices = [
            { id: 1, description: "A door of ancient oak, carved with mysterious symbols" },
            { id: 2, description: "A door of polished brass, reflecting your image back at you" },
            { id: 3, description: "A door of dark iron, with a small keyhole at its center" }
        ];
    }
    return doorChoices;
}

// Handle user input submission
async function handleUserInput() {
    if (input.value.trim() && !isTyping) {
        const txt = input.value.trim();
        input.value = '';
        
        // Track attempt
        if (window.gameAnalytics) {
            window.gameAnalytics.attempts++;
            window.gameAnalytics.trackEvent('user_input', { 
                attempt: window.gameAnalytics.attempts, 
                input: txt.substring(0, 10) + '...' 
            });
        }
        
        await youSay(txt);
        userResponses.push(txt);
        gameStage++;
        
        // Handle different stages
        switch(gameStage) {
            case 1: // Business acknowledged
                await guardSay(getContextualLoreResponse(currentPath.id, txt));
                break;
                
            case 2: // Lore response acknowledged
                await guardSay(currentPath.riddleIntro);
                break;
                
            case 3: // Riddle presented
                await guardSay(currentPath.riddle.question);
                break;
                
            case 4: // Riddle response
                const userAnswer = txt.toLowerCase().trim();
                if (currentRiddle.answers.some(answer => userAnswer.includes(answer))) {
                    await guardSay(currentRiddle.success);
                    await guardSay("Now for the final test. I have three doors before you:");
                    await guardSay("1. " + doorChoices[0].description);
                    await guardSay("2. " + doorChoices[1].description);
                    await guardSay("3. " + doorChoices[2].description);
                    await guardSay("Which door will you choose? (1, 2, or 3)");
                } else {
                    // Check if player is asking questions or giving non-answer responses
                    if (txt.includes('?') || /what|how|why|when|where|who|explain|tell|help|hint|clue/.test(userAnswer)) {
                        await guardSay(getContextualQuestionResponse(currentPath.id, txt));
                    } else {
                        await guardSay(getContextualWrongAnswerResponse(currentPath.id, txt));
                    }
                    gameStage--; // Stay on riddle stage
                }
                break;
                
            case 5: // Door choice
                if (txt.match(/^[123]$/)) {
                    await guardSay("Excellent choice! You have proven yourself worthy.");
                    await guardSay("The door opens with a satisfying click...");
                    await guardSay("Welcome to Kafka's Castle. Take this key - you'll need it inside.");
                    unlock();
                } else {
                    // Check if player is asking questions about doors
                    if (txt.includes('?') || /what|how|why|explain|tell|help|door|doors/.test(txt.toLowerCase())) {
                        await guardSay(getContextualDoorResponse(currentPath.id, txt));
                    } else {
                        await guardSay("Please choose door 1, 2, or 3.");
                    }
                    gameStage--; // Stay on door stage
                }
                break;
                
            default: // After success
                const taunts = [
                    "Why linger? The door is ajar—step through or step aside.",
                    "More words? The castle devours them whole.",
                    "Courage fades with every syllable you spill.",
                    "Enter, unless your fear prefers these shadows.",
                    "Mystery grows impatient. Will you cross the threshold?"
                ];
                
                let rep;
                do {
                    rep = taunts[Math.floor(Math.random() * taunts.length)];
                } while (recent.includes(rep));
                addRecent(rep);
                await guardSay(rep);
                break;
        }
    }
}

// Guard responses to questions/unexpected inputs
function getGuardQuestionResponse(guardId) {
    const responses = {
        'echo': [
            "Questions? The riddle speaks for itself. Focus on what repeats in empty halls.",
            "Your curiosity is noted, but the answer lies in the riddle itself. Listen to the echo of your own words.",
            "The castle does not reward those who ask instead of think. The riddle is clear enough."
        ],
        'keyboard': [
            "Ah, you seek clarification. The riddle is about something you use every day. Think of your tools.",
            "Your questions show intelligence, but the answer is right before you. What are you using to communicate?",
            "The castle appreciates thoughtful inquiry, but the riddle is self-explanatory. Look to your hands."
        ],
        'towel': [
            "Secrets are not given freely. The riddle contains its own answer. Think of daily routines.",
            "Your questions reveal a curious mind, but wisdom comes from within. What dries things?",
            "The castle's secrets are hidden in plain sight. The riddle speaks of something you use daily."
        ],
        'shadow': [
            "More questions? How predictable. The answer follows you everywhere. Look behind you.",
            "Your inquiries are tiresome. The riddle is about something that cannot be grasped. Think of what mirrors your movements.",
            "The castle has no patience for endless questions. The answer is always with you, yet you cannot touch it."
        ],
        'time': [
            "Time waits for no one, including those who ask too many questions. The riddle is about what never arrives.",
            "Your questions consume time that could be spent thinking. The answer is always coming but never here.",
            "The castle values those who think rather than ask. The riddle speaks of the future that never becomes present."
        ]
    };
    
    const guardResponses = responses[guardId];
    let response;
    do {
        response = guardResponses[Math.floor(Math.random() * guardResponses.length)];
    } while (recent.includes(response));
    addRecent(response);
    return response;
}

// Contextual lore responses based on player input
function getContextualLoreResponse(guardId, playerInput) {
    const input = playerInput.toLowerCase();
    
    // Check for specific themes in player response
    if (/help|assist|aid|support/.test(input)) {
        return getHelpSeekingResponse(guardId);
    } else if (/lost|confused|don't know|unsure|purpose/.test(input)) {
        return getUncertaintyResponse(guardId);
    } else if (/business|work|job|employment|career/.test(input)) {
        return getBusinessResponse(guardId);
    } else if (/visit|see|explore|tour|look/.test(input)) {
        return getExplorationResponse(guardId);
    } else if (/urgent|emergency|important|critical/.test(input)) {
        return getUrgencyResponse(guardId);
    } else if (/family|friend|loved|person|someone/.test(input)) {
        return getPersonalResponse(guardId);
    } else if (/money|payment|cost|fee|price/.test(input)) {
        return getFinancialResponse(guardId);
    } else if (/food|hungry|eat|drink|rest/.test(input)) {
        return getSustenanceResponse(guardId);
    } else if (/sleep|tired|rest|bed/.test(input)) {
        return getRestResponse(guardId);
    } else if (/danger|safe|risk|threat|kill/.test(input)) {
        return getSafetyResponse(guardId);
    } else if (/magic|spell|wizard|sorcerer/.test(input)) {
        return getMagicResponse(guardId);
    } else if (/king|queen|royal|noble|lord/.test(input)) {
        return getRoyalResponse(guardId);
    } else if (/old|ancient|history|past/.test(input)) {
        return getHistoricalResponse(guardId);
    } else if (/future|tomorrow|later|soon/.test(input)) {
        return getFutureResponse(guardId);
    } else if (/escape|leave|exit|go back/.test(input)) {
        return getEscapeResponse(guardId);
    } else if (/power|strength|mighty|strong/.test(input)) {
        return getPowerResponse(guardId);
    } else if (/knowledge|learn|study|wisdom/.test(input)) {
        return getKnowledgeResponse(guardId);
    } else if (/death|die|dead|kill/.test(input)) {
        return getDeathResponse(guardId);
    } else if (/love|heart|romance|passion/.test(input)) {
        return getLoveResponse(guardId);
    } else if (/fear|afraid|scared|terrified/.test(input)) {
        return getFearResponse(guardId);
    } else {
        // Default lore response
        return conversationPaths.find(path => path.id === guardId).loreResponse;
    }
}

// Contextual question responses
function getContextualQuestionResponse(guardId, playerInput) {
    const input = playerInput.toLowerCase();
    
    if (/what.*riddle|riddle.*what/.test(input)) {
        return "The riddle is already before you. Read it carefully and think.";
    } else if (/hint|clue|help/.test(input)) {
        return conversationPaths.find(path => path.id === guardId).riddle.hint;
    } else if (/answer|solution/.test(input)) {
        return "The answer is not given freely. You must discover it yourself.";
    } else if (/why.*riddle|riddle.*why/.test(input)) {
        return "The castle tests all who seek entry. The riddle reveals your worth.";
    } else {
        return getGuardQuestionResponse(guardId);
    }
}

// Contextual wrong answer responses
function getContextualWrongAnswerResponse(guardId, playerInput) {
    const input = playerInput.toLowerCase();
    
    if (/yes|no|maybe|perhaps/.test(input)) {
        return getUncertaintyWrongAnswer(guardId);
    } else if (/i don't know|dunno|unsure/.test(input)) {
        return getIgnoranceWrongAnswer(guardId);
    } else if (/guess|try|attempt/.test(input)) {
        return getGuessingWrongAnswer(guardId);
    } else if (/door|gate|entrance|way in/.test(input)) {
        return getDoorWrongAnswer(guardId);
    } else if (/castle|building|fortress/.test(input)) {
        return getCastleWrongAnswer(guardId);
    } else if (/guard|soldier|protector/.test(input)) {
        return getGuardWrongAnswer(guardId);
    } else if (/paper|form|document/.test(input)) {
        return getPaperworkWrongAnswer(guardId);
    } else if (/time|clock|hour/.test(input)) {
        return getTimeWrongAnswer(guardId);
    } else if (/key|lock|unlock/.test(input)) {
        return getKeyWrongAnswer(guardId);
    } else if (/light|dark|shadow/.test(input)) {
        return getLightWrongAnswer(guardId);
    } else if (/wind|air|breeze/.test(input)) {
        return getWindWrongAnswer(guardId);
    } else if (/water|wet|dry/.test(input)) {
        return getWaterWrongAnswer(guardId);
    } else if (/sound|voice|speak/.test(input)) {
        return getSoundWrongAnswer(guardId);
    } else if (/machine|device|tool/.test(input)) {
        return getMachineWrongAnswer(guardId);
    } else {
        return getGenericWrongAnswer(guardId);
    }
}

// Specific wrong answer responses with lore
function getUncertaintyWrongAnswer(guardId) {
    const responses = {
        'echo': "Uncertainty echoes through these halls, but the castle demands decisiveness. The riddle requires a specific answer, not wavering. Think of what repeats in empty spaces, what mirrors your words back to you. Try again with certainty.",
        'keyboard': "The castle's procedures do not accept uncertainty. Every form must be filled with precision, every answer given with confidence. The riddle speaks of something you use daily, something with keys but no locks. Consider your tools carefully.",
        'towel': "Uncertainty is the enemy of efficiency. The castle processes thousands of requests daily, and each requires a definitive answer. The riddle speaks of something that gets wetter as it dries - think of daily routines, of cleanliness.",
        'shadow': "Uncertainty is weakness, and the castle has no patience for weakness. The riddle is about something that follows you, something you cannot grasp. Look behind you, consider what mirrors your movements. Be decisive.",
        'time': "Time does not wait for uncertainty. The castle's procedures are eternal, but your opportunity is not. The riddle speaks of what is always coming but never arrives. Think of the future, of tomorrow. Answer with confidence."
    };
    return responses[guardId];
}

function getIgnoranceWrongAnswer(guardId) {
    const responses = {
        'echo': "Ignorance is not an option in these halls. The castle's archives contain all knowledge, and the answer lies within your reach. The riddle speaks of what repeats in empty spaces, what carries your voice back to you. Look to the halls themselves for guidance.",
        'keyboard': "The castle does not reward ignorance. Every clerk knows every form, every procedure. The riddle is about something you use to communicate, something with keys but no locks. Look to your hands, to your tools. Knowledge is power here.",
        'towel': "Ignorance feeds the castle's bureaucracy. Those who do not know become lost in endless forms. The riddle speaks of something that gets wetter as it dries - think of what you use after washing, of what absorbs moisture. Seek wisdom in daily tasks.",
        'shadow': "Ignorance is just another shadow to be consumed. The castle feeds on those who do not understand. The riddle is about something that follows you everywhere, something you cannot touch. Look behind you, consider what is always with you.",
        'time': "Ignorance wastes time, and time is the castle's most precious commodity. The riddle speaks of what never arrives, what is always coming but never here. Think of the future, of what is always one day away. Time will teach you if you listen."
    };
    return responses[guardId];
}

function getGuessingWrongAnswer(guardId) {
    const responses = {
        'echo': "Guessing is not thinking. The castle's procedures require precision, not random attempts. The riddle speaks of what echoes in empty halls, what repeats your words back to you. Listen carefully to the riddle itself - it contains its own answer.",
        'keyboard': "The castle does not accept guesses. Every answer must be reasoned, every response calculated. The riddle speaks of something with keys but no locks, space but no room. Think of what you're using right now to communicate. Apply logic, not chance.",
        'towel': "Guessing is inefficient. The castle's bureaucracy demands accuracy. The riddle speaks of something that gets wetter as it dries - think of what you use for cleaning, for drying. The answer lies in daily routine, not random chance.",
        'shadow': "Guessing is the mark of a weak mind. The castle has no patience for those who cannot think. The riddle is about something that follows you, something you cannot grasp. Look to what mirrors your movements, what is always with you.",
        'time': "Guessing wastes time, and the castle values time above all else. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. Time rewards those who think, not those who guess."
    };
    return responses[guardId];
}

function getDoorWrongAnswer(guardId) {
    const responses = {
        'echo': "Doors are not the answer. The castle has many doors, but the riddle speaks of something else entirely. Think of what echoes through these halls, what repeats your words back to you. The answer is not a physical object, but a phenomenon.",
        'keyboard': "Doors are just another form of bureaucracy. The castle processes door permits, entrance applications, exit visas. But the riddle is not about doors - it's about something with keys but no locks. Think of your tools, of what you use to communicate.",
        'towel': "Doors are the castle's most common feature, but they are not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use after washing, of what absorbs moisture. The answer lies in daily routine, not architecture.",
        'shadow': "Doors cast shadows, but shadows are not doors. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. The answer is not a structure, but a companion.",
        'time': "Doors open and close with time, but time is not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. The answer is temporal, not physical."
    };
    return responses[guardId];
}

function getCastleWrongAnswer(guardId) {
    const responses = {
        'echo': "The castle itself is not the answer. These walls echo with the riddle, but the answer lies within the question. Think of what repeats in empty spaces, what carries your voice back to you. The castle is the setting, not the solution.",
        'keyboard': "The castle processes all requests, but it is not the answer. The riddle speaks of something with keys but no locks, space but no room. Think of what you use to communicate, of your tools. The castle is the bureaucracy, not the answer.",
        'towel': "The castle has many secrets, but it is not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use for cleaning, for drying. The castle is the setting, not the solution to the riddle.",
        'shadow': "The castle casts many shadows, but it is not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. The castle is the environment, not the answer.",
        'time': "The castle exists outside of time, but it is not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. The castle is timeless, but the answer is temporal."
    };
    return responses[guardId];
}

function getGuardWrongAnswer(guardId) {
    const responses = {
        'echo': "Guards are not the answer. We protect the castle, but the riddle speaks of something else. Think of what echoes through these halls, what repeats your words back to you. The answer is not a person, but a phenomenon.",
        'keyboard': "Guards process visitors, but we are not the answer. The riddle speaks of something with keys but no locks, space but no room. Think of what you use to communicate, of your tools. We are the gatekeepers, not the answer.",
        'towel': "Guards maintain order, but we are not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use for cleaning, for drying. We are the protectors, not the solution.",
        'shadow': "Guards cast shadows, but we are not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. We are the watchers, not the answer.",
        'time': "Guards are timeless, but we are not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. We are eternal, but the answer is temporal."
    };
    return responses[guardId];
}

function getPaperworkWrongAnswer(guardId) {
    const responses = {
        'echo': "Paperwork echoes through these halls, but it is not the answer. The riddle speaks of what repeats in empty spaces, what carries your voice back to you. Think of the phenomenon, not the bureaucracy. The answer is natural, not man-made.",
        'keyboard': "Paperwork is the castle's lifeblood, but it is not the answer. The riddle speaks of something with keys but no locks, space but no room. Think of what you use to create paperwork, of your tools. The answer is technological, not bureaucratic.",
        'towel': "Paperwork absorbs ink like a towel absorbs water, but it is not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use for cleaning, for drying. The answer is practical, not administrative.",
        'shadow': "Paperwork creates shadows, but it is not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. The answer is natural, not bureaucratic.",
        'time': "Paperwork is timeless, but it is not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. The answer is temporal, not administrative."
    };
    return responses[guardId];
}

function getTimeWrongAnswer(guardId) {
    const responses = {
        'echo': "Time echoes through these halls, but it is not the answer. The riddle speaks of what repeats in empty spaces, what carries your voice back to you. Think of the phenomenon, not the concept. The answer is physical, not temporal.",
        'keyboard': "Time is processed by the castle, but it is not the answer. The riddle speaks of something with keys but no locks, space but no room. Think of what you use to communicate, of your tools. The answer is technological, not temporal.",
        'towel': "Time dries all things, but it is not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use for cleaning, for drying. The answer is practical, not conceptual.",
        'shadow': "Time creates shadows, but it is not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. The answer is natural, not temporal.",
        'time': "Time is the castle's domain, but it is not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. The answer is temporal, but not time itself."
    };
    return responses[guardId];
}

function getKeyWrongAnswer(guardId) {
    const responses = {
        'echo': "Keys unlock doors, but they are not the answer. The riddle speaks of what echoes in empty halls, what repeats your words back to you. Think of the phenomenon, not the tool. The answer is natural, not man-made.",
        'keyboard': "Keys are physical objects, but the riddle speaks of something with keys but no locks, space but no room. Think of what you use to communicate, of your tools. The answer has keys metaphorically, not literally.",
        'towel': "Keys are tools, but they are not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use for cleaning, for drying. The answer is practical, not mechanical.",
        'shadow': "Keys cast shadows, but they are not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. The answer is natural, not mechanical.",
        'time': "Keys are timeless, but they are not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. The answer is temporal, not mechanical."
    };
    return responses[guardId];
}

function getLightWrongAnswer(guardId) {
    const responses = {
        'echo': "Light illuminates, but it is not the answer. The riddle speaks of what echoes in empty halls, what repeats your words back to you. Think of the phenomenon, not the illumination. The answer is acoustic, not visual.",
        'keyboard': "Light reveals, but it is not the answer. The riddle speaks of something with keys but no locks, space but no room. Think of what you use to communicate, of your tools. The answer is technological, not luminous.",
        'towel': "Light dries, but it is not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use for cleaning, for drying. The answer is practical, not luminous.",
        'shadow': "Light creates shadows, but it is not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. The answer is the shadow, not the light.",
        'time': "Light changes with time, but it is not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. The answer is temporal, not luminous."
    };
    return responses[guardId];
}

function getWindWrongAnswer(guardId) {
    const responses = {
        'echo': "Wind carries sound, but it is not the answer. The riddle speaks of what echoes in empty halls, what repeats your words back to you. Think of the phenomenon itself, not what carries it. The answer is the echo, not the wind.",
        'keyboard': "Wind is natural, but the riddle speaks of something with keys but no locks, space but no room. Think of what you use to communicate, of your tools. The answer is man-made, not natural.",
        'towel': "Wind dries, but it is not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use for cleaning, for drying. The answer is practical, not natural.",
        'shadow': "Wind moves shadows, but it is not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. The answer is the shadow, not the wind.",
        'time': "Wind is timeless, but it is not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. The answer is temporal, not natural."
    };
    return responses[guardId];
}

function getWaterWrongAnswer(guardId) {
    const responses = {
        'echo': "Water flows, but it is not the answer. The riddle speaks of what echoes in empty halls, what repeats your words back to you. Think of the phenomenon, not the liquid. The answer is acoustic, not aqueous.",
        'keyboard': "Water is natural, but the riddle speaks of something with keys but no locks, space but no room. Think of what you use to communicate, of your tools. The answer is man-made, not natural.",
        'towel': "Water is what gets dried, but it is not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use to dry water, of what absorbs moisture. The answer is the tool, not the water.",
        'shadow': "Water reflects, but it is not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. The answer is the shadow, not the water.",
        'time': "Water flows with time, but it is not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. The answer is temporal, not aqueous."
    };
    return responses[guardId];
}

function getSoundWrongAnswer(guardId) {
    const responses = {
        'echo': "Sound is what creates the answer, but it is not the answer itself. The riddle speaks of what echoes in empty halls, what repeats your words back to you. Think of the phenomenon, not the source. The answer is the echo, not the sound.",
        'keyboard': "Sound is natural, but the riddle speaks of something with keys but no locks, space but no room. Think of what you use to communicate, of your tools. The answer is technological, not acoustic.",
        'towel': "Sound is not wet or dry, so it is not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use for cleaning, for drying. The answer is practical, not acoustic.",
        'shadow': "Sound does not follow you, so it is not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. The answer is visual, not acoustic.",
        'time': "Sound is temporal, but it is not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. The answer is temporal, but not sound itself."
    };
    return responses[guardId];
}

function getMachineWrongAnswer(guardId) {
    const responses = {
        'echo': "Machines are man-made, but the riddle speaks of what echoes in empty halls, what repeats your words back to you. Think of the natural phenomenon, not the mechanical. The answer is acoustic, not mechanical.",
        'keyboard': "Machines have many forms, but the riddle speaks of something specific with keys but no locks, space but no room. Think of what you use to communicate, of your tools. The answer is a specific machine, not machines in general.",
        'towel': "Machines are not wet or dry, so they are not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use for cleaning, for drying. The answer is practical, not mechanical.",
        'shadow': "Machines cast shadows, but they are not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements. The answer is natural, not mechanical.",
        'time': "Machines are timeless, but they are not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. The answer is temporal, not mechanical."
    };
    return responses[guardId];
}

function getGenericWrongAnswer(guardId) {
    const responses = {
        'echo': "That is not the answer. The riddle speaks of what echoes in empty halls, what repeats your words back to you. Think of the phenomenon that carries your voice back to you. Listen to the riddle carefully - it contains its own answer.",
        'keyboard': "That is not the answer. The riddle speaks of something with keys but no locks, space but no room. Think of what you use to communicate, of your tools. Look to your hands, to what you're using right now.",
        'towel': "That is not the answer. The riddle speaks of something that gets wetter as it dries. Think of what you use for cleaning, for drying. Consider your daily routine, what you use after washing.",
        'shadow': "That is not the answer. The riddle is about something that follows you, something you cannot touch. Look to what mirrors your movements, what is always with you. Consider what cannot be grasped.",
        'time': "That is not the answer. The riddle speaks of what never arrives, what is always coming. Think of the future, of what is always one day away. Consider what is always coming but never here."
    };
    return responses[guardId];
}

// Game start
function startGame() {
    // Track game start
    if (window.gameAnalytics) {
        window.gameAnalytics.trackEvent('game_started', { timestamp: Date.now() });
    }
    
    // Randomly select a conversation path
    currentPath = conversationPaths[Math.floor(Math.random() * conversationPaths.length)];
    currentRiddle = currentPath.riddle;
    
    // Start with the selected guard's greeting
    (async () => {
        await guardSay(currentPath.greeting);
        await guardSay(currentPath.business);
    })();
}

function addRecent(x) {
    recent.push(x);
    if (recent.length > 4) recent.shift();
}

// Event listeners
input.addEventListener('keydown', async e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        await handleUserInput();
    }
});

sendBtn.addEventListener('click', async e => {
    e.preventDefault();
    await handleUserInput();
});

function unlock() {
    // Visual feedback
    keyButton.style.display = 'inline-block';
    keyButton.classList.add('glow');
    
    // Track completion
    if (window.gameAnalytics) {
        window.gameAnalytics.completionTime = Date.now() - window.gameAnalytics.startTime;
        window.gameAnalytics.trackEvent('game_completed', { 
            completionTime: window.gameAnalytics.completionTime,
            attempts: window.gameAnalytics.attempts,
            path: currentPath.id
        });
    }
    
    const go = () => {
        // Track navigation
        if (window.gameAnalytics) {
            window.gameAnalytics.trackEvent('stage2_entered', { 
                timeSpent: Date.now() - window.gameAnalytics.startTime,
                path: currentPath.id
            });
        }
        location.href = 'stage2.html';
    };
    
    keyButton.addEventListener('click', go);
    keyButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            go();
        }
    });
}

// Start game immediately
startGame();
