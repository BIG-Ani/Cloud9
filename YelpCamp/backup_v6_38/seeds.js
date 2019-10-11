var mongoose        = require("mongoose"),
    Campground      = require("./models/campgrounds"),
    Comment         = require("./models/comments");
    
var data = [
        {
            name:"蒿杰",
            image:"https://www.ccf.org.cn/upload/resources/image/2019/03/06/94570_500x333.jpg",
            description:"中国科学院自动化研究所研究员"
        },
        {
            name:"milky way",
            image:"https://github.com/BIG-Ani/pic_src/blob/master/Milky%20way%20in%20nature%20photography.jpg?raw=true",
            description:"Milky way in nature photography"
        },
        {
            name:"black hoel influence",
            image:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/BlackHole_Lensing.gif/220px-BlackHole_Lensing.gif",
            description:"the light slides through a black hole"
        },
        {
            name:"real blakc hole",
            image:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Black_hole_-_Messier_87_%28cropped%29.jpg/800px-Black_hole_-_Messier_87_%28cropped%29.jpg",
            description:"the first picture of the black hole in the universe"
        }
    ];
    
function DB(){
    Campground.deleteMany({}, function(err){
        if(err){
            console.log(err);
        } else {
            data.forEach(function(seed){
                Campground.create(seed, function(err, campground){
                    if(err){
                        console.log(err);
                    } else {
                        // console.log("The column of data has been added");
                        
                        Comment.create({
                            text:"This is a great place, but I wish there was internet",
                            author:"zhao"
                        }, function(err, comment){
                            if(err){
                                console.log(err);
                            } else {
                                
                                campground.comments.push(comment);
                                campground.save();
                                // console.log("create an init comment")
                            }
                        })
                    }
                })
            })
            
            console.log("The database has been initialized.");
        }
    })
}    

module.exports = DB;