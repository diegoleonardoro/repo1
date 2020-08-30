

const WebSocket = require("ws");
const express = require("express");
const fs = require("file-system");  // This will be used to read and write to files. 
const bodyParser = require("body-parser");  // This is a MiddleWare. It lets us read and request bodies
const mustache = require("mustache-express");
const util = require("util");
const multer = require("multer"); // Node.js Middleware for handling. It is primarily used for uploading files.
const GridFsStorage = require("multer-gridfs-storage");
const path = require("path");
const mongoose = require("mongoose");
const ejs = require("ejs");

// const nodeGeocoder = require('node-geocoder');
// const HereMapsAPI = require('here-maps-node').default;



//Express:

const app = express() // we call express the funciton, and now through "app" we are able to access all the methods inside the express function
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Is this setting "json" as the default protocol for data exchange between the client and the server????
app.use(express.static(__dirname + "/")); // Here we are poiting to the path where all the static files are located. 
// The previous line of code is the that allowing us to use "index.html" as out root template.



// The view engine (the presentation layer): 
//app.engine("html", mustache());

app.set("view engine", "ejs"); //<=== Here we are saying that we will be rendering an "html" file.  
app.set("views", "./views"); // <=== This is the folder where the "index.html" file is located 

app.get("/", function (req, res) { // This is sayin that when the user gets to the route "/" we will render the "index.html" file
    res.render("index.html") //<=== Here we are rendering the "index.html" file
    res.end();
})





// ======  CONNECT TO THE DATABASE USING MONGOOSE ====== //

mongoose.connect("mongodb://127.0.0.1:27017/photoUpload", { useNewUrlParser: true, useUnifiedTopology: true },
    () => {
        console.log("connected")
    });

// ====== CREATE A SCHEMA WITH MONGOOSE  ====== //
// == OUR DATA TYPE FOR THE IMAGE IS BUFFER == //


var imageSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    coordinates: {
        type: Array,
        required: true

    },
    placeMeaning: {
        type: String,
        required: true
    },

    img: {
        data: Buffer,
        contentType: String,
    }


});

var Image = new mongoose.model("Image", imageSchema);



var storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now())
    }
})


var upload = multer({ storage: storage });


//var upload = multer({ dest: "uploads/" });


//================================//







app.get("/showimage", (req, res) => {

    //======== THE FOLLOWING BLOCK OF CODE QUERIES ONE RECORD AND DISPLAYS THE IMAGE OF THAT RECORD. ======= //
    Image.findOne({ "address": "736 Riverside Dr, NY" }, function (error, result) {


        var data = result.img.data;
        var img = Buffer.from(data, "base64");
        // Buffer.from() MAKES A NEW BUFFER filled with the specified STRING, ARRAY or BUFFER
        // Parameter values:
        // obj (required): an object to fill the buffer with. It can be: string, array, buffer, arrayBuffer.
        // encoding (optional): if the object is a string, this parameter is used to pecify its encoding.
        // to create a Buffer from pre-existing data, we use the from() method.


        res.writeHead(200, {
            "Content-Type": "image/png",
            "Content-Length": img.length,
        });
        res.end(img);

        console.log(img);

        // res.writeHeader sends a responde header to the request. 
        // The first argument is the statusCode, which is a 3-digit status code, such as 404.
        // The object argument are the response headers.
        // res.writeHead() must be called before res.end().
        // res.end() signals to the server that all response headers and body have been sent. It signals that the server should consider this message complete.
        // res.end() must be called on each response.
        // If data is specified, it is similar in effect to calling response.write(data, encoding) followed by response.end(callback).
    })
    //==================================================================================================== // 


    /*
        Image.findById(req.params.id, function (error, res) {
            res.contentType(res.img.contentType);
            res.end(res.img.buffer, "binary");
        })
     */
})




// === CREATE A GET REQUEST THAT WILL DISPLAY ALL IMAGES IN THE DATABASE === //

