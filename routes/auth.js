const express = require('express')
const router = new express.Router()
const jwt = require('jsonwebtoken')
const ExpressError = require('../expressError')
const User = require('../models/user')
const { SECRET_KEY } = require("../config");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req,res,next) => {
    try{
        // get username, password from request body
        const {username, password} = req.body
        // authenticate user
        if (await User.authenticate(username, password)) {
            User.updateLoginTimestamp(username)
            let token = jwt.sign({username}, SECRET_KEY)
            return res.json({token})
        } else {
        throw new ExpressError('Invalid username/password', 400)
        }
    } catch(err) {
        next(err)
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req,res,next) => {
    try {
        let {username} = await User.register(req.body)
        User.updateLoginTimestamp(username)
        let token = jwt.sign({username}, SECRET_KEY)
        return res.json({token})
    } catch (err) {
        next(err)
    }
})

module.exports = router;
