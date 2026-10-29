const express = require('express');
const router = express.Router();

// @route   GET /api/health
// @desc    Health check endpoint
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'KisanBazaar API is running'
  });
});

module.exports = router;
