/**
 * Booking Request Module
 * Handles user booking requests and owner management
 */

const BookingRequest = {
    async sendBookingRequest(chargerId, startTime, durationHours) {
        try {
            console.log(`📋 Sending booking request...`);
            const result = await API.createBookingRequest(chargerId, startTime, durationHours);

            if (result.error) {
                alert(`❌ Error: ${result.error || result.message}`);
                return false;
            }

            alert('✅ Booking request sent! The charging station owner will review it shortly.');
            return true;
        } catch (err) {
            console.error('❌ Error sending booking request:', err);
            alert('❌ Failed to send booking request.');
            return false;
        }
    },

    async loadUserBookingRequests() {
        try {
            const requests = await API.getUserBookingRequests();
            return requests?.error ? [] : requests;
        } catch (err) {
            console.error('❌ Error loading booking requests:', err);
            return [];
        }
    },

    async cancelRequest(requestId) {
        try {
            if (!confirm('Cancel this request?')) return false;
            const result = await API.cancelBookingRequest(requestId);
            if (result.error) {
                alert(`❌ ${result.error}`);
                return false;
            }
            alert('✅ Booking request cancelled.');
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    },

    getStatusBadge(status) {
        const statuses = {
            pending: '<span class="badge bg-warning text-dark">⏳ Pending</span>',
            approved: '<span class="badge bg-info">✅ Approved</span>',
            rejected: '<span class="badge bg-danger">❌ Rejected</span>',
            session_active: '<span class="badge bg-success">⚡ Session Active</span>',
            session_ended: '<span class="badge bg-secondary">🏁 Session Ended</span>',
            session_cancelled: '<span class="badge bg-secondary">🚫 Cancelled</span>'
        };
        return statuses[status] || `<span class="badge bg-secondary">${status}</span>`;
    },

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    renderUserRequests(requests) {
        if (!requests || requests.length === 0) {
            return '<p class="text-muted">No booking requests yet.</p>';
        }

        let html = '<div class="list-group">';

        for (let req of requests) {
            const charger = req.chargerId || {};
            const chargerName = charger.name || "Unknown Charger";
            const chargerAddress = charger.address || "-";
            const duration = (req.durationHours || 0) * 60;
            const statusBadge = this.getStatusBadge(req.status);
            const startDate = this.formatDate(req.startTime);

            html += `
                <div class="list-group-item">
                    <h6><strong>${chargerName}</strong></h6>
                    <small class="text-muted">
                        📍 ${chargerAddress}<br>
                        🕐 ${startDate}<br>
                        ⏱️ ${duration} minutes
                    </small>
                    <div class="mt-2">${statusBadge}</div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }
};


/**
 * Owner Booking Management
 */
const OwnerBookingManagement = {

    async loadPendingRequests() {
        try {
            const requests = await API.getOwnerBookingRequests();
            return requests?.error ? [] : requests;
        } catch (err) {
            console.error(err);
            return [];
        }
    },

    getStatusBadge(status) {
        return BookingRequest.getStatusBadge(status);
    },

    formatDate(dateString) {
        return BookingRequest.formatDate(dateString);
    },

    getActionButtons(request) {
        switch (request.status) {
            case 'pending':
                return `
                    <button class="btn btn-sm btn-success"
                        onclick="OwnerBookingManagement.approveRequest('${request._id}'); location.reload();">
                        ✅ Approve
                    </button>
                    <button class="btn btn-sm btn-danger"
                        onclick="OwnerBookingManagement.rejectRequest('${request._id}'); location.reload();">
                        ❌ Reject
                    </button>
                `;
            case 'approved':
                return `
                    <button class="btn btn-sm btn-warning"
                        onclick="OwnerBookingManagement.startSession('${request._id}'); location.reload();">
                        ⚡ Start
                    </button>
                `;
            case 'session_active':
                return `
                    <button class="btn btn-sm btn-danger"
                        onclick="OwnerBookingManagement.endSession('${request._id}'); location.reload();">
                        🏁 End
                    </button>
                `;
            default:
                return '<span class="text-muted">No actions</span>';
        }
    },

    renderRequests(requests) {
        if (!requests || requests.length === 0) {
            return '<p class="text-muted">No pending booking requests.</p>';
        }

        let html = '<div class="list-group">';

        for (let req of requests) {
            const user = req.userId || {};
            const charger = req.chargerId || {};

            const userName = user.name || "Unknown User";
            const userEmail = user.email || "-";
            const userScore = user.greenScore ?? 0;

            const chargerName = charger.name || "Unknown Charger";
            const chargerLocation = charger.location || charger.address || "-";

            const statusBadge = this.getStatusBadge(req.status);
            const startDate = this.formatDate(req.startTime);
            const duration = (req.durationHours || 0) * 60;

            html += `
                <div class="list-group-item">
                    <h6><strong>${userName}</strong> - ${chargerName}</h6>
                    <small class="text-muted">
                        📍 ${chargerLocation}<br>
                        👤 Score: ${userScore} | 📧 ${userEmail}<br>
                        🕐 ${startDate}<br>
                        ⏱️ ${duration} minutes
                    </small>
                    <div class="mt-2">${statusBadge}</div>
                    <div class="mt-2">
                        ${this.getActionButtons(req)}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }
};
