//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

// using the session
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://ttmgs:Windsor2000!!@cluster0.xoqvt.mongodb.net/userDB",
  { useNewUrlParser: true },
  { useUnifiedTopology: true },
);
mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema({
  email: String,
  Password: String,
  googleId: String,
  secret: String
});

// used to hash and salt passwords
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// serialize & deserialize
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
// google authentication
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile)
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/", function (req, res) {
  res.render("home");
});
// authentication with google using the user strategy
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);
// request made when google redirects user back to website
app.get('/auth/google/secrets', 
// authenticates user locally and if any probems redirects user back to login page
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login", function (req, res) {
  res.render("login");
});

//  passport method logs in a new user
app.post("/login", function (req, res) {
  
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/register", function (req, res) {
  res.render("register");
});

// renders secrets page 
app.get("/secrets", function (req, res) {
  // checks whole database if secrets is not equal to null if not null it will render the secrets
User.find(({"secret": {$ne: null}}, function(err, foundUsers){
  if (err){
    console.log(err)
  } else {
    if (foundUsers){
      res.render("secrets", {usersWithSecrets: foundUsers})
    }
  }
}))

});

app.get("/submit", function(req, res){
  if(req.isAuthenticated()){
     res.render("submit")
  } else {
    res.redirect("/login")
  }
});
app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret

  console.log(req.user)
  User.findById(req.user.id, function(err, foundUser){
    if (err){
      console.log(err)
    } else {
      if (foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        })
      }
    }
  })

})

app.get("/logout", function(req, res){
  req.logout();
  res.redirect('/');
})

app.post("/register", function (req, res) {
  // passport method registers a new user
  User.register({username: req.body.username }, req.body.password, function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("app is listening on http://localhost:" + port);
});






// common security
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

// swapping for bcrypt
// const md5 = require("md5");

// level 2 security
// const encrypt = require("mongoose-encryption")

// mongoose schema plugin // level 2 security
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["Password"]})
