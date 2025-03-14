require("dotenv").config();
const path = require("node:path");
const { Pool } = require("pg");
const express = require("express");
const session = require("express-session");
const { body, validationResult } = require('express-validator');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const querystring = require('querystring');

const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});

const SECRET_CODE = "vanillatwinkie";
const ADMIN_CODE = "lemonsherbert";

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static('public'));

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

// makes the currentUser variable available in all of the views
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

// Home page route
app.get("/", async (req, res) => {
    const { rows } = await pool.query("SELECT messages.*, users.first_name, users.last_name, users.username FROM messages JOIN users ON messages.user_id = users.id ORDER BY messages.created_at DESC;");
    res.render("index", { user: req.user, messages: rows });
});

// Sign up routes
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.post("/sign-up", [
    // Validate password length
    body('password')
        .isLength({ min: 5 })
        .withMessage('Password must be at least 5 characters long'),
    // Validate password confirmation
    body('passwordConfirmation')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('sign-up-form', { 
                errors: errors.array(),
                user: req.body // Pass back the user input
            });
        }

        const { username, password, first_name, last_name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query("INSERT INTO users (username, password, first_name, last_name) VALUES ($1, $2, $3, $4)", 
            [username, hashedPassword, first_name, last_name]);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        return next(err)
    }
});

// Log in routes
app.get("/log-in", (req, res) => {
    const messages = req.session.messages || [];
    req.session.messages = [];
    res.render("log-in-form", { message: messages[messages.length - 1] });
});
app.post("/log-in",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/log-in",
        failureMessage: true
    })
);

// Log out routes
app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    })
});

// Secret code routes
app.get("/secret-code", (req, res) => res.render("secret-code-form", { valid: req.query.valid }));
app.post("/secret-code", async (req, res) => {
    const { code } = req.body;
    if (code === SECRET_CODE) {
        const { id } = req.user;
        await pool.query("UPDATE users SET is_member = TRUE WHERE id = $1", [id]);
        res.redirect("/");
    } else {
        const query = querystring.stringify({ valid: "false" });
        res.redirect(`/secret-code?${query}`);
    }
});

// Admin code routes
app.get("/admin-code", (req, res) => res.render("admin-code-form", { valid: req.query.valid }));
app.post("/admin-code", async (req, res) => {
    const { code } = req.body;
    if (code === ADMIN_CODE) {
        const { id } = req.user;
        await pool.query("UPDATE users SET is_admin = TRUE WHERE id = $1", [id]);
        res.redirect("/");
    } else {
        const query = querystring.stringify({ valid: "false" });
        res.redirect(`/admin-code?${query}`);
    }
});

// Delete message routes
app.get("/delete-message/:id", async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM messages WHERE message_id = $1", [id]);
    res.redirect("/");
});

// Add this middleware function to check if user is authenticated
const isAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/log-in");
};

// Protect both the GET and POST /new routes
app.get("/new", isAuth, (req, res) => res.render("new-message-form"));
app.post("/new", isAuth, async (req, res) => {
    const { message } = req.body;
    const { id } = req.user;
    await pool.query("INSERT INTO messages (message, user_id) VALUES ($1, $2)", [message, id]);
    res.redirect("/");
});

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
            const user = rows[0];

            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: "Incorrect password" });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        const user = rows[0];

        done(null, user);
    } catch (err) {
        done(err);
    }
});

app.listen(3000, () => console.log("app listening on port 3000!"));