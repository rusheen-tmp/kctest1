// Performance optimizations
let domCacheStage2 = null;
let debounceTimerStage2 = null;

// Performance monitoring for Stage 2
let performanceMetricsStage2 = {
    frameCount: 0,
    lastFrameTime: performance.now(),
    averageFrameTime: 0,
    memoryUsage: 0,
    domQueries: 0
};

function getDOMCacheStage2() {
    if (!domCacheStage2) {
        domCacheStage2 = {
            messages: document.getElementById('messages'),
            input: document.getElementById('userInput'),
            sendBtn: document.getElementById('sendBtn'),
            timer: document.getElementById('timer'),
            exitBtn: document.getElementById('exitBtn'),
            chatbox: document.getElementById('chatbox'),
            errorBoundary: document.getElementById('errorBoundary')
        };
    }
    return domCacheStage2;
}

// Memory management for Stage 2
function cleanupMemoryStage2() {
    const messages = getDOMCacheStage2().messages;
    const messageCount = messages.children.length;
    if (messageCount > 100) {
        const toRemove = messageCount - 50;
        for (let i = 0; i < toRemove; i++) {
            if (messages.firstChild) {
                messages.removeChild(messages.firstChild);
            }
        }
    }
    
    if (debounceTimerStage2) {
        clearTimeout(debounceTimerStage2);
    }
}

// Error handling
function showError(message) {
    const errorBoundary = getDOMCacheStage2().errorBoundary;
    errorBoundary.classList.remove('hidden');
    errorBoundary.querySelector('p').textContent = message;
}

