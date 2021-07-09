const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const encrypt = require("mongoose-encryption")

const app = express();

const PORT = process.env.PORT || 3000

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"))

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true}, { useUnifiedTopology: true });
 
const userSchema = new mongoose.Schema ({
  email: String,
  Password: String
});

const secret = "Thisisasecret";
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["Password"]})

const User = new mongoose.model("User", userSchema)






app.get("/", (req, res) =>{
  res.render("home")
})
app.get("/login", (req, res) =>{
  res.render("login")
})
app.post("/login", (req, res) =>{
  
 const username = req.body.username;
 const password = req.body.password;

  User.findOne({email: username}, function(err, foundUser) {
    if (err) {
      console.log(err)
    } else {
      if (foundUser) {
        if (foundUser.Password === password) {
          res.render("secrets")
        }
      }      
    }
  })
})

app.get("/register", (req, res) =>{
  res.render("register")
})

app.post("/register", (req, res)=>{

  const newUser = new User({
    email: req.body.username,
    Password: req.body.password
  })
  newUser.save(function(err){
    if (err){
       console.log("error registering")
    } else {
      res.render("secrets")
    }
  })

})










app.listen(PORT, function(){
  console.log("app is listening on http://localhost:" + PORT)
});