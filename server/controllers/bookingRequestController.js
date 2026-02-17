const BookingRequest = require('../models/BookingRequest');
const Booking = require('../models/Booking');
const Charger = require('../models/Charger');
const User = require('../models/User');


// =====================================================
// USER ACTIONS
// =====================================================

exports.createBookingRequest = async (req, res) => {
  try {
    const { chargerId, startTime, durationHours } = req.body;

    if (!chargerId || !startTime || !durationHours) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (durationHours < 0.5 || durationHours > 1.5) {
      return res.status(400).json({ message: 'Duration must be between 30 and 90 minutes' });
    }

    const charger = await Charger.findById(chargerId);
    if (!charger) {
      return res.status(404).json({ message: 'Charger not found' });
    }

    if (charger.availableSlots <= 0) {
      return res.status(400).json({ message: 'No available slots at this charger' });
    }

    const existingRequest = await BookingRequest.findOne({
      chargerId,
      startTime: new Date(startTime),
      userId: req.user.id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'You already have a pending request for this time slot'
      });
    }

    const bookingRequest = new BookingRequest({
      userId: req.user.id,
      chargerId,
      ownerId: charger.ownerId,
      startTime: new Date(startTime),
      durationHours,
      status: 'pending'
    });

    await bookingRequest.save();

    await bookingRequest.populate([
      { path: 'userId', select: 'name email greenScore' },
      { path: 'chargerId', select: 'name location address' },
      { path: 'ownerId', select: 'name email' }
    ]);

    console.log(`📋 Booking request created: ${bookingRequest._id}`);

    res.status(201).json({
      message: 'Booking request sent to owner',
      bookingRequest
    });

  } catch (err) {
    console.error('❌ Error creating booking request:', err);
    res.status(500).json({
      message: 'Failed to create booking request',
      error: err.message
    });
  }
};


exports.getUserBookingRequests = async (req, res) => {
  try {
    let requests = await BookingRequest.find({ userId: req.user.id })
      .populate('chargerId', 'name location address')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    requests = requests.filter(r => r.chargerId);

    res.json(requests);

  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch booking requests',
      error: err.message
    });
  }
};


exports.cancelBookingRequest = async (req, res) => {
  try {
    const request = await BookingRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    if (!['pending', 'rejected'].includes(request.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${request.status} request` });
    }

    request.status = 'cancelled';
    await request.save();

    res.json({ message: 'Booking request cancelled', request });

  } catch (err) {
    res.status(500).json({
      message: 'Failed to cancel booking request',
      error: err.message
    });
  }
};


// =====================================================
// OWNER ACTIONS
// =====================================================

exports.getOwnerBookingRequests = async (req, res) => {
  try {
    const chargers = await Charger.find({ ownerId: req.user.id });
    const chargerIds = chargers.map(c => c._id);

    let requests = await BookingRequest.find({
      chargerId: { $in: chargerIds }
    })
      .populate('userId', 'name email greenScore')
      .populate('chargerId', 'name location address')
      .sort({ createdAt: -1 });

    // Remove corrupted references
    requests = requests.filter(r => r.userId && r.chargerId);

    console.log(`📋 Owner booking requests loaded: ${requests.length}`);

    res.json(requests);

  } catch (err) {
    console.error('❌ Error fetching owner booking requests:', err);
    res.status(500).json({
      message: 'Failed to fetch booking requests',
      error: err.message
    });
  }
};


exports.approveBookingRequest = async (req, res) => {
  try {
    const request = await BookingRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    if (request.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve ${request.status} request` });
    }

    const charger = await Charger.findById(request.chargerId);
    if (!charger || charger.availableSlots <= 0) {
      return res.status(400).json({ message: 'No available slots' });
    }

    const endTime = new Date(
      new Date(request.startTime).getTime() +
      request.durationHours * 60 * 60 * 1000
    );

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

    charger.availableSlots -= 1;
    await charger.save();

    const user = await User.findById(request.userId);
    if (user) {
      user.totalChargingTime += request.durationHours;
      user.totalSessions = (user.totalSessions || 0) + 1;
      user.estimatedCO2Saved = (user.estimatedCO2Saved || 0) + 1.2;
      user.greenScore = Math.min(100, (user.greenScore || 50) + greenPoints);
      await user.save();
    }

    await booking.save();

    request.status = 'approved';
    request.bookingId = booking._id;
    request.approvedAt = new Date();
    await request.save();

    res.json({
      message: 'Booking approved',
      request,
      booking
    });

  } catch (err) {
    console.error('❌ Error approving booking request:', err);
    res.status(500).json({
      message: 'Failed to approve booking request',
      error: err.message
    });
  }
};