// Error boundary
window.addEventListener('error', function(e) {
    console.error('Stage2 error:', e.error);
    showError('The antechamber encountered an unexpected error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showError('The antechamber systems are experiencing difficulties');
});

// Main game variables
const msgs = getDOMCacheStage2().messages;
const inp = getDOMCacheStage2().input;
const sendBtn = getDOMCacheStage2().sendBtn;
const timer = getDOMCacheStage2().timer;
const exitBtn = getDOMCacheStage2().exitBtn;
const chatbox = getDOMCacheStage2().chatbox;

let modal;
let start = Date.now();
let attempts = 0;
let recent = [];
let inLoop = false;
let loopIntensity = 0;
let hintsEnabled = false;
let gameWon = false;
const correct = "PHC-CYBER-2025";

// Timer
let timerInterval;
function updateTimer() {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timer.textContent = (minutes > 0 ? String(minutes).padStart(2, '0') + ':' : '') + String(seconds).padStart(2, '0');
}

// Utility functions
let typing = false;
function setInp(enabled) {
    inp.disabled = !enabled;
    sendBtn.disabled = !enabled;
    if (enabled) {
        inp.focus();
        chatbox.classList.remove('typing');
    } else {
        chatbox.classList.add('typing');
    }
}

function tw(txt, cls = '') {
    return new Promise(resolve => {
        const span = document.createElement('span');
        if (cls) span.className = cls;
        msgs.appendChild(span);
        let i = 0;
        typing = true;
        setInp(false);
        
        const animate = () => {
            span.textContent = txt.slice(0, ++i);
            msgs.scrollTop = msgs.scrollHeight;
            
            if (i === txt.length) {
                msgs.appendChild(document.createElement('br'));
                typing = false;
                setInp(true);
                cleanupMemoryStage2(); // Clean up memory after typing
                resolve();
            } else {
                setTimeout(animate, 30);
            }
        };
        
        animate();
    });
}

async function clerk(t) {
    await tw('Clerk: ', 'nameClerk');
    await tw(t);
}

async function you(t) {
    await tw('You: ', 'nameYou');
    await tw(t);
}

// Handle user input submission
async function handleUserInput() {
    if (inp.value.trim() && !typing && !gameWon) {
        let txt = inp.value.trim();
        inp.value = '';
        attempts++;
        
        // Check for developer commands first
        if (await handleDevCommandStage2(txt.toLowerCase().trim())) {
            return;
        }
        
        // Track attempt
        if (window.gameAnalytics) {
            window.gameAnalytics.attempts++;
            window.gameAnalytics.trackEvent('user_input', { 
                attempt: window.gameAnalytics.attempts, 
                input: txt.substring(0, 10) + '...' 
            });
        }
        
        await you(txt);
        txt = txt.toUpperCase();

        // Update chatbox brightness
        updateChatboxBrightness();

        // Check for win
        if (txt === correct) {
            await win();
            return;
        }

        // Check for exit commands
        if (/^EXIT$|^STOP$|^QUIT$/.test(txt)) {
            if (inLoop) {
                inLoop = false;
                loopIntensity = 0;
                await clerk("The loop breaks. Reality returns to normal.");
                return;
            }
        }

        // Check for bureaucratic dead ends
        if (/FORM 247-B|SUBMIT FORM|REQUEST FORM/.test(txt)) {
            await clerk("Form 247-B requires approval from the Department of Bureaucratic Forms. Department of Bureaucratic Forms: permanently closed due to bureaucratic restructuring.");
            return;
        }

        if (/DEPARTMENT OF ACCESS CONTROL|ACCESS CONTROL|CLEARANCE UPGRADE|UPGRADE CLEARANCE/.test(txt)) {
            await clerk("Department of Access Control is permanently closed for renovations. Renovations: ongoing since 2020. Estimated completion: never.");
            return;
        }

        if (/CENTRAL BUREAUCRATIC AUTHORITY|BUREAUCRATIC AUTHORITY|AUTHORITY/.test(txt)) {
            await clerk("Central Bureaucratic Authority is currently processing requests from 2020. Current processing queue: 47,892 requests ahead of yours.");
            return;
        }

        // Check for record requests (expanded)
        if (/RECORD|LOG|SHOW RECORDS|LIST RECORDS|WHAT RECORDS|RECORDS|FILES|DOCUMENTS|ACCESS LOG|SYSTEM LOG/.test(txt)) {
            await clerk(showRecords());
            return;
        }

        // Check for individual record viewing
        if (/^VIEW PHC\d{4}$/.test(txt)) {
            const recordId = txt.substring(5); // Extract the record number
            await clerk(showRecordDetail(recordId));
            return;
        }

        // Check for speaking with clerks directly
        if (/SPEAK TO CLERKS|CONTACT CLERKS|TALK TO CLERKS|CLERK ACCESS|ASK CLERKS|CLERK HELP/.test(txt)) {
            const response = filingClerkResponses[Math.floor(Math.random() * filingClerkResponses.length)];
            addRecent(response);
            await clerk(response);
            return;
        }

        // Check for filing system questions
        if (/FILING SYSTEM|HOW RECORDS|WHERE RECORDS|RECORD SYSTEM|DOCUMENT SYSTEM/.test(txt)) {
            const responses = [
                "The filing system is accessible through the record log. Type 'record' or 'log' to view all records.",
                "Records are maintained by the filing clerks. All access attempts are logged and filed systematically.",
                "The record system contains all processed cases. Records are filed by date, status, and subject.",
                "The filing system operates on bureaucratic principles. All records are accessible to authorized personnel.",
                "Records are stored in the castle's memory. Memory is accessible through the record log command."
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            addRecent(response);
            await clerk(response);
            return;
        }

        // Check for technical commands
        if (technicalCommands[txt.toLowerCase()]) {
            await clerk(technicalCommands[txt.toLowerCase()]);
            return;
        }

        // Check for filing clerk questions
        if (/FILING CLERK|CLERK/.test(txt)) {
            const response = filingClerkResponses[Math.floor(Math.random() * filingClerkResponses.length)];
            addRecent(response);
            await clerk(response);
            return;
        }

        // Check for key questions
        if (/KEY|WHAT KEY/.test(txt)) {
            const response = keyResponses[Math.floor(Math.random() * keyResponses.length)];
            addRecent(response);
            await clerk(response);
            return;
        }

        // Check for castle inhabitant questions
        if (/INHABITANT|WHO LIVES|LIVE HERE/.test(txt)) {
            const response = castleInhabitantResponses[Math.floor(Math.random() * castleInhabitantResponses.length)];
            addRecent(response);
            await clerk(response);
            return;
        }

        // Check for purpose questions
        if (/PURPOSE|WHY|WHAT FOR/.test(txt)) {
            const response = purposeResponses[Math.floor(Math.random() * purposeResponses.length)];
            addRecent(response);
            await clerk(response);
            return;
        }

        // Check for record questions
        if (/WHAT IS RECORD|RECORD IS/.test(txt)) {
            const response = recordResponses[Math.floor(Math.random() * recordResponses.length)];
            addRecent(response);
            await clerk(response);
            return;
        }

        // Check for hints
        if (/HINT|HELP|CLUE|GIVE ME/.test(txt)) {
            if (hintsEnabled) {
                const hint = hints[Math.floor(Math.random() * hints.length)];
                addRecent(hint);
                
                // Track hint request
                if (window.gameAnalytics) {
                    window.gameAnalytics.hintsUsed++;
                    window.gameAnalytics.trackEvent('hint_requested', { 
                        hintNumber: window.gameAnalytics.hintsUsed,
                        attempt: attempts 
                    });
                }
                
                await clerk(hint);
                return;
            } else {
                await clerk("Hints are not available yet. Keep trying.");
                return;
            }
        }

        // Check for RUSHEEN
        if (/RUSHEEN/.test(txt)) {
            const rusheenLines = [
                "Ah... you know the Architect. The Game Master watches closely.",
                "Rusheen smiles in the shadows.",
                "The Architect whispers: 'Keep going.'",
                "A hidden door rattles when you utter that name."
            ];
            const m = rusheenLines[Math.floor(Math.random() * rusheenLines.length)];
            addRecent(m);
            await clerk(m);
            return;
        }

        // Check for false flag record numbers
        if (/^PHC\d{4}$/.test(txt)) {
            const responses = [
                `Department of Lost Causes received record ${txt}. They deny existing.`,
                `Record ${txt} routed to Office 404. Expect no reply.`,
                `Clerk stamps ${txt} twice, then sets it ablaze.`,
                `System acknowledges record ${txt}. System also laughs.`
            ];
            const resp = responses[Math.floor(Math.random() * 4)];
            addRecent(resp);
            await clerk(resp);
            return;
        }

        // Loop detection and intensification
        if (attempts > 5 && Math.random() < 0.3) {
            inLoop = true;
            loopIntensity++;
            
            if (loopIntensity >= 3) {
                const loopResponse = loopResponses[Math.floor(Math.random() * loopResponses.length)];
                addRecent(loopResponse);
                await clerk(loopResponse);
                return;
            }
        }

        // Misdirection after 5 attempts
        if (attempts > 5 && Math.random() < 0.3) {
            let m;
            do {
                m = misdirect[Math.floor(Math.random() * misdirect.length)];
            } while (recent.includes(m));
            addRecent(m);
            await clerk(m);
            return;
        }

        // Default chatter
        let r;
        do {
            r = chatter[Math.floor(Math.random() * chatter.length)];
        } while (recent.includes(r));
        addRecent(r);
        await clerk(r);
    }
}

// Record system
const records = [
    { 
        id: 'PHC7823', 
        date: '2024-12-15 14:23', 
        status: 'escalated', 
        subject: 'Unauthorized access attempt',
        body: 'Subject attempted to access restricted area without proper clearance. Multiple failed authentication attempts detected. Case escalated to Security Division. Awaiting review by Department of Access Control. Standard procedure: 72-hour investigation period. Investigation ongoing.'
    },
    { 
        id: 'PHC9451', 
        date: '2024-12-14 09:47', 
        status: 'redacted', 
        subject: 'Classified document inquiry',
        body: 'Subject requested access to [REDACTED] documents. Documents contain [REDACTED] information regarding [REDACTED]. Access denied due to [REDACTED] clearance level. Case marked for [REDACTED] review. Further details [REDACTED] by order of [REDACTED]. CYBER security protocols were bypassed during this incident.'
    },
    { 
        id: 'PHC3367', 
        date: '2024-12-13 16:12', 
        status: 'pending', 
        subject: 'Security clearance review',
        body: 'Subject submitted clearance application. Background check in progress. References contacted. Previous employment verification pending. Medical evaluation scheduled. Psychological assessment required. Estimated completion: 30-45 business days. Status: Under Review. Note: Application will be processed in 2025 due to current backlog.'
    }
];

function showRecords() {
    // Track record viewing
    if (window.gameAnalytics) {
        window.gameAnalytics.recordsViewed++;
        window.gameAnalytics.trackEvent('records_viewed', { 
            count: window.gameAnalytics.recordsViewed 
        });
    }
    
    let recordText = 'RECORD LOG:\n';
    records.forEach(record => {
        recordText += `${record.id} | ${record.date} | <span class="status-${record.status}">${record.status.toUpperCase()}</span> | ${record.subject}\n`;
    });
    recordText += '\nTo view detailed record, type: "view [record number]" (e.g., "view PHC7823")\n';
    recordText += 'To speak with filing clerks directly, type: "speak to clerks" or "contact clerks"';
    return recordText;
}

function showRecordDetail(recordId) {
    const record = records.find(r => r.id === recordId);
    if (!record) {
        return `Record ${recordId} not found. Please check the record number and try again.`;
    }
    
    let detailText = `RECORD DETAIL: ${record.id}\n`;
    detailText += `Date: ${record.date}\n`;
    detailText += `Status: <span class="status-${record.status}">${record.status.toUpperCase()}</span>\n`;
    detailText += `Subject: ${record.subject}\n`;
    detailText += `\nLOG BODY:\n${record.body}\n`;
    
    if (record.status === 'redacted') {
        detailText += '\nNOTE: This record contains redacted information as per security protocol.';
    }
    
    return detailText;
}

// Enhanced Kafkaesque responses
const filingClerkResponses = [
    "The filing clerks are... elsewhere. They've been filing for eternity.",
    "Clerks? We have clerks? I thought they were just shadows in the corridors.",
    "The filing system is... complicated. Even the clerks don't understand it.",
    "Clerks process records in ways that defy logic. Or perhaps they create the logic.",
    "Filing clerks are the castle's memory. Sometimes they remember too much.",
    "The clerks are processing your request. Processing. Processing. Processing.",
    "Clerk #247 has been assigned to your case. Clerk #247 is currently... unavailable.",
    "The filing system operates on principles unknown to mortal minds.",
    "Clerks are the gears of bureaucracy. Gears that turn without purpose.",
    "The clerks have filed your inquiry under 'Pending Eternal Review.'",
    "Direct communication with filing clerks requires Form 247-B. Form 247-B requires approval from the Department of Interdepartmental Communication. Approval process: ongoing.",
    "The filing clerks are available for consultation. Consultation fee: your sanity. Payment method: eternal processing.",
    "Clerk-to-visitor communication is regulated by Bureaucratic Decree #1337. Decree #1337: communication is forbidden.",
    "The filing clerks are processing your request to speak with filing clerks. Processing time: infinite.",
    "Direct clerk access requires clearance level 9. Your clearance level: pending. Pending status: eternal.",
    "The filing clerks maintain the record system. Records are the castle's memory. Memory is bureaucratic.",
    "Clerks process records according to the Bureaucratic Classification System. System: incomprehensible but mandatory.",
    "The filing clerks are currently reviewing record PHC7823. Review process: eternal.",
    "Clerk #1337 suggests consulting the record log. Record log contains all processed cases.",
    "The filing system contains records of all access attempts. Records are filed by date and status.",
    "Submit Form 247-B to request direct clerk access. Form 247-B is available from the Department of Bureaucratic Forms. Forms are processed in triplicate.",
    "Contact the Department of Access Control for clearance upgrades. Department of Access Control: permanently closed for renovations.",
    "Request clearance level upgrade through the Central Bureaucratic Authority. Authority: currently processing requests from 2020."
];

const keyResponses = [
    "The key is both literal and metaphorical. It opens doors that shouldn't exist.",
    "Keys here are more than metal. They're patterns, codes, sequences.",
    "Every key has a purpose. Some open doors, others open minds.",
    "The key you seek is hidden in plain sight. Or perhaps it's hiding you.",
    "Keys are like records - they only work if you know how to use them.",
    "The key is a formality. A bureaucratic necessity. A meaningless gesture.",
    "Keys are issued by the Department of Access Control. Applications take 3-5 business eternities.",
    "The key represents your clearance level. Your clearance level represents nothing.",
    "Keys are processed through the Central Bureaucratic Authority. Processing time: indefinite.",
    "The key is a symbol of authority. Authority is a symbol of nothing."
];

const castleInhabitantResponses = [
    "The castle has many inhabitants. Most are records. Some are memories.",
    "Inhabitants? We prefer 'permanent residents.' Though none of us chose to be here.",
    "The castle's population is... fluid. Numbers change when you're not looking.",
    "Inhabitants include clerks, records, shadows, and things that used to be people.",
    "We're all inhabitants of the castle's endless bureaucracy.",
    "The inhabitants are classified. Classification is classified.",
    "Population: indeterminate. Census: ongoing. Results: pending.",
    "Inhabitants are processed through the Department of Existence Verification.",
    "The castle's residents are bound by bureaucratic decree. Decree #247: existence is mandatory.",
    "Inhabitants are assigned identification numbers. Numbers are assigned randomly. Randomness is predetermined."
];

const purposeResponses = [
    "Purpose? The castle's purpose is to exist. Your purpose is to find your record.",
    "Purpose is a luxury we can't afford here. We process, we file, we wait.",
    "The castle serves many purposes. None of them make sense to outsiders.",
    "Purpose implies direction. The castle moves in circles, not lines.",
    "Your purpose is to understand that purpose is meaningless here.",
    "Purpose is determined by the Central Planning Committee. Committee meetings: ongoing.",
    "The castle's purpose is to process. Processing is its purpose. Purpose is processing.",
    "Purpose requires authorization. Authorization requires purpose. Circular logic is mandatory.",
    "Your purpose has been filed under 'General Inquiries.' Response time: never.",
    "Purpose is a bureaucratic construct. Constructs are filed in triplicate."
];

const recordResponses = [
    "Records are everything here. They're our history, our present, our future.",
    "A record is proof that something happened. Or that it didn't.",
    "Records are the castle's blood. They flow through endless corridors.",
    "Every action creates a record. Every record creates an action.",
    "Records are like memories, but more permanent. And less reliable.",
    "Records are processed through the Department of Eternal Documentation.",
    "Each record is assigned a unique identifier. Identifiers are not unique.",
    "Records are filed according to the Bureaucratic Classification System. System: incomprehensible.",
    "Records exist to prove existence. Existence exists to create records.",
    "Records are the foundation of our reality. Reality is a bureaucratic construct."
];

const technicalCommands = {
    'ping': "PING castle.local (127.0.0.1) - No response. The castle doesn't respond to pings.",
    'nslookup': "castle.local -> 127.0.0.1\nAuthoritative answer: The castle resolves to itself.",
    'traceroute': "Tracing route to castle.local...\n1. gateway (10.0.0.1) - 1ms\n2. castle.local (127.0.0.1) - Destination reached\nRoute: You are already inside.",
    'whoami': "Current user: visitor\nAccess level: restricted\nClearance: pending",
    'ls': "Directory listing denied. Insufficient privileges.",
    'cat': "File access denied. Records are classified.",
    'sudo': "Permission denied. The castle doesn't recognize your authority.",
    'ssh': "Connection refused. The castle doesn't accept external connections.",
    'netstat': "Active connections:\n127.0.0.1:8080 - castle.local:http\n127.0.0.1:22 - castle.local:ssh (filtered)",
    'top': "Process listing denied. System processes are confidential.",
    'ps': "Process status: processing. Processing status: processing.",
    'kill': "Termination request denied. Processes are eternal.",
    'chmod': "Permission modification denied. Permissions are immutable.",
    'rm': "Deletion denied. Nothing can be deleted in the castle.",
    'cp': "Copy operation failed. Originals are unique. Uniqueness is mandatory."
};

const hints = [
    "Records often begin with three letters—then a dash.",
    "The castle loves acronyms; perhaps start with PHC-?",
    "CYBER things nest in secure vaults.",
    "Years matter; the castle cannot forget 2025.",
    "The key follows a pattern: letters-numbers-letters.",
    "Think of it as a record number, not just a key.",
    "The format is familiar to those who work with records.",
    "Three parts, separated by dashes. Like a filing system.",
    "The key is a bureaucratic identifier. Identifiers follow patterns.",
    "Consider the year. Years are important to bureaucracies.",
    "Look at the record numbers. Notice the PHC prefix?",
    "Security systems often use CYBER terminology.",
    "What year appears in the castle's records?",
    "The key follows a similar but different pattern than the records.",
    "Combine the PHC prefix with a security term and a year."
];

const chatter = [
    "The corridors stretch on, digit by digit.",
    "Your silence echoes like empty hallways.",
    "The castle processes your thoughts as data.",
    "Time flows differently in bureaucratic spaces.",
    "Every keystroke is recorded, analyzed, filed.",
    "The clerks are watching. Always watching.",
    "Your presence has been logged in triplicate.",
    "The castle's memory is infinite, but selective.",
    "Bureaucracy is the castle's heartbeat.",
    "You are being processed. Processing is eternal.",
    "The castle's logic defies mortal understanding.",
    "Records are the castle's dreams and nightmares.",
    "Your existence is being verified. Verification: ongoing.",
    "The castle's corridors lead to more corridors.",
    "Time is a bureaucratic construct. Constructs are filed.",
    "The clerks process reality itself.",
    "Your journey is being documented. Documentation: eternal.",
    "The castle's systems are older than time.",
    "Bureaucracy is the only constant in an uncertain world.",
    "The castle remembers everything. Everything is a record."
];

const misdirect = [
    "The key might be in the Department of Lost Causes.",
    "Have you tried the Office of Forgotten Passwords?",
    "The key could be in the Archives of Misplaced Items.",
    "Perhaps check the Bureau of Forgotten Knowledge?",
    "The key might be filed under 'Things We Can't Find.'",
    "Try the Department of Circular Logic.",
    "The key could be in the Office of Eternal Processing.",
    "Check the Bureau of Unanswered Questions.",
    "The key might be in the Archives of Lost Time.",
    "Try the Department of Infinite Regress."
];

const loopResponses = [
    "You seem to be going in circles. The castle appreciates consistency.",
    "Repetition is the castle's favorite form of communication.",
    "You're creating a pattern. Patterns are filed. Filing is eternal.",
    "The castle recognizes your dedication to routine.",
    "Your persistence is being noted. Notes are filed. Files are eternal.",
    "You're establishing a rhythm. Rhythm is bureaucratic.",
    "The castle appreciates those who understand cycles.",
    "Your consistency is being processed. Processing: ongoing.",
    "You're demonstrating the castle's core principle: repetition.",
    "The castle values those who embrace the eternal return."
];

const exitResponses = [
    "The coward's door is always open. But once you leave, you can never return.",
    "Exit? The castle doesn't believe in exits. But if you must...",
    "Leaving so soon? The castle will remember your departure.",
    "The exit door leads to more castle. Castle is infinite.",
    "You can leave, but the castle will follow you in your dreams.",
    "Exit is just another word for entrance in the castle's logic.",
    "The castle doesn't have exits. It has different entrances.",
    "Leaving? The castle's bureaucracy will process your departure.",
    "Exit is a bureaucratic construct. Constructs are filed.",
    "The castle's doors only open inward. Exit is impossible."
];

// Stage 2 start
function startStage2() {
    // Track stage2 start
    if (window.gameAnalytics) {
        window.gameAnalytics.trackEvent('stage2_started', { timestamp: Date.now() });
    }
    
    // Start timer
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
    
    // Start with new first message
    (async () => {
        await clerk("Before you go in, the officials require a key. It is a vital part of accessing your record...");
    })();

    // Initialize inactivity system for Stage 2
    initializeInactivitySystemStage2();
}

function addRecent(x) {
    recent.push(x);
    if (recent.length > 4) recent.shift();
}

// Brighten chatbox as user gets closer
function updateChatboxBrightness() {
    if (attempts >= 5) {
        chatbox.classList.add('brighten');
    }
}

// Auto hints with progressive system
setInterval(() => {
    if (!typing && !gameWon) {
        let hintInterval = 8; // Start with every 8 attempts
        
        if (attempts >= 12) {
            hintInterval = 6; // More frequent hints after 12 attempts
        } else if (attempts >= 8) {
            hintInterval = 7; // Medium frequency after 8 attempts
        }
        
        if (attempts >= 6 && attempts % hintInterval === 0 && !hintsEnabled) {
            hintsEnabled = true;
            let hintIndex;
            
            // Progressive hint selection
            if (attempts >= 15) {
                hintIndex = Math.floor(Math.random() * 5) + 10; // Most specific hints
            } else if (attempts >= 10) {
                hintIndex = Math.floor(Math.random() * 5) + 5; // Medium specific hints
            } else {
                hintIndex = Math.floor(Math.random() * 5); // General hints
            }
            
            const hint = hints[hintIndex];
            addRecent(hint);
            
            // Track hint usage
            if (window.gameAnalytics) {
                window.gameAnalytics.hintsUsed++;
                window.gameAnalytics.trackEvent('hint_given', { 
                    hintNumber: window.gameAnalytics.hintsUsed,
                    attempt: attempts 
                });
            }
            
            clerk(hint);
        }
    }
}, 20000);

// Exit hint - more frequent
setInterval(() => {
    if (!typing && attempts > 0 && attempts % 5 === 0 && !gameWon) {
        const hint = "Stuck? Some choose to type 'exit' and abandon the pursuit...";
        addRecent(hint);
        clerk(hint);
    }
}, 10000);

// Event listeners
inp.addEventListener('keydown', async e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        await handleUserInput();
    }
});

