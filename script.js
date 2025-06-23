// Error handling - only initialize when needed
let errorBoundaryInitialized = false;

// Simple performance tracking for key operations
function trackPerformance(operation, startTime) {
    const duration = performance.now() - startTime;
    console.log(`${operation}: ${duration.toFixed(2)}ms`);
}

// Periodic logging of simple metrics
function logSimpleMetrics() {
    const memoryUsage = performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A';
    console.log(`📊 Memory: ${memoryUsage}MB | Time: ${new Date().toLocaleTimeString()}`);
}

// Log metrics every 30 seconds - only start after DOM is loaded
let metricsInterval = null;
function startMetricsLogging() {
    if (!metricsInterval) {
        metricsInterval = setInterval(logSimpleMetrics, 30000);
    }
}

// Simple performance tracking
let simpleMetrics = {
    gameStartTime: 0,
    guardResponseTime: 0,
    riddleProcessingTime: 0,
    messageCount: 0,
    memoryUsage: 0,
    userInteractions: 0
};

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
        const cache = getDOMCache();
        gameElements = {
            messagesEl: cache.messages,
            input: cache.input,
            sendBtn: cache.sendBtn,
            keyButton: cache.keyButton,
            chatbox: cache.chatbox
        };
    }
    return gameElements;
}

// Game state - lazy initialization
let gameState = null;
function getGameState() {
    if (!gameState) {
        try {
            const recent = JSON.parse(localStorage.getItem('recent') || '{}');
            gameState = {
                gameStage: recent.stage || 'conversation', // 0: intro, 1: business, 2: riddle, 3: doors, 4: success
                currentPath: null,
                currentRiddle: null,
                isTyping: false,
                recent: [],
                userResponses: [],
                currentGuard: recent.guard || null,
                riddleAttempts: recent.attempts || 0
            };
        } catch (error) {
            console.error('Failed to get game state:', error);
            gameState = {
                gameStage: 'conversation',
                currentPath: null,
                currentRiddle: null,
                isTyping: false,
                recent: [],
                userResponses: [],
                currentGuard: null,
                riddleAttempts: 0
            };
        }
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
                    
                    const animate = () => {
                        span.textContent = txt.slice(0, ++i);
                        elements.messagesEl.scrollTop = elements.messagesEl.scrollHeight;
                        
                        if (i === txt.length) {
                            elements.messagesEl.appendChild(document.createElement('br'));
                            getGameState().isTyping = false;
                            utilityFunctions.setInput(true);
                            cleanupMemory(); // Clean up memory after typing
                            res();
                        } else {
                            setTimeout(animate, 35);
                        }
                    };
                    
                    animate();
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
                riddles: [
                    {
                        question: "Before you may enter, answer this riddle: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?'",
                        answers: ['echo', 'an echo', 'the echo'],
                        hint: "Think about what repeats what you say in empty halls...",
                        success: "Excellent! You have a sharp mind indeed."
                    },
                    {
                        question: "Answer this: 'What has cities, but no houses; forests, but no trees; and rivers, but no water?'",
                        answers: ['map', 'a map', 'the map'],
                        hint: "You use this to find your way...",
                        success: "You understand the nature of representation. Well done."
                    },
                    {
                        question: "Solve this: 'What breaks when you say it?'",
                        answers: ['silence', 'the silence'],
                        hint: "Think about what happens when you speak...",
                        success: "Ah, you grasp the paradox. Impressive."
                    }
                ]
            },
            {
                id: 'keyboard',
                name: 'Guard Seraphina',
                greeting: "Greetings, traveler! I am Guard Seraphina. What brings you to our castle?",
                business: "Your purpose intrigues me. But first, you must prove your wit.",
                loreResponse: "Ah, a seeker of knowledge! The castle beyond these gates is no ordinary fortress. It houses the Central Bureaucratic Authority - where every document ever written is stored, every form ever filed is processed, and every request ever made is still being considered. The clerks work ceaselessly, their quills never resting. Some say they've been processing the same applications for decades. The castle's archives stretch deeper than any dungeon, and its procedures are older than the stones themselves. Are you prepared to face such endless order?",
                riddleIntro: "The castle demands proof of your intelligence. I shall present you with a riddle. Answer it correctly, and the gates may open for you. Answer poorly, and you shall be turned away.",
                riddles: [
                    {
                        question: "Solve this: 'What has keys, but no locks; space, but no room; and you can enter, but not go in?'",
                        answers: ['keyboard', 'a keyboard', 'computer keyboard', 'typing'],
                        hint: "Think about what you're using to communicate with us right now...",
                        success: "Brilliant deduction! You understand technology well."
                    },
                    {
                        question: "Answer this: 'What has many keys but no locks, space but no room, and you can enter but not go in?'",
                        answers: ['computer', 'a computer', 'the computer'],
                        hint: "You're using one right now...",
                        success: "You understand the digital realm. Excellent."
                    },
                    {
                        question: "Solve this: 'What has buttons but no shirt, keys but no locks, and space but no room?'",
                        answers: ['phone', 'a phone', 'mobile phone', 'cellphone'],
                        hint: "You carry this with you...",
                        success: "Modern thinking! The castle appreciates adaptability."
                    }
                ]
            },
            {
                id: 'towel',
                name: 'Guard Mortimer',
                greeting: "Well met! I am Guard Mortimer. What brings you to Kafka's Castle?",
                business: "Interesting business you have. The castle has many secrets, you know.",
                loreResponse: "Secrets... yes, the castle is built upon them. Beyond these gates lies the Department of Eternal Processing, where applications from centuries past still await approval. The clerks there are... different. They don't age, they don't sleep, they simply process. Some say they're not entirely human anymore. The castle's bureaucracy has consumed them, turned them into extensions of its endless filing system. Every corridor leads to another office, every office to another form, every form to another delay. The castle feeds on patience and paperwork. Do you have enough of both?",
                riddleIntro: "Secrets require wisdom to uncover. I will test you with a riddle. Answer wisely, and you may find yourself within these walls. Answer foolishly, and the secrets remain hidden from you.",
                riddles: [
                    {
                        question: "Before you may enter, answer this: 'What gets wetter and wetter the more it dries?'",
                        answers: ['towel', 'a towel', 'the towel'],
                        hint: "You use this after washing your hands...",
                        success: "Practical thinking! The castle appreciates those who understand simple truths."
                    },
                    {
                        question: "Answer this: 'What has a head and a tail but no body?'",
                        answers: ['coin', 'a coin', 'the coin'],
                        hint: "You use this to pay for things...",
                        success: "You understand the nature of currency. Well done."
                    },
                    {
                        question: "Solve this: 'What has keys that open no doors, space but no room, and you can enter but not go in?'",
                        answers: ['piano', 'a piano', 'the piano'],
                        hint: "This makes music...",
                        success: "Musical wisdom! The castle values harmony."
                    }
                ]
            },
            {
                id: 'shadow',
                name: 'Guard Vesper',
                greeting: "Another seeker at the gates. How... predictable.",
                business: "Your purpose is noted. But the castle requires proof of wisdom.",
                loreResponse: "Predictable indeed. They all come seeking something - answers, approvals, permissions. Beyond these gates lies the Shadow Bureau, where nothing is as it seems. The clerks there work in perpetual twilight, processing requests that may or may not exist. Some say the castle itself is alive, that the bureaucracy has become sentient, feeding on the hopes and frustrations of those who seek entry. The forms multiply faster than they can be filled, the procedures change while you're following them, and the clerks... well, let's just say they cast long shadows. Are you sure you want to step into such darkness?",
                riddleIntro: "Wisdom is not easily gained. I shall test you with a riddle. Answer correctly, and you may step beyond these gates. Answer incorrectly, and you shall remain in the shadows where you belong.",
                riddles: [
                    {
                        question: "Answer this: 'I follow you all the time and copy your every move, but you can't touch me or catch me. What am I?'",
                        answers: ['shadow', 'a shadow', 'the shadow', 'my shadow'],
                        hint: "I'm always with you when there's light...",
                        success: "Ah, you understand the nature of things that cannot be grasped."
                    },
                    {
                        question: "Solve this: 'What has a face and two hands but no arms or legs?'",
                        answers: ['clock', 'a clock', 'the clock'],
                        hint: "This tells you the time...",
                        success: "You understand the passage of time. Impressive."
                    },
                    {
                        question: "Answer this: 'What has keys that open no doors, space but no room, and you can enter but not go in?'",
                        answers: ['mirror', 'a mirror', 'the mirror'],
                        hint: "You see yourself in this...",
                        success: "You understand reflection. The castle values self-awareness."
                    }
                ]
            },
            {
                id: 'time',
                name: 'Guard Chronos',
                greeting: "Welcome to Kafka's Castle. I am Guard Chronos. What brings you here?",
                business: "Your quest sounds noble! But the castle demands a test of logic.",
                loreResponse: "Time... ah, time works differently within these walls. Beyond the gates lies the Temporal Processing Center, where yesterday's applications are still being reviewed and tomorrow's decisions were made last week. The clerks there exist in a perpetual state of 'almost finished' - their work never truly complete, their deadlines always approaching but never arriving. Some say the castle exists outside of normal time, that centuries pass in its corridors while mere minutes go by outside. The bureaucracy is eternal, unchanging, and utterly indifferent to the passage of time. Are you prepared to lose yourself in such endless waiting?",
                riddleIntro: "Logic is the key to understanding. I will present you with a riddle. Answer it with reason, and the castle may welcome you. Answer without thought, and time will pass you by.",
                riddles: [
                    {
                        question: "Solve this riddle: 'What is always coming but never arrives?'",
                        answers: ['tomorrow', 'the future', 'next day', 'next year'],
                        hint: "It's always one day away...",
                        success: "You grasp the nature of time itself. Impressive."
                    },
                    {
                        question: "Answer this: 'What has hands but no arms, a face but no eyes, and tells you something but never speaks?'",
                        answers: ['clock', 'a clock', 'the clock'],
                        hint: "This measures time...",
                        success: "You understand the measurement of time. Well done."
                    },
                    {
                        question: "Solve this: 'What gets bigger when you take away from it?'",
                        answers: ['hole', 'a hole', 'the hole'],
                        hint: "Think about what happens when you dig...",
                        success: "You understand paradox. The castle appreciates such thinking."
                    }
                ]
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

// Handle user input submission - optimized with lazy loading
async function handleUserInput() {
    const startTime = performance.now();
    simpleMetrics.userInteractions++;
    
    try {
        const elements = getGameElements();
        const userInput = elements.input.value.trim();
        
        if (!userInput) return;
        
        // Clear input
        elements.input.value = '';
        
        // Add user message to chat
        const utils = getUtilityFunctions();
        await utils.typeWriter('You: ', 'nameYou');
        await utils.typeWriter(userInput);
        
        // Process the input
        const processingStart = performance.now();
        
        // Check for dev commands first
        if (handleDevCommand(userInput)) {
            trackPerformance('Dev Command Processing', processingStart);
            trackPerformance('Total User Input', startTime);
            return;
        }
        
        // Get current game state and path
        const state = getGameState();
        const paths = getConversationPaths();
        const currentPath = paths.find(p => p.id === state.currentGuard) || paths[0];
        
        // Create utility functions
        const addMessage = async (type, content) => {
            if (type === 'guard') {
                const guards = getGuardFunctions();
                await guards.guardSay(content);
            } else if (type === 'system') {
                await utils.typeWriter(content, 'system');
            }
        };
        
        const addRecent = (key, value) => {
            try {
                const recent = JSON.parse(localStorage.getItem('recent') || '{}');
                recent[key] = value;
                localStorage.setItem('recent', JSON.stringify(recent));
            } catch (error) {
                console.error('Failed to save recent:', error);
            }
        };
        
        // Handle different game phases
        if (state.gameStage === 'conversation') {
            await handleConversationPhase(userInput, currentPath, addMessage, addRecent);
        } else if (state.gameStage === 'riddle') {
            await handleRiddlePhase(userInput, currentPath, addMessage, addRecent);
        } else if (state.gameStage === 'doors') {
            await handleDoorsPhase(userInput, currentPath, addMessage, addRecent);
        }
        
        trackPerformance('Input Processing', processingStart);
        
        trackPerformance('Total User Input', startTime);
        
    } catch (error) {
        console.error('Error handling user input:', error);
        showError('Failed to process input: ' + error.message);
    }
}

// Developer utility system
function handleDevCommand(command) {
    // Only process if it's a dev command
    if (!command.startsWith('win') && !command.startsWith('skip') && 
        !command.startsWith('jump') && !command.startsWith('goto') && 
        !command.startsWith('dev') && !command.startsWith('console') && 
        !command.startsWith('log') && !command.startsWith('show') && 
        !command.startsWith('download') && !command.startsWith('export') && 
        !command.startsWith('save') && !command.startsWith('push') &&
        !command.startsWith('back')) {
        return false;
    }
    
    // Win command
    if (command === 'win.exe' || command === '.\\win.exe' || command === 'win--') {
        executeWinCondition();
        return true;
    }
    
    // Skip command
    if (command === 'skip--') {
        skipCurrentStage();
        return true;
    }
    
    // Back command
    if (command === 'back--') {
        goBackToPreviousPage();
        return true;
    }
    
    // Jump commands
    if (command === 'jump--') {
        jumpToNextStage();
        return true;
    }
    
    if (command.startsWith('jump--[') && command.endsWith(']')) {
        const stage = command.slice(7, -1);
        jumpToStage(stage);
        return true;
    }
    
    // Goto command
    if (command.startsWith('goto ')) {
        const stage = command.slice(5);
        jumpToStage(stage);
        return true;
    }
    
    // Help command
    if (command === 'dev help' || command === 'help dev') {
        showDevHelp();
        return true;
    }
    
    // Console command
    if (command === 'console' || command === 'console.log' || command === 'log' || 
        command === 'show console.log' || command === 'show console log' ||
        command === 'show console' || command === 'show log') {
        showConsoleInfo();
        return true;
    }
    
    // Download console logs command
    if (command === 'download logs' || command === 'export logs' || command === 'save logs' || 
        command === 'download console' || command === 'export console' ||
        command === 'push log') {
        downloadConsoleLogs();
        return true;
    }
    
    return false;
}

function executeWin() {
    const { addMessage } = getUtilityFunctions();
    
    addMessage('system', '🔧 Developer command executed: WIN');
    addMessage('system', '🎉 Congratulations! You have bypassed the castle\'s defenses.');
    addMessage('system', 'The bureaucratic maze has been defeated by superior debugging skills.');
    
    // Trigger win condition
        setTimeout(() => {
        unlock();
    }, 2000);
}

function skipCurrentStage() {
    const { addMessage } = getUtilityFunctions();
    addMessage('system', '🔧 Developer command executed: SKIP');
    addMessage('system', '⏭️ Skipping current stage...');
    setTimeout(() => {
        window.location.href = 'stage2.html';
    }, 1000);
}

function goBackToPreviousPage() {
    const { addMessage } = getUtilityFunctions();
    addMessage('system', '🔧 Developer command executed: BACK');
    addMessage('system', '⬅️ Going back to previous page...');
    setTimeout(() => {
        window.history.back();
    }, 1000);
}

function jumpToNextStage() {
    const { addMessage } = getUtilityFunctions();
    
    addMessage('system', '🔧 Developer command executed: JUMP TO NEXT STAGE');
    addMessage('system', '🚀 Warping to the antechamber...');
    
    // Jump to Stage 2 (antechamber)
    setTimeout(() => {
        window.location.href = 'stage2.html';
    }, 1500);
}

function jumpToStage(target) {
    const { addMessage } = getUtilityFunctions();
    
    addMessage('system', `🔧 Developer command executed: JUMP TO ${target.toUpperCase()}`);
    addMessage('system', '🚀 Warping through the bureaucratic void...');
    
    // Handle different stage targets
    switch (target.toLowerCase()) {
        case 'stage1':
        case 'castle':
        case 'gates':
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            break;
        case 'stage2':
        case 'antechamber':
        case 'clerks':
            setTimeout(() => {
                window.location.href = 'stage2.html';
            }, 1500);
            break;
        default:
            addMessage('system', `❌ Unknown stage: ${target}`);
            addMessage('system', 'Available stages: stage1, stage2, castle, antechamber');
            break;
    }
}

function showDevHelp() {
    const { addMessage } = getUtilityFunctions();
    
    addMessage('system', '🔧 Developer Commands:');
    addMessage('system', '• win.exe, .\\win.exe, win-- : Execute win condition');
    addMessage('system', '• skip-- : Skip current stage');
    addMessage('system', '• back-- : Go back to previous page');
    addMessage('system', '• jump-- : Jump to next stage');
    addMessage('system', '• jump--[stage] : Jump to specific stage');
    addMessage('system', '• goto [stage] : Navigate to stage');
    addMessage('system', '• console : Show debug information');
    addMessage('system', '• download logs : Export logs as text file');
    addMessage('system', '• dev help : Show this help');
    addMessage('system', '');
    addMessage('system', 'Available stages: stage1, stage2, castle, antechamber');
}

function showConsoleInfo() {
    const { addMessage } = getUtilityFunctions();
    const { currentGuard, riddleAttempts, gameStage } = getGameState();
    
    addMessage('system', '🔍 Console Debug Information:');
    addMessage('system', `• Current Guard: ${currentGuard || 'None'}`);
    addMessage('system', `• Riddle Attempts: ${riddleAttempts}`);
    addMessage('system', `• Game Stage: ${gameStage}`);
    addMessage('system', `• Page URL: ${window.location.href}`);
    addMessage('system', `• User Agent: ${navigator.userAgent.substring(0, 50)}...`);
    addMessage('system', `• Screen Size: ${window.innerWidth}x${window.innerHeight}`);
    addMessage('system', `• Timestamp: ${new Date().toLocaleString()}`);
    addMessage('system', `• IP Address: Client-side limitation (requires server)`);
    addMessage('system', `• Connection: ${navigator.connection ? navigator.connection.effectiveType || 'Unknown' : 'Unknown'}`);
    addMessage('system', `• Online Status: ${navigator.onLine ? 'Online' : 'Offline'}`);
    
    // Performance metrics removed - use DevTools for detailed performance data
    
    // Get location from IP
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            addMessage('system', `• Location: ${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`);
            addMessage('system', `• IP: ${data.ip || 'Unknown'}`);
            addMessage('system', `• ISP: ${data.org || 'Unknown'}`);
        })
        .catch(error => {
            addMessage('system', '• Location: Unable to fetch location data');
        });
    
    // Show localStorage data
    try {
        const recent = JSON.parse(localStorage.getItem('recent') || '{}');
        addMessage('system', '• LocalStorage Data:');
        Object.entries(recent).forEach(([key, value]) => {
            addMessage('system', `  - ${key}: ${value}`);
        });
    } catch (error) {
        addMessage('system', '• LocalStorage: Error reading data');
    }
    
    // Show conversation paths info
    addMessage('system', `• Available Guards: ${conversationPaths.map(p => p.id).join(', ')}`);
}

