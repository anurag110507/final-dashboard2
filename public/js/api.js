const API_BASE =  "/api";

// Demo fallback data for when API fails
const DEMO_CHARGERS = [
  {
    _id: 'demo-1',
    name: 'Oxford Street Hub',
    address: '123 Oxford Street, London W1D 2EH',
    latitude: 51.5161,
    longitude: -0.1426,
    chargerType: 'DC Fast',
    totalSlots: 8,
    availableSlots: 6,
    rating: 4.8
  },
  {
    _id: 'demo-2',
    name: 'Tower Bridge Plaza',
    address: 'Tower Bridge, London SE1 2UP',
    latitude: 51.5055,
    longitude: -0.0754,
    chargerType: 'Level 2',
    totalSlots: 6,
    availableSlots: 2,
    rating: 4.5
  },
  {
    _id: 'demo-3',
    name: 'Green Park Station',
    address: 'Green Park, London SW1A 1AX',
    latitude: 51.5036,
    longitude: -0.1496,
    chargerType: 'Level 2',
    totalSlots: 4,
    availableSlots: 1,
    rating: 4.2
  }
];

const DEMO_LEADERBOARD = [
  { _id: 'u1', name: 'John Smith', greenScore: 175, totalChargingTime: 17.5 },
  { _id: 'u2', name: 'Sarah Johnson', greenScore: 150, totalChargingTime: 15 }
];

class API {
    static async request(method, endpoint, data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const token = localStorage.getItem('token');
        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            console.log(`📡 API Request: ${method} ${endpoint}`);
            
            // Add 10 second timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            options.signal = controller.signal;
            
            const response = await fetch(`${API_BASE}${endpoint}`, options);
            clearTimeout(timeout);
            
            // Handle 401 Unauthorized - logout user
            if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
                console.warn('⚠️ Unauthorized - logging out');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                location.reload();
            }
            
            // Parse response regardless of status code
            let json;
            try {
                json = await response.json();
            } catch (parseErr) {
                console.error('❌ Failed to parse JSON response:', parseErr.message);
                return { 
                    error: 'Invalid server response',
                    status: response.status,
                    offline: false
                };
            }
            
            console.log(`✅ API Response (${response.status}): ${endpoint}`, json);
            return json;
        } catch (err) {
            console.error('❌ API Error:', err.message);
            return { error: err.message, offline: true };
        }
    }

    // Auth
    static login(email, password) {
        console.log('🔓 Attempting login:', email);
        return this.request('POST', '/auth/login', { email, password });
    }

    static register(name, email, password, role) {
        console.log('📝 Attempting registration:', email, 'as', role);
        return this.request('POST', '/auth/register', { name, email, password, role });
    }

    // Chargers
    static async getAllChargers() {
        console.log('🗺️ Loading all chargers');
        const result = await this.request('GET', '/chargers');
        
        // Fallback to demo data if API fails
        if (result.error || result.offline) {
            console.warn('📊 API failed - using demo chargers');
            return DEMO_CHARGERS;
        }
        return result;
    }

    static getCharger(id) {
        return this.request('GET', `/chargers/${id}`);
    }

    static createCharger(data) {
        console.log('➕ Creating charger:', data.name);
        return this.request('POST', '/chargers', data);
    }

    static updateCharger(id, data) {
        console.log('✏️ Updating charger:', id);
        return this.request('PUT', `/chargers/${id}`, data);
    }

    static deleteCharger(id) {
        console.log('🗑️ Deleting charger:', id);
        return this.request('DELETE', `/chargers/${id}`);
    }

    static getOwnerChargers() {
        console.log('📋 Loading owner chargers');
        return this.request('GET', '/chargers/owner/list');
    }

    // Bookings
    static createBooking(data) {
        console.log('📅 Creating booking:', data.durationHours, 'hours');
        return this.request('POST', '/bookings', data);
    }

    static getUserBookings() {
        console.log('📖 Loading user bookings');
        return this.request('GET', '/bookings/user/list');
    }

    static getChargerBookings(chargerId) {
        console.log('📊 Loading charger bookings:', chargerId);
        return this.request('GET', `/bookings/charger/${chargerId}`);
    }

    // User impact
    static async getUserImpact() {
        console.log('🌱 Loading user impact');
        const result = await this.request('GET', '/users/impact');
        
        // Fallback impact data
        if (result.error || result.offline) {
            console.warn('📊 Impact API failed - using default values');
            return {
                greenScore: 50,
                totalSessions: 0,
                estimatedCO2Saved: 0,
                totalChargingTime: 0
            };
        }
        return result;
    }

    static completeBooking(id) {
        console.log('✅ Completing booking:', id);
        return this.request('PUT', `/bookings/${id}/complete`);
    }

    static cancelBooking(id) {
        console.log('❌ Cancelling booking:', id);
        return this.request('PUT', `/bookings/${id}/cancel`);
    }

    // ===========================
    // BOOKING REQUEST METHODS
    // ===========================

    static createBookingRequest(chargerId, startTime, durationHours) {
        console.log(`📋 Creating booking request for charger: ${chargerId}`);
        return this.request('POST', '/booking-requests', {
            chargerId,
            startTime,
            durationHours
        });
    }

    static getUserBookingRequests() {
        console.log('📋 Loading user booking requests');
        return this.request('GET', '/booking-requests/user/list');
    }

    static getOwnerBookingRequests() {
        console.log('📋 Loading owner booking requests');
        return this.request('GET', '/booking-requests/owner/pending');
    }

    static getBookingRequestDetail(id) {
        console.log(`📋 Loading booking request: ${id}`);
        return this.request('GET', `/booking-requests/${id}`);
    }

    static cancelBookingRequest(id) {
        console.log(`🚫 Cancelling booking request: ${id}`);
        return this.request('PUT', `/booking-requests/${id}/cancel`);
    }

    // Owner actions
    static approveBookingRequest(id) {
        console.log(`✅ Approving booking request: ${id}`);
        return this.request('PUT', `/booking-requests/${id}/approve`);
    }

    static rejectBookingRequest(id, reason) {
        console.log(`❌ Rejecting booking request: ${id}`);
        return this.request('PUT', `/booking-requests/${id}/reject`, { reason });
    }

    static startChargingSession(id) {
        console.log(`⚡ Starting charging session: ${id}`);
        return this.request('PUT', `/booking-requests/${id}/session/start`);
    }

    static endChargingSession(id) {
        console.log(`🏁 Ending charging session: ${id}`);
        return this.request('PUT', `/booking-requests/${id}/session/end`);
    }

    static cancelApprovedSession(id, reason) {
        console.log(`🚫 Cancelling approved session: ${id}`);
        return this.request('PUT', `/booking-requests/${id}/session/cancel`, { reason });
    }

    // Users
    static getProfile() {
        console.log('👤 Loading user profile');
        return this.request('GET', '/users/profile');
    }

    static async getLeaderboard() {
        console.log('🏆 Loading leaderboard');
        const result = await this.request('GET', '/users/leaderboard');
        
        // Fallback to demo leaderboard
        if (result.error || result.offline) {
            console.warn('📊 Leaderboard API failed - using demo data');
            return DEMO_LEADERBOARD;
        }
        return result;
    }
}