sendBtn.addEventListener('click', async e => {
    e.preventDefault();
    await handleUserInput();
});

// Enhanced win function
async function win() {
    gameWon = true;
    inp.disabled = true;
    sendBtn.disabled = true;
    inp.placeholder = "Access granted";
    
    // Stop the timer
    clearInterval(timerInterval);
    
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = (minutes > 0 ? minutes + 'm ' : '') + seconds + 's';
    
    let msg = "Access granted. Welcome within.";
    
    // Try to get location info, but don't include it if it fails
    try {
        const data = await fetch('https://ipapi.co/json/').then(r => r.json());
        if (data.city && data.region) {
            msg += `\nWe see you are connecting from ${data.city}, ${data.region}.`;
        }
    } catch (error) {
        console.log('IP lookup failed:', error);
        // Don't include location info if lookup fails
    }
    
    await clerk(msg);
    
    // Track completion
    if (window.gameAnalytics) {
        window.gameAnalytics.completionTime = Date.now() - window.gameAnalytics.startTime;
        window.gameAnalytics.trackEvent('stage2_completed', { 
            completionTime: window.gameAnalytics.completionTime,
            attempts: window.gameAnalytics.attempts,
            hintsUsed: window.gameAnalytics.hintsUsed,
            recordsViewed: window.gameAnalytics.recordsViewed
        });
    }
    
    const html = `
        <div id="winModal">
            <div class="modalContent">
                <button class="closeBtn">&times;</button>
                <h2 class="gold">Congratulations</h2>
                <p>You unlocked the castle in <strong>${timeStr}</strong>.</p>
                <p>Perhaps now… you'll understand less than before.</p>
                <button class="shareBtn" onclick="shareResult('${timeStr}')">Share Result</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Close modal functionality
    const winModal = document.getElementById('winModal');
    const closeBtn = document.querySelector('.closeBtn');
    
    closeBtn.onclick = () => winModal.remove();
    winModal.onclick = (e) => {
        if (e.target === winModal) winModal.remove();
    };
}

// Share functionality
async function shareResult(timeStr) {
    const shareText = `I beat the castle in ${timeStr} - think you can do it faster?`;
    const shareBtn = document.querySelector('.shareBtn');
    
    try {
        if (navigator.share) {
            await navigator.share({
                title: "Kafka's Castle",
                text: shareText,
                url: window.location.href
            });
        } else {
            await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
        }
        
        shareBtn.textContent = "Link copied!";
        shareBtn.classList.add('copied');
        
        setTimeout(() => {
            shareBtn.textContent = "Share Result";
            shareBtn.classList.remove('copied');
        }, 5000);
    } catch (error) {
        console.log('Share failed:', error);
    }
}

// Enhanced exit modal
function openExit() {
    if (modal) {
        modal.classList.remove('hidden');
        return;
    }
    
    const exitResponse = exitResponses[Math.floor(Math.random() * exitResponses.length)];
    
    const html = `
        <div class="modalOverlay" id="exitModal">
            <div class="modalBox">
                <h3 class="gold">Coward's Door</h3>
                <p>${exitResponse}</p>
                <div>
                    <button id="yesQuit">Yes</button>
                    <button id="noStay">No</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    modal = document.getElementById('exitModal');
    
    document.getElementById('yesQuit').onclick = () => location.href = 'index.html';
    document.getElementById('noStay').onclick = () => {
        document.getElementById('exitModal').remove();
        modal = null; // Reset modal so it can be opened again
    };
}

