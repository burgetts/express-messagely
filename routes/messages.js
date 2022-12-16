const express = require('express')
const router = new express.Router()
const jwt = require('jsonwebtoken')
const ExpressError = require('../expressError')
const User = require('../models/user')
const Message = require('../models/message')
const { SECRET_KEY } = require("../config");
const {ensureLoggedIn, ensureCorrectUser} = require('../middleware/auth')

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in user is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try {
        const id = req.params.id
        const message = await Message.get(id)
        if ((message.from_user.username !== username) && (message.to_user.username !== username)){
            throw new ExpressError('Unauthorized', 401)
        }
        res.json({message})
    } catch (err) {
        next(err)
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        const {to_username, body} = req.body
        const message = await Message.create({from_username: req.user.username, to_username: to_username, body: body})
        return res.json({message})

    } catch (err) {
        next(err)
    }
} )

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        const id = req.params.id
        const message = await Message.get(id)
        if (req.user.username === message.to_username) {
            const readMessage = await Message.markRead(id)
            return res.json({message: readMessage})
        }
        throw new ExpressError('Unauthorized', 401)
    } catch (err) {
        next(err)
    }
})

module.exports = router;