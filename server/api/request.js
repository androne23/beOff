const mysql = require("mysql");

const db = require("./db");
const config = require("./config");
const {mysqlError} = require("./config");

function registerSanitize(req) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    var error = [];
    return {error, username, email, password};
}

function loginSanitize(req) {
    const email = req.body.email;
    const password = req.body.password;
    var error = [];
    return {error, email, password};
}

function devicesDetectedSanitize(req) {
    const devices = req.body.devices;
    // const devices = [
    //     {
    //         device_mac: "test",
    //         device_name: "lol"
    //     }, {
    //         device_mac: "test2",
    //         device_name: "lol"
    //     }, {
    //         device_mac: "bbb",
    //         device_name: "lol"
    //     }];
    var error = [];
    // console.log(id_present, req.body);
    return {error, devices};
}


async function registerTreatment(req, res) {
    const {error, username, email, password} = registerSanitize(req);
    if (error.length !== 0) {
        res.status(400).send(error);
        return;
    }
    var isAlreadyUseEmail = await db.getUserByEmail(email, ["id"]);
    // console.log(isAlreadyUseEmail);
    if (isAlreadyUseEmail === mysqlError || isAlreadyUseEmail.length !== 0) {
        res.status(400).send(config.alreadyUseEmail);
        return;
    }

    const toSend = "username = " + username + ", email is " + email + ", password is " + password;
    if (await db.insertUser(username, email, password) === mysqlError) {
        res.status(400).send(config.alreadyUseEmail);
        return;
    }
    console.log(toSend);
    res.send(toSend);
}

async function loginTreatment(req, res) {
    const {error, email, password} = loginSanitize(req);
    if (error.length !== 0) {
        res.status(400).send(error);
        return;
    }
    console.log(req.body)
    var accountInfoFromDB = await db.getUserByEmailPassword(email, password, ["id", "username", "status", "join_date"]);
    // console.log("accountInfoFromDB", accountInfoFromDB);
    if (accountInfoFromDB === mysqlError) {
        res.status(400).send(config.badRequest);
        return;
    }
    if (accountInfoFromDB.length === 0) {
        res.status(400).send(config.badLoginInfo);
        return;
    }
    const session = req.session;
    session.id_bdd = accountInfoFromDB[0].id;
    session.username = accountInfoFromDB[0].username;
    session.email = email;
    session.status = accountInfoFromDB[0].status;
    session.join_date = accountInfoFromDB[0].join_date;
    session.connection_date = Date.now();
    const toSend = "email is " + email;
    console.log(toSend);
    res.send(toSend);
}

async function devicesDetectedTreatment(req, res) {
    const session = req.session;
    if (!(session.id && session.email)) {
        res.status(400).send(config.notLogged);
        return;
    }
    const {error, devices} = devicesDetectedSanitize(req);
    const id_present = session.id_bdd;
    if (error.length !== 0) {
        res.status(400).send(error);
        return;
    }
    var insertedDevicesDetected = await db.insertDevicesDetected(id_present, devices);
    if (insertedDevicesDetected === mysqlError || devices.length !== insertedDevicesDetected[1].affectedRows) {
        res.status(400).send(config.badRequest);
        return;
    }
    res.send(config.goodRequest);
}


module.exports.registerTreatment = function (req, res) {
    return registerTreatment(req, res);
};
module.exports.loginTreatment = function (req, res) {
    return loginTreatment(req, res);
};
module.exports.devicesDetectedTreatment = function (req, res) {
    return devicesDetectedTreatment(req, res);
};