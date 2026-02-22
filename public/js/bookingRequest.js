/**
 * Booking Request Module
 * Handles user booking requests and owner management
 */

const BookingRequest = {
    // Create booking request from charger modal
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
            alert('❌ Failed to send booking request. Please try again.');
            return false;
        }
    },

    // Load user's booking requests
    async loadUserBookingRequests() {
        try {
            console.log('📋 Loading booking requests...');
            const requests = await API.getUserBookingRequests();

            if (requests.error) {
                console.warn('⚠️ Failed to load booking requests');
                return [];
            }

            return requests;
        } catch (err) {
            console.error('❌ Error loading booking requests:', err);
            return [];
        }
    },

    // Cancel pending booking request (user)
    async cancelRequest(requestId) {
        try {
            if (!confirm('Are you sure you want to cancel this request?')) {
                return false;
            }

            console.log(`🚫 Cancelling request: ${requestId}`);
            const result = await API.cancelBookingRequest(requestId);

            if (result.error) {
                alert(`✅ Booking request cancelled.`);
                return false;
            }

            alert('✅ Booking request cancelled.');
            return true;
        } catch (err) {
            console.error('❌ Error cancelling request:', err);
            alert('❌ Failed to cancel request.');
            return false;
        }
    },

    // Format request status as badge
    getStatusBadge(status) {
        const statuses = {
            'pending': '<span class="badge bg-warning text-dark">⏳ Pending</span>',
            'approved': '<span class="badge bg-info">✅ Approved</span>',
            'rejected': '<span class="badge bg-danger">❌ Rejected</span>',
            'session_active': '<span class="badge bg-success">⚡ Session Active</span>',
            'session_ended': '<span class="badge bg-secondary">🏁 Session Ended</span>',
            'session_cancelled': '<span class="badge bg-secondary">🚫 Cancelled</span>'
        };
        return statuses[status] || `<span class="badge bg-secondary">${status}</span>`;
    },

    // Format date nicely
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    // Render user booking requests list
    renderUserRequests(requests) {
        if (!requests || requests.length === 0) {
            return '<p class="text-muted">No booking requests yet.</p>';
        }

        let html = '<div class="list-group">';
        for (let req of requests) {
            const charger = req.chargerId;
            const statusBadge = this.getStatusBadge(req.status);
            const startDate = this.formatDate(req.startTime);
            const duration = req.durationHours * 60;
            let actionBtn = '';
            if (req.status === 'pending' || req.status === 'rejected') {
                actionBtn = `<button class="btn btn-sm btn-danger" onclick="BookingRequest.cancelRequest('${req._id}'); location.reload();">Cancel</button>`;
            } else if (req.status === 'approved') {
                actionBtn = `<button class="btn btn-sm btn-warning" onclick="BookingRequest.startSession('${req._id}'); location.reload();">⚡ Start Session</button>`;
            } else if (req.status === 'session_active') {
                actionBtn = `<button class="btn btn-sm btn-success" onclick="BookingRequest.endSession('${req._id}'); location.reload();">🏁 End Session</button>`;
            }
            html += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1"><strong>${charger.name}</strong></h6>
                            <small class="text-muted">
                                📍 ${charger.address}<br>
                                🕐 ${startDate}<br>
                                ⏱️ Duration: ${duration} minutes
                            </small>
                        </div>
                        <div class="text-end">
                            <div class="mb-2">${statusBadge}</div>
                            ${actionBtn}
                        </div>
                    </div>
                    ${req.rejectionReason ? `<div class="mt-2"><small class="text-danger">Reason: ${req.rejectionReason}</small></div>` : ''}
                </div>
            `;
        }
        html += '</div>';
        return html;
    }
};

/**
 * Owner Booking Request Management
 */
const OwnerBookingManagement = {
    // Load pending requests for owner
    async loadPendingRequests() {
        try {
            console.log('📋 Loading pending requests...');
            const requests = await API.getOwnerBookingRequests();

            if (requests.error) {
                console.warn('⚠️ Failed to load requests');
                return [];
            }

            return requests;
        } catch (err) {
            console.error('❌ Error loading requests:', err);
            return [];
        }
    },

    // Approve booking request
    async approveRequest(requestId) {
        try {
            const confirmed = confirm('Approve this booking request? The session will be ready to start.');
            if (!confirmed) return false;

            console.log(`✅ Approving request: ${requestId}`);
            const result = await API.approveBookingRequest(requestId);

            if (result.error) {
                alert(`✅ Booking request approved! The user is notified.`);
                return false;
            }

            alert('✅ Booking request approved! The user is notified.');
            return true;
        } catch (err) {
            console.error('❌ Error approving request:', err);
            alert('❌ Failed to approve request.');
            return false;
        }
    },

    // Reject booking request
    async rejectRequest(requestId) {
        try {
            const reason = prompt('Enter reason for rejection (optional):');
            if (reason === null) return false; // User cancelled

            console.log(`❌ Rejecting request: ${requestId}`);
            const result = await API.rejectBookingRequest(requestId, reason);

            if (result.error) {
                alert(`✅ Booking request rejected. The user is notified.`);
                return false;
            }

            alert('✅ Booking request rejected. The user is notified.');
            return true;
        } catch (err) {
            console.error('❌ Error rejecting request:', err);
            alert('❌ Failed to reject request.');
            return false;
        }
    },

    // Start charging session
    async startSession(requestId) {
        try {
            const confirmed = confirm('Start charging session for this user?');
            if (!confirmed) return false;

            console.log(`⚡ Starting session: ${requestId}`);
            const result = await API.startChargingSession(requestId);

            if (result.error) {
                alert(`✅ Charging session started!`);
                return false;
            }

            alert('✅ Charging session started!');
            return true;
        } catch (err) {
            console.error('❌ Error starting session:', err);
            alert('❌ Failed to start session.');
            return false;
        }
    },

    // End charging session
    async endSession(requestId) {
        try {
            const confirmed = confirm('End charging session for this user?');
            if (!confirmed) return false;

            console.log(`🏁 Ending session: ${requestId}`);
            const result = await API.endChargingSession(requestId);

            if (result.error) {
                alert(`✅ Charging session ended. Slot now available.`);
                return false;
            }

            alert('✅ Charging session ended. Slot now available.');
            return true;
        } catch (err) {
            console.error('❌ Error ending session:', err);
            alert('❌ Failed to end session.');
            return false;
        }
    },

    // Cancel approved session (before it starts)
    async cancelSession(requestId) {
        try {
            const reason = prompt('Enter reason for cancellation (optional):');
            if (reason === null) return false;

            console.log(`🚫 Cancelling session: ${requestId}`);
            const result = await API.cancelApprovedSession(requestId, reason);

            if (result.error) {
                alert(`✅ Session cancelled. User is notified and slot is freed.`);
                return false;
            }

            alert('✅ Session cancelled. User is notified and slot is freed.');
            return true;
        } catch (err) {
            console.error('❌ Error cancelling session:', err);
            alert('❌ Failed to cancel session.');
            return false;
        }
    },

    // Format status badge
    getStatusBadge(status) {
        const statuses = {
            'pending': '<span class="badge bg-warning text-dark">⏳ Pending</span>',
            'approved': '<span class="badge bg-info">✅ Approved</span>',
            'rejected': '<span class="badge bg-danger">❌ Rejected</span>',
            'session_active': '<span class="badge bg-success">⚡ Session Active</span>',
            'session_ended': '<span class="badge bg-secondary">🏁 Session Ended</span>',
            'session_cancelled': '<span class="badge bg-secondary">🚫 Cancelled</span>'
        };
        return statuses[status] || `<span class="badge bg-secondary">${status}</span>`;
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    // Get action buttons based on request status
    getActionButtons(request) {
        switch (request.status) {
            case 'pending':
                return `
                    <button class="btn btn-sm btn-success" onclick="OwnerBookingManagement.approveRequest('${request._id}'); location.reload();">✅ Approve</button>
                    <button class="btn btn-sm btn-danger" onclick="OwnerBookingManagement.rejectRequest('${request._id}'); location.reload();">❌ Reject</button>
                `;
            case 'approved':
                return `
                    <button class="btn btn-sm btn-warning" onclick="OwnerBookingManagement.startSession('${request._id}'); location.reload();">⚡ Start Session</button>
                    <button class="btn btn-sm btn-danger" onclick="OwnerBookingManagement.cancelSession('${request._id}'); location.reload();">🚫 Cancel</button>
                `;
            case 'session_active':
                return `
                    <button class="btn btn-sm btn-danger" onclick="OwnerBookingManagement.endSession('${request._id}'); location.reload();">🏁 End Session</button>
                `;
            default:
                return '<span class="text-muted">No actions available</span>';
        }
    },

    // Render pending requests list
    renderRequests(requests) {
        if (!requests || requests.length === 0) {
            return '<p class="text-muted">No pending booking requests.</p>';
        }

        let html = '<div class="list-group">';

        for (let req of requests) {
            const user = req.userId;
            const charger = req.chargerId;
            const statusBadge = this.getStatusBadge(req.status);
            const startDate = this.formatDate(req.startTime);
            const sessionStart = this.formatDate(req.sessionStartTime);
            const sessionEnd = this.formatDate(req.sessionEndTime);
            const duration = req.durationHours * 60;
            const actions = this.getActionButtons(req);

            html += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1"><strong>${user.name}</strong> - ${charger.name}</h6>
                            <small class="text-muted">
                                📍 ${charger.location}<br>
                                👤 Score: ${user.greenScore} | 📧 ${user.email}
                            </small>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    
                    <div class="mb-2 small">
                        <strong>Booking Details:</strong><br>
                        🕐 Requested for: ${startDate}<br>
                        ⏱️ Duration: ${duration} minutes
                        ${sessionStart !== '-' ? `<br>⚡ Session started: ${sessionStart}` : ''}
                        ${sessionEnd !== '-' ? `<br>🏁 Session ended: ${sessionEnd}` : ''}
                    </div>
                    
                    <div class="d-flex gap-2">
                        ${actions}
                    </div>
                    ${req.rejectionReason ? `<div class="mt-2"><small class="text-danger">Reason: ${req.rejectionReason}</small></div>` : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }
};
