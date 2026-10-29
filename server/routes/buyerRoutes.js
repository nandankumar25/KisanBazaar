const express = require('express');
const router = express.Router();
const { getBuyers, getBuyerById, getMatchedBuyers } = require('../controllers/buyerController');

router.get('/', getBuyers);
router.get('/match/:cropLotId', getMatchedBuyers);
router.get('/:id', getBuyerById);

module.exports = router;
