const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const logger = require("morgan");
const path = require("path");

const db = require("./db.js");
const request = require("./request.js");

const app = express();
const port = 3000;


async function main() {


    app.use(logger("dev"));
    // parse application/x-www-form-urlencoded
    // app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, "public")));
    app.use(session({secret: "LeMDP!CHUUUUTTTT!!!!", saveUninitialized: true, resave: true}));


    // create application/json parser
    // const jsonParser = bodyParser.json();
    // create application/x-www-form-urlencoded parser
    // const urlencodedParser = bodyParser.urlencoded({ extended: true });

    console.log("!! NEED TO DO THE SANITIZE FUNCTION !!");

    app.post("/api/register", function (req, res) {
        request.registerTreatment(req, res);
    });
    app.post("/api/login", function (req, res) {
        request.loginTreatment(req, res);
    });

    app.post("/api/devicesDetected", function (req, res) {
        request.devicesDetectedTreatment(req, res);
    });

    // app.get('/api/devtest', (req, res) => {
    //   const session = req.session;
    //   // console.log("/api/devtest called")
    //   // if (session.id && session.bdd_id && session.username) {
    //   // console.log(session.id, session.bdd_id, session.username);
    //   // }
    //   res.send(`Your session : ${JSON.stringify(session)}`);
    // })

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
}

main();