const BookingRequest = require('../models/BookingRequest');
const Booking = require('../models/Booking');
const Charger = require('../models/Charger');
const User = require('../models/User');

// ===========================
// USER ACTIONS
// ===========================

/**
 * User sends a booking request to owner
 */
exports.createBookingRequest = async (req, res) => {
  try {
    const { chargerId, startTime, durationHours } = req.body;

    // Validate input
    if (!chargerId || !startTime || !durationHours) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate duration (30-90 minutes)
    if (durationHours < 0.5 || durationHours > 1.5) {
      return res.status(400).json({ message: 'Duration must be between 30 and 90 minutes' });
    }

    // Check if charger exists
    const charger = await Charger.findById(chargerId);
    if (!charger) {
      return res.status(404).json({ message: 'Charger not found' });
    }

    // Check if charger has available slots
    if (charger.availableSlots <= 0) {
      return res.status(400).json({ message: 'No available slots at this charger' });
    }

    // Check for existing pending request at same time
    const existingRequest = await BookingRequest.findOne({
      chargerId,
      startTime: new Date(startTime),
      userId: req.user.id,
      status: 'pending'
    })
    .populate('userId')
    .populate('chargerId');


    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this time slot' });
    }

    // Create booking request
    const bookingRequest = new BookingRequest({
      userId: req.user.id,
      chargerId,
      ownerId: charger.ownerId,
      startTime: new Date(startTime),
      durationHours,
      status: 'pending'
    });

    await bookingRequest.save();

    // Populate for response
    await bookingRequest.populate(['userId', 'chargerId', 'ownerId']);

    console.log(`📋 Booking request created: ${req.user.id} for charger ${chargerId}`);

    res.status(201).json({
      message: 'Booking request sent to owner',
      bookingRequest
    });
  } catch (err) {
    console.error('❌ Error creating booking request:', err);
    res.status(500).json({ message: 'Failed to create booking request', error: err.message });
  }
};

/**
 * Get pending booking requests for a user
 */
exports.getUserBookingRequests = async (req, res) => {
  try {
    const requests = await BookingRequest.find({ userId: req.user.id })
      .populate('chargerId')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch booking requests', error: err.message });
  }
};

/**
 * User cancels a pending booking request
 */
exports.cancelBookingRequest = async (req, res) => {
  try {
    const request = await BookingRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify ownership
    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to cancel this request' });
    }

    // Can only cancel pending or rejected requests
    if (!['pending', 'rejected'].includes(request.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${request.status} request` });
    }

    request.status = 'cancelled';
    await request.save();

    console.log(`🚫 Booking request cancelled: ${req.user.id}`);

    res.json({ message: 'Booking request cancelled', request });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel booking request', error: err.message });
  }
};

// ===========================
// OWNER ACTIONS
// ===========================

/**
 * Get all pending booking requests for owner's chargers
 */
exports.getOwnerBookingRequests = async (req, res) => {
  try {
    // Get all chargers owned by this owner
    const chargers = await Charger.find({ ownerId: req.user.id });
    const chargerIds = chargers.map(c => c._id);

    // Get booking requests for these chargers
    const requests = await BookingRequest.find({ 
      chargerId: { $in: chargerIds }
    })
      .populate('userId', 'name email greenScore')
      .populate('chargerId', 'name location')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch booking requests', error: err.message });
  }
};

/**
 * Owner approves a booking request and creates actual booking
 */
exports.approveBookingRequest = async (req, res) => {
  try {
    const request = await BookingRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify owner
    if (request.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to approve this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve a ${request.status} request` });
    }

    // Check if charger still has available slots
    const charger = await Charger.findById(request.chargerId);
    if (!charger || charger.availableSlots <= 0) {
      return res.status(400).json({ message: 'No available slots at this charger anymore' });
    }

    // Calculate end time
    const endTime = new Date(new Date(request.startTime).getTime() + request.durationHours * 60 * 60 * 1000);

    // Create actual booking
    const greenPoints = 10;
    const booking = new Booking({
      userId: request.userId,
      chargerId: request.chargerId,
      startTime: request.startTime,
      endTime,
      durationHours: request.durationHours,
      greenPointsEarned: greenPoints,
      status: 'active'
    });

    // Decrease available slots
    charger.availableSlots -= 1;
    await charger.save();

    // Update user stats
    const user = await User.findById(request.userId);
    user.totalChargingTime += request.durationHours;
    user.totalSessions = (user.totalSessions || 0) + 1;
    user.estimatedCO2Saved = (user.estimatedCO2Saved || 0) + 1.2;
    user.greenScore = Math.min(100, (user.greenScore || 50) + greenPoints);
    await user.save();

    await booking.save();

    // Update request
    request.status = 'approved';
    request.bookingId = booking._id;
    request.approvedAt = new Date();
    await request.save();

    console.log(`✅ Booking request approved: ${request._id}`);

    res.json({
      message: 'Booking request approved and session ready to start',
      request,
      booking,
      greenPointsEarned: greenPoints
    });
  } catch (err) {
    console.error('❌ Error approving booking request:', err);
    res.status(500).json({ message: 'Failed to approve booking request', error: err.message });
  }
};

