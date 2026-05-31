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

    // ── Auth Handling ───────────────────────────────────────────────────

    async function updateAuthState() {
        if (api.token) {
            try {
                const userProfile = await api.getUserProfile();

                authSection.classList.add('hidden');
                mainAppContent.classList.remove('hidden');
                logoutBtn.classList.remove('hidden');
                userNameEl.textContent = userProfile.name;
                
                // Admin Tab Logic
                if (userProfile.role === 'admin') {
                    document.getElementById('admin-tab-btn').classList.remove('hidden');
                    fetchUsers();
                    fetchAnalytics();
                } else {
                    document.getElementById('admin-tab-btn').classList.add('hidden');
                }

                // Populate Profile
                document.getElementById('profile-bio').value = userProfile.profile?.bio || '';
                document.getElementById('profile-website').value = userProfile.profile?.website || '';
                
                fetchTemplates(); // Always load marketplace storefront

            } catch (err) {
                console.error(err);
                await api.logout();
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
            await api.login(email, password);
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
            await api.register(name, email, password);
            alert('Registration successful! Please login.');
            authTabBtns[0].click(); // switch to login
        } catch (err) {
            alert(err.message);
        }
    });

    // Forgot Password Logic
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const backToLoginBtns = document.querySelectorAll('.back-to-login');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', () => {
            loginForm.classList.add('hidden');
            forgotPasswordForm.classList.remove('hidden');
        });
    }

    backToLoginBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            forgotPasswordForm.classList.add('hidden');
            resetPasswordForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    });

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = forgotPasswordForm.querySelector('input').value;
            try {
                const res = await api.forgotPassword(email);
                alert(res.message);
                forgotPasswordForm.classList.add('hidden');
                resetPasswordForm.classList.remove('hidden');
            } catch(err) {
                alert(err.message);
            }
        });
    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = resetPasswordForm.querySelectorAll('input')[0].value;
            const newPassword = resetPasswordForm.querySelectorAll('input')[1].value;
            try {
                const res = await api.resetPassword(token, newPassword);
                alert(res.message);
                resetPasswordForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            } catch(err) {
                alert(err.message);
            }
        });
    }

    logoutBtn.addEventListener('click', async () => {
        await api.logout();
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
            const data = await api.checkHealth();

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
            const data = await api.analyzeWebsite(targetUrl, aiToggle.checked);

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
            // Session expired trick
            if (err.message.includes('No token provided') || err.message.includes('Token has expired')) {
                await api.logout();
                updateAuthState();
            }
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
        api.generatePDF(currentAuditId);
    });

    viewHtmlBtn.addEventListener('click', () => {
        if (!currentAuditId) return;
        api.getHTMLReport(currentAuditId);
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
            await api.updateProfile({ bio, website });
            profileMsg.textContent = "Profile updated successfully!";
            profileMsg.classList.remove('hidden');
            setTimeout(() => profileMsg.classList.add('hidden'), 3000);
        } catch (err) {
            alert(err.message);
        }
    });

    const changePasswordForm = document.getElementById('change-password-form');
    const cpMsg = document.getElementById('cp-msg');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldP = document.getElementById('cp-old').value;
            const newP = document.getElementById('cp-new').value;
            try {
                const res = await api.changePassword(oldP, newP);
                cpMsg.textContent = res.message;
                cpMsg.classList.remove('hidden');
                setTimeout(() => cpMsg.classList.add('hidden'), 3000);
                changePasswordForm.reset();
            } catch(err) {
                alert(err.message);
            }
        });
    }

    const deleteAccountForm = document.getElementById('delete-account-form');
    if (deleteAccountForm) {
        deleteAccountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const delP = document.getElementById('del-password').value;
            if(confirm("Are you absolutely sure? This cannot be undone.")) {
                try {
                    const res = await api.deleteAccount(delP);
                    alert(res.message);
                    await api.logout();
                    updateAuthState();
                } catch(err) {
                    alert(err.message);
                }
            }
        });
    }

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
        const fileInput = document.getElementById('mp-file');
        const file = fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null;

        mpSubmitBtn.disabled = true;
        mpSubmitBtn.querySelector('.btn-text').classList.add('hidden');
        mpSubmitBtn.querySelector('.spinner').classList.remove('hidden');
        mpUploadResult.classList.add('hidden');

        try {
            const data = await api.uploadTemplate(title, url, parseFloat(price), file);
            
            mpUploadResult.classList.remove('hidden');
            mpUploadResult.innerHTML = `
                <div style="color: #10b981; margin-bottom: 0.5rem; font-weight: bold;">${data.message || 'Template uploaded'}</div>
                <div>AI Score: <span class="badge" style="background: rgba(16,185,129,0.2); color: #10b981">${data.template.score}/100</span></div>
            `;
            fetchTemplates(); // Refresh storefront
            mpForm.reset();
        } catch (err) {
            mpUploadResult.classList.remove('hidden');
            mpUploadResult.innerHTML = `<div style="color: #ef4444;">${err.message}</div>`;
        } finally {
            mpSubmitBtn.disabled = false;
            mpSubmitBtn.querySelector('.btn-text').classList.remove('hidden');
            mpSubmitBtn.querySelector('.spinner').classList.add('hidden');
        }
    });

    const mpSearchInput = document.getElementById('mp-search-input');
    if (mpSearchInput) {
        mpSearchInput.addEventListener('input', (e) => {
            fetchTemplates(e.target.value);
        });
    }

    async function fetchTemplates(searchQuery = '') {
        try {
            const templates = await api.getTemplates(searchQuery);
            
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
                    ${t.filePath ? `<a href="${API_BASE_URL}/api/marketplace/templates/${t.id}/download" class="action-btn" style="display: inline-block; margin-top: 1rem; text-decoration: none; text-align: center; width: 100%; box-sizing: border-box;" download>Download Template</a>` : ''}
                `;
                mpGrid.appendChild(card);
            });
        } catch (err) {
            console.error("Failed to fetch templates", err);
        }
    }

    // ── Admin Logic ─────────────────────────────────────────────────────
    const adminUsersList = document.getElementById('admin-users-list');
    document.getElementById('refresh-users-btn').addEventListener('click', () => {
        fetchUsers();
        fetchAnalytics();
    });

    async function fetchAnalytics() {
        if (!api.token) return;
        try {
            const data = await api.getAdminAnalytics();
            document.getElementById('admin-stat-users').textContent = data.totalUsers;
            document.getElementById('admin-stat-audits').textContent = data.totalAudits;
            document.getElementById('admin-stat-templates').textContent = data.totalTemplates;
        } catch (err) {
            console.error("Failed to fetch analytics", err);
        }
    }

    async function fetchUsers() {
        if (!api.token) return;
        try {
            const users = await api.getAdminUsers();
            adminUsersList.innerHTML = '';
            
            users.forEach(u => {
                const tr = document.createElement('tr');
                const roleClass = u.role === 'admin' ? 'role-admin' : 'role-user';
                const statusClass = u.isActive !== false ? 'status-active' : 'status-blocked';
                const statusText = u.isActive !== false ? 'Active' : 'Blocked';
                const blockActionText = u.isActive !== false ? 'Block' : 'Unblock';

                tr.innerHTML = `
                    <td><code>${u.id}</code></td>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td><span class="role-badge ${roleClass}">${u.role}</span></td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="action-btn block-btn" data-id="${u.id}">${blockActionText}</button>
                        <button class="action-btn delete-btn" style="color: #ef4444; border-color: #ef4444;" data-id="${u.id}">Delete</button>
                    </td>
                `;
                adminUsersList.appendChild(tr);
            });

            // Add event listeners for new buttons
            document.querySelectorAll('.block-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    try {
                        await api.toggleBlockUser(id);
                        fetchUsers(); // refresh
                    } catch (err) {
                        alert(err.message);
                    }
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    if (confirm('Are you sure you want to delete this user permanently?')) {
                        try {
                            await api.deleteUser(id);
                            fetchUsers(); // refresh
                        } catch (err) {
                            alert(err.message);
                        }
                    }
                });
            });

        } catch (err) {
            console.error(err);
        }
    }
});
