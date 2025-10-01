class UpdateManager {
    constructor() {
        this.updates = {};
        this.latestVersion = '';
        this.githubSettings = this.loadGitHubSettings();
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupForm();
        this.setupButtons();
        this.setupPreview();
        this.setupSettings();
        this.updateJSON();
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
                } else if (targetTab === 'preview') {
                    this.updatePreview();
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

    setupPreview() {
        const checkBtn = document.getElementById('previewCheckBtn');
        const updateBtn = document.getElementById('previewUpdateBtn');
        const status = document.getElementById('previewStatus');
        const progress = document.getElementById('previewProgress');

        checkBtn.addEventListener('click', () => {
            if (this.latestVersion) {
                status.textContent = `Update available: v${this.latestVersion}`;
                updateBtn.style.display = 'inline-block';
            } else {
                status.textContent = 'No updates configured yet';
            }
        });

        updateBtn.addEventListener('click', () => {
            progress.style.display = 'block';
            updateBtn.style.display = 'none';
            status.textContent = 'Downloading update...';
            
            setTimeout(() => {
                status.textContent = 'Installing update...';
            }, 1500);
            
            setTimeout(() => {
                status.textContent = 'Update completed successfully!';
                progress.style.display = 'none';
            }, 3000);
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
    }

    updatePreview() {
        const status = document.getElementById('previewStatus');
        const updateBtn = document.getElementById('previewUpdateBtn');
        
        if (this.latestVersion) {
            status.textContent = `Current version: 1.0`;
            updateBtn.style.display = 'none';
        } else {
            status.textContent = 'No updates configured';
            updateBtn.style.display = 'none';
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
        if (!this.githubSettings.token) {
            this.showStatus('connectionStatus', 'Please enter a GitHub token first', 'error');
            return;
        }

        this.showStatus('connectionStatus', 'Testing connection...', 'loading');

        try {
            const response = await fetch(`https://api.github.com/repos/${this.githubSettings.owner}/${this.githubSettings.repo}`, {
                headers: {
                    'Authorization': `token ${this.githubSettings.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                this.showStatus('connectionStatus', 'Connection successful! ✓', 'success');
            } else {
                const error = await response.json();
                this.showStatus('connectionStatus', `Connection failed: ${error.message}`, 'error');
            }
        } catch (error) {
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
                    'Authorization': `token ${this.githubSettings.token}`,
                    'Accept': 'application/vnd.github.v3+json'
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
                    'Authorization': `token ${this.githubSettings.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
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
}

// Initialize the application
const updateManager = new UpdateManager();

// Add demo button for testing
document.addEventListener('DOMContentLoaded', () => {
    // Add demo button to header
    const header = document.querySelector('header');
    const demoBtn = document.createElement('button');
    demoBtn.className = 'btn-secondary';
    demoBtn.innerHTML = '<i class="fas fa-flask"></i> Load Demo Data';
    demoBtn.style.marginTop = '20px';
    demoBtn.onclick = () => updateManager.loadDemo();
    header.appendChild(demoBtn);
});