async function downloadConsoleLogs() {
    const { addMessage } = getUtilityFunctions();
    const { currentGuard, riddleAttempts, gameStage } = getGameState();
    
    addMessage('system', '📥 Generating console log file...');
    
    let logContent = `KAFKA'S CASTLE - CONSOLE LOG\n`;
    logContent += `Generated: ${new Date().toLocaleString()}\n`;
    logContent += `=====================================\n\n`;
    
    // Basic game info
    logContent += `GAME STATE:\n`;
    logContent += `• Current Guard: ${currentGuard || 'None'}\n`;
    logContent += `• Riddle Attempts: ${riddleAttempts}\n`;
    logContent += `• Game Stage: ${gameStage}\n\n`;
    
    // System info
    logContent += `SYSTEM INFORMATION:\n`;
    logContent += `• Page URL: ${window.location.href}\n`;
    logContent += `• User Agent: ${navigator.userAgent}\n`;
    logContent += `• Screen Size: ${window.innerWidth}x${window.innerHeight}\n`;
    logContent += `• Connection: ${navigator.connection ? navigator.connection.effectiveType || 'Unknown' : 'Unknown'}\n`;
    logContent += `• Online Status: ${navigator.onLine ? 'Online' : 'Offline'}\n\n`;
    
    // Location info
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        logContent += `LOCATION DATA:\n`;
        logContent += `• Location: ${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}\n`;
        logContent += `• IP: ${data.ip || 'Unknown'}\n`;
        logContent += `• ISP: ${data.org || 'Unknown'}\n`;
        logContent += `• Region: ${data.region || 'Unknown'}\n`;
        logContent += `• Timezone: ${data.timezone || 'Unknown'}\n\n`;
    } catch (error) {
        logContent += `LOCATION DATA:\n`;
        logContent += `• Error: Unable to fetch location data\n\n`;
    }
    
    // LocalStorage data
    logContent += `LOCAL STORAGE:\n`;
    try {
        const recent = JSON.parse(localStorage.getItem('recent') || '{}');
        Object.entries(recent).forEach(([key, value]) => {
            logContent += `• ${key}: ${value}\n`;
        });
    } catch (error) {
        logContent += `• Error reading localStorage data\n`;
    }
    logContent += `\n`;
    
    // Game data
    logContent += `GAME DATA:\n`;
    logContent += `• Available Guards: ${conversationPaths.map(p => p.id).join(', ')}\n`;
    logContent += `• Total Conversation Paths: ${conversationPaths.length}\n\n`;
    
    // Chat history (if available)
    const chatMessages = document.querySelectorAll('.message');
    if (chatMessages.length > 0) {
        logContent += `CHAT HISTORY (Last 20 messages):\n`;
        const recentMessages = Array.from(chatMessages).slice(-20);
        recentMessages.forEach(msg => {
            const sender = msg.classList.contains('user') ? 'USER' : 'SYSTEM';
            const text = msg.textContent || msg.innerText;
            logContent += `[${sender}] ${text}\n`;
        });
    }
    
    // Create and download file
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kafka-castle-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addMessage('system', '✅ Console logs downloaded successfully!');
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
    } while (state.recent.includes(response));
    addRecent(response);
    return response;
}

