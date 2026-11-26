/**
 * Room Model
 * Stores room project metadata, internal metric dimensions, geometry, and scan confidence.
 * All spatial dimensions are stored internally in meters.
 */
const mongoose = require('mongoose');

const ROOM_TYPES = [
  'Bedroom',
  'Living Room',
  'Kitchen',
  'Home Office',
  'Dining Room',
  'Bathroom',
  'Studio',
  'Other',
];

const SCAN_METHODS = ['unscanned', 'manual', 'ar_plane', 'ar_depth'];
const SCAN_STATUSES = ['draft', 'pending', 'manual_ready', 'scanned'];

const point2DSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      minlength: [2, 'Room name must be at least 2 characters'],
      maxlength: [80, 'Room name cannot exceed 80 characters'],
    },
    roomType: {
      type: String,
      enum: ROOM_TYPES,
      default: 'Bedroom',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    dimensions: {
      length: { type: Number, default: null }, // meters
      width: { type: Number, default: null }, // meters
      height: { type: Number, default: null }, // meters
      floorArea: { type: Number, default: null }, // square meters
      volume: { type: Number, default: null }, // cubic meters
      unit: { type: String, default: 'meters' },
    },
    geometry: {
      origin: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        z: { type: Number, default: 0 },
      },
      floorPolygon: { type: [point2DSchema], default: [] },
      walls: { type: [mongoose.Schema.Types.Mixed], default: [] },
      openings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    scanMethod: {
      type: String,
      enum: SCAN_METHODS,
      default: 'unscanned',
    },
    measurementSource: {
      type: String,
      enum: ['none', 'manual', 'sensor', 'hybrid'],
      default: 'none',
    },
    measurementConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    scanStatus: {
      type: String,
      enum: SCAN_STATUSES,
      default: 'draft',
    },
    objects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomObject',
      },
    ],
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ userId: 1, updatedAt: -1 });

roomSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id,
    userId: this.userId,
    roomName: this.roomName,
    roomType: this.roomType,
    notes: this.notes,
    dimensions: this.dimensions,
    geometry: this.geometry,
    scanMethod: this.scanMethod,
    measurementSource: this.measurementSource,
    measurementConfidence: this.measurementConfidence,
    scanStatus: this.scanStatus,
    objectCount: Array.isArray(this.objects) ? this.objects.length : 0,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Room', roomSchema);
module.exports.ROOM_TYPES = ROOM_TYPES;
