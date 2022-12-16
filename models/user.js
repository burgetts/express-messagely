/** User class for message.ly */
const bcrypt = require('bcrypt')
const db = require('../db')
const ExpressError = require('../expressError')
const BCRYPT_WORK_FACTOR = 12

/** User of the site. */
class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
     // hash password
    const hashed_password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    // try to add user to database
    let resp = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
                               VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                               RETURNING username, password, first_name, last_name, phone`, [username, hashed_password, first_name, last_name, phone])
    // return {username, password, first_name, last_name, phone}
    return resp.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    // try to find user in database
    let resp = await db.query('SELECT username, password FROM users WHERE username = $1', [username])
    // if no user, return false
    if (resp.rows.length === 0 ){
      return false
    }
    // if user, compare passwords
    let user = resp.rows[0]
    if (await bcrypt.compare(password, user.password)){
      return true
    } else {
      return false
    }
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    let resp = await db.query(`UPDATE users
                               SET last_login_at = CURRENT_TIMESTAMP
                               WHERE username = $1 RETURNING username`, [username])
    if (resp.rows.length === 0) {
      throw new ExpressError(`User ${username} not found`, 404)
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    let resp = await db.query(`SELECT username, first_name, last_name, phone FROM users ORDER BY username`)
    return resp.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    let resp = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1`, [username])
    if (resp.rows.length === 0 ){
      throw new ExpressError(`User ${username} not found`, 404)
    }
    return resp.rows[0]
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    let resp = await db.query(`SELECT m.id, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone 
                         FROM messages as m 
                         JOIN users as u 
                         ON m.to_username = u.username
                         WHERE m.from_username = $1`, [username])
    return resp.rows?.map(row => ({
      id: row.id,
      to_user: {
        username: row.username,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone
      },
      body: row.body,
      sent_at: row.sent_at,
      read_at: row.read_at
    }))
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    let resp = await db.query(`SELECT m.id, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone
                               FROM messages as m
                               JOIN users as u 
                               ON m.from_username = u.username
                               WHERE m.to_username = $1`, [username])
    return resp.rows?.map(row => ({
      id: row.id,
      from_user: {
        username: row.username,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone
      },
      body: row.body,
      sent_at: row.sent_at,
      read_at: row.read_at
    }))
   }
}

module.exports = User;