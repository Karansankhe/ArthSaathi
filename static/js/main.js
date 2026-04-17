document.addEventListener('DOMContentLoaded', () => {
    // Initial State
    initCharts();
    setupNavigation();
    setupChat();
    setupAnalyticsChatbot();
    setupDashboard();
    setupStockAnalyzer();
    setupShoppingAssistant();

    // Handle deep linking via query param
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) {
        const link = document.querySelector(`.nav-link[data-view="${viewParam}"]`);
        if (link) link.click();
    }
});



function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetView = link.getAttribute('data-view');
            const targetEl = document.getElementById(`${targetView}-view`);
            
            // If we are on the dashboard and the view exists here, use SPA logic
            if (window.location.pathname === '/dashboard' && targetEl) {
                e.preventDefault();
                
                // Update URL without reload
                const url = targetView === 'dashboard' ? '/dashboard' : `/dashboard?view=${targetView}`;
                window.history.pushState({view: targetView}, '', url);

                // Update Nav UI
                document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
                link.parentElement.classList.add('active');

                // Switch View
                views.forEach(view => view.classList.remove('active'));
                targetEl.classList.add('active');

                // Handle Chatbot FAB Visibility
                const fab = document.getElementById('chatbot-fab');
                if (fab) {
                    fab.style.display = (targetView === 'analytics') ? 'flex' : 'none';
                    if (targetView !== 'analytics') {
                        document.getElementById('chatbot-modal').style.display = 'none';
                    }
                }
            }
            // Otherwise, let the browser handle the href navigation normally
        });
    });

    // Check visibility on load (if deep linked or refreshed)
    const activeLink = document.querySelector('.sidebar-nav li.active .nav-link');
    if (activeLink && activeLink.getAttribute('data-view') === 'analytics') {
        const fab = document.getElementById('chatbot-fab');
        if (fab) fab.style.display = 'flex';
    }


    // Handle back button
    window.onpopstate = (e) => {
        if (e.state && e.state.view) {
            const link = document.querySelector(`.nav-link[data-view="${e.state.view}"]`);
            if (link) link.click();
        }
    };
}

