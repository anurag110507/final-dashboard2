// EnergyShare AI Chatbot JavaScript

class EnergyShareChatbot {
  constructor() {
    this.isOpen = false;
    this.lastIntent = null;
    this.init();
  }

  init() {
    this.createElements();
    this.bindEvents();
    this.showGreeting();
    this.startPulse();
  }

  createElements() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'chatbot-container';

    // Create button
    this.button = document.createElement('button');
    this.button.className = 'chatbot-button';
    this.button.innerHTML = '⚡';
    this.button.title = 'Chat with EnergyShare AI';

    // Create window
    this.window = document.createElement('div');
    this.window.className = 'chatbot-window';

    // Header
    this.header = document.createElement('div');
    this.header.className = 'chatbot-header';
    this.header.innerHTML = `
      <h3>EnergyShare AI ⚡</h3>
      <button class="chatbot-minimize">−</button>
    `;

    // Messages area
    this.messages = document.createElement('div');
    this.messages.className = 'chatbot-messages';

    // Typing indicator
    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'typing-indicator';
    this.typingIndicator.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;

    // Input area
    this.inputArea = document.createElement('div');
    this.inputArea.className = 'chatbot-input-area';
    this.inputArea.innerHTML = `
      <input type="text" class="chatbot-input" placeholder="Ask me anything about EV charging...">
      <button class="chatbot-send">➤</button>
    `;

    // Assemble
    this.window.appendChild(this.header);
    this.window.appendChild(this.messages);
    this.window.appendChild(this.inputArea);
    this.container.appendChild(this.button);
    this.container.appendChild(this.window);
    document.body.appendChild(this.container);