app.get("/showallimages", (req, res) => {



    Image.find({}).exec((error, records) => {


        // var images = []
        // records.forEach((r) => { images.push(r.img) })
        // var imgs = Buffer.from(images, "base64"); // "base64" will encode any bit stream as a sequence of 7-bit ASCII characters, like Binary Data to plain text. 
        // - Base64 ====> string encoding. 
        // - A buffer is a region of a physical memory storage used to temporarily store data while it is being moved from one place to another. 
        // var imgs = records.forEach((r) => { Buffer.from(r.img.data, "base64") }); // ---> did not work.



        var img1 = Buffer.from(records[0].img.data, "base64");
        var img2 = Buffer.from(records[1].img.data, "base64");
        var images = [img1, img2];


        const formatedImages = images.map(buffer => {
            return `data:image/png;base64,${buffer.toString("base64")}`
        })
        // If I remove ".join(""), then the images won't be displayed, but we will have the img tag in string displayed 




        const image = `data:image/png;base64,${records[0].img.data.toString("base64")}`;
        const coords = records[0].coordinates;
        const address = records[0].address;
        const placeMeaning = records[0].placeMeaning;



        var dataObject = []
        var i = 0;
        for (i; i < records.length; i++) {
            dataObject.push({
                image: `data:image/png;base64,${records[i].img.data.toString("base64")}`,
                coords: records[i].coordinates,
                address: records[i].address,
                placeMeaning: records[i].placeMeaning,
            })
        }




        res.render('userInputs', { userData: dataObject });


        //res.send(formatedImages); // <=== This displays both images on the browser. 

        //res.sendFile("userinputs", {roor:__dirname}); // <=== I was previously using this to send an HTML file. 


        /* ************************************************************************ */
        // const writeStream = fs.createWriteStream("output/fileData.txt"); // 1. open a writestream 
        // 2. pipe the writestream to the http response. img1 and img2 are the http response. 
        // writeStream.write(img1)
        // writeStream.write(img2)

        // THE FOLLOWING CODE WILL DISPLAY JUST ONE IMAGE ON THE CLIENT SIDE. 
        //images.forEach((str) => {
        //    writeStream.write(str)
        //})
        //writeStream.end();
        //const readStream = fs.createReadStream("output/fileData.txt");
        //readStream.pipe(res); // readableSrc.pipe(writableDest)


        // When piping, The source has to be a readable stream and the destination has to be a writable one.
        // if I do writeStream.pipe(res), I get ===> Error [ERR_STREAM_CANNOT_PIPE]: Cannot pipe, not readable
        /*  ************************************************************************ */



        /* ************************************************************************ */
        //         THE FOLLOWING SENDS JUST ONE IMAGE TO THE CLIENT SIDE
        // THE FOLLOWING CODE WILL DISPLAY THE BINARY DATA ON THE BROWSER.
        //res.writeHead(200, {
        //    "Content-Type": "image/png",
        //    //"Content-Length": img1.length,
        //})

        //var i = 0;
        //for (i; i <= images.length; i++) {
        //    res.json(images[i]);
        //}
        /*  ************************************************************************ */




        //res.end(img1);
        // console.log(typeof records[0].img.data); ===> prints object
        //console.log(images); // This prints all the records correctly. 
        //console.log(imgs); // printing undefined.
        //console.log(Buffer.isBuffer(imgs)); // ===> This prints "true"
        //console.log(imgs); // This prints ===> <Buffer 00 00>
        //res.send(images);
        // res.send(records);
        // console.log(records[0])


    })



    // Model.find() uses the model schema to query MongoDB
    // The first argument is an object that specifies how to filter the data
    // If we pass an empty object, then we will get all the documents in the database. 

})


// ========================================================================= //







//================================//

// === CREATE THE GET REQUEST WHERE WE WILL DISPLAY ALL THE DATA STORED IN THE DATABASE === //

app.get("/images", (req, res) => { // this route allows us to see all the files that we submitted through the "/status/input" route.


    Image.find({}).exec((error, records) => { // the find function in MongoDB is used to find all the records, or records with specific parametes. 
        if (error) {
            res.send(error);
        } else {
            res.send(records);
        }
    })


});

// === CREATE THE POST REQUEST WHICH IS USED TO HANLDE THE DATA THAT IS SUBMITTED BY THE UDER === //



app.post("/status/input", upload.single("image"), (req, res) => {


    /*
    var obj = {
        user: req['body']['name'],
        address: req['body']['address'],
        placeMeaning: req['body']['reason'],
        coordinates: JSON.parse(req['body']['coordinates']),
        img: {
            data: fs.readFileSync(path.join(__dirname + "/uploads/" + req.filename)),
            contentType: "image/png"
        }
    }
    */

    console.log("req.file", req.file)

    let newRecord = new Image()
    newRecord.user = req['body']['name'];
    newRecord.address = req['body']['address'];
    newRecord.placeMeaning = req['body']['reason'];
    newRecord.coordinates = JSON.parse(req['body']['coordinates']);
    newRecord.img.data = fs.readFileSync(req.file.path);
    newRecord.img.contentType = "image/png";

    console.log("newRecord", newRecord);

    newRecord.save();

    /*
    newRecord.save((error, record) => {
        if (error) {
            res.send(error);
        } else {
            res.send(record);
        }
    })
    */




})








//=================================================////=============================================================//
//===== CODE FOR INSERTING FILES INTO MONGODB =====////=============================================================//
//=================================================////=============================================================//
/* 
const storage = new GridFsStorage({ // 1.
    url: "mongodb://127.0.0.1:27017/CB2BXSocialPlatform", // 2.
    options: { useNewUrlParser: true, useUnifiedTopology: true }, // 3.
    file: (req, file) => {
        return {
            bucketName: "photos",
            filename: `${Date.now()}-CB2SocialPlatform-${file.originalname}`
        }
    }
})


const upload = multer({ storage: storage }).single("image"); // 4.
var uploadFilesMiddleware = util.promisify(upload); // 5.
const uploadFile = async (req, res) => { // 6. 
}
*/
//=================================================//
//=================================================//
//=============================================================//
//==CREATING THE UPLOAD MIDDLEWARE WITH MULTER.DISKSTORAGE====//
//=============================================================//
/* 
const storage = multer.diskStorage({ // This storate negine defines where to store the images and what name to give them.
    destination: "uploads/",
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
})
const upload = multer({
    storage: storage
}).single("image");
*/
//=============================================================////=============================================================//
//=============================================================////=============================================================//