function setupChat() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const statusText = document.getElementById('status-text');
    const sourcesList = document.getElementById('sources-list');
    const agentPills = document.querySelectorAll('.agent-pill');

    let currentAgent = 'Financial Advisor';
    let isVoiceQuery = false;

    const updateAgentUI = (agentName) => {
        if (!agentName) return;
        currentAgent = agentName;
        statusText.textContent = `${agentName} is thinking...`;
        
        agentPills.forEach(pill => {
            pill.classList.remove('working');
            if (pill.textContent.toLowerCase().includes(agentName.split(' ')[0].toLowerCase())) {
                pill.classList.add('working');
                pill.classList.add('active');
            }
        });
    };

    const addSource = (url) => {
        if (!url) return;
        const empty = sourcesList.querySelector('.empty-text');
        if (empty) empty.remove();

        // Check if already exists
        if ([...sourcesList.querySelectorAll('.source-item')].some(s => s.href === url)) return;

        const a = document.createElement('a');
        a.className = 'source-item';
        a.href = url;
        a.target = '_blank';
        try {
            a.innerHTML = `<i class="ph ph-link"></i> ${new URL(url).hostname}`;
        } catch(e) {
            a.innerHTML = `<i class="ph ph-link"></i> Source`;
        }
        sourcesList.appendChild(a);
    };

    const parseMarkdown = (text) => {
        // Simple regex-based markdown parser
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/• (.*?)(<br>|$)/g, '<li>$1</li>')
            .replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    };

    const appendMessage = (text, sender, agentName = 'You') => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        if (sender === 'ai') msgDiv.style.animation = 'fadeInChat 0.5s ease-out forwards';
        
        const header = document.createElement('div');
        header.className = 'msg-header';
        header.innerHTML = `<i class="ph ph-${sender === 'ai' ? 'robot' : 'user'}"></i> ${agentName}`;
        
        const content = document.createElement('div');
        content.className = 'msg-content';
        content.innerHTML = sender === 'ai' ? parseMarkdown(text) : text;
        
        msgDiv.appendChild(header);
        msgDiv.appendChild(content);

        // Add Listen Button for AI
        if (sender === 'ai') {
            const listenBtn = document.createElement('button');
            listenBtn.className = 'audio-play-btn';
            listenBtn.style.marginTop = '10px';
            listenBtn.innerHTML = '<i class="ph ph-speaker-high"></i> Listen';
            listenBtn.onclick = async () => {
                if (listenBtn.disabled) return;
                listenBtn.disabled = true;
                listenBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Preparing...';
                
                try {
                    const resp = await fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: content.innerText })
                    });
                    const data = await resp.json();
                    if (data.audio_base64) {
                        const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
                        audio.play();
                        listenBtn.innerHTML = '<i class="ph ph-speaker-high"></i> Playing...';
                        audio.onended = () => {
                            listenBtn.innerHTML = '<i class="ph ph-speaker-high"></i> Listen';
                            listenBtn.disabled = false;
                        };
                    } else {
                        throw new Error('TTS Failed');
                    }
                } catch (e) {
                    listenBtn.innerHTML = '<i class="ph ph-warning"></i> Error';
                    setTimeout(() => {
                        listenBtn.innerHTML = '<i class="ph ph-speaker-high"></i> Listen';
                        listenBtn.disabled = false;
                    }, 2000);
                }
            };
            msgDiv.appendChild(listenBtn);
        }

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return content;
    };

    const handleChat = async () => {
        const query = chatInput.value.trim();
        if (!query) {
            isVoiceQuery = false;
            return;
        }

        chatInput.value = '';
        appendMessage(query, 'user');

        let activeAgentName = 'Financial Advisor';
        updateAgentUI(activeAgentName);
        
        const aiMsgContent = appendMessage('', 'ai', activeAgentName);
        let fullText = '';

        let sessionId = sessionStorage.getItem('chat_session_id');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem('chat_session_id', sessionId);
        }

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query,
                    session_id: sessionId
                })
            });

            if (!response.ok) throw new Error('Failed to connect');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                fullText += chunk;

                // Simple Metadata Parsing
                const agentMatch = fullText.match(/\[AGENT:\s*([^\]]+)\]/);
                if (agentMatch) {
                    const newAgent = agentMatch[1].trim();
                    if (newAgent !== activeAgentName) {
                        activeAgentName = newAgent;
                        updateAgentUI(activeAgentName);
                        aiMsgContent.previousElementSibling.innerHTML = `<i class="ph ph-robot"></i> ${activeAgentName}`;
                    }
                }

                // Check for [SOURCE: URL]
                const sourceMatches = fullText.matchAll(/\[SOURCE:\s*([^\]]+)\]/g);
                for (const match of sourceMatches) {
                    addSource(match[1].trim());
                }

                // Display cleaned text
                const displayAreaText = fullText
                    .replace(/\[AGENT:\s*[^\]]+\]/g, '')
                    .replace(/\[SOURCE:\s*[^\]]+\]/g, '')
                    .trim();
                
                aiMsgContent.innerHTML = parseMarkdown(displayAreaText);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            statusText.textContent = 'Advisor is ready';
            agentPills.forEach(p => p.classList.remove('working'));

            // AUTO TTS AFTER STREAM ENDS
            if (isVoiceQuery) {
                const listenBtn = aiMsgContent.parentElement.querySelector('.audio-play-btn');
                if (listenBtn) {
                    setTimeout(() => {
                        listenBtn.click();
                        isVoiceQuery = false;
                    }, 500);
                }
            }

        } catch (error) {
            aiMsgContent.textContent = 'Error: Could not connect to the AI.';
            statusText.textContent = 'Connection error';
            console.error(error);
        }
    };

    sendBtn.onclick = () => {
        isVoiceQuery = false;
        handleChat();
    };
    chatInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            isVoiceQuery = false;
            handleChat();
        }
    };

    // Voice Input for Team Fin AI
    const micBtn = document.getElementById('team-fin-mic-btn');
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    if (micBtn) {
        micBtn.onclick = async () => {
            if (isRecording) {
                mediaRecorder.stop();
                micBtn.classList.remove('recording');
                micBtn.style.color = '';
                isRecording = false;
            } else {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                    mediaRecorder.onstop = async () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        const formData = new FormData();
                        formData.append('file', audioBlob, 'team_fin_voice.webm');
                        
                        chatInput.placeholder = "Transcribing voice...";
                        try {
                            const resp = await fetch('/chatbot/speech-to-text', {
                                method: 'POST',
                                body: formData
                            });
                            const data = await resp.json();
                            if (data.text && data.text.trim().length > 0) {
                                // Add audio bubble to user chat
                                const userMsg = appendMessage('', 'user');
                                const audioUrl = URL.createObjectURL(audioBlob);
                                userMsg.innerHTML = `<audio controls src="${audioUrl}" style="height:30px;"></audio><br><em>"${data.text}"</em>`;
                                
                                chatInput.value = data.text;
                                isVoiceQuery = true;
                                handleChat();
                            } else {
                                console.warn("STT returned empty text");
                                chatInput.placeholder = "Couldn't hear you clearly. Please try again.";
                                setTimeout(() => chatInput.placeholder = "Ask about budgeting, investments, or savings...", 3000);
                            }
                        } catch (e) { 
                            console.error('STT Error', e);
                            chatInput.placeholder = "Error connecting to voice server.";
                        }
                        chatInput.placeholder = "Ask about budgeting, investments, or savings...";
                        stream.getTracks().forEach(t => t.stop());
                    };
                    mediaRecorder.start();
                    micBtn.classList.add('recording');
                    micBtn.style.color = '#ef4444';
                    isRecording = true;
                } catch (e) { alert("Mic access denied"); }
            }
        };
    }
}

