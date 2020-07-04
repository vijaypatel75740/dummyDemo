var debug = require('debug')('x-code:v1:policies'),

    // UserSchema = require('../models/User'),
    // config = rootRequire('config/global');
    config = require('../config/global');

module.exports = function (req, res, next) {
    if (!config.jwtTokenVerificationEnable) { // skip user verification
        return next();
    }

    // if id not found
    if (!req.user || (req.user && !req.user.id)) {
        return res.status(401).json({
            status: 0,
            message: "invalid user."
        }); // send unauthorized response
    }

    // check into db user exists or not
    // UserSchema
    //     .findOne({
    //         _id: mongoose.Types.ObjectId(req.user._id)
    //     })
    //     .select({
    //         password: 0
    //     })
    //     .lean()
    //     .exec(function (err, user) {
    //         if (err) {
    //             debug("Error while getting login user details : ", err);
    //             return res.status(500).json({
    //                 status: 0,
    //                 message: "Server error."
    //             }); // send server error
    //         }
    //         if (!user) { // if not found user for this id
    //             return res.status(401).json({
    //                 status: 0,
    //                 message: "invalid user."
    //             }); // send unauthorized response
    //         }
    //         req.user = user; // store user in request parameter
    //         // return next();
    //     });
    // OR
    next();
};