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
    database: "top_auth_basics",
    password: "115326",
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
app.get("/sign-up", (req, res) => res.render("sign-up-form"));

// makes the currentUser variable available in all of the views
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})

app.listen(3000, () => console.log("app listening on port 3000!"));