exitBtn.addEventListener('click', openExit);

// Developer utility system for Stage 2
async function handleDevCommandStage2(command) {
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
        await executeWinConditionStage2();
        return true;
    }
    
    // Skip command
    if (command === 'skip--') {
        await skipCurrentStageStage2();
        return true;
    }
    
    // Back command
    if (command === 'back--') {
        await goBackToPreviousPageStage2();
        return true;
    }
    
    // Jump commands
    if (command === 'jump--') {
        await jumpToNextStageStage2();
        return true;
    }
    
    if (command.startsWith('jump--[') && command.endsWith(']')) {
        const stage = command.slice(7, -1);
        await jumpToStageStage2(stage);
        return true;
    }
    
    // Goto command
    if (command.startsWith('goto ')) {
        const stage = command.slice(5);
        await jumpToStageStage2(stage);
        return true;
    }
    
    // Help command
    if (command === 'dev help' || command === 'help dev') {
        await showDevHelpStage2();
        return true;
    }
    
    // Console command
    if (command === 'console' || command === 'console.log' || command === 'log' || 
        command === 'show console.log' || command === 'show console log' ||
        command === 'show console' || command === 'show log') {
        await showConsoleInfoStage2();
        return true;
    }
    
    // Download console logs command
    if (command === 'download logs' || command === 'export logs' || command === 'save logs' || 
        command === 'download console' || command === 'export console' ||
        command === 'push log') {
        await downloadConsoleLogsStage2();
        return true;
    }
    
    return false;
}

