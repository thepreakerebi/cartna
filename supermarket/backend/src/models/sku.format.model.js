const mongoose = require('mongoose');

const skuFormatSchema = new mongoose.Schema({
  format: [{
    type: String,
    enum: ['CATEGORY', 'BRAND', 'SUPPLIER NAME', 'SUPPLIER CODE', 'WEIGHT', 'ID'],
    required: true
  }],
  separator: {
    type: String,
    default: '-'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supermarket',
    required: true
  }
}, {
  timestamps: true
});

// Ensure only one active format exists
skuFormatSchema.pre('save', async function(next) {
  if (this.active) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { active: false }
    );
  }
  next();
});

const SKUFormat = mongoose.model('SKUFormat', skuFormatSchema);

module.exports = SKUFormat;