const Content = require("../models/contentModel");
const User = require("../models/userModel");

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
};

// Helper function to get author details
const getAuthorDetails = async (userId) => {
  const user = await User.findOne({ userId }).select("name email userId");
  if (!user) {
    return null;
  }
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
  };
};

// @desc    Create new content
// @route   POST /api/content
// @access  Private (requires content access)
exports.createContent = async (req, res) => {
  try {
    const { title, slug, body, category, tags, status } = req.body;

    // Validate required fields
    if (!title || !body || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: title, body, category",
      });
    }

    // Generate slug if not provided
    const finalSlug = slug || generateSlug(title);

    // Check if slug already exists
    const existingContent = await Content.findOne({ slug: finalSlug });
    if (existingContent) {
      return res.status(400).json({
        success: false,
        message: "A post with this slug already exists",
      });
    }

    // Create new content with logged-in user's userId as author
    const content = new Content({
      title,
      slug: finalSlug,
      body,
      category,
      tags: tags || [],
      author_id: req.user.userId,
      status: status || "draft",
    });

    await content.save();

    // Get author details
    const authorDetails = await getAuthorDetails(content.author_id);

    // Return content with author details
    const contentWithAuthor = {
      _id: content._id,
      title: content.title,
      slug: content.slug,
      body: content.body,
      category: content.category,
      tags: content.tags,
      author_id: content.author_id,
      author: authorDetails,
      status: content.status,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: "Content created successfully",
      data: contentWithAuthor,
    });
  } catch (error) {
    console.error("Error creating content:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all content
// @route   GET /api/content
// @access  Public
exports.getAllContent = async (req, res) => {
  try {
    const { category, status, tags, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (tags) query.tags = { $in: tags.split(",") };

    const skip = (page - 1) * limit;

    const contents = await Content.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Content.countDocuments(query);

    // Get author details for each content
    const contentsWithAuthors = await Promise.all(
      contents.map(async (content) => {
        const authorDetails = await getAuthorDetails(content.author_id);
        return {
          _id: content._id,
          title: content.title,
          slug: content.slug,
          body: content.body,
          category: content.category,
          tags: content.tags,
          author_id: content.author_id,
          author: authorDetails,
          status: content.status,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: contentsWithAuthors.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: contentsWithAuthors,
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get content by slug
// @route   GET /api/content/slug/:slug
// @access  Public
exports.getContentBySlug = async (req, res) => {
  try {
    const content = await Content.findOne({ slug: req.params.slug });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    // Get author details
    const authorDetails = await getAuthorDetails(content.author_id);

    const contentWithAuthor = {
      _id: content._id,
      title: content.title,
      slug: content.slug,
      body: content.body,
      category: content.category,
      tags: content.tags,
      author_id: content.author_id,
      author: authorDetails,
      status: content.status,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: contentWithAuthor,
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get content by ID
// @route   GET /api/content/:id
// @access  Public
exports.getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    // Get author details
    const authorDetails = await getAuthorDetails(content.author_id);

    const contentWithAuthor = {
      _id: content._id,
      title: content.title,
      slug: content.slug,
      body: content.body,
      category: content.category,
      tags: content.tags,
      author_id: content.author_id,
      author: authorDetails,
      status: content.status,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: contentWithAuthor,
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private (requires content access)
exports.updateContent = async (req, res) => {
  try {
    const { title, slug, body, category, tags, status } = req.body;

    let content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    // Check if user is author or admin
    if (content.author_id !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this content",
      });
    }

    // If slug is being updated, check for duplicates
    if (slug && slug !== content.slug) {
      const existingContent = await Content.findOne({ slug });
      if (existingContent) {
        return res.status(400).json({
          success: false,
          message: "A post with this slug already exists",
        });
      }
    }

    // Update fields
    if (title) content.title = title;
    if (slug) content.slug = slug;
    if (body) content.body = body;
    if (category) content.category = category;
    if (tags) content.tags = tags;
    if (status) content.status = status;

    await content.save();

    // Get author details
    const authorDetails = await getAuthorDetails(content.author_id);

    const contentWithAuthor = {
      _id: content._id,
      title: content.title,
      slug: content.slug,
      body: content.body,
      category: content.category,
      tags: content.tags,
      author_id: content.author_id,
      author: authorDetails,
      status: content.status,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Content updated successfully",
      data: contentWithAuthor,
    });
  } catch (error) {
    console.error("Error updating content:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private (Admin only)
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    // Check if user is author or admin
    if (content.author_id !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this content",
      });
    }

    await content.deleteOne();

    res.status(200).json({
      success: true,
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