//-----------------------------------------------------//
//Express:

/* 
app.post("/status/input", function (req, res) { // We'll use this route to post the data from the form.

    // Including the "upload" middleware on the top allowed me to access both the text and the image data.


    // ======================================= //
    // === CODE TO GET AND RETREIVE IMAGES === //
    // ======================================= //



    // ====================================== //
    // ======================================= //
    // ======================================= //



    var imagePath = req.file.path.replace(/^uploads\//, "");
    res.redirect = imagePath;
    console.log(imagePath);
    // Redirects to the URL derived from the specified path, with specified status,
    // a positive integer that corresponds to an HTTP status code . 
    // If not specified, status defaults to “302 “Found”.


    let status = {
        'name': req['body']['name'],
        'address': req['body']['address'],
        'reason': req['body']['reason'],
        'coordinates': JSON.parse(req['body']['coordinates']),
        'image data': req.file
    }

    console.log("status", status);

    var dataToSend = JSON.stringify(status);

    fs.writeFile(__dirname + "/posts.json", dataToSend, function (err) { // The "name" is going to be the user's name. "status" will be what the user wrote about their favorite place.

    })





    // ==== MONGODB CONN ==== //
    mongoClient.connect(url, { useUnifiedTopology: true }, function (err, client) {
        let db = client.db("CB2BXSocialPlatform");


        let inputs = db.collection("UserInputs");
        inputs.insertOne({
            timestamp: new Date(),
            name: status["name"],
            reason: status["reason"],
            address: status["address"],
            coordinates: status["coordinates"]
        })


     //.............................................//
        var storage = new GridFsStorage({ //GridFsStorage is an instance of MULTER-GRIDFS-STORAGE, which is an engine for MULTER to store uploaded files directly to MongoDB.

            // url is only rquiered if db is not present. 
            db: db,
            file: (req, file) => {
                const match = ["image/png", "image/jpeg"];
                if (match.indexOf(file.mimetype) === -1){
                    const filename = `${Date.now()}-CB2SocialPlatform-${file.originalname}`;
                    return filename;
                }
                return {
                    bucketName : "Photos",
                    filename :`${Date.now()}-CB2SocialPlatform-${file.originalname}`
                }
            }
        })
        var uploadFile = multer({storage:storage}).single("image")
        var uploadFilesMiddleware = util.promisify(uploadFile);
        const uploadFile_ = async (req, res)=>{
            try{
                await uploadFilesMiddleware(req, res);
                console.log(req.file);
                if(req.file == undefined){
                    return res.send("You must select a file.");
                }
                return res.send("Your file has been uploaded.");
            } catch (error){
                console.log(error);
                return res.send(`Error when trying to upload the image ${error}`)
            }
        }
        uploadFile_();
     //.............................................//
       
    })

    //A Promise is always in one of the following states:

    //      - fulfilled: Action related to the promise succeeded.
    //      - rejected: Action related to the promise failed.
    //      - pending: Promise is still pending i.e not fulfilled or rejected yet.
    //      - settled: Promise has fulfilled or rejected


})

*/




//-----------------------------------------------------//

app.listen(3000, function (error) {
    if (error == true) {
        console.log("some error ocurred")
    } else {
        console.log("listening on localhost:3000")
    }
})

//==================================================================//
//==================================================================//
//==================================================================//
//==================================================================//














//================== WEBSOCKETS ==================//
wss = new WebSocket.Server({ port: 8080 });
/*
wss.broadcast = function broadcast(data, sentBy) {
    for (var i in this.clients) {
        if (this.clients[i] != sentBy) {
            this.clients[i].send(data)
        }
    }
}
*/
var allNames = []
wss.on("connection", function connection(ws) { // This event listener is triggered when whe connection between the client and the server is established. 
    console.log("2. Connected (from Server)")
    var names = [];
    ws.on("message", function incomming(message) {
        message = JSON.parse(message);
        if (typeof message === "object") {
            console.log("yiiiiiiijjjj")
        }
        console.log("3. received frome the Client ", message);
        names.push(message);
        console.log("4. List of names", names)
        //ws.send(JSON.stringify(names));
        //wss.broadcast(names, this); // <===--- the data is not arriving with this 
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                // allNames.push(names)
                client.send(JSON.stringify(message));
                console.log("7. All names connected: ", message)
                // client.send(JSON.stringify(names));
            }
        })
        //  allNames.push(names)
        //  
    })
    //ws.send("Connected");
})

//====================================================//




