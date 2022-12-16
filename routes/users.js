const express = require('express')
const router = new express.Router()
const jwt = require('jsonwebtoken')
const ExpressError = require('../expressError')
const User = require('../models/user')
const { SECRET_KEY } = require("../config");
const {ensureLoggedIn, ensureCorrectUser} = require('../middleware/auth')

/** GET / - get list of users. (any logged in user can see)
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const users = await User.all()
        return res.json({users})
    } catch (err) {
        next(err)
    }
})

/** GET /:username - get detail of users. (only :username can see)
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureCorrectUser, async (req, res, next) => {
    try {
        const username = req.params.username
        const user = await User.get(username)
        return res.json({user})
    } catch (err) {
        next(err)
    }
})

/** GET /:username/to - get messages to user (only :username can see)
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureCorrectUser, async (req, res, next) => {
    try {
        const username = req.params.username
        let messages = await User.messagesTo(username)
        return res.json({messages})
    } catch (err) {
        next(err)
    }
})

/** GET /:username/from - get messages from user (only :username can see)
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureCorrectUser, async (req,res,next) => {
    try {
        const username = req.params.username
        let messages = await User.messagesFrom(username)
        return res.json({messages})
    } catch (err) {
        next(err)
    }
} )
module.exports = router;
