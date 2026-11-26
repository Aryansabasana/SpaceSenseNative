/**
 * Room Controller
 * Handles CRUD operations for user room projects with strict ownership checks.
 */
const mongoose = require('mongoose');
const Room = require('../models/Room');
const { validateAndBuildRoomGeometry } = require('../utils/roomGeometry');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createRoom(req, res) {
  try {
    const { roomName, roomType, notes } = req.body;

    if (!roomName || String(roomName).trim().length < 2) {
      return res.status(400).json({
        message: 'Room name is required and must be at least 2 characters.',
      });
    }

    const room = await Room.create({
      userId: req.user._id,
      roomName: String(roomName).trim(),
      roomType: roomType || 'Bedroom',
      notes: notes ? String(notes).trim() : '',
    });

    return res.status(201).json({
      message: 'Room project created successfully.',
      room: room.toClientJSON(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid room data.';
      return res.status(400).json({ message: firstMessage });
    }
    console.error('Create room error:', error);
    return res.status(500).json({ message: 'Server error while creating room.' });
  }
}

async function getRooms(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    if (req.query.roomType && req.query.roomType !== 'All') {
      filter.roomType = req.query.roomType;
    }

    if (req.query.search && String(req.query.search).trim()) {
      const pattern = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
      filter.roomName = pattern;
    }

    const [rooms, total, allUserRooms] = await Promise.all([
      Room.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Room.countDocuments(filter),
      Room.find({ userId: req.user._id }).select('dimensions scanStatus'),
    ]);

    let measuredCount = 0;
    let totalAreaSqM = 0;
    for (const item of allUserRooms) {
      const area = item.dimensions?.floorArea;
      if (typeof area === 'number' && area > 0) {
        measuredCount += 1;
        totalAreaSqM += area;
      }
    }

    return res.status(200).json({
      rooms: rooms.map((room) => room.toClientJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      stats: {
        totalRooms: allUserRooms.length,
        measuredRooms: measuredCount,
        totalAreaSqM: Number(totalAreaSqM.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    return res.status(500).json({ message: 'Server error while loading rooms.' });
  }
}

async function findOwnedRoom(roomId, userId) {
  if (!mongoose.isValidObjectId(roomId)) {
    return { errorStatus: 400, errorMessage: 'Invalid room ID format.' };
  }

  const room = await Room.findById(roomId);
  if (!room) {
    return { errorStatus: 404, errorMessage: 'Room project not found.' };
  }

  if (room.userId.toString() !== userId.toString()) {
    return { errorStatus: 403, errorMessage: 'You do not have access to this room.' };
  }

  return { room };
}

async function getRoomById(req, res) {
  try {
    const result = await findOwnedRoom(req.params.id, req.user._id);
    if (result.errorStatus) {
      return res.status(result.errorStatus).json({ message: result.errorMessage });
    }

    return res.status(200).json({ room: result.room.toClientJSON() });
  } catch (error) {
    console.error('Get room by ID error:', error);
    return res.status(500).json({ message: 'Server error while loading room details.' });
  }
}

async function updateRoom(req, res) {
  try {
    const result = await findOwnedRoom(req.params.id, req.user._id);
    if (result.errorStatus) {
      return res.status(result.errorStatus).json({ message: result.errorMessage });
    }

    const { room } = result;
    const { roomName, roomType, notes } = req.body;

    if (roomName !== undefined) {
      const trimmed = String(roomName).trim();
      if (trimmed.length < 2) {
        return res.status(400).json({ message: 'Room name must be at least 2 characters.' });
      }
      room.roomName = trimmed;
    }

    if (roomType !== undefined) {
      room.roomType = roomType;
    }

    if (notes !== undefined) {
      room.notes = String(notes).trim();
    }

    await room.save();

    return res.status(200).json({
      message: 'Room updated successfully.',
      room: room.toClientJSON(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstMessage = Object.values(error.errors)[0]?.message || 'Invalid room update.';
      return res.status(400).json({ message: firstMessage });
    }
    console.error('Update room error:', error);
    return res.status(500).json({ message: 'Server error while updating room.' });
  }
}

async function updateRoomMeasurements(req, res) {
  try {
    const result = await findOwnedRoom(req.params.id, req.user._id);
    if (result.errorStatus) {
      return res.status(result.errorStatus).json({ message: result.errorMessage });
    }

    const { length, width, height, openings = [] } = req.body;
    const validation = validateAndBuildRoomGeometry({
      length,
      width,
      height,
      openings,
    });

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const { room } = result;
    room.dimensions = validation.dimensions;
    room.geometry = validation.geometry;
    room.scanMethod = 'manual';
    room.measurementSource = 'manual';
    room.measurementConfidence = 0; // Manual entry is user-measured, not sensor-estimated
    room.scanStatus = 'manual_ready';

    await room.save();

    return res.status(200).json({
      message: 'Manual room geometry saved successfully.',
      room: room.toClientJSON(),
    });
  } catch (error) {
    console.error('Update measurements error:', error);
    return res.status(500).json({ message: 'Server error while saving room measurements.' });
  }
}

async function deleteRoom(req, res) {
  try {
    const result = await findOwnedRoom(req.params.id, req.user._id);
    if (result.errorStatus) {
      return res.status(result.errorStatus).json({ message: result.errorMessage });
    }

    await result.room.deleteOne();

    return res.status(200).json({
      message: 'Room project deleted successfully.',
    });
  } catch (error) {
    console.error('Delete room error:', error);
    return res.status(500).json({ message: 'Server error while deleting room.' });
  }
}

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  updateRoomMeasurements,
  deleteRoom,
};
