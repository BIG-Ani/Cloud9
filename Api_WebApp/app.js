var express = require("express"),
    app     = express(),
    
    request = require("request"),
    
    bodyParser = require("body-parser");
    
// express config
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:false}));

// routes
app.get("/", function(req, res) {
    res.send("Hi, there. Welcome to my assignment.");
})

// database
var friends = ["zhou", "li", "ning", "zhao", "guo"];

app.get("/speak/r/:animals", function(req, res) {
    var sound=null,
        animal = req.params.animals;
    
    if(animal === "cow")
        sound = "Moo";
    else if(animal === "pig")
        sound = "Oink";
    else if(animal === "dog")
        sound = "Woof woof";
        
    res.send(sound);
})

app.get("/repeat/:words/:repeatTimes", function(req, res){
  var word = req.params.words,
      times = Number(req.params.repeatTimes),
      result = "";
      
  for(var i=0; i<times; i++){
      result += word+" ";
  }
  
  res.send(result);
})

// past argus ex
app.get("/ex1/authorpass", function(req, res) {
    var arr = [
            {name: "历宁", author: "zhouleichen"},
            {name: "李玉婷", author: "zhouleichen"},
        ];
    
    res.render("posts", {posts: arr});
})

app.get("/ex1/authorpass/2", function(req, res){
    res.render("page2");
})

// post ex
app.get("/friends", function(req, res) {
    res.render("friends", {friends:friends});
})

// - post route
app.post("/addFriend", function(req, res){
    friends.push(req.body.newFriend);
    // res.send("You have reached the post route!");
    res.redirect("/friends");
})

// api application & request
app.get("/weather/search", function(req, res) {
    res.render("weather");
})

app.get("/weather", function(req, res) {
    var website = "http://api.openweathermap.org/data/2.5/weather?q=",
        city = req.query.q,
        appkey = "APPID=4f92c772196a22229d623e4e3490547b";

    console.log("the request query.q is: " + req.query.q);
    console.log("the request query is: " + req.query);
            
    var url = website+city+"&"+appkey;
    request(url, function(error, response, body){
        if(!error && response.statusCode == 200){
            var data = JSON.parse(body);
            res.render("result", {data:data});
        }
    })
})

//listner
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The server is starting...");
})