/**
 * Owner rejects a booking request
 */
exports.rejectBookingRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await BookingRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify owner
    if (request.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Cannot reject a ${request.status} request` });
    }

    request.status = 'rejected';
    request.rejectionReason = reason || 'No reason provided';
    await request.save();

    console.log(`❌ Booking request rejected: ${request._id}`);

    res.json({ message: 'Booking request rejected', request });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject booking request', error: err.message });
  }
};

/**
 * Owner starts a charging session
 */
exports.startChargingSession = async (req, res) => {
  try {
    const request = await BookingRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify owner
    if (request.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to manage this request' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: `Cannot start session for a ${request.status} request` });
    }

    // Update request
    request.status = 'session_active';
    request.sessionStartTime = new Date();
    request.sessionStartedAt = new Date();
    await request.save();

    console.log(`⚡ Charging session started: ${request._id}`);

    res.json({
      message: 'Charging session started',
      request
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start charging session', error: err.message });
  }
};

/**
 * Owner ends a charging session
 */
exports.endChargingSession = async (req, res) => {
  try {
    const request = await BookingRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify owner
    if (request.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to manage this request' });
    }

    if (request.status !== 'session_active') {
      return res.status(400).json({ message: `Cannot end session for a ${request.status} request` });
    }

    // Update request
    request.status = 'session_ended';
    request.sessionEndTime = new Date();
    request.sessionEndedAt = new Date();
    await request.save();

    // Update associated booking
    if (request.bookingId) {
      const booking = await Booking.findById(request.bookingId);
      if (booking) {
        booking.status = 'completed';
        await booking.save();
      }
    }

    // Free up slot
    const charger = await Charger.findById(request.chargerId);
    if (charger) {
      charger.availableSlots += 1;
      await charger.save();
    }

    console.log(`🏁 Charging session ended: ${request._id}`);

    res.json({
      message: 'Charging session ended successfully',
      request
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to end charging session', error: err.message });
  }
};

/**
 * Owner cancels an approved session (before it starts)
 */
exports.cancelApprovedSession = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await BookingRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify owner
    if (request.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to manage this request' });
    }

    if (!['approved', 'session_active'].includes(request.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${request.status} request` });
    }

    request.status = 'session_cancelled';
    request.rejectionReason = reason || 'Session cancelled by owner';
    await request.save();

    // Cancel associated booking
    if (request.bookingId) {
      const booking = await Booking.findById(request.bookingId);
      if (booking) {
        booking.status = 'cancelled';
        await booking.save();

        // Deduct green points
        const user = await User.findById(booking.userId);
        if (user) {
          user.greenScore = Math.max(0, user.greenScore - booking.greenPointsEarned);
          await user.save();
        }
      }
    }

    // Free up slot
    const charger = await Charger.findById(request.chargerId);
    if (charger) {
      charger.availableSlots += 1;
      await charger.save();
    }

    console.log(`🚫 Session cancelled: ${request._id}`);

    res.json({
      message: 'Session cancelled successfully',
      request
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel session', error: err.message });
  }
};

/**
 * Get specific booking request details
 */
exports.getBookingRequestDetail = async (req, res) => {
  try {
    const request = await BookingRequest.findById(req.params.id)
      .populate('userId', 'name email greenScore')
      .populate('chargerId', 'name location address')
      .populate('ownerId', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify user has permission to view
    if (request.userId.toString() !== req.user.id && request.ownerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to view this request' });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch booking request', error: err.message });
  }
};