async function initCharts() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        renderBalanceChart(stats.balance);
        renderStatsChart(stats.expense.categories);
        renderComparisonChart(stats.budget_vs_expense);
        
        // Update values in UI
        document.querySelector('.card:nth-child(1) .card-value').textContent = `$${stats.balance.current.toLocaleString()}`;
        document.querySelector('.card:nth-child(2) .card-value').textContent = `$${stats.income.current.toLocaleString()}`;
        document.querySelector('.card:nth-child(3) .card-value').textContent = `$${stats.expense.current.toLocaleString()}`;
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

let balChart, stsChart, cmpChart;

function renderBalanceChart(data) {
    const ctx = document.getElementById('balanceChart');
    if (!ctx) return;
    if (balChart) balChart.destroy();

    balChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['1 Jul', '3 Jul', '5 Jul', '7 Jul', '9 Jul', '11 Jul', '13 Jul', '15 Jul', '17 Jul', '19 Jul'],
            datasets: [{
                label: 'This month',
                data: data.history,
                borderColor: '#818CF8',
                backgroundColor: 'rgba(129, 140, 248, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Last month',
                data: data.last_month,
                borderColor: '#818CF8',
                borderDash: [5, 5],
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderStatsChart(categories) {
    const ctx = document.getElementById('statsChart');
    if (!ctx) return;
    if (stsChart) stsChart.destroy();

    if (!categories || categories.length === 0) return;

    const total = categories.reduce((s, c) => s + c.value, 0);

    // Animate the center value as a counter
    const centerVal = document.querySelector('.donut-center .value');
    if (centerVal) {
        animateCounter(centerVal, 0, total, 900, (v) => `$${Math.round(v).toLocaleString()}`);
    }

    // Build rich legend rows
    const donutLegend = document.getElementById('donut-legend');
    if (donutLegend) {
        donutLegend.innerHTML = '';
        categories.forEach((cat, i) => {
            const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0;
            const row = document.createElement('div');
            row.className = 'legend-row';
            row.dataset.index = i;
            row.innerHTML = `
                <div class="legend-color-pill" style="background:${cat.color};"></div>
                <div class="legend-row-info">
                    <div class="legend-row-top">
                        <span class="legend-cat-name">${cat.name}</span>
                        <div class="legend-cat-meta">
                            <span class="legend-cat-value">$${cat.value.toLocaleString()}</span>
                            <span class="legend-cat-pct">${pct}%</span>
                        </div>
                    </div>
                    <div class="legend-mini-bar">
                        <div class="legend-mini-bar-fill" style="background:${cat.color};" data-width="${pct}"></div>
                    </div>
                </div>
            `;

            // Hover: highlight chart segment
            row.addEventListener('mouseenter', () => {
                if (!stsChart) return;
                stsChart.setDatasetVisibility(0, true);
                stsChart.data.datasets[0].hoverOffset = 12;
                stsChart.tooltip.setActiveElements([{datasetIndex: 0, index: i}], {x: 0, y: 0});
                stsChart.update();
                document.querySelectorAll('.legend-row').forEach((r, ri) => {
                    r.style.opacity = ri === i ? '1' : '0.55';
                });
            });
            row.addEventListener('mouseleave', () => {
                if (!stsChart) return;
                stsChart.tooltip.setActiveElements([], {});
                stsChart.update();
                document.querySelectorAll('.legend-row').forEach(r => r.style.opacity = '1');
            });

            donutLegend.appendChild(row);
        });

        // Animate mini bars in after a short delay
        setTimeout(() => {
            donutLegend.querySelectorAll('.legend-mini-bar-fill').forEach(fill => {
                fill.style.width = fill.dataset.width + '%';
            });
        }, 200);
    }

    stsChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: categories.map(c => c.name),
            datasets: [{
                data: categories.map(c => c.value),
                backgroundColor: categories.map(c => c.color),
                hoverBackgroundColor: categories.map(c => c.color),
                borderWidth: 3,
                borderColor: '#ffffff',
                hoverBorderColor: '#ffffff',
                hoverBorderWidth: 3,
                hoverOffset: 12,
                cutout: '72%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 900,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.parsed;
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return `  $${val.toLocaleString()} (${pct}%)`;
                        }
                    },
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    titleFont: { size: 13, weight: '700' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    cornerRadius: 10,
                    caretSize: 6
                }
            },
            onHover: (event, activeElements) => {
                const rows = document.querySelectorAll('.legend-row');
                if (activeElements.length > 0) {
                    const idx = activeElements[0].index;
                    rows.forEach((r, i) => r.style.opacity = i === idx ? '1' : '0.55');
                } else {
                    rows.forEach(r => r.style.opacity = '1');
                }
            }
        }
    });
}

