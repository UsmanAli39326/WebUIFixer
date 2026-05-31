document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('audit-form');
    const urlInput = document.getElementById('url-input');
    const aiToggle = document.getElementById('ai-toggle');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.querySelector('.btn-text');
    const spinner = document.querySelector('.spinner');
    const errorMsg = document.getElementById('error-message');

    const resultsSection = document.getElementById('results-section');
    const statCritical = document.getElementById('stat-critical');
    const statScore = document.getElementById('stat-score');
    const statTotal = document.getElementById('stat-total');
    const statA11y = document.getElementById('stat-a11y');
    const statDesign = document.getElementById('stat-design');

    const aiContainer = document.getElementById('ai-suggestion-container');
    const aiCode = document.getElementById('ai-code');
    const aiPreviewFrame = document.getElementById('ai-preview-frame');
    const aiTabBtns = document.querySelectorAll('.ai-tabs .tab-btn');

    const issuesList = document.getElementById('issues-list');
    const filterBtns = document.querySelectorAll('.filter-btn');

    const statusBackend = document.getElementById('status-backend');
    const statusAi = document.getElementById('status-ai');
    const statusUser = document.getElementById('status-user');
    const userNameEl = statusUser.querySelector('.user-name');
    const logoutBtn = document.getElementById('logout-btn');

    const authSection = document.getElementById('auth-section');
    const authTabBtns = document.querySelectorAll('.auth-tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const mainAppContent = document.getElementById('main-app-content');

    const progressContainer = document.getElementById('progress-container');
    const progressText = document.getElementById('progress-text');

    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const viewHtmlBtn = document.getElementById('view-html-btn');

    let currentIssues = [];
    let currentAuditId = null;
    let jwtToken = localStorage.getItem('token');
    const API_BASE = 'http://localhost:3000';

    // ── Auth Handling ───────────────────────────────────────────────────

    async function updateAuthState() {
        if (jwtToken) {
            try {
                const res = await fetch(`${API_BASE}/api/user/profile`, {
                    headers: { 'Authorization': `Bearer ${jwtToken}` }
                });
                if (!res.ok) throw new Error("Invalid session");
                const userProfile = await res.json();

                authSection.classList.add('hidden');
                mainAppContent.classList.remove('hidden');
                logoutBtn.classList.remove('hidden');
                userNameEl.textContent = userProfile.name;
                
                // Admin Tab Logic
                if (userProfile.role === 'admin') {
                    document.getElementById('admin-tab-btn').classList.remove('hidden');
                    fetchUsers();
                } else {
                    document.getElementById('admin-tab-btn').classList.add('hidden');
                }

                // Populate Profile
                document.getElementById('profile-bio').value = userProfile.profile?.bio || '';
                document.getElementById('profile-website').value = userProfile.profile?.website || '';
                
                fetchTemplates(); // Always load marketplace storefront

            } catch (err) {
                console.error(err);
                jwtToken = null;
                localStorage.removeItem('token');
                updateAuthState();
            }
        } else {
            authSection.classList.remove('hidden');
            mainAppContent.classList.add('hidden');
            logoutBtn.classList.add('hidden');
            userNameEl.textContent = 'Guest';
        }
    }

    authTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            authTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (btn.dataset.target === 'login-form') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        });
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelectorAll('input')[0].value;
        const password = loginForm.querySelectorAll('input')[1].value;

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            jwtToken = data.token;
            localStorage.setItem('token', jwtToken);
            updateAuthState();
        } catch (err) {
            alert(err.message);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm.querySelectorAll('input')[0].value;
        const email = registerForm.querySelectorAll('input')[1].value;
        const password = registerForm.querySelectorAll('input')[2].value;

        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert('Registration successful! Please login.');
            authTabBtns[0].click(); // switch to login
        } catch (err) {
            alert(err.message);
        }
    });

    logoutBtn.addEventListener('click', () => {
        jwtToken = null;
        localStorage.removeItem('token');
        updateAuthState();
    });

    updateAuthState();

    // ── Audit Handling ──────────────────────────────────────────────────

    // Progress messages cycle
    const PROGRESS_STEPS = [
        "Connecting to Backend...",
        "Scraping website content...",
        "Extracting DOM structure...",
        "Analyzing computed styles...",
        "Running WCAG accessibility audit...",
        "Checking design system consistency...",
        "Classifying issue severity...",
        "Finalizing results..."
    ];
    let progressInterval;

    // Service Status Check
    async function checkServiceStatus() {
        try {
            const res = await fetch(`${API_BASE}/health`);
            const data = await res.json();

            updateStatusIndicator(statusBackend, true);
            updateStatusIndicator(statusAi, data.aiEngine && data.aiEngine.status === 'ok');
        } catch (err) {
            updateStatusIndicator(statusBackend, false);
            updateStatusIndicator(statusAi, false);
        }
    }

    function updateStatusIndicator(el, isOnline) {
        const text = el.querySelector('.status-text');
        if (isOnline) {
            el.classList.add('online');
            el.classList.remove('offline');
            text.textContent = 'Online';
        } else {
            el.classList.add('offline');
            el.classList.remove('online');
            text.textContent = 'Offline';
        }
    }

    // Run status check every 5 seconds
    checkServiceStatus();
    setInterval(checkServiceStatus, 5000);

    // AI Tabs logic
    aiTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            aiTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(btn.dataset.target).classList.remove('hidden');
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const targetUrl = urlInput.value.trim();
        if (!targetUrl) return;

        setLoading(true);
        hideError();
        aiContainer.classList.add('hidden'); // hide previous
        resultsSection.classList.add('hidden');

        try {
            const reqUrl = `${API_BASE}/audit?url=${encodeURIComponent(targetUrl)}&ai=${aiToggle.checked}`;
            const res = await fetch(reqUrl, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`
                }
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    jwtToken = null;
                    localStorage.removeItem('token');
                    updateAuthState();
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.error || 'Failed to analyze webpage');
            }

            currentAuditId = data.id;
            currentIssues = data.issues || [];

            updateSummary(data.summary);
            renderIssues('all');

            if (data.fixedHtml) {
                let finalHtml = data.fixedHtml;
                
                // Inject base tag for relative assets
                const baseTag = `<base href="${targetUrl}">\n`;
                if (finalHtml.includes("<head>")) {
                    finalHtml = finalHtml.replace("<head>", "<head>\n" + baseTag);
                } else {
                    finalHtml = baseTag + finalHtml;
                }

                if (data.styleOverlay && Object.keys(data.styleOverlay).length > 0) {
                    let styles = "<style>\n";
                    for (const [selector, rules] of Object.entries(data.styleOverlay)) {
                        styles += `${selector} {\n`;
                        for (const [prop, val] of Object.entries(rules)) {
                            styles += `  ${prop}: ${val} !important;\n`;
                        }
                        styles += "}\n";
                    }
                    styles += "</style>\n";
                    
                    if (finalHtml.includes("</head>")) {
                        finalHtml = finalHtml.replace("</head>", styles + "</head>");
                    } else if (finalHtml.includes("<head>")) {
                        finalHtml = finalHtml.replace("<head>", "<head>\n" + styles);
                    } else {
                        finalHtml = styles + finalHtml;
                    }
                }

                aiCode.textContent = finalHtml;
                aiPreviewFrame.srcdoc = finalHtml;
                aiContainer.classList.remove('hidden');

                // Reset tabs to code view
                aiTabBtns[0].click();
            }

            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderIssues(btn.dataset.filter);
        });
    });

    function renderIssues(severityFilter) {
        issuesList.innerHTML = '';

        const filtered = severityFilter === 'all'
            ? currentIssues
            : currentIssues.filter(i => i.severity === severityFilter);

        if (filtered.length === 0) {
            issuesList.innerHTML = `
                <div class="glass-card" style="text-align: center; color: var(--text-muted)">
                    No ${severityFilter === 'all' ? '' : severityFilter + ' severity '}issues found. 🎉
                </div>
            `;
            return;
        }

        filtered.forEach((issue, index) => {
            const card = document.createElement('div');
            card.className = `issue-card severity-${issue.severity}`;
            card.style.animation = `fadeInUp 0.4s ease-out ${index * 0.05}s both`;

            // Build element context string
            let idStr = issue.id ? `<span class="element-id">#${issue.id}</span>` : '';
            let classStr = issue.className ? `<span class="element-class">.${issue.className.split(' ').join('.')}</span>` : '';
            let textSnippet = issue.text ? `<span class="element-text">"${issue.text}"</span>` : '';

            let elementDetails = '';
            if (idStr || classStr || textSnippet) {
                elementDetails = `<div class="element-details">${idStr}${classStr}${textSnippet}</div>`;
            }

            card.innerHTML = `
                <div class="issue-header">
                    <span class="element-tag">&lt;${issue.element}&gt;</span>
                    <div class="issue-badges">
                        <span class="badge type-${issue.type}">${issue.type}</span>
                        <span class="badge severity-${issue.severity}">${issue.severity}</span>
                    </div>
                </div>
                ${elementDetails}
                <p class="issue-message">${issue.issue}</p>
                <div class="issue-fix">
                    <strong>Suggested Fix:</strong> ${issue.fix}
                </div>
            `;
            issuesList.appendChild(card);
        });
    }

    function updateSummary(summary) {
        if (!summary) return;

        animateValue(statCritical, 0, summary.bySeverity.critical || 0, 1000);
        animateValue(statScore, 0, summary.currentScore || 0, 1500);
        animateValue(statTotal, 0, summary.totalIssues, 1000);
        animateValue(statA11y, 0, summary.byType.accessibility || 0, 1000);
        animateValue(statDesign, 0, summary.byType.design || 0, 1000);
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    }

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
            progressContainer.classList.remove('hidden');

            // Start progress cycling
            let stepIndex = 0;
            progressText.textContent = PROGRESS_STEPS[0];
            progressInterval = setInterval(() => {
                stepIndex = (stepIndex + 1) % PROGRESS_STEPS.length;
                progressText.textContent = PROGRESS_STEPS[stepIndex];
            }, 1800);
        } else {
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            progressContainer.classList.add('hidden');
            clearInterval(progressInterval);
        }
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
        resultsSection.classList.add('hidden');
    }

    function hideError() {
        errorMsg.classList.add('hidden');
    }

    // Report Handlers
    downloadPdfBtn.addEventListener('click', () => {
        if (!currentAuditId) return;
        window.open(`${API_BASE}/api/audit/${currentAuditId}/report/pdf`, '_blank');
    });

    viewHtmlBtn.addEventListener('click', () => {
        if (!currentAuditId) return;
        window.open(`${API_BASE}/api/audit/${currentAuditId}/report/html`, '_blank');
    });

    // ── Console Tabs ────────────────────────────────────────────────────
    const consoleTabs = document.querySelectorAll('.console-tab-btn');
    const consoleContents = document.querySelectorAll('.console-tab-content');

    consoleTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            consoleTabs.forEach(b => b.classList.remove('active'));
            consoleContents.forEach(c => c.classList.add('hidden'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.remove('hidden');
        });
    });

    // ── Profile Logic ───────────────────────────────────────────────────
    const profileForm = document.getElementById('profile-form');
    const profileMsg = document.getElementById('profile-msg');

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bio = document.getElementById('profile-bio').value;
        const website = document.getElementById('profile-website').value;

        try {
            const res = await fetch(`${API_BASE}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ bio, website })
            });
            if (!res.ok) throw new Error("Failed to update profile");
            
            profileMsg.textContent = "Profile updated successfully!";
            profileMsg.classList.remove('hidden');
            setTimeout(() => profileMsg.classList.add('hidden'), 3000);
        } catch (err) {
            alert(err.message);
        }
    });

    // ── Marketplace Logic ───────────────────────────────────────────────
    const mpForm = document.getElementById('marketplace-upload-form');
    const mpSubmitBtn = document.getElementById('mp-submit-btn');
    const mpUploadResult = document.getElementById('mp-upload-result');
    const mpGrid = document.getElementById('marketplace-grid');

    mpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('mp-title').value;
        const url = document.getElementById('mp-url').value;
        const price = document.getElementById('mp-price').value;

        mpSubmitBtn.disabled = true;
        mpSubmitBtn.querySelector('.btn-text').classList.add('hidden');
        mpSubmitBtn.querySelector('.spinner').classList.remove('hidden');
        mpUploadResult.classList.add('hidden');

        try {
            const res = await fetch(`${API_BASE}/api/marketplace/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ title, url, price: parseFloat(price) })
            });
            const data = await res.json();
            
            mpUploadResult.classList.remove('hidden');
            if (res.ok || res.status === 201) {
                mpUploadResult.innerHTML = `
                    <div style="color: #10b981; margin-bottom: 0.5rem; font-weight: bold;">${data.message}</div>
                    <div>AI Score: <span class="badge" style="background: rgba(16,185,129,0.2); color: #10b981">${data.template.score}/100</span></div>
                `;
                fetchTemplates(); // Refresh storefront
                mpForm.reset();
            } else {
                mpUploadResult.innerHTML = `
                    <div style="color: #ef4444; margin-bottom: 0.5rem; font-weight: bold;">${data.message || data.error}</div>
                    ${data.template ? `<div>AI Score: <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444">${data.template.score}/100</span></div>` : ''}
                `;
            }
        } catch (err) {
            mpUploadResult.classList.remove('hidden');
            mpUploadResult.innerHTML = `<div style="color: #ef4444;">${err.message}</div>`;
        } finally {
            mpSubmitBtn.disabled = false;
            mpSubmitBtn.querySelector('.btn-text').classList.remove('hidden');
            mpSubmitBtn.querySelector('.spinner').classList.add('hidden');
        }
    });

    async function fetchTemplates() {
        try {
            const res = await fetch(`${API_BASE}/api/marketplace/templates`);
            const templates = await res.json();
            
            mpGrid.innerHTML = '';
            if (templates.length === 0) {
                mpGrid.innerHTML = '<p class="text-muted">No templates available yet.</p>';
                return;
            }

            templates.forEach(t => {
                const card = document.createElement('div');
                card.className = 'template-card';
                card.innerHTML = `
                    <div class="template-title">${t.title}</div>
                    <a href="${t.url}" target="_blank" class="template-url">${t.url}</a>
                    <div class="template-meta">
                        <span class="template-score">AI Score: ${t.score}/100</span>
                        <span class="template-price">$${t.price.toFixed(2)}</span>
                    </div>
                `;
                mpGrid.appendChild(card);
            });
        } catch (err) {
            console.error("Failed to fetch templates", err);
        }
    }

    // ── Admin Logic ─────────────────────────────────────────────────────
    const adminUsersList = document.getElementById('admin-users-list');
    document.getElementById('refresh-users-btn').addEventListener('click', fetchUsers);

    async function fetchUsers() {
        if (!jwtToken) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${jwtToken}` }
            });
            if (!res.ok) throw new Error("Failed to fetch users");
            
            const users = await res.json();
            adminUsersList.innerHTML = '';
            
            users.forEach(u => {
                const tr = document.createElement('tr');
                const roleClass = u.role === 'admin' ? 'role-admin' : 'role-user';
                tr.innerHTML = `
                    <td><code>${u.id}</code></td>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td><span class="role-badge ${roleClass}">${u.role}</span></td>
                `;
                adminUsersList.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
        }
    }
});
