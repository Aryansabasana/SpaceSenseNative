/**
 * Room Routes
 * All routes require a valid JWT token.
 */
const express = require('express');
const {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  updateRoomMeasurements,
  deleteRoom,
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', createRoom);
router.get('/', getRooms);
router.get('/:id', getRoomById);
router.put('/:id', updateRoom);
router.put('/:id/measurements', updateRoomMeasurements);
router.delete('/:id', deleteRoom);

module.exports = router;
