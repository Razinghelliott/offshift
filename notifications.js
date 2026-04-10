/**
 * OFFSHIFT Notification System
 * Drop-in real-time notifications via Firestore.
 *
 * Requires: Firebase Auth + Firestore already initialized as `auth` and `db`.
 * Insert this script after Firebase init, then call initNotifications().
 */

(function() {
  let unsubscribe = null;
  let notifData = [];
  let isOpen = false;

  // ─── Inject CSS ───
  const style = document.createElement('style');
  style.textContent = `
    .notif-wrap { position: relative; }
    .notif-bell {
      position: relative; width: 36px; height: 36px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.3s;
    }
    .notif-bell:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
    .notif-bell svg { width: 18px; height: 18px; color: #aaa; transition: color 0.3s; }
    .notif-bell:hover svg { color: #f5f5f5; }
    .notif-badge {
      position: absolute; top: -4px; right: -4px;
      min-width: 18px; height: 18px; padding: 0 5px;
      border-radius: 9px; background: #c31415;
      font-size: 0.6rem; font-weight: 700; color: #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(195,20,21,0.4);
      animation: notifPop 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .notif-badge.hidden { display: none; }
    @keyframes notifPop { from { transform: scale(0); } to { transform: scale(1); } }

    .notif-dropdown {
      position: absolute; top: calc(100% + 12px); right: 0;
      width: 360px; max-height: 440px; overflow-y: auto;
      background: #141414; border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; box-shadow: 0 24px 80px rgba(0,0,0,0.6);
      z-index: 9999; display: none;
      animation: notifSlide 0.25s ease;
    }
    .notif-dropdown.open { display: block; }
    @keyframes notifSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

    .notif-dropdown-header {
      padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .notif-dropdown-title { font-size: 0.82rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #f5f5f5; }
    .notif-mark-read {
      font-size: 0.7rem; color: #888; background: none; border: none; cursor: pointer;
      font-family: 'Inter', sans-serif; transition: color 0.3s;
    }
    .notif-mark-read:hover { color: #c31415; }

    .notif-item {
      padding: 14px 20px; display: flex; gap: 12px; align-items: flex-start;
      border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s; cursor: pointer;
    }
    .notif-item:hover { background: rgba(255,255,255,0.03); }
    .notif-item:last-child { border-bottom: none; }
    .notif-item.unread { background: rgba(195,20,21,0.04); }
    .notif-item.unread::before {
      content: ''; flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%;
      background: #c31415; margin-top: 6px; box-shadow: 0 0 8px rgba(195,20,21,0.4);
    }

    .notif-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 1rem;
    }
    .notif-icon.booking { background: rgba(52,199,89,0.1); }
    .notif-icon.confirmed { background: rgba(52,199,89,0.15); }
    .notif-icon.declined { background: rgba(195,20,21,0.1); }
    .notif-icon.request { background: rgba(255,149,0,0.1); }
    .notif-icon.message { background: rgba(195,20,21,0.1); }

    .notif-content { flex: 1; min-width: 0; }
    .notif-from { font-size: 0.8rem; font-weight: 600; color: #f5f5f5; margin-bottom: 2px; }
    .notif-msg { font-size: 0.78rem; color: #aaa; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .notif-time { font-size: 0.65rem; color: #666; margin-top: 4px; }

    .notif-empty { padding: 40px 20px; text-align: center; color: #666; font-size: 0.85rem; }

    .msg-badge-wrap {
      position: relative; cursor: pointer;
    }
    .msg-badge-icon {
      width: 36px; height: 36px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s; text-decoration: none;
    }
    .msg-badge-icon:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
    .msg-badge-icon svg { width: 18px; height: 18px; color: #aaa; transition: color 0.3s; }
    .msg-badge-icon:hover svg { color: #f5f5f5; }
    .msg-badge-count {
      position: absolute; top: -4px; right: -4px;
      min-width: 18px; height: 18px; padding: 0 5px;
      border-radius: 9px; background: #c31415;
      font-size: 0.6rem; font-weight: 700; color: #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(195,20,21,0.4);
      animation: notifPop 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    .msg-badge-count.hidden { display: none; }

    @media (max-width: 500px) { .notif-dropdown { width: calc(100vw - 32px); right: -60px; } }
  `;
  document.head.appendChild(style);

  // ─── Build DOM ───
  function buildNotifUI() {
    const navUser = document.querySelector('.nav-user');
    if (!navUser) return null;

    const wrap = document.createElement('div');
    wrap.className = 'notif-wrap';
    wrap.innerHTML = `
      <div class="notif-bell" id="notifBell">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <div class="notif-badge hidden" id="notifBadge">0</div>
      </div>
      <div class="notif-dropdown" id="notifDropdown">
        <div class="notif-dropdown-header">
          <span class="notif-dropdown-title">Notifications</span>
          <button class="notif-mark-read" id="markAllRead">Mark all read</button>
        </div>
        <div id="notifList">
          <div class="notif-empty">No notifications yet</div>
        </div>
      </div>
    `;

    // Insert before the avatar
    navUser.insertBefore(wrap, navUser.firstChild);
    return wrap;
  }

  // ─── Toggle dropdown ───
  function setupToggle() {
    const bell = document.getElementById('notifBell');
    const dropdown = document.getElementById('notifDropdown');
    if (!bell || !dropdown) return;

    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen = !isOpen;
      dropdown.classList.toggle('open', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== bell) {
        isOpen = false;
        dropdown.classList.remove('open');
      }
    });

    document.getElementById('markAllRead').addEventListener('click', markAllRead);
  }

  // ─── Render notifications ───
  function renderNotifs() {
    const list = document.getElementById('notifList');
    if (!list) return;

    if (notifData.length === 0) {
      list.innerHTML = '<div class="notif-empty">No notifications yet</div>';
      return;
    }

    list.innerHTML = '';
    notifData.forEach(n => {
      const item = document.createElement('div');
      item.className = 'notif-item' + (n.read ? '' : ' unread');

      const iconClass = n.type === 'booking_confirmed' ? 'confirmed'
        : n.type === 'booking_declined' ? 'declined'
        : n.type === 'booking_request' ? 'request'
        : n.type === 'new_message' ? 'message'
        : 'booking';

      const iconEmoji = n.type === 'booking_confirmed' ? '&#10003;'
        : n.type === 'booking_declined' ? '&#10007;'
        : n.type === 'booking_request' ? '&#128276;'
        : n.type === 'new_message' ? '&#128172;'
        : '&#128197;';

      const timeAgo = getTimeAgo(n.createdAt);

      item.innerHTML = `
        <div class="notif-icon ${iconClass}">${iconEmoji}</div>
        <div class="notif-content">
          <div class="notif-from">${escapeHtml(n.fromName || 'OFFSHIFT')}</div>
          <div class="notif-msg">${escapeHtml(n.message || '')}</div>
          <div class="notif-time">${timeAgo}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        // Mark as read on click
        if (!n.read) {
          db.collection('notifications').doc(n.id).update({ read: true });
        }
        // Navigate based on type
        if (n.type === 'new_message' && n.bookingId) {
          window.location.href = 'messages.html?booking=' + n.bookingId;
        } else if (n.type === 'booking_request') {
          window.location.href = 'pro-bookings.html';
        } else if (n.type === 'booking_confirmed' || n.type === 'booking_declined') {
          window.location.href = 'client-bookings.html';
        }
      });

      list.appendChild(item);
    });
  }

  // ─── Update badge ───
  function updateBadge() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    const unread = notifData.filter(n => !n.read).length;
    badge.textContent = unread > 9 ? '9+' : unread;
    badge.classList.toggle('hidden', unread === 0);
  }

  // ─── Mark all read ───
  async function markAllRead() {
    const batch = db.batch();
    notifData.filter(n => !n.read).forEach(n => {
      batch.update(db.collection('notifications').doc(n.id), { read: true });
    });
    try {
      await batch.commit();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  }

  // ─── Time ago ───
  function getTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const then = timestamp.toDate ? timestamp.toDate().getTime() : timestamp;
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    const d = new Date(then);
    return `${d.getMonth()+1}/${d.getDate()}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Build Messages Badge ───
  let msgUnsub1 = null, msgUnsub2 = null;

  function buildMsgBadge() {
    const navUser = document.querySelector('.nav-user');
    if (!navUser) return null;

    const wrap = document.createElement('div');
    wrap.className = 'msg-badge-wrap';
    wrap.innerHTML = `
      <a href="messages.html" class="msg-badge-icon" title="Messages">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </a>
      <div class="msg-badge-count hidden" id="msgBadge">0</div>
    `;
    // Insert before notif-wrap (or first child)
    const notifWrap = navUser.querySelector('.notif-wrap');
    if (notifWrap) {
      navUser.insertBefore(wrap, notifWrap);
    } else {
      navUser.insertBefore(wrap, navUser.firstChild);
    }
    return wrap;
  }

  function startMsgListener(userId) {
    const badge = document.getElementById('msgBadge');
    if (!badge) return;

    let clientUnread = new Set();
    let proUnread = new Set();

    function updateMsgBadge() {
      const total = new Set([...clientUnread, ...proUnread]).size;
      badge.textContent = total > 9 ? '9+' : total;
      badge.classList.toggle('hidden', total === 0);
    }

    // Listen for bookings where user is client and has unread
    msgUnsub1 = db.collection('bookings')
      .where('clientId', '==', userId)
      .where('unreadBy.' + userId, '==', true)
      .onSnapshot(snap => {
        clientUnread = new Set(snap.docs.map(d => d.id));
        updateMsgBadge();
      }, err => { console.error('Msg badge client err:', err); });

    // Listen for bookings where user is pro and has unread
    msgUnsub2 = db.collection('bookings')
      .where('proId', '==', userId)
      .where('unreadBy.' + userId, '==', true)
      .onSnapshot(snap => {
        proUnread = new Set(snap.docs.map(d => d.id));
        updateMsgBadge();
      }, err => { console.error('Msg badge pro err:', err); });
  }

  // ─── Public init ───
  window.initNotifications = function(userId) {
    const wrap = buildNotifUI();
    if (!wrap) return;
    setupToggle();

    // Messages badge
    buildMsgBadge();
    startMsgListener(userId);

    // Real-time notification listener
    unsubscribe = db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot(snap => {
        notifData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderNotifs();
        updateBadge();
      }, err => {
        console.error('Notifications listener error:', err);
      });
  };

  window.destroyNotifications = function() {
    if (unsubscribe) unsubscribe();
    if (msgUnsub1) msgUnsub1();
    if (msgUnsub2) msgUnsub2();
  };
})();
