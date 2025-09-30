const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
    },
    body: {
      type: String,
      required: [true, 'Content body is required']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    author_id: {
      type: String,
      required: [true, 'Author ID is required']
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    }
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
contentSchema.index({ title: 'text', body: 'text' });
contentSchema.index({ category: 1, status: 1 });
contentSchema.index({ author_id: 1 });

const Content = mongoose.model('Content', contentSchema);
module.exports = Content;