// ─────────────────────────────────────────────
// SUPABASE INIT
// ─────────────────────────────────────────────
const SUPABASE_URL  = 'https://xlweytqmwqieulquczrh.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_SH7v5dlqVoB_JApmis8e_g_auXtBY5Z';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ─────────────────────────────────────────────
// AUTH STATE
// ─────────────────────────────────────────────
let currentSession = null;

async function initAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentSession = session;
        showDashboard(session.user);
    } else {
        showAuthOverlay();
    }

    // Listen for auth changes (e.g. token refresh, logout from another tab)
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentSession = session;
        if (session) {
            showDashboard(session.user);
        } else {
            showAuthOverlay();
        }
    });
}

function showDashboard(user) {
    document.getElementById('auth-overlay').classList.add('hidden');
    // Update user info in header
    const nameEl  = document.querySelector('.user-name');
    const emailEl = document.querySelector('.user-email');
    if (nameEl)  nameEl.textContent  = user.user_metadata?.full_name || user.email.split('@')[0];
    if (emailEl) emailEl.textContent = user.email;
}

function showAuthOverlay() {
    document.getElementById('auth-overlay').classList.remove('hidden');
}

// ─────────────────────────────────────────────
// AUTH UI HELPERS
// ─────────────────────────────────────────────
function switchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tab-login').classList.toggle('active', isLogin);
    document.getElementById('tab-signup').classList.toggle('active', !isLogin);
    document.getElementById('form-login').style.display  = isLogin ? '' : 'none';
    document.getElementById('form-signup').style.display = isLogin ? 'none' : '';
    clearAuthError();
}

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.add('show');
}

function clearAuthError() {
    const el = document.getElementById('auth-error');
    el.textContent = '';
    el.classList.remove('show');
}

function setAuthLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    btn.disabled  = loading;
    btn.textContent = loading ? 'Please wait...' : (btnId === 'login-btn' ? 'Sign In' : 'Create Account');
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
async function handleLogin() {
    clearAuthError();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) { showAuthError('Please fill in all fields.'); return; }

    setAuthLoading('login-btn', true);
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setAuthLoading('login-btn', false);

    if (error) showAuthError(error.message);
}

// ─────────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────────
async function handleSignup() {
    clearAuthError();
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!name || !email || !password) { showAuthError('Please fill in all fields.'); return; }
    if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }

    setAuthLoading('signup-btn', true);
    const { error } = await supabaseClient.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
    });
    setAuthLoading('signup-btn', false);

    if (error) {
        showAuthError(error.message);
    } else {
        showAuthError('✅ Account created! Check your email to confirm, then sign in.');
        document.getElementById('auth-error').style.color = '#6EE7B7';
        document.getElementById('auth-error').style.background = 'rgba(16,185,129,0.1)';
        switchTab('login');
    }
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
async function handleLogout(e) {
    e.preventDefault();
    await supabaseClient.auth.signOut();
}

// ─────────────────────────────────────────────
// EXPOSE GLOBALS FOR INLINE onclick HANDLERS
// ─────────────────────────────────────────────
window.switchTab   = switchTab;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;

// ─────────────────────────────────────────────
// APP INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initCharts();
    setupNavigation();
    setupChat();
});

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            
            // If the view exists (some are placeholders)
            const targetEl = document.getElementById(`${targetView}-view`);
            if (!targetEl) return;

            // Update Nav UI
            document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
            link.parentElement.classList.add('active');

            // Switch View
            views.forEach(view => view.classList.remove('active'));
            targetEl.classList.add('active');
        });
    });
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
        a.innerHTML = `<i class="ph ph-link"></i> ${new URL(url).hostname}`;
        sourcesList.appendChild(a);
    };

    const appendMessage = (text, sender, agentName = 'You') => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        const header = document.createElement('div');
        header.className = 'msg-header';
        header.innerHTML = `<i class="ph ph-${sender === 'ai' ? 'robot' : 'user'}"></i> ${agentName}`;
        
        const content = document.createElement('div');
        content.className = 'msg-content';
        content.textContent = text;
        
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

        try {
            // Build auth headers — attach JWT so FastAPI can verify the user
            const headers = { 'Content-Type': 'application/json' };
            if (currentSession?.access_token) {
                headers['Authorization'] = `Bearer ${currentSession.access_token}`;
            }

            const response = await fetch('/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({ query })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                fullText += chunk;

                // Simple Metadata Parsing
                // Check for [AGENT: Name]
                const agentMatch = fullText.match(/\[AGENT:\s*([^\]]+)\]/);
                if (agentMatch) {
                    const newAgent = agentMatch[1].trim();
                    if (newAgent !== activeAgentName) {
                        activeAgentName = newAgent;
                        updateAgentUI(activeAgentName);
                        // Update the header of the current message if it's the same block, 
                        // or we could start a new block. For simplicity, update header.
                        aiMsgContent.previousElementSibling.innerHTML = `<i class="ph ph-robot"></i> ${activeAgentName}`;
                    }
                }

                // Check for [SOURCE: URL]
                const sourceMatches = fullText.matchAll(/\[SOURCE:\s*([^\]]+)\]/g);
                for (const match of sourceMatches) {
                    addSource(match[1].trim());
                }

                // Display cleaned text (remove tags for UI)
                const displayAreaText = fullText
                    .replace(/\[AGENT:\s*[^\]]+\]/g, '')
                    .replace(/\[SOURCE:\s*[^\]]+\]/g, '')
                    .trim();
                
                aiMsgContent.textContent = displayAreaText;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            statusText.textContent = 'Advisor is ready';
            agentPills.forEach(p => p.classList.remove('working'));

        } catch (error) {
            aiMsgContent.textContent = 'Error: Could not connect to the AI.';
            statusText.textContent = 'Connection error';
        }
    };

    sendBtn.onclick = handleChat;
    chatInput.onkeypress = (e) => {
        if (e.key === 'Enter') handleChat();
    };
}

function initCharts() {
    const balanceCtx = document.getElementById('balanceChart');
    if (!balanceCtx) return;

    new Chart(balanceCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['1 Jul', '3 Jul', '5 Jul', '7 Jul', '9 Jul', '11 Jul', '13 Jul', '15 Jul', '17 Jul', '19 Jul'],
            datasets: [{
                label: 'This month',
                data: [15000, 16000, 13000, 14000, 18500, 16000, 14500, 17000, 19000, 18000],
                borderColor: '#818CF8',
                backgroundColor: 'rgba(129, 140, 248, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Last month',
                data: [14000, 15000, 15500, 13000, 15000, 14000, 15500, 14000, 16000, 15000],
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

    const statsCtx = document.getElementById('statsChart');
    if (statsCtx) {
        new Chart(statsCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [40, 20, 15, 10, 10, 5],
                    backgroundColor: ['#C7D2FE', '#374151', '#818CF8', '#4F46E5', '#10B981', '#CBD5E1'],
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

    const comparisonCtx = document.getElementById('comparisonChart');
    if (comparisonCtx) {
        new Chart(comparisonCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Expense',
                    data: [5000, 3000, 4500, 2500, 4000, 6000, 2000],
                    backgroundColor: '#C7D2FE',
                    borderRadius: 8
                }, {
                    label: 'Budget',
                    data: [6000, 5500, 5000, 6000, 5500, 7000, 6500],
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
}