async function executeWinConditionStage2() {
    await tw('🔧 Developer command executed: WIN', 'system');
    await tw('🎉 Congratulations! You have bypassed the antechamber\'s systems.', 'system');
    await tw('The bureaucratic maze has been defeated by superior debugging skills.', 'system');
    
    // Trigger win condition
    setTimeout(async () => {
        await win();
    }, 2000);
}

async function skipCurrentStageStage2() {
    await tw('🔧 Developer command executed: SKIP', 'system');
    await tw('⏭️ Skipping current stage...', 'system');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

async function goBackToPreviousPageStage2() {
    await tw('🔧 Developer command executed: BACK', 'system');
    await tw('⬅️ Going back to previous page...', 'system');
    setTimeout(() => {
        window.history.back();
    }, 3000); // 3-second delay
}

async function jumpToNextStageStage2() {
    await tw('🔧 Developer command executed: JUMP TO NEXT STAGE', 'system');
    await tw('🚀 Warping back to the castle gates...', 'system');
    
    // Jump back to Stage 1 (castle gates)
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

async function jumpToStageStage2(target) {
    await tw(`🔧 Developer command executed: JUMP TO ${target.toUpperCase()}`, 'system');
    await tw('🚀 Warping through the bureaucratic void...', 'system');
    
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
            await tw(`❌ Unknown stage: ${target}`, 'system');
            await tw('Available stages: stage1, stage2, castle, antechamber', 'system');
            break;
    }
}

async function showDevHelpStage2() {
    await tw('🔧 Developer Commands:', 'system');
    await tw('• win.exe, .\\win.exe, win-- : Execute win condition', 'system');
    await tw('• skip-- : Skip current stage', 'system');
    await tw('• back-- : Go back to previous page', 'system');
    await tw('• jump-- : Jump to next stage', 'system');
    await tw('• jump--[stage] : Jump to specific stage', 'system');
    await tw('• goto [stage] : Navigate to stage', 'system');
    await tw('• console : Show debug information', 'system');
    await tw('• download logs : Export logs as text file', 'system');
    await tw('• dev help : Show this help', 'system');
    await tw('', 'system');
    await tw('Available stages: stage1, stage2, castle, antechamber', 'system');
}

async function showConsoleInfoStage2() {
    await tw('🔍 Console Debug Information:', 'system');
    await tw(`• Current Stage: Stage 2 (Antechamber)`, 'system');
    await tw(`• Attempts: ${attempts}`, 'system');
    await tw(`• Game Won: ${gameWon}`, 'system');
    await tw(`• In Loop: ${inLoop}`, 'system');
    await tw(`• Loop Intensity: ${loopIntensity}`, 'system');
    await tw(`• Hints Enabled: ${hintsEnabled}`, 'system');
    await tw(`• Page URL: ${window.location.href}`, 'system');
    await tw(`• User Agent: ${navigator.userAgent.substring(0, 50)}...`, 'system');
    await tw(`• Screen Size: ${window.innerWidth}x${window.innerHeight}`, 'system');
    await tw(`• Timestamp: ${new Date().toLocaleString()}`, 'system');
    await tw(`• IP Address: Client-side limitation (requires server)`, 'system');
    await tw(`• Connection: ${navigator.connection ? navigator.connection.effectiveType || 'Unknown' : 'Unknown'}`, 'system');
    await tw(`• Online Status: ${navigator.onLine ? 'Online' : 'Offline'}`, 'system');
    
    // Performance metrics
    await tw(`• Performance - Avg Frame Time: ${performanceMetricsStage2.averageFrameTime.toFixed(2)}ms`, 'system');
    await tw(`• Performance - Memory Usage: ${performanceMetricsStage2.memoryUsage.toFixed(1)}MB`, 'system');
    await tw(`• Performance - Frame Count: ${performanceMetricsStage2.frameCount}`, 'system');
    
    // Get location from IP
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        await tw(`• Location: ${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`, 'system');
        await tw(`• IP: ${data.ip || 'Unknown'}`, 'system');
        await tw(`• ISP: ${data.org || 'Unknown'}`, 'system');
    } catch (error) {
        await tw('• Location: Unable to fetch location data', 'system');
    }
    
    // Show timer info
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = (minutes > 0 ? String(minutes).padStart(2, '0') + ':' : '') + String(seconds).padStart(2, '0');
    await tw(`• Elapsed Time: ${timeStr}`, 'system');
    
    // Show localStorage data
    try {
        const recent = JSON.parse(localStorage.getItem('recent') || '{}');
        await tw('• LocalStorage Data:', 'system');
        Object.entries(recent).forEach(([key, value]) => {
            tw(`  - ${key}: ${value}`, 'system');
        });
    } catch (error) {
        await tw('• LocalStorage: Error reading data', 'system');
    }
    
    // Show records info
    await tw(`• Available Records: ${records.length}`, 'system');
    await tw(`• Recent Responses: ${recent.length}`, 'system');
}

