// WhatsApp Dark Mode Chat Engine

(function() {
  const messagesContainer = document.getElementById('messagesContainer');
  const stickyDateBadge = document.getElementById('stickyDateBadge');
  const scrollBottomBtn = document.getElementById('scrollBottomBtn');
  const searchBar = document.getElementById('searchBar');
  const searchInput = document.getElementById('searchInput');
  const searchCount = document.getElementById('searchCount');
  const openSearchBtn = document.getElementById('openSearchBtn');
  const closeSearchBtn = document.getElementById('closeSearchBtn');
  const prevSearchBtn = document.getElementById('prevSearchBtn');
  const nextSearchBtn = document.getElementById('nextSearchBtn');
  const datePickerBtn = document.getElementById('datePickerBtn');
  const dateModal = document.getElementById('dateModal');
  const closeDateModal = document.getElementById('closeDateModal');
  const dateList = document.getElementById('dateList');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeLabel');
  const viewModeToggleBtn = document.getElementById('viewModeToggleBtn');
  const viewModeLabel = document.getElementById('viewModeLabel');
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const menuDropdown = document.getElementById('menuDropdown');
  const jumpToStartItem = document.getElementById('jumpToStartItem');
  const jumpToEndItem = document.getElementById('jumpToEndItem');
  const openDateModalItem = document.getElementById('openDateModalItem');
  const toggleDoodleItem = document.getElementById('toggleDoodleItem');
  const exportChatSummaryItem = document.getElementById('exportChatSummaryItem');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const micIcon = document.getElementById('micIcon');
  const sendIcon = document.getElementById('sendIcon');
  const toastMsg = document.getElementById('toastMsg');
  const notchTime = document.getElementById('notchTime');
  const videoCallBtn = document.getElementById('videoCallBtn');
  const audioCallBtn = document.getElementById('audioCallBtn');

  // Audio Context for authentic WhatsApp click/send sound
  let audioCtx = null;
  function playSendSound() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch(e) {}
  }

  // Live time in phone notch
  function updateNotchClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const formatted = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
    if (notchTime) notchTime.textContent = formatted;
  }
  updateNotchClock();
  setInterval(updateNotchClock, 30000);

  // Blue double-tick SVG
  const doubleTickSvg = `
    <span class="msg-ticks" title="Read">
      <svg viewBox="0 0 16 11" fill="currentColor">
        <path d="M11.07 0.93a.75.75 0 0 0-1.06 0L5.3 5.64l-1.8-1.8a.75.75 0 1 0-1.06 1.06l2.33 2.33a.75.75 0 0 0 1.06 0l5.24-5.24a.75.75 0 0 0 0-1.06zm3.5 0a.75.75 0 0 0-1.06 0L8.8 5.64l.65.65 4.06-4.06a.75.75 0 0 0 0-1.06l1.06-1.06a.75.75 0 0 0 0 1.06l-4.72 4.72.65.65 4.07-4.07a.75.75 0 0 0 0-1.06z"/>
      </svg>
    </span>`;

  // Format date helper: "08/08/2026" -> "8 AUGUST 2026"
  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  function formatDateBadge(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parts[2];
      return `${day} ${monthNames[month] || ''} ${year}`;
    }
    return dateStr;
  }

  // Toast notification
  let toastTimer = null;
  function showToast(text) {
    if (!toastMsg) return;
    toastMsg.textContent = text;
    toastMsg.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMsg.classList.remove('show');
    }, 2500);
  }

  // Escape HTML helper
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Render Link Previews
  function renderLinkCard(url) {
    let domain = '';
    let title = 'Link';
    let isVideo = false;

    try {
      const parsed = new URL(url);
      domain = parsed.hostname.replace('www.', '');
      if (domain.includes('youtube') || domain.includes('youtu.be')) {
        title = 'YouTube Video';
        isVideo = true;
      } else if (domain.includes('instagram')) {
        title = 'Instagram Reel';
      } else if (domain.includes('swiggy')) {
        title = 'Swiggy Buzz Streak';
      } else {
        title = domain;
      }
    } catch(e) {
      domain = url;
    }

    return `
      <div class="link-card" onclick="window.open('${url}', '_blank')">
        <div class="link-card-header">
          ${isVideo ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' : '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>'}
        </div>
        <div class="link-card-body">
          <div class="link-card-title">${escapeHtml(title)}</div>
          <div class="link-card-url">${escapeHtml(url)}</div>
        </div>
      </div>
    `;
  }

  // All messages dataset
  const messages = window.CHAT_MESSAGES || [];
  const totalCount = messages.length;

  // Group by date & build DOM
  let currentDate = null;
  const dateElementsMap = {}; // dateStr -> divider element
  const fragment = document.createDocumentFragment();

  messages.forEach((msg, idx) => {
    // 1. Check Date divider
    if (msg.date !== currentDate) {
      currentDate = msg.date;
      const dateDivider = document.createElement('div');
      dateDivider.className = 'date-divider';
      dateDivider.setAttribute('data-date', currentDate);
      dateDivider.innerHTML = `<span class="date-pill">${formatDateBadge(currentDate)}</span>`;
      fragment.appendChild(dateDivider);
      dateElementsMap[currentDate] = dateDivider;
    }

    // 2. System notice (e.g. End-to-end encryption)
    if (msg.type === 'system') {
      const noticeRow = document.createElement('div');
      noticeRow.className = 'system-notice-card';
      noticeRow.innerHTML = `
        <div class="system-notice-inner">
          <svg width="15" height="15" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          <span>Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. <a href="https://www.whatsapp.com/security" target="_blank" rel="noopener">Learn more</a></span>
        </div>
      `;
      fragment.appendChild(noticeRow);
      return;
    }

    // 3. Regular chat message
    const prevMsg = messages[idx - 1];
    const isFirstInBurst = !prevMsg || prevMsg.sender !== msg.sender || prevMsg.date !== msg.date;

    const row = document.createElement('div');
    row.className = `msg-row ${msg.isMe ? 'outgoing' : 'incoming'} ${isFirstInBurst ? 'has-tail' : ''}`;
    row.id = `msg-${msg.id}`;
    row.setAttribute('data-id', msg.id);
    row.setAttribute('data-sender', msg.sender);
    row.setAttribute('data-date', msg.date);

    let contentHtml = '';

    // Handle Media Omitted
    if (msg.isMedia) {
      contentHtml = `
        <div class="media-card">
          <div class="media-preview-box">
            <div class="media-icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            </div>
            <span class="media-label-text">Photo / Media</span>
          </div>
        </div>
      `;
    } 
    // Handle Deleted Message
    else if (msg.isDeleted) {
      contentHtml = `
        <div class="msg-deleted">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/></svg>
          <span>${msg.isMe ? 'You deleted this message' : 'This message was deleted'}</span>
        </div>
      `;
    } 
    // Handle Regular Text with URLs
    else {
      let textWithLinks = escapeHtml(msg.text);
      if (msg.urls && msg.urls.length > 0) {
        msg.urls.forEach(url => {
          contentHtml += renderLinkCard(url);
          const linkTag = `<a href="${url}" target="_blank" rel="noopener" style="color:var(--link-color);text-decoration:underline;">${escapeHtml(url)}</a>`;
          textWithLinks = textWithLinks.replace(escapeHtml(url), linkTag);
        });
      }
      textWithLinks = textWithLinks.replace(/\n/g, '<br>');
      contentHtml += `<span>${textWithLinks}</span>`;
    }

    // Meta elements: edited badge + time + ticks
    const editedHtml = msg.isEdited ? `<span class="edited-badge">Edited</span>` : '';
    const ticksHtml = msg.isMe ? doubleTickSvg : '';

    const metaHtml = `
      <div class="msg-meta">
        ${editedHtml}
        <span class="msg-time">${msg.time}</span>
        ${ticksHtml}
      </div>
    `;

    const bubbleClass = msg.isEmojiOnly ? 'msg-bubble emoji-only' : 'msg-bubble';

    row.innerHTML = `
      <div class="${bubbleClass}">
        ${contentHtml}
        ${metaHtml}
      </div>
    `;

    fragment.appendChild(row);
  });

  messagesContainer.appendChild(fragment);

  // Scroll to latest message initially
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 100);

  // Floating sticky date badge observer
  let scrollTimeout = null;
  messagesContainer.addEventListener('scroll', () => {
    // Show scroll to bottom button if user scrolled up
    const distFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    if (distFromBottom > 350) {
      scrollBottomBtn.classList.add('visible');
    } else {
      scrollBottomBtn.classList.remove('visible');
    }

    // Determine current visible date
    stickyDateBadge.classList.add('visible');
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      stickyDateBadge.classList.remove('visible');
    }, 1200);

    // Find date divider currently in view
    const dividers = messagesContainer.querySelectorAll('.date-divider');
    const containerTop = messagesContainer.getBoundingClientRect().top;
    let activeDate = null;

    for (let i = 0; i < dividers.length; i++) {
      const rect = dividers[i].getBoundingClientRect();
      if (rect.top - containerTop <= 60) {
        activeDate = dividers[i].getAttribute('data-date');
      } else {
        break;
      }
    }
    if (activeDate) {
      stickyDateBadge.textContent = formatDateBadge(activeDate);
    }
  });

  // Scroll to bottom click
  scrollBottomBtn.addEventListener('click', () => {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  });

  // Search In Chat Functionality
  let searchResults = [];
  let currentSearchIdx = -1;

  function performSearch(query) {
    // Clear previous highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });

    searchResults = [];
    currentSearchIdx = -1;

    if (!query || query.trim() === '') {
      searchCount.textContent = '0/0';
      return;
    }

    const term = query.toLowerCase();
    const rows = messagesContainer.querySelectorAll('.msg-row');

    rows.forEach(row => {
      const id = row.getAttribute('data-id');
      const msgObj = messages.find(m => m.id == id);
      if (msgObj && msgObj.text && msgObj.text.toLowerCase().includes(term)) {
        searchResults.push(row);
      }
    });

    if (searchResults.length > 0) {
      currentSearchIdx = 0;
      updateSearchPosition();
    } else {
      searchCount.textContent = '0/0';
    }
  }

  function updateSearchPosition() {
    if (searchResults.length === 0) return;
    searchCount.textContent = `${currentSearchIdx + 1}/${searchResults.length}`;

    // Remove active highlight from all
    document.querySelectorAll('.search-highlight.current').forEach(el => el.classList.remove('current'));

    const targetRow = searchResults[currentSearchIdx];
    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight text in targetRow
    const bubble = targetRow.querySelector('.msg-bubble');
    if (bubble) {
      bubble.style.transition = 'outline 0.2s';
      bubble.style.outline = '2px solid #53bdeb';
      setTimeout(() => {
        bubble.style.outline = 'none';
      }, 1500);
    }
  }

  openSearchBtn.addEventListener('click', () => {
    searchBar.classList.add('active');
    searchInput.focus();
  });

  closeSearchBtn.addEventListener('click', () => {
    searchBar.classList.remove('active');
    searchInput.value = '';
    performSearch('');
  });

  searchInput.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });

  nextSearchBtn.addEventListener('click', () => {
    if (searchResults.length === 0) return;
    currentSearchIdx = (currentSearchIdx + 1) % searchResults.length;
    updateSearchPosition();
  });

  prevSearchBtn.addEventListener('click', () => {
    if (searchResults.length === 0) return;
    currentSearchIdx = (currentSearchIdx - 1 + searchResults.length) % searchResults.length;
    updateSearchPosition();
  });

  // Date Picker Modal
  function populateDateModal() {
    dateList.innerHTML = '';
    // Collect dates with counts
    const dateCounts = {};
    messages.forEach(m => {
      dateCounts[m.date] = (dateCounts[m.date] || 0) + 1;
    });

    Object.keys(dateCounts).forEach(dateStr => {
      const btn = document.createElement('div');
      btn.className = 'date-item-btn';
      btn.innerHTML = `
        <span><strong>${formatDateBadge(dateStr)}</strong> (${dateStr})</span>
        <span class="date-item-count">${dateCounts[dateStr]} msgs</span>
      `;
      btn.addEventListener('click', () => {
        dateModal.classList.remove('active');
        const targetDivider = dateElementsMap[dateStr];
        if (targetDivider) {
          targetDivider.scrollIntoView({ behavior: 'smooth', block: 'start' });
          showToast(`Jumped to ${dateStr}`);
        }
      });
      dateList.appendChild(btn);
    });
  }

  datePickerBtn.addEventListener('click', () => {
    populateDateModal();
    dateModal.classList.add('active');
  });

  closeDateModal.addEventListener('click', () => {
    dateModal.classList.remove('active');
  });

  dateModal.addEventListener('click', (e) => {
    if (e.target === dateModal) dateModal.classList.remove('active');
  });

  // Theme Toggle: AMOLED Pure Black vs Dark Mode
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'amoled') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeLabel.textContent = 'AMOLED';
      showToast('Switched to Dark Gray Theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'amoled');
      themeLabel.textContent = 'Classic Dark';
      showToast('Switched to Pitch Black AMOLED');
    }
  });

  // View Mode Toggle: Phone Frame vs Full Web View
  viewModeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('mode-phone')) {
      document.body.classList.remove('mode-phone');
      document.body.classList.add('mode-web');
      viewModeLabel.textContent = 'Phone View';
      showToast('Switched to WhatsApp Web View');
    } else {
      document.body.classList.remove('mode-web');
      document.body.classList.add('mode-phone');
      viewModeLabel.textContent = 'Web View';
      showToast('Switched to Mobile Phone Mockup');
    }
  });

  // 3-Dots Menu Dropdown
  menuToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!menuDropdown.contains(e.target) && e.target !== menuToggleBtn) {
      menuDropdown.classList.remove('active');
    }
  });

  jumpToStartItem.addEventListener('click', () => {
    menuDropdown.classList.remove('active');
    messagesContainer.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Scrolled to first message (08/08/2026)');
  });

  jumpToEndItem.addEventListener('click', () => {
    menuDropdown.classList.remove('active');
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
    showToast('Scrolled to latest message (30/08/2026)');
  });

  openDateModalItem.addEventListener('click', () => {
    menuDropdown.classList.remove('active');
    populateDateModal();
    dateModal.classList.add('active');
  });

  let doodleEnabled = true;
  toggleDoodleItem.addEventListener('click', () => {
    menuDropdown.classList.remove('active');
    const viewport = document.querySelector('.chat-viewport');
    doodleEnabled = !doodleEnabled;
    if (doodleEnabled) {
      viewport.style.backgroundImage = "url('whatsapp_bg.svg')";
      showToast('Wallpaper doodles enabled');
    } else {
      viewport.style.backgroundImage = "none";
      showToast('Clean pure solid wallpaper enabled');
    }
  });

  exportChatSummaryItem.addEventListener('click', () => {
    menuDropdown.classList.remove('active');
    alert(`📊 WhatsApp Chat Statistics:\n\n• Participants: Babu's Sai (You) & 𝐃𝐡𝐚𝐚𝐚𝐫𝐫𝐫\n• Total Messages: ${totalCount}\n• Babu's Sai: 1,232 messages (Outgoing)\n• 𝐃𝐡𝐚𝐚𝐚𝐫𝐫𝐫: 1,454 messages (Incoming)\n• Dates covered: 23 days (08/08/2026 to 30/08/2026)\n• Theme: Authentic WhatsApp Dark Mode`);
  });

  // Interactive Message Sending
  messageInput.addEventListener('input', () => {
    if (messageInput.value.trim().length > 0) {
      micIcon.style.display = 'none';
      sendIcon.style.display = 'block';
    } else {
      micIcon.style.display = 'block';
      sendIcon.style.display = 'none';
    }
  });

  function handleSend() {
    const text = messageInput.value.trim();
    if (!text) {
      showToast('Hold to record voice message (Mockup)');
      return;
    }

    const now = new Date();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    const minutes = now.getMinutes();
    const timeStr = `${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;

    const newRow = document.createElement('div');
    newRow.className = 'msg-row outgoing has-tail';
    newRow.innerHTML = `
      <div class="msg-bubble">
        <span>${escapeHtml(text).replace(/\n/g, '<br>')}</span>
        <div class="msg-meta">
          <span class="msg-time">${timeStr}</span>
          ${doubleTickSvg}
        </div>
      </div>
    `;

    messagesContainer.appendChild(newRow);
    messageInput.value = '';
    micIcon.style.display = 'block';
    sendIcon.style.display = 'none';

    playSendSound();

    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });

    showToast('Message sent as Babu\'s Sai');
  }

  sendBtn.addEventListener('click', handleSend);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Call mock buttons
  videoCallBtn.addEventListener('click', () => {
    showToast('Starting WhatsApp video call with 𝐃𝐡𝐚𝐚𝐚𝐫𝐫𝐫...');
  });
  audioCallBtn.addEventListener('click', () => {
    showToast('Calling 𝐃𝐡𝐚𝐚𝐚𝐫𝐫𝐫 on WhatsApp...');
  });
  document.getElementById('emojiBtn').addEventListener('click', () => {
    messageInput.value += '❤️';
    messageInput.dispatchEvent(new Event('input'));
    messageInput.focus();
  });
  document.getElementById('attachBtn').addEventListener('click', () => {
    showToast('Document / Camera / Gallery / Audio / Location / Contact');
  });

  console.log(`WhatsApp Dark Mode Chat initialized with ${totalCount} messages!`);
})();
