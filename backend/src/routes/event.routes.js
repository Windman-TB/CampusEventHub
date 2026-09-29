const express = require('express');
const eventCtrl = require('../controllers/event.controller.js');

const router = express.Router();

// Public: Lấy chuyên đề
router.get('/categories', eventCtrl.getCategories);

// Organizer: Quản lý sự kiện
router.get('/organizer/events', eventCtrl.getOrganizerEvents);
router.post('/events', eventCtrl.createEvent);
router.get('/events/:id', eventCtrl.getEventById);
router.put('/events/:id', eventCtrl.updateEvent);
router.delete('/events/:id', eventCtrl.deleteEvent);

module.exports = router;