async function downloadConsoleLogsStage2() {
    await tw('📥 Generating console log file...', 'system');
    
    let logContent = `KAFKA'S CASTLE - STAGE 2 CONSOLE LOG\n`;
    logContent += `Generated: ${new Date().toLocaleString()}\n`;
    logContent += `=====================================\n\n`;
    
    // Basic game info
    logContent += `GAME STATE:\n`;
    logContent += `• Current Stage: Stage 2 (Antechamber)\n`;
    logContent += `• Attempts: ${attempts}\n`;
    logContent += `• Game Won: ${gameWon}\n`;
    logContent += `• In Loop: ${inLoop}\n`;
    logContent += `• Loop Intensity: ${loopIntensity}\n`;
    logContent += `• Hints Enabled: ${hintsEnabled}\n\n`;
    
    // Timer info
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = (minutes > 0 ? String(minutes).padStart(2, '0') + ':' : '') + String(seconds).padStart(2, '0');
    logContent += `TIMER INFORMATION:\n`;
    logContent += `• Elapsed Time: ${timeStr}\n`;
    logContent += `• Start Time: ${new Date(start).toLocaleString()}\n\n`;
    
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
    logContent += `• Available Records: ${records.length}\n`;
    logContent += `• Recent Responses: ${recent.length}\n`;
    logContent += `• Record IDs: ${records.map(r => r.id).join(', ')}\n\n`;
    
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
    a.download = `kafka-castle-stage2-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    await tw('✅ Console logs downloaded successfully!', 'system');
}

// Start stage2 immediately
startStage2();

function updatePerformanceMetricsStage2() {
    if (!performanceMonitoringActiveStage2) return;
    
    const now = performance.now();
    const frameTime = now - performanceMetricsStage2.lastFrameTime;
    
    performanceMetricsStage2.frameCount++;
    performanceMetricsStage2.lastFrameTime = now;
    performanceMetricsStage2.averageFrameTime = 
        (performanceMetricsStage2.averageFrameTime * (performanceMetricsStage2.frameCount - 1) + frameTime) / performanceMetricsStage2.frameCount;
    
    // Monitor memory usage if available
    if (performance.memory) {
        performanceMetricsStage2.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    
    // Log performance issues
    if (frameTime > 16.67) { // 60fps threshold
        console.warn('Stage2 Performance warning: Frame time exceeded 16.67ms', frameTime);
    }
    
    if (performanceMetricsStage2.memoryUsage > 50) { // 50MB threshold
        console.warn('Stage2 Memory usage high:', performanceMetricsStage2.memoryUsage, 'MB');
        cleanupMemoryStage2();
    }
}

// Start performance monitoring for Stage 2
if (typeof requestAnimationFrame !== 'undefined') {
    function performanceLoopStage2() {
        updatePerformanceMetricsStage2();
        performanceLoopIdStage2 = requestAnimationFrame(performanceLoopStage2);
    }
    performanceLoopIdStage2 = requestAnimationFrame(performanceLoopStage2);
}

// Resource management functions for Stage 2
let performanceMonitoringActiveStage2 = true;
let performanceLoopIdStage2 = null;

function pausePerformanceMonitoringStage2() {
    performanceMonitoringActiveStage2 = false;
    if (performanceLoopIdStage2) {
        cancelAnimationFrame(performanceLoopIdStage2);
        performanceLoopIdStage2 = null;
    }
    console.log('Stage2 Performance monitoring paused due to inactivity');
}

function resumePerformanceMonitoringStage2() {
    performanceMonitoringActiveStage2 = true;
    if (!performanceLoopIdStage2) {
        function performanceLoopStage2() {
            updatePerformanceMetricsStage2();
            performanceLoopIdStage2 = requestAnimationFrame(performanceLoopStage2);
        }
        performanceLoopIdStage2 = requestAnimationFrame(performanceLoopStage2);
    }
    console.log('Stage2 Performance monitoring resumed');
}

function cleanupInactiveResourcesStage2() {
    // Clear old messages more aggressively
    const messages = getDOMCacheStage2().messages;
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
    if (debounceTimerStage2) {
        clearTimeout(debounceTimerStage2);
        debounceTimerStage2 = null;
    }
    
    // Force garbage collection if available
    if (window.gc) {
        window.gc();
    }
    
    console.log('Stage2 Inactive resources cleaned up');
}

// Inactivity timeout system for Stage 2
let inactivityTimerStage2 = null;
let inactivityTimeoutStage2 = 5 * 60 * 1000; // 5 minutes in milliseconds
let hardTimeoutTimerStage2 = null;
let hardTimeoutStage2 = 10 * 60 * 1000; // 10 minutes in milliseconds

function resetInactivityTimerStage2() {
    if (inactivityTimerStage2) {
        clearTimeout(inactivityTimerStage2);
    }
    if (hardTimeoutTimerStage2) {
        clearTimeout(hardTimeoutTimerStage2);
    }
    
    // Resume performance monitoring when user is active
    if (!performanceMonitoringActiveStage2) {
        resumePerformanceMonitoringStage2();
    }
    
    inactivityTimerStage2 = setTimeout(() => {
        showInactivityPopupStage2();
        // Pause performance monitoring during inactivity
        pausePerformanceMonitoringStage2();
        // Clean up resources
        cleanupInactiveResourcesStage2();
    }, inactivityTimeoutStage2);
    
    // Set hard timeout for complete session kill
    hardTimeoutTimerStage2 = setTimeout(() => {
        killSessionStage2();
    }, hardTimeoutStage2);
}

async function killSessionStage2() {
    console.log('Stage2 Hard timeout reached - killing session');
    
    // Clear all timers
    if (inactivityTimerStage2) clearTimeout(inactivityTimerStage2);
    if (hardTimeoutTimerStage2) clearTimeout(hardTimeoutTimerStage2);
    if (debounceTimerStage2) clearTimeout(debounceTimerStage2);
    if (performanceLoopIdStage2) cancelAnimationFrame(performanceLoopIdStage2);
    if (timerInterval) clearInterval(timerInterval);
    
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
        document.removeEventListener(event, resetInactivityTimerStage2, true);
    });
    
    // Clear DOM
    const messages = getDOMCacheStage2().messages;
    if (messages) {
        messages.innerHTML = '';
    }
    
    // Show final message
    await tw('⏰ Session terminated due to extended inactivity.', 'system');
    await tw('The antechamber has closed its doors. Please refresh to begin a new journey.', 'system');
    
    // Force page reload after 3 seconds
    setTimeout(() => {
        window.location.reload(true); // Force reload from server
    }, 3000);
}

async function showInactivityPopupStage2() {
    await tw('⏰ Inactivity detected. The antechamber grows restless...', 'system');
    
    // Create timeout modal
    const modal = document.createElement('div');
    modal.className = 'modalOverlay';
    modal.innerHTML = `
        <div class="modalBox">
            <h3>Session Timeout</h3>
            <p>The antechamber's patience has expired due to inactivity.</p>
            <p>Your session will be reset in 30 seconds.</p>
            <div style="margin: 20px 0;">
                <button onclick="extendSessionStage2()" style="background: #d4af37; color: #000; border: none; padding: 10px 20px; margin-right: 10px; cursor: pointer;">Continue Session</button>
                <button onclick="resetSessionStage2()" style="background: #ff6b6b; color: #fff; border: none; padding: 10px 20px; cursor: pointer;">Reset Now</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Auto-reset after 30 seconds
    setTimeout(() => {
        if (document.body.contains(modal)) {
            resetSessionStage2();
        }
    }, 30000);
}

async function extendSessionStage2() {
    const modal = document.querySelector('.modalOverlay');
    if (modal) {
        modal.remove();
    }
    resetInactivityTimerStage2(); // This will reset both timers
    await tw('✅ Session extended. Welcome back to the antechamber.', 'system');
}

function resetSessionStage2() {
    const modal = document.querySelector('.modalOverlay');
    if (modal) {
        modal.remove();
    }
    location.reload();
}

// Initialize inactivity timer and event listeners for Stage 2
function initializeInactivitySystemStage2() {
    resetInactivityTimerStage2();
    
    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimerStage2, true);
    });
    
    // Reset timer on input
    const input = document.getElementById('userInput');
    if (input) {
        input.addEventListener('input', resetInactivityTimerStage2);
        input.addEventListener('keydown', resetInactivityTimerStage2);
    }
}
