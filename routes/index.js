var url = require('url')
var sqlite3 = require('sqlite3').verbose(); //verbose provides more detailed stack trace
var db = new sqlite3.Database('data/sqlite.db')

const express = require('express')
const https = require('https')
const PORT = process.env.PORT || 3000
const path = require('path')
const app = express()


db.serialize(function(){
    var sqlString = "CREATE TABLE IF NOT EXISTS users (userid TEXT PRIMARY KEY, password TEXT, role TEXT)";
    db.run(sqlString);
    sqlString = "CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, userid TEXT, movie_id TEXT, movie_title TEXT, rating INTEGER, review TEXT)";
    db.run(sqlString);
    sqlString = "INSERT OR REPLACE INTO users VALUES ('yunan', '123456', 'admin')";
    db.run(sqlString);
    sqlString = "INSERT OR REPLACE INTO users VALUES ('olivia', 'catdog', 'guest')";
    db.run(sqlString);
})


exports.index = function (request, response){
    response.render('index', { title: 'Movie Review'});
}

exports.submitReview = function (request, response){
    let { movie_id, movie_title, rating, review } = request.body
    let userid = request.user.userid
    
    var sql = "INSERT INTO reviews (userid, movie_id, movie_title, rating, review) VALUES (?, ?, ?, ?, ?)"
    // ? are placeholders for values

    db.run(sql, [userid, movie_id, movie_title, rating, review], function (err) {
        if (err) return res.send('error submitting review')
        response.redirect(`/reviews?movie_id=${movie_id}&movie_title=${movie_title}`)
    })
}

//read reviews for a movie
exports.reviewsForMovie = function (req, res) {
    let { movie_id, movie_title } = req.query
    const sql = "SELECT userid, rating, review FROM reviews WHERE movie_id = ?"
    db.all(sql, [movie_id], function(err, rows) {
        res.render('reviews', {
            title: `Reviews for ${movie_title}`,
            reviews: rows,
            movie_id,
            movie_title
        })
    })
}

exports.myreviews = function (req, res) {
    let uid = req.user.userid
    const sql = "SELECT movie_title, rating, review FROM reviews WHERE userid = ?"
    db.all(sql, [uid], function(err, rows) {
        res.render('myreviews', {
            title: `Reviews by ${uid}`,
            reviews: rows
        })
    })
}

//admin has privilege to know all users
exports.admin = function (req, res) {
    if (req.user.role != 'admin') {
        return res.status(403).send(`Access denied, you must be an admin to view this page.
                <br><form action="/" method="GET">
                <button class="back" type="submit">Back to Search</button></form>`)
    }

    db.all("SELECT userid, role FROM users", (err, rows) => {
        res.render('admin', { title: 'All Users', users: rows })
    })
    
}


exports.register = function (req, res) {
    const { userid, password } = req.body
    if (!userid || !password) {
        return res.render('index', { title: 'Movie Review', error: 'All fields are empty' })
    }
    
    let check = "SELECT * FROM users WHERE userid = ?"
    let sql = "INSERT INTO users (userid, password, role) VALUES (?, ?, 'guest')"

    db.get(check, [userid], function (err, row) {
        if (row) {
            return res.render('index', { title: 'Movie Review', error: 'User already exists, please use another name' })
        }

        db.run(sql, [userid, password], function (err) {
        if (err) {
            return res.render('index', { title: 'Movie Review', error: 'error' })
        }
        req.session.user = { userid, role: 'guest' }
        res.render('index', { title: 'Movie Review', user: req.session.user })
    })
    })
    
}

exports.login = function (req, res) {
    const { userid, password } = req.body
    
    let sql = "SELECT * FROM users WHERE userid = ? AND password = ?"
    db.get(sql, [userid, password], function (err, row) {
        if (!row) {
            return res.render('index', { title: 'Movie Review', error: 'Wrong credentials' })
        }
        req.session.user = row
        res.render('index', { title: 'Movie Review', user: row })
    })
}

exports.logout = function (req, res) {
    req.session.destroy(() => {
        res.redirect('/')
    })
}
