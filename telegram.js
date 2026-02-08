// ==================== TELEGRAM ENHANCED API ====================
class TelegramBot {
    constructor(token, chatId) {
        this.token = token;
        this.chatId = chatId;
        this.baseUrl = `https://api.telegram.org/bot${token}`;
        this.lastUpdateId = 0;
    }
    
    async sendMessage(text, options = {}) {
        const payload = {
            chat_id: this.chatId,
            text: text,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            ...options
        };
        
        try {
            const response = await fetch(`${this.baseUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (error) {
            console.error('Telegram send error:', error);
            return null;
        }
    }
    
    async sendPhoto(photoData, caption = '') {
        const formData = new FormData();
        formData.append('chat_id', this.chatId);
        formData.append('photo', photoData);
        if (caption) formData.append('caption', caption);
        
        try {
            const response = await fetch(`${this.baseUrl}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Telegram photo error:', error);
            return null;
        }
    }
    
    async sendDocument(documentData, filename, caption = '') {
        const formData = new FormData();
        formData.append('chat_id', this.chatId);
        formData.append('document', documentData, filename);
        if (caption) formData.append('caption', caption);
        
        try {
            const response = await fetch(`${this.baseUrl}/sendDocument`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Telegram document error:', error);
            return null;
        }
    }
    
    async getUpdates() {
        try {
            const response = await fetch(`${this.baseUrl}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=10`);
            const data = await response.json();
            
            if (data.ok && data.result.length > 0) {
                this.lastUpdateId = data.result[data.result.length - 1].update_id;
                return data.result;
            }
            return [];
        } catch (error) {
            console.error('Telegram updates error:', error);
            return [];
        }
    }
}

// Initialize Telegram Bot
let telegramBot = null;

function initializeTelegramBot(token, chatId) {
    if (!token || token.includes('GANTI')) {
        console.warn('⚠️ Telegram token not configured');
        return null;
    }
    
    telegramBot = new TelegramBot(token, chatId);
    console.log('✅ Telegram Bot Initialized');
    return telegramBot;
}

// WebSocket-like polling for real-time commands
function startCommandPolling(interval = 30000) {
    if (!telegramBot) return;
    
    setInterval(async () => {
        const updates = await telegramBot.getUpdates();
        updates.forEach(update => {
            if (update.message && update.message.text) {
                handleIncomingMessage(update.message);
            }
        });
    }, interval);
}

function handleIncomingMessage(message) {
    const command = message.text.trim();
    const chatId = message.chat.id.toString();
    const configChatId = CONFIG.CHAT_ID.toString();
    
    if (chatId === configChatId) {
        console.log(`📨 Command received: ${command}`);
        
        // Echo for testing
        if (command.startsWith('/echo ')) {
            const text = command.substring(6);
            telegramBot.sendMessage(`Echo: ${text}`, {
                reply_to_message_id: message.message_id
            });
        }
        
        // Add more command handlers as needed
    }
}

// Export
window.TelegramBot = TelegramBot;
window.initializeTelegramBot = initializeTelegramBot;
window.startCommandPolling = startCommandPolling;