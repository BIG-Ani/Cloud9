var     express         = require("express"),
        app             = express(),
        
        mongoose        = require("mongoose"),
        Campground      = require("./models/campgrounds"),
        Comment         = require("./models/comments"),
        
        methodOverride  = require("method-override"),
        
        session         = require("express-session"),
        flash           = require("connect-flash"),
        
        User            = require("./models/users"),
        passport        = require("passport"),
        LocalStrategy   = require("passport-local"),
        
        seedDB          = require("./seeds"),
        
        bodyParser      = require("body-parser");
        
// ===== configuration
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static(__dirname+"/public"));

app.use(methodOverride("_method"));

app.use(flash());

// ===== local deploying mongodb - developer mode database
mongoose.connect("mongodb://localhost/hpcdb", {useNewUrlParser:true});
// ===== heroku deploying mongolab database - user mode database
// mongoose.connect("mongodb://zhouleichen:mongolab2019@ds211625.mlab.com:11625/yelpcamp", {useNewUrlParser:true});

app.use(session({
    secret:"baby face",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('ERROR');
    res.locals.success = req.flash('SUCCESS');
    next();
})

// ===== initialization
// seedDB(); // seed the database

// ===== ROUTES FOR CAMPGROUNDS
// -- LANDING
app.get("/", function(req,res){
    // res.send("landing page");
    res.render("campgrounds/landing");
})

// -- INDEX
app.get("/campgrounds", function(req, res){
    // res.send("campgrounds list");
    Campground.find({}, function(err, AllCampgrounds){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/campgrounds", {campgrounds:AllCampgrounds});
        }
    });
})

// -- NEW
app.get("/campgrounds/new",isLoggedIn, function(req, res) {
    res.render("campgrounds/new");
})
// -  CREATE
app.post("/campgrounds",isLoggedIn, function(req, res){
    var campgroundName      = req.body.name,
        imgUrl              = req.body.image,
        price               = req.body.price,
        descript            = req.body.description,
        user                = {id: req.user._id, username: req.user.username},
        
        newCampground       = {name:campgroundName, image:imgUrl, price:price, description:descript, author:user};
    
        Campground.create(newCampground, function(err, newlyCreated){
            if(err){
                console.log(err);
            } else {
                res.redirect("/campgrounds");
            }
        })
})

// -- SHOW
app.get("/campgrounds/:id", function(req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundedCampground){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/show", {campground:foundedCampground});
        }
    })
})

// ----- campground edit
app.get("/campgrounds/:id/edit", checkCampgroundOwnership, function(req, res) {
        Campground.findById(req.params.id, function(err, foundedCampground) {
            // handle this err by the middleware
            res.render("campgrounds/edit", {campground:foundedCampground});
        })
})

app.put("/campgrounds/:id",checkCampgroundOwnership, function(req, res){
    Campground.findOneAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds/"+updatedCampground._id);
        }
    })
})

// ----- campground destroy
app.delete("/campgrounds/:id",checkCampgroundOwnership, function(req, res){
    Campground.findOneAndDelete({"_id":req.params.id}, function(err){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }
        req.flash('SUCCESS','CAMPGROUND DELETED!');
        res.redirect("/campgrounds");
    })
})

// ===== COMMENTS
/*middleware:
 * isLoggedIn:
 * users can comment only if they log in, or they will not see this form
*/
app.get("/campgrounds/:id/comments/new",isLoggedIn, function(req, res) {
    // res.send("You have reached to a comment new page");
    Campground.findById(req.params.id, function(err, foundedCampground){
        if(err){
            console.log(err);
        } else{
            res.render("comments/new", {campground:foundedCampground});
        }
    })
})

app.post("/campgrounds/:id/comments",isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, foundedCampground) {
        if(err){
            console.log(err);
            res.redirect("campgrounds/campgrounds");
        } else {
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                } else {
                    
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    
                    foundedCampground.comments.push(comment);
                    
                    foundedCampground.save();
                    res.redirect("/campgrounds/"+foundedCampground._id);
                }
            })
            
        }
    })
})

// ----- comment update
app.get("/campgrounds/:id/comments/:comment_id/edit",checkCommentOwnerShip, function(req, res) {
    Comment.findById(req.params.comment_id, function(err, foundedComment) {
        if(err){
            console.log(err);
            res.redirect("back");
        } else {
            var campgroundId = req.params.id;
            res.render("comments/edit", {comment:foundedComment, campgroundId:campgroundId});
        }
    })
})

app.put("/campgrounds/:id/comments/:comment_id",checkCommentOwnerShip, function(req, res){
     Comment.findOneAndUpdate(
        {"_id": req.params.comment_id},
        {$set: req.body.comment},
        function(err){
            if (err) {
                console.log("* err: comment update route is wrong!!!");         // -- test
                console.log(err);
                res.redirect("back");
            } else {
                res.redirect("/campgrounds/" + req.params.id);                
            }
        });
})

app.delete("/campgrounds/:id/comments/:comment_id",checkCommentOwnerShip, function(req, res){
    Comment.findOneAndDelete({"_id": req.params.comment_id}, function(err) {
        if(err){
            console.log(err);
            res.redirect("back");
        } else {
            req.flash('SUCCESS','COMMENT DELETED!');
            res.redirect("/campgrounds/"+req.params.id);
        }
    })
})

// ===== AUTHEN
// ----- register
app.get("/register", function(req, res) {
    res.render("userAuth/register");
})

app.post("/register", function(req, res) {
    var newUser = new User({username:req.body.username});
        
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            
            req.flash('ERROR', err.message);
            res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash('SUCCESS', 'YOU HAVE REGISTED SUCCESSFULLY!');
            res.redirect("/campgrounds");
        });
    })
    
})

// ----- login
app.get("/login", function(req, res) {
    res.render("userAuth/login");
})

app.post("/login", passport.authenticate("local", {
        successRedirect:"/campgrounds",
        failureRedirect:"/login"
    }), function(req, res) {
    
})

// ----- logout
app.get("/logout", function(req, res) {
    req.logout();
    req.flash('SUCCESS', 'YOU LOGGED OUT!');
    res.redirect("/campgrounds");
})

// ===== MIDDLEWARE
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('ERROR', 'PLEASE LOG IN FIRST TO DO THAT!')
    res.redirect("/login");
}

function checkCampgroundOwnership(req, res, next){
    // 1. check if you log in
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundedCampground) {
            if(err){
                console.log(err);
                req.flash('ERROR','CAMPGROUND NOT FOUND');
                res.redirect("/campgrounds");
            } else {
                // 2. check if the currentUser is the provider of the campground
                if(foundedCampground.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash('ERROR','YOU DO NOT HAVE THE PERMISSION TO OPERATE THIS CAMPGROUND');
                    res.redirect("back");
                }
            }
        })
    } else {
        res.redirect("back");
    }
}

function checkCommentOwnerShip(req, res, next){
    // check if the user logged in
    if(req.isAuthenticated()){
        // check if the comment belonging to this user
        Comment.findById(req.params.comment_id, function(err, foundedComment) {
            if(err){
                console.log(err);
                res.redirect("back");
            } else{
                if(req.user._id.equals(foundedComment.author.id)){
                    next();
                } else {
                    res.redirect("back");
                }
            }
        })
    } else {
        res.redirect("back");
    }
}

// ===== listening
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The sever is starting...");
})