function animateCounter(el, from, to, duration, formatter) {
    const start = performance.now();
    const update = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = from + (to - from) * eased;
        el.textContent = formatter(current);
        if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
}

function renderComparisonChart(data) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;
    if (cmpChart) cmpChart.destroy();

    cmpChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: data.months,
            datasets: [{
                label: 'Expense',
                data: data.expense,
                backgroundColor: '#C7D2FE',
                borderRadius: 8
            }, {
                label: 'Budget',
                data: data.budget,
                backgroundColor: '#818CF8',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

function setupAnalyticsChatbot() {
    const fab = document.getElementById('chatbot-fab');
    const modal = document.getElementById('chatbot-modal');
    const closeBtn = document.getElementById('close-chat-btn');
    const clearBtn = document.getElementById('clear-chat-btn');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const input = document.getElementById('chatbot-input');
    const body = document.getElementById('chatbot-body');

    let sessionId = localStorage.getItem('analytics_chatbot_sid') || 'sid_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('analytics_chatbot_sid', sessionId);

    const toggleChat = () => {
        const isOpen = modal.style.display === 'flex';
        modal.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) {
            input.focus();
            loadHistory();
        }
    };

    if (fab) fab.addEventListener('click', toggleChat);
    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');

    const appendMsg = (text, role, audioB64 = null) => {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${role}`;
        
        const avatarHtml = role === 'bot' ? 
            `<div class="message-avatar"><i class="ph ph-robot"></i></div>` : 
            `<div class="message-avatar" style="background:#f3f4f6;"><i class="ph ph-user"></i></div>`;

        const name = role === 'bot' ? 'LeadBot' : 'You';

        let audioHtml = '';
        if (audioB64) {
            const audioSrc = `data:audio/wav;base64,${audioB64}`;
            const id = 'audio-' + Date.now();
            audioHtml = `
                <div style="margin-top: 12px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 8px;">
                    <audio id="${id}" src="${audioSrc}"></audio>
                    <button class="audio-play-btn" onclick="const a = document.getElementById('${id}'); if(a.paused){a.play(); this.classList.add('playing');}else{a.pause(); this.classList.remove('playing');} a.onended = () => this.classList.remove('playing');">
                        <i class="ph ph-speaker-high"></i> Listen to Plan
                    </button>
                </div>
            `;
        }

        wrapper.innerHTML = `
            ${avatarHtml}
            <div class="message-content">
                <span class="sender-name">${name}</span>
                <div class="bubble">
                    ${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
                    ${audioHtml}
                </div>
            </div>
        `;


        body.appendChild(wrapper);
        body.scrollTop = body.scrollHeight;
    };


    const loadHistory = async () => {
        try {
            const resp = await fetch(`/chatbot/history/${sessionId}`);
            const data = await resp.json();
            if (data.history && data.history.length > 0) {
                body.innerHTML = '';
                data.history.forEach(m => appendMsg(m.content, m.role === 'bot' ? 'bot' : 'user'));
            }
        } catch (e) { console.error('History load failed', e); }
    };

    const handleSend = async () => {
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        appendMsg(text, 'user');

        // Add loading indicator
        const loadingWrapper = document.createElement('div');
        loadingWrapper.className = 'message-wrapper bot loading';
        loadingWrapper.innerHTML = `
            <div class="message-avatar"><i class="ph ph-robot"></i></div>
            <div class="message-content">
                <span class="sender-name">LeadBot</span>
                <div class="bubble">...</div>
            </div>
        `;
        body.appendChild(loadingWrapper);
        body.scrollTop = body.scrollHeight;

        try {
            const resp = await fetch('/chatbot/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_input: text, session_id: sessionId })
            });
            const data = await resp.json();
            
            loadingWrapper.remove();
            appendMsg(data.response, 'bot', data.audio_base64);
            
            // Auto play audio if provided
            if (data.audio_base64) {
                setTimeout(() => {
                    const audioWrapper = document.querySelector('.message-wrapper:last-child .audio-play-btn');
                    if (audioWrapper) audioWrapper.click();
                }, 100);
            }
            
        } catch (e) {
            if (loadingWrapper) loadingWrapper.remove();
            appendMsg('Sorry, something went wrong. Please try again.', 'bot');
        }

    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (input) input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // Voice Input Setup
    const micBtn = document.getElementById('chatbot-mic-btn');
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    if (micBtn) {
        micBtn.addEventListener('click', async () => {
            if (isRecording) {
                // Stop recording
                mediaRecorder.stop();
                micBtn.classList.remove('recording');
                isRecording = false;
            } else {
                // Start recording
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];

                    mediaRecorder.ondataavailable = e => {
                        if (e.data.size > 0) audioChunks.push(e.data);
                    };

                    mediaRecorder.onstop = async () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Browsers capture webm often
                        const formData = new FormData();
                        formData.append('file', audioBlob, 'voice.webm');
                        
                        input.placeholder = "Listening...";
                        
                        try {
                            const resp = await fetch('/chatbot/speech-to-text', {
                                method: 'POST',
                                body: formData
                            });
                            const data = await resp.json();
                            if (data.text) {
                                input.value = data.text;
                                handleSend(); // Auto send
                            } else {
                                alert("Couldn't understand audio");
                            }
                        } catch (e) {
                            console.error('STT Error', e);
                            alert("Speech to text failed.");
                        } finally {
                            input.placeholder = "Reply to LeadBot...";
                        }
                        
                        // Stop all tracks to turn off mic light
                        stream.getTracks().forEach(track => track.stop());
                    };

                    mediaRecorder.start();
                    micBtn.classList.add('recording');
                    isRecording = true;
                } catch (err) {
                    console.error('Mic access denied or error', err);
                    alert("Microphone access is required for voice input");
                }
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (confirm('Clear chat history?')) {
                await fetch('/chatbot/clear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_input: '', session_id: sessionId })
                });
                body.innerHTML = '<div class="message bot">History cleared. How can I help you?</div>';
            }
        });
    }
}

function setupDashboard() {
    const uploadForm = document.getElementById('data-upload-form');
    const manualBtn = document.getElementById('manual-data-submit');
    const statusContainer = document.getElementById('parse-status-container');
    
    // Gamification Elements
    const goalInput = document.getElementById('gamification-goal-input');
    const setGoalBtn = document.getElementById('set-goal-btn');
    const currentGoalDisplay = document.getElementById('current-goal-display');
    const badgeDisplay = document.getElementById('badge-icon-display');
    const rankDisplay = document.getElementById('rank-level-display');
    const rankProgress = document.getElementById('rank-progress');
    const scoreDisplay = document.getElementById('score-display');
    const gamiStatusText = document.getElementById('gami-status-text');
    const gamiExpensesText = document.getElementById('gami-expenses-text');

    // Load Gamification State
    let userGoal = localStorage.getItem('gamification_goal');
    let userScore = parseInt(localStorage.getItem('gamification_score')) || 0;

    let currentLottieAnim = null;
    const updateGamificationUI = (expenses = 0) => {
        if (!badgeDisplay) return; // if not on page just return

        if (userGoal) {
            currentGoalDisplay.textContent = `Current Goal: $${parseFloat(userGoal).toLocaleString()}`;
        }

        // Rank System
        const ranks = [
            { key: 'gami.rank.bronze', lottie: 'bronze.json', minScore: 0, maxScore: 99, color: '#F59E0B' },
            { key: 'gami.rank.silver', lottie: 'level1.json', minScore: 100, maxScore: 299, color: '#9CA3AF' },
            { key: 'gami.rank.gold', lottie: 'level3.json', minScore: 300, maxScore: 599, color: '#FCD34D' },
            { key: 'gami.rank.platinum', lottie: 'level1.json', minScore: 600, maxScore: 999, color: '#818CF8' },
            { key: 'gami.rank.diamond', lottie: 'level3.json', minScore: 1000, maxScore: 99999, color: '#C084FC' }
        ];

        let currentRank = ranks[0];
        let nextRank = ranks[1];
        for (let i = 0; i < ranks.length; i++) {
            if (userScore >= ranks[i].minScore) {
                currentRank = ranks[i];
                nextRank = ranks[i + 1] || ranks[i];
            }
        }

        // Load/Update Lottie Animation for Badge
        const lottiePath = `/static/lottie/${currentRank.lottie}`;
        if (badgeDisplay.getAttribute('data-current-lottie') !== lottiePath) {
            if (currentLottieAnim) {
                currentLottieAnim.destroy();
            }
            badgeDisplay.innerHTML = '';
            currentLottieAnim = lottie.loadAnimation({
                container: badgeDisplay,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: lottiePath
            });
            badgeDisplay.setAttribute('data-current-lottie', lottiePath);
        }

        rankDisplay.textContent = I18N.t(currentRank.key);
        rankDisplay.style.color = currentRank.color;
        scoreDisplay.textContent = `Score: ${userScore}`;

        // Progress Calculation
        let progress = 100;
        if (currentRank !== nextRank) {
            progress = ((userScore - currentRank.minScore) / (nextRank.minScore - currentRank.minScore)) * 100;
        }
        rankProgress.style.width = `${progress}%`;

        // Update Achievement
        if (userGoal && expenses > 0) {
            gamiExpensesText.textContent = `$${expenses.toLocaleString()} / $${parseFloat(userGoal).toLocaleString()}`;
            if (expenses <= parseFloat(userGoal)) {
                gamiStatusText.textContent = 'On Track! Goal Achieved';
                gamiStatusText.style.color = '#10B981'; // Green
            } else {
                gamiStatusText.textContent = 'Over Budget. Needs Attention.';
                gamiStatusText.style.color = '#EF4444'; // Red
            }
        } else if (userGoal) {
             gamiExpensesText.textContent = `$0 / $${parseFloat(userGoal).toLocaleString()}`;
             gamiStatusText.textContent = 'Awaiting Data Validation';
             gamiStatusText.style.color = '#F59E0B';
        }

        // Sync to Stats view if applicable
        const statsGami = document.getElementById('stats-gamification-info');
        if (statsGami) {
            statsGami.innerHTML = `
                <i class="ph ph-medal" style="color:${currentRank.color}; font-size:1.2rem;"></i>
                <span style="font-weight:600; margin-right: 10px;">${currentRank.name} (Score: ${userScore})</span>
                <i class="ph ph-target"></i>
                <span>Goal: $${userGoal ? parseFloat(userGoal).toLocaleString() : 'Not Set'} &nbsp;|&nbsp; Achieved: ${gamiStatusText.textContent}</span>
            `;
        }
    };

    updateGamificationUI();

    if (setGoalBtn) {
        setGoalBtn.addEventListener('click', () => {
            const val = goalInput.value.trim();
            if(!val || isNaN(val)) {
                alert("Please enter a valid numeric goal.");
                return;
            }
            userGoal = val;
            localStorage.setItem('gamification_goal', val);
            goalInput.value = '';
            alert("Goal set successfully!");
            updateGamificationUI();
        });
    }

    // Add file input logic to standard setup if form missing, but wait...
    const updateStatsDOM = (stats) => {
        if (!stats) return;
        renderBalanceChart(stats.balance);
        renderStatsChart(stats.expense?.categories || []);
        renderComparisonChart(stats.budget_vs_expense);
        
        document.querySelector('.card:nth-child(1) .card-value').textContent = `$${(stats.balance?.current || 0).toLocaleString()}`;
        document.querySelector('.card:nth-child(2) .card-value').textContent = `$${(stats.income?.current || 0).toLocaleString()}`;
        document.querySelector('.card:nth-child(3) .card-value').textContent = `$${(stats.expense?.current || 0).toLocaleString()}`;
        
        // Update Donut Center
        const donutCenterVal = document.querySelector('.donut-center .value');
        if (donutCenterVal) {
            donutCenterVal.textContent = `$${(stats.expense?.current || 0).toLocaleString()}`;
        }
        
        // Update Donut Legend - rendered by renderStatsChart, just trigger re-render
        // (renderStatsChart already handles the rich legend row building)
        
        // Update small stat trends if desired (Optional: setting standard texts after parsed data)
        document.querySelectorAll('.card-footer p').forEach(el => el.innerHTML = 'Based on parsed AI extraction');
        
        const catCnt1 = document.querySelector('.card:nth-child(1) .categories-count');
        const catCnt2 = document.querySelector('.card:nth-child(2) .categories-count');
        const catCnt3 = document.querySelector('.card:nth-child(3) .categories-count');
        
        if(catCnt1) catCnt1.innerHTML = `<i class="ph ph-squares-four"></i> Accounts Extracted`;
        if(catCnt2) catCnt2.innerHTML = `<i class="ph ph-squares-four"></i> Income Streams Extracted`;
        if(catCnt3) catCnt3.innerHTML = `<i class="ph ph-squares-four"></i> ${stats.expense?.categories?.length || 0} Categories`;
    };

    const processData = async (formData) => {
        statusContainer.style.display = 'flex';
        try {
            const resp = await fetch('/api/parse-data', {
                method: 'POST',
                body: formData
            });
            if (!resp.ok) throw new Error("Parse failed");
            const data = await resp.json();
            
            if(data.stats) {
                updateStatsDOM(data.stats);
                const expenseNum = data.stats.expense?.current || 0;

                // Gamification Cross-Verification
                if (userGoal) {
                    const goalNum = parseFloat(userGoal);
                    if (expenseNum <= goalNum) {
                        userScore += 50; 
                        alert(`Success! You stayed under your goal by $${(goalNum - expenseNum).toLocaleString()}. +50 Points!`);
                    } else {
                        userScore += 10;
                        alert(`You crossed your budget by $${(expenseNum - goalNum).toLocaleString()}, but tracking is a step forward. +10 Points.`);
                    }
                    localStorage.setItem('gamification_score', userScore);
                } else {
                    alert("Data parsed successfully! You can set a monthly expense goal to earn points and level up!");
                }
                
                updateGamificationUI(expenseNum);

                // Switch to analytics view automatically
                document.querySelector('.nav-link[data-view="analytics"]').click();
            }
        } catch(e) {
            alert("Error parsing data: " + e.message);
        } finally {
            statusContainer.style.display = 'none';
        }
    };

    if (uploadForm) {
        const fileInput = document.getElementById('data-files');
        const listDiv = document.getElementById('selected-files-list');
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                listDiv.innerHTML = Array.from(fileInput.files).map(f => `<div><i class="ph ph-file-text"></i> ${f.name}</div>`).join('');
            } else {
                listDiv.innerHTML = '';
            }
        });

        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (fileInput.files.length === 0) return alert("Select files first.");
            const formData = new FormData(uploadForm);
            processData(formData);
        });
    }

    if (manualBtn) {
        manualBtn.addEventListener('click', () => {
            const text = document.getElementById('manual-data-input').value;
            if (!text.trim()) return alert("Enter some text first.");
            const formData = new FormData();
            formData.append('text_data', text);
            processData(formData);
        });
    }
}

function setupStockAnalyzer() {
    const fetchBtn = document.getElementById('fetch-stock-btn');
    const analyzeBtn = document.getElementById('analyze-stock-btn');
    const tickerInput = document.getElementById('stock-ticker-input');
    const dropdown = document.getElementById('stock-dropdown');
    const dataDisplay = document.getElementById('stock-data-display');
    const actionSection = document.getElementById('stock-action-section');
    const analysisResult = document.getElementById('stock-analysis-result');
    const analysisContent = document.getElementById('stock-analysis-content');
    const chartContainer = document.getElementById('stock-chart-container');
    const chartTitle = document.getElementById('chart-title');

    let historyChart;

    if (!fetchBtn) return;

    dropdown.addEventListener('change', () => {
        if (dropdown.value) {
            tickerInput.value = '';
        }
    });

    tickerInput.addEventListener('input', () => {
        if (tickerInput.value) {
            dropdown.value = '';
        }
    });

    const renderHistoryChart = (labels, values, assetName) => {
        const ctx = document.getElementById('stockHistoryChart');
        if (!ctx) return;
        if (historyChart) historyChart.destroy();
        
        chartContainer.style.display = 'block';
        chartTitle.textContent = `${assetName} - Price Trend (Last 30 Days)`;

        historyChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price',
                    data: values,
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } } },
                    y: { grid: { color: 'rgba(0,0,0,0.05)' } }
                }
            }
        });
    };

    fetchBtn.addEventListener('click', async () => {
        let symbol = dropdown.value || tickerInput.value.trim().toUpperCase();
        if (!symbol) return alert('Please select an asset or enter a ticker');

        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Fetching...';
        
        const isCommodity = symbol.startsWith('COMM:');
        const cleanSymbol = isCommodity ? symbol.replace('COMM:', '') : symbol;

        try {
            if (isCommodity) {
                // Fetch Commodity
                const resp = await fetch(`/api/commodity/${cleanSymbol}`);
                const data = await resp.json();
                if (data.error) throw new Error(data.error);

                document.getElementById('stock-price').textContent = `${data.price} ${data.unit}`;
                document.getElementById('stock-change').textContent = '-';
                document.getElementById('stock-change-percent').textContent = data.name;
                document.getElementById('stock-volume').textContent = 'N/A';

                renderHistoryChart(data.labels, data.values, data.name);
            } else {
                // Fetch Stock Quote
                const resp = await fetch(`/api/stock/${cleanSymbol}`);
                if (!resp.ok) throw new Error('Stock data not found');
                const quote = await resp.json();

                document.getElementById('stock-price').textContent = `$${parseFloat(quote.price).toFixed(2)}`;
                const change = parseFloat(quote.change);
                const changeEl = document.getElementById('stock-change');
                changeEl.textContent = `${change >= 0 ? '+' : ''}$${change.toFixed(2)}`;
                changeEl.style.color = change >= 0 ? '#10B981' : '#EF4444';
                
                const pctEl = document.getElementById('stock-change-percent');
                pctEl.textContent = quote.change_percent;
                pctEl.style.color = change >= 0 ? '#10B981' : '#EF4444';
                
                document.getElementById('stock-volume').textContent = parseInt(quote.volume).toLocaleString();

                // Fetch Stock History
                const histResp = await fetch(`/api/stock/history/${cleanSymbol}`);
                const histData = await histResp.json();
                renderHistoryChart(histData.labels, histData.values, cleanSymbol);
            }

            dataDisplay.style.display = 'flex';
            actionSection.style.display = 'block';
            analysisResult.style.display = 'none';
            
        } catch (e) {
            alert('Error fetching data: ' + e.message);
        } finally {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i> Analyze';
        }
    });

    analyzeBtn.addEventListener('click', async () => {
        let symbol = dropdown.value || tickerInput.value.trim().toUpperCase();
        if (!symbol) return;
        
        const cleanSymbol = symbol.startsWith('COMM:') ? symbol.replace('COMM:', '') : symbol;

        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Generating Report...';
        analysisResult.style.display = 'none';

        try {
            const resp = await fetch('/api/stock/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: cleanSymbol })
            });
            if (!resp.ok) throw new Error('Analysis failed');
            const data = await resp.json();

            const parseMarkdown = (text) => {
                return text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>')
                    .replace(/\* (.*?)<br>/g, '<li>$1</li>')
                    .replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
            };

            analysisContent.innerHTML = parseMarkdown(data.analysis);
            analysisResult.style.display = 'block';
            analysisResult.scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            alert('Error generating report: ' + e.message);
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="ph ph-magic-wand"></i> Get AI Recommendation';
        }
    });
}

function setupShoppingAssistant() {
    const triggers = [
        document.getElementById('shopping-assistant-trigger'),
        document.getElementById('budget-assistant-trigger')
    ];
    const modal = document.getElementById('shopping-modal');
    const closeBtn = document.getElementById('close-shopping-modal');
    const sendBtn = document.getElementById('analyze-shopping-btn');
    const input = document.getElementById('shopping-query');
    const chatBody = document.getElementById('shopping-chat-body');

    const newChatBtn = document.getElementById('new-shopping-chat');

    if (!modal) return;

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            chatBody.innerHTML = `
                <div class="chat-message ai">
                    <div class="message-meta-premium">
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=ShoppingBot" alt="AI Agent" class="chat-avatar-premium">
                        <span class="agent-name-premium">CHAT A.I.+</span>
                    </div>
                    <div class="bubble-premium">
                        Hello! I'm your Smart Shopping Assistant. I can help you analyze if a purchase fits your budget and provide market insights. What are you looking to buy today?
                    </div>
                </div>
            `;
        });
    }

    triggers.forEach(trigger => {
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'flex';
                input.focus();
            });
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    const appendMessage = (text, type) => {
        const msg = document.createElement('div');
        msg.className = `chat-message ${type}`;
        
        const avatar = type === 'ai' 
            ? 'https://api.dicebear.com/7.x/bottts/svg?seed=ShoppingBot' 
            : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adaline';
        
        const name = type === 'ai' ? 'CHAT A.I.+' : 'You';
        
        msg.innerHTML = `
            <div class="message-meta-premium">
                <img src="${avatar}" alt="${name}" class="chat-avatar-premium">
                <span class="agent-name-premium">${name}</span>
            </div>
            <div class="bubble-premium">${text}</div>
        `;
        
        chatBody.appendChild(msg);
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    const handleAction = async () => {
        const query = input.value.trim();
        if (!query) return;

        input.value = '';
        appendMessage(query, 'user');

        // Add loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message ai loading';
        loadingDiv.innerHTML = `
            <div class="message-meta-premium">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=ShoppingBot" alt="AI Agent" class="chat-avatar-premium">
                <span class="agent-name-premium">Thinking...</span>
            </div>
            <div class="bubble-premium">...</div>
        `;
        chatBody.appendChild(loadingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            const resp = await fetch('/api/shopping/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await resp.json();
            
            loadingDiv.remove();
            
            // Format markdown-like response
            const formatted = data.analysis
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            
            appendMessage(formatted, 'ai');
        } catch (e) {
            if (loadingDiv) loadingDiv.remove();
            appendMessage("Sorry, I encountered an error analyzing your request.", 'ai');
        }
    };

    if (sendBtn) sendBtn.addEventListener('click', handleAction);
    if (input) input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAction();
    });
}

