require("dotenv").config();
const path = require("node:path");
const { Pool } = require("pg");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.render("index", { user: req.user });
});
app.get("/log-in", (req, res) => res.render("log-in-form"));
app.get("/sign-up", (req, res) => res.render("sign-up-form"));
app.post("/sign-up", async (req, res, next) => {
    try {
        const { username, password, first_name, last_name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query("INSERT INTO users (username, password, first_name, last_name) VALUES ($1, $2, $3, $4)", [username, hashedPassword, first_name, last_name]);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        return next(err)
    }
});

// makes the currentUser variable available in all of the views
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})

app.listen(3000, () => console.log("app listening on port 3000!"));