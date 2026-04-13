const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const reminderForm = document.getElementById('reminder-form');
const reminderText = document.getElementById('reminder-text');
const reminderTime = document.getElementById('reminder-time');
const list = document.getElementById('notes-list');
const socket = io('http://localhost:3001');

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BD2vEcJBlDp0j_m3pCCbn-6Q4XR88dKdVd7kJMBo-0oSycIaLpSS0ibkli1fTCNLxyWgffHOTjHGZcFKiIA9uzc')
        });
        await fetch('http://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        console.log('Подписка на push отправлена');
    } catch (err) {
        console.error('Ошибка подписки на push:', err);
    }
}

async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        await fetch('http://localhost:3001/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
        console.log('Отписка выполнена');
    }
}

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    if (notes.length === 0) {
        list.innerHTML = '<li class="empty-state">Список заметок пуст</li>';
        return;
    }
    list.innerHTML = notes.map(note => {
        let reminderInfo = '';
        if (note.reminder) {
            const date = new Date(note.reminder);
            reminderInfo = `<div class="note-time">⏰ ${date.toLocaleString()}</div>`;
        }
        return `
            <li>
                <span class="note-icon">${note.reminder ? '⏰' : '📌'}</span>
                <div>
                    <div class="note-text">${note.text}</div>
                    ${reminderInfo}
                </div>
            </li>
        `;
    }).join('');
}

function addNote(text, reminderTimestamp = null) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const newNote = { id: Date.now(), text, reminder: reminderTimestamp };
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
    
    if (reminderTimestamp) {
        socket.emit('newReminder', { id: newNote.id, text, reminderTime: reminderTimestamp });
    } else {
        socket.emit('newTask', { text, timestamp: Date.now() });
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        addNote(text);
        input.value = '';
    }
});

reminderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = reminderText.value.trim();
    const datetime = reminderTime.value;
    if (text && datetime) {
        const timestamp = new Date(datetime).getTime();
        if (timestamp > Date.now()) {
            addNote(text, timestamp);
            reminderText.value = '';
            reminderTime.value = '';
        } else {
            alert('Дата напоминания должна быть в будущем');
        }
    }
});

socket.on('taskAdded', (task) => {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = `Новая задача: ${task.text}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
});

loadNotes();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            console.log('SW registered');

            const enableBtn = document.getElementById('enable-push');
            const disableBtn = document.getElementById('disable-push');

            if (enableBtn && disableBtn) {
                const subscription = await reg.pushManager.getSubscription();
                if (subscription) {
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                }

                enableBtn.addEventListener('click', async () => {
                    if (Notification.permission === 'denied') {
                        alert('Уведомления запрещены.');
                        return;
                    }
                    if (Notification.permission === 'default') {
                        const permission = await Notification.requestPermission();
                        if (permission !== 'granted') {
                            alert('Необходимо разрешить уведомления.');
                            return;
                        }
                    }
                    await subscribeToPush();
                    enableBtn.style.display = 'none';
                    disableBtn.style.display = 'inline-block';
                });

                disableBtn.addEventListener('click', async () => {
                    await unsubscribeFromPush();
                    disableBtn.style.display = 'none';
                    enableBtn.style.display = 'inline-block';
                });
            }
        } catch (err) {
            console.log('SW registration failed:', err);
        }
    });
}