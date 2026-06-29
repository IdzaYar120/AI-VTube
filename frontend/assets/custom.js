/**
 * AI VTuber Premium Client Custom Interactions
 * Handles dynamic background changing, character switching, real-time config updates,
 * local audio muting, and the advanced settings side drawer UI.
 */

// 1. Intercept WebSocket connection to communicate with the backend
const OriginalWebSocket = window.WebSocket;
window.activeWS = null;
window.micMuted = localStorage.getItem('mic_muted') === 'true';

window.WebSocket = function (url, protocols) {
  const wsInstance = new OriginalWebSocket(url, protocols);
  window.activeWS = wsInstance;

  // Intercept socket send method to support client-side mute
  const originalSend = wsInstance.send;
  wsInstance.send = function (data) {
    if (window.micMuted) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'mic-audio-data' || parsed.type === 'mic-audio-end') {
          // Drop mic audio chunks if muted
          return;
        }
      } catch (e) {}
    }
    return originalSend.apply(this, arguments);
  };

  wsInstance.addEventListener('open', () => {
    console.log('Premium UI: WebSocket connection intercepted');
    // Fetch configs after socket opens
    setTimeout(() => {
      if (wsInstance.readyState === OriginalWebSocket.OPEN) {
        wsInstance.send(JSON.stringify({ type: 'fetch-configs' }));
      }
    }, 1000);
  });

  wsInstance.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'config-files') {
        const customEvent = new CustomEvent('premium-configs-loaded', { detail: data.configs });
        window.dispatchEvent(customEvent);
      } else if (data.type === 'current-settings') {
        const customEvent = new CustomEvent('premium-settings-loaded', { detail: data.settings });
        window.dispatchEvent(customEvent);
      } else if (data.type === 'settings-updated') {
        const customEvent = new CustomEvent('premium-settings-updated', { detail: data });
        window.dispatchEvent(customEvent);
      } else if (data.type === 'error') {
        const customEvent = new CustomEvent('premium-error-occurred', { detail: data.message });
        window.dispatchEvent(customEvent);
      }
    } catch (e) {}
  });

  return wsInstance;
};

