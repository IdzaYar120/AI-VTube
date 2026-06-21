/**
 * AI VTuber Premium Client Custom Interactions
 * Handles dynamic background changing and UI layout toggling.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Background from localStorage
  const savedBg = localStorage.getItem('selected_bg');
  if (savedBg) {
    document.documentElement.style.setProperty('--bg-image', `url('/bg/${savedBg}')`);
  }

  // 2. Fetch and create Background Switcher & Chat Toggle UI
  initPremiumControls();
});

async function initPremiumControls() {
  // Create container for premium controls
  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'premium-ui-controls';
  controlsContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    gap: 12px;
    align-items: center;
    background: rgba(18, 18, 28, 0.45);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(155, 93, 229, 0.4);
    padding: 8px 14px;
    border-radius: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(155, 93, 229, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  // Create Chat Toggle Button
  const toggleChatBtn = document.createElement('button');
  toggleChatBtn.className = 'premium-btn';
  toggleChatBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <span>Toggle Chat</span>
  `;

  // Create Background Select Dropdown
  const bgDropdownContainer = document.createElement('div');
  bgDropdownContainer.style.position = 'relative';

  const selectBgBtn = document.createElement('button');
  selectBgBtn.className = 'premium-btn';
  selectBgBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
    <span>Backgrounds</span>
  `;

  const dropdownMenu = document.createElement('div');
  dropdownMenu.id = 'premium-bg-dropdown';
  dropdownMenu.style.cssText = `
    display: none;
    position: absolute;
    top: 45px;
    right: 0;
    width: 200px;
    max-height: 250px;
    overflow-y: auto;
    background: rgba(12, 12, 18, 0.92);
    border: 1px solid rgba(155, 93, 229, 0.4);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    padding: 6px;
    z-index: 10000;
  `;

  bgDropdownContainer.appendChild(selectBgBtn);
  bgDropdownContainer.appendChild(dropdownMenu);

  controlsContainer.appendChild(toggleChatBtn);
  controlsContainer.appendChild(bgDropdownContainer);
  document.body.appendChild(controlsContainer);

  // Load styling for premium buttons
  const style = document.createElement('style');
  style.textContent = `
    .premium-btn {
      background: transparent;
      border: none;
      color: #e2e2e9;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 20px;
      transition: all 0.25s ease;
    }
    .premium-btn:hover {
      background: rgba(155, 93, 229, 0.25);
      color: #ffffff;
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
    }
    .premium-bg-item {
      padding: 8px 12px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: #c7c7d2;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .premium-bg-item:hover {
      background: rgba(155, 93, 229, 0.3);
      color: #ffffff;
    }
    #premium-bg-dropdown::-webkit-scrollbar {
      width: 4px;
    }
    #premium-bg-dropdown::-webkit-scrollbar-thumb {
      background: rgba(155, 93, 229, 0.4);
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);

  // Fetch backgrounds from our new API endpoint
  try {
    const response = await fetch('/backgrounds/info');
    if (response.ok) {
      const data = await response.json();
      const bgs = data.backgrounds || [];
      
      bgs.forEach(bg => {
        const item = document.createElement('div');
        item.className = 'premium-bg-item';
        // Remove file extension for nice display name
        const displayName = bg.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
        item.textContent = displayName;
        item.title = bg;
        item.addEventListener('click', () => {
          document.documentElement.style.setProperty('--bg-image', `url('/bg/${bg}')`);
          localStorage.setItem('selected_bg', bg);
          dropdownMenu.style.display = 'none';
        });
        dropdownMenu.appendChild(item);
      });

      if (bgs.length === 0) {
        const noItem = document.createElement('div');
        noItem.className = 'premium-bg-item';
        noItem.textContent = 'No backgrounds found';
        dropdownMenu.appendChild(noItem);
      }
    }
  } catch (error) {
    console.error('Error fetching backgrounds:', error);
  }

  // Dropdown visibility handlers
  selectBgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', () => {
    dropdownMenu.style.display = 'none';
  });

  // Chat column toggle logic
  toggleChatBtn.addEventListener('click', () => {
    const isHidden = document.body.classList.toggle('chat-hidden');
    localStorage.setItem('chat_hidden', isHidden);
  });

  // Restore chat hidden state from localStorage
  const isChatHidden = localStorage.getItem('chat_hidden') === 'true';
  if (isChatHidden) {
    document.body.classList.add('chat-hidden');
  }
}
