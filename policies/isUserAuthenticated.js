var debug = require('debug')('x-code:v1:policies'),
    jwt = require('jsonwebtoken'),
    // CONSTANTS = rootRequire('config/constant'),
    // AdmminSchema = require('../../' + CONSTANTS.API_VERSION + '/models/admin'),
    config = require('../config/global');
var connection = require('../config/connection');
    

module.exports = function (req, res, next) {

    if (!config.jwtTokenVerificationEnable) { // skip token verification
        return next();
    }

    if (!req.headers || !req.headers['authorizations']) {

        // Send Unauthorized response
        res.status(406).json({
            status: 406,
            message: 'Access Token Required!'
        });
    }

    // Get token from headers
    var reqToken = req.headers ? req.headers['authorizations'] : '';
    console.log('reqToken: ', reqToken);

    // verify a token symmetric
    jwt.verify(reqToken, config.secret, function (err, decoded) {

        if (err) {
            // Send Unauthorized response
            return res.status(401).json({
                status: 401,
                message: "Your session has expired. Please login again."
            });
        } else if (decoded) { // user data
            if (!decoded.id) {
                return res.status(403).json({
                    status: 403,
                    message: "Invalid access token."
                });
            }

            //Store user in request (user)
            req.user = decoded;
            var sqlss = " SELECT * FROM login WHERE id ="+ decoded.id;
            connection.query(sqlss, function (err, adminData) {
                  if (err) {
                    next();
                }
                if (!adminData) {
                    return res.status(403).json({
                        status: 403,
                        message: "Session Expired! Please login again."
                    });
                }
                req.user = adminData[0];
                next();
            })
        } else {
            //Send Unauthorized response
            return res.status(401).json({
                status: 0,
                message: 'something wrong.'
            });
        }
    });
};