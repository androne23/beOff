const mysql = require("mysql");
const getenv = require("getenv");
const config = require("./config");

var connection = mysql.createConnection({
    host: "localhost",
    user: getenv("absence_mariadb").split(" ")[0],
    password: getenv("absence_mariadb").split(" ")[1],
    database: "absence",
    multipleStatements: true
});
connection.connect();

async function query(sql, data) {
    const promise = new Promise(function (resolve, reject) {
        connection.query(sql, data, function (err, result) {
            if (err) return reject(err);
            resolve(result);
        });
    });
    var ret;
    await promise.then(function (result) {
        ret = result;
    }).catch((err) => setImmediate(() => {
        console.log(err);
        return config.mysqlError;
    }));
    return ret;
}

async function getUserByEmail(email, columns = []) {
    var sql;
    if (columns.length === 0) {
        sql = "SELECT * from users WHERE email=?";
    } else {
        var columnsString = "";
        columns.forEach(element => columnsString += element + ", ");
        columnsString = columnsString.slice(0, -2);
        sql = `SELECT ${columnsString}
               from users
               WHERE email = ?`;
    }
    return query(sql, [email]);
}

async function getUserByEmailPassword(email, password, columns = []) {
    var sql;
    if (columns.length === 0) {
        sql = "SELECT * from users WHERE email=? and password=?";
    } else {
        var columnsString = "";
        columns.forEach(element => columnsString += element + ", ");
        columnsString = columnsString.slice(0, -2);
        sql = `SELECT ${columnsString}
               from users
               WHERE email = ?
                 and password = ?`;
    }
    return query(sql, [email, password]);
}

async function insertUser(username, email, password, status = null, join_date = null) {
    var sql = `INSERT INTO users (username, email, password)
               VALUES (?, ?, ?);`;
    return query(sql, [username, email, password, status, join_date]);
}

async function insertDevicesDetected(id_present, devices) {
    console.log(id_present, devices);
    //insert potential new devices
    var macAddressName = [];
    devices.forEach(e => {
        macAddressName.push("(" + mysql.escape(e.device_mac) + ", " + mysql.escape(e.device_name) + ")");
    });
    var sql = `INSERT IGNORE INTO devices(device_mac, device_name)
               VALUES ${macAddressName.join(",")};` + "\n";

    //insert detected devices
    var macAddress = [];
    devices.forEach(e => {
        macAddress.push(mysql.escape(e.device_mac));
    });
    sql += `INSERT INTO devices_detected(id_present, id_device)
            SELECT ${mysql.escape(id_present)}, devices.id
            FROM devices
            WHERE device_mac in (${macAddress.join(",")});`;
    console.log(sql);
    return query(sql);
}

module.exports.getUserByEmail = function (email, columns) {
    return getUserByEmail(email, columns);
};
module.exports.getUserByEmailPassword = function (email, password, columns) {
    return getUserByEmailPassword(email, password, columns);
};
module.exports.insertUser = function (username, email, password, status, join_date) {
    return insertUser(username, email, password, status, join_date);
};
module.exports.insertDevicesDetected = function (id_present, devices) {
    return insertDevicesDetected(id_present, devices);
};
// module.exports = {
//     getUser: async (req, res) => {
//         let queryString = `SELECT *
//                            from users`;
//         const [user] = await connection.query(queryString).catch(err => {
//             throw err;
//         });
//         res.json(user);
//     }
// };