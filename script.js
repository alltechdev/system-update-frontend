class UpdateManager {
    constructor() {
        this.updates = {};
        this.latestVersion = '';
        this.devices = [];
        this.jsonHistory = this.loadJsonHistory();
        this.githubSettings = this.loadGitHubSettings();
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupForm();
        this.setupButtons();
        this.setupSettings();
        this.setupDevices();
        this.updateJSON();
        this.renderJsonHistory();
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                
                if (targetTab === 'json') {
                    this.updateJSON();
                } else if (targetTab === 'devices') {
                    this.loadDevices();
                }
            });
        });
    }

    setupForm() {
        const form = document.getElementById('updateForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addUpdate();
        });
    }

    setupButtons() {
        document.getElementById('copyJson').addEventListener('click', () => {
            this.copyJSON();
        });

        document.getElementById('downloadJson').addEventListener('click', () => {
            this.downloadJSON();
        });

        document.getElementById('syncToGitHub').addEventListener('click', () => {
            this.syncToGitHub();
        });
    }


    addUpdate() {
        const version = document.getElementById('version').value;
        const description = document.getElementById('description').value;
        const scriptUrl = document.getElementById('scriptUrl').value;
        const apkUrl = document.getElementById('apkUrl').value;
        const fileSize = document.getElementById('fileSize').value;
        const changelog = document.getElementById('changelog').value;

        if (!version) {
            alert('Version number is required');
            return;
        }

        const update = {
            description: description || `System update v${version}`,
            file_size: fileSize || '1.0MB'
        };

        if (scriptUrl) update.script_url = scriptUrl;
        if (apkUrl) update.apk_url = apkUrl;

        if (changelog) {
            update.changelog = changelog.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
        }

        this.updates[version] = update;
        this.latestVersion = this.getLatestVersion();
        
        this.renderUpdates();
        this.updateJSON();
        document.getElementById('updateForm').reset();
    }

    getLatestVersion() {
        const versions = Object.keys(this.updates);
        if (versions.length === 0) return '';
        
        return versions.sort((a, b) => {
            const aNum = parseFloat(a);
            const bNum = parseFloat(b);
            return bNum - aNum;
        })[0];
    }

    renderUpdates() {
        const container = document.getElementById('updatesList');
        
        if (Object.keys(this.updates).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No updates added yet. Add your first update above!</p>
                </div>
            `;
            return;
        }

        const html = Object.entries(this.updates)
            .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
            .map(([version, update]) => {
                const isLatest = version === this.latestVersion;
                return `
                    <div class="update-item">
                        <div class="update-header">
                            <span class="version-badge ${isLatest ? 'latest' : ''}">
                                v${version} ${isLatest ? '(Latest)' : ''}
                            </span>
                            <button class="delete-btn" onclick="updateManager.deleteUpdate('${version}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                        <div class="update-details">
                            <strong>${update.description}</strong><br>
                            Size: ${update.file_size}
                        </div>
                        <div class="update-urls">
                            ${update.script_url ? '<span class="url-badge">Script</span>' : ''}
                            ${update.apk_url ? '<span class="url-badge apk">APK</span>' : ''}
                        </div>
                        ${update.changelog ? `
                            <div class="changelog-list">
                                <strong>Changelog:</strong>
                                <ul>
                                    ${update.changelog.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');

        container.innerHTML = html;
    }

    deleteUpdate(version) {
        if (confirm(`Are you sure you want to delete version ${version}?`)) {
            delete this.updates[version];
            this.latestVersion = this.getLatestVersion();
            this.renderUpdates();
            this.updateJSON();
        }
    }

    updateJSON() {
        const jsonData = {
            latest_version: this.latestVersion,
            updates: this.updates,
            required_android_version: "21"
        };

        const formatted = JSON.stringify(jsonData, null, 2);
        document.getElementById('jsonOutput').textContent = formatted;
        
        // Save to history
        this.saveToJsonHistory(jsonData);
    }

    loadJsonHistory() {
        const saved = localStorage.getItem('jsonHistory');
        return saved ? JSON.parse(saved) : [];
    }

    saveToJsonHistory(jsonData) {
        const timestamp = new Date().toISOString();
        const historyItem = {
            timestamp,
            data: jsonData,
            id: Date.now()
        };
        
        this.jsonHistory.unshift(historyItem);
        // Keep only last 10 versions
        if (this.jsonHistory.length > 10) {
            this.jsonHistory = this.jsonHistory.slice(0, 10);
        }
        
        localStorage.setItem('jsonHistory', JSON.stringify(this.jsonHistory));
        this.renderJsonHistory();
    }

    renderJsonHistory() {
        const container = document.getElementById('jsonHistory');
        if (!container) return;
        
        if (this.jsonHistory.length === 0) {
            container.innerHTML = '<p>No previous versions</p>';
            return;
        }

        const html = this.jsonHistory.map(item => {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            return `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-time">${timeStr}</span>
                        <span class="history-version">v${item.data.latest_version}</span>
                        <button onclick="updateManager.restoreJson(${item.id})" class="btn-restore">Restore</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    restoreJson(id) {
        const item = this.jsonHistory.find(h => h.id === id);
        if (item && confirm('Restore this version? Current changes will be lost.')) {
            this.updates = item.data.updates;
            this.latestVersion = item.data.latest_version;
            this.renderUpdates();
            this.updateJSON();
        }
    }


    copyJSON() {
        const jsonText = document.getElementById('jsonOutput').textContent;
        navigator.clipboard.writeText(jsonText).then(() => {
            const btn = document.getElementById('copyJson');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.style.background = '#28a745';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '#6c757d';
            }, 2000);
        }).catch(() => {
            alert('Failed to copy to clipboard');
        });
    }

    downloadJSON() {
        const jsonText = document.getElementById('jsonOutput').textContent;
        const blob = new Blob([jsonText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'system_update.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    setupSettings() {
        const settingsForm = document.getElementById('settingsForm');
        const testBtn = document.getElementById('testConnection');
        
        // Load saved settings
        this.loadSettingsToForm();
        
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGitHubSettings();
        });
        
        testBtn.addEventListener('click', () => {
            this.testGitHubConnection();
        });
    }

    loadGitHubSettings() {
        const saved = localStorage.getItem('githubSettings');
        return saved ? JSON.parse(saved) : {
            token: '',
            owner: 'alltechdev',
            repo: 'alltech.dev',
            filePath: 'system_update.json'
        };
    }

    saveGitHubSettings() {
        const settings = {
            token: document.getElementById('githubToken').value,
            owner: document.getElementById('repoOwner').value,
            repo: document.getElementById('repoName').value,
            filePath: document.getElementById('filePath').value
        };

        this.githubSettings = settings;
        localStorage.setItem('githubSettings', JSON.stringify(settings));
        
        this.showStatus('connectionStatus', 'Settings saved successfully!', 'success');
    }

    loadSettingsToForm() {
        document.getElementById('githubToken').value = this.githubSettings.token;
        document.getElementById('repoOwner').value = this.githubSettings.owner;
        document.getElementById('repoName').value = this.githubSettings.repo;
        document.getElementById('filePath').value = this.githubSettings.filePath;
    }

    async testGitHubConnection() {
        console.log('Testing GitHub connection...');
        
        // Get current values from form, not saved settings
        const token = document.getElementById('githubToken').value.trim();
        const owner = document.getElementById('repoOwner').value.trim();
        const repo = document.getElementById('repoName').value.trim();
        
        console.log('Token length:', token.length);
        console.log('Owner:', owner);
        console.log('Repo:', repo);
        
        if (!token) {
            this.showStatus('connectionStatus', 'Please enter a GitHub token first', 'error');
            return;
        }

        if (!owner || !repo) {
            this.showStatus('connectionStatus', 'Please enter repository owner and name', 'error');
            return;
        }

        this.showStatus('connectionStatus', 'Testing connection...', 'loading');

        try {
            const url = `https://api.github.com/repos/${owner}/${repo}`;
            console.log('Testing URL:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'System-Update-Manager'
                }
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (response.ok) {
                const data = await response.json();
                console.log('Repository data:', data.name);
                this.showStatus('connectionStatus', `Connection successful! Found repository: ${data.full_name} ✓`, 'success');
            } else {
                const errorText = await response.text();
                console.log('Error response:', errorText);
                let errorMessage = `HTTP ${response.status}`;
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                
                this.showStatus('connectionStatus', `Connection failed: ${errorMessage}`, 'error');
            }
        } catch (error) {
            console.error('Connection error:', error);
            this.showStatus('connectionStatus', `Connection failed: ${error.message}`, 'error');
        }
    }

    async syncToGitHub() {
        if (!this.githubSettings.token) {
            this.showStatus('syncStatus', 'Please configure GitHub settings first', 'error');
            return;
        }

        this.showStatus('syncStatus', 'Syncing to GitHub...', 'loading');

        try {
            const jsonContent = document.getElementById('jsonOutput').textContent;
            
            // Get current file (if exists) to get SHA
            let sha = null;
            const getResponse = await fetch(`https://api.github.com/repos/${this.githubSettings.owner}/${this.githubSettings.repo}/contents/${this.githubSettings.filePath}`, {
                headers: {
                    'Authorization': `Bearer ${this.githubSettings.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'System-Update-Manager'
                }
            });

            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }

            // Update or create file
            const updateResponse = await fetch(`https://api.github.com/repos/${this.githubSettings.owner}/${this.githubSettings.repo}/contents/${this.githubSettings.filePath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.githubSettings.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'System-Update-Manager'
                },
                body: JSON.stringify({
                    message: `Update system_update.json - ${new Date().toISOString()}`,
                    content: btoa(jsonContent),
                    sha: sha
                })
            });

            if (updateResponse.ok) {
                const result = await updateResponse.json();
                this.showStatus('syncStatus', 'Successfully synced to GitHub! Your Android app will now see the updates.', 'success');
            } else {
                const error = await updateResponse.json();
                this.showStatus('syncStatus', `Sync failed: ${error.message}`, 'error');
            }
        } catch (error) {
            this.showStatus('syncStatus', `Sync failed: ${error.message}`, 'error');
        }
    }

    showStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `${elementId} ${type}`;
        
        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }

    // Demo data for testing
    loadDemo() {
        this.updates = {
            "1.1": {
                "script_url": "https://raw.githubusercontent.com/alltechdev/alltech.dev/main/update_script_v1.sh",
                "description": "Initial system update with security patches",
                "file_size": "1.2MB",
                "changelog": [
                    "Security patches",
                    "Performance improvements",
                    "Bug fixes"
                ]
            },
            "1.2": {
                "script_url": "https://raw.githubusercontent.com/alltechdev/alltech.dev/main/update_script_v2.sh",
                "apk_url": "https://github.com/alltechdev/alltech.dev/releases/download/v1.2/app.apk",
                "description": "Major update with new features",
                "file_size": "2.1MB",
                "changelog": [
                    "New APK installation support",
                    "Improved UI",
                    "Enhanced security",
                    "Better error handling"
                ]
            }
        };
        this.latestVersion = this.getLatestVersion();
        this.renderUpdates();
        this.updateJSON();
    }

    setupDevices() {
        document.getElementById('refreshDevices').addEventListener('click', () => {
            this.loadDevices();
        });
        
        // Load devices initially
        this.loadDevices();
    }

    async loadDevices() {
        const container = document.getElementById('devicesList');
        
        try {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading devices...</p>
                </div>
            `;

            const response = await fetch('http://localhost:8080/devices');
            const data = await response.json();
            
            this.devices = data.devices || [];
            this.renderDevices();
            
        } catch (error) {
            console.error('Error loading devices:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load devices. Make sure the device server is running on port 8080.</p>
                    <button onclick="updateManager.loadDevices()" class="btn-secondary">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    renderDevices() {
        const container = document.getElementById('devicesList');
        
        if (this.devices.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-mobile-alt"></i>
                    <p>No devices registered yet. Install and run the app on a device to see it here!</p>
                </div>
            `;
            return;
        }

        const html = this.devices
            .sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))
            .map(device => {
                const lastSeen = new Date(device.last_seen);
                const timeAgo = this.getTimeAgo(lastSeen);
                const isOnline = (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000; // 5 minutes
                
                return `
                    <div class="device-item">
                        <div class="device-header">
                            <div class="device-info">
                                <span class="device-id">ID: ${device.device_id}</span>
                                <span class="device-status ${isOnline ? 'online' : 'offline'}">
                                    <i class="fas fa-circle"></i> ${isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            <div class="device-time">Last seen: ${timeAgo}</div>
                        </div>
                        <div class="device-details">
                            <div class="device-spec">
                                <i class="fas fa-mobile-alt"></i>
                                <strong>${device.brand} ${device.model}</strong>
                            </div>
                            <div class="device-spec">
                                <i class="fab fa-android"></i>
                                Android ${device.android_version}
                            </div>
                            <div class="device-spec">
                                <i class="fas fa-code-branch"></i>
                                App v${device.app_version}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        container.innerHTML = html;
    }

    getTimeAgo(date) {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
}

// Initialize the application
const updateManager = new UpdateManager();