// Notification Helper
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.custom-notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = `custom-notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    bottom: 25px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: rgba(12, 12, 18, 0.88);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid ${type === 'success' ? 'rgba(0, 255, 204, 0.6)' : type === 'error' ? 'rgba(255, 59, 48, 0.6)' : 'rgba(155, 93, 229, 0.6)'};
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px ${type === 'success' ? 'rgba(0, 255, 204, 0.15)' : type === 'error' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(155, 93, 229, 0.15)'};
    color: #ffffff;
    padding: 10px 22px;
    border-radius: 30px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    z-index: 100002;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  let icon = '';
  if (type === 'success') {
    icon = '<span style="color: #00ffcc;">●</span> ';
  } else if (type === 'error') {
    icon = '<span style="color: #ff3b30;">●</span> ';
  } else {
    icon = '<span style="color: #9b5de5;">●</span> ';
  }

  notification.innerHTML = icon + message;
  document.body.appendChild(notification);

  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(-50%) translateY(0)';
    notification.style.opacity = '1';
  });

  setTimeout(() => {
    notification.style.transform = 'translateX(-50%) translateY(100px)';
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  // 2. Initialize Background from localStorage
  const savedBg = localStorage.getItem('selected_bg');
  if (savedBg) {
    document.documentElement.style.setProperty('--bg-image', `url('/bg/${savedBg}')`);
  }

  // 3. Initialize Premium Controls
  initPremiumControls();
});

async function initPremiumControls() {
  // Build and inject Advanced Settings Drawer in the DOM
  const drawer = document.createElement('div');
  drawer.id = 'premium-settings-drawer';
  drawer.innerHTML = `
    <div class="drawer-header">
      <h2>Advanced Settings</h2>
      <button id="close-drawer-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="drawer-body">
      <!-- Section: Character Configuration -->
      <div class="settings-section">
        <label class="settings-label">Active Character</label>
        <div class="select-wrapper">
          <select id="setting-character" class="settings-select"></select>
        </div>
      </div>

      <!-- Section: Display Name -->
      <div class="settings-section">
        <label class="settings-label">Character Name</label>
        <input type="text" id="setting-character-name" class="settings-input" placeholder="Enter display name">
      </div>

      <!-- Section: Voice (Edge-TTS) -->
      <div class="settings-section">
        <label class="settings-label">Voice (Edge-TTS)</label>
        <div class="select-wrapper">
          <select id="setting-voice" class="settings-select">
            <option value="en-US-AvaMultilingualNeural">English - Ava (Female)</option>
            <option value="en-US-AndrewNeural">English - Andrew (Male)</option>
            <option value="en-US-EmmaNeural">English - Emma (Female)</option>
            <option value="en-US-BrianNeural">English - Brian (Male)</option>
            <option value="uk-UA-PolinaNeural">Ukrainian - Polina (Female)</option>
            <option value="uk-UA-OstapNeural">Ukrainian - Ostap (Male)</option>
            <option value="ja-JP-NanamiNeural">Japanese - Nanami (Female)</option>
            <option value="ja-JP-KeitaNeural">Japanese - Keita (Male)</option>
            <option value="zh-CN-XiaoxiaoNeural">Chinese - Xiaoxiao (Female)</option>
            <option value="zh-CN-YunxiNeural">Chinese - Yunxi (Male)</option>
            <option value="es-ES-ElviraNeural">Spanish - Elvira (Female)</option>
            <option value="es-ES-AlvaroNeural">Spanish - Alvaro (Male)</option>
          </select>
        </div>
      </div>

      <!-- Section: Virtual Background -->
      <div class="settings-section">
        <label class="settings-label">Virtual Background</label>
        <div class="select-wrapper">
          <select id="setting-background" class="settings-select"></select>
        </div>
      </div>

      <!-- Section: Live2D Expressions -->
      <div class="settings-section">
        <label class="settings-label">Live2D Expressions</label>
        <div id="expression-buttons-grid" class="expression-grid"></div>
      </div>

      <!-- Section: System Prompt (Persona) -->
      <div class="settings-section flex-fill">
        <label class="settings-label">System Persona Prompt</label>
        <textarea id="setting-persona" class="settings-textarea" placeholder="Describe the character personality, behavior rules, traits..."></textarea>
      </div>
    </div>
    <div class="drawer-footer">
      <button id="save-settings-btn" class="drawer-action-btn primary-btn">Apply Settings</button>
      <button id="clear-history-btn" class="drawer-action-btn danger-btn">Clear Conversation</button>
    </div>
  `;
  document.body.appendChild(drawer);

  // References to drawer controls
  const charSelect = document.getElementById('setting-character');
  const bgSelect = document.getElementById('setting-background');
  const nameInput = document.getElementById('setting-character-name');
  const voiceSelect = document.getElementById('setting-voice');
  const personaTextarea = document.getElementById('setting-persona');
  const saveBtn = document.getElementById('save-settings-btn');
  const clearBtn = document.getElementById('clear-history-btn');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');

  // Create Main Control Panel (Top-Right Floating Bar)
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'premium-ui-controls';

  // 1. Toggle Chat Column Button
  const toggleChatBtn = document.createElement('button');
  toggleChatBtn.className = 'premium-btn';
  toggleChatBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <span>Chat Panel</span>
  `;

  // 2. Toggle Mic (Mute) Button
  const toggleMicBtn = document.createElement('button');
  toggleMicBtn.className = 'premium-btn mic-btn';
  
  function updateMicButtonUI() {
    if (window.micMuted) {
      toggleMicBtn.classList.add('muted');
      toggleMicBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ff3b30;">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
        <span style="color: #ff3b30;">Muted</span>
      `;
    } else {
      toggleMicBtn.classList.remove('muted');
      toggleMicBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #00ffcc;">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
        <span style="color: #00ffcc;">Listening</span>
      `;
    }
  }
  updateMicButtonUI();

  // 3. Open Settings Drawer Button (Gear)
  const openSettingsBtn = document.createElement('button');
  openSettingsBtn.className = 'premium-btn';
  openSettingsBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
    <span>Settings</span>
  `;

  controlsContainer.appendChild(toggleChatBtn);
  controlsContainer.appendChild(toggleMicBtn);
  controlsContainer.appendChild(openSettingsBtn);
  document.body.appendChild(controlsContainer);

  // Fetch backgrounds from API and populate select dropdown
  try {
    const response = await fetch('/backgrounds/info');
    if (response.ok) {
      const data = await response.json();
      const bgs = data.backgrounds || [];
      
      bgs.forEach(bg => {
        const option = document.createElement('option');
        option.value = bg;
        option.textContent = bg.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
        bgSelect.appendChild(option);
      });

      const savedBg = localStorage.getItem('selected_bg');
      if (savedBg) {
        bgSelect.value = savedBg;
      }
    }
  } catch (error) {
    console.error('Error fetching backgrounds:', error);
  }

  // Populate characters dropdown on data load
  window.addEventListener('premium-configs-loaded', (e) => {
    const configs = e.detail || [];
    charSelect.innerHTML = ''; // Reset

    // Default configuration option
    const defOption = document.createElement('option');
    defOption.value = 'conf.yaml';
    defOption.textContent = 'Default Configuration (conf.yaml)';
    charSelect.appendChild(defOption);

    configs.forEach(config => {
      const option = document.createElement('option');
      option.value = config.filename;
      option.textContent = config.name;
      charSelect.appendChild(option);
    });
  });

  // Populate advanced settings input fields
  window.addEventListener('premium-settings-loaded', (e) => {
    const settings = e.detail || {};
    nameInput.value = settings.character_name || '';
    personaTextarea.value = settings.persona_prompt || '';
    if (settings.edge_tts_voice) {
      voiceSelect.value = settings.edge_tts_voice;
    }

    // Populate Live2D expressions grid
    const exprGrid = document.getElementById('expression-buttons-grid');
    exprGrid.innerHTML = '';
    if (settings.emo_map && Object.keys(settings.emo_map).length > 0) {
      Object.keys(settings.emo_map).forEach(emoName => {
        const emoValue = settings.emo_map[emoName];
        const btn = document.createElement('button');
        btn.className = 'drawer-action-btn expression-btn';
        btn.textContent = emoName.charAt(0).toUpperCase() + emoName.slice(1);
        btn.title = `Trigger ${emoName} (value: ${emoValue})`;
        btn.addEventListener('click', () => {
          if (window.activeWS && window.activeWS.readyState === OriginalWebSocket.OPEN) {
            window.activeWS.send(JSON.stringify({
              type: 'trigger-expression',
              expression: emoValue
            }));
            showNotification(`Triggered ${emoName} expression`, 'success');
          }
        });
        exprGrid.appendChild(btn);
      });
    } else {
      exprGrid.innerHTML = '<span style="font-size: 12px; color: #a5a5b5; font-style: italic;">No expressions mapped for this model</span>';
    }
  });

  // Sync controls UI when switching character configuration
  charSelect.addEventListener('change', () => {
    if (window.activeWS && window.activeWS.readyState === OriginalWebSocket.OPEN) {
      window.activeWS.send(
        JSON.stringify({
          type: 'switch-config',
          file: charSelect.value
        })
      );
      showNotification('Loading character model...', 'info');
      // Delay fetching updated parameters to allow config reload complete
      setTimeout(() => {
        if (window.activeWS && window.activeWS.readyState === OriginalWebSocket.OPEN) {
          window.activeWS.send(JSON.stringify({ type: 'fetch-current-settings' }));
        }
      }, 1000);
    }
  });

  // Handle virtual background select change
  bgSelect.addEventListener('change', () => {
    const bg = bgSelect.value;
    document.documentElement.style.setProperty('--bg-image', `url('/bg/${bg}')`);
    localStorage.setItem('selected_bg', bg);
    showNotification('Background updated', 'success');
  });

  // Handle Save settings
  saveBtn.addEventListener('click', () => {
    if (window.activeWS && window.activeWS.readyState === OriginalWebSocket.OPEN) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Applying...';

      // Send setting updates in sequence
      window.activeWS.send(JSON.stringify({
        type: 'update-setting',
        key: 'character_name',
        value: nameInput.value.trim()
      }));

      window.activeWS.send(JSON.stringify({
        type: 'update-setting',
        key: 'edge_tts_voice',
        value: voiceSelect.value
      }));

      // Force change active TTS model to edge_tts when saving from drawer voice setting
      window.activeWS.send(JSON.stringify({
        type: 'update-setting',
        key: 'tts_model',
        value: 'edge_tts'
      }));

      window.activeWS.send(JSON.stringify({
        type: 'update-setting',
        key: 'persona_prompt',
        value: personaTextarea.value
      }));

      setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Apply Settings';
        drawer.classList.remove('open');
      }, 1200);
    } else {
      showNotification('WebSocket not connected', 'error');
    }
  });

  // Handle Clear Conversation
  clearBtn.addEventListener('click', () => {
    if (window.activeWS && window.activeWS.readyState === OriginalWebSocket.OPEN) {
      if (confirm('Are you sure you want to clear the conversation memory? The character will forget recent messages.')) {
        window.activeWS.send(JSON.stringify({ type: 'create-new-history' }));
        showNotification('Conversation memory reset!', 'success');
        drawer.classList.remove('open');
      }
    }
  });

  // Handle mic toggle mute
  toggleMicBtn.addEventListener('click', () => {
    window.micMuted = !window.micMuted;
    localStorage.setItem('mic_muted', window.micMuted);
    updateMicButtonUI();
    
    if (window.micMuted) {
      showNotification('Microphone muted', 'info');
    } else {
      showNotification('Microphone listening', 'success');
    }
  });

  // Control panel events
  toggleChatBtn.addEventListener('click', () => {
    const isHidden = document.body.classList.toggle('chat-hidden');
    localStorage.setItem('chat_hidden', isHidden);
  });

  const isChatHidden = localStorage.getItem('chat_hidden') === 'true';
  if (isChatHidden) {
    document.body.classList.add('chat-hidden');
  }

  // Open and close drawer
  openSettingsBtn.addEventListener('click', () => {
    drawer.classList.add('open');
    if (window.activeWS && window.activeWS.readyState === OriginalWebSocket.OPEN) {
      window.activeWS.send(JSON.stringify({ type: 'fetch-current-settings' }));
    }
  });

  closeDrawerBtn.addEventListener('click', () => {
    drawer.classList.remove('open');
  });

  // Close drawer on clicking outside
  document.addEventListener('click', (e) => {
    if (drawer.classList.contains('open') && !drawer.contains(e.target) && !openSettingsBtn.contains(e.target)) {
      drawer.classList.remove('open');
    }
  });
}