    // Get elements
    this.input = this.inputArea.querySelector('.chatbot-input');
    this.sendBtn = this.inputArea.querySelector('.chatbot-send');
    this.minimizeBtn = this.header.querySelector('.chatbot-minimize');
  }

  bindEvents() {
    this.button.addEventListener('click', () => this.toggleChat());
    this.minimizeBtn.addEventListener('click', () => this.toggleChat());
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.window.style.display = this.isOpen ? 'flex' : 'none';
    if (this.isOpen) {
      this.input.focus();
      this.stopPulse();
      this.scrollToBottom();
    } else {
      this.startPulse();
    }
  }

  sendMessage() {
    const message = this.input.value.trim();
    if (!message) return;

    this.addMessage(message, 'user');
    this.input.value = '';
    this.showTyping();

    // Simulate typing delay
    const delay = Math.random() * 1200 + 600;
    setTimeout(() => {
      this.hideTyping();
      this.botResponse(message.toLowerCase());
    }, delay);
  }

  addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `<div class="message-bubble">${text}</div>`;
    this.messages.appendChild(messageDiv);
    this.scrollToBottom();
  }

  showTyping() {
    this.messages.appendChild(this.typingIndicator);
    this.typingIndicator.style.display = 'inline-block';
    this.scrollToBottom();
  }

  hideTyping() {
    if (this.typingIndicator.parentNode) {
      this.messages.removeChild(this.typingIndicator);
    }
  }

  scrollToBottom() {
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  botResponse(message) {
    // Emergency detection
    if (this.isEmergency(message)) {
      this.addMessage("⚠️ Emergency detected!<br>I'm finding the nearest fast charger for you.<br>Please share your location or call emergency services if critical.", 'bot');
      this.lastIntent = 'emergency';
      return;
    }

    // Check for follow-up
    if (this.lastIntent && this.isAffirmative(message)) {
      this.handleFollowUp();
      return;
    }

    // Match intent
    const intent = this.matchIntent(message);
    if (intent) {
      const response = this.getResponse(intent);
      this.addMessage(response, 'bot');
      this.lastIntent = intent;
      this.addChips(intent);
    } else {
      this.addMessage("I'm still learning 🤖<br>But I can help with:<br><br>• finding chargers<br>• booking help<br>• green impact<br>• owner dashboard<br><br>Try one of these!", 'bot');
      this.lastIntent = null;
      this.addDefaultChips();
    }
  }

  isEmergency(message) {
    const emergencyWords = ['battery low', 'emergency', '5%', 'critical battery', 'urgent', 'help me'];
    return emergencyWords.some(word => message.includes(word));
  }

  isAffirmative(message) {
    return ['yes', 'yeah', 'sure', 'okay', 'ok', 'yep'].includes(message);
  }

  handleFollowUp() {
    switch (this.lastIntent) {
      case 'booking':
        this.addMessage("Great! To book a charger:<br>1. Find a station on the map<br>2. Click 'Book Now'<br>3. Select time slot<br>4. Confirm payment<br><br>Need help with a specific station?", 'bot');
        break;
      case 'nearest':
        this.addMessage("To find the nearest charger:<br>• Allow location access<br>• Use the map search<br>• Filter by connector type<br><br>What's your current location?", 'bot');
        break;
      default:
        this.addMessage("Thanks for confirming! How else can I help you today?", 'bot');
    }
    this.lastIntent = null;
  }

  matchIntent(message) {
    const intents = {
      nearest: ['nearest charger', 'charger near me', 'find charger', 'close charger'],
      available: ['available stations', 'free charger', 'open slot'],
      booking: ['booking help', 'how to book', 'book charger', 'reserve'],
      cancel: ['cancel booking', 'cancel reservation'],
      pricing: ['pricing', 'cost', 'price', 'fee'],
      time: ['charging time', 'how long', 'duration'],
      connector: ['connector types', 'plug type', 'charger type'],
      green: ['green score', 'eco score', 'sustainability'],
      emergency: ['emergency charging', 'fast charge'],
      app: ['app not working', 'bug', 'issue'],
      login: ['login problem', 'cant login'],
      payment: ['payment methods', 'pay', 'billing'],
      support: ['support contact', 'help', 'contact'],
      addStation: ['add station', 'add charger', 'register station'],
      manage: ['manage chargers', 'my chargers'],
      revenue: ['revenue dashboard', 'earnings', 'income'],
      peak: ['peak hours', 'busy time'],
      offline: ['station offline', 'charger down'],
      updatePrice: ['update pricing', 'change price'],
      ownerLogin: ['owner login issue', 'owner login'],
      approve: ['approve bookings', 'confirm booking']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return intent;
      }
    }
    return null;
  }

  getResponse(intent) {
    const responses = {
      nearest: [
        "I can help you find the nearest charger! Please share your location or tell me your city.",
        "Looking for chargers near you? Use the map search or tell me your location!",
        "To find nearby chargers: Enable location services or search by address on the map."
      ],
      available: [
        "Check the map for available stations - green markers show free chargers!",
        "Available stations are marked in green on the map. Filter by connector type if needed.",
        "Use the map filters to see only available charging stations in your area."
      ],
      booking: [
        "Booking is easy! Find a station, select a time slot, and confirm. Need step-by-step help?",
        "To book: Choose a charger on the map → Select time → Pay → Done! Want me to guide you?",
        "I can walk you through booking. Just tell me which station interests you."
      ],
      cancel: [
        "To cancel: Go to your bookings in the dashboard and click 'Cancel'. Refunds within 24hrs.",
        "Cancellation is free up to 1 hour before. Check your dashboard for active bookings.",
        "Need to cancel? Visit your booking history and select the booking to cancel."
      ],
      pricing: [
        "Pricing varies by station: $0.25-0.50/kWh. Check station details for exact rates.",
        "Most stations charge $0.30-0.45 per kWh. Premium fast chargers may be higher.",
        "Pricing depends on location and speed. Fast chargers typically $0.40-0.60/kWh."
      ],
      time: [
        "Charging time depends on your car and charger: 30min-8hrs. Check your car's manual.",
        "Fast chargers: 80% in 30-45min. Standard: 4-8 hours for full charge.",
        "Time varies: Level 3 (DCFC) is fastest, Level 2 takes 2-6 hours."
      ],
      connector: [
        "Common types: CCS, CHAdeMO, Tesla SC. Check your car or use our compatibility guide.",
        "Most stations have CCS or CHAdeMO. Tesla owners need Tesla-specific or adapters.",
        "Connector types: CCS (most common), CHAdeMO (some), Tesla (Tesla cars only)."
      ],
      green: [
        "Green Score shows environmental impact: Higher = more renewable energy used.",
        "Green Score (1-10) indicates renewable energy percentage. 10 = 100% green!",
        "Our Green Score helps you choose eco-friendly charging. Higher scores = cleaner energy."
      ],
      emergency: [
        "For emergencies, use fast chargers (DCFC) when available. Call roadside assistance if needed.",
        "Emergency charging: Look for 'Fast Charge' stations. May have higher fees but quicker.",
        "In emergencies, prioritize fast chargers. Some stations offer priority charging."
      ],
      app: [
        "App issues? Try refreshing the page or clearing cache. Still problems? Contact support.",
        "If the app isn't working: Check your internet, try another browser, or update the app.",
        "Technical issues? Clear browser cache, disable extensions, or try incognito mode."
      ],
      login: [
        "Login problems? Reset password or check email verification. Still stuck? Contact us.",
        "Can't login? Make sure email is verified and password is correct. Use 'Forgot Password'.",
        "Login issues: Check caps lock, try password reset, or clear browser cookies."
      ],
      payment: [
        "We accept credit cards, Apple Pay, Google Pay. No cash at stations.",
        "Payment methods: Visa, Mastercard, American Express, digital wallets.",
        "Pay securely with card or mobile wallet. Billing statements show 'EnergyShare'."
      ],
      support: [
        "Contact support: email support@energyshare.com or call 1-800-CHARGE.",
        "Need help? Email us at support@energyshare.com or use the contact form.",
        "Support available 24/7: Call 1-800-CHARGE or email support@energyshare.com."
      ],
      addStation: [
        "To add your station: Register as owner → Add location → Configure chargers → Go live!",
        "Owner registration: Sign up → Verify location → Add charger details → Set pricing.",
        "Adding a station: Owner dashboard → 'Add Station' → Enter details → Submit for approval."
      ],
      manage: [
        "Manage chargers in your owner dashboard: Update status, pricing, maintenance schedules.",
        "Owner tools: Monitor usage, set availability, update pricing, view analytics.",
        "In your dashboard: See all chargers, bookings, revenue, and maintenance alerts."
      ],
      revenue: [
        "Check revenue in owner dashboard: Daily/weekly/monthly earnings, top stations.",
        "Revenue dashboard shows: Total earnings, booking volume, peak hours, trends.",
        "Monitor income: Owner dashboard → Revenue tab → Filter by date/station."
      ],
      peak: [
        "Peak hours vary by location: Usually 7-9AM and 5-7PM weekdays. Check your dashboard.",
        "Busy times: Morning commute and evening. Use dashboard analytics for your stations.",
        "Peak hours depend on area. Most stations busiest during rush hours."
      ],
      offline: [
        "Station offline? Check power/connection. Contact electrician or EnergyShare support.",
        "If offline: Verify power source, network connection, or schedule maintenance.",
        "Offline issues: Reset charger, check breakers, or call support for remote diagnostics."
      ],
      updatePrice: [
        "Update pricing in owner dashboard: Set rates, peak pricing, promotions.",
        "Change prices: Dashboard → Station settings → Pricing → Save changes.",
        "Dynamic pricing: Set base rates, add peak surcharges, or offer discounts."
      ],
      ownerLogin: [
        "Owner login issues? Use owner portal link or contact support for account help.",
        "Can't access owner dashboard? Reset password or verify account status.",
        "Owner login: Go to owner.energyshare.com or use main site owner login."
      ],
      approve: [
        "Approve bookings in dashboard: Review requests, confirm payment, assign slots.",
        "Booking approvals: Dashboard → Pending bookings → Approve/Reject with notes.",
        "Manage bookings: Auto-approve or manually review based on your preferences."
      ]
    };

    const intentResponses = responses[intent] || ["I'm here to help! Could you rephrase that?"];
    return intentResponses[Math.floor(Math.random() * intentResponses.length)];
  }

  addChips(intent) {
    // Clear existing chips
    const existingChips = this.messages.querySelector('.quick-chips');
    if (existingChips) existingChips.remove();

    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'quick-chips';

    let chips = [];
    if (['nearest', 'available', 'emergency'].includes(intent)) {
      chips = ['🔍 Find nearest charger', '⚡ Emergency charging', '🌱 Green score info'];
    } else if (['booking', 'cancel'].includes(intent)) {
      chips = ['📅 Booking help', '❌ Cancel booking', '💰 Pricing info'];
    } else if (['addStation', 'manage', 'revenue'].includes(intent)) {
      chips = ['🏢 Add my station', '📊 Revenue dashboard', '🔧 Station offline help'];
    } else {
      this.addDefaultChips();
      return;
    }

    chips.forEach(chipText => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = chipText;
      chip.addEventListener('click', () => {
        this.input.value = chipText.replace(/^[^\s]+\s/, ''); // Remove emoji
        this.sendMessage();
      });
      chipsDiv.appendChild(chip);
    });

    this.messages.appendChild(chipsDiv);
    this.scrollToBottom();
  }

  addDefaultChips() {
    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'quick-chips';

    const chips = ['🔍 Find nearest charger', '⚡ Emergency charging', '🌱 Green score info', '📅 Booking help'];

    chips.forEach(chipText => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = chipText;
      chip.addEventListener('click', () => {
        this.input.value = chipText.replace(/^[^\s]+\s/, '');
        this.sendMessage();
      });
      chipsDiv.appendChild(chip);
    });

    this.messages.appendChild(chipsDiv);
    this.scrollToBottom();
  }

  showGreeting() {
    setTimeout(() => {
      this.addMessage("Hi! I'm EnergyShare AI ⚡<br>How can I help you with EV charging today?", 'bot');
      this.addDefaultChips();
    }, 1000);
  }

  startPulse() {
    this.button.classList.add('pulse');
  }

  stopPulse() {
    this.button.classList.remove('pulse');
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EnergyShareChatbot();
});