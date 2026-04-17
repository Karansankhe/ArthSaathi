document.addEventListener('DOMContentLoaded', () => {
    // Initial State
    initCharts();
    setupNavigation();
    setupChat();
    setupAnalyticsChatbot();
});


function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            
            // If the view exists
            const targetEl = document.getElementById(`${targetView}-view`);
            if (!targetEl) return;

            // Update URL without reload (optional but good for SPA)
            const url = targetView === 'analytics' ? '/' : `/${targetView}`;
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
                if (targetView === 'analytics') {
                    fab.style.display = 'flex';
                } else {
                    fab.style.display = 'none';
                    // Also close modal if it's open and we navigate away
                    document.getElementById('chatbot-modal').style.display = 'none';
                }
            }
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
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return content;
    };

    const handleChat = async () => {
        const query = chatInput.value.trim();
        if (!query) return;

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

                // Display cleaned text with simple markdown parsing
                const displayAreaText = fullText
                    .replace(/\[AGENT:\s*[^\]]+\]/g, '')
                    .replace(/\[SOURCE:\s*[^\]]+\]/g, '')
                    .trim();
                
                aiMsgContent.innerHTML = parseMarkdown(displayAreaText);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            statusText.textContent = 'Advisor is ready';
            agentPills.forEach(p => p.classList.remove('working'));

        } catch (error) {
            aiMsgContent.textContent = 'Error: Could not connect to the AI.';
            statusText.textContent = 'Connection error';
            console.error(error);
        }
    };

    sendBtn.onclick = handleChat;
    chatInput.onkeypress = (e) => {
        if (e.key === 'Enter') handleChat();
    };
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
        // Fallback or local defaults
    }
}

function renderBalanceChart(data) {
    const ctx = document.getElementById('balanceChart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
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

    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            datasets: [{
                data: categories.map(c => c.value),
                backgroundColor: categories.map(c => c.color),
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderComparisonChart(data) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
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

    const appendMsg = (text, role) => {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${role}`;
        
        const avatarHtml = role === 'bot' ? 
            `<div class="message-avatar"><i class="ph ph-robot"></i></div>` : 
            `<div class="message-avatar" style="background:#f3f4f6;"><i class="ph ph-user"></i></div>`;

        const name = role === 'bot' ? 'LeadBot' : 'You';

        wrapper.innerHTML = `
            ${avatarHtml}
            <div class="message-content">
                <span class="sender-name">${name}</span>
                <div class="bubble">
                    ${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
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
            appendMsg(data.response, 'bot');
            
        } catch (e) {
            if (loadingWrapper) loadingWrapper.remove();
            appendMsg('Sorry, something went wrong. Please try again.', 'bot');
        }

    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (input) input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

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