// Contextual lore responses based on player input - LAZY LOADING VERSION
function getContextualLoreResponse(guardId, playerInput) {
    const input = playerInput.toLowerCase();
    
    // Define response categories with their trigger patterns
    const responseCategories = {
        'help': /help|assist|aid|support/,
        'uncertainty': /lost|confused|don't know|unsure|purpose/,
        'business': /business|work|job|employment|career/,
        'exploration': /visit|see|explore|tour|look/,
        'urgency': /urgent|emergency|important|critical/,
        'personal': /family|friend|loved|person|someone/,
        'financial': /money|payment|cost|fee|price/,
        'sustenance': /food|hungry|eat|drink|rest/,
        'rest': /sleep|tired|rest|bed/,
        'safety': /danger|safe|risk|threat|kill/,
        'magic': /magic|spell|wizard|sorcerer/,
        'royal': /king|queen|royal|noble|lord/,
        'historical': /old|ancient|history|past/,
        'future': /future|tomorrow|later|soon/,
        'escape': /escape|leave|exit|go back/,
        'power': /power|strength|mighty|strong/,
        'knowledge': /knowledge|learn|study|wisdom/,
        'death': /death|die|dead|kill/,
        'love': /love|heart|romance|passion/,
        'fear': /fear|afraid|scared|terrified/,
        'name': /name|who are you|your name/,
        'weather': /weather|cold|hot|temperature/,
        'music': /music|song|sing|melody/,
        'book': /book|read|story|tale/,
        'dream': /dream|nightmare|sleep|vision/,
        'mirror': /mirror|reflection|see myself/,
        'clock': /clock|time|hour|minute/,
        'door': /door|gate|entrance|exit/,
        'window': /window|glass|view|outside/,
        'stone': /stone|rock|wall|brick/,
        'fire': /fire|flame|burn|heat/,
        'water': /water|river|lake|ocean/,
        'tree': /tree|forest|wood|nature/,
        'bird': /bird|fly|wing|sky/,
        'animal': /cat|dog|animal|pet/,
        'flower': /flower|rose|garden|plant/,
        'star': /star|moon|sun|sky/,
        'color': /color|red|blue|green/,
        'number': /number|count|math|calculate/,
        'letter': /letter|alphabet|word|language/,
        'machine': /machine|engine|gear|mechanism/,
        'light': /light|dark|shadow|bright/,
        'sound': /sound|noise|voice|echo/,
        'smell': /smell|scent|odor|fragrance/,
        'touch': /touch|feel|texture|smooth/,
        'taste': /taste|flavor|sweet|bitter/,
        'memory': /memory|remember|forget|recall/,
        'truth': /truth|lie|honest|deceive/,
        'emotion': /hope|despair|joy|sadness/,
        'life': /life|live|exist|being/,
        'divine': /god|divine|holy|sacred/,
        'evil': /devil|evil|sin|damnation/,
        'ghost': /ghost|spirit|phantom|specter/,
        'vampire': /vampire|blood|undead|night/,
        'witch': /witch|broom|spell|curse/,
        'dragon': /dragon|fire|wing|scale/,
        'unicorn': /unicorn|horn|magic|pure/,
        'fairy': /fairy|wing|magic|small/,
        'giant': /giant|huge|tall|massive/,
        'dwarf': /dwarf|small|short|underground/,
        'elf': /elf|pointed|forest|magical/,
        'orc': /orc|green|strong|warrior/,
        'troll': /troll|bridge|ugly|strong/,
        'goblin': /goblin|small|mischievous|treasure/,
        'phoenix': /phoenix|fire|rebirth|immortal/,
        'griffin': /griffin|eagle|lion|noble/,
        'mermaid': /mermaid|sea|fish|beautiful/,
        'centaur': /centaur|horse|human|wild/,
        'minotaur': /minotaur|bull|labyrinth|maze/,
        'sphinx': /sphinx|riddle|wisdom|guardian/,
        'pegasus': /pegasus|wing|horse|fly/,
        'hydra': /hydra|head|snake|regenerate/,
        'chimera': /chimera|lion|goat|snake/,
        'basilisk': /basilisk|snake|deadly|stone/,
        'kraken': /kraken|sea|tentacle|monster/,
        'leviathan': /leviathan|sea|giant|ancient/,
        'behemoth': /behemoth|land|giant|powerful/,
        'ziz': /ziz|sky|bird|giant/,
        'yeti': /yeti|snow|mountain|white/,
        'bigfoot': /bigfoot|forest|footprint|hairy/,
        'lochness': /loch ness|lake|monster|scotland/,
        'chupacabra': /chupacabra|goat|blood|mexico/,
        'mothman': /mothman|wing|red eye|west virginia/,
        'jerseydevil': /jersey devil|new jersey|wing|hoof/,
        'flatwoods': /flatwoods|monster|west virginia|alien/,
        'fresno': /fresno|nightcrawler|california|white/,
        'dover': /dover|demon|massachusetts|devil/,
        'springheeled': /spring heeled|jack|london|jump/,
        'blackshuck': /black shuck|dog|ghost|norfolk/,
        'bunyip': /bunyip|australia|swamp|water/,
        'dropbear': /drop bear|australia|koala|attack/,
        'yara': /yara ma yha who|australia|red|dwarf/,
        'taniwha': /taniwha|new zealand|water|guardian/,
        'wendigo': /wendigo|canada|cannibal|cold/,
        'sasquatch': /sasquatch|canada|bigfoot|hairy/,
        'ogopogo': /ogopogo|canada|lake|serpent/,
        'cadborosaurus': /cadborosaurus|canada|sea|serpent/,
        'memphre': /memphre|canada|lake|monster/,
        'manipogo': /manipogo|canada|lake|monster/,
        'champ': /champ|vermont|lake|monster/,
        'bessie': /bessie|ohio|lake|monster/,
        'chessie': /chessie|maryland|bay|monster/,
        'altamaha': /altamaha ha|georgia|river|monster/,
        'whiteriver': /white river|monster|arkansas|river/,
        'loveland': /loveland|frog|ohio|lizard/,
        'frogman': /frogman|ohio|river|amphibian/,
        'lizardman': /lizard man|south carolina|swamp|reptile/,
        'skunkape': /skunk ape|florida|swamp|ape/,
        'fouke': /fouke|monster|arkansas|swamp/,
        'honeyisland': /honey|island|swamp|monster|louisiana/,
        'swampape': /swamp|ape|louisiana|monster/,
        'momo': /momo|missouri|monster|ape/,
        'boggycreek': /boggy|creek|monster|oklahoma/
    };

    // Find matching category
    for (const [category, pattern] of Object.entries(responseCategories)) {
        if (pattern.test(input)) {
            return getLazyLoreResponse(guardId, category);
        }
    }
    
    // Universal fallback response if no category matches
    return getUniversalFallbackResponse(guardId, playerInput);
}

// Lazy loading lore response system
const loreResponseCache = {};

function getLazyLoreResponse(guardId, category) {
    const cacheKey = `${guardId}_${category}`;
    
    // Return cached response if available
    if (loreResponseCache[cacheKey]) {
        return loreResponseCache[cacheKey];
    }
    
    // Generate response on demand
    const response = generateLoreResponse(guardId, category);
    
    // Cache the response for future use
    loreResponseCache[cacheKey] = response;
    
    return response;
}

// Generate lore responses on demand
function generateLoreResponse(guardId, category) {
    const guardNames = {
        'echo': 'Cain',
        'keyboard': 'Seraphina', 
        'towel': 'Mortimer',
        'shadow': 'Vesper',
        'time': 'Chronos'
    };
    
    const guardName = guardNames[guardId];
    
    // Detailed responses for key categories
    const detailedResponses = {
        'help': {
            'echo': "Help? The castle offers no help, only tests. Those who seek assistance are often those who need it least. The halls echo with the pleas of countless others who asked for help. Their voices still linger, unanswered.",
            'keyboard': "Help is a bureaucratic construct. The castle processes help requests through the Department of Assistance, which has been permanently closed due to lack of funding. Your request has been filed under 'Unlikely to be Processed.'",
            'towel': "Help is like a towel - it absorbs your problems but never truly solves them. The castle's bureaucracy is designed to process, not assist. Those who seek help often find themselves deeper in the maze.",
            'shadow': "Help is just another shadow in these halls. The castle feeds on those who cannot help themselves. Your request for assistance has been noted and will be processed in the order received. Current wait time: eternity.",
            'time': "Help takes time, and time is what the castle has in abundance. Your request for assistance has been filed and will be reviewed in chronological order. Current processing queue: 47,892 requests ahead of yours."
        },
        'name': {
            'echo': `Names echo through these halls like whispers in the wind. I am Guard ${guardName}, keeper of the echo gate. Names have power here, but they also have weight. Your name has been noted and filed under 'Identity Records.'`,
            'keyboard': `Names are processed through the castle's identity systems. I am Guard ${guardName}, keeper of the keyboard gate. All names are logged and processed according to identification guidelines. Your name has been filed and assigned an identity case number.`,
            'towel': `Names are like towels - they absorb identity but never quite dry. I am Guard ${guardName}, keeper of the towel gate. The castle's name procedures are designed to provide minimal identification with maximum bureaucracy. Your name has been filed for processing.`,
            'shadow': `Names cast shadows of their own. I am Guard ${guardName}, keeper of the shadow gate. The castle's name operations are shrouded in mystery, its identities hidden from public view. Your name has been noted and will be processed when the castle deems it appropriate.`,
            'time': `Names take time to process properly. I am Guard ${guardName}, keeper of the time gate. The castle's identity services handle all such requests with care and attention to detail. Your name has been filed and will be processed in due course.`
        },
        'weather': {
            'echo': "Weather echoes through these halls like distant thunder. The castle's climate is bureaucratic - always the same, always changing. Your weather inquiry has been filed under 'Meteorological Affairs.'",
            'keyboard': "Weather is processed through the castle's climate systems. All weather requests are logged and processed according to atmospheric guidelines. Your request has been filed and assigned a weather case number.",
            'towel': "Weather is like a towel - it absorbs moisture but never quite dries. The castle's weather procedures are designed to provide minimal forecast with maximum bureaucracy. Your request has been filed for processing.",
            'shadow': "Weather casts shadows of its own. The castle's weather operations are shrouded in mystery, its forecasts hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
            'time': "Weather takes time to predict properly. The castle's meteorological services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
        },
        'music': {
            'echo': "Music echoes through these halls like the whispers of forgotten songs. The castle's melodies are bureaucratic - structured, repetitive, endless. Your music inquiry has been filed under 'Harmonic Affairs.'",
            'keyboard': "Music is processed through the castle's harmonic systems. All music requests are logged and processed according to melodic guidelines. Your request has been filed and assigned a music case number.",
            'towel': "Music is like a towel - it absorbs sound but never quite dries. The castle's music procedures are designed to provide minimal harmony with maximum bureaucracy. Your request has been filed for processing.",
            'shadow': "Music casts shadows of its own. The castle's musical operations are shrouded in mystery, its melodies hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
            'time': "Music takes time to compose properly. The castle's harmonic services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
        }
    };
    
    // Check if we have a detailed response for this category
    if (detailedResponses[category] && detailedResponses[category][guardId]) {
        return detailedResponses[category][guardId];
    }
    
    // Generate generic response for other categories
    return generateGenericLoreResponse(guardId, category);
}

// Generate generic lore responses for any category
function generateGenericLoreResponse(guardId, category) {
    const guardThemes = {
        'echo': 'echoes through these halls like whispers in the wind',
        'keyboard': 'is processed through the castle\'s classification systems',
        'towel': 'is like a towel - it absorbs interest but never quite dries',
        'shadow': 'casts shadows of its own',
        'time': 'takes time to process properly'
    };
    
    const guardEndings = {
        'echo': 'Your request has been filed under \'General Inquiries.\'',
        'keyboard': 'Your request has been filed and assigned a case number.',
        'towel': 'Your request has been filed for processing.',
        'shadow': 'Your request has been noted and will be processed when the castle deems it appropriate.',
        'time': 'Your request has been filed and will be processed in due course.'
    };
    
    const theme = guardThemes[guardId];
    const ending = guardEndings[guardId];
    
    return `The topic of ${category} ${theme}. The castle processes all inquiries about ${category} through its bureaucratic systems. ${ending}`;
}

// Contextual question responses
function getContextualQuestionResponse(guardId, playerInput) {
    const input = playerInput.toLowerCase();
    
    if (/what.*riddle|riddle.*what/.test(input)) {
        return "The riddle is already before you. Read it carefully and think.";
    } else if (/hint|clue|help/.test(input)) {
        const state = getGameState();
        return state.currentRiddle ? state.currentRiddle.hint : "The castle provides no hints. Think carefully about the riddle.";
    } else if (/answer|solution/.test(input)) {
        return "The answer is not given freely. You must discover it yourself.";
    } else if (/why.*riddle|riddle.*why/.test(input)) {
        return "The castle tests all who seek entry. The riddle reveals your worth.";
    } else {
        const response = getGuardQuestionResponse(guardId);
        return response || "Your question has been noted. The castle's procedures require you to think for yourself.";
    }
}

// Contextual wrong answer responses
function getContextualWrongAnswerResponse(guardId, playerInput) {
    const input = playerInput.toLowerCase();
    
    if (/yes|no|maybe|perhaps/.test(input)) {
        const response = getUncertaintyWrongAnswer(guardId);
        return response || "Uncertainty is not accepted in the castle's procedures. The riddle requires a definitive answer.";
    } else if (/i don't know|dunno|unsure/.test(input)) {
        const response = getIgnoranceWrongAnswer(guardId);
        return response || "Ignorance is not an option. The castle's archives contain all knowledge. Think carefully about the riddle.";
    } else if (/guess|try|attempt/.test(input)) {
        const response = getGuessingWrongAnswer(guardId);
        return response || "Guessing is not thinking. The castle's procedures require precision. Apply logic to the riddle.";
    } else if (/door|gate|entrance|way in/.test(input)) {
        const response = getDoorWrongAnswer(guardId);
        return response || "Doors are not the answer. The riddle speaks of something else entirely. Think of the phenomenon described.";
    } else if (/castle|building|fortress/.test(input)) {
        const response = getCastleWrongAnswer(guardId);
        return response || "The castle itself is not the answer. The riddle speaks of something within the castle, not the castle itself.";
    } else if (/guard|soldier|protector/.test(input)) {
        const response = getGuardWrongAnswer(guardId);
        return response || "Guards are not the answer. We protect the castle, but the riddle speaks of something else.";
    } else if (/paper|form|document/.test(input)) {
        const response = getPaperworkWrongAnswer(guardId);
        return response || "Paperwork is the castle's lifeblood, but it is not the answer. Think of the natural phenomenon described.";
    } else if (/time|clock|hour/.test(input)) {
        const response = getTimeWrongAnswer(guardId);
        return response || "Time is the castle's domain, but it is not the answer. The riddle speaks of something temporal but not time itself.";
    } else if (/key|lock|unlock/.test(input)) {
        const response = getKeyWrongAnswer(guardId);
        return response || "Keys unlock doors, but they are not the answer. The riddle speaks of something with keys metaphorically, not literally.";
    } else if (/light|dark|shadow/.test(input)) {
        const response = getLightWrongAnswer(guardId);
        return response || "Light illuminates, but it is not the answer. The riddle speaks of something else entirely.";
    } else if (/wind|air|breeze/.test(input)) {
        const response = getWindWrongAnswer(guardId);
        return response || "Wind is natural, but the riddle speaks of something man-made or a specific phenomenon.";
    } else if (/water|wet|dry/.test(input)) {
        const response = getWaterWrongAnswer(guardId);
        return response || "Water is what gets dried, but it is not the answer. Think of what you use to dry water.";
    } else if (/sound|voice|speak/.test(input)) {
        const response = getSoundWrongAnswer(guardId);
        return response || "Sound is what creates the answer, but it is not the answer itself. Think of the phenomenon, not the source.";
    } else if (/machine|device|tool/.test(input)) {
        const response = getMachineWrongAnswer(guardId);
        return response || "Machines are man-made, but the riddle speaks of a natural phenomenon or specific object.";
    } else {
        const response = getGenericWrongAnswer(guardId);
        return response || "Your answer is incorrect. The castle's procedures require the correct response to the riddle. Think carefully and try again.";
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

// Lore response functions - expanded system
function getHelpSeekingResponse(guardId) {
    const responses = {
        'echo': "Help? The castle offers no help, only tests. Those who seek assistance are often those who need it least. The halls echo with the pleas of countless others who asked for help. Their voices still linger, unanswered.",
        'keyboard': "Help is a bureaucratic construct. The castle processes help requests through the Department of Assistance, which has been permanently closed due to lack of funding. Your request has been filed under 'Unlikely to be Processed.'",
        'towel': "Help is like a towel - it absorbs your problems but never truly solves them. The castle's bureaucracy is designed to process, not assist. Those who seek help often find themselves deeper in the maze.",
        'shadow': "Help is just another shadow in these halls. The castle feeds on those who cannot help themselves. Your request for assistance has been noted and will be processed in the order received. Current wait time: eternity.",
        'time': "Help takes time, and time is what the castle has in abundance. Your request for assistance has been filed and will be reviewed in chronological order. Current processing queue: 47,892 requests ahead of yours."
    };
    return responses[guardId];
}

function getUncertaintyResponse(guardId) {
    const responses = {
        'echo': "Uncertainty echoes through these halls like a constant refrain. The castle thrives on doubt, feeds on confusion. Those who are certain of their purpose often find themselves most lost. Embrace the uncertainty - it may be your only guide.",
        'keyboard': "Uncertainty is the default state in the castle's systems. Every form has a 'maybe' option, every decision a 'pending' status. The clerks process uncertainty with the same efficiency as certainty. Your confusion has been logged and filed.",
        'towel': "Uncertainty is like a wet towel - it clings to you, weighs you down. The castle's bureaucracy is built on the principle that nothing is ever truly certain. Your doubts have been processed and filed under 'General Inquiries.'",
        'shadow': "Uncertainty is just another shadow to be consumed. The castle feeds on those who cannot make up their minds. Your indecision has been noted and will be used against you in future proceedings.",
        'time': "Uncertainty wastes time, and time is the castle's most precious commodity. Your doubts have been processed and filed. Estimated resolution time: never. The castle values decisiveness, even if the decision is wrong."
    };
    return responses[guardId];
}

function getBusinessResponse(guardId) {
    const responses = {
        'echo': "Business? The castle processes all forms of business, from the mundane to the metaphysical. Every transaction echoes through these halls, every deal filed in triplicate. Your business has been noted and will be processed according to standard procedures.",
        'keyboard': "Business is the castle's primary function. The Central Bureaucratic Authority processes all commercial transactions, from simple purchases to complex corporate mergers. Your business inquiry has been logged and assigned a case number.",
        'towel': "Business is like a towel - it absorbs resources and never quite dries. The castle's business procedures are designed to be thorough, which means they are also endless. Your request has been filed under 'Commercial Transactions.'",
        'shadow': "Business casts long shadows in these halls. The castle's commercial operations are shrouded in mystery, its financial dealings hidden from public view. Your business inquiry has been noted and will be processed in due course.",
        'time': "Business takes time, and the castle has all the time in the world. Your commercial inquiry has been filed and will be processed in chronological order. Current processing queue: 23,456 business requests ahead of yours."
    };
    return responses[guardId];
}

function getExplorationResponse(guardId) {
    const responses = {
        'echo': "Exploration? The castle's corridors echo with the footsteps of countless explorers who came before you. Some found what they sought, others found only more corridors. Your desire to explore has been noted and filed under 'Adventure Permits.'",
        'keyboard': "Exploration requires proper documentation. The castle's exploration permits are processed through the Department of Discovery, which has been temporarily closed for renovations. Your request has been filed for future consideration.",
        'towel': "Exploration is like using a towel to map a maze - it absorbs information but never provides a clear path. The castle's layout is designed to confuse and disorient. Your exploration request has been processed and denied.",
        'shadow': "Exploration leads to shadows, and shadows lead to more shadows. The castle's depths are endless, its secrets infinite. Your desire to explore has been noted and will be used to determine your clearance level.",
        'time': "Exploration takes time, and time is what the castle values most. Your request to explore has been filed and will be processed in due course. Estimated approval time: several lifetimes."
    };
    return responses[guardId];
}

function getUrgencyResponse(guardId) {
    const responses = {
        'echo': "Urgency? The castle's halls echo with the cries of those who claimed their business was urgent. The echoes fade, but the urgency remains. Your urgent request has been filed under 'Priority Processing' - queue position: 15,789.",
        'keyboard': "Urgency is a relative concept in the castle's systems. The Central Bureaucratic Authority processes all requests with equal efficiency, which means equally slowly. Your urgent matter has been logged and assigned a case number.",
        'towel': "Urgency is like a wet towel - it demands immediate attention but never gets it. The castle's procedures are designed to be thorough, not fast. Your urgent request has been filed and will be processed according to standard protocols.",
        'shadow': "Urgency casts shadows of its own. The castle feeds on those who rush, those who cannot wait. Your urgent request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Urgency is meaningless in a place where time stands still. Your urgent request has been filed and will be processed in chronological order. Current processing queue: 34,567 urgent requests ahead of yours."
    };
    return responses[guardId];
}

function getPersonalResponse(guardId) {
    const responses = {
        'echo': "Personal matters echo through these halls like whispers in the night. The castle processes all forms of personal business, from family matters to romantic entanglements. Your personal inquiry has been filed under 'Private Affairs.'",
        'keyboard': "Personal matters require special handling. The castle's privacy protocols ensure that all personal inquiries are processed with the utmost discretion. Your request has been logged and assigned a confidential case number.",
        'towel': "Personal matters are like towels - they absorb emotions but never quite dry. The castle's bureaucracy handles personal affairs with the same efficiency as business matters. Your inquiry has been filed for processing.",
        'shadow': "Personal matters cast the longest shadows. The castle's privacy policies ensure that all personal inquiries are kept confidential, which means they are also forgotten. Your request has been noted and filed.",
        'time': "Personal matters take time to process properly. The castle's personal affairs department handles all such inquiries with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getFinancialResponse(guardId) {
    const responses = {
        'echo': "Financial matters echo through the castle's halls like the clinking of coins. The castle processes all forms of financial transactions, from simple payments to complex investments. Your financial inquiry has been filed under 'Monetary Affairs.'",
        'keyboard': "Financial matters require precise documentation. The castle's financial systems process all transactions with mathematical accuracy. Your inquiry has been logged and assigned a financial case number.",
        'towel': "Financial matters are like towels - they absorb resources but never quite dry. The castle's financial procedures are designed to be thorough and accurate. Your request has been filed for processing.",
        'shadow': "Financial matters cast shadows of their own. The castle's financial operations are shrouded in mystery, its accounts hidden from public view. Your inquiry has been noted and will be processed in due course.",
        'time': "Financial matters take time to process properly. The castle's financial department handles all such inquiries with care and attention to detail. Your request has been filed and will be processed in chronological order."
    };
    return responses[guardId];
}

function getSustenanceResponse(guardId) {
    const responses = {
        'echo': "Sustenance? The castle's halls echo with the sounds of hunger, the cries of those who sought nourishment. The castle provides sustenance of a different kind - knowledge, wisdom, bureaucracy. Your request for food has been filed under 'Nutritional Requirements.'",
        'keyboard': "Sustenance is processed through the castle's nutritional systems. All food requests are logged and processed according to dietary guidelines. Your request has been filed and assigned a nutritional case number.",
        'towel': "Sustenance is like a towel - it absorbs hunger but never quite satisfies. The castle's food services are designed to provide minimal nutrition with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Sustenance casts shadows of its own. The castle's food services are shrouded in mystery, its kitchens hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Sustenance takes time to prepare properly. The castle's food services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getRestResponse(guardId) {
    const responses = {
        'echo': "Rest? The castle's halls echo with the sounds of those who sought sleep, the whispers of those who found none. The castle provides rest of a different kind - the rest of the bureaucratic process. Your request has been filed under 'Sleep Permits.'",
        'keyboard': "Rest is processed through the castle's accommodation systems. All sleep requests are logged and processed according to rest guidelines. Your request has been filed and assigned a rest case number.",
        'towel': "Rest is like a towel - it absorbs fatigue but never quite refreshes. The castle's rest facilities are designed to provide minimal comfort with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Rest casts shadows of its own. The castle's rest facilities are shrouded in mystery, its bedrooms hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Rest takes time to arrange properly. The castle's accommodation services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getSafetyResponse(guardId) {
    const responses = {
        'echo': "Safety? The castle's halls echo with the cries of those who sought protection, the whispers of those who found none. The castle provides safety of a different kind - the safety of bureaucratic procedure. Your request has been filed under 'Security Protocols.'",
        'keyboard': "Safety is processed through the castle's security systems. All safety requests are logged and processed according to security guidelines. Your request has been filed and assigned a security case number.",
        'towel': "Safety is like a towel - it absorbs danger but never quite protects. The castle's security measures are designed to provide minimal protection with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Safety casts shadows of its own. The castle's security operations are shrouded in mystery, its protective measures hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Safety takes time to arrange properly. The castle's security services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getMagicResponse(guardId) {
    const responses = {
        'echo': "Magic? The castle's halls echo with the whispers of spells, the murmurs of incantations. The castle's magic is bureaucratic - it transforms requests into forms, desires into procedures. Your inquiry has been filed under 'Mystical Affairs.'",
        'keyboard': "Magic is processed through the castle's mystical systems. All magical requests are logged and processed according to arcane guidelines. Your request has been filed and assigned a magical case number.",
        'towel': "Magic is like a towel - it absorbs the impossible but never quite makes it real. The castle's magical procedures are designed to provide minimal enchantment with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Magic casts the darkest shadows. The castle's magical operations are shrouded in mystery, its spells hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Magic takes time to weave properly. The castle's mystical services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getRoyalResponse(guardId) {
    const responses = {
        'echo': "Royalty? The castle's halls echo with the footsteps of kings and queens who came before you. Their crowns have turned to dust, their thrones to bureaucratic chairs. Your inquiry has been filed under 'Noble Affairs.'",
        'keyboard': "Royalty is processed through the castle's noble systems. All royal requests are logged and processed according to aristocratic guidelines. Your request has been filed and assigned a noble case number.",
        'towel': "Royalty is like a towel - it absorbs privilege but never quite dries. The castle's noble procedures are designed to provide minimal luxury with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Royalty casts the longest shadows. The castle's noble operations are shrouded in mystery, its aristocratic dealings hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Royalty takes time to process properly. The castle's noble services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getHistoricalResponse(guardId) {
    const responses = {
        'echo': "History? The castle's halls echo with the voices of the past, the whispers of those who came before. Every stone tells a story, every corridor holds a memory. Your inquiry has been filed under 'Historical Records.'",
        'keyboard': "History is processed through the castle's archival systems. All historical requests are logged and processed according to documentation guidelines. Your request has been filed and assigned a historical case number.",
        'towel': "History is like a towel - it absorbs the past but never quite dries. The castle's historical procedures are designed to provide minimal information with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "History casts the darkest shadows. The castle's historical operations are shrouded in mystery, its archives hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "History takes time to research properly. The castle's archival services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getFutureResponse(guardId) {
    const responses = {
        'echo': "Future? The castle's halls echo with the promises of tomorrow, the whispers of what might be. The future is always coming but never arrives. Your inquiry has been filed under 'Prognostication.'",
        'keyboard': "Future is processed through the castle's predictive systems. All future requests are logged and processed according to forecasting guidelines. Your request has been filed and assigned a future case number.",
        'towel': "Future is like a towel - it absorbs possibilities but never quite dries. The castle's future procedures are designed to provide minimal prediction with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Future casts the most uncertain shadows. The castle's future operations are shrouded in mystery, its predictions hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Future takes time to predict properly. The castle's prognostic services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getEscapeResponse(guardId) {
    const responses = {
        'echo': "Escape? The castle's halls echo with the cries of those who sought freedom, the whispers of those who found none. The castle's exit is always just around the corner, but the corner never ends. Your request has been filed under 'Exit Permits.'",
        'keyboard': "Escape is processed through the castle's exit systems. All escape requests are logged and processed according to departure guidelines. Your request has been filed and assigned an exit case number.",
        'towel': "Escape is like a towel - it absorbs the desire to leave but never quite dries. The castle's exit procedures are designed to provide minimal freedom with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Escape casts the most elusive shadows. The castle's exit operations are shrouded in mystery, its doors hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Escape takes time to arrange properly. The castle's exit services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getPowerResponse(guardId) {
    const responses = {
        'echo': "Power? The castle's halls echo with the footsteps of those who sought strength, the whispers of those who found weakness. The castle's power is bureaucratic - it transforms desire into procedure. Your inquiry has been filed under 'Authority Requests.'",
        'keyboard': "Power is processed through the castle's authority systems. All power requests are logged and processed according to strength guidelines. Your request has been filed and assigned a power case number.",
        'towel': "Power is like a towel - it absorbs strength but never quite dries. The castle's power procedures are designed to provide minimal authority with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Power casts the darkest shadows. The castle's power operations are shrouded in mystery, its authority hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Power takes time to grant properly. The castle's authority services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getKnowledgeResponse(guardId) {
    const responses = {
        'echo': "Knowledge? The castle's halls echo with the whispers of wisdom, the murmurs of understanding. The castle's knowledge is bureaucratic - it transforms curiosity into forms. Your inquiry has been filed under 'Educational Affairs.'",
        'keyboard': "Knowledge is processed through the castle's educational systems. All knowledge requests are logged and processed according to learning guidelines. Your request has been filed and assigned a knowledge case number.",
        'towel': "Knowledge is like a towel - it absorbs information but never quite dries. The castle's knowledge procedures are designed to provide minimal education with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Knowledge casts the most illuminating shadows. The castle's knowledge operations are shrouded in mystery, its wisdom hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Knowledge takes time to acquire properly. The castle's educational services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getDeathResponse(guardId) {
    const responses = {
        'echo': "Death? The castle's halls echo with the whispers of those who have passed, the murmurs of those who remain. The castle's death is bureaucratic - it transforms life into paperwork. Your inquiry has been filed under 'Mortality Affairs.'",
        'keyboard': "Death is processed through the castle's mortality systems. All death requests are logged and processed according to final guidelines. Your request has been filed and assigned a death case number.",
        'towel': "Death is like a towel - it absorbs life but never quite dries. The castle's death procedures are designed to provide minimal finality with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Death casts the darkest shadows. The castle's death operations are shrouded in mystery, its finality hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Death takes time to process properly. The castle's mortality services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getLoveResponse(guardId) {
    const responses = {
        'echo': "Love? The castle's halls echo with the whispers of romance, the murmurs of passion. The castle's love is bureaucratic - it transforms emotion into forms. Your inquiry has been filed under 'Romantic Affairs.'",
        'keyboard': "Love is processed through the castle's romantic systems. All love requests are logged and processed according to emotional guidelines. Your request has been filed and assigned a love case number.",
        'towel': "Love is like a towel - it absorbs emotion but never quite dries. The castle's love procedures are designed to provide minimal romance with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Love casts the most beautiful shadows. The castle's love operations are shrouded in mystery, its passion hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Love takes time to cultivate properly. The castle's romantic services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getFearResponse(guardId) {
    const responses = {
        'echo': "Fear? The castle's halls echo with the cries of terror, the whispers of dread. The castle's fear is bureaucratic - it transforms terror into forms. Your inquiry has been filed under 'Anxiety Management.'",
        'keyboard': "Fear is processed through the castle's anxiety systems. All fear requests are logged and processed according to terror guidelines. Your request has been filed and assigned a fear case number.",
        'towel': "Fear is like a towel - it absorbs terror but never quite dries. The castle's fear procedures are designed to provide minimal comfort with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Fear casts the most terrifying shadows. The castle's fear operations are shrouded in mystery, its terror hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Fear takes time to process properly. The castle's anxiety services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

// Additional lore response functions for expanded categories
function getNameResponse(guardId) {
    const responses = {
        'echo': "Names echo through these halls like whispers in the wind. I am Guard Cain, keeper of the echo gate. Names have power here, but they also have weight. Your name has been noted and filed under 'Identity Records.'",
        'keyboard': "Names are processed through the castle's identity systems. I am Guard Seraphina, keeper of the keyboard gate. All names are logged and processed according to identification guidelines. Your name has been filed and assigned an identity case number.",
        'towel': "Names are like towels - they absorb identity but never quite dry. I am Guard Mortimer, keeper of the towel gate. The castle's name procedures are designed to provide minimal identification with maximum bureaucracy. Your name has been filed for processing.",
        'shadow': "Names cast shadows of their own. I am Guard Vesper, keeper of the shadow gate. The castle's name operations are shrouded in mystery, its identities hidden from public view. Your name has been noted and will be processed when the castle deems it appropriate.",
        'time': "Names take time to process properly. I am Guard Chronos, keeper of the time gate. The castle's identity services handle all such requests with care and attention to detail. Your name has been filed and will be processed in due course."
    };
    return responses[guardId];
}

// Continue with more lore response functions...
function getWeatherResponse(guardId) {
    const responses = {
        'echo': "Weather echoes through these halls like distant thunder. The castle's climate is bureaucratic - always the same, always changing. Your weather inquiry has been filed under 'Meteorological Affairs.'",
        'keyboard': "Weather is processed through the castle's climate systems. All weather requests are logged and processed according to atmospheric guidelines. Your request has been filed and assigned a weather case number.",
        'towel': "Weather is like a towel - it absorbs moisture but never quite dries. The castle's weather procedures are designed to provide minimal forecast with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Weather casts shadows of its own. The castle's weather operations are shrouded in mystery, its forecasts hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Weather takes time to predict properly. The castle's meteorological services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

// Add more functions for the remaining categories...
// (I'll continue with a few more key ones to show the pattern)

function getMusicResponse(guardId) {
    const responses = {
        'echo': "Music echoes through these halls like the whispers of forgotten songs. The castle's melodies are bureaucratic - structured, repetitive, endless. Your music inquiry has been filed under 'Harmonic Affairs.'",
        'keyboard': "Music is processed through the castle's harmonic systems. All music requests are logged and processed according to melodic guidelines. Your request has been filed and assigned a music case number.",
        'towel': "Music is like a towel - it absorbs sound but never quite dries. The castle's music procedures are designed to provide minimal harmony with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Music casts shadows of its own. The castle's musical operations are shrouded in mystery, its melodies hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Music takes time to compose properly. The castle's harmonic services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

function getBookResponse(guardId) {
    const responses = {
        'echo': "Books echo through these halls like the rustling of ancient pages. The castle's library is bureaucratic - every story filed, every tale catalogued. Your book inquiry has been filed under 'Literary Affairs.'",
        'keyboard': "Books are processed through the castle's library systems. All book requests are logged and processed according to reading guidelines. Your request has been filed and assigned a book case number.",
        'towel': "Books are like towels - they absorb knowledge but never quite dry. The castle's book procedures are designed to provide minimal reading with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Books cast shadows of their own. The castle's literary operations are shrouded in mystery, its stories hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Books take time to read properly. The castle's library services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

// Continue with the remaining functions following the same pattern...
// For brevity, I'll add a few more key ones and note that the pattern continues

function getDreamResponse(guardId) {
    const responses = {
        'echo': "Dreams echo through these halls like whispers in the night. The castle's dreams are bureaucratic - structured, repetitive, endless. Your dream inquiry has been filed under 'Oneiric Affairs.'",
        'keyboard': "Dreams are processed through the castle's oneiric systems. All dream requests are logged and processed according to sleep guidelines. Your request has been filed and assigned a dream case number.",
        'towel': "Dreams are like towels - they absorb imagination but never quite dry. The castle's dream procedures are designed to provide minimal fantasy with maximum bureaucracy. Your request has been filed for processing.",
        'shadow': "Dreams cast shadows of their own. The castle's oneiric operations are shrouded in mystery, its visions hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.",
        'time': "Dreams take time to process properly. The castle's oneiric services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course."
    };
    return responses[guardId];
}

// Add placeholder functions for all the remaining categories
// (The pattern continues for all the categories I added to the getContextualLoreResponse function)

function getMirrorResponse(guardId) { return getGenericLoreResponse(guardId, "mirror"); }
function getClockResponse(guardId) { return getGenericLoreResponse(guardId, "clock"); }
function getDoorResponse(guardId) { return getGenericLoreResponse(guardId, "door"); }
function getWindowResponse(guardId) { return getGenericLoreResponse(guardId, "window"); }
function getStoneResponse(guardId) { return getGenericLoreResponse(guardId, "stone"); }
function getFireResponse(guardId) { return getGenericLoreResponse(guardId, "fire"); }
function getWaterResponse(guardId) { return getGenericLoreResponse(guardId, "water"); }
function getTreeResponse(guardId) { return getGenericLoreResponse(guardId, "tree"); }
function getBirdResponse(guardId) { return getGenericLoreResponse(guardId, "bird"); }
function getAnimalResponse(guardId) { return getGenericLoreResponse(guardId, "animal"); }
function getFlowerResponse(guardId) { return getGenericLoreResponse(guardId, "flower"); }
function getStarResponse(guardId) { return getGenericLoreResponse(guardId, "star"); }
function getColorResponse(guardId) { return getGenericLoreResponse(guardId, "color"); }
function getNumberResponse(guardId) { return getGenericLoreResponse(guardId, "number"); }
function getLetterResponse(guardId) { return getGenericLoreResponse(guardId, "letter"); }
function getMachineResponse(guardId) { return getGenericLoreResponse(guardId, "machine"); }
function getLightResponse(guardId) { return getGenericLoreResponse(guardId, "light"); }
function getSoundResponse(guardId) { return getGenericLoreResponse(guardId, "sound"); }
function getSmellResponse(guardId) { return getGenericLoreResponse(guardId, "smell"); }
function getTouchResponse(guardId) { return getGenericLoreResponse(guardId, "touch"); }
function getTasteResponse(guardId) { return getGenericLoreResponse(guardId, "taste"); }
function getMemoryResponse(guardId) { return getGenericLoreResponse(guardId, "memory"); }
function getTruthResponse(guardId) { return getGenericLoreResponse(guardId, "truth"); }
function getEmotionResponse(guardId) { return getGenericLoreResponse(guardId, "emotion"); }
function getLifeResponse(guardId) { return getGenericLoreResponse(guardId, "life"); }
function getDivineResponse(guardId) { return getGenericLoreResponse(guardId, "divine"); }
function getEvilResponse(guardId) { return getGenericLoreResponse(guardId, "evil"); }
function getGhostResponse(guardId) { return getGenericLoreResponse(guardId, "ghost"); }
function getVampireResponse(guardId) { return getGenericLoreResponse(guardId, "vampire"); }
function getWitchResponse(guardId) { return getGenericLoreResponse(guardId, "witch"); }
function getDragonResponse(guardId) { return getGenericLoreResponse(guardId, "dragon"); }
function getUnicornResponse(guardId) { return getGenericLoreResponse(guardId, "unicorn"); }
function getFairyResponse(guardId) { return getGenericLoreResponse(guardId, "fairy"); }
function getGiantResponse(guardId) { return getGenericLoreResponse(guardId, "giant"); }
function getDwarfResponse(guardId) { return getGenericLoreResponse(guardId, "dwarf"); }
function getElfResponse(guardId) { return getGenericLoreResponse(guardId, "elf"); }
function getOrcResponse(guardId) { return getGenericLoreResponse(guardId, "orc"); }
function getTrollResponse(guardId) { return getGenericLoreResponse(guardId, "troll"); }
function getGoblinResponse(guardId) { return getGenericLoreResponse(guardId, "goblin"); }
function getPhoenixResponse(guardId) { return getGenericLoreResponse(guardId, "phoenix"); }
function getGriffinResponse(guardId) { return getGenericLoreResponse(guardId, "griffin"); }
function getMermaidResponse(guardId) { return getGenericLoreResponse(guardId, "mermaid"); }
function getCentaurResponse(guardId) { return getGenericLoreResponse(guardId, "centaur"); }
function getMinotaurResponse(guardId) { return getGenericLoreResponse(guardId, "minotaur"); }
function getSphinxResponse(guardId) { return getGenericLoreResponse(guardId, "sphinx"); }
function getPegasusResponse(guardId) { return getGenericLoreResponse(guardId, "pegasus"); }
function getHydraResponse(guardId) { return getGenericLoreResponse(guardId, "hydra"); }
function getChimeraResponse(guardId) { return getGenericLoreResponse(guardId, "chimera"); }
function getBasiliskResponse(guardId) { return getGenericLoreResponse(guardId, "basilisk"); }
function getKrakenResponse(guardId) { return getGenericLoreResponse(guardId, "kraken"); }
function getLeviathanResponse(guardId) { return getGenericLoreResponse(guardId, "leviathan"); }
function getBehemothResponse(guardId) { return getGenericLoreResponse(guardId, "behemoth"); }
function getZizResponse(guardId) { return getGenericLoreResponse(guardId, "ziz"); }
function getYetiResponse(guardId) { return getGenericLoreResponse(guardId, "yeti"); }
function getBigfootResponse(guardId) { return getGenericLoreResponse(guardId, "bigfoot"); }
function getLochNessResponse(guardId) { return getGenericLoreResponse(guardId, "loch ness"); }
function getChupacabraResponse(guardId) { return getGenericLoreResponse(guardId, "chupacabra"); }
function getMothmanResponse(guardId) { return getGenericLoreResponse(guardId, "mothman"); }
function getJerseyDevilResponse(guardId) { return getGenericLoreResponse(guardId, "jersey devil"); }
function getFlatwoodsResponse(guardId) { return getGenericLoreResponse(guardId, "flatwoods"); }
function getFresnoResponse(guardId) { return getGenericLoreResponse(guardId, "fresno"); }
function getDoverResponse(guardId) { return getGenericLoreResponse(guardId, "dover"); }
function getSpringHeeledResponse(guardId) { return getGenericLoreResponse(guardId, "spring heeled"); }
function getBlackShuckResponse(guardId) { return getGenericLoreResponse(guardId, "black shuck"); }
function getBunyipResponse(guardId) { return getGenericLoreResponse(guardId, "bunyip"); }
function getDropBearResponse(guardId) { return getGenericLoreResponse(guardId, "drop bear"); }
function getYaraResponse(guardId) { return getGenericLoreResponse(guardId, "yara"); }
function getTaniwhaResponse(guardId) { return getGenericLoreResponse(guardId, "taniwha"); }
function getWendigoResponse(guardId) { return getGenericLoreResponse(guardId, "wendigo"); }
function getSasquatchResponse(guardId) { return getGenericLoreResponse(guardId, "sasquatch"); }
function getOgopogoResponse(guardId) { return getGenericLoreResponse(guardId, "ogopogo"); }
function getCadborosaurusResponse(guardId) { return getGenericLoreResponse(guardId, "cadborosaurus"); }
function getMemphreResponse(guardId) { return getGenericLoreResponse(guardId, "memphre"); }
function getManipogoResponse(guardId) { return getGenericLoreResponse(guardId, "manipogo"); }
function getChampResponse(guardId) { return getGenericLoreResponse(guardId, "champ"); }
function getBessieResponse(guardId) { return getGenericLoreResponse(guardId, "bessie"); }
function getChessieResponse(guardId) { return getGenericLoreResponse(guardId, "chessie"); }
function getAltamahaResponse(guardId) { return getGenericLoreResponse(guardId, "altamaha"); }
function getWhiteRiverResponse(guardId) { return getGenericLoreResponse(guardId, "white river"); }
function getLovelandResponse(guardId) { return getGenericLoreResponse(guardId, "loveland"); }
function getFrogmanResponse(guardId) { return getGenericLoreResponse(guardId, "frogman"); }
function getLizardManResponse(guardId) { return getGenericLoreResponse(guardId, "lizard man"); }
function getSkunkApeResponse(guardId) { return getGenericLoreResponse(guardId, "skunk ape"); }
function getFoukeResponse(guardId) { return getGenericLoreResponse(guardId, "fouke"); }
function getHoneyIslandResponse(guardId) { return getGenericLoreResponse(guardId, "honey island"); }
function getSwampApeResponse(guardId) { return getGenericLoreResponse(guardId, "swamp ape"); }
function getMomoResponse(guardId) { return getGenericLoreResponse(guardId, "momo"); }
function getBoggyCreekResponse(guardId) { return getGenericLoreResponse(guardId, "boggy creek"); }

// Generic fallback for any lore response
function getGenericLoreResponse(guardId, topic) {
    const responses = {
        'echo': `The topic of ${topic} echoes through these halls like whispers in the wind. The castle processes all inquiries about ${topic} through its bureaucratic systems. Your request has been filed under 'General Inquiries.'`,
        'keyboard': `${topic} is processed through the castle's classification systems. All ${topic} requests are logged and processed according to standard guidelines. Your request has been filed and assigned a case number.`,
        'towel': `${topic} is like a towel - it absorbs interest but never quite dries. The castle's ${topic} procedures are designed to provide minimal information with maximum bureaucracy. Your request has been filed for processing.`,
        'shadow': `${topic} casts shadows of its own. The castle's ${topic} operations are shrouded in mystery, its secrets hidden from public view. Your request has been noted and will be processed when the castle deems it appropriate.`,
        'time': `${topic} takes time to process properly. The castle's ${topic} services handle all such requests with care and attention to detail. Your request has been filed and will be processed in due course.`
    };
    
    // Fallback for unknown guard IDs
    if (!responses[guardId]) {
        return `Your inquiry about ${topic} has been received and filed in the castle's bureaucratic system. All requests are processed according to established protocols. Please await further instructions.`;
    }
    
    return responses[guardId];
}

// Universal fallback response for any unexpected input
function getUniversalFallbackResponse(guardId, userInput) {
    const fallbackResponses = {
        'echo': "Your words echo through the halls, but the castle's bureaucracy requires more specific information. Please rephrase your request in a manner befitting our administrative procedures.",
        'keyboard': "Your input has been received but does not conform to our standard classification system. Please provide a more structured inquiry that can be properly filed and processed.",
        'towel': "Your request is like a damp towel - it needs to be wrung out and properly formatted. The castle's systems require clarity and precision in all communications.",
        'shadow': "Your words cast shadows of confusion. The castle's bureaucratic processes demand clarity and purpose. Please restate your request in a more direct manner.",
        'time': "Time is precious in the castle's administrative systems. Your request requires more specific formatting to be processed efficiently. Please provide a clearer statement of your needs."
    };
    
    // Fallback for unknown guard IDs
    if (!fallbackResponses[guardId]) {
        return "Your communication has been received but does not meet the castle's bureaucratic standards. Please reformulate your request in accordance with our administrative protocols.";
    }
    
    return fallbackResponses[guardId];
}

// Game start - optimized with lazy loading
function startGame() {
    const startTime = performance.now();
    simpleMetrics.gameStartTime = startTime;
    
    try {
        const elements = getGameElements();
        const state = getGameState();
        const utils = getUtilityFunctions();
        
        // Always show guard greeting on page load
        const paths = getConversationPaths();
        const currentGuard = state.currentGuard || paths[Math.floor(Math.random() * paths.length)].id;
        const currentPath = paths.find(p => p.id === currentGuard) || paths[0];
        
        // Initialize game state if not already set
        if (!state.currentGuard) {
            const randomRiddle = currentPath.riddles[Math.floor(Math.random() * currentPath.riddles.length)];
            
            addRecent('guard', currentPath.id);
            addRecent('riddle', randomRiddle);
            addRecent('stage', 'conversation');
            addRecent('attempts', 0);
            
            // Update game state with current path and riddle
            state.currentGuard = currentPath.id;
            state.currentPath = currentPath;
            state.currentRiddle = randomRiddle;
        } else {
            // If returning player, get the stored riddle or pick a new one
            const storedRiddle = JSON.parse(localStorage.getItem('recent') || '{}').riddle;
            if (storedRiddle) {
                state.currentRiddle = storedRiddle;
            } else {
                state.currentRiddle = currentPath.riddles[Math.floor(Math.random() * currentPath.riddles.length)];
                addRecent('riddle', state.currentRiddle);
            }
            state.currentPath = currentPath;
        }
        
        // Always show guard greeting
        const guardStart = performance.now();
        utils.typeWriter(currentPath.greeting);
        simpleMetrics.guardResponseTime = trackPerformance('Guard Response', guardStart);
        
        trackPerformance('Game Initialization', startTime);
        
        // Set up event listeners
        elements.sendBtn.addEventListener('click', handleUserInput);
        elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUserInput();
            }
        });
        
    } catch (error) {
        console.error('Error in startGame():', error);
        showError('Failed to start game: ' + error.message);
    }
}

// Utility functions
function addRecent(x, value) {
    try {
        const recent = JSON.parse(localStorage.getItem('recent') || '{}');
        if (value !== undefined) {
            recent[x] = value;
        } else {
            recent[x] = Date.now();
        }
        localStorage.setItem('recent', JSON.stringify(recent));
    } catch (error) {
        console.error('Failed to update recent:', error);
    }
}

function unlock() {
    try {
        const { chatContainer } = getGameElements();
        const { addMessage } = getUtilityFunctions();
        
        // Clear chat and show key
        chatContainer.innerHTML = '';
        
        addMessage('system', 'A key materializes in the air before you, glowing with an otherworldly light.');
        addMessage('system', 'The guard nods approvingly. "You have proven yourself worthy. The key will grant you passage to the next stage."');
        
        // Create key element
        const keyElement = document.createElement('div');
        keyElement.className = 'key';
        keyElement.innerHTML = '<div class="key-ring"></div><div class="key-teeth"><div class="middle-tooth"></div></div>';
        keyElement.style.cssText = `
            font-size: 3em;
            text-align: center;
            margin: 20px 0;
            cursor: pointer;
            transition: transform 0.3s ease;
            animation: glow 2s ease-in-out infinite alternate;
        `;
        
        keyElement.addEventListener('click', () => {
            window.location.href = 'stage2.html';
        });
        
        keyElement.addEventListener('mouseenter', () => {
            keyElement.style.transform = 'scale(1.1)';
        });
        
        keyElement.addEventListener('mouseleave', () => {
            keyElement.style.transform = 'scale(1)';
        });
        
        chatContainer.appendChild(keyElement);
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes glow {
                from { text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #0073e6; }
                to { text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #0073e6; }
            }
        `;
        document.head.appendChild(style);
        
    } catch (error) {
        showError('Failed to unlock: ' + error.message);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeErrorBoundary();
        startGame();
        startMetricsLogging(); // Start metrics logging after DOM is ready
    } catch (error) {
        console.error('Game initialization failed:', error);
        showError('Game initialization failed: ' + error.message);
    }
});

// Phase handling functions
function handleConversationPhase(userInput, currentPath, addMessage, addRecent) {
    const conversationStart = performance.now();
    const { currentGuard, riddleAttempts } = getGameState();
    
    // Check if this is the first response (business acknowledgment)
    if (riddleAttempts === 0) {
        // Add guard introduction and responses sequentially
        const responses = [
            `I am ${currentPath.name}. Now, what business brings you to our ancient fortress?`,
            getContextualLoreResponse(currentGuard, userInput),
            currentPath.riddleIntro
        ];
        
        // Use sequential response system
        addSequentialGuardResponses(responses, addMessage);
        
        addRecent('attempts', 1);
        addRecent('stage', 'riddle');
        trackPerformance('Conversation Phase (First Response)', conversationStart);
    } else {
        // Continue conversation - check for arbitrary responses first
        const wittyResponse = getWittyArbitraryResponse(currentGuard, userInput);
        if (wittyResponse) {
            addMessage('guard', wittyResponse);
        } else {
            addMessage('guard', getContextualLoreResponse(currentGuard, userInput));
        }
        trackPerformance('Conversation Phase (Continue)', conversationStart);
    }
}

function handleRiddlePhase(userInput, currentPath, addMessage, addRecent) {
    const riddleStart = performance.now();
    const { currentGuard, riddleAttempts, currentRiddle } = getGameState();
    
    // Check if riddle has been presented
    if (riddleAttempts === 1) {
        if (!currentRiddle) {
            // Fallback if riddle is not properly initialized
            addMessage('guard', "I seem to have misplaced the riddle. Let me think of a new one...");
            addMessage('guard', "What has keys, but no locks; space, but no room; and you can enter, but not go in?");
            addRecent('attempts', 2);
            trackPerformance('Riddle Presentation (Fallback)', riddleStart);
            return;
        }
        addMessage('guard', currentRiddle.question);
        addRecent('attempts', 2);
        trackPerformance('Riddle Presentation', riddleStart);
        return;
    }
    
    // Check answer
    const userAnswer = userInput.toLowerCase().trim();
    if (currentRiddle && currentRiddle.answers && currentRiddle.answers.some(answer => userAnswer.includes(answer))) {
        // Success - send multiple responses sequentially
        const doors = getDoorChoices();
        const responses = [
            currentRiddle.success || "Excellent! You have a sharp mind indeed.",
            "Now for the final test. I have three doors before you:",
            "1. " + doors[0].description,
            "2. " + doors[1].description,
            "3. " + doors[2].description,
            "Which door will you choose? (1, 2, or 3)"
        ];
        
        addSequentialGuardResponses(responses, addMessage);
        
        addRecent('stage', 'doors');
        simpleMetrics.riddleProcessingTime = trackPerformance('Riddle Processing (Success)', riddleStart);
    } else {
        // Wrong answer - single response
        if (userInput.includes('?') || /what|how|why|when|where|who|explain|tell|help|hint|clue/.test(userAnswer)) {
            addMessage('guard', getContextualQuestionResponse(currentGuard, userInput));
        } else {
            addMessage('guard', getContextualWrongAnswerResponse(currentGuard, userInput));
        }
        trackPerformance('Riddle Processing (Wrong Answer)', riddleStart);
    }
}

function handleDoorsPhase(userInput, currentPath, addMessage, addRecent) {
    const { currentGuard } = getGameState();
    
    if (userInput.match(/^[123]$/)) {
        // Success - send multiple responses sequentially
        const responses = [
            "Excellent choice! You have proven yourself worthy.",
            "The door opens with a satisfying click...",
            "Welcome to Kafka's Castle. Take this key - you'll need it inside."
        ];
        
        addSequentialGuardResponses(responses, addMessage);
        
        setTimeout(() => {
            unlock();
        }, 2000);
    } else {
        // Single response for invalid input
        if (userInput.includes('?') || /what|how|why|explain|tell|help|door|doors/.test(userInput.toLowerCase())) {
            addMessage('guard', getContextualDoorResponse(currentGuard, userInput));
        } else {
            addMessage('guard', "Please choose door 1, 2, or 3.");
        }
    }
}

// Update game state management
function getGameState() {
    try {
        const recent = JSON.parse(localStorage.getItem('recent') || '{}');
        return {
            currentGuard: recent.guard || null,
            riddleAttempts: recent.attempts || 0,
            gameStage: recent.stage || 'conversation',
            currentRiddle: recent.riddle || null,
            isTyping: false // Add the missing isTyping property
        };
    } catch (error) {
        console.error('Failed to get game state:', error);
        return {
            currentGuard: null,
            riddleAttempts: 0,
            gameStage: 'conversation',
            currentRiddle: null,
            isTyping: false
        };
    }
}

// Add missing door response function
function getContextualDoorResponse(guardId, playerInput) {
    const input = playerInput.toLowerCase();
    
    if (/door|gate|entrance|exit/.test(input)) {
        return "The doors are the final test of your worthiness. Each leads to a different fate within the castle. Choose wisely, for your decision cannot be undone.";
    } else if (/what|which|how/.test(input)) {
        return "The doors represent different paths through the castle's bureaucracy. Door 1, 2, or 3 - your choice determines your journey.";
    } else {
        return "The doors await your decision. Choose 1, 2, or 3 to proceed.";
    }
}

// Performance optimizations
let debounceTimer = null;
let domCache = null;

function getDOMCache() {
    if (!domCache) {
        domCache = {
            messages: document.getElementById('messages'),
            input: document.getElementById('userInput'),
            sendBtn: document.getElementById('sendBtn'),
            keyButton: document.getElementById('keyButton'),
            chatbox: document.getElementById('chatbox'),
            errorBoundary: document.getElementById('errorBoundary')
        };
    }
    return domCache;
}

// Debounced input handler for better performance
function debounceInput(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(debounceTimer);
            func(...args);
        };
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(later, wait);
    };
}

// Memory management
function cleanupMemory() {
    // Clear old messages if too many
    const messages = getDOMCache().messages;
    const messageCount = messages.children.length;
    if (messageCount > 100) {
        const toRemove = messageCount - 50;
        for (let i = 0; i < toRemove; i++) {
            if (messages.firstChild) {
                messages.removeChild(messages.firstChild);
            }
        }
    }
    
    // Clear any unused timers
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
}

// Performance monitoring
// REMOVED: All performance monitoring code to fix initialization errors

// Resource management functions
function cleanupInactiveResources() {
    // Clear old messages more aggressively
    const messages = getDOMCache().messages;
    const messageCount = messages.children.length;
    if (messageCount > 50) { // Lower threshold during inactivity
        const toRemove = messageCount - 25;
        for (let i = 0; i < toRemove; i++) {
            if (messages.firstChild) {
                messages.removeChild(messages.firstChild);
            }
        }
    }
    
    // Clear any unused timers
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    
    // Force garbage collection if available
    if (window.gc) {
        window.gc();
    }
    
    console.log('Inactive resources cleaned up');
}

// Inactivity timeout system
let inactivityTimer = null;
let inactivityTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
let hardTimeoutTimer = null;
let hardTimeout = 10 * 60 * 1000; // 10 minutes in milliseconds

function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    if (hardTimeoutTimer) {
        clearTimeout(hardTimeoutTimer);
    }
    
    inactivityTimer = setTimeout(() => {
        showInactivityPopup();
        // Clean up resources
        cleanupInactiveResources();
    }, inactivityTimeout);
    
    // Set hard timeout for complete session kill
    hardTimeoutTimer = setTimeout(() => {
        killSession();
    }, hardTimeout);
}

function killSession() {
    console.log('Hard timeout reached - killing session');
    
    // Clear all timers
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (hardTimeoutTimer) clearTimeout(hardTimeoutTimer);
    if (debounceTimer) clearTimeout(debounceTimer);
    
    // Clear localStorage
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Failed to clear localStorage:', error);
    }
    
    // Clear sessionStorage
    try {
        sessionStorage.clear();
    } catch (error) {
        console.error('Failed to clear sessionStorage:', error);
    }
    
    // Remove all event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
    });
    
    // Clear DOM
    const messages = getDOMCache().messages;
    if (messages) {
        messages.innerHTML = '';
    }
    
    // Show final message
    const { addMessage } = getUtilityFunctions();
    addMessage('system', '⏰ Session terminated due to extended inactivity.');
    addMessage('system', 'The castle has closed its gates. Please refresh to begin a new journey.');
    
    // Force page reload after 3 seconds
    setTimeout(() => {
        window.location.reload(true); // Force reload from server
    }, 3000);
}

function showInactivityPopup() {
    const { addMessage } = getUtilityFunctions();
    addMessage('system', '⏰ Inactivity detected. The castle grows restless...');
    // Create timeout modal
    const modal = document.createElement('div');
    modal.className = 'modalOverlay';
    modal.innerHTML = `
        <div class="modalBox">
            <h3>Session Timeout</h3>
            <p>The castle's patience has expired due to inactivity.</p>
            <p>Your session will be reset in 30 seconds.</p>
            <div style="margin: 20px 0;">
                <button onclick="extendSession()" style="background: #d4af37; color: #000; border: none; padding: 10px 20px; margin-right: 10px; cursor: pointer;">Continue Session</button>
                <button onclick="resetSession()" style="background: #ff6b6b; color: #fff; border: none; padding: 10px 20px; cursor: pointer;">Reset Now</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    // Auto-reset after 30 seconds
    setTimeout(() => {
        if (document.body.contains(modal)) {
            resetSession();
        }
    }, 30000);
}

function extendSession() {
    const modal = document.querySelector('.modalOverlay');
    if (modal) {
        modal.remove();
    }
    resetInactivityTimer(); // This will reset both timers
    const { addMessage } = getUtilityFunctions();
    addMessage('system', '✅ Session extended. Welcome back to the castle.');
}

function resetSession() {
    const modal = document.querySelector('.modalOverlay');
    if (modal) {
        modal.remove();
    }
    location.reload();
}

// Initialize inactivity timer and event listeners
function initializeInactivitySystem() {
    resetInactivityTimer();
    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
    // Reset timer on input
    const input = document.getElementById('userInput');
    if (input) {
        input.addEventListener('input', resetInactivityTimer);
        input.addEventListener('keydown', resetInactivityTimer);
    }
}

// Sequential response helper function
async function addSequentialGuardResponses(responses, addMessage) {
    for (const response of responses) {
        await addMessage('guard', response);
        // Add a small delay between responses for natural flow
        await new Promise(resolve => setTimeout(resolve, 800));
    }
}

// Witty response system for arbitrary user inputs
function getWittyArbitraryResponse(guardId, userInput) {
    const input = userInput.toLowerCase().trim();
    
    // Detect non-committal or arbitrary responses
    const arbitraryPatterns = [
        /^hmm+$/i, /^uh+$/i, /^um+$/i, /^er+$/i, /^ah+$/i,
        /^ok+$/i, /^yeah+$/i, /^yep+$/i, /^nope+$/i, /^nah+$/i,
        /^maybe$/i, /^perhaps$/i, /^i guess$/i, /^i suppose$/i,
        /^whatever$/i, /^sure$/i, /^fine$/i, /^alright$/i,
        /^cool$/i, /^nice$/i, /^wow$/i, /^interesting$/i,
        /^.*\.\.\.+$/, /^[a-z]{1,3}$/i // Very short responses
    ];
    
    const isArbitrary = arbitraryPatterns.some(pattern => pattern.test(input));
    
    if (!isArbitrary) {
        return null; // Not an arbitrary response
    }
    
    // Guard-specific witty responses
    const wittyResponses = {
        'echo': [
            "Ah, the echo of indecision. How... fitting for these halls.",
            "Your response echoes through the corridors like a lost thought. Shall we proceed with the riddle, or shall you continue to contemplate the void?",
            "Hmm indeed. The castle's bureaucracy doesn't run on contemplation alone. Ready to test your wit, or shall we stand here until the paperwork expires?"
        ],
        'keyboard': [
            "Typing 'hmm' won't get you past these gates, you know.",
            "I see you're familiar with the art of non-committal responses. The castle's systems require more decisive input. Shall we proceed with the riddle?",
            "Your brevity is noted in the official records. Now, would you like to solve the riddle, or shall we add 'time waster' to your permanent file?"
        ],
        'towel': [
            "Your response is as damp as a forgotten towel. Let's dry it out with some mental exercise, shall we?",
            "Hmm... I've seen more enthusiasm in a wet sponge. Ready to wring out your brain with the riddle?",
            "The castle's patience is not infinite, unlike its paperwork. Solve the riddle or be filed under 'indecisive.'"
        ],
        'shadow': [
            "Your shadow seems more decisive than you. Perhaps it should take the test instead?",
            "Hmm... how predictable. The castle feeds on such uncertainty. Ready to step into the light of the riddle?",
            "Your hesitation casts long shadows. The bureaucracy doesn't appreciate dawdling. Riddle or retreat?"
        ],
        'time': [
            "Time is precious, and you're wasting it with such responses. The castle's clocks never stop ticking.",
            "Hmm... while you contemplate, centuries pass in the castle's corridors. Ready to make time for the riddle?",
            "Your indecision is being logged in the temporal records. The riddle awaits, or shall we add 'time waster' to your permanent record?"
        ]
    };
    
    const guardResponses = wittyResponses[guardId] || wittyResponses['echo'];
    const randomResponse = guardResponses[Math.floor(Math.random() * guardResponses.length)];
    
    return randomResponse;
}
