var debug = require('debug')('x-code:v1:controllers:driver'),
    moment = require('moment'),
    jwt = require('jsonwebtoken'),
    async = require('async'),
    path = require('path'),
    _ = require('underscore'),
    config = rootRequire('config/global'),

    /** Database Connections */
    //Mongoose library for query purose in MogoDB
    mongoose = require('mongoose'),

    // Custom services/helpers
    DS = rootRequire('services/date'),
    ED = rootRequire('services/encry_decry'),
    CONSTANTS = rootRequire('config/constant'),
    redisClient = rootRequire('support/redis'),

    //Database Schemas (MongoDB)
    AdminSchema = require('../../' + CONSTANTS.API_VERSION + '/models/admin'),
    PassengerSchema = require('../../' + CONSTANTS.API_VERSION + '/models/passenger'),
    DriverSchema = require('../../' + CONSTANTS.API_VERSION + '/models/driver'),
    SystemSettingsSchema = require('../../' + CONSTANTS.API_VERSION + '/models/systemSettings'),
    VehicleTypeSchema = require('../../' + CONSTANTS.API_VERSION + '/models/vehicleType'),
    VehicleColorSchema = require('../../' + CONSTANTS.API_VERSION + '/models/vehicleColor'),
    HelpCenterSchema = require('../../' + CONSTANTS.API_VERSION + '/models/helpCenter'),
    BillingPlansSchema = require('../../' + CONSTANTS.API_VERSION + '/models/billingPlan'),
    WalletLogsSchema = require('../../' + CONSTANTS.API_VERSION + '/models/walletLogs'),
    CountiesSchema = require('../../' + CONSTANTS.API_VERSION + '/models/countries'),
    EmergencySchema = require('../../' + CONSTANTS.API_VERSION + '/models/emergency'),
    UniqueCodeSchema = require('../../' + CONSTANTS.API_VERSION + '/models/uniqueCode'),
    LanguageSchema = require('../../' + CONSTANTS.API_VERSION + '/models/language'),
    RewardSchema = require('../../' + CONSTANTS.API_VERSION + '/models/reward'),
    RideSchema = require('../../' + CONSTANTS.API_VERSION + '/models/ride'),
    NotificationSchema = require('../../' + CONSTANTS.API_VERSION + '/models/notification'),
    DriverReferralSchema = require('../../' + CONSTANTS.API_VERSION + '/models/driverReferrals'),
    DriverRefEarningLogSchema = require('../../' + CONSTANTS.API_VERSION + '/models/driverReferralEarningLogs'),
    PassengerReferralEarningLogsSchema = require('../../' + CONSTANTS.API_VERSION + '/models/passengerReferralEarningLogs'),
    PassengerReferralSchema = require('../../' + CONSTANTS.API_VERSION + '/models/passengerReferrals'),
    DriverRideRequestSchema = require('../../' + CONSTANTS.API_VERSION + '/models/driverRideRequest'),
    CMSSchema = require('../../' + CONSTANTS.API_VERSION + '/models/cms'),
    WithdrawsSchema = require('../../' + CONSTANTS.API_VERSION + '/models/withdraws'),
    ActionLogsSchema = require('../../' + CONSTANTS.API_VERSION + '/models/action_logs'),
    //Push notification
    pn = require('../../../support/push-notifications/pn'),
    //Supports
    Uploader = rootRequire('support/uploader'),

    /**
     * languages
     */
    message = rootRequire('config/messages/en'),
    COMBODIA_MESSAGES = rootRequire('config/messages/km'),
    CHINESE_MESSAGES = rootRequire('config/messages/zh'),

    log_message = rootRequire('config/log_messages');

// Create indexs required in HelpCenterSchema
HelpCenterSchema.collection.createIndex({
    location: "2dsphere"
}, function (err, resp) { });

// Create indexs required in HelpCenterSchema
EmergencySchema.collection.createIndex({
    location: "2dsphere"
}, function (err, resp) { });

var _self = {

    /**
     * :::Test Zone:::
     * all apis and function to test are placd here
     */
    test: function (req, res) {
        return res.sendToEncode({
            status_code: 200,
            message: "Success!",
            data: {
                "Test": process.env.MONGO_URL
            }
        });
    },

    /**
     * Common functions
     */
    getUniqueId: function (callback) {
        async.waterfall([
            function (nextCall) {
                let randomString = Math.random().toString(36).substr(2, 5).toUpperCase();
                UniqueCodeSchema.find({}).exec(function (err, getUniqueData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getUniqueData[0].uniqueID.indexOf(randomString) === -1) {
                        let getUniqueArrayData = getUniqueData[0].uniqueID.push(randomString);
                        let updateData = {
                            "uniqueID": getUniqueData[0].uniqueID
                        }
                        UniqueCodeSchema.findOneAndUpdate({}, {
                            $set: updateData
                        },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, randomString)
                            });
                    } else {
                        _self.getUniqueId(function (err, response) {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG
                                })
                            }
                        });
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    getPassengerAutoIncrement: function (callback) {
        async.waterfall([
            function (nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSystemSettingData[0]) {
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $inc: {
                                passengerAutoIncrement: Number(1)
                            }
                        }, {
                                new: true
                            },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, updateData)
                            });
                    } else {
                        _self.getPassengerAutoIncrement(function (err, response) {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG
                                })
                            }
                        });
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    getDriverAutoIncrement: function (callback) {
        async.waterfall([
            function (nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSystemSettingData[0]) {
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $inc: {
                                driverAutoIncrement: Number(1)
                            }
                        }, {
                                new: true
                            },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, updateData)
                            });
                    } else {
                        _self.getDriverAutoIncrement(function (err, response) {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG
                                })
                            }
                        });
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    getOperatorAutoIncrement: function (callback) {
        async.waterfall([
            function (nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSystemSettingData[0]) {
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $inc: {
                                operatorAutoIncrement: Number(1)
                            }
                        }, {
                                new: true
                            },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, updateData)
                            });
                    } else {
                        _self.getOperatorAutoIncrement(function (err, response) {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG
                                })
                            }
                        });
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    getRewardAutoIncrement: function (callback) {
        async.waterfall([
            function (nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSystemSettingData[0]) {
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $inc: {
                                rewardAutoIncrement: Number(1)
                            }
                        }, {
                                new: true
                            },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, updateData)
                            });
                    } else {
                        _self.getRewardAutoIncrement(function (err, response) {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG
                                })
                            }
                        });
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    getVehicleAutoIncrement: function (callback) {
        async.waterfall([
            function (nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSystemSettingData[0]) {
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $inc: {
                                vehicleAutoIncrement: Number(1)
                            }
                        }, {
                                new: true
                            },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, updateData)
                            });
                    } else {
                        _self.getVehicleAutoIncrement(function (err, response) {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG
                                })
                            }
                        });
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    getEmergencyAutoIncrement: function (callback) {
        async.waterfall([
            function (nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSystemSettingData[0]) {
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $inc: {
                                emergencyAutoIncrement: Number(1)
                            }
                        }, {
                                new: true
                            },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, updateData)
                            });
                    } else {
                        _self.getEmergencyAutoIncrement(function (err, response) {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG
                                })
                            }
                        });
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    getLogAutoIncrement: function (callback) {
        async.waterfall([
            function (nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSystemSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSystemSettingData[0]) {
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $inc: {
                                logAutoIncrement: Number(1)
                            }
                        }, {
                                new: true
                            },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, updateData)
                            });
                    } else {
                        _self.getLogAutoIncrement(function (err, response) {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG
                                })
                            }
                        });
                    }
                })
            }
        ], function (err, response) {
            callback(err, response);
        })
    },

    sendCancelRideRequestNotificationToDriver: (ride) => {
        async.waterfall([

            function (nextCall) {
                _self.badgeCount(ride.driverId._id, isDriver = true, function (err, badgeCount) {
                    if (err) {
                        nextCall({ message: err })
                    }
                    else {
                        badgeCount = badgeCount ? badgeCount + 1 : 0
                        nextCall(null, badgeCount)
                    }
                })
            },
            function (badgeCount, nextCall) {
                let pushNotificationData = {
                    to: (ride.driverId.deviceDetail && ride.driverId.deviceDetail.token) || '',
                    type: 'driver',
                    data: {
                        title: '',
                        type: 3,
                        body: ride.reasonText.en || "This ride has been cancelled by the system.",
                        badge: badgeCount,
                        tag: 'Ride',
                        data: {
                            rideId: ride._id
                        }
                    }
                }

                pn.fcm(pushNotificationData, function (err, Success) {
                    let notificationData = {
                        title: pushNotificationData.data.body,
                        receiver_type: 'driver',
                        driverId: ride.driverId._id,
                        rideId: ride._id
                    }
                    let Notification = new NotificationSchema(notificationData);
                    Notification.save((err, notification) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        }
                        nextCall(null)
                    })
                })
            }
        ], function (err, response) {
            // callback(null);
        })
    },

    setDriverFree: (ride) => {
        async.waterfall([
            function (nextCall) {
                DriverSchema.findOneAndUpdate({
                    _id: ride.driverId
                }, {
                        isAvailable: true,
                        isBusy: false
                        // isRideRequestSended: false
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        nextCall(null, updateData.uniqueID)
                    });
            }
        ], function (err, response) {
            // callback(err, response);
        })
    },

    /**
     * Authentication apis
     */
    login: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('email', message.EMAIL_REQUIRED).notEmpty();
                req.checkBody('email', message.EMAIL_NOT_VALID).isEmail();
                req.checkBody('password', message.PASSWORD_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** check credential is valid or not */
            function (body, nextCall) {
                AdminSchema.findOne({
                    email: body.email,
                    password: ED.encrypt(body.password)
                }).lean().exec(function (err, admin) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    } else if (!admin) {
                        return nextCall({
                            "message": message.INVALID_CREDENTIALS
                        })
                    } else {
                        if (admin.isActive) {
                            nextCall(null, admin)
                        } else {
                            return nextCall({
                                "message": message.INACTIVE_ACCOUNT
                            })
                        }
                    }
                });
            },
            /** create Access token for authorition of api after login */
            function (admin, nextCall) {
                var jwtData = {
                    _id: admin._id,
                    email: admin.email
                };
                // create a token
                admin.access_token = jwt.sign(jwtData, config.secret, {
                    expiresIn: 60 * 60 * 24 // expires in 24 hours
                });
                delete admin.password;
                _self.addActionLog(admin, log_message.SECTION.LOGIN, log_message.ACTION.LOGIN_ACTION + ' ' + admin.first_name + ' ' + admin.last_name)
                nextCall(null, admin);
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.ADMIN_LOGIN_SUCCESS,
                data: response
            });
        });
    },

    /****************************
     * Change status of change password
     */
    changePasswordStatus: function (req, res) {
        async.waterfall([
            function (nextCall) {
                if (req.user.type !== "admin") {
                    return nextCall({ message: "Sorry!!! You don't have permission to update the status." })
                }
                else {
                    req.checkBody('operator_id', 'Operator id is required.').notEmpty();
                    req.checkBody('change_password', 'Can change password status is required.').notEmpty();
                    var error = req.validationErrors();
                    if (error && error.length) {
                        return nextCall({ message: error[0].msg });
                    }
                    else {
                        nextCall(null, req.body);
                    }
                }
            },
            function (body, nextCall) {
                AdminSchema.update({ "_id": body.operator_id }, { $set: { "canChangePassword": body.change_password } }, function (error, results) {
                    if (error) {
                        nextCall({ message: 'Something went wrong.' });
                    } else {
                        nextCall(null, {
                            status: 200,
                            message: 'Change password status updated successfully.',
                        });
                    }
                });
            }
        ],
            function (err, response) {
                if (err) {
                    return res.status(400).sendToEncode({ status: 400, message: (err && err.message) || "Oops! You could not be update." });
                }
                res.status(200).sendToEncode(response);
            });
    },

    /*************************
     * Change Password
     */
    changePassword: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('old_password', message.OLD_PASSWORD).notEmpty();
                req.checkBody('new_password', message.NEW_PASSWORD).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }

                var password = ED.encrypt(req.body.old_password)
                AdminSchema.findOne({ "_id": req.user._id, "canChangePassword": true }, function (err, admin) {
                    if (err) {
                        return nextCall({ message: "Sorry!!! Unable to update password please try again." });
                    }
                    if (admin) {
                        if (admin.password == password) {
                            return nextCall(null, admin)
                        }
                        else {
                            return nextCall({ message: "Incorrect password." });
                        }
                    }
                    else {
                        return nextCall({ message: "Sorry!!! You don't have a permission for change password." });
                    }
                });
            },
            function (admin, nextCall) {
                var newPassword = ED.encrypt(req.body.new_password);
                AdminSchema.update({ "_id": admin._id }, { $set: { "password": newPassword } }, { new: true }, function (err, result) {
                    if (err) {
                        return nextCall({ message: "Sorry!!! Unable to update password please try again." });
                    }
                    else {
                        nextCall(null, result);
                    }
                });
            },
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.CHANGE_PASSWORD_SUCCESS,
            });
        });
    },

    getAllCountries: function (req, res) {
        async.waterfall([
            function (nextCall) {
                var resopnseData = {};
                resopnseData.countryFlagUrl = CONSTANTS.COUNTRY_FLAGS_URL;
                // resopnseData.countries = CONSTANTS.COUNTRIES;
                CountiesSchema.find({}, function (err, countries) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    }
                    if (countries && countries.length) {
                        resopnseData.countries = countries;
                        nextCall(null, resopnseData);
                    } else {
                        resopnseData.countries = [];
                        nextCall(null, resopnseData);
                    }
                });
            },
        ],
            function (err, response) {
                if (err) {
                    return res.sendToEncode({
                        status_code: err.code ? err.code : 400,
                        message: (err && err.message) || message.SOMETHING_WENT_WRONG,
                        data: {}
                    });
                }
                return res.sendToEncode({
                    status_code: 200,
                    message: message.SUCCESS,
                    data: response
                });
            });
    },

    /**
     * Passenger Module
     */
    ListOfAllPassengers: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {
                    "isDeleted": false
                };
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.order && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'uniqueID': regex
                    }, {
                        'name': regex
                    }, {
                        'email': regex
                    }, {
                        'onlyPhoneNumber': regex
                    }, {
                        'countryCode': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                PassengerSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 400,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                PassengerSchema
                    .find(matchObj, {
                        '_id': 1,
                        'uniqueID': 1,
                        'name': 1,
                        'email': 1,
                        'phoneNumber': 1,
                        'countryCode': 1,
                        'onlyPhoneNumber': 1,
                        'dob': 1,
                        'profilePhoto': 1,
                        'isBlocked': 1,
                        'createdAt': 1,
                        'autoIncrementID': 1,
                        'passengerLevel': 1
                    }, {
                            limit: Number(req.body.length) || response.recordsTotal,
                            skip: Number(req.body.start) || 0
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            // response.data = poiUsers;
                            // _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.LIST_ALL_PASSENGER)
                            nextCall(null, poiUsers);
                        } else {
                            nextCall(null, []);
                        }
                    });
            },
            function (passengers, nextCall) {
                async.mapSeries(passengers, function (passenger, nextObj) {
                    let aggregateQuery = [];
                    // stage 1
                    aggregateQuery.push({
                        $match: {
                            $or: [{
                                "level1Passenger": mongoose.Types.ObjectId(passenger._id)
                            },
                            {
                                "level2Passenger": mongoose.Types.ObjectId(passenger._id)
                            },
                            {
                                "level3Passenger": mongoose.Types.ObjectId(passenger._id)
                            },
                            {
                                "level4Passenger": mongoose.Types.ObjectId(passenger._id)
                            },
                            {
                                "level5Passenger": mongoose.Types.ObjectId(passenger._id)
                            }
                            ]
                        }
                    })
                    // stage 2
                    aggregateQuery.push({
                        $group: {
                            '_id': null,
                            'totalInvitedCount': {
                                $sum: 1
                            },
                        }
                    })
                    // stage 3
                    aggregateQuery.push({
                        $addFields: {
                            "passenger_id": mongoose.Types.ObjectId(passenger._id)
                        }
                    })
                    // stage 4
                    aggregateQuery.push({
                        $lookup: {
                            "from": "ride",
                            "localField": "passenger_id",
                            "foreignField": "passengerId",
                            "as": "passengerCompletedRides"
                        }
                    })
                    // stage 5
                    aggregateQuery.push({
                        $unwind: {
                            path: "$passengerCompletedRides",
                            preserveNullAndEmptyArrays: true
                        }
                    })
                    // stage 6
                    aggregateQuery.push({
                        $group: {
                            '_id': "$_id",
                            'passenger_id': {
                                $first: "$passenger_id"
                            },
                            'totalInvitedCount': {
                                $first: "$totalInvitedCount"
                            },
                            'totalRideEarning': {
                                $sum: {
                                    $cond: {
                                        if: {
                                            $eq: ["passengerCompletedRides.paymentStatus", true]
                                        },
                                        then: "$passengerCompletedRides.toatlFare",
                                        else: 0
                                    }
                                },
                            },
                        }
                    })
                    // stage 7
                    aggregateQuery.push({
                        $project: {
                            "_id": 1,
                            "passenger_id": 1,
                            "totalInvitedCount": 1,
                            "totalRideEarning": 1
                        }
                    })
                    // stage 8
                    aggregateQuery.push({
                        $lookup: {
                            "from": "passenger_referral_earning_logs",
                            "localField": "passenger_id",
                            "foreignField": "beneficiaryPassengerId",
                            "as": "totalReferralEarning"
                        }
                    })
                    // stage 9
                    aggregateQuery.push({
                        $unwind: {
                            path: "$totalReferralEarning",
                            preserveNullAndEmptyArrays: true
                        }
                    })
                    // stage 10
                    aggregateQuery.push({
                        $group: {
                            '_id': "$_id",
                            'passenger_id': {
                                $first: "$passenger_id"
                            },
                            'totalReferralEarning': {
                                $sum: '$totalReferralEarning.referralAmount'
                            },
                            'totalInvitedCount': {
                                $first: "$totalInvitedCount"
                            },
                            'totalRideEarning': {
                                $sum: '$passengerCompletedRides.toatlFare'
                            },
                        }
                    })
                    // stage 11
                    aggregateQuery.push({
                        $project: {
                            "_id": 1,
                            "passenger_id": 1,
                            "totalReferralEarning": 1,
                            "totalInvitedCount": 1,
                            "totalRideEarning": 1
                        }
                    })
                    PassengerReferralSchema.aggregate(aggregateQuery, (err, totalRefEarning) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        } else {
                            if (totalRefEarning && totalRefEarning.length > 0) {
                                passenger.totalReferralEarning = totalRefEarning[0].totalReferralEarning;
                                passenger.totalInvitedCount = totalRefEarning[0].totalInvitedCount;
                                passenger.totalRideEarning = totalRefEarning[0].totalRideEarning;
                            } else {
                                passenger.totalReferralEarning = 0;
                                passenger.totalInvitedCount = 0;
                                passenger.totalRideEarning = 0;
                            }
                            nextObj(null)
                        }
                    })
                }, function (err) {
                    response.data = passengers;
                    nextCall()
                });

            }
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    addPassenger: function (req, res) {
        async.waterfall([
            /** get formData */
            function (nextCall) {
                Uploader.getFormFields(req, nextCall);
            },
            /** check required parameters */
            function (fields, files, nextCall) {
                if (fields && (!fields.name) || (!fields.phoneNumber) || (!fields.countryCode) || (!fields.onlyPhoneNumber) || (!fields.dob)) {
                    return nextCall({
                        "message": message.INVALID_PARAMS
                    });
                }
                nextCall(null, fields, files);
            },
            /** check email and mobile no already registered or not */
            function (fields, files, nextCall) {
                PassengerSchema.findOne({
                    phoneNumber: fields.phoneNumber,
                    isDeleted: false
                    // $or: [{
                    //     email: fields.email
                    // }, {
                    //     phoneNumber: fields.phoneNumber
                    // }]
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (passenger) {
                        return nextCall({
                            "message": message.PASSENGER_ALREADY_REGISTERED
                        })
                    } else {
                        nextCall(null, fields, files)
                    }
                })
            },
            /** upload profile picture */
            function (fields, files, nextCall) {
                if (files.profilePhoto) {
                    // skip files except image files
                    if (files.profilePhoto.type.indexOf('image') === -1) {
                        return nextFile(null, null);
                    }

                    var extension = path.extname(files.profilePhoto.name);
                    var filename = DS.getTime() + extension;
                    let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                    let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                    async.series([
                        function (nextProc) {
                            Uploader.thumbUpload({ // upload thumb file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + thumb_image,

                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.largeUpload({ // upload large file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + large_image
                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.remove({
                                filepath: files.profilePhoto.path
                            }, nextProc);
                        }
                    ], function (err) {
                        if (err) {
                            nextCall(err, fields);
                        }
                        fields.profilePhoto = filename;
                        nextCall(null, fields)
                    })
                } else {
                    fields.profilePhoto = '';
                    nextCall(null, fields)
                }
            },
            /** get unique id */
            // function (fields, nextCall) {
            //     _self.getUniqueId(function (err, response) {
            //         if (err) {
            //             return nextCall({
            //                 "message": message.SOMETHING_WENT_WRONG
            //             })
            //         }
            //         fields.uniqueID = 'P-' + response;
            //         nextCall(null, fields)
            //     });
            // },
            /** get passenger auto increment id */
            function (fields, nextCall) {
                _self.getPassengerAutoIncrement(function (err, response) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }

                    if (response.passengerAutoIncrement > 999999) {
                        fields.uniqueID = 'P-' + response.passengerAutoIncrement;
                    } else {
                        fields.uniqueID = 'P-' + ('00000' + response.passengerAutoIncrement).slice(-6);
                    }
                    fields.autoIncrementID = response.passengerAutoIncrement;
                    nextCall(null, fields)
                });
            },
            /** get language id */
            function (fields, nextCall) {
                LanguageSchema.findOne({
                    "code": CONSTANTS.DEFAULT_LANGUAGE
                }).lean().exec(function (err, language) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else if (!language) {
                        return nextCall({
                            "message": message.LANGUAGE_NOT_FOUND,
                        });
                    } else {
                        fields.languageId = language._id;
                        nextCall(null, fields);
                    }
                });
            },
            function (fields, nextCall) {
                fields.referral_code = Math.random().toString(36).substring(8);
                let passenger = new PassengerSchema(fields);
                passenger.save(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    }
                    _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.ADD_PASSENGER + ", PassengerId: " + passenger.autoIncrementID + ",  Name: " + passenger.name)
                    nextCall(null)
                });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.CREATE_PASSANGER_SUCC,
                data: {}
            });

        });
    },

    getPassengerDetails: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('passenger_id', message.PASSENGER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get passenger details */
            function (body, nextCall) {
                PassengerSchema.findOne({
                    '_id': body.passenger_id
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": message.PASSENGER_NOT_FOUND
                        })
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.VIEW_PASSENGER + ", PassengerId: " + passenger.autoIncrementID + ",  Name: " + passenger.name)
                        nextCall(null, passenger)
                    }
                });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_PASSENGER_DETAILS_SUCC,
                data: response
            });
        })
    },

    blockUnblockPassenger: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('passenger_id', message.PASSENGER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get passenger details */
            function (body, nextCall) {
                PassengerSchema.findOne({
                    '_id': body.passenger_id
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": message.PASSENGER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, passenger)
                    }
                });
            },
            /** update user block status */
            function (body, passenger, nextCall) {
                PassengerSchema.update({
                    "_id": mongoose.Types.ObjectId(body.passenger_id)
                }, {
                        $set: {
                            "isBlocked": passenger.isBlocked ? false : true
                        }
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.BLOCK_UNBLOCK_PASSENGER)
                        nextCall(null);
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.PASSENGER_ACTION_SUCC,
                data: {}
            });
        })
    },

    editPassenger: function (req, res) {
        async.waterfall([
            /** get formData */
            function (nextCall) {
                Uploader.getFormFields(req, nextCall);
            },
            /** check required parameters */
            function (fields, files, nextCall) {
                if (fields && (!fields.passenger_id)) {
                    return nextCall({
                        "message": message.INVALID_PARAMS
                    });
                }
                nextCall(null, fields, files);
            },
            /** get passenger details */
            function (fields, files, nextCall) {
                PassengerSchema.findOne({
                    _id: fields.passenger_id
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": message.PASSENGER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, fields, files, passenger)
                    }
                })
            },
            /** check email and mobile no already registered or not */
            function (fields, files, passenger, nextCall) {
                PassengerSchema.findOne({
                    _id: {
                        $ne: fields.passenger_id
                    },
                    phoneNumber: fields.phoneNumber,
                    isDeleted: false
                    // $or: [{
                    //     email: fields.email
                    // }, {
                    //     phoneNumber: fields.phoneNumber
                    // }, ]
                }).exec(function (err, passengerData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (passengerData) {
                        return nextCall({
                            "message": message.PASSENGER_ALREADY_REGISTERED
                        })
                    } else {
                        nextCall(null, fields, files, passenger)
                    }
                })
            },
            /** upload profile picture */
            function (fields, files, passenger, nextCall) {
                if (files.profilePhoto) {
                    // skip files except image files
                    if (files.profilePhoto.type.indexOf('image') === -1) {
                        return nextFile(null, null);
                    }

                    var extension = path.extname(files.profilePhoto.name);
                    let filename = DS.getTime() + extension;
                    let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                    let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                    async.series([
                        function (nextProc) {
                            Uploader.thumbUpload({ // upload thumb file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + thumb_image,

                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.largeUpload({ // upload large file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + large_image
                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.remove({
                                filepath: files.profilePhoto.path
                            }, nextProc);
                        },
                        function (nextProc) { // remove old large image\
                            if (passenger.profilePhoto != '') {
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + passenger.profilePhoto
                                }, nextProc);
                            } else {
                                nextProc();
                            }

                        },
                        function (nextProc) { // remove old thumb image
                            if (passenger.profilePhoto != '') {
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + passenger.profilePhoto
                                }, nextProc);
                            } else {
                                nextProc();
                            }
                        }
                    ], function (err) {
                        if (err) {
                            nextCall(err, fields);
                        }
                        fields.profilePhoto = filename;
                        nextCall(null, fields, passenger)
                    });
                } else {
                    fields.profilePhoto = passenger.profilePhoto;
                    nextCall(null, fields, passenger)
                }
            },
            /** update passenger data */
            function (fields, passenger, nextCall) {
                let updateData = {
                    'name': fields.name ? fields.name : passenger.name,
                    'email': fields.email,
                    'phoneNumber': fields.phoneNumber ? fields.phoneNumber : passenger.phoneNumber,
                    'countryCode': fields.countryCode ? fields.countryCode : passenger.countryCode,
                    'onlyPhoneNumber': fields.onlyPhoneNumber ? fields.onlyPhoneNumber : passenger.onlyPhoneNumber,
                    'dob': fields.dob ? fields.dob : passenger.dob,
                    'profilePhoto': fields.profilePhoto
                }

                PassengerSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(fields.passenger_id)
                }, {
                        $set: updateData
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.UPDATE_PASSENGER + ", PassengerId: " + updateData.autoIncrementID + ",  Name: " + updateData.name)
                        nextCall(null);
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.PASSENGER_UPDATE_SUCC,
                data: {}
            });
        })
    },

    deletePassenger: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('passenger_id', message.PASSENGER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get passenger details */
            function (body, nextCall) {
                PassengerSchema.findOne({
                    '_id': body.passenger_id
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": message.PASSENGER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, passenger)
                    }
                });
            },
            /** update user delete status */
            function (body, passenger, nextCall) {
                PassengerSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.passenger_id)
                }, {
                        $set: {
                            "isDeleted": true,
                        }
                    },
                    function (err, deleteData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        // if (passenger.profilePhoto != '') {
                        //     /** remove passenger profile photo */
                        //     Uploader.remove({
                        //         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + passenger.profilePhoto
                        //     });

                        //     Uploader.remove({
                        //         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + passenger.profilePhoto
                        //     });
                        // }
                        _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.DELETE_PASSENGER + ", Passenger Id: " + passenger.autoIncrementID + ",  Name: " + passenger.name)
                        nextCall(null);
                    });
            },
            /** update user delete status */
            // function (body, passenger, nextCall) {
            //     PassengerSchema.remove({
            //         "_id": mongoose.Types.ObjectId(body.passenger_id)
            //     },
            //         function (err, deleteData) {
            //             if (err) {
            //                 return nextCall({
            //                     "message": message.SOMETHING_WENT_WRONG
            //                 });
            //             }
            //             if (passenger.profilePhoto != '') {
            //                 /** remove passenger profile photo */
            //                 Uploader.remove({
            //                     filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + passenger.profilePhoto
            //                 });

            //                 Uploader.remove({
            //                     filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + passenger.profilePhoto
            //                 });
            //             }
            //             _self.addActionLog(req.user, log_message.SECTION.PASSENGER, log_message.ACTION.DELETE_PASSENGER + ", Passenger Id: " + passenger.autoIncrementID + ",  Name: " + passenger.name)
            //             nextCall(null);
            //         });
            // }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.PASSENGER_DELETED_SUCC,
                data: {}
            });
        })
    },

    /**
     * Driver Module
     */
    getAllVehicleTypes: function (req, res) {
        async.waterfall([
            function (nextCall) {
                let resopnseData = {};
                resopnseData.vehicleTypeUrl = CONSTANTS.VEHICLE_TYPE_URL;
                VehicleTypeSchema.find({}, function (err, v) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    }
                    if (v && v.length) {
                        resopnseData.vehicleType = v;
                        nextCall(null, resopnseData);
                    } else {
                        resopnseData.vehicleType = [];
                        nextCall(null, resopnseData);
                    }
                });
            },
            function (resopnseData, nextCall) {
                VehicleColorSchema.find({}, function (err, c) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    }
                    if (c && c.length) {
                        resopnseData.colors = c;
                        nextCall(null, resopnseData);
                    } else {
                        resopnseData.colors = [];
                        nextCall(null, resopnseData);
                    }
                });
            }
        ],
            function (err, response) {
                if (err) {
                    return res.sendToEncode({
                        status_code: err.code ? err.code : 400,
                        message: (err && err.message) || message.SOMETHING_WENT_WRONG,
                        data: {}
                    });
                }
                return res.sendToEncode({
                    status_code: 200,
                    message: message.SUCCESS,
                    data: response
                });
            });
    },

    ListOfAllDrivers: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {
                    'isDeleted': false
                };
                if (req.body.isVerified) {
                    matchObj.isVerified = true;
                }
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'uniqueID': regex
                    }, {
                        'phoneNumber': regex
                    }, {
                        'email': regex
                    }, {
                        'name': regex
                    }, {
                        'countryCode': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                DriverSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 400,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                DriverSchema
                    .find(matchObj, {
                        '_id': 1,
                        'uniqueID': 1,
                        'name': 1,
                        'email': 1,
                        'phoneNumber': 1,
                        'countryCode': 1,
                        'onlyPhoneNumber': 1,
                        'dob': 1,
                        'isBlocked': 1,
                        'isVerified': 1,
                        'profilePhoto': 1,
                        'createdAt': 1,
                        'verifiedDate': 1,
                        'autoIncrementID': 1,
                        'creditBalance': 1,
                        'avgRating': 1,
                        'verifiedBy': 1,
                        'driverLevel': 1
                    }, {
                            limit: Number(req.body.length) || response.recordsTotal,
                            skip: Number(req.body.start) || 0
                        })
                    .sort(sort)
                    .lean()
                    .populate('verifiedBy')
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        } else if (poiUsers.length > 0) {
                            // response.data = poiUsers;
                            nextCall(null, poiUsers);
                        } else {
                            nextCall(null, []);
                        }
                    });
            },
            function (drivers, nextCall) {
                async.mapSeries(drivers, function (driver, nextObj) {
                    let aggregateQuery = [];
                    // stage 1
                    aggregateQuery.push({
                        $match: {
                            $or: [{
                                "parentDriver": mongoose.Types.ObjectId(driver._id)
                            },
                            {
                                "grandParentDriver": mongoose.Types.ObjectId(driver._id)
                            },
                            {
                                "greatGrandParentDriver": mongoose.Types.ObjectId(driver._id)
                            }
                            ]
                        }
                    })
                    // stage 2
                    aggregateQuery.push({
                        $group: {
                            '_id': null,
                            'totalInvitedCount': {
                                $sum: 1
                            }
                        }
                    })
                    // stage 3
                    aggregateQuery.push({
                        $addFields: {
                            "driver_id": mongoose.Types.ObjectId(driver._id)
                        }
                    })
                    // stage 4
                    aggregateQuery.push({
                        $lookup: {
                            "from": "ride",
                            "localField": "driver_id",
                            "foreignField": "driverId",
                            "as": "driverCompletedRides"
                        }
                    })
                    // stage 5
                    aggregateQuery.push({
                        $unwind: {
                            path: "$driverCompletedRides",
                            preserveNullAndEmptyArrays: true
                        }
                    })
                    // stage 6
                    aggregateQuery.push({
                        $group: {
                            '_id': "$_id",
                            "driver_id": {
                                $first: "$driver_id"
                            },
                            'totalInvitedCount': {
                                $first: '$totalInvitedCount'
                            },
                            'totalRideEarning': {
                                $sum: {
                                    $cond: {
                                        if: {
                                            $eq: ["driverCompletedRides.paymentStatus", true]
                                        },
                                        then: "$driverCompletedRides.driverEarning",
                                        else: 0
                                    }
                                },
                            },
                        }
                    })
                    // stage 7
                    aggregateQuery.push({
                        $project: {
                            "_id": 1,
                            "driver_id": 1,
                            "totalInvitedCount": 1,
                            "totalRideEarning": 1
                        }
                    })
                    // stage 8
                    aggregateQuery.push({
                        $lookup: {
                            "from": "driver_referral_earning_logs",
                            "localField": "driver_id",
                            "foreignField": "beneficiaryDriverId",
                            "as": "totalReferralEarning"
                        }
                    })
                    // stage 9
                    aggregateQuery.push({
                        $unwind: {
                            path: "$totalReferralEarning",
                            preserveNullAndEmptyArrays: true
                        }
                    })
                    // stage 10
                    aggregateQuery.push({
                        $group: {
                            '_id': "$_id",
                            "driver_id": {
                                $first: "$driver_id"
                            },
                            'totalInvitedCount': {
                                $first: '$totalInvitedCount'
                            },
                            'totalRideEarning': {
                                $first: '$totalRideEarning'
                            },
                            'totalReferralEarning': {
                                $sum: '$totalReferralEarning.referralAmount'
                            },
                        }
                    })
                    // stage 11
                    aggregateQuery.push({
                        $project: {
                            "_id": 1,
                            "driver_id": 1,
                            "totalReferralEarning": 1,
                            "totalInvitedCount": 1,
                            "totalRideEarning": 1
                        }
                    })
                    DriverReferralSchema.aggregate(aggregateQuery, (err, totalRefEarning) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        } else {
                            if (totalRefEarning && totalRefEarning.length > 0) {
                                driver.totalReferralEarning = totalRefEarning[0].totalReferralEarning;
                                driver.totalInvitedCount = totalRefEarning[0].totalInvitedCount;
                                driver.totalRideEarning = totalRefEarning[0].totalRideEarning;
                            } else {
                                driver.totalReferralEarning = 0;
                                driver.totalInvitedCount = 0;
                                driver.totalRideEarning = 0;
                            }
                            nextObj(null)
                        }
                    })
                }, function (err) {
                    response.data = drivers;
                    nextCall()
                });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    addDriver: function (req, res) {
        async.waterfall([
            /** get form data */
            function (nextCall) {
                Uploader.getFormFields(req, nextCall)
            },
            /** check required parameters */
            function (fields, files, nextCall) {
                if (fields && (!fields.name) || (!fields.phoneNumber) || (!fields.dob) || (!fields.typeId) || (!fields.year) || (!fields.seats) || (!fields.color) || (!fields.model) || (!fields.isAcAvailable) || (!fields.isSmokingAllowed) || (!fields.platNumber)) {
                    return nextCall({
                        "message": message.INVALID_PARAMS
                    });
                }
                nextCall(null, fields, files);
            },
            /** check email and mobile no already registered or not */
            function (fields, files, nextCall) {
                DriverSchema.findOne({
                    phoneNumber: fields.phoneNumber,
                    isDeleted: false
                    // $or: [{
                    //     email: fields.email
                    // }, {
                    //     phoneNumber: fields.phoneNumber
                    // }]
                }).exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (driver) {
                        return nextCall({
                            "message": message.DRIVER_ALREADY_REGISTERED
                        })
                    } else {
                        nextCall(null, fields, files)
                    }
                })
            },
            /** upload profile picture */
            function (fields, files, nextCall) {
                if (files.profilePhoto) {
                    // skip files except image files
                    if (files.profilePhoto.type.indexOf('image') === -1) {
                        return nextFile(null, null);
                    }

                    var extension = path.extname(files.profilePhoto.name);
                    var filename = DS.getTime() + extension;
                    let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                    let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                    async.series([
                        function (nextProc) {
                            Uploader.thumbUpload({ // upload thumb file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + thumb_image,

                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.largeUpload({ // upload large file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + large_image
                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.remove({
                                filepath: files.profilePhoto.path
                            }, nextProc);
                        }
                    ], function (err) {
                        if (err) {
                            nextCall(err, fields, files);
                        }
                        fields.profilePhoto = filename;
                        nextCall(null, fields, files)
                    });
                } else {
                    fields.profilePhoto = '';
                    nextCall(null, fields, files)
                }
            },
            /** upload id photos */
            function (fields, files, nextCall) {
                if (files.idPhotos) {
                    if (!(files.idPhotos.length > 0)) {
                        let a = [];
                        a.push(files.idPhotos)
                        files.idPhotos = a;
                    }
                    async.mapSeries(Object.keys(files.idPhotos), function (k, nextFile) {

                        // skip files except image files
                        if (files.idPhotos[k].type.indexOf('image') === -1) {
                            return nextFile(null, null);
                        }

                        var extension = path.extname(files.idPhotos[k].name);
                        var filename = DS.getTime() + extension;
                        let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                        let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                        async.series([
                            function (nextProc) {
                                Uploader.thumbUpload({ // upload thumb file
                                    src: files.idPhotos[k].path,
                                    dst: rootPath + '/' + thumb_image,

                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.largeUpload({ // upload large file
                                    src: files.idPhotos[k].path,
                                    dst: rootPath + '/' + large_image
                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.remove({
                                    filepath: files.idPhotos[k].path
                                }, nextProc);
                            }
                        ], function (err) {
                            if (err) {
                                nextFile(err, filename);
                            }
                            nextFile(null, filename)
                        });
                    }, function (err, idPhotosName) {
                        fields.idPhotos = idPhotosName;
                        nextCall(null, fields, files);
                    });
                } else {
                    fields.idPhotos = [];
                    nextCall(null, fields, files);
                }
            },
            /** upload vehicle photos */
            function (fields, files, nextCall) {
                if (files.vehiclePhotos) {
                    if (!(files.vehiclePhotos.length > 0)) {
                        let a = [];
                        a.push(files.vehiclePhotos)
                        files.vehiclePhotos = a;
                    }
                    async.mapSeries(Object.keys(files.vehiclePhotos), function (k, nextFile) {

                        // skip files except image files
                        if (files.vehiclePhotos[k].type.indexOf('image') === -1) {
                            return nextFile(null, null);
                        }

                        var extension = path.extname(files.vehiclePhotos[k].name);
                        var filename = DS.getTime() + extension;
                        let thumb_image = CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                        let large_image = CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                        async.series([
                            function (nextProc) {
                                Uploader.thumbUpload({ // upload thumb file
                                    src: files.vehiclePhotos[k].path,
                                    dst: rootPath + '/' + thumb_image,

                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.largeUpload({ // upload large file
                                    src: files.vehiclePhotos[k].path,
                                    dst: rootPath + '/' + large_image
                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.remove({
                                    filepath: files.vehiclePhotos[k].path
                                }, nextProc);
                            }
                        ], function (err) {
                            if (err) {
                                nextFile(err, filename);
                            }
                            nextFile(null, filename)
                        });
                    }, function (err, vehiclePhotosName) {
                        fields.vehiclePhotos = vehiclePhotosName;
                        nextCall(null, fields, files);
                    });
                } else {
                    fields.vehiclePhotos = [];
                    nextCall(null, fields, files);
                }
            },
            /** upload vehicle id photos */
            function (fields, files, nextCall) {
                if (files.vehicleIdPhotos) {
                    if (!(files.vehicleIdPhotos.length > 0)) {
                        let a = [];
                        a.push(files.vehicleIdPhotos)
                        files.vehicleIdPhotos = a;
                    }
                    async.mapSeries(Object.keys(files.vehicleIdPhotos), function (k, nextFile) {

                        // skip files except image files
                        if (files.vehicleIdPhotos[k].type.indexOf('image') === -1) {
                            return nextFile(null, null);
                        }

                        var extension = path.extname(files.vehicleIdPhotos[k].name);
                        var filename = DS.getTime() + extension;
                        let thumb_image = CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                        let large_image = CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                        async.series([
                            function (nextProc) {
                                Uploader.thumbUpload({ // upload thumb file
                                    src: files.vehicleIdPhotos[k].path,
                                    dst: rootPath + '/' + thumb_image,

                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.largeUpload({ // upload large file
                                    src: files.vehicleIdPhotos[k].path,
                                    dst: rootPath + '/' + large_image
                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.remove({
                                    filepath: files.vehicleIdPhotos[k].path
                                }, nextProc);
                            }
                        ], function (err) {
                            if (err) {
                                nextFile(err, filename);
                            }
                            nextFile(null, filename)
                        });
                    }, function (err, vehicleIdPhotosName) {
                        fields.vehicleIdPhotos = vehicleIdPhotosName;
                        nextCall(null, fields, files);
                    });
                } else {
                    fields.vehicleIdPhotos = [];
                    nextCall(null, fields, files);
                }
            },
            /** upload plate number photos */
            function (fields, files, nextCall) {
                if (files.plateNoPhotos) {
                    if (!(files.plateNoPhotos.length > 0)) {
                        let a = [];
                        a.push(files.plateNoPhotos)
                        files.plateNoPhotos = a;
                    }
                    async.mapSeries(Object.keys(files.plateNoPhotos), function (k, nextFile) {

                        // skip files except image files
                        if (files.plateNoPhotos[k].type.indexOf('image') === -1) {
                            return nextFile(null, null);
                        }

                        var extension = path.extname(files.plateNoPhotos[k].name);
                        var filename = DS.getTime() + extension;
                        let thumb_image = CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                        let large_image = CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                        async.series([
                            function (nextProc) {
                                Uploader.thumbUpload({ // upload thumb file
                                    src: files.plateNoPhotos[k].path,
                                    dst: rootPath + '/' + thumb_image,

                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.largeUpload({ // upload large file
                                    src: files.plateNoPhotos[k].path,
                                    dst: rootPath + '/' + large_image
                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.remove({
                                    filepath: files.plateNoPhotos[k].path
                                }, nextProc);
                            }
                        ], function (err) {
                            if (err) {
                                nextFile(err, filename);
                            }
                            nextFile(null, filename)
                        });
                    }, function (err, plateNumberPhotosName) {
                        fields.plateNoPhotos = plateNumberPhotosName;
                        nextCall(null, fields);
                    });
                } else {
                    fields.plateNoPhotos = [];
                    nextCall(null, fields);
                }
            },
            /** get vehicle type */
            function (fields, nextCall) {
                VehicleTypeSchema.findOne({
                    '_id': fields.typeId
                }).exec(function (err, vehicleType) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!vehicleType) {
                        return nextCall({
                            "message": message.VEHICLE_NOT_FOUND
                        })
                    } else {
                        fields.vehicleType = vehicleType.type.en.charAt(0);
                        nextCall(null, fields)
                    }
                });
            },
            /** get driver auto increment id */
            function (fields, nextCall) {
                _self.getDriverAutoIncrement(function (err, response) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    fields.autoIncrementID = response.driverAutoIncrement;
                    nextCall(null, fields)
                });
            },
            /** unique id for driver */
            function (fields, nextCall) {
                // _self.getUniqueId(function (err, response) {
                //     if (err) {
                //         return nextCall({
                //             "message": message.SOMETHING_WENT_WRONG
                //         })
                //     }
                //     fields.uniqueID = fields.vehicleType + '-' + response;
                //     nextCall(null, fields)
                // });

                var year = new Date().getFullYear().toString().substr(-2);
                var newuniqueId = year + '0000' + fields.autoIncrementID;
                fields.uniqueID = fields.vehicleType + '-' + newuniqueId;

                UniqueCodeSchema.find({}).exec(function (err, getUniqueData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getUniqueData[0].uniqueID.indexOf(newuniqueId) === -1) {
                        let getUniqueArrayData = getUniqueData[0].uniqueID.push(newuniqueId);
                        let updateData = {
                            "uniqueID": getUniqueData[0].uniqueID
                        }
                        UniqueCodeSchema.findOneAndUpdate({}, {
                            $set: updateData
                        },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, fields)
                            });
                    } else {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                })
            },
            /** get language id */
            function (fields, nextCall) {
                LanguageSchema.findOne({
                    "code": CONSTANTS.DEFAULT_LANGUAGE
                }).lean().exec(function (err, language) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else if (!language) {
                        return nextCall({
                            "message": message.LANGUAGE_NOT_FOUND,
                        });
                    } else {
                        fields.languageId = language._id;
                        nextCall(null, fields);
                    }
                });
            },
            /** insert data into driver collection */
            function (fields, nextCall) {
                let vehicleData = {
                    "typeId": fields.typeId,
                    "year": fields.year,
                    "seats": fields.seats,
                    "color": fields.color,
                    "model": fields.model,
                    "isAcAvailable": fields.isAcAvailable,
                    "isSmokingAllowed": fields.isSmokingAllowed,
                    "vehiclePhotos": fields.vehiclePhotos,
                    "vehicleIdPhotos": fields.vehicleIdPhotos,
                    "plateNoPhotos": fields.plateNoPhotos,
                    "platNumber": fields.platNumber,
                }

                let driverData = {
                    "uniqueID": fields.uniqueID,
                    "name": fields.name,
                    "email": fields.email,
                    "dob": fields.dob,
                    "phoneNumber": fields.phoneNumber,
                    "countryCode": fields.countryCode,
                    "onlyPhoneNumber": fields.onlyPhoneNumber,
                    "profilePhoto": fields.profilePhoto,
                    "idPhotos": fields.idPhotos,
                    "vehicle": vehicleData,
                    "referralCode": Math.random().toString(36).substring(8),
                    "languageId": fields.languageId,
                    "autoIncrementID": fields.autoIncrementID
                }

                let driver = new DriverSchema(driverData);
                driver.save(function (err, driverData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    _self.addActionLog(req.user, log_message.SECTION.DRIVER, log_message.ACTION.ADD_DRIVER + ", DriverId: " + driverData.autoIncrementID + ",  Name: " + driverData.name)
                    nextCall(null)
                })
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.DRIVER_CREATE_SUCCESS,
                data: {}
            });
        });
    },

    getDriverDetails: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driver_id', message.DRIVER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get driver details */
            function (body, nextCall) {
                DriverSchema.findOne({
                    '_id': body.driver_id
                }).populate('vehicle.typeId').exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driver) {
                        return nextCall({
                            "message": message.DRIVER_NOT_FOUND
                        })
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.DRIVER, log_message.ACTION.VIEW_DRIVER + ", DriverId: " + driver.autoIncrementID + ",  Name: " + driver.name)
                        nextCall(null, driver)
                    }
                });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_DRIVER_DETAILS_SUCC,
                data: response
            });
        });
    },

    blockUnblockDriver: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driver_id', message.DRIVER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get driver details */
            function (body, nextCall) {
                DriverSchema.findOne({
                    '_id': body.driver_id
                }).exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driver) {
                        return nextCall({
                            "message": message.DRIVER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, driver)
                    }
                });
            },
            /** update user block status */
            function (body, driver, nextCall) {
                DriverSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.driver_id)
                }, {
                        $set: {
                            "isBlocked": driver.isBlocked ? false : true
                        }
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        let action = "unblocked";
                        if (updateData.isBlocked) {
                            action = "blocked";
                        }
                        _self.addActionLog(req.user, log_message.SECTION.DRIVER, log_message.ACTION.BLOCK_UNBLOCK_DRIVER + action + ", DriverId: " + updateData.autoIncrementID + ",  Name: " + updateData.name)
                        nextCall(null);
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.DRIVER_ACTION_SUCC,
                data: {}
            });
        })
    },

    editDriver: function (req, res) {
        async.waterfall([
            /** get form data */
            function (nextCall) {
                Uploader.getFormFields(req, nextCall)
            },
            /** check required parameters */
            function (fields, files, nextCall) {
                if (fields && (!fields.driver_id)) {
                    return nextCall({
                        "message": message.INVALID_PARAMS
                    });
                }
                nextCall(null, fields, files);
            },
            /** get driver details */
            function (fields, files, nextCall) {
                DriverSchema.findOne({
                    _id: fields.driver_id
                }).lean().exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driver) {
                        return nextCall({
                            "message": message.DRIVER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, fields, files, driver)
                    }
                })
            },
            /** check email and mobile no already registered or not */
            function (fields, files, driver, nextCall) {
                DriverSchema.findOne({
                    _id: {
                        $ne: fields.driver_id
                    },
                    phoneNumber: fields.phoneNumber,
                    isDeleted: false
                    // $or: [{
                    //     email: fields.email
                    // }, {
                    //     phoneNumber: fields.phoneNumber
                    // }]
                }).exec(function (err, driverData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (driverData) {
                        return nextCall({
                            "message": message.DRIVER_ALREADY_REGISTERED
                        })
                    } else {
                        nextCall(null, fields, files, driver)
                    }
                })
            },
            /** upload profile picture */
            function (fields, files, driver, nextCall) {
                if (files.profilePhoto) {
                    // skip files except image files
                    if (files.profilePhoto.type.indexOf('image') === -1) {
                        return nextFile(null, null);
                    }

                    var extension = path.extname(files.profilePhoto.name);
                    var filename = DS.getTime() + extension;
                    let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                    let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                    async.series([
                        function (nextProc) {
                            Uploader.thumbUpload({ // upload thumb file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + thumb_image,

                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.largeUpload({ // upload large file
                                src: files.profilePhoto.path,
                                dst: rootPath + '/' + large_image
                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.remove({ // remove tmp image
                                filepath: files.profilePhoto.path
                            }, nextProc);
                        },
                        function (nextProc) { // remove old large image
                            if (driver.profilePhoto && driver.profilePhoto != '') {
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + driver.profilePhoto
                                }, nextProc);
                            } else {
                                nextProc()
                            }
                        },
                        function (nextProc) { // remove old thumb image
                            if (driver.profilePhoto && driver.profilePhoto != '') {
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + driver.profilePhoto
                                }, nextProc);
                            } else {
                                nextProc()
                            }
                        }
                    ], function (err) {
                        if (err) {
                            nextCall(err, fields, files, driver);
                        }
                        fields.profilePhoto = filename;
                        nextCall(null, fields, files, driver)
                    });
                } else {
                    fields.profilePhoto = driver.profilePhoto;
                    nextCall(null, fields, files, driver)
                }
            },
            /** remove id photos */
            function (fields, files, driver, nextCall) {
                if (fields.removeIdPhotos.length > 0) {
                    if (fields.removeIdPhotos && typeof fields.removeIdPhotos == 'string') {
                        fields.removeIdPhotos = JSON.parse(fields.removeIdPhotos);
                    }
                    async.mapSeries(fields.removeIdPhotos, function (k, nextFile) {
                        if (k && k != '') {
                            /** remove image from server */
                            Uploader.remove({
                                filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + k
                            });

                            Uploader.remove({
                                filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + k
                            });
                        }

                        /** remove image name from id photos array */
                        driver.idPhotos = driver.idPhotos.filter(item => item !== k)
                        nextFile(null)
                    }, function (err) {
                        nextCall(null, fields, files, driver);
                    });
                } else {
                    driver.idPhotos = driver.idPhotos;
                    nextCall(null, fields, files, driver);
                }
            },
            /** upload id photos */
            function (fields, files, driver, nextCall) {
                if (files.idPhotos) {
                    if (!(files.idPhotos.length > 0)) {
                        let a = [];
                        a.push(files.idPhotos)
                        files.idPhotos = a;
                    }
                    async.mapSeries(Object.keys(files.idPhotos), function (k, nextFile) {

                        // skip files except image files
                        if (files.idPhotos[k].type.indexOf('image') === -1) {
                            return nextFile(null, null);
                        }

                        var extension = path.extname(files.idPhotos[k].name);
                        var filename = DS.getTime() + extension;
                        let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                        let large_image = CONSTANTS.PROFILE_PATH_LARGE + filename;

                        async.series([
                            function (nextProc) {
                                Uploader.thumbUpload({ // upload thumb file
                                    src: files.idPhotos[k].path,
                                    dst: rootPath + '/' + thumb_image,

                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.largeUpload({ // upload large file
                                    src: files.idPhotos[k].path,
                                    dst: rootPath + '/' + large_image
                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.remove({
                                    filepath: files.idPhotos[k].path
                                }, nextProc);
                            }
                        ], function (err) {
                            if (err) {
                                nextFile(err, filename);
                            }
                            nextFile(null, filename)
                        });
                    }, function (err, idPhotosName) {
                        driver.idPhotos = Object.assign(driver.idPhotos.concat(idPhotosName));
                        nextCall(null, fields, files, driver);
                    });
                } else {
                    nextCall(null, fields, files, driver);
                }
            },
            /** remove vehicle photos */
            function (fields, files, driver, nextCall) {
                if (fields.removeVehiclePhotos.length > 0) {
                    if (fields.removeVehiclePhotos && typeof fields.removeVehiclePhotos == 'string') {
                        fields.removeVehiclePhotos = JSON.parse(fields.removeVehiclePhotos);
                    }
                    async.mapSeries(fields.removeVehiclePhotos, function (k, nextFile) {
                        if (k && k != '') {
                            /** remove image from server */
                            Uploader.remove({
                                filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
                            });

                            Uploader.remove({
                                filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + k
                            });
                        }

                        /** remove image name from id photos array */
                        driver.vehicle.vehiclePhotos = driver.vehicle.vehiclePhotos.filter(item => item !== k)
                        nextFile(null)
                    }, function (err) {
                        nextCall(null, fields, files, driver);
                    });
                } else {
                    driver.vehicle.vehiclePhotos = driver.vehicle.vehiclePhotos;
                    nextCall(null, fields, files, driver);
                }
            },
            /** upload vehicle photos */
            function (fields, files, driver, nextCall) {
                if (files.vehiclePhotos) {
                    if (!(files.vehiclePhotos.length > 0)) {
                        let a = [];
                        a.push(files.vehiclePhotos)
                        files.vehiclePhotos = a;
                    }
                    async.mapSeries(Object.keys(files.vehiclePhotos), function (k, nextFile) {

                        // skip files except image files
                        if (files.vehiclePhotos[k].type.indexOf('image') === -1) {
                            return nextFile(null, null);
                        }

                        var extension = path.extname(files.vehiclePhotos[k].name);
                        var filename = DS.getTime() + extension;
                        let thumb_image = CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                        let large_image = CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                        async.series([
                            function (nextProc) {
                                Uploader.thumbUpload({ // upload thumb file
                                    src: files.vehiclePhotos[k].path,
                                    dst: rootPath + '/' + thumb_image,

                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.largeUpload({ // upload large file
                                    src: files.vehiclePhotos[k].path,
                                    dst: rootPath + '/' + large_image
                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.remove({
                                    filepath: files.vehiclePhotos[k].path
                                }, nextProc);
                            }
                        ], function (err) {
                            if (err) {
                                nextFile(err, filename);
                            }
                            nextFile(null, filename)
                        });
                    }, function (err, vehiclePhotosName) {
                        driver.vehicle.vehiclePhotos = Object.assign(driver.vehicle.vehiclePhotos.concat(vehiclePhotosName));
                        nextCall(null, fields, files, driver);
                    });
                } else {
                    nextCall(null, fields, files, driver);
                }
            },
            /** remove vehicle id photos */
            function (fields, files, driver, nextCall) {
                if (fields.removeVehicleIdPhotos.length > 0) {
                    if (fields.removeVehicleIdPhotos && typeof fields.removeVehicleIdPhotos == 'string') {
                        fields.removeVehicleIdPhotos = JSON.parse(fields.removeVehicleIdPhotos);
                    }
                    async.mapSeries(fields.removeVehicleIdPhotos, function (k, nextFile) {
                        if (k && k != '') {
                            /** remove image from server */
                            Uploader.remove({
                                filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
                            });

                            Uploader.remove({
                                filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + k
                            });
                        }

                        /** remove image name from id photos array */
                        driver.vehicle.vehicleIdPhotos = driver.vehicle.vehicleIdPhotos.filter(item => item !== k)
                        nextFile(null)
                    }, function (err) {
                        nextCall(null, fields, files, driver);
                    });
                } else {
                    driver.vehicle.vehicleIdPhotos = driver.vehicle.vehicleIdPhotos;
                    nextCall(null, fields, files, driver);
                }
            },
            /** upload vehicle id photos */
            function (fields, files, driver, nextCall) {
                if (files.vehicleIdPhotos) {
                    if (!(files.vehicleIdPhotos.length > 0)) {
                        let a = [];
                        a.push(files.vehicleIdPhotos)
                        files.vehicleIdPhotos = a;
                    }
                    async.mapSeries(Object.keys(files.vehicleIdPhotos), function (k, nextFile) {

                        // skip files except image files
                        if (files.vehicleIdPhotos[k].type.indexOf('image') === -1) {
                            return nextFile(null, null);
                        }

                        var extension = path.extname(files.vehicleIdPhotos[k].name);
                        var filename = DS.getTime() + extension;
                        let thumb_image = CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                        let large_image = CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                        async.series([
                            function (nextProc) {
                                Uploader.thumbUpload({ // upload thumb file
                                    src: files.vehicleIdPhotos[k].path,
                                    dst: rootPath + '/' + thumb_image,

                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.largeUpload({ // upload large file
                                    src: files.vehicleIdPhotos[k].path,
                                    dst: rootPath + '/' + large_image
                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.remove({
                                    filepath: files.vehicleIdPhotos[k].path
                                }, nextProc);
                            }
                        ], function (err) {
                            if (err) {
                                nextFile(err, filename);
                            }
                            nextFile(null, filename)
                        });
                    }, function (err, vehicleIdPhotosName) {
                        driver.vehicle.vehicleIdPhotos = Object.assign(driver.vehicle.vehicleIdPhotos.concat(vehicleIdPhotosName));
                        nextCall(null, fields, files, driver);
                    });
                } else {
                    nextCall(null, fields, files, driver);
                }
            },
            /** remove plate number photos */
            function (fields, files, driver, nextCall) {
                if (fields.removePlateNoPhotos && fields.removePlateNoPhotos.length > 0) {
                    if (fields.removePlateNoPhotos && typeof fields.removePlateNoPhotos == 'string') {
                        fields.removePlateNoPhotos = JSON.parse(fields.removePlateNoPhotos);
                    }
                    async.mapSeries(fields.removePlateNoPhotos, function (k, nextFile) {
                        if (k && k != '') {
                            /** remove image from server */
                            Uploader.remove({
                                filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
                            });

                            Uploader.remove({
                                filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + k
                            });
                        }

                        /** remove image name from id photos array */
                        driver.vehicle.plateNoPhotos = driver.vehicle.plateNoPhotos.filter(item => item !== k)
                        nextFile(null)
                    }, function (err) {
                        nextCall(null, fields, files, driver);
                    });
                } else {
                    driver.vehicle.plateNoPhotos = driver.vehicle.plateNoPhotos;
                    nextCall(null, fields, files, driver);
                }
            },
            /** upload plate number photos */
            function (fields, files, driver, nextCall) {
                if (files.plateNoPhotos) {
                    if (!(files.plateNoPhotos.length > 0)) {
                        let a = [];
                        a.push(files.plateNoPhotos);
                        files.plateNoPhotos = a;
                    }
                    async.mapSeries(Object.keys(files.plateNoPhotos), function (k, nextFile) {

                        // skip files except image files
                        if (files.plateNoPhotos[k].type.indexOf('image') === -1) {
                            return nextFile(null, null);
                        }

                        var extension = path.extname(files.plateNoPhotos[k].name);
                        var filename = DS.getTime() + extension;
                        let thumb_image = CONSTANTS.DRIVER_VEHICLE_PATH_THUMB + filename;
                        let large_image = CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + filename;

                        async.series([
                            function (nextProc) {
                                Uploader.thumbUpload({ // upload thumb file
                                    src: files.plateNoPhotos[k].path,
                                    dst: rootPath + '/' + thumb_image,

                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.largeUpload({ // upload large file
                                    src: files.plateNoPhotos[k].path,
                                    dst: rootPath + '/' + large_image
                                }, nextProc);
                            },
                            function (nextProc) {
                                Uploader.remove({
                                    filepath: files.plateNoPhotos[k].path
                                }, nextProc);
                            }
                        ], function (err) {
                            if (err) {
                                nextFile(err, filename);
                            }
                            nextFile(null, filename)
                        });
                    }, function (err, plateNumberPhotosName) {
                        driver.vehicle.plateNoPhotos = Object.assign(driver.vehicle.plateNoPhotos.concat(plateNumberPhotosName));
                        nextCall(null, fields, driver);
                    });
                } else {
                    nextCall(null, fields, driver);
                }
            },
            /** get vehicle type */
            function (fields, driver, nextCall) {
                VehicleTypeSchema.findOne({
                    '_id': fields.typeId
                }).exec(function (err, vehicleType) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!vehicleType) {
                        return nextCall({
                            "message": message.VEHICLE_NOT_FOUND
                        })
                    } else {
                        let vehicleTypeChar = driver.uniqueID.split("-");
                        fields.uniqueID = vehicleType.type.en.charAt(0) + '-' + vehicleTypeChar[1];
                        nextCall(null, fields, driver)
                    }
                });
            },
            /** update data into driver collection */
            function (fields, driver, nextCall) {
                let vehicleData = {
                    "typeId": fields.typeId ? fields.typeId : driver.vehicle.typeId,
                    "year": fields.year ? fields.year : driver.vehicle.year,
                    "seats": fields.seats ? fields.seats : driver.vehicle.seats,
                    "color": fields.color ? fields.color : driver.vehicle.color,
                    "model": fields.model ? fields.model : driver.vehicle.model,
                    "isAcAvailable": fields.isAcAvailable ? fields.isAcAvailable : driver.vehicle.isAcAvailable,
                    "isSmokingAllowed": fields.isSmokingAllowed ? fields.isSmokingAllowed : driver.vehicle.isSmokingAllowed,
                    "vehiclePhotos": driver.vehicle.vehiclePhotos,
                    "vehicleIdPhotos": driver.vehicle.vehicleIdPhotos,
                    "plateNoPhotos": driver.vehicle.plateNoPhotos,
                    "platNumber": fields.platNumber ? fields.platNumber : driver.vehicle.platNumber,
                }

                let updateDriverData = {
                    "uniqueID": fields.uniqueID,
                    "name": fields.name ? fields.name : driver.name,
                    "email": fields.email,
                    "dob": fields.dob ? fields.dob : driver.dob,
                    "phoneNumber": fields.phoneNumber ? fields.phoneNumber : driver.phoneNumber,
                    "countryCode": fields.countryCode ? fields.countryCode : driver.countryCode,
                    "onlyPhoneNumber": fields.onlyPhoneNumber ? fields.onlyPhoneNumber : driver.onlyPhoneNumber,
                    "profilePhoto": fields.profilePhoto ? fields.profilePhoto : driver.profilePhoto,
                    "idPhotos": driver.idPhotos,
                    "vehicle": vehicleData
                }

                DriverSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(fields.driver_id)
                }, {
                        $set: updateDriverData
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.DRIVER, log_message.ACTION.UPDATE_DRIVER + ", DriverId: " + updateData.autoIncrementID + ",  Name: " + updateData.name)
                        nextCall(null);
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.DRIVER_UPDATE_SUCC,
                data: {}
            });
        })
    },

    verifyUnverifyDriver: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driver_id', message.DRIVER_ID_REQUIRED).notEmpty();
                req.checkBody('admin_id', message.ADMIN_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get admin details */
            function (body, nextCall) {
                AdminSchema.findOne({
                    '_id': body.admin_id
                }).exec(function (err, admin) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!admin) {
                        return nextCall({
                            "message": message.ADMIN_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body)
                    }
                });
            },
            /** get driver details */
            function (body, nextCall) {
                DriverSchema.findOne({
                    '_id': body.driver_id
                }).exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driver) {
                        return nextCall({
                            "message": message.DRIVER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, driver)
                    }
                });
            },
            /** update user block status */
            function (body, driver, nextCall) {
                DriverSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.driver_id)
                }, {
                        $set: {
                            "isVerified": driver.isVerified ? false : true,
                            "verifiedBy": body.admin_id,
                            "verifiedDate": DS.now()
                        }
                    }, {
                        new: true
                    })
                    .populate('languageId')
                    .exec((err, driverUpdateData) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        nextCall(null, driverUpdateData)
                    });
            },
            /** Badge Count of notification */
            function (driverUpdateData, nextCall) {
                _self.badgeCount(driverUpdateData._id, isDriver = true, function (err, badgeCount) {
                    if (err) {
                        nextCall({ message: err })
                    }
                    else {
                        badgeCount = badgeCount ? badgeCount + 1 : 0
                        nextCall(null, driverUpdateData, badgeCount)
                    }
                })
            },
            /** Send notification */
            function (driverUpdateData, badgeCount, nextCall) {
                if (driverUpdateData && driverUpdateData.isVerified) {

                    let ADMIN_VERIFY_PROFILE;
                    if (driverUpdateData && driverUpdateData.languageId && driverUpdateData.languageId.code == 'km') {
                        ADMIN_VERIFY_PROFILE = COMBODIA_MESSAGES['ADMIN_VERIFY_PROFILE'];
                    } else if (driverUpdateData && driverUpdateData.languageId && driverUpdateData.languageId.code == 'zh') {
                        ADMIN_VERIFY_PROFILE = CHINESE_MESSAGES['ADMIN_VERIFY_PROFILE'];
                    } else {
                        ADMIN_VERIFY_PROFILE = message['ADMIN_VERIFY_PROFILE'];
                    }

                    let pushNotificationData = {
                        to: (driverUpdateData.deviceDetail && driverUpdateData.deviceDetail.token) || '',
                        type: 'driver',
                        data: {
                            title: '',
                            type: 11,
                            body: ADMIN_VERIFY_PROFILE,
                            badge: badgeCount,
                            tag: 'Admin Verify',
                            data: {}
                        }
                    }

                    pn.fcm(pushNotificationData, function (err, Success) {
                        let notificationData = {
                            title: pushNotificationData.data.body,
                            receiver_type: 'driver',
                            driverId: driverUpdateData._id
                        }
                        let Notification = new NotificationSchema(notificationData);
                        Notification.save((err, notification) => {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG,
                                });
                            }
                            _self.addActionLog(req.user, log_message.SECTION.DRIVER, log_message.ACTION.VERIFY_DRIVER + ", DriverId: " + driverUpdateData.autoIncrementID + ",  Name: " + driverUpdateData.name)
                            nextCall(null)
                        })
                    })
                } else {
                    _self.addActionLog(req.user, log_message.SECTION.DRIVER, log_message.ACTION.UNVERIFY_DRIVER + ", DriverId: " + driverUpdateData.autoIncrementID + ",  Name: " + driverUpdateData.name)
                    nextCall(null)
                }
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.DRIVER_ACTION_SUCC,
                data: {}
            });
        })
    },

    deleteDriver: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driver_id', message.DRIVER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get driver details */
            function (body, nextCall) {
                DriverSchema.findOne({
                    '_id': body.driver_id
                }).exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driver) {
                        return nextCall({
                            "message": message.DRIVER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, driver)
                    }
                });
            },
            /** update user delete status */
            function (body, driver, nextCall) {
                DriverSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.driver_id)
                }, {
                        $set: {
                            "isDeleted": true,
                        }
                    },
                    function (err, deleteData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }

                        // if (driver.profilePhoto && driver.profilePhoto != '') {
                        //     /** delete driver profile image */
                        //     Uploader.remove({
                        //         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + driver.profilePhoto
                        //     });
                        //     Uploader.remove({
                        //         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + driver.profilePhoto
                        //     });
                        // }

                        /** remove id Photos */
                        async.mapSeries(driver.idPhotos, function (k, nextFile) {
                            if (k && k != '') {
                                /** remove image from server */
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + k
                                });

                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + k
                                });
                            }
                            nextFile(null)
                        });

                        /** remove vehicle Photos */
                        async.mapSeries(driver.vehicle.vehiclePhotos, function (k, nextFile) {
                            if (k && k != '') {
                                /** remove image from server */
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
                                });

                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
                                });
                            }
                            nextFile(null)
                        });

                        /** remove vehicle id Photos */
                        async.mapSeries(driver.vehicle.vehicleIdPhotos, function (k, nextFile) {
                            if (k && k != '') {
                                /** remove image from server */
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
                                });

                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
                                });
                            }

                            nextFile(null)
                        });

                        /** remove plate number Photos */
                        async.mapSeries(driver.vehicle.plateNoPhotos, function (k, nextFile) {
                            if (k && k != '') {
                                /** remove image from server */
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
                                });

                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
                                });
                            }
                            nextFile(null)
                        });

                        _self.addActionLog(req.user, log_message.SECTION.DRIVER, log_message.ACTION.DELETE_DRIVER + ", DriverId: " + driver.autoIncrementID + ",  Name: " + driver.name)
                        nextCall(null);
                    });
            },
            /** update user block status */
            // function (body, driver, nextCall) {
            //     DriverSchema.remove({
            //         "_id": mongoose.Types.ObjectId(body.driver_id)
            //     },
            //         function (err, deleteData) {
            //             if (err) {
            //                 return nextCall({
            //                     "message": message.SOMETHING_WENT_WRONG
            //                 });
            //             }

            //             if (driver.profilePhoto && driver.profilePhoto != '') {
            //                 /** delete driver profile image */
            //                 Uploader.remove({
            //                     filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + driver.profilePhoto
            //                 });
            //                 Uploader.remove({
            //                     filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + driver.profilePhoto
            //                 });
            //             }

            //             /** remove id Photos */
            //             async.mapSeries(driver.idPhotos, function (k, nextFile) {
            //                 if (k && k != '') {
            //                     /** remove image from server */
            //                     Uploader.remove({
            //                         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_LARGE + k
            //                     });

            //                     Uploader.remove({
            //                         filepath: rootPath + '/' + CONSTANTS.PROFILE_PATH_THUMB + k
            //                     });
            //                 }
            //                 nextFile(null)
            //             });

            //             /** remove vehicle Photos */
            //             async.mapSeries(driver.vehicle.vehiclePhotos, function (k, nextFile) {
            //                 if (k && k != '') {
            //                     /** remove image from server */
            //                     Uploader.remove({
            //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
            //                     });

            //                     Uploader.remove({
            //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
            //                     });
            //                 }
            //                 nextFile(null)
            //             });

            //             /** remove vehicle id Photos */
            //             async.mapSeries(driver.vehicle.vehicleIdPhotos, function (k, nextFile) {
            //                 if (k && k != '') {
            //                     /** remove image from server */
            //                     Uploader.remove({
            //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
            //                     });

            //                     Uploader.remove({
            //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
            //                     });
            //                 }

            //                 nextFile(null)
            //             });

            //             /** remove plate number Photos */
            //             async.mapSeries(driver.vehicle.plateNoPhotos, function (k, nextFile) {
            //                 if (k && k != '') {
            //                     /** remove image from server */
            //                     Uploader.remove({
            //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
            //                     });

            //                     Uploader.remove({
            //                         filepath: rootPath + '/' + CONSTANTS.DRIVER_VEHICLE_PATH_LARGE + k
            //                     });
            //                 }
            //                 nextFile(null)
            //             });

            //             _self.addActionLog(req.user, log_message.SECTION.DRIVER, log_message.ACTION.DELETE_DRIVER + ", DriverId: " + driver.autoIncrementID + ",  Name: " + driver.name)
            //             nextCall(null);
            //         });
            // }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.DRIVER_DELETED_SUCC,
                data: {}
            });
        })
    },

    updateBillingPlan: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driver_id', message.DRIVER_ID_REQUIRED).notEmpty();
                req.checkBody('billingId', message.BILLING_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get driver details */
            function (body, nextCall) {
                DriverSchema.findOne({
                    '_id': body.driver_id
                }).exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driver) {
                        return nextCall({
                            "message": message.DRIVER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body)
                    }
                });
            },
            /** get billing plan details */
            function (body, nextCall) {
                BillingPlansSchema.findOne({
                    '_id': body.billingId
                }).exec(function (err, billingPlan) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!billingPlan) {
                        return nextCall({
                            "message": message.BILLING_PLAN_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, billingPlan)
                    }
                });
            },

            /** update driver billing plan */
            function (body, billingPlan, nextCall) {
                let updateData;
                if (billingPlan && billingPlan.type == "commercial_plan") {
                    updateData = {
                        $set: {
                            "billingId": billingPlan._id
                        },
                        $inc: {
                            creditBalance: -Number(billingPlan.chargeAmt)
                        }
                    }
                } else {
                    updateData = {
                        $set: {
                            "billingId": billingPlan._id
                        }
                    }
                }
                DriverSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.driver_id)
                }, updateData, {
                        new: true
                    }).populate('billingId').populate('languageId').exec(function (err, driverUpdateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        nextCall(null, driverUpdateData, billingPlan)
                    });
            },
            /** insert data into wallet logs */
            function (driverUpdateData, billingPlan, nextCall) {
                if (billingPlan && billingPlan.type == "commercial_plan") {
                    let insertData = {
                        driverId: driverUpdateData._id,
                        type: 'billing_plan_withdraw',
                        amount: Number(billingPlan.chargeAmt),
                        creditBy: req.user._id
                    }

                    let wallet = new WalletLogsSchema(insertData);
                    wallet.save(function (err, insertedData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            })
                        }
                        nextCall(null, driverUpdateData)
                    });
                } else {
                    nextCall(null, driverUpdateData)
                }

            },
            /** Badge Count of notification */
            function (driverUpdateData, nextCall) {
                _self.badgeCount(driverUpdateData._id, isDriver = true, function (err, badgeCount) {
                    if (err) {
                        nextCall({ message: err })
                    }
                    else {
                        badgeCount = badgeCount ? badgeCount + 1 : 0
                        nextCall(null, driverUpdateData, badgeCount)
                    }
                })
            },
            /** Send notification */
            function (driverUpdateData, badgeCount, nextCall) {
                let BILLING_PLAN_UPDATE_SUCC;
                if (driverUpdateData && driverUpdateData.languageId && driverUpdateData.languageId.code == 'km') {
                    BILLING_PLAN_UPDATE_SUCC = COMBODIA_MESSAGES['BILLING_PLAN_UPDATE_SUCC'];
                } else if (driverUpdateData && driverUpdateData.languageId && driverUpdateData.languageId.code == 'zh') {
                    BILLING_PLAN_UPDATE_SUCC = CHINESE_MESSAGES['BILLING_PLAN_UPDATE_SUCC'];
                } else {
                    BILLING_PLAN_UPDATE_SUCC = message['BILLING_PLAN_UPDATE_SUCC'];
                }

                let pushNotificationData = {
                    to: (driverUpdateData.deviceDetail && driverUpdateData.deviceDetail.token) || '',
                    type: 'driver',
                    data: {
                        title: '',
                        type: 12,
                        body: BILLING_PLAN_UPDATE_SUCC,
                        badge: badgeCount,
                        tag: 'Billing Plan',
                        data: {}
                    }
                }

                pn.fcm(pushNotificationData, function (err, Success) {
                    let notificationData = {
                        title: pushNotificationData.data.body,
                        receiver_type: 'driver',
                        driverId: driverUpdateData._id,
                        billingId: driverUpdateData.billingId._id,
                        bilingAmount: driverUpdateData.billingId.chargeAmt
                    }
                    let Notification = new NotificationSchema(notificationData);
                    Notification.save((err, notification) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.DRIVER, log_message.ACTION.UPDATE_BILLING_PLAN + ", DriverId: " + driverUpdateData.autoIncrementID + ",  Name: " + driverUpdateData.name)
                        nextCall(null)
                    })
                })
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.DRIVER_BILLING_PLAN_UPDATE_SUCC,
                data: {}
            });
        })
    },

    /**
     * Dashboard Data
     */
    getDashboardData: function (req, res) {
        async.waterfall([
            /** get today passenger count */
            function (nextCall) {
                PassengerSchema.count({
                    $and: [{
                        createdAt: {
                            $gte: moment().hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, todayPassengers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        let responseData = {};
                        responseData.todayPassengers = todayPassengers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get yesterday passenger count */
            function (responseData, nextCall) {
                PassengerSchema.count({
                    $and: [{
                        createdAt: {
                            $lte: moment().hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }, {
                        createdAt: {
                            $gte: moment().subtract(1, "days").hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, yesterdayPassengers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.yesterdayPassengers = yesterdayPassengers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get this month passenger count */
            function (responseData, nextCall) {
                PassengerSchema.count({
                    $and: [{
                        createdAt: {
                            $lte: moment().hours(23).minutes(59).seconds(0).milliseconds(0).format()
                        }
                    }, {
                        createdAt: {
                            $gte: moment().startOf('month').hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, thisMonthPassengers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.thisMonthPassengers = thisMonthPassengers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get this last month passenger count */
            function (responseData, nextCall) {
                PassengerSchema.count({
                    $and: [{
                        createdAt: {
                            $gte: moment().startOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }, {
                        createdAt: {
                            $lte: moment().endOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, lastMonthPassengers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.lastMonthPassengers = lastMonthPassengers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get this year passenger count */
            function (responseData, nextCall) {
                PassengerSchema.count({
                    $and: [{
                        createdAt: {
                            $gte: moment().startOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format()
                        }
                    }, {
                        createdAt: {
                            $lte: moment().endOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, thisYearPassengers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.thisYearPassengers = thisYearPassengers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get last year passenger count */
            function (responseData, nextCall) {
                PassengerSchema.count({
                    $and: [{
                        createdAt: {
                            $gte: moment().startOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format()
                        }
                    }, {
                        createdAt: {
                            $lte: moment().endOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, lastYearPassengers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.lastYearPassengers = lastYearPassengers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get total passenger count */
            function (responseData, nextCall) {
                PassengerSchema.count({
                    isDeleted: false
                }).exec(function (err, totalPassengers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.totalPassengers = totalPassengers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get today driver count */
            function (responseData, nextCall) {
                DriverSchema.count({
                    $and: [{
                        createdAt: {
                            $gte: moment().hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, todayDrivers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.todayDrivers = todayDrivers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get yesterday driver count */
            function (responseData, nextCall) {
                DriverSchema.count({
                    $and: [{
                        createdAt: {
                            $lte: moment().hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }, {
                        createdAt: {
                            $gte: moment().subtract(1, "days").hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, yesterdayDrivers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.yesterdayDrivers = yesterdayDrivers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get this month driver count */
            function (responseData, nextCall) {
                DriverSchema.count({
                    $and: [{
                        createdAt: {
                            $lte: moment().hours(23).minutes(59).seconds(0).milliseconds(0).format()
                        }
                    }, {
                        createdAt: {
                            $gte: moment().startOf('month').hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, thisMonthDrivers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.thisMonthDrivers = thisMonthDrivers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get this last month driver count */
            function (responseData, nextCall) {
                DriverSchema.count({
                    $and: [{
                        createdAt: {
                            $gte: moment().startOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }, {
                        createdAt: {
                            $lte: moment().endOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, lastMonthDrivers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.lastMonthDrivers = lastMonthDrivers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get this year driver count */
            function (responseData, nextCall) {
                DriverSchema.count({
                    $and: [{
                        createdAt: {
                            $gte: moment().startOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format()
                        }
                    }, {
                        createdAt: {
                            $lte: moment().endOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, thisYearDrivers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.thisYearDrivers = thisYearDrivers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get last year driver count */
            function (responseData, nextCall) {
                DriverSchema.count({
                    $and: [{
                        createdAt: {
                            $gte: moment().startOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format()
                        }
                    }, {
                        createdAt: {
                            $lte: moment().endOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format()
                        }
                    }],
                    isDeleted: false
                }).exec(function (err, lastYearDrivers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.lastYearDrivers = lastYearDrivers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get total driver count */
            function (responseData, nextCall) {
                DriverSchema.count({
                    isDeleted: false
                }).exec(function (err, totalDrivers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.totalDrivers = totalDrivers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get total unverified driver count */
            function (responseData, nextCall) {
                DriverSchema.count({
                    isVerified: false,
                    isDeleted: false
                }).exec(function (err, totalUnverifiedDrivers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.totalUnverifiedDrivers = totalUnverifiedDrivers;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get online vehicles count */
            function (responseData, nextCall) {
                DriverSchema.count({
                    isAvailable: true,
                    isDeleted: false
                }).exec(function (err, onlineVehicles) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.onlineVehicles = onlineVehicles;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get offline vehicles count */
            function (responseData, nextCall) {
                DriverSchema.count({
                    isAvailable: false,
                    isDeleted: false
                }).exec(function (err, offlineVehicles) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        responseData.offlineVehicles = offlineVehicles;
                        nextCall(null, responseData)
                    }
                });
            },
            /** get daily income */
            function (responseData, nextCall) {
                let aggregateQuery = [];

                aggregateQuery.push({
                    $match: {
                        "paymentAt": {
                            "$exists": true,
                            "$ne": null
                        }
                    }
                })
                aggregateQuery.push({
                    $match: {
                        'createdAt': {
                            $gte: new Date(moment().utc().startOf('month').hours(00).minutes(00).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().utc().endOf('month').hours(23).minutes(57).seconds(0).milliseconds(0).format())
                        }
                    }
                })

                aggregateQuery.push({
                    $group: {
                        '_id': {
                            day: {
                                $dayOfMonth: "$paymentAt"
                            },
                            month: {
                                $month: "$paymentAt"
                            },
                            year: {
                                $year: "$paymentAt"
                            }
                        },
                        'totalEarning': {
                            $sum: '$adminEarning'
                        },
                        count: {
                            $sum: 1
                        }
                    }
                })
                aggregateQuery.push({
                    $unwind: {
                        path: "$totalEarning",
                        includeArrayIndex: "arrayIndex"
                    }
                })
                aggregateQuery.push({
                    $project: {
                        "_id": 0,
                        "date": "$_id.day",
                        "month": "$_id.month",
                        "year": "$_id.year",
                        "totalEarning": {
                            $toInt: "$totalEarning"
                        }
                        // "totalEarning": {
                        //     $divide: [{
                        //             $subtract: [{
                        //                     $multiply: ['$totalEarning', 100]
                        //                 },
                        //                 {
                        //                     $mod: [{
                        //                         $multiply: ['$totalEarning', 100]
                        //                     }, 1]
                        //                 }
                        //             ]
                        //         },
                        //         100
                        //     ]
                        // }
                    }
                })
                aggregateQuery.push({
                    $sort: {
                        "date": 1
                    }
                })

                RideSchema.aggregate(aggregateQuery, (err, dailyEarning) => {
                    console.log("111111111111")
                    if (err) {
                        console.log("error",err)
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        console.log(responseData)
                        responseData.dailyEarning = dailyEarning;
                        nextCall(null, responseData)
                    }
                })
            },
            /** get monthly income */
            // function (responseData, nextCall) {
            //     let aggregateQuery = [];

            //     aggregateQuery.push({
            //         $match: {
            //             "paymentAt": {
            //                 "$exists": true,
            //                 "$ne": null
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $match: {
            //             'createdAt': {
            //                 $gte: new Date(moment().utc().startOf('year').hours(00).minutes(00).seconds(0).milliseconds(0).format()),
            //                 $lte: new Date(moment().utc().endOf('year').hours(23).minutes(57).seconds(0).milliseconds(0).format())
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $group: {
            //             '_id': {
            //                 month: {
            //                     $month: "$paymentAt"
            //                 },
            //                 year: {
            //                     $year: "$paymentAt"
            //                 }
            //             },
            //             'totalEarning': {
            //                 $sum: '$adminEarning'
            //             },
            //             count: {
            //                 $sum: 1
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $unwind: {
            //             path: "$totalEarning",
            //             includeArrayIndex: "arrayIndex"
            //         }
            //     })
            //     aggregateQuery.push({
            //         $project: {
            //             "_id": 0,
            //             "month": "$_id.month",
            //             "year": "$_id.year",
            //             "totalEarning": {
            //                 $toInt: "$totalEarning"
            //             }
            //             // "totalEarning": {
            //             //     $divide: [{
            //             //             $subtract: [{
            //             //                     $multiply: ['$totalEarning', 100]
            //             //                 },
            //             //                 {
            //             //                     $mod: [{
            //             //                         $multiply: ['$totalEarning', 100]
            //             //                     }, 1]
            //             //                 }
            //             //             ]
            //             //         },
            //             //         100
            //             //     ]
            //             // }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $sort: {
            //             "month": 1
            //         }
            //     })

            //     RideSchema.aggregate(aggregateQuery, (err, monthlyEarning) => {
            //         if (err) {
            //             return nextCall({
            //                 "message": message.SOMETHING_WENT_WRONG,
            //             });
            //         } else {
            //             responseData.monthlyEarning = monthlyEarning;
            //             nextCall(null, responseData)
            //         }
            //     })
            // },
            /** get yearly income */
            // function (responseData, nextCall) {
            //     let aggregateQuery = [];

            //     aggregateQuery.push({
            //         $match: {
            //             "paymentAt": {
            //                 "$exists": true,
            //                 "$ne": null
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $group: {
            //             '_id': {
            //                 year: {
            //                     $year: "$paymentAt"
            //                 }
            //             },
            //             'totalEarning': {
            //                 $sum: '$adminEarning'
            //             },
            //             count: {
            //                 $sum: 1
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $unwind: {
            //             path: "$totalEarning",
            //             includeArrayIndex: "arrayIndex"
            //         }
            //     })
            //     aggregateQuery.push({
            //         $project: {
            //             "_id": 0,
            //             "year": "$_id.year",
            //             "totalEarning": {
            //                 $toInt: "$totalEarning"
            //             }
            //             // "totalEarning": {
            //             //     $divide: [{
            //             //             $subtract: [{
            //             //                     $multiply: ['$totalEarning', 100]
            //             //                 },
            //             //                 {
            //             //                     $mod: [{
            //             //                         $multiply: ['$totalEarning', 100]
            //             //                     }, 1]
            //             //                 }
            //             //             ]
            //             //         },
            //             //         100
            //             //     ]
            //             // }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $sort: {
            //             "year": 1
            //         }
            //     })

            //     RideSchema.aggregate(aggregateQuery, (err, yearlyEarning) => {
            //         if (err) {
            //             return nextCall({
            //                 "message": message.SOMETHING_WENT_WRONG,
            //             });
            //         } else {
            //             responseData.yearlyEarning = yearlyEarning;
            //             nextCall(null, responseData)
            //         }
            //     })
            // },
            /** get total income */
            function (responseData, nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $group: {
                        '_id': null,
                        'totalEarning': {
                            $sum: '$adminEarning'
                        },
                        count: {
                            $sum: 1
                        }
                    }
                })
                aggregateQuery.push({
                    $unwind: {
                        path: "$totalEarning",
                        includeArrayIndex: "arrayIndex"
                    }
                })
                aggregateQuery.push({
                    $project: {
                        "_id": 0,
                        "totalEarning": {
                            $toInt: "$totalEarning"
                        }
                        // "totalEarning": {
                        //     $divide: [{
                        //             $subtract: [{
                        //                     $multiply: ['$totalEarning', 100]
                        //                 },
                        //                 {
                        //                     $mod: [{
                        //                         $multiply: ['$totalEarning', 100]
                        //                     }, 1]
                        //                 }
                        //             ]
                        //         },
                        //         100
                        //     ]
                        // }
                    }
                })

                RideSchema.aggregate(aggregateQuery, (err, totalEarning) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else if (totalEarning[0]) {
                        responseData.totalEarning = totalEarning[0].totalEarning;
                        nextCall(null, responseData)
                    } else {
                        responseData.totalEarning = totalEarning;
                        nextCall(null, responseData)
                    }
                })
            },
            /** get last year total income */
            function (responseData, nextCall) {
                let aggregateQuery = [];
                // $gte: moment().startOf('year').year(new Date().getFullYear() - 1).hours(00).minutes(00).seconds(0).milliseconds(0).format(),
                // $lte: moment().endOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format()
                aggregateQuery.push({
                    $match: {
                        'createdAt': {
                            $gte: new Date(moment().utc().startOf('year').subtract(1, 'years').hours(00).minutes(00).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().utc().endOf('year').subtract(1, 'years').hours(23).minutes(57).seconds(0).milliseconds(0).format())
                        }
                    }
                })
                aggregateQuery.push({
                    $group: {
                        '_id': null,
                        'totalEarning': {
                            $sum: '$adminEarning'
                        },
                        count: {
                            $sum: 1
                        }
                    }
                })

                aggregateQuery.push({
                    $unwind: {
                        path: "$totalEarning"
                    }
                })

                aggregateQuery.push({
                    $project: {
                        "_id": 0,
                        "totalEarning": {
                            $toInt: "$totalEarning"
                        }
                        // "totalEarning": {
                        //     $divide: [{
                        //             $subtract: [{
                        //                     $multiply: ['$totalEarning', 100]
                        //                 },
                        //                 {
                        //                     $mod: [{
                        //                         $multiply: ['$totalEarning', 100]
                        //                     }, 1]
                        //                 }
                        //             ]
                        //         },
                        //         100
                        //     ]
                        // }
                    }
                })

                RideSchema.aggregate(aggregateQuery, (err, totalEarning) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else if (totalEarning[0]) {
                        responseData.lastYearTotalIncome = totalEarning[0].totalEarning;
                        nextCall(null, responseData)
                    } else {
                        responseData.lastYearTotalIncome = totalEarning;
                        nextCall(null, responseData)
                    }
                })
            },
            /** get current year total income */
            // function (responseData, nextCall) {
            //     let aggregateQuery = [];

            //     aggregateQuery.push({
            //         $match: {
            //             "paymentAt": {
            //                 "$exists": true,
            //                 "$ne": null
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $match: {
            //             'createdAt': {
            //                 $gte: new Date(moment().utc().startOf('year').hours(00).minutes(00).seconds(0).milliseconds(0).format()),
            //                 $lte: new Date(moment().utc().endOf('year').hours(23).minutes(57).seconds(0).milliseconds(0).format())
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $group: {
            //             '_id': {
            //                 month: {
            //                     $month: "$paymentAt"
            //                 },
            //                 year: {
            //                     $year: "$paymentAt"
            //                 }
            //             },
            //             'totalEarning': {
            //                 $sum: '$adminEarning'
            //             },
            //             count: {
            //                 $sum: 1
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $unwind: {
            //             path: "$totalEarning",
            //             includeArrayIndex: "arrayIndex"
            //         }
            //     })
            //     aggregateQuery.push({
            //         $project: {
            //             "_id": 0,
            //             "month": "$_id.month",
            //             "year": "$_id.year",
            //             "totalEarning": {
            //                 $toInt: "$totalEarning"
            //             }
            //             // "totalEarning": {
            //             //     $divide: [{
            //             //             $subtract: [{
            //             //                     $multiply: ['$totalEarning', 100]
            //             //                 },
            //             //                 {
            //             //                     $mod: [{
            //             //                         $multiply: ['$totalEarning', 100]
            //             //                     }, 1]
            //             //                 }
            //             //             ]
            //             //         },
            //             //         100
            //             //     ]
            //             // }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $sort: {
            //             "month": 1
            //         }
            //     })

            //     RideSchema.aggregate(aggregateQuery, (err, currentYearTotalEarning) => {
            //         if (err) {
            //             return nextCall({
            //                 "message": message.SOMETHING_WENT_WRONG,
            //             });
            //         } else {
            //             responseData.currentYearTotalEarning = currentYearTotalEarning;
            //             nextCall(null, responseData)
            //         }
            //     })
            // },
            /** get total vehicle type */
            function (responseData, nextCall) {
                let aggregateQuery = [];

                aggregateQuery.push({
                    $lookup: {
                        "from": "driver",
                        "localField": "_id",
                        "foreignField": "vehicle.typeId",
                        "as": "driverRef"
                    }
                })
                aggregateQuery.push({
                    $unwind: {
                        path: "$driverRef"
                    }
                })

                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        "type": {
                            $first: '$type'
                        },
                        'count': {
                            $sum: 1
                        }
                    }
                })
                aggregateQuery.push({
                    $project: {
                        "_id": 0,
                        "type": 1,
                        'count': 1,
                    }
                })

                VehicleTypeSchema.aggregate(aggregateQuery, (err, totalVehicleType) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.totalVehicleType = totalVehicleType;
                        nextCall(null, responseData)
                    }
                })
            },
            /** get active ride details */
            function (responseData, nextCall) {
                RideSchema.count({
                    'status': "onride"
                }, function (err, activeRideCount) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.SOMETHING_WENT_WRONG
                        });
                    }
                    responseData.activeRideCount = activeRideCount;
                    nextCall(null, responseData)
                });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_DASHBOARD_DATA_SUCC,
                data: response
            });
        })
    },

    getDashboardMapData: function (req, res) {
        async.waterfall([
            /** get all drivers */
            function (nextCall) {
                DriverSchema.find({
                    isDeleted: false
                }).select('name location uniqueID vehicle isAvailable isBusy isOnline').populate('vehicle.typeId').exec(function (err, drivers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else {
                        nextCall(null, drivers)
                    }
                });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_DASHBOARD_DATA_SUCC,
                data: response
            });
        })
    },

    getTopTenDriverAndPassengerData: function (req, res) {
        async.waterfall([
            //  /** get top ten driver by referral money and ride money */
            // function (nextCall) {
            //     let aggregateQuery = [];

            //     aggregateQuery.push({
            //         $lookup: {
            //             "from": "ride",
            //             "localField": "_id",
            //             "foreignField": "driverId",
            //             "as": "rideRef"
            //         }
            //     })
            //     aggregateQuery.push({
            //         $unwind: {
            //             path: "$rideRef"
            //         }
            //     })
            //     // aggregateQuery.push({
            //     //     $match: {
            //     //         'rideRef.createdAt': {
            //     //             $gte: new Date(moment().utc().startOf('month').hours(00).minutes(00).seconds(0).milliseconds(0).format()),
            //     //             $lte: new Date(moment().utc().endOf('month').hours(23).minutes(57).seconds(0).milliseconds(0).format())
            //     //         }
            //     //     }
            //     // })
            //     aggregateQuery.push({
            //         $group: {
            //             '_id': "$_id",
            //             'driverEarning': {
            //                 $sum: '$rideRef.driverEarning'
            //             },
            //             'name': {
            //                 $first: '$name'
            //             },
            //             'autoIncrementID': {
            //                 $first: '$autoIncrementID'
            //             },
            //             'avgRating': {
            //                 $first: '$avgRating'
            //             },
            //             'countryCode': {
            //                 $first: '$countryCode'
            //             },
            //             'createdAt': {
            //                 $first: '$createdAt'
            //             },
            //             'creditBalance': {
            //                 $first: '$creditBalance'
            //             },
            //             'dob': {
            //                 $first: '$dob'
            //             },
            //             'driverLevel': {
            //                 $first: '$driverLevel'
            //             },
            //             'email': {
            //                 $first: '$email'
            //             },
            //             'isBlocked': {
            //                 $first: '$isBlocked'
            //             },
            //             'isVerified': {
            //                 $first: '$isVerified'
            //             },
            //             'onlyPhoneNumber': {
            //                 $first: '$onlyPhoneNumber'
            //             },
            //             'phoneNumber': {
            //                 $first: '$phoneNumber'
            //             },
            //             'profilePhoto': {
            //                 $first: '$profilePhoto'
            //             },
            //             'uniqueID': {
            //                 $first: '$uniqueID'
            //             }
            //         }
            //     })

            //     aggregateQuery.push({
            //         $lookup: {
            //             "from": "driver_referral_earning_logs",
            //             "localField": "_id",
            //             "foreignField": "beneficiaryDriverId",
            //             "as": "driverReferral"
            //         }
            //     })
            //     aggregateQuery.push({
            //         $unwind: {
            //             path: "$driverReferral",
            //             preserveNullAndEmptyArrays: true
            //         }
            //     })
            //     // aggregateQuery.push({
            //     //     $match: {
            //     //         'driverReferral.createdAt': {
            //     //             $exists: false
            //     //         }
            //     //     }
            //     //     // 'driverReferral.createdAt': {
            //     //     //     $gte: new Date(moment().utc().startOf('month').hours(00).minutes(00).seconds(0).milliseconds(0).format()),
            //     //     //     $lte: new Date(moment().utc().endOf('month').hours(23).minutes(57).seconds(0).milliseconds(0).format())
            //     //     // }
            //     //     // }
            //     // })

            //     // Sum
            //     aggregateQuery.push({
            //         $group: {
            //             '_id': "$_id",
            //             'referralAmount': {
            //                 $sum: '$driverReferral.referralAmount'
            //             },
            //             'driverEarning': {
            //                 $first: '$driverEarning'
            //             },
            //             'name': {
            //                 $first: '$name'
            //             },
            //             'autoIncrementID': {
            //                 $first: '$autoIncrementID'
            //             },
            //             'avgRating': {
            //                 $first: '$avgRating'
            //             },
            //             'countryCode': {
            //                 $first: '$countryCode'
            //             },
            //             'createdAt': {
            //                 $first: '$createdAt'
            //             },
            //             'creditBalance': {
            //                 $first: '$creditBalance'
            //             },
            //             'dob': {
            //                 $first: '$dob'
            //             },
            //             'driverLevel': {
            //                 $first: '$driverLevel'
            //             },
            //             'email': {
            //                 $first: '$email'
            //             },
            //             'isBlocked': {
            //                 $first: '$isBlocked'
            //             },
            //             'isVerified': {
            //                 $first: '$isVerified'
            //             },
            //             'onlyPhoneNumber': {
            //                 $first: '$onlyPhoneNumber'
            //             },
            //             'phoneNumber': {
            //                 $first: '$phoneNumber'
            //             },
            //             'profilePhoto': {
            //                 $first: '$profilePhoto'
            //             },
            //             'uniqueID': {
            //                 $first: '$uniqueID'
            //             }
            //         }
            //     })

            //     aggregateQuery.push({
            //         $project: {
            //             "_id": "$_id",
            //             "name": "$name",
            //             "autoIncrementID": 1,
            //             "avgRating": 1,
            //             "countryCode": 1,
            //             "createdAt": 1,
            //             "creditBalance": 1,
            //             "dob": 1,
            //             "driverLevel": 1,
            //             "email": 1,
            //             "isBlocked": 1,
            //             "isVerified": 1,
            //             "onlyPhoneNumber": 1,
            //             "phoneNumber": 1,
            //             "profilePhoto": 1,
            //             "uniqueID": 1,
            //             'driverEarning': {
            //                 $divide: [{
            //                         $subtract: [{
            //                                 $multiply: [{
            //                                     '$add': ['$driverEarning', '$referralAmount']
            //                                 }, 100]
            //                             },
            //                             {
            //                                 $mod: [{
            //                                     $multiply: [{
            //                                         '$add': ['$driverEarning', '$referralAmount']
            //                                     }, 100]
            //                                 }, 1]
            //                             }
            //                         ]
            //                     },
            //                     100
            //                 ]
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $sort: {
            //             "driverEarning": -1
            //         }
            //     })
            //     aggregateQuery.push({
            //         $limit: 10
            //     })

            //     DriverSchema.aggregate(aggregateQuery, (err, driverEarning) => {
            //         if (err) {
            //             return nextCall({
            //                 "message": message.SOMETHING_WENT_WRONG,
            //             });
            //         } else {
            //             let responseData = {};
            //             responseData.topTenDriver = driverEarning;
            //             nextCall(null, responseData)
            //         }
            //     })
            // },
            // /** get top ten passenger by referral money */
            // function (responseData, nextCall) {
            //     let aggregateQuery = [];

            //     aggregateQuery.push({
            //         $lookup: {
            //             "from": "passenger_referral_earning_logs",
            //             "localField": "_id",
            //             "foreignField": "beneficiaryPassengerId",
            //             "as": "passengerReferral"
            //         }
            //     })
            //     aggregateQuery.push({
            //         $unwind: {
            //             path: "$passengerReferral"
            //         }
            //     })

            //     aggregateQuery.push({
            //         $group: {
            //             '_id': "$_id",
            //             'passengerEarning': {
            //                 $sum: '$passengerReferral.referralAmount'
            //             },
            //             'name': {
            //                 $first: '$name'
            //             },
            //             'autoIncrementID': {
            //                 $first: '$autoIncrementID'
            //             },
            //             'countryCode': {
            //                 $first: '$countryCode'
            //             },
            //             'createdAt': {
            //                 $first: '$createdAt'
            //             },
            //             'dob': {
            //                 $first: '$dob'
            //             },
            //             'name': {
            //                 $first: '$name'
            //             },
            //             'email': {
            //                 $first: '$email'
            //             },
            //             'isBlocked': {
            //                 $first: '$isBlocked'
            //             },
            //             'onlyPhoneNumber': {
            //                 $first: '$onlyPhoneNumber'
            //             },
            //             'passengerLevel': {
            //                 $first: '$passengerLevel'
            //             },
            //             'phoneNumber': {
            //                 $first: '$phoneNumber'
            //             },
            //             'profilePhoto': {
            //                 $first: '$profilePhoto'
            //             },
            //             'uniqueID': {
            //                 $first: '$uniqueID'
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $project: {
            //             "_id": "$_id",
            //             "name": 1,
            //             'autoIncrementID': 1,
            //             'countryCode': 1,
            //             'createdAt': 1,
            //             'dob': 1,
            //             'name': 1,
            //             'email': 1,
            //             'isBlocked': 1,
            //             'onlyPhoneNumber': 1,
            //             'passengerLevel': 1,
            //             'phoneNumber': 1,
            //             'profilePhoto': 1,
            //             'uniqueID':1,
            //             'passengerEarning': {
            //                 $divide: [{
            //                         $subtract: [{
            //                                 $multiply: ['$passengerEarning', 100]
            //                             },
            //                             {
            //                                 $mod: [{
            //                                     $multiply: ['$passengerEarning', 100]
            //                                 }, 1]
            //                             }
            //                         ]
            //                     },
            //                     100
            //                 ]
            //             }
            //         }
            //     })
            //     aggregateQuery.push({
            //         $sort: {
            //             "passengerEarning": -1
            //         }
            //     })
            //     aggregateQuery.push({
            //         $limit: 10
            //     })

            //     PassengerSchema.aggregate(aggregateQuery, (err, passengerEarning) => {
            //         if (err) {
            //             return nextCall({
            //                 "message": message.SOMETHING_WENT_WRONG,
            //             });
            //         } else {
            //             responseData.topTenPassenger = passengerEarning;
            //             nextCall(null, responseData)
            //         }
            //     })
            // },
            /** get top ten driver by driver earning in ride */
            function (nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $match: {
                        "isDeleted": false
                    }
                })
                // stage 1
                aggregateQuery.push({
                    $lookup: {
                        "from": "ride",
                        "localField": "_id",
                        "foreignField": "driverId",
                        "as": "rideRef"
                    }
                })
                // stage 2
                aggregateQuery.push({
                    $unwind: {
                        path: "$rideRef",
                        preserveNullAndEmptyArrays: true
                    }
                })
                // stage 3
                aggregateQuery.push({
                    $match: {
                        "rideRef.status": "completed",
                        "rideRef.paymentStatus": true
                    }
                })
                // stage 4
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        'driverEarning': {
                            $sum: '$rideRef.driverEarning'
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'avgRating': {
                            $first: '$avgRating'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'creditBalance': {
                            $first: '$creditBalance'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'driverLevel': {
                            $first: '$driverLevel'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'isVerified': {
                            $first: '$isVerified'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 5
                aggregateQuery.push({
                    $project: {
                        "_id": "$_id",
                        "name": "$name",
                        "autoIncrementID": 1,
                        "avgRating": 1,
                        "countryCode": 1,
                        "createdAt": 1,
                        "creditBalance": 1,
                        "dob": 1,
                        "driverLevel": 1,
                        "email": 1,
                        "isBlocked": 1,
                        "isVerified": 1,
                        "onlyPhoneNumber": 1,
                        "phoneNumber": 1,
                        "profilePhoto": 1,
                        "uniqueID": 1,
                        'driverEarning': 1
                    }
                })
                // stage 6
                aggregateQuery.push({
                    $sort: {
                        "driverEarning": -1
                    }
                })
                // stage 7
                aggregateQuery.push({
                    $limit: 10
                })

                DriverSchema.aggregate(aggregateQuery, (err, driverEarning) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        let responseData = {};
                        responseData.topTenDriverByDrivingMoney = driverEarning;
                        nextCall(null, responseData)
                    }
                })
            },
            /** get top ten passenger by spent total ride amount */
            function (responseData, nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $match: {
                        "isDeleted": false
                    }
                })
                // stage 1
                aggregateQuery.push({
                    $lookup: {
                        "from": "ride",
                        "localField": "_id",
                        "foreignField": "passengerId",
                        "as": "rideRef"
                    }
                })
                // stage 2
                aggregateQuery.push({
                    $unwind: {
                        path: "$rideRef"
                    }
                })
                // stage 3
                aggregateQuery.push({
                    $match: {
                        "rideRef.status": "completed",
                        "rideRef.paymentStatus": true
                    }
                })
                // stage 4
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        'passengerEarning': {
                            $sum: '$rideRef.toatlFare'
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'name': {
                            $first: '$name'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'passengerLevel': {
                            $first: '$passengerLevel'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 5
                aggregateQuery.push({
                    $project: {
                        "_id": "$_id",
                        "name": 1,
                        'autoIncrementID': 1,
                        'countryCode': 1,
                        'createdAt': 1,
                        'dob': 1,
                        'name': 1,
                        'email': 1,
                        'isBlocked': 1,
                        'onlyPhoneNumber': 1,
                        'passengerLevel': 1,
                        'phoneNumber': 1,
                        'profilePhoto': 1,
                        'uniqueID': 1,
                        'passengerEarning': 1
                    }
                })
                // stage 6
                aggregateQuery.push({
                    $sort: {
                        "passengerEarning": -1
                    }
                })
                // stage 7
                aggregateQuery.push({
                    $limit: 10
                })

                PassengerSchema.aggregate(aggregateQuery, (err, passengerEarning) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.topTenPassengerByRideSpentMoney = passengerEarning;
                        nextCall(null, responseData)
                    }
                })
            },
            /** get top ten driver by Number of completed rides */
            function (responseData, nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $match: {
                        "isDeleted": false
                    }
                })
                // stage 1
                aggregateQuery.push({
                    $lookup: {
                        "from": "ride",
                        "localField": "_id",
                        "foreignField": "driverId",
                        "as": "rideRef"
                    }
                })
                // stage 2
                aggregateQuery.push({
                    $unwind: {
                        path: "$rideRef",
                        preserveNullAndEmptyArrays: true
                    }
                })
                // stage 3
                aggregateQuery.push({
                    $match: {
                        "rideRef.status": "completed",
                        "rideRef.paymentStatus": true
                    }
                })
                // stage 4
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        'totalCompletedRide': {
                            $sum: 1
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'avgRating': {
                            $first: '$avgRating'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'creditBalance': {
                            $first: '$creditBalance'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'driverLevel': {
                            $first: '$driverLevel'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'isVerified': {
                            $first: '$isVerified'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 5
                aggregateQuery.push({
                    $project: {
                        "_id": "$_id",
                        "name": "$name",
                        "autoIncrementID": 1,
                        "avgRating": 1,
                        "countryCode": 1,
                        "createdAt": 1,
                        "creditBalance": 1,
                        "dob": 1,
                        "driverLevel": 1,
                        "email": 1,
                        "isBlocked": 1,
                        "isVerified": 1,
                        "onlyPhoneNumber": 1,
                        "phoneNumber": 1,
                        "profilePhoto": 1,
                        "uniqueID": 1,
                        'totalCompletedRide': 1
                    }
                })
                // stage 6
                aggregateQuery.push({
                    $sort: {
                        "totalCompletedRide": -1
                    }
                })
                // stage 7
                aggregateQuery.push({
                    $limit: 10
                })

                DriverSchema.aggregate(aggregateQuery, (err, totalCompletedRideData) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.topTenDriverByCompletedRide = totalCompletedRideData;
                        nextCall(null, responseData)
                    }
                })
            },
            /** get top ten passenger by Number of completed rides */
            function (responseData, nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $match: {
                        "isDeleted": false
                    }
                })
                // stage 1
                aggregateQuery.push({
                    $lookup: {
                        "from": "ride",
                        "localField": "_id",
                        "foreignField": "passengerId",
                        "as": "rideRef"
                    }
                })
                // stage 2
                aggregateQuery.push({
                    $unwind: {
                        path: "$rideRef"
                    }
                })
                // stage 3
                aggregateQuery.push({
                    $match: {
                        "rideRef.status": "completed",
                        "rideRef.paymentStatus": true
                    }
                })
                // stage 4
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        'totalCompletedRide': {
                            $sum: 1
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'name': {
                            $first: '$name'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'passengerLevel': {
                            $first: '$passengerLevel'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 5
                aggregateQuery.push({
                    $project: {
                        "_id": "$_id",
                        "name": 1,
                        'autoIncrementID': 1,
                        'countryCode': 1,
                        'createdAt': 1,
                        'dob': 1,
                        'name': 1,
                        'email': 1,
                        'isBlocked': 1,
                        'onlyPhoneNumber': 1,
                        'passengerLevel': 1,
                        'phoneNumber': 1,
                        'profilePhoto': 1,
                        'uniqueID': 1,
                        'totalCompletedRide': 1
                    }
                })
                // stage 6
                aggregateQuery.push({
                    $sort: {
                        "totalCompletedRide": -1
                    }
                })
                // stage 7
                aggregateQuery.push({
                    $limit: 10
                })

                PassengerSchema.aggregate(aggregateQuery, (err, totalCompletedRideData) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.topTenPassengerByCompletedRide = totalCompletedRideData;
                        nextCall(null, responseData)
                    }
                })
            },
            /** get top ten driver by Number of referral people count */
            function (responseData, nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $match: {
                        "isDeleted": false
                    }
                })
                // stage 1
                aggregateQuery.push({
                    $lookup: {
                        "from": "driver_referrals",
                        "localField": "_id",
                        "foreignField": "parentDriver",
                        "as": "parentDriverReferrals"
                    }
                })
                // stage 2
                aggregateQuery.push({
                    $unwind: {
                        path: "$parentDriverReferrals",
                        preserveNullAndEmptyArrays: true
                    }
                })
                // stage 3
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        'parentDriverReferralsCount': {
                            $sum: {
                                $cond: {
                                    if: {
                                        $gt: ["$parentDriverReferrals.driverLevel", 0]
                                    },
                                    then: 1,
                                    else: 0
                                }
                            },
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'avgRating': {
                            $first: '$avgRating'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'creditBalance': {
                            $first: '$creditBalance'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'driverLevel': {
                            $first: '$driverLevel'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'isVerified': {
                            $first: '$isVerified'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 4
                aggregateQuery.push({
                    $lookup: {
                        "from": "driver_referrals",
                        "localField": "_id",
                        "foreignField": "grandParentDriver",
                        "as": "grandParentReferrals"
                    }
                })
                // stage 5
                aggregateQuery.push({
                    $unwind: {
                        path: "$grandParentReferrals",
                        preserveNullAndEmptyArrays: true
                    }
                })
                // stage 6
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        'parentDriverReferralsCount': {
                            $first: "$parentDriverReferralsCount"
                        },
                        'grandParentReferralsCount': {
                            $sum: {
                                $cond: {
                                    if: {
                                        $gt: ["$grandParentReferrals.driverLevel", 0]
                                    },
                                    then: 1,
                                    else: 0
                                }
                            },
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'avgRating': {
                            $first: '$avgRating'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'creditBalance': {
                            $first: '$creditBalance'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'driverLevel': {
                            $first: '$driverLevel'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'isVerified': {
                            $first: '$isVerified'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 7
                aggregateQuery.push({
                    $lookup: {
                        "from": "driver_referrals",
                        "localField": "_id",
                        "foreignField": "greatGrandParentDriver",
                        "as": "greatGrandParentDriverReferrals"
                    }
                })
                // stage 8
                aggregateQuery.push({
                    $unwind: {
                        path: "$greatGrandParentDriverReferrals",
                        preserveNullAndEmptyArrays: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        'parentDriverReferralsCount': {
                            $first: "$parentDriverReferralsCount"
                        },
                        'grandParentReferralsCount': {
                            $first: "$grandParentReferralsCount"
                        },
                        'greatGrandParentDriverReferralsCount': {
                            $sum: {
                                $cond: {
                                    if: {
                                        $gt: ["$greatGrandParentDriverReferrals.driverLevel", 0]
                                    },
                                    then: 1,
                                    else: 0
                                }
                            },
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'avgRating': {
                            $first: '$avgRating'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'creditBalance': {
                            $first: '$creditBalance'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'driverLevel': {
                            $first: '$driverLevel'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'isVerified': {
                            $first: '$isVerified'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 9
                aggregateQuery.push({
                    $project: {
                        "_id": "$_id",
                        "name": "$name",
                        "autoIncrementID": 1,
                        "avgRating": 1,
                        "countryCode": 1,
                        "createdAt": 1,
                        "creditBalance": 1,
                        "dob": 1,
                        "driverLevel": 1,
                        "email": 1,
                        "isBlocked": 1,
                        "isVerified": 1,
                        "onlyPhoneNumber": 1,
                        "phoneNumber": 1,
                        "profilePhoto": 1,
                        "uniqueID": 1,
                        "totalInvitedCount": {
                            $add: ["$parentDriverReferralsCount", "$grandParentReferralsCount", '$greatGrandParentDriverReferralsCount']
                        }
                    }
                })
                // stage 10
                aggregateQuery.push({
                    $sort: {
                        "totalInvitedCount": -1
                    }
                })
                // stage 11
                aggregateQuery.push({
                    $limit: 10
                })

                DriverSchema.aggregate(aggregateQuery, (err, totalInvitedDrivers) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.topTenDriverByTotalInvited = totalInvitedDrivers;
                        nextCall(null, responseData)
                    }
                })
            },
            /** get top ten passenger by Number of referral people count */
            function (responseData, nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $match: {
                        "isDeleted": false
                    }
                })
                // stage 1
                aggregateQuery.push({
                    $lookup: {
                        "from": "passenger_referrals",
                        "localField": "_id",
                        "foreignField": "level1Passenger",
                        "as": "level1PassengerReferrals"
                    }
                })
                // stage 2
                aggregateQuery.push({
                    $unwind: {
                        path: "$level1PassengerReferrals",
                        preserveNullAndEmptyArrays: true
                    }
                })
                // stage 3
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        'level1PassengerReferralsCount': {
                            $sum: {
                                $cond: {
                                    if: {
                                        $gt: ["$level1PassengerReferrals.passengerLevel", 0]
                                    },
                                    then: 1,
                                    else: 0
                                }
                            },
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'name': {
                            $first: '$name'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'passengerLevel': {
                            $first: '$passengerLevel'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 4
                aggregateQuery.push({
                    $lookup: {
                        "from": "passenger_referrals",
                        "localField": "_id",
                        "foreignField": "level2Passenger",
                        "as": "level2PassengerReferrals"
                    }
                })
                // stage 5
                aggregateQuery.push({
                    $unwind: {
                        path: "$level2PassengerReferrals",
                        preserveNullAndEmptyArrays: true
                    }
                })
                // stage 6
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        "level1PassengerReferralsCount": {
                            $first: "$level1PassengerReferralsCount"
                        },
                        'level2PassengerReferralsCount': {
                            $sum: {
                                $cond: {
                                    if: {
                                        $gt: ["$level2PassengerReferrals.passengerLevel", 0]
                                    },
                                    then: 1,
                                    else: 0
                                }
                            },
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'name': {
                            $first: '$name'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'passengerLevel': {
                            $first: '$passengerLevel'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 7
                aggregateQuery.push({
                    $lookup: {
                        "from": "passenger_referrals",
                        "localField": "_id",
                        "foreignField": "level3Passenger",
                        "as": "level3PassengerReferrals"
                    }
                })
                // stage 8
                aggregateQuery.push({
                    $unwind: {
                        path: "$level3PassengerReferrals",
                        preserveNullAndEmptyArrays: true
                    }
                })
                // stage 9
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        "level1PassengerReferralsCount": {
                            $first: "$level1PassengerReferralsCount"
                        },
                        "level2PassengerReferralsCount": {
                            $first: "$level2PassengerReferralsCount"
                        },
                        'level3PassengerReferralsCount': {
                            $sum: {
                                $cond: {
                                    if: {
                                        $gt: ["$level3PassengerReferrals.passengerLevel", 0]
                                    },
                                    then: 1,
                                    else: 0
                                }
                            },
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'name': {
                            $first: '$name'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'passengerLevel': {
                            $first: '$passengerLevel'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 10
                aggregateQuery.push({
                    $lookup: {
                        "from": "passenger_referrals",
                        "localField": "_id",
                        "foreignField": "level4Passenger",
                        "as": "level4PassengerReferrals"
                    }
                })
                // stage 11
                aggregateQuery.push({
                    $unwind: {
                        path: "$level4PassengerReferrals",
                        preserveNullAndEmptyArrays: true
                    }
                })
                // stage 12
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        "level1PassengerReferralsCount": {
                            $first: "$level1PassengerReferralsCount"
                        },
                        "level2PassengerReferralsCount": {
                            $first: "$level2PassengerReferralsCount"
                        },
                        "level3PassengerReferralsCount": {
                            $first: "$level3PassengerReferralsCount"
                        },
                        'level4PassengerReferralsCount': {
                            $sum: {
                                $cond: {
                                    if: {
                                        $gt: ["$level4PassengerReferrals.passengerLevel", 0]
                                    },
                                    then: 1,
                                    else: 0
                                }
                            },
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'name': {
                            $first: '$name'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'passengerLevel': {
                            $first: '$passengerLevel'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 13
                aggregateQuery.push({
                    $lookup: {
                        "from": "passenger_referrals",
                        "localField": "_id",
                        "foreignField": "level5Passenger",
                        "as": "level5PassengerReferrals"
                    }
                })
                // stage 14
                aggregateQuery.push({
                    $unwind: {
                        path: "$level5PassengerReferrals",
                        preserveNullAndEmptyArrays: true
                    }
                })
                // stage 15
                aggregateQuery.push({
                    $group: {
                        '_id': "$_id",
                        "level1PassengerReferralsCount": {
                            $first: "$level1PassengerReferralsCount"
                        },
                        "level2PassengerReferralsCount": {
                            $first: "$level2PassengerReferralsCount"
                        },
                        "level3PassengerReferralsCount": {
                            $first: "$level3PassengerReferralsCount"
                        },
                        "level4PassengerReferralsCount": {
                            $first: "$level4PassengerReferralsCount"
                        },
                        'level5PassengerReferralsCount': {
                            $sum: {
                                $cond: {
                                    if: {
                                        $gt: ["$level5PassengerReferrals.passengerLevel", 0]
                                    },
                                    then: 1,
                                    else: 0
                                }
                            },
                        },
                        'name': {
                            $first: '$name'
                        },
                        'autoIncrementID': {
                            $first: '$autoIncrementID'
                        },
                        'countryCode': {
                            $first: '$countryCode'
                        },
                        'createdAt': {
                            $first: '$createdAt'
                        },
                        'dob': {
                            $first: '$dob'
                        },
                        'name': {
                            $first: '$name'
                        },
                        'email': {
                            $first: '$email'
                        },
                        'isBlocked': {
                            $first: '$isBlocked'
                        },
                        'onlyPhoneNumber': {
                            $first: '$onlyPhoneNumber'
                        },
                        'passengerLevel': {
                            $first: '$passengerLevel'
                        },
                        'phoneNumber': {
                            $first: '$phoneNumber'
                        },
                        'profilePhoto': {
                            $first: '$profilePhoto'
                        },
                        'uniqueID': {
                            $first: '$uniqueID'
                        }
                    }
                })
                // stage 16
                aggregateQuery.push({
                    $project: {
                        "_id": "$_id",
                        "name": 1,
                        'autoIncrementID': 1,
                        'countryCode': 1,
                        'createdAt': 1,
                        'dob': 1,
                        'name': 1,
                        'email': 1,
                        'isBlocked': 1,
                        'onlyPhoneNumber': 1,
                        'passengerLevel': 1,
                        'phoneNumber': 1,
                        'profilePhoto': 1,
                        'uniqueID': 1,
                        "totalInvitedCount": {
                            $add: ["$level1PassengerReferralsCount", "$level2PassengerReferralsCount", '$level3PassengerReferralsCount', '$level4PassengerReferralsCount', '$level5PassengerReferralsCount']
                        }
                    }
                })
                // stage 17
                aggregateQuery.push({
                    $sort: {
                        "totalInvitedCount": -1
                    }
                })
                // stage 18
                aggregateQuery.push({
                    $limit: 10
                })

                PassengerSchema.aggregate(aggregateQuery, (err, totalPassengerInviteData) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.topTenPassengerByTotalInvited = totalPassengerInviteData;
                        nextCall(null, responseData)
                    }
                })
            },

        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_DASHBOARD_DATA_SUCC,
                data: response
            });
        })
    },

    getIncomeRelatedData: function (req, res) {
        async.waterfall([
            function (nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$toatlFare"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, todaysDriverIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        let responseData = {}
                        responseData.todaysDriverIncome = todaysDriverIncome.length !== 0 ? todaysDriverIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $lte: new Date(moment().hours(0).minutes(0).seconds(0).milliseconds(0).format()),
                            $gte: new Date(moment().subtract(1, "days").hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$toatlFare"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, yesterdaysDriverIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.yesterdaysDriverIncome = yesterdaysDriverIncome.length !== 0 ? yesterdaysDriverIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $lte: new Date(moment().hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $gte: new Date(moment().startOf('month').hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$toatlFare"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, thisMonthsDriverIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.thisMonthsDriverIncome = thisMonthsDriverIncome.length !== 0 ? thisMonthsDriverIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$toatlFare"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, lastMonthsDriverIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.lastMonthsDriverIncome = lastMonthsDriverIncome.length !== 0 ? lastMonthsDriverIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$toatlFare"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, thisYearsDriverIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.thisYearsDriverIncome = thisYearsDriverIncome.length !== 0 ? thisYearsDriverIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$toatlFare"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, lastYearsDriverIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.lastYearsDriverIncome = lastYearsDriverIncome.length !== 0 ? lastYearsDriverIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        type: "credit",
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalCredit": {
                            $sum: "$amount"
                        }
                    }
                })
                WalletLogsSchema.aggregate(aggregateQuery, (err, todaysDriverCredit) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.todaysDriverCredit = todaysDriverCredit.length !== 0 ? todaysDriverCredit[0].totalCredit : 0;
                        return nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $lte: new Date(moment().hours(0).minutes(0).seconds(0).milliseconds(0).format()),
                            $gte: new Date(moment().subtract(1, "days").hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        type: "credit",
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalCredit": {
                            $sum: "$amount"
                        }
                    }
                })
                WalletLogsSchema.aggregate(aggregateQuery, (err, yesterdaysDriverCredit) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.yesterdaysDriverCredit = yesterdaysDriverCredit.length !== 0 ? yesterdaysDriverCredit[0].totalCredit : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $lte: new Date(moment().hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $gte: new Date(moment().startOf('month').hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        type: "credit",
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalCredit": {
                            $sum: "$amount"
                        }
                    }
                })
                WalletLogsSchema.aggregate(aggregateQuery, (err, thisMonthsDriverCredit) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.thisMonthsDriverCredit = thisMonthsDriverCredit.length !== 0 ? thisMonthsDriverCredit[0].totalCredit : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        type: "credit",
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalCredit": {
                            $sum: "$amount"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, lastMonthsDriverCredit) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.lastMonthsDriverCredit = lastMonthsDriverCredit.length !== 0 ? lastMonthsDriverCredit[0].totalCredit : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format())
                        },
                        type: "credit"
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalCredit": {
                            $sum: "$amount"
                        }
                    }
                })
                WalletLogsSchema.aggregate(aggregateQuery, (err, thisYearsDriverCredit) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.thisYearsDriverCredit = thisYearsDriverCredit.length !== 0 ? thisYearsDriverCredit[0].totalCredit : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format())
                        },
                        type: 'credit'
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalCredit": {
                            $sum: "$amount"
                        }
                    }
                })
                WalletLogsSchema.aggregate(aggregateQuery, (err, lastYearsDriverCredit) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.lastYearsDriverCredit = lastYearsDriverCredit.length !== 0 ? lastYearsDriverCredit[0].totalCredit : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$adminEarning"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, todaysAdminIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.todaysAdminIncome = todaysAdminIncome.length !== 0 ? todaysAdminIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $lte: new Date(moment().hours(0).minutes(0).seconds(0).milliseconds(0).format()),
                            $gte: new Date(moment().subtract(1, "days").hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$adminEarning"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, yesterdaysAdminIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.yesterdaysAdminIncome = yesterdaysAdminIncome.length !== 0 ? yesterdaysAdminIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $lte: new Date(moment().hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $gte: new Date(moment().startOf('month').hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$adminEarning"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, thisMonthsAdminIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.thisMonthsAdminIncome = thisMonthsAdminIncome.length !== 0 ? thisMonthsAdminIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$adminEarning"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, lastMonthsAdminIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.lastMonthsAdminIncome = lastMonthsAdminIncome.length !== 0 ? lastMonthsAdminIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$adminEarning"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, thisYearsAdminIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.thisYearsAdminIncome = thisYearsAdminIncome.length !== 0 ? thisYearsAdminIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format())
                        },
                        status: "completed",
                        paymentStatus: true
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalIncome": {
                            $sum: "$adminEarning"
                        }
                    }
                })
                RideSchema.aggregate(aggregateQuery, (err, lastYearsAdminIncome) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.lastYearsAdminIncome = lastYearsAdminIncome.length !== 0 ? lastYearsAdminIncome[0].totalIncome : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalRef": {
                            $sum: "$referralAmount"
                        }
                    }
                })
                DriverRefEarningLogSchema.aggregate(aggregateQuery, (err, todayDriversRefEarn) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.todayDriversRefEarn = todayDriversRefEarn.length !== 0 ? todayDriversRefEarn[0].totalRef : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $lte: new Date(moment().hours(0).minutes(0).seconds(0).milliseconds(0).format()),
                            $gte: new Date(moment().subtract(1, "days").hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalRef": {
                            $sum: "$referralAmount"
                        }
                    }
                })
                DriverRefEarningLogSchema.aggregate(aggregateQuery, (err, yesterdaysDriverRefEarn) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.yesterdaysDriverRefEarn = yesterdaysDriverRefEarn.length !== 0 ? yesterdaysDriverRefEarn[0].totalRef : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $lte: new Date(moment().hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $gte: new Date(moment().startOf('month').hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalRef": {
                            $sum: "$referralAmount"
                        }
                    }
                })
                DriverRefEarningLogSchema.aggregate(aggregateQuery, (err, thisMonthsDriverRefEarn) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.thisMonthsDriverRefEarn = thisMonthsDriverRefEarn.length !== 0 ? thisMonthsDriverRefEarn[0].totalRef : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('month').month(new Date().getMonth() - 1).hours(0).minutes(0).seconds(0).milliseconds(0).format())
                        },
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalRef": {
                            $sum: "$referralAmount"
                        }
                    }
                })
                DriverRefEarningLogSchema.aggregate(aggregateQuery, (err, lastMonthsDriverRefEarn) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.lastMonthsDriverRefEarn = lastMonthsDriverRefEarn.length !== 0 ? lastMonthsDriverRefEarn[0].totalRef : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('year').hours(23).minutes(59).seconds(0).milliseconds(0).format())
                        },
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalRef": {
                            $sum: "$referralAmount"
                        }
                    }
                })
                DriverRefEarningLogSchema.aggregate(aggregateQuery, (err, thisYearsDriverRefEarn) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.thisYearsDriverRefEarn = thisYearsDriverRefEarn.length !== 0 ? thisYearsDriverRefEarn[0].totalRef : 0;
                        nextCall(null, responseData)
                    }
                })
            },
            function (responseData, nextCall) {
                let aggregateQuery = []
                aggregateQuery.push({
                    $match: {
                        createdAt: {
                            $gte: new Date(moment().startOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format()),
                            $lte: new Date(moment().endOf('year').year(new Date().getFullYear() - 1).hours(23).minutes(59).seconds(0).milliseconds(0).format())
                        },
                    }
                })
                aggregateQuery.push({
                    $group: {
                        "_id": null,
                        "totalRef": {
                            $sum: "$referralAmount"
                        }
                    }
                })
                DriverRefEarningLogSchema.aggregate(aggregateQuery, (err, lastYearsDriverRefEarn) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        responseData.lastYearsDriverRefEarn = lastYearsDriverRefEarn.length !== 0 ? lastYearsDriverRefEarn[0].totalRef : 0;
                        nextCall(null, responseData)
                    }
                })
            },
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_DASHBOARD_DATA_SUCC,
                data: {
                    DriverIncome: {
                        "todays": response.todaysDriverIncome,
                        "yesterDays": response.yesterdaysDriverIncome,
                        "thisMonths": response.thisMonthsDriverIncome,
                        "lastMonths": response.lastMonthsDriverIncome,
                        "thisYears": response.thisYearsDriverIncome,
                        "lastYears": response.lastYearsDriverIncome
                    },
                    AdminIncome: {
                        "todays": response.todaysAdminIncome,
                        "yesterDays": response.yesterdaysAdminIncome,
                        "thisMonths": response.thisMonthsAdminIncome,
                        "lastMonths": response.lastMonthsAdminIncome,
                        "thisYears": response.thisYearsAdminIncome,
                        "lastYears": response.lastYearsAdminIncome
                    },
                    DriverCredit: {
                        "todays": response.todaysDriverCredit,
                        "yesterDays": response.yesterdaysDriverCredit,
                        "thisMonths": response.thisMonthsDriverCredit,
                        "lastMonths": response.lastMonthsDriverCredit,
                        "thisYears": response.thisYearsDriverCredit,
                        "lastYears": response.lastYearsDriverCredit
                    },
                    DriverRefEarn: {
                        "todays": response.todayDriversRefEarn,
                        "yesterDays": response.yesterdaysDriverRefEarn,
                        "thisMonths": response.thisMonthsDriverRefEarn,
                        "lastMonths": response.lastMonthsDriverRefEarn,
                        "thisYears": response.thisYearsDriverRefEarn,
                        "lastYears": response.lastYearsDriverRefEarn
                    }
                }
            });
        })
    },

    /**
     * Vehicle Module
     */
    ListOfAllVehicles: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {};
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'type.en': regex
                    },
                        // {
                        //     'minFare': Number(search_value)
                        // }, {
                        //     'feePerKM': Number(search_value)
                        // }
                    ];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                VehicleTypeSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                VehicleTypeSchema
                    .find(matchObj, {
                        '_id': 1,
                        'type': 1,
                        'minFare': 1,
                        'feePerKM': 1,
                        'image': 1,
                        'isActive': 1,
                        'autoIncrementID': 1
                    }, {
                            limit: Number(req.body.length),
                            skip: Number(req.body.start)
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            response.data = poiUsers;
                            nextCall();
                        } else {
                            nextCall();
                        }
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    getVehicleTypeDetails: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('vehicle_id', message.VEHICLE_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get vehicle details */
            function (body, nextCall) {
                VehicleTypeSchema.findOne({
                    '_id': body.vehicle_id
                }).exec(function (err, vehicle) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!vehicle) {
                        return nextCall({
                            "message": message.VEHICLE_NOT_FOUND
                        })
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.VEHICLE, log_message.ACTION.VIEW_VEHICLE + ", VehicleId: " + vehicle.autoIncrementID + ", Type: " + vehicle.type.en)
                        nextCall(null, vehicle)
                    }
                });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 0,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "", //Add Comment
                data: response
            });
        });
    },

    addVehicleType: function (req, res) {
        async.waterfall([
            /** get formData */
            function (nextCall) {
                Uploader.getFormFields(req, nextCall);
            },
            /** check required parameters */
            function (fields, files, nextCall) {
                if (fields && (!fields.type) || (!fields.minFare) || (!fields.feePerKM)) {
                    return nextCall({
                        "message": message.INVALID_PARAMS
                    });
                }
                nextCall(null, fields, files);
            },
            /** check email and mobile no already registered or not */
            function (fields, files, nextCall) {
                if (fields.type && typeof fields.type == 'string') {
                    let k = JSON.parse(fields.type);
                    fields.type = k;
                }
                nextCall(null, fields, files)
                // VehicleTypeSchema.findOne({
                //     type: fields.type
                // }).exec(function(err, vehicle) {
                //     if (err) {
                //         return nextCall({
                //             "message": message.SOMETHING_WENT_WRONG
                //         })
                //     } else if (vehicle) {
                //         return nextCall({
                //             "message": message.VEHICLE_TYPE_ALREADY_REGISTERED
                //         })
                //     } else {
                //         nextCall(null, fields, files)
                //     }
                // })
            },
            /** upload profile picture */
            function (fields, files, nextCall) {
                if (files.image) {
                    // skip files except image files
                    if (files.image.type.indexOf('image') === -1) {
                        return nextFile(null, null);
                    }

                    var extension = path.extname(files.image.name);
                    var filename = DS.getTime() + extension;
                    // let thumb_image = CONSTANTS.PROFILE_PATH_THUMB + filename;
                    let large_image = CONSTANTS.VEHICLE_TYPE_PATH + filename;

                    async.series([
                        // function(nextProc) {
                        //     Uploader.thumbUpload({ // upload thumb file
                        //         src: files.image.path,
                        //         dst: rootPath + '/' + thumb_image,

                        //     }, nextProc);
                        // },
                        function (nextProc) {
                            Uploader.largeUpload({ // upload large file
                                src: files.image.path,
                                dst: rootPath + '/' + large_image
                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.remove({
                                filepath: files.image.path
                            }, nextProc);
                        }
                    ], function (err) {
                        if (err) {
                            nextCall(err, fields);
                        }
                        fields.image = filename;
                        nextCall(null, fields)
                    })
                } else {
                    fields.image = '';
                    nextCall(null, fields)
                }
            },
            /** get vehicle auto increment id */
            function (fields, nextCall) {
                _self.getVehicleAutoIncrement(function (err, response) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    fields.autoIncrementID = response.vehicleAutoIncrement;
                    nextCall(null, fields)
                });
            },
            function (fields, nextCall) {
                let vehicle = new VehicleTypeSchema(fields);
                vehicle.save(function (err, vehicle) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    }
                    _self.addActionLog(req.user, log_message.SECTION.VEHICLE, log_message.ACTION.ADD_VEHICLE + ", VehicleId: " + vehicle.autoIncrementID + ", Type: " + vehicle.type.en)
                    nextCall(null)
                });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 0,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.CREATE_VEHICLE_SUCC,
                data: {}
            });

        });
    },

    editVehicleType: function (req, res) {
        async.waterfall([
            /** get formData */
            function (nextCall) {
                Uploader.getFormFields(req, nextCall);
            },
            /** check required parameters */
            function (fields, files, nextCall) {
                if (fields && (!fields.vehicle_id)) {
                    return nextCall({
                        "message": message.INVALID_PARAMS
                    });
                }
                nextCall(null, fields, files);
            },
            /** get vehicle details */
            function (fields, files, nextCall) {
                VehicleTypeSchema.findOne({
                    _id: fields.vehicle_id
                }).exec(function (err, vehicle) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!vehicle) {
                        return nextCall({
                            "message": message.VEHICLE_NOT_FOUND
                        })
                    } else {
                        nextCall(null, fields, files, vehicle)
                    }
                })
            },
            /** upload vehicle image */
            function (fields, files, vehicle, nextCall) {
                if (files.image) {
                    // skip files except image files
                    if (files.image.type.indexOf('image') === -1) {
                        return nextFile(null, null);
                    }

                    var extension = path.extname(files.image.name);
                    let filename = DS.getTime() + extension;
                    let large_image = CONSTANTS.VEHICLE_TYPE_PATH + filename;

                    async.series([

                        function (nextProc) {
                            Uploader.largeUpload({ // upload large file
                                src: files.image.path,
                                dst: rootPath + '/' + large_image
                            }, nextProc);
                        },
                        function (nextProc) {
                            Uploader.remove({
                                filepath: files.image.path
                            }, nextProc);
                        },
                        function (nextProc) { // remove old large image
                            if (vehicle.image && vehicle.image != '') {
                                Uploader.remove({
                                    filepath: rootPath + '/' + CONSTANTS.VEHICLE_TYPE_PATH + vehicle.image
                                }, nextProc);
                            } else {
                                nextProc();
                            }
                        },

                    ], function (err) {
                        if (err) {
                            nextCall(err, fields);
                        }
                        fields.image = filename;
                        nextCall(null, fields, vehicle)
                    });
                } else {
                    fields.image = vehicle.image;
                    nextCall(null, fields, vehicle)
                }
            },
            /** update vehicle data */
            function (fields, vehicle, nextCall) {
                let updateData = {
                    'type': fields.type ? JSON.parse(fields.type) : vehicle.type,
                    'minFare': fields.minFare ? fields.minFare : vehicle.minFare,
                    'feePerKM': fields.feePerKM ? fields.feePerKM : vehicle.feePerKM,
                    'image': fields.image
                }
                VehicleTypeSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(fields.vehicle_id)
                }, {
                        $set: updateData
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.VEHICLE, log_message.ACTION.UPDATE_VEHICLE + ", VehicleId: " + updateData.autoIncrementID + ", Type: " + updateData.type.en)
                        nextCall(null);
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 0,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.VEHICLE_UPDATE_SUCC,
                data: {}
            });
        })
    },

    deleteVehicleType: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('vehicle_id', message.VEHICLE_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get vehicle details */
            function (body, nextCall) {
                VehicleTypeSchema.findOne({
                    '_id': body.vehicle_id
                }).exec(function (err, vehicle) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!vehicle) {
                        return nextCall({
                            "message": message.VEHICLE_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, vehicle)
                    }
                });
            },
            /** update user block status */
            function (body, vehicle, nextCall) {
                VehicleTypeSchema.remove({
                    "_id": mongoose.Types.ObjectId(body.vehicle_id)
                },
                    function (err, deleteData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.VEHICLE, log_message.ACTION.DELETE_VEHICLE + ", VehicleId: " + vehicle.autoIncrementID + ", Type: " + vehicle.type.en)
                        nextCall(null);
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 0,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.VEHICLE_DELETED_SUCC,
                data: {}
            });
        })
    },

    activeInactiveVehicleType: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('vehicle_id', message.VEHICLE_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get vehicle details */
            function (body, nextCall) {
                VehicleTypeSchema.findOne({
                    '_id': body.vehicle_id
                }).exec(function (err, vehicle) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!vehicle) {
                        return nextCall({
                            "message": message.VEHICLE_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, vehicle)
                    }
                });
            },
            /** update vehicle type active status */
            function (body, vehicle, nextCall) {
                VehicleTypeSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.vehicle_id)
                }, {
                        $set: {
                            "isActive": vehicle.isActive ? false : true
                        }
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.VEHICLE, log_message.ACTION.ACTIVE_INACTIVE_VEHICLE + ", VehicleId: " + updateData.autoIncrementID + ", Type: " + updateData.type.en)
                        nextCall(null);
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.VEHICLE_STATUS_UPDATE_SUCC,
                data: {}
            });
        })
    },

    /**
     * Help Center Module
     */
    ListOfAllHelpCenters: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {};
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'email': regex
                    }, {
                        'phoneNumber': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                HelpCenterSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                HelpCenterSchema
                    .find(matchObj, {
                        '_id': 1,
                        'email': 1,
                        'phoneNumber': 1
                    }, {
                            limit: Number(req.body.length),
                            skip: Number(req.body.start)
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            response.data = poiUsers;
                            nextCall();
                        } else {
                            nextCall();
                        }
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    getHelpCenterDetails: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('help_center_id', message.HELP_CENTER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** check help center exist or not */
            function (body, nextCall) {
                HelpCenterSchema.findOne({
                    _id: body.help_center_id
                }).exec(function (err, helpCenter) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!helpCenter) {
                        return nextCall({
                            "message": message.HELP_CENTER_NOT_FOUND
                        })
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.HELP_CENTER, log_message.ACTION.VIEW_HELP_CENTER + helpCenter.email)
                        nextCall(null, helpCenter)
                    }
                })
            },
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_HELP_CENTER_SUCC,
                data: response
            });
        });
    },

    editHelpCenter: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('help_center_id', message.HELP_CENTER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get help center details */
            function (body, nextCall) {
                HelpCenterSchema.findOne({
                    _id: body.help_center_id
                }).exec(function (err, helpCenter) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!helpCenter) {
                        return nextCall({
                            "message": message.HELP_CENTER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, helpCenter)
                    }
                })
            },
            /** update help center data */
            function (body, helpCenter, nextCall) {
                let updateData = {
                    'email': body.email ? body.email : helpCenter.email,
                    'phoneNumber': body.phoneNumber ? body.phoneNumber : helpCenter.phoneNumber,
                    'fbUrl': body.fbUrl ? body.fbUrl : helpCenter.fbUrl
                }
                HelpCenterSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.help_center_id)
                }, {
                        $set: updateData
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.HELP_CENTER, log_message.ACTION.UPDATE_HELP_CENTER + updateData.email)
                        nextCall(null);
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.HELP_CENTER_UPDATE_SUCC,
                data: {}
            });
        });
    },

    /**
     * Billing Plans Module
     */
    listAllBillingPlans: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {};
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'name.en': regex
                    }, {
                        'details.en': regex
                    }, {
                        'billingType': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                BillingPlansSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                BillingPlansSchema
                    .find(matchObj, {
                        '_id': 1,
                        'name': 1,
                        'details': 1,
                        'chargeAmt': 1,
                        'billingType': 1
                    }, {
                            limit: Number(req.body.length),
                            skip: Number(req.body.start)
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            response.data = poiUsers;
                            nextCall();
                        } else {
                            nextCall();
                        }
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    getBillingPlanDetails: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('billing_plan_id', message.BILLING_PLAN_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** check billing plan exist or not */
            function (body, nextCall) {
                BillingPlansSchema.findOne({
                    _id: body.billing_plan_id
                }).exec(function (err, billingPlan) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!billingPlan) {
                        return nextCall({
                            "message": message.BILLING_PLAN_NOT_FOUND
                        })
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.BILLING_PLAN, log_message.ACTION.VIEW_BILLING_PLAN + billingPlan.name.en)
                        nextCall(null, billingPlan)
                    }
                })
            },
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_BILLING_PLAN_SUCC,
                data: response
            });
        });
    },

    editBillingPlan: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('billing_plan_id', message.BILLING_PLAN_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get billing plan details */
            function (body, nextCall) {
                BillingPlansSchema.findOne({
                    _id: body.billing_plan_id
                }).exec(function (err, billingPlan) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!billingPlan) {
                        return nextCall({
                            "message": message.BILLING_PLAN_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, billingPlan)
                    }
                })
            },
            /** update billing plan data */
            function (body, billingPlan, nextCall) {
                let updateData = {
                    'name': body.name ? body.name : billingPlan.name,
                    'details': body.details ? body.details : billingPlan.details,
                    'chargeAmt': body.chargeAmt ? body.chargeAmt : billingPlan.chargeAmt,
                    'billingType': body.billingType ? body.billingType : billingPlan.billingType
                }
                BillingPlansSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.billing_plan_id)
                }, {
                        $set: updateData
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.BILLING_PLAN, log_message.ACTION.UPDATE_BILLING_PLAN + updateData.name.en)
                        nextCall(null);
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.BILLING_PLAN_UPDATE_SUCC,
                data: {}
            });
        });
    },

    /**
     * Operator Module
     */
    listAllOperators: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {
                    'type': 'operator'
                };
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'email': regex
                    }, {
                        'first_name': regex
                    }, {
                        'last_name': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                AdminSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                AdminSchema
                    .find(matchObj, {
                        '_id': 1,
                        'email': 1,
                        'first_name': 1,
                        'last_name': 1,
                        'isActive': 1,
                        'canChangePassword': 1
                    }, {
                            limit: Number(req.body.length),
                            skip: Number(req.body.start)
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            response.data = poiUsers;
                            nextCall();
                        } else {
                            nextCall();
                        }
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    addOperator: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('first_name', message.FIRST_NAME_REQUIRED).notEmpty();
                req.checkBody('last_name', message.LAST_NAME_REQUIRED).notEmpty();
                req.checkBody('email', message.EMAIL_REQUIRED).notEmpty();
                req.checkBody('email', message.EMAIL_NOT_VALID).isEmail();
                req.checkBody('password', message.PASSWORD_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** check email is already exist or not */
            function (body, nextCall) {
                AdminSchema.findOne({
                    email: body.email
                }).lean().exec(function (err, operator) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    } else if (operator) {
                        return nextCall({
                            "message": message.OPERATOR_ALREADY_EXIST
                        })
                    } else {
                        nextCall(null, body)
                    }
                });
            },
            /** get operator auto increment id */
            function (body, nextCall) {
                _self.getOperatorAutoIncrement(function (err, response) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    body.autoIncrementID = response.operatorAutoIncrement;
                    nextCall(null, body)
                });
            },
            /** register operator */
            function (body, nextCall) {
                let operator = new AdminSchema(body);
                operator.save(function (err, insertData) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    }
                    _self.addActionLog(req.user, log_message.SECTION.OPERATOR, log_message.ACTION.ADD_OPERATOR + ", OperatorId: " + insertData.autoIncrementID + ", Name: " + insertData.first_name + " " + insertData.last_name)
                    nextCall(null)
                });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.OPERATOR_CREATE_SUCCESS,
                data: {}
            });
        });
    },

    getOperatorDetails: function (req, res) {
        async.waterfall([
            /** check required parameters */
            function (nextCall) {
                req.checkBody('operator_id', message.OPERATOR_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** check operator exist or not */
            function (body, nextCall) {
                AdminSchema.findOne({
                    _id: body.operator_id
                }).lean().exec(function (err, operator) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!operator) {
                        return nextCall({
                            "message": message.OPERATOR_NOT_FOUND
                        })
                    } else {
                        operator.password = ED.decrypt(operator.password)
                        _self.addActionLog(req.user, log_message.SECTION.OPERATOR, log_message.ACTION.VIEW_OPERATOR + ", OperatorId: " + operator.autoIncrementID + ", Name: " + operator.first_name + " " + operator.last_name)
                        nextCall(null, operator)
                    }
                })
            },
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_OPERATOR_SUCC,
                data: response
            });
        });
    },

    editOperator: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('operator_id', message.OPERATOR_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get operator details */
            function (body, nextCall) {
                AdminSchema.findOne({
                    _id: body.operator_id
                }).lean().exec(function (err, operator) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    } else if (!operator) {
                        return nextCall({
                            "message": message.OPERATOR_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, operator)
                    }
                });
            },
            /** check email is already exist or not */
            function (body, operator, nextCall) {
                AdminSchema.findOne({
                    email: body.email,
                    _id: {
                        $ne: operator._id
                    }
                }).exec(function (err, existOperator) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    } else if (existOperator) {
                        return nextCall({
                            "message": message.EMAIL_ALREADY_EXIST
                        })
                    } else {
                        nextCall(null, body, operator)
                    }
                });
            },
            /** update operator data */
            function (body, operator, nextCall) {
                let updateData = {
                    'email': body.email ? body.email : operator.email,
                    'first_name': body.first_name ? body.first_name : operator.first_name,
                    'last_name': body.last_name ? body.last_name : operator.last_name,
                    'password': body.password ? ED.encrypt(body.password) : operator.password,
                    'canChangePassword': body.canChangePassword ? body.canChangePassword : operator.canChangePassword
                }

                AdminSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.operator_id)
                }, {
                        $set: updateData
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.OPERATOR, log_message.ACTION.UPDATE_OPERATOR + ", OperatorId: " + updateData.autoIncrementID + ", Name: " + updateData.first_name + " " + updateData.last_name)
                        nextCall(null);
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.OPERATOR_UPDATE_SUCCESS,
                data: {}
            });
        });
    },

    activeInactiveOperator: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('operator_id', message.OPERATOR_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get operator details */
            function (body, nextCall) {
                AdminSchema.findOne({
                    '_id': body.operator_id
                }).exec(function (err, operator) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!operator) {
                        return nextCall({
                            "message": message.OPERATOR_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, operator)
                    }
                });
            },
            /** update operator active status */
            function (body, operator, nextCall) {
                AdminSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.operator_id)
                }, {
                        $set: {
                            "isActive": operator.isActive ? false : true
                        }
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        let action = "inactive";
                        if (updateData.isActive) {
                            action = "active";
                        }
                        _self.addActionLog(req.user, log_message.SECTION.OPERATOR, log_message.ACTION.ACTIVE_INACTIVE_OPERATOR + action + ", OperatorId: " + updateData.autoIncrementID + ", Name: " + updateData.first_name + " " + updateData.last_name)
                        nextCall(null);
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.OPERATOR_STATUS_UPDATE_SUCC,
                data: {}
            });
        })
    },

    deleteOperator: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('operator_id', message.OPERATOR_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get operator details */
            function (body, nextCall) {
                AdminSchema.findOne({
                    '_id': body.operator_id
                }).exec(function (err, operator) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!operator) {
                        return nextCall({
                            "message": message.OPERATOR_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, operator)
                    }
                });
            },
            /** update operator active status */
            function (body, operator, nextCall) {
                AdminSchema.remove({
                    "_id": mongoose.Types.ObjectId(body.operator_id)
                }, function (err, deleteData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    _self.addActionLog(req.user, log_message.SECTION.OPERATOR, log_message.ACTION.DELETE_OPERATOR + ", OperatorId: " + operator.autoIncrementID + ", Name: " + operator.first_name + " " + operator.last_name)
                    nextCall(null);
                });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.OPERATOR_DELETE_SUCC,
                data: {}
            });
        })
    },

    /**
     * Credit Module
     */
    listAllCredits: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {};
                if (req.body.driverId) {
                    matchObj.driverId = req.body.driverId;
                    matchObj.type = 'credit';
                }
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{}];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                WalletLogsSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                WalletLogsSchema
                    .find(matchObj, {
                        '_id': 1,
                        'driverId': 1,
                        'amount': 1,
                        'createdAt': 1
                    }, {
                            limit: Number(req.body.length),
                            skip: Number(req.body.start)
                        })
                    .populate('creditBy', 'first_name last_name type')
                    .sort(sort)
                    .lean()
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            response.data = poiUsers;
                            _self.addActionLog(req.user, log_message.SECTION.CREDIT, log_message.ACTION.LIST_ALL_DRIVER_CREDIT)
                            nextCall();
                        } else {
                            _self.addActionLog(req.user, log_message.SECTION.CREDIT, log_message.ACTION.LIST_ALL_DRIVER_CREDIT)
                            nextCall();
                        }
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    getDriverList: function (req, res) {
        async.waterfall([
            function (nextCall) {
                DriverSchema.find({}).exec(function (err, drivers) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    nextCall(null, drivers)
                })
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.SUCCESS,
                data: response
            });
        })
    },

    addCredit: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driverId', message.DRIVER_ID_REQUIRED).notEmpty();
                req.checkBody('amount', message.AMOUNT_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** insert data into credit logs */
            function (body, nextCall) {
                body.type = 'credit';
                body.creditBy = req.user._id;
                let wallet = new WalletLogsSchema(body);
                wallet.save(function (err, insertData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    nextCall(null, body)
                });
            },
            /** update driver wallet */
            function (body, nextCall) {
                DriverSchema
                    .findOneAndUpdate({
                        "_id": mongoose.Types.ObjectId(body.driverId)
                    }, {
                            $inc: {
                                "creditBalance": Number(body.amount)
                            }
                        }, {
                            new: true
                        })
                    .populate('languageId')
                    .exec((err, driverUpdateData) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            })
                        }
                        nextCall(null, body, driverUpdateData)
                    })
            },
            /** Badge Count of notification */
            function (body,driverUpdateData, nextCall) {
                _self.badgeCount(driverUpdateData._id, isDriver = true, function (err, badgeCount) {
                    if (err) {
                        nextCall({ message: err })
                    }
                    else {
                        badgeCount = badgeCount ? badgeCount + 1 : 0
                        nextCall(null,body, driverUpdateData, badgeCount)
                    }
                })
            },
            /** Send notification */
            function (body, driverUpdateData, badgeCount, nextCall) {
                // amount formate in KHR
                const formatter = new Intl.NumberFormat('en-KHR', {
                    style: 'currency',
                    currency: 'KHR',
                })
                body.amount = formatter.format(body.amount);

                let AMOUNT_CREDIT_SUCC;
                if (driverUpdateData && driverUpdateData.languageId && driverUpdateData.languageId.code == 'km') {
                    AMOUNT_CREDIT_SUCC = COMBODIA_MESSAGES['AMOUNT_CREDIT_SUCC'];
                } else if (driverUpdateData && driverUpdateData.languageId && driverUpdateData.languageId.code == 'zh') {
                    AMOUNT_CREDIT_SUCC = CHINESE_MESSAGES['AMOUNT_CREDIT_SUCC'];
                } else {
                    AMOUNT_CREDIT_SUCC = message['AMOUNT_CREDIT_SUCC'];
                }

                let pushNotificationData = {
                    to: (driverUpdateData.deviceDetail && driverUpdateData.deviceDetail.token) || '',
                    type: 'driver',
                    data: {
                        title: '',
                        type: 13,
                        body: body.amount + AMOUNT_CREDIT_SUCC,
                        badge: badgeCount,
                        tag: 'Add Credit',
                        data: {}
                    }
                }

                pn.fcm(pushNotificationData, function (err, Success) {
                    let notificationData = {
                        title: pushNotificationData.data.body,
                        receiver_type: 'driver',
                        driverId: driverUpdateData._id
                    }
                    let Notification = new NotificationSchema(notificationData);
                    Notification.save((err, notification) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.CREDIT, log_message.ACTION.ADD_CREDIT + ", DriverId: " + driverUpdateData.autoIncrementID + ", Name: " + driverUpdateData.name)
                        nextCall(null)
                    })
                })
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.CREDIT_SUCC,
                data: {}
            });
        });
    },

    getBillingPlanWithdraw: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {};
                if (req.body && req.body.type) {
                    matchObj.type = 'billing_plan_withdraw';
                }
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{}];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                WalletLogsSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                WalletLogsSchema
                    .find(matchObj, {
                        '_id': 1,
                        'driverId': 1,
                        'type': 1,
                        'amount': 1,
                        'createdAt': 1
                    }, {
                            limit: Number(req.body.length),
                            skip: Number(req.body.start)
                        })
                    .populate('driverId')
                    .sort(sort)
                    .lean()
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            response.data = poiUsers;
                            nextCall();
                        } else {
                            nextCall();
                        }
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },


    /**
     * Emergency Module
     */
    ListOfAllEmergencies: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {};
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'phoneNumber': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                EmergencySchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                EmergencySchema
                    .find(matchObj, {
                        '_id': 1,
                        'phoneNumber': 1,
                        'autoIncrementID': 1
                    }, {
                            limit: Number(req.body.length),
                            skip: Number(req.body.start)
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            response.data = poiUsers;
                            nextCall();
                        } else {
                            nextCall();
                        }
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    addEmergency: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('phoneNumber', message.PHONE_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** check phone number is already exist or not */
            function (body, nextCall) {
                EmergencySchema.findOne({
                    phoneNumber: body.phoneNumber
                }).lean().exec(function (err, emergency) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    } else if (emergency) {
                        return nextCall({
                            "message": message.EMERGENCY_ALREADY_EXIST
                        })
                    } else {
                        nextCall(null, body)
                    }
                });
            },
            /** get emergency auto increment id */
            function (body, nextCall) {
                _self.getEmergencyAutoIncrement(function (err, response) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    body.autoIncrementID = response.emergencyAutoIncrement;
                    nextCall(null, body)
                });
            },
            /** register emergency */
            function (body, nextCall) {
                body.location = {};
                body.location.index = "2dsphere";
                body.location.type = "Point";
                body.location.coordinates = [Number(body.latitude), Number(body.longitude)];
                let emergency = new EmergencySchema(body);
                emergency.save(function (err, insertData) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    }
                    _self.addActionLog(req.user, log_message.SECTION.EMERGENCY, log_message.ACTION.ADD_EMERGENCY + ", EmergencyId: " + insertData.autoIncrementID + ", Number: " + insertData.phoneNumber)
                    nextCall(null)
                });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.EMERGENCY_CREATE_SUCCESS,
                data: {}
            });
        });
    },

    getEmergencyDetails: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('emergency_id', message.EMERGENCY_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** check emergency exist or not */
            function (body, nextCall) {
                EmergencySchema.findOne({
                    _id: body.emergency_id
                }).exec(function (err, emergency) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!emergency) {
                        return nextCall({
                            "message": message.EMERGENCY_NOT_FOUND
                        })
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.EMERGENCY, log_message.ACTION.VIEW_EMERGENCY + ", EmergencyId: " + emergency.autoIncrementID + ", Number: " + emergency.phoneNumber)
                        nextCall(null, emergency)
                    }
                })
            },
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_EMERGENCY_SUCC,
                data: response
            });
        });
    },

    editEmergency: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('emergency_id', message.EMERGENCY_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** check mobile no already registered or not */
            function (body, nextCall) {
                EmergencySchema.findOne({
                    _id: {
                        $ne: body.emergency_id
                    },
                    phoneNumber: body.phoneNumber
                }).exec(function (err, emergencyData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (emergencyData) {
                        return nextCall({
                            "message": message.EMERGENCY_ALREADY_EXIST
                        })
                    } else {
                        nextCall(null, body)
                    }
                })
            },
            /** get emergency details */
            function (body, nextCall) {
                EmergencySchema.findOne({
                    _id: body.emergency_id
                }).exec(function (err, emergency) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!emergency) {
                        return nextCall({
                            "message": message.EMERGENCY_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, emergency)
                    }
                })
            },
            /** update emergency data */
            function (body, emergency, nextCall) {
                let updateData = {
                    'phoneNumber': body.phoneNumber ? body.phoneNumber : emergency.phoneNumber
                }

                if (body.latitude && body.longitude) {
                    updateData.location = {};
                    updateData.location.index = "2dsphere";
                    updateData.location.type = "Point";
                    updateData.location.coordinates = [Number(body.latitude) || Number(emergency.latitude), Number(body.longitude) || Number(emergency.longitude)];
                }
                EmergencySchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.emergency_id)
                }, {
                        $set: updateData
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.EMERGENCY, log_message.ACTION.UPDATE_EMERGENCY + ", EmergencyId: " + updateData.autoIncrementID + ", Number: " + updateData.phoneNumber)
                        nextCall(null);
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.EMERGENCY_UPDATE_SUCC,
                data: {}
            });
        });
    },

    deleteEmergency: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('emergency_id', message.EMERGENCY_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get emergency details */
            function (body, nextCall) {
                EmergencySchema.findOne({
                    '_id': body.emergency_id
                }).exec(function (err, emergency) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!emergency) {
                        return nextCall({
                            "message": message.EMERGENCY_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, emergency)
                    }
                });
            },
            /** remove emergency */
            function (body, emergency, nextCall) {
                EmergencySchema.remove({
                    "_id": mongoose.Types.ObjectId(body.emergency_id)
                }, function (err, deleteData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    _self.addActionLog(req.user, log_message.SECTION.EMERGENCY, log_message.ACTION.DELETE_EMERGENCY + ", EmergencyId: " + emergency.autoIncrementID + ", Number: " + emergency.phoneNumber)
                    nextCall(null);
                });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.EMERGENCY_DELETE_SUCC,
                data: {}
            });
        })
    },

    sendNotification: function (req, res) {
        async.waterfall([
            function (nextCall) {
                nextCall(null, req.body);
            },
            function (body, nextCall) {
                let pushNotificationData = {
                    to: body.deviceToken,
                    message: body.message,
                    data: {}
                }
                pn.fcm(pushNotificationData, function (err, Success) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    }
                    nextCall(null)
                })
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: "Notification send successfully.",
                data: {}
            });
        })
    },

    /**
     * Rewards Module
     */
    ListAllRewards: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        }
        async.waterfall([
            function (nextCall) {
                var matchObj = {};
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'phoneNumber': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                RewardSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                RewardSchema
                    .find(matchObj, {
                        // '_id': 1,
                        // 'phoneNumber': 1
                    }, {
                            limit: Number(req.body.length),
                            skip: Number(req.body.start)
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            response.data = poiUsers;
                            nextCall();
                        } else {
                            nextCall();
                        }
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    addReward: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                // req.checkBody('name', message.NAME_REQUIRED).notEmpty();
                // req.checkBody('amount', message.AMOUNT_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                } else if ((req.body.passengerId != undefined && req.body.passengerId != "" && req.body.passengerId != null) ||
                    req.body.driverId != undefined && req.body.driverId != "" && req.body.driverId != null) {
                    nextCall(null, req.body);
                } else {
                    return nextCall({
                        message: message.USER_ID_REQUIRED
                    });
                }
            },
            /** register reward */
            function (body, nextCall) {
                let rewardData = {};
                if (typeof req.body.name == "string") {
                    req.body.name = JSON.parse(req.body.name);
                }
                rewardData.name = req.body.name;

                if (typeof req.body.details == "string") {
                    req.body.details = JSON.parse(req.body.details);
                }
                rewardData.details = req.body.details;
                rewardData.amount = req.body.amount;

                if (body.type && body.type == "birthday") {
                    rewardData.type = req.body.type;
                    rewardData.isExpandable = true;
                    rewardData.giftType = req.body.giftType;
                } else {
                    rewardData.type = req.body.type;
                    rewardData.isExpandable = false;
                    rewardData.giftType = req.body.giftType;
                    // rewardData.giftName = req.body.giftName;
                }

                if (body.passengerId != "" && body.passengerId != null && body.passengerId != "") {
                    rewardData.passengerId = body.passengerId;
                    rewardData.isPassenger = true;
                } else if (body.driverId != "" && body.driverId != null && body.driverId != "") {
                    rewardData.driverId = body.driverId;
                    rewardData.isDriver = true;
                }

                nextCall(null, rewardData)
            },
            /** get reward auto increment id */
            function (rewardData, nextCall) {
                _self.getRewardAutoIncrement(function (err, response) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    rewardData.autoIncrementID = response.rewardAutoIncrement;
                    nextCall(null, rewardData)
                });
            },
            /** save reward data */
            function (rewardData, nextCall) {
                let reward = new RewardSchema(rewardData);
                reward.save(function (err, insertData) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    }
                    nextCall(null, insertData)
                });
            },
            /** check reward cash or other */
            function (insertData, nextCall) {
                if (insertData.isDriver && insertData.driverId != "" && insertData.driverId != null) {
                    if (insertData.giftType && insertData.giftType == "wallet") {
                        DriverSchema.findOneAndUpdate({
                            "_id": mongoose.Types.ObjectId(insertData.driverId)
                        }, {
                                $inc: {
                                    "creditBalance": Number(insertData.amount)
                                }
                            })
                            .populate('languageId')
                            .exec(function (err, driverUpdateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                nextCall(null, insertData, driverUpdateData);
                            });
                    } else {
                        DriverSchema.findOne({
                            '_id': insertData.driverId
                        }).populate('languageId').exec(function (err, driver) {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG
                                })
                            } else if (!driver) {
                                return nextCall({
                                    "message": message.DRIVER_NOT_FOUND
                                })
                            } else {
                                nextCall(null, insertData, driver)
                            }
                        });
                    }
                } else if (insertData.isPassenger && insertData.passengerId != null && insertData.passengerId != "") {
                    PassengerSchema.findOne({
                        '_id': insertData.passengerId
                    })
                        .populate('languageId')
                        .exec(function (err, passenger) {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG
                                })
                            } else if (!passenger) {
                                return nextCall({
                                    "message": message.PASSENGER_NOT_FOUND
                                })
                            } else {
                                nextCall(null, insertData, passenger)
                            }
                        });
                } else {
                    nextCall({
                        "message": message.INVALID_PARAMS
                    })
                }
            },
            /** Badge Count of notification */
            function (insertData, driverOrPassengerDetails, nextCall) {
                _self.badgeCount(driverOrPassengerDetails._id, insertData.isDriver, function (err, badgeCount) {
                    if (err) {
                        nextCall({ message: err })
                    }
                    else {
                        badgeCount = badgeCount ? badgeCount + 1 : 0
                        nextCall(null, insertData, driverOrPassengerDetails, badgeCount)
                    }
                })
            },
            /** Send notification */
            function (insertData, driverOrPassengerDetails, badgeCount, nextCall) {
                let ADMIN_SEND_REWARD_SUCC;
                if (driverOrPassengerDetails && driverOrPassengerDetails.languageId && driverOrPassengerDetails.languageId.code == 'km') {
                    ADMIN_SEND_REWARD_SUCC = COMBODIA_MESSAGES['ADMIN_SEND_REWARD_SUCC'];
                } else if (driverOrPassengerDetails && driverOrPassengerDetails.languageId && driverOrPassengerDetails.languageId.code == 'zh') {
                    ADMIN_SEND_REWARD_SUCC = CHINESE_MESSAGES['ADMIN_SEND_REWARD_SUCC'];
                } else {
                    ADMIN_SEND_REWARD_SUCC = message['ADMIN_SEND_REWARD_SUCC'];
                }

                let pushNotificationData = {
                    to: (driverOrPassengerDetails.deviceDetail && driverOrPassengerDetails.deviceDetail.token) || '',
                    type: insertData.isDriver ? 'driver' : 'passenger',
                    data: {
                        title: '',
                        type: insertData.isDriver ? 14 : 15,
                        body: ADMIN_SEND_REWARD_SUCC,
                        badge: badgeCount,
                        tag: 'Reward Ponits',
                        data: {}
                    }
                }

                pn.fcm(pushNotificationData, function (err, Success) {
                    let notificationData = {
                        title: pushNotificationData.data.body,
                        receiver_type: insertData.isDriver ? 'driver' : 'passenger',
                    }
                    if (insertData.isDriver) {
                        notificationData.driverId = driverOrPassengerDetails._id
                    } else {
                        notificationData.passengerId = driverOrPassengerDetails._id
                    }

                    let Notification = new NotificationSchema(notificationData);
                    Notification.save((err, notification) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.REWARD, insertData.isDriver ? log_message.ACTION.ADD_REWARD_DRIVER + ", DriverId: " + driverOrPassengerDetails.autoIncrementID + ", Name: " + driverOrPassengerDetails.name : log_message.ACTION.ADD_REWARD_PASSENGER + ", PassengerId: " + driverOrPassengerDetails.autoIncrementID + ", Name: " + driverOrPassengerDetails.name)
                        nextCall(null)
                    })
                })
            }

        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.REWARD_CREATE_SUCCESS,
                data: {}
            });
        });
    },

    receiveReward: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('rewardId', message.REWARD_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get reward details */
            function (body, nextCall) {
                RewardSchema.findOne({
                    '_id': body.rewardId
                }).exec(function (err, reward) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!reward) {
                        return nextCall({
                            "message": message.REWARD_NOT_FOUND
                        })
                    } else if (reward && reward.isReceived) {
                        return nextCall({
                            "message": message.REWARD_ALL_RECEIVED
                        })
                    } else {
                        nextCall(null, body, reward)
                    }
                });
            },
            /** update reward recieve */
            function (body, reward, nextCall) {
                RewardSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.rewardId)
                }, {
                        $set: {
                            "isReceived": true
                        }
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        _self.addActionLog(req.user, log_message.SECTION.REWARD, reward.isDriver ? log_message.ACTION.RECEIVE_REWARD_DRIVER + ", RewardId: " + updateData.autoIncrementID : log_message.ACTION.RECEIVE_REWARD_PASSENGER + ", RewardId: " + updateData.autoIncrementID)
                        nextCall(null);
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.REWARD_ACTION_SUCC,
                data: {}
            });
        })
    },

    listDriverReward: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        }
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driver_id', message.DRIVER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get driver details */
            function (body, nextCall) {
                DriverSchema.findOne({
                    '_id': body.driver_id
                }).exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driver) {
                        return nextCall({
                            "message": message.DRIVER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, driver)
                    }
                });
            },
            /** get driver reward list */
            function (body, driver, nextCall) {
                var matchObj = {
                    'driverId': body.driver_id
                };

                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'name': regex
                    }, {
                        'details': regex
                    }, {
                        'giftType': regex
                    }, {
                        'isReceived': regex
                    }, {
                        'type': regex
                    }, {
                        'amount': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort, driver);
            },
            function (matchObj, sort, driver, nextCall) {
                RewardSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 400,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort, driver)
                })
            },
            function (matchObj, sort, driver, nextCall) {
                RewardSchema
                    .find(matchObj, {
                        '_id': 1,
                        'name': 1,
                        'details': 1,
                        'giftType': 1,
                        'isReceived': 1,
                        'type': 1,
                        'isExpandable': 1,
                        'isDriver': 1,
                        'autoIncrementID': 1,
                        'createdAt': 1,
                        'amount': 1

                    }, {
                            limit: Number(req.body.length) || response.recordsTotal,
                            skip: Number(req.body.start) || 0
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, rewards) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (rewards.length > 0) {
                            response.data = rewards;
                            _self.addActionLog(req.user, log_message.SECTION.REWARD, log_message.ACTION.VIEW_REWARD_DRIVER + ", DriverId: " + driver.autoIncrementID + ", Name: " + driver.name)
                            nextCall();
                        } else {
                            _self.addActionLog(req.user, log_message.SECTION.REWARD, log_message.ACTION.VIEW_REWARD_DRIVER + ", DriverId: " + driver.autoIncrementID + ", Name: " + driver.name)
                            nextCall();
                        }
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    listPassengerReward: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        }
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('passenger_id', message.PASSENGER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get passenger details */
            function (body, nextCall) {
                PassengerSchema.findOne({
                    '_id': body.passenger_id
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": message.PASSENGER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, passenger)
                    }
                });
            },
            /** get passenger reward list */
            function (body, passenger, nextCall) {
                var matchObj = {
                    'passengerId': body.passenger_id
                };

                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'name': regex
                    }, {
                        'details': regex
                    }, {
                        'giftType': regex
                    }, {
                        'isReceived': regex
                    }, {
                        'type': regex
                    }, {
                        'amount': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort, passenger);
            },
            function (matchObj, sort, passenger, nextCall) {
                RewardSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 400,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort, passenger)
                })
            },
            function (matchObj, sort, passenger, nextCall) {
                RewardSchema
                    .find(matchObj, {
                        '_id': 1,
                        'name': 1,
                        'details': 1,
                        'giftType': 1,
                        'isReceived': 1,
                        'type': 1,
                        'isExpandable': 1,
                        'isPassenger': 1,
                        'autoIncrementID': 1,
                        'createdAt': 1,
                        'amount': 1
                    }, {
                            limit: Number(req.body.length) || response.recordsTotal,
                            skip: Number(req.body.start) || 0
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, rewards) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (rewards.length > 0) {
                            response.data = rewards;
                            _self.addActionLog(req.user, log_message.SECTION.REWARD, log_message.ACTION.VIEW_REWARD_PASSENGER + ", PassengerId: " + passenger.autoIncrementID + ", Name: " + passenger.name)
                            nextCall();
                        } else {
                            _self.addActionLog(req.user, log_message.SECTION.REWARD, log_message.ACTION.VIEW_REWARD_PASSENGER + ", PassengerId: " + passenger.autoIncrementID + ", Name: " + passenger.name)
                            nextCall();
                        }
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    /** Ride History Module */
    ListAllRideHistory: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        }
        async.waterfall([
            function (nextCall) {
                var matchObj = {
                    'status': {
                        $in: ['cancelled', 'accepted', 'arrived', 'onride', 'completed']
                    }
                };
                if (req.body && req.body.driverId) {
                    matchObj.driverId = req.body.driverId
                }
                if (req.body && req.body.passengerId) {
                    matchObj.passengerId = req.body.passengerId
                }

                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'pickupAddress': regex
                    }, {
                        'destinationAddress': regex
                    }, {
                        'reasonText.en': regex
                    }, {
                        'reasonText.zh': regex
                    }, {
                        'reasonText.km': regex
                    }];

                    matchObj.$or = or;

                    if (req.body.search && req.body.search.value && !isNaN(req.body.search.value)) {
                        matchObj.$or = [{
                            'rideId': Number(req.body.search.value)
                        }, {
                            'toatlFare': Number(req.body.search.value)
                        }, {
                            'totalTime': Number(req.body.search.value)
                        }, {
                            'toatlDistance': Number(req.body.search.value)
                        }]
                    }

                    if (req.body.search && req.body.search.value == 'active' || req.body.search.value == 'Active') {
                        matchObj.$or = [{
                            'status': 'accepted'
                        }, {
                            'status': 'arrived'
                        }, {
                            'status': 'onride'
                        }]
                    } else if (req.body.search && req.body.search.value == 'cancel' || req.body.search.value == 'cancelled') {
                        matchObj.$or = [{
                            'status': 'cancelled'
                        }]
                    } else if (req.body.search && req.body.search.value == 'finish' || req.body.search.value == 'finished') {
                        matchObj.$or = [{
                            'status': 'completed'
                        }]
                    }
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                RideSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                RideSchema
                    .find(matchObj, {
                        '_id': 1,
                        'rideId': 1,
                        'totalTime': 1,
                        'status': 1,
                        'toatlFare': 1,
                        'toatlDistance': 1,
                        'pickupAddress': 1,
                        'destinationAddress': 1,
                        'createdAt': 1,
                        'acceptedAt': 1,
                        'cancelReason': 1,
                        'passengerId': 1,
                        'driverId': 1,
                        'paymentAt': 1,
                        'updatedAt': 1,
                        'reasonText': 1,
                        'cancelBy': 1
                    }, {
                            limit: Number(req.body.length),
                            skip: Number(req.body.start)
                        })
                    .sort(sort)
                    .lean()
                    // .populate('cancelReason')
                    .exec(function (err, rideDetails) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (rideDetails.length > 0) {
                            response.data = rideDetails;
                            nextCall();
                        } else {
                            nextCall();
                        }
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    getRideDetails: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('ride_id', message.RIDE_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get ride details */
            function (body, nextCall) {
                RideSchema.findOne({
                    '_id': body.ride_id
                }).populate('driverId').populate('passengerId').populate('requestedVehicleTypeId').exec(function (err, ride) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!ride) {
                        return nextCall({
                            "message": message.RIDE_NOT_FOUND
                        })
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.RIDE_HISTORY, log_message.ACTION.VIEW_RIDE_HISTORY + ", RideId: " + ride.rideId)
                        nextCall(null, ride)
                    }
                });
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_RIDE_DETAILS_SUCC,
                data: response
            });
        });
    },

    cancelRide: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('ride_id', message.RIDE_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** check ride details */
            function (body, nextCall) {
                RideSchema.findOne({
                    '_id': body.ride_id,
                }).exec((err, ride) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else if (!ride) {
                        return nextCall({
                            'message': message.RIDE_NOT_FOUND
                        })
                    } else {
                        nextCall(null, ride)
                    }
                })
            },
            /** check ride and driver is valid or not */
            function (ride, nextCall) {
                if (ride.status === 'requested' || ride.status === 'accepted' || ride.status === 'arrived' || ride.status === 'onride') {
                    let condition = {
                        '_id': ride._id
                    }
                    let reasonText = {
                        'en': message.RIDE_CANCEL_BY_SYSTEM,
                        'zh': CHINESE_MESSAGES.RIDE_CANCEL_BY_SYSTEM,
                        'km': COMBODIA_MESSAGES.RIDE_CANCEL_BY_SYSTEM
                    }
                    let updateData = {
                        'status': 'cancelled',
                        'cancelBy': 'system',
                        'reasonText': reasonText
                    }
                    RideSchema.findOneAndUpdate(condition, {
                        $set: updateData
                    }, {
                            new: true
                        })
                        .exec((err, ride) => {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG,
                                });
                            } else if (!ride) {
                                return nextCall({
                                    "message": message.CANT_ACCEPT_ABLE_TO_ACCEPT_THIS_RIDE_REQUEST,
                                });
                            } else {
                                redisClient.del(`ride.passenger.${ride.passengerId.toString()}`)
                                redisClient.del(`ride.status.${ride._id.toString()}`)
                                if (ride && ride.driverId) {
                                    redisClient.del(`ride.driver.${ride.driverId.toString()}`)
                                }
                                nextCall(null, ride)
                            }
                        })
                } else {
                    return nextCall({
                        "message": "Ride request has been expired."
                    });
                }
            },
            /** remove driver ride timer */
            function (ride, nextCall) {
                if (ride && !ride.driverId) {
                    DriverRideRequestSchema.findOne({
                        rideId: ride._id,
                        'status.type': {
                            $eq: 'sent'
                        }
                    }).populate('driverId').sort({
                        distance: -1
                    }).exec((err, driverRideRequest) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        }
                        if (driverRideRequest.driverId && driverRideRequest.driverId._id) {
                            ride.driverId = driverRideRequest.driverId;
                            // _self.sendCancelRideRequestNotificationToDriver(ride)
                        }
                        nextCall(null, ride)
                    });
                } else {
                    _self.setDriverFree(ride)
                    nextCall(null, ride)
                }
            },
            /** remove driver ride request */
            function (ride, nextCall) {
                DriverRideRequestSchema.remove({
                    'rideId': ride._id
                }).exec((err, remveDriverRideRequest) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    }
                    nextCall(null, ride)
                })

            },
            /** Badge Count of notification */
            function (ride, nextCall) {
                _self.badgeCount(ride.passengerId._id, isDriver = false, function (err, badgeCount) {
                    if (err) {
                        nextCall({ message: err })
                    }
                    else {
                        badgeCount = badgeCount ? badgeCount + 1 : 0
                        nextCall(null, ride, badgeCount)
                    }
                })
            },
            /** send notification to passenger */
            function (ride, badgeCount, nextCall) {
                let condition = {
                    '_id': ride._id
                };
                RideSchema.findOne(condition)
                    .populate({
                        path: 'passengerId',
                        select: {
                            'deviceDetail': 1
                        },
                        populate: {
                            path: 'languageId'
                        }
                    })
                    .exec((err, ride) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        }

                        let RIDE_CANCEL_BY_SYSTEM;
                        if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'km') {
                            RIDE_CANCEL_BY_SYSTEM = COMBODIA_MESSAGES['RIDE_CANCEL_BY_SYSTEM'];
                        } else if (ride.passengerId && ride.passengerId.languageId && ride.passengerId.languageId.code == 'zh') {
                            RIDE_CANCEL_BY_SYSTEM = CHINESE_MESSAGES['RIDE_CANCEL_BY_SYSTEM'];
                        } else {
                            RIDE_CANCEL_BY_SYSTEM = message['RIDE_CANCEL_BY_SYSTEM'];
                        }

                        let pushNotificationData = {
                            to: (ride.passengerId.deviceDetail && ride.passengerId.deviceDetail.token) || '',
                            type: 'passenger',
                            data: {
                                title: '',
                                type: 18,
                                body: RIDE_CANCEL_BY_SYSTEM,
                                badge: badgeCount,
                                tag: 'Ride',
                                data: {
                                    rideId: ride._id
                                }
                            }
                        }

                        pn.fcm(pushNotificationData, function (err, Success) {
                            let notificationData = {
                                title: pushNotificationData.data.body,
                                receiver_type: 'passenger',
                                passengerId: ride.passengerId._id,
                                rideId: ride._id
                            }
                            let Notification = new NotificationSchema(notificationData);
                            Notification.save((err, notification) => {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG,
                                    });
                                }
                                nextCall(null, ride)
                            })
                        })
                    })
            },
            /** Badge Count of notification */
            function (ride, nextCall) {
                _self.badgeCount(ride.driverId._id, isDriver = true, function (err, badgeCount) {
                    if (err) {
                        nextCall({ message: err })
                    }
                    else {
                        badgeCount = badgeCount ? badgeCount + 1 : 0
                        nextCall(null, ride, badgeCount)
                    }
                })
            },
            /** send notification to driver */
            function (ride, badgeCount, nextCall) {
                if (ride && ride.driverId) {
                    let condition = {
                        '_id': ride._id
                    };
                    RideSchema.findOne(condition)
                        .populate({
                            path: 'driverId',
                            select: {
                                'deviceDetail': 1
                            },
                            populate: {
                                path: 'languageId'
                            }
                        })
                        .exec((err, ride) => {
                            if (err) {
                                return nextCall({
                                    "message": message.SOMETHING_WENT_WRONG,
                                });
                            }

                            let RIDE_CANCEL_BY_SYSTEM;
                            if (ride.driverId && ride.driverId.languageId && ride.driverId.languageId.code == 'km') {
                                RIDE_CANCEL_BY_SYSTEM = COMBODIA_MESSAGES['RIDE_CANCEL_BY_SYSTEM'];
                            } else if (ride.driverId && ride.driverId.languageId && ride.driverId.languageId.code == 'zh') {
                                RIDE_CANCEL_BY_SYSTEM = CHINESE_MESSAGES['RIDE_CANCEL_BY_SYSTEM'];
                            } else {
                                RIDE_CANCEL_BY_SYSTEM = message['RIDE_CANCEL_BY_SYSTEM'];
                            }

                            let pushNotificationData = {
                                to: (ride.driverId.deviceDetail && ride.driverId.deviceDetail.token) || '',
                                type: 'driver',
                                data: {
                                    title: '',
                                    type: 19,
                                    body: RIDE_CANCEL_BY_SYSTEM,
                                    badge: badgeCount,
                                    tag: 'Ride',
                                    data: {
                                        rideId: ride._id
                                    }
                                }
                            }

                            pn.fcm(pushNotificationData, function (err, Success) {
                                let notificationData = {
                                    title: pushNotificationData.data.body,
                                    receiver_type: 'driver',
                                    driverId: ride.driverId._id,
                                    rideId: ride._id
                                }
                                let Notification = new NotificationSchema(notificationData);
                                Notification.save((err, notification) => {
                                    if (err) {
                                        return nextCall({
                                            "message": message.SOMETHING_WENT_WRONG,
                                        });
                                    }
                                    _self.addActionLog(req.user, log_message.SECTION.RIDE_HISTORY, log_message.ACTION.CANCEL_RIDE + ", RideId: " + ride.rideId + ", Reason: " + ride.reasonText.en)
                                    nextCall(null)
                                })
                            })
                        })
                } else {
                    _self.addActionLog(req.user, log_message.SECTION.RIDE_HISTORY, log_message.ACTION.CANCEL_RIDE + ", RideId: " + ride.rideId + ", Reason: " + ride.reasonText.en)
                    nextCall(null)
                }
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.CANCEL_RIDE_ACTION_SUCC,
                // data: {}
            });
        });
    },

    /** Referral Module Driver */
    listAllDriverReferral: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {
                    'isDeleted': false,
                    /* 'driverLevel': {
                        $in: [0, 1, 2]
                    } */
                };
                if (req.body && req.body.isVerified) {
                    matchObj.isVerified = true;
                }
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'uniqueID': regex
                    }, {
                        'phoneNumber': regex
                    }, {
                        'email': regex
                    }, {
                        'name': regex
                    }, {
                        'countryCode': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                DriverSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 400,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort)
                })
            },
            function (matchObj, sort, nextCall) {
                DriverSchema
                    .find(matchObj, {
                        '_id': 1,
                        'uniqueID': 1,
                        'name': 1,
                        'email': 1,
                        'phoneNumber': 1,
                        'countryCode': 1,
                        'onlyPhoneNumber': 1,
                        'dob': 1,
                        'isBlocked': 1,
                        'isVerified': 1,
                        'profilePhoto': 1,
                        'driverLevel': 1,
                        'createdAt': 1,
                        'verifiedDate': 1,
                        'autoIncrementID': 1,
                        'creditBalance': 1,
                        'avgRating': 1,
                        'verifiedBy': 1
                    }, {
                            limit: Number(req.body.length) || response.recordsTotal,
                            skip: Number(req.body.start) || 0
                        })
                    .sort(sort)
                    .lean()
                    .populate('verifiedBy')
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            // response.data = poiUsers;
                            nextCall(null, poiUsers);
                        } else {
                            nextCall(null, []);
                        }
                    });
            },
            function (drivers, nextCall) {
                async.mapSeries(drivers, function (driver, nextObj) {
                    let aggregateQuery = [];
                    // stage 1
                    aggregateQuery.push({
                        $match: {
                            $or: [{
                                "parentDriver": mongoose.Types.ObjectId(driver._id)
                            },
                            {
                                "grandParentDriver": mongoose.Types.ObjectId(driver._id)
                            },
                            {
                                "greatGrandParentDriver": mongoose.Types.ObjectId(driver._id)
                            }
                            ]
                        }
                    })
                    // stage 2
                    aggregateQuery.push({
                        $group: {
                            '_id': null,
                            'totalInvitedCount': {
                                $sum: 1
                            }
                        }
                    })
                    DriverReferralSchema.aggregate(aggregateQuery, (err, totalInvitedCountData) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        } else {
                            if (totalInvitedCountData && totalInvitedCountData.length > 0) {
                                driver.totalInvitedCount = totalInvitedCountData[0].totalInvitedCount;
                            } else {
                                driver.totalInvitedCount = 0;
                            }
                            nextObj(null)
                        }
                    })
                }, function (err) {
                    response.data = drivers;
                    nextCall()
                });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    getDriverReferralDetails: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driver_id', message.DRIVER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({ message: error[0].msg });
                }
                nextCall(null, req.body);
            },
            /** get driver details */
            function (body, nextCall) {
                DriverSchema.findOne({ '_id': body.driver_id })
                    .exec(function (err, driver) {
                        if (err) {
                            return nextCall({ "message": message.SOMETHING_WENT_WRONG })
                        }
                        else if (!driver) {
                            return nextCall({ "message": message.DRIVER_NOT_FOUND })
                        }
                        else {
                            nextCall(null, driver)
                        }
                    });
            },
            /** get driver referral details */
            function (driver, nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $match: {
                        $or: [{
                            "parentDriver": mongoose.Types.ObjectId(driver._id)
                        },
                        {
                            "grandParentDriver": mongoose.Types.ObjectId(driver._id)
                        },
                        {
                            "greatGrandParentDriver": mongoose.Types.ObjectId(driver._id)
                        }]
                    }
                })
                aggregateQuery.push({
                    $lookup: {
                        "from": "driver",
                        "localField": "driver",
                        "foreignField": "_id",
                        "as": "driverRef"
                    }
                })
                aggregateQuery.push({
                    $unwind: {
                        path: "$driverRef",
                        includeArrayIndex: "arrayIndex"
                    }
                })
                aggregateQuery.push({
                    $group: {
                        '_id': "$driverLevel",
                        "grandParentDriver": {
                            $first: "$grandParentDriver"
                        },
                        "referralCode": {
                            $push: "$referralCode"
                        },
                        'totalEarning': {
                            $sum: '$driverRef.earningFromReferral'
                        },
                        'count': {
                            $sum: 1
                        }
                    }
                })
                aggregateQuery.push({
                    $project: {
                        "_id": 0,
                        "grandParentDriver": 1,
                        "referralCode": 1,
                        "level": "$_id",
                        "invited": "$count",
                        "earning": "$totalEarning"
                    }
                })
                aggregateQuery.push({
                    $sort: {
                        level: 1
                    }
                })

                DriverReferralSchema.aggregate(aggregateQuery, (err, totalRefEarning) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        let totalInvited = totalRefEarning[0] ? totalRefEarning[0].invited : 0;

                        nextCall(null, driver, totalInvited, totalRefEarning)
                        // if (driver.driverLevel == 0) {
                        //     if (totalRefEarning.length == 1) {
                        //         totalRefEarning[0] = {
                        //             "level": null,
                        //             "invited": null,
                        //             "earning": null
                        //         }
                        //     }
                        //     if (totalRefEarning.length == 2) {
                        //         // totalRefEarning[1] = {
                        //         //     "level": null,
                        //         //     "invited": null,
                        //         //     "earning": null
                        //         // }
                        //     }
                        //     if (totalRefEarning.length < 3) {
                        //         for (let index = totalRefEarning.length; index < 3; index++) {
                        //             totalRefEarning.push({
                        //                 "level": null,
                        //                 "invited": null,
                        //                 "earning": null
                        //             })
                        //         }
                        //     }
                        //     // totalRefEarning[2] = {
                        //     //     "level": null,
                        //     //     "invited": null,
                        //     //     "earning": null
                        //     // }
                        // } else if (driver.driverLevel == 1) {
                        //     if (totalRefEarning.length == 1) {
                        //         totalRefEarning[0] = {
                        //             "level": null,
                        //             "invited": null,
                        //             "earning": null
                        //         }
                        //     }
                        //     if (totalRefEarning.length < 2) {
                        //         for (let index = totalRefEarning.length; index < 2; index++) {
                        //             totalRefEarning.push({
                        //                 "level": null,
                        //                 "invited": null,
                        //                 "earning": null
                        //             })
                        //         }
                        //     }
                        //     totalRefEarning[1] = {
                        //         "level": null,
                        //         "invited": null,
                        //         "earning": null
                        //     }
                        // } else if (driver.driverLevel == 2) {
                        //     if (totalRefEarning.length < 1) {
                        //         for (let index = totalRefEarning.length; index < 1; index++) {
                        //             totalRefEarning.push({
                        //                 "level": null,
                        //                 "invited": null,
                        //                 "earning": null
                        //             })
                        //         }
                        //     }
                        //     totalRefEarning[0] = {
                        //         "level": null,
                        //         "invited": null,
                        //         "earning": null
                        //     }
                        // }

                        // var realResponse = {
                        //     driver: driver,
                        //     invited: totalInvited,
                        //     earning: driver.earningFromReferral,
                        //     levels: totalRefEarning
                        // }
                        // _self.addActionLog(req.user, log_message.SECTION.REFERRAL_HIERARCY, log_message.ACTION.VIEW_DRIVER_REFERRAL_HIERARCY + ", DriverId: " + driver.autoIncrementID + ", Name: " + driver.name)
                        // nextCall(null, realResponse)
                    }
                })
            },
            function (driver, totalInvited, totalRefEarning, nextCall) {
                if (totalRefEarning.length < 3) {
                    nextCall(null, driver, totalInvited, totalRefEarning)
                } else {
                    let aggregateQueryInside = [];
                    aggregateQueryInside.push({
                        $match: {
                            greatGrandParentDriver: totalRefEarning[2].grandParentDriver,
                            $or: totalRefEarning[2].referralCode.map(e => ({ inviteCode: e }))
                        },
                    })
                    aggregateQueryInside.push({
                        $lookup: {
                            "from": "driver",
                            "localField": "driver",
                            "foreignField": "_id",
                            "as": "driverRef"
                        }
                    })
                    aggregateQueryInside.push({
                        $unwind: {
                            path: "$driverRef",
                            includeArrayIndex: "arrayIndex"
                        }
                    })
                    aggregateQueryInside.push({
                        $group: {
                            '_id': "$driverLevel",
                            "grandParentDriver": {
                                $first: "$grandParentDriver"
                            },
                            "referralCode": {
                                $push: "$referralCode"
                            },
                            'totalEarning': {
                                $sum: '$driverRef.earningFromReferral'
                            },
                            'count': {
                                $sum: 1
                            }
                        }
                    })
                    aggregateQueryInside.push({
                        $project: {
                            "_id": 0,
                            "grandParentDriver": 1,
                            "referralCode": 1,
                            "level": "$_id",
                            "invited": "$count",
                            "earning": "$totalEarning"
                        }
                    })
                    aggregateQueryInside.push({
                        $sort: {
                            level: 1
                        }
                    })
                    DriverReferralSchema.aggregate(aggregateQueryInside, function (err, lastLevelInfo) {
                        if (err) {
                            return nextCall({ "message": message.SOMETHING_WENT_WRONG, });
                        }
                        if (lastLevelInfo.length) {
                            totalRefEarning.push(lastLevelInfo[0])
                        }
                        nextCall(null, driver, totalInvited, totalRefEarning)
                    })
                }
            },
            function (driver, totalInvited, totalRefEarning, nextCall) {
                for (let index = 0; index < totalRefEarning.length - 1; index++) {
                    totalRefEarning[index].invited = totalRefEarning[index + 1].invited;
                }
                if (totalRefEarning.length > 3) {
                    totalRefEarning.pop();
                }
                else if (totalRefEarning.length == 3) {
                    totalRefEarning.pop();
                    totalRefEarning.push({
                        level: null,
                        invited: null,
                        earning: null
                    });
                }
                else if (totalRefEarning.length == 2) {
                    totalRefEarning.pop()
                    totalRefEarning.push(
                        {
                            "level": null,
                            "invited": null,
                            "earning": null
                        },
                        {
                            "level": null,
                            "invited": null,
                            "earning": null
                        }
                    )
                }
                else if (totalRefEarning.length == 1) {
                    totalRefEarning.pop()
                    totalRefEarning.push(
                        {
                            "level": null,
                            "invited": null,
                            "earning": null
                        },
                        {
                            "level": null,
                            "invited": null,
                            "earning": null
                        },
                        {
                            "level": null,
                            "invited": null,
                            "earning": null
                        }
                    )
                }
                else if (totalRefEarning.length == 0) {
                    for (let index = 0; index < 3; index++) {
                        totalRefEarning[index] = {
                            "level": null,
                            "invited": null,
                            "earning": null
                        }
                    }
                }
                var realResponse = {
                    driver: driver,
                    invited: totalInvited,
                    earning: driver.earningFromReferral,
                    levels: totalRefEarning
                }
                _self.addActionLog(req.user, log_message.SECTION.REFERRAL_HIERARCY, log_message.ACTION.VIEW_DRIVER_REFERRAL_HIERARCY + ", DriverId: " + driver.autoIncrementID + ", Name: " + driver.name)
                nextCall(null, realResponse)
            }
        ],
            function (err, response) {
                if (err) {
                    return res.sendToEncode({
                        status: 400,
                        message: (err && err.message) || message.SOMETHING_WENT_WRONG
                    });
                }
                return res.sendToEncode({
                    status_code: 200,
                    message: message.GET_DRIVER_DETAILS_SUCC,
                    data: response
                });
            });
    },

    listDriverReferralByLevel: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driver_id', message.DRIVER_ID_REQUIRED).notEmpty();
                req.checkBody('driver_level', message.DRIVER_LEVEL_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get driver details */
            function (body, nextCall) {
                DriverSchema.findOne({
                    '_id': body.driver_id
                }).exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driver) {
                        return nextCall({
                            "message": message.DRIVER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, driver)
                    }
                });
            },
            /** get driver referral details */
            function (body, driver, nextCall) {
                let aggregateQuery = [];
                let query;
                // body.driver_level = 1;
                if (body.driver_level && body.driver_level == 1) {
                    query = {
                        $match:
                        {
                            "parentDriver": mongoose.Types.ObjectId(driver._id)
                        }
                    }
                } else if (body.driver_level && body.driver_level == 2) {
                    query = {
                        $match: {
                            "grandParentDriver": mongoose.Types.ObjectId(driver._id)
                        }
                    }
                } else if (body.driver_level && body.driver_level >= 3) {
                    query = {
                        $match: {
                            "greatGrandParentDriver": mongoose.Types.ObjectId(driver._id)
                        }
                    }
                }
                else {
                    return nextCall({
                        "message": message.DRIVER_LEVEL_NOT_FOUND,
                    });
                }

                aggregateQuery.push(query)
                aggregateQuery.push({
                    $lookup: {
                        "from": "driver",
                        "localField": "driver",
                        "foreignField": "_id",
                        "as": "driver"
                    }
                })
                aggregateQuery.push({
                    $unwind: {
                        path: "$driver",
                        includeArrayIndex: "arrayIndex"
                    }
                })
                aggregateQuery.push({
                    $facet: {
                        paginatedResults: [{
                            $skip: body.start || 0
                        }, {
                            $limit: body.length || 10
                        }],
                        totalCount: [{
                            $count: 'count'
                        }]
                    }
                })

                DriverReferralSchema.aggregate(aggregateQuery, (err, driverReferralDetails) => {
                    if (err) {
                        return nextCall({
                            "error": err,
                            "status_code": 0,
                            "message": message.SOMETHING_WENT_WRONG,
                            error: err
                        });
                    } else if (driverReferralDetails.length > 0) {
                        response.data = driverReferralDetails[0].paginatedResults;
                        if (driverReferralDetails[0].totalCount[0]) {
                            response.recordsTotal = driverReferralDetails[0].totalCount[0].count;
                            response.recordsFiltered = driverReferralDetails[0].totalCount[0].count
                        }

                        _self.addActionLog(req.user, log_message.SECTION.REFERRAL_HIERARCY, log_message.ACTION.VIEW_DRIVER_LEVEL + ", DriverId: " + driver.autoIncrementID + ",  Name: " + driver.name)
                        nextCall(null, response);
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.REFERRAL_HIERARCY, log_message.ACTION.VIEW_DRIVER_LEVEL + ", DriverId: " + driver.autoIncrementID + ",  Name: " + driver.name)
                        nextCall(null, response);
                    }
                })
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode(response);
        });
    },

    /** Referral Module Passenger */
    listAllPassengerReferral: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {
                    'isDeleted': false,
                    // 'passengerLevel': {
                    //     $in: [0, 1, 2, 3, 4]
                    // }
                };

                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'uniqueID': regex
                    }, {
                        'name': regex
                    }, {
                        'email': regex
                    }, {
                        'onlyPhoneNumber': regex
                    }, {
                        'countryCode': regex
                    }];
                    matchObj.$or = or;
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                PassengerSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 400,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort)
                })
            },
            function (matchObj, sort, nextCall) {
                PassengerSchema
                    .find(matchObj, {
                        '_id': 1,
                        'uniqueID': 1,
                        'name': 1,
                        'email': 1,
                        'phoneNumber': 1,
                        'countryCode': 1,
                        'onlyPhoneNumber': 1,
                        'dob': 1,
                        'profilePhoto': 1,
                        'isBlocked': 1,
                        'createdAt': 1,
                        'autoIncrementID': 1,
                        'passengerLevel': 1
                    }, {
                            limit: Number(req.body.length) || response.recordsTotal,
                            skip: Number(req.body.start) || 0
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, poiUsers) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (poiUsers.length > 0) {
                            // response.data = poiUsers;
                            nextCall(null, poiUsers);
                        } else {
                            nextCall(null, []);
                        }
                    });
            },
            function (passengers, nextCall) {
                async.mapSeries(passengers, function (passenger, nextObj) {
                    let aggregateQuery = [];
                    // stage 1
                    aggregateQuery.push({
                        $match: {
                            $or: [
                                {
                                    "level1Passenger": mongoose.Types.ObjectId(passenger._id)
                                },
                                {
                                    "level2Passenger": mongoose.Types.ObjectId(passenger._id)
                                },
                                {
                                    "level3Passenger": mongoose.Types.ObjectId(passenger._id)
                                },
                                {
                                    "level4Passenger": mongoose.Types.ObjectId(passenger._id)
                                },
                                {
                                    "level5Passenger": mongoose.Types.ObjectId(passenger._id)
                                }
                            ]
                        }
                    })
                    // stage 2
                    aggregateQuery.push({
                        $group: {
                            '_id': null,
                            'totalInvitedCount': {
                                $sum: 1
                            },
                        }
                    })
                    PassengerReferralSchema.aggregate(aggregateQuery, (err, totalInvitedCountData) => {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG,
                            });
                        } else {
                            if (totalInvitedCountData && totalInvitedCountData.length > 0) {
                                passenger.totalInvitedCount = totalInvitedCountData[0].totalInvitedCount;
                            } else {
                                passenger.totalInvitedCount = 0;
                            }
                            nextObj(null)
                        }
                    })
                }, function (err) {
                    response.data = passengers;
                    nextCall()
                });

            }
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    getPassengerReferralDetails: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('passenger_id', message.PASSENGER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get passenger details */
            function (body, nextCall) {
                PassengerSchema.findOne({
                    '_id': body.passenger_id
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": message.PASSENGER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, passenger)
                    }
                });
            },
            /** get passenger referral details  */
            function (passenger, nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $match: {
                        $or: [{
                            "level1Passenger": mongoose.Types.ObjectId(passenger._id)
                        },
                        {
                            "level2Passenger": mongoose.Types.ObjectId(passenger._id)
                        },
                        {
                            "level3Passenger": mongoose.Types.ObjectId(passenger._id)
                        },
                        {
                            "level4Passenger": mongoose.Types.ObjectId(passenger._id)
                        },
                        {
                            "level5Passenger": mongoose.Types.ObjectId(passenger._id)
                        },
                        ]
                    }
                })
                aggregateQuery.push({
                    $lookup: {
                        "from": "passenger",
                        "localField": "passenger",
                        "foreignField": "_id",
                        "as": "passengerRef"
                    }
                })
                aggregateQuery.push({
                    $unwind: {
                        path: "$passengerRef",
                        includeArrayIndex: "arrayIndex"

                    }
                })
                aggregateQuery.push({
                    $group: {
                        '_id': "$passengerLevel",
                        'level4Passenger': {
                            $first: "$level4Passenger"
                        },
                        "referralCode": {
                            $push: "$referralCode"
                        },
                        'totalEarning': {
                            $sum: '$passengerRef.earningFromReferral'
                        },
                        'count': {
                            $sum: 1
                        }
                    }
                })
                aggregateQuery.push({
                    $project: {
                        "_id": 0,
                        "level": "$_id",
                        "level4Passenger": 1,
                        "referralCode": 1,
                        "invited": "$count",
                        "earning": "$totalEarning"
                    }
                })
                aggregateQuery.push({
                    $sort: {
                        level: 1
                    }
                })

                PassengerReferralSchema.aggregate(aggregateQuery, (err, totalRefEarning) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else {
                        let totalInvited = totalRefEarning[0] ? totalRefEarning[0].invited : 0;
                        // for (let index = 0; index < totalRefEarning.length - 1; index++) {
                        //     totalRefEarning[index].invited = totalRefEarning[index + 1].invited;
                        // }
                        nextCall(null, passenger, totalRefEarning, totalInvited)
                    }
                })
            },
            function (passenger, totalRefEarning, totalInvited, nextCall) {
                // let indexCondition;
                /*  if (passenger.passengerLevel == 0) {
                      // if (totalRefEarning.length == 1) {
                      //     totalRefEarning[0] = {
                      //         "level": null,
                      //         "invited": null,
                      //         "earning": null
                      //     }
                      // }
                      // if (totalRefEarning.length == 2) {
                      //     totalRefEarning[1] = {
                      //         "level": null,
                      //         "invited": null,
                      //         "earning": null
                      //     }
                      // }
                      if (totalRefEarning.length < 5) {
                          for (let index = totalRefEarning.length - 1; index < 5; index++) {
                              totalRefEarning[index] = {
                                  "level": null,
                                  "invited": null,
                                  "earning": null
                              }
                              // totalRefEarning.push({
                              //     "level": null,
                              //     "invited": null,
                              //     "earning": null
                              // })
                          }
                      }
                      totalRefEarning[4] = {
                          "level": null,
                          "invited": null,
                          "earning": null
                      }
                  } else if (passenger.passengerLevel == 1) {
                      if (totalRefEarning.length < 4) {
                          for (let index = totalRefEarning.length - 1; index < 4; index++) {
                              totalRefEarning[index] = {
                                  "level": null,
                                  "invited": null,
                                  "earning": null
                              }
                          }
                      }
                      totalRefEarning[3] = {
                          "level": null,
                          "invited": null,
                          "earning": null
                      }
                  } else if (passenger.passengerLevel == 2) {
                      if (totalRefEarning.length < 3) {
                          for (let index = totalRefEarning.length - 1; index < 3; index++) {
                              totalRefEarning[index] = {
                                  "level": null,
                                  "invited": null,
                                  "earning": null
                              }
                          }
                      }
                      totalRefEarning[2] = {
                          "level": null,
                          "invited": null,
                          "earning": null
                      }
                  } else if (passenger.passengerLevel == 3) {
                      if (totalRefEarning.length < 2) {
                          for (let index = totalRefEarning.length - 1; index < 2; index++) {
                              totalRefEarning[index] = {
                                  "level": null,
                                  "invited": null,
                                  "earning": null
                              }
                          }
                      }
                      totalRefEarning[1] = {
                          "level": null,
                          "invited": null,
                          "earning": null
                      }
                  } else if (passenger.passengerLevel == 4) {
                      if (totalRefEarning.length < 1) {
                          for (let index = totalRefEarning.length - 1; index < 1; index++) {
                              totalRefEarning[index] = {
                                  "level": null,
                                  "invited": null,
                                  "earning": null
                              }
                          }
                      }
                  }
  */
                // if (totalRefEarning.length < 5) {
                //     for (let index = totalRefEarning.length; index < indexCondition; index++) {
                //         totalRefEarning.push({
                //             "level": null,
                //             "invited": null,
                //             "earning": null
                //         })
                //     }
                // }
                /*var realResponse = {
                    passenger: passenger,
                    invited: totalInvited,
                    earning: passenger.earningFromReferral,
                    user_level: passenger.passengerLevel,
                    levels: totalRefEarning
                }
                _self.addActionLog(req.user, log_message.SECTION.REFERRAL_HIERARCY, log_message.ACTION.VIEW_PASSENGER_REFERRAL_HIERARCY + ", PassengerId: " + passenger.autoIncrementID + ", Name: " + passenger.name)
                nextCall(null, realResponse)*/

                if (totalRefEarning.length < 5) {
                    nextCall(null, passenger, totalInvited, totalRefEarning)
                } else {
                    let aggregateQueryInside = [];
                    aggregateQueryInside.push({
                        $match: {
                            level5Passenger: totalRefEarning[4].level4Passenger,
                            $or: totalRefEarning[4].referralCode.map(e => ({ inviteCode: e }))
                        },
                    })
                    aggregateQueryInside.push({
                        $lookup: {
                            "from": "passenger",
                            "localField": "passenger",
                            "foreignField": "_id",
                            "as": "passengerRef"
                        }
                    })
                    aggregateQueryInside.push({
                        $unwind: {
                            path: "$passengerRef",
                            includeArrayIndex: "arrayIndex"
                        }
                    })
                    aggregateQueryInside.push({
                        $group: {
                            '_id': "$passengerLevel",
                            "level4Passenger": {
                                $first: "$level4Passenger"
                            },
                            "referralCode": {
                                $push: "$referralCode"
                            },
                            'totalEarning': {
                                $sum: '$passengerRef.earningFromReferral'
                            },
                            'count': {
                                $sum: 1
                            }
                        }
                    })
                    aggregateQueryInside.push({
                        $project: {
                            "_id": 0,
                            "level4Passenger": 1,
                            "referralCode": 1,
                            "level": "$_id",
                            "invited": "$count",
                            "earning": "$totalEarning"
                        }
                    })
                    aggregateQueryInside.push({
                        $sort: {
                            level: 1
                        }
                    })
                    PassengerReferralSchema.aggregate(aggregateQueryInside, function (err, lastLevelInfo) {
                        if (err) {
                            return nextCall({ "message": message.SOMETHING_WENT_WRONG, });
                        }
                        if (lastLevelInfo.length) {
                            totalRefEarning.push(lastLevelInfo[0])
                        }
                        nextCall(null, passenger, totalInvited, totalRefEarning)
                    })
                }
            },
            function (passenger, totalInvited, totalRefEarning, nextCall) {
                for (let index = 0; index < totalRefEarning.length - 1; index++) {
                    totalRefEarning[index].invited = totalRefEarning[index + 1].invited;
                }
                if (totalRefEarning.length > 5) {
                    totalRefEarning.pop();
                }
                else if (totalRefEarning.length == 5) {
                    totalRefEarning.pop();
                    totalRefEarning.push({
                        level: null,
                        invited: null,
                        earning: null
                    });
                }
                else if (totalRefEarning.length == 4) {
                    totalRefEarning.pop()
                    for (let index = totalRefEarning.length; index < 5; index++) {
                        totalRefEarning[index] = {
                            "level": null,
                            "invited": null,
                            "earning": null
                        }
                    }
                }
                else if (totalRefEarning.length == 3) {
                    totalRefEarning.pop()
                    for (let index = totalRefEarning.length; index < 5; index++) {
                        totalRefEarning[index] = {
                            "level": null,
                            "invited": null,
                            "earning": null
                        }
                    }
                }
                else if (totalRefEarning.length == 2) {
                    totalRefEarning.pop()
                    for (let index = totalRefEarning.length; index < 5; index++) {
                        totalRefEarning[index] = {
                            "level": null,
                            "invited": null,
                            "earning": null
                        }
                    }
                }
                else if (totalRefEarning.length == 1) {
                    totalRefEarning.pop()
                    for (let index = totalRefEarning.length; index < 5; index++) {
                        totalRefEarning[index] = {
                            "level": null,
                            "invited": null,
                            "earning": null
                        }
                    }
                }
                else if (totalRefEarning.length == 0) {
                    for (let index = 0; index < 5; index++) {
                        totalRefEarning[index] = {
                            "level": null,
                            "invited": null,
                            "earning": null
                        }
                    }
                }
                var realResponse = {
                    passenger: passenger,
                    invited: totalInvited,
                    earning: passenger.earningFromReferral,
                    user_level: passenger.passengerLevel,
                    levels: totalRefEarning
                }
                _self.addActionLog(req.user, log_message.SECTION.REFERRAL_HIERARCY, log_message.ACTION.VIEW_PASSENGER_REFERRAL_HIERARCY + ", PassengerId: " + passenger.autoIncrementID + ", Name: " + passenger.name)
                nextCall(null, realResponse)
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_PASSENGER_REFERRAL_SUCC,
                data: response
            });
        });
    },

    listPassengerReferralByLevel: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('passenger_id', message.PASSENGER_ID_REQUIRED).notEmpty();
                req.checkBody('passenger_level', message.PASSENGER_LEVEL_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get passenger details */
            function (body, nextCall) {
                PassengerSchema.findOne({
                    '_id': body.passenger_id
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": message.PASSENGER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, passenger)
                    }
                });
            },
            /** get passenger referral details */
            function (body, passenger, nextCall) {
                let aggregateQuery = [];
                let query;
                // body.passenger_level = 1;
                if (body.passenger_level && body.passenger_level == 1) {
                    query = {
                        $match: {
                            "level1Passenger": mongoose.Types.ObjectId(passenger._id)
                        }
                    }
                } else if (body.passenger_level && body.passenger_level == 2) {
                    query = {
                        $match: {
                            "level2Passenger": mongoose.Types.ObjectId(passenger._id)
                        }
                    }
                } else if (body.passenger_level && body.passenger_level == 3) {
                    query = {
                        $match: {
                            "level3Passenger": mongoose.Types.ObjectId(passenger._id)
                        }
                    }
                } else if (body.passenger_level && body.passenger_level == 4) {
                    query = {
                        $match: {
                            "level4Passenger": mongoose.Types.ObjectId(passenger._id)
                        }
                    }
                } else {
                    return nextCall({
                        "message": message.PASSENGER_LEVEL_NOT_FOUND,
                    });
                }

                aggregateQuery.push(query)
                aggregateQuery.push({
                    $lookup: {
                        "from": "passenger",
                        "localField": "passenger",
                        "foreignField": "_id",
                        "as": "passenger"
                    }
                })
                aggregateQuery.push({
                    $unwind: {
                        path: "$passenger",
                        includeArrayIndex: "arrayIndex"
                    }
                })
                aggregateQuery.push({
                    $facet: {
                        paginatedResults: [{
                            $skip: body.start || 0
                        }, {
                            $limit: body.length || 10
                        }],
                        totalCount: [{
                            $count: 'count'
                        }]
                    }
                })

                PassengerReferralSchema.aggregate(aggregateQuery, (err, passengerReferralDetails) => {
                    if (err) {
                        return nextCall({
                            "error": err,
                            "status_code": 0,
                            "message": message.SOMETHING_WENT_WRONG,
                            error: err
                        });
                    } else if (passengerReferralDetails.length > 0) {
                        response.data = passengerReferralDetails[0].paginatedResults;
                        if (passengerReferralDetails[0].totalCount[0]) {
                            response.recordsTotal = passengerReferralDetails[0].totalCount[0].count;
                            response.recordsFiltered = passengerReferralDetails[0].totalCount[0].count
                        }

                        _self.addActionLog(req.user, log_message.SECTION.REFERRAL_HIERARCY, log_message.ACTION.VIEW_PASSENGER_LEVEL + ", PassengerId: " + passenger.autoIncrementID + ",  Name: " + passenger.name)
                        nextCall(null, response);
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.REFERRAL_HIERARCY, log_message.ACTION.VIEW_PASSENGER_LEVEL + ", PassengerId: " + passenger.autoIncrementID + ",  Name: " + passenger.name)
                        nextCall(null, response);
                    }
                })
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode(response);
        });
    },

    /** Referral Earning Withdraw Module */
    getDriverReferralEarning: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "totalReferralRemainingAmount": 0,
            "totalReferralCollectedAmount": 0,
            "data": []
        };
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driver_id', message.DRIVER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get driver earning details count */
            function (body, nextCall) {
                DriverRefEarningLogSchema.count({
                    'beneficiaryDriverId': body.driver_id
                }, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 400,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, body)
                })
            },
            /** get driver earning details */
            function (body, nextCall) {
                DriverRefEarningLogSchema.find({
                    'beneficiaryDriverId': body.driver_id
                }, {}, {
                        limit: Number(body.length) || response.recordsTotal,
                        skip: Number(body.start) || 0
                    }).populate([{
                        path: 'driverId',
                        select: 'name uniqueID'
                    },
                    {
                        path: 'beneficiaryDriverId',
                        select: 'name uniqueID'
                    },
                    {
                        path: 'rideId',
                        select: 'rideId paymentAt createdAt pickupAddress destinationAddress'
                    }
                    ]).exec(function (err, totalDriverRefEarningLogs) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            })
                        } else {
                            response.data = totalDriverRefEarningLogs;
                            nextCall(null, body)
                        }
                    });
            },
            /** get driver earning remaining withdrawal */
            function (body, nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $match: {
                        "beneficiaryDriverId": mongoose.Types.ObjectId(body.driver_id)
                    }
                })
                aggregateQuery.push({
                    $group: {
                        '_id': null,
                        "totalReferralRemainingAmount": {
                            $sum: {
                                $cond: [{
                                    $eq: ["$isWithdrawed", false]
                                }, "$referralAmount", 0]
                            }
                        },
                        "totalReferralCollectedAmount": {
                            $sum: {
                                $cond: [{
                                    $eq: ["$isWithdrawed", true]
                                }, "$referralAmount", 0]
                            }
                        }
                    }
                })
                aggregateQuery.push({
                    $project: {
                        "totalReferralRemainingAmount": "$totalReferralRemainingAmount",
                        "totalReferralCollectedAmount": "$totalReferralCollectedAmount"
                    }
                })

                DriverRefEarningLogSchema.aggregate(aggregateQuery, (err, totalAmount) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else if (totalAmount[0]) {
                        response.totalReferralRemainingAmount = totalAmount[0].totalReferralRemainingAmount;
                        response.totalReferralCollectedAmount = totalAmount[0].totalReferralCollectedAmount;
                        nextCall(null, response)
                    } else {
                        response.totalReferralRemainingAmount = totalAmount.totalReferralRemainingAmount;
                        response.totalReferralCollectedAmount = totalAmount.totalReferralCollectedAmount;
                        nextCall(null, response)
                    }
                })
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            _self.addActionLog(req.user, log_message.SECTION.REFERRAL_EARNING, log_message.ACTION.VIEW_DRIVER_REFERRAL_EARNING)
            return res.sendToEncode(response);
        });
    },

    driverRefEarningWithdraw: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driverRefLogsId', message.DRIVER_REF_EARNING_LOG_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get driver referral earning log details */
            function (body, nextCall) {
                DriverRefEarningLogSchema.findOne({
                    '_id': body.driverRefLogsId
                }).exec(function (err, driverRefEarningLog) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driverRefEarningLog) {
                        return nextCall({
                            "message": message.DRIVER_REF_EARNING_LOG_NOT_FOUND
                        })
                    } else if (driverRefEarningLog && driverRefEarningLog.isWithdrawed) {
                        return nextCall({
                            "message": message.DRIVER_REF_EARNING_LOG_ALL_RECEIVED
                        })
                    } else {
                        nextCall(null, body, driverRefEarningLog)
                    }
                });
            },
            /** update driverRefEarningLog withdraw */
            function (body, driverRefEarningLog, nextCall) {
                DriverRefEarningLogSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.driverRefLogsId)
                }, {
                        $set: {
                            "isWithdrawed": true
                        }
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        nextCall(null, updateData);
                    });
            },
            /** insert in withdraw logs */
            function (updateData, nextCall) {
                let withdrawData = {
                    "driverId": updateData.beneficiaryDriverId,
                    "isDriver": true,
                    "amount": updateData.referralAmount
                }

                let withdraw = new WithdrawsSchema(withdrawData);
                withdraw.save(function (err, withdrawData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    nextCall(null, updateData)
                })
            },
            /** get driver details */
            function (updateData, nextCall) {
                DriverSchema.findOne({
                    '_id': updateData.beneficiaryDriverId
                }).exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driver) {
                        return nextCall({
                            "message": message.DRIVER_NOT_FOUND
                        })
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.REFERRAL_EARNING, log_message.ACTION.WITHDRAW_DRIVER_EARNING + ", DriverId: " + driver.autoIncrementID + ", Name: " + driver.name)
                        nextCall(null)
                    }
                });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.DRIVER_REF_EARNING_LOG_ACTION_SUCC,
                data: {}
            });
        })
    },

    driverRefEarWithdrawAll: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('driver_id', message.DRIVER_ID_REQUIRED).notEmpty();
                req.checkBody('total_amount', message.AMOUNT_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get driver details */
            function (body, nextCall) {
                DriverSchema.findOne({
                    '_id': body.driver_id
                }).exec(function (err, driver) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!driver) {
                        return nextCall({
                            "message": message.DRIVER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, driver)
                    }
                });
            },
            /** update driverRefEarningLog withdraw */
            function (body, driver, nextCall) {
                DriverRefEarningLogSchema.updateMany({
                    "beneficiaryDriverId": mongoose.Types.ObjectId(body.driver_id),
                    "isWithdrawed": false
                }, {
                        $set: {
                            "isWithdrawed": true
                        }
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        nextCall(null, body, driver);
                    });
            },
            /** insert in withdraw logs */
            function (body, driver, nextCall) {
                let withdrawData = {
                    "driverId": body.driver_id,
                    "isDriver": true,
                    "amount": body.total_amount
                }

                let withdraw = new WithdrawsSchema(withdrawData);
                withdraw.save(function (err, withdrawData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    _self.addActionLog(req.user, log_message.SECTION.REFERRAL_EARNING, log_message.ACTION.WITHDRAW_ALL_DRIVER_EARNING + ", DriverId: " + driver.autoIncrementID + ", Name: " + driver.name)
                    nextCall(null)
                })
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.DRIVER_REF_EARNING_LOG_ACTION_SUCC,
                // data: {}
            });
        })
    },

    getPassengerReferralEarning: function (req, res) {

        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "totalReferralRemainingAmount": 0,
            "totalReferralCollectedAmount": 0,
            "data": []
        };
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('passenger_id', message.PASSENGER_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get passenger earning details count */
            function (body, nextCall) {
                PassengerReferralEarningLogsSchema.count({
                    'beneficiaryPassengerId': body.passenger_id
                }, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 400,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, body)
                })
            },
            /** get passenger earning details */
            function (body, nextCall) {
                PassengerReferralEarningLogsSchema.find({
                    'beneficiaryPassengerId': body.passenger_id
                }, {}, {
                        limit: Number(body.length) || response.recordsTotal,
                        skip: Number(body.start) || 0
                    }).populate('rideId').exec(function (err, totalPassengerRefEarningLogs) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            })
                        } else {
                            response.data = totalPassengerRefEarningLogs;
                            nextCall(null, body)
                        }
                    });
            },
            /** get passenger earning remaining withdrawal */
            function (body, nextCall) {
                let aggregateQuery = [];
                aggregateQuery.push({
                    $match: {
                        "beneficiaryPassengerId": mongoose.Types.ObjectId(body.passenger_id)
                    }
                })
                aggregateQuery.push({
                    $group: {
                        '_id': null,
                        "totalReferralRemainingAmount": {
                            $sum: {
                                $cond: [{
                                    $eq: ["$isWithdrawed", false]
                                }, "$referralAmount", 0]
                            }
                        },
                        "totalReferralCollectedAmount": {
                            $sum: {
                                $cond: [{
                                    $eq: ["$isWithdrawed", true]
                                }, "$referralAmount", 0]
                            }
                        }
                    }
                })
                aggregateQuery.push({
                    $project: {
                        "totalReferralRemainingAmount": "$totalReferralRemainingAmount",
                        "totalReferralCollectedAmount": "$totalReferralCollectedAmount"
                    }
                })

                PassengerReferralEarningLogsSchema.aggregate(aggregateQuery, (err, totalAmount) => {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG,
                        });
                    } else if (totalAmount[0]) {
                        response.totalReferralRemainingAmount = totalAmount[0].totalReferralRemainingAmount;
                        response.totalReferralCollectedAmount = totalAmount[0].totalReferralCollectedAmount;
                        nextCall(null, response)
                    } else {
                        response.totalReferralRemainingAmount = totalAmount.totalReferralRemainingAmount;
                        response.totalReferralCollectedAmount = totalAmount.totalReferralCollectedAmount;
                        nextCall(null, response)
                    }
                })
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            _self.addActionLog(req.user, log_message.SECTION.REFERRAL_EARNING, log_message.ACTION.VIEW_PASSENGER_REFERRAL_EARNING)
            return res.sendToEncode(response);
        });
    },

    passengerRefEarningWithdraw: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('passengerRefLogsId', message.PASSENGER_REF_EARNING_LOG_ID_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get passenger referral earning log details */
            function (body, nextCall) {
                PassengerReferralEarningLogsSchema.findOne({
                    '_id': body.passengerRefLogsId
                }).exec(function (err, passengerRefEarningLog) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!passengerRefEarningLog) {
                        return nextCall({
                            "message": message.PASSENGER_REF_EARNING_LOG_NOT_FOUND
                        })
                    } else if (passengerRefEarningLog && passengerRefEarningLog.isWithdrawed) {
                        return nextCall({
                            "message": message.PASSENGER_REF_EARNING_LOG_ALL_RECEIVED
                        })
                    } else {
                        nextCall(null, body, passengerRefEarningLog)
                    }
                });
            },
            /** update passengerRefEarningLog withdraw */
            function (body, passengerRefEarningLog, nextCall) {
                PassengerReferralEarningLogsSchema.findOneAndUpdate({
                    "_id": mongoose.Types.ObjectId(body.passengerRefLogsId)
                }, {
                        $set: {
                            "isWithdrawed": true
                        }
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        nextCall(null, updateData);
                    });
            },
            /** insert in withdraw logs */
            function (updateData, nextCall) {
                let withdrawData = {
                    "passengerId": updateData.beneficiaryPassengerId,
                    "amount": updateData.referralAmount
                }

                let withdraw = new WithdrawsSchema(withdrawData);
                withdraw.save(function (err, withdrawData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    nextCall(null, updateData)
                })
            },
            /** get passenger details */
            function (updateData, nextCall) {
                PassengerSchema.findOne({
                    '_id': updateData.beneficiaryPassengerId
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": message.PASSENGER_NOT_FOUND
                        })
                    } else {
                        _self.addActionLog(req.user, log_message.SECTION.REFERRAL_EARNING, log_message.ACTION.WITHDRAW_PASSENGER_EARNING + ", PassengerId: " + passenger.autoIncrementID + ", Name: " + passenger.name)
                        nextCall(null)
                    }
                });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.PASSENGER_REF_EARNING_LOG_ACTION_SUCC,
                data: {}
            });
        })
    },

    passengerRefEarWithdrawAll: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('passenger_id', message.PASSENGER_ID_REQUIRED).notEmpty();
                req.checkBody('total_amount', message.AMOUNT_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** get passenger details */
            function (body, nextCall) {
                PassengerSchema.findOne({
                    '_id': body.passenger_id
                }).exec(function (err, passenger) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    } else if (!passenger) {
                        return nextCall({
                            "message": message.PASSENGER_NOT_FOUND
                        })
                    } else {
                        nextCall(null, body, passenger)
                    }
                });
            },
            /** update passengerRefEarningLog withdraw all */
            function (body, passenger, nextCall) {
                PassengerReferralEarningLogsSchema.updateMany({
                    "beneficiaryPassengerId": mongoose.Types.ObjectId(body.passenger_id),
                    "isWithdrawed": false
                }, {
                        $set: {
                            "isWithdrawed": true
                        }
                    }, {
                        new: true
                    },
                    function (err, updateData) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            });
                        }
                        nextCall(null, body, passenger);
                    });
            },
            /** insert in withdraw logs */
            function (body, passenger, nextCall) {
                let withdrawData = {
                    "passengerId": body.passenger_id,
                    "amount": body.total_amount
                }

                let withdraw = new WithdrawsSchema(withdrawData);
                withdraw.save(function (err, withdrawData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    _self.addActionLog(req.user, log_message.SECTION.REFERRAL_EARNING, log_message.ACTION.WITHDRAW_ALL_PASSENGER_EARNING + ", PassengerId: " + passenger.autoIncrementID + ", Name: " + passenger.name)
                    nextCall(null)
                })
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.PASSENGER_REF_EARNING_LOG_ACTION_SUCC,
                // data: {}
            });
        })
    },

    /** Setting Module */
    getSystemSettings: function (req, res) {
        async.waterfall([
            function (nextCall) {
                SystemSettingsSchema.find({}, {
                    '_id': 1,
                    'uniqueID': 1,
                    'adminFee': 1,
                    'driverAutoIncrement': 1,
                    'passengerAutoIncrement': 1,
                    'operatorAutoIncrement': 1,
                    'driverMinimumBalance': 1,
                    'driverVersionUpdate': 1,
                    'passengerVersionUpdate': 1
                }).exec(function (err, getSystemSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    } else {

                        _self.addActionLog(req.user, log_message.SECTION.ADMIN_SETTING, log_message.ACTION.GET_SYSTEM_SETTING)
                        nextCall(null, getSystemSettingData[0])
                    }
                })
            }
        ], function (err, response) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.GET_SYSTEM_SETTING_DETAILS_SUCC,
                data: response
            });
        });
    },

    updateAdminFee: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('admin_fee', message.ADMIN_FEE_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** update admin fee */
            function (body, nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSettingData[0]) {
                        let updateData = {
                            "adminFee": body.admin_fee
                        }
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $set: updateData
                        },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                _self.addActionLog(req.user, log_message.SECTION.ADMIN_SETTING, log_message.ACTION.UPDATE_ADMIN_FEE)
                                nextCall(null)
                            });
                    } else {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                })
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.SYSTEM_SETTING_ACTION_SUCC
            });
        })
    },

    updateDriverMinimumBalance: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('minimum_balance', message.MINIMUM_BALANCE_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** update minimum balance */
            function (body, nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSettingData[0]) {
                        let updateData = {
                            "driverMinimumBalance": body.minimum_balance
                        }
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $set: updateData
                        },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                _self.addActionLog(req.user, log_message.SECTION.ADMIN_SETTING, log_message.ACTION.UPDATE_DRIVER_MINIMUM_BALANCE)
                                nextCall(null)
                            });
                    } else {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                })
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.SYSTEM_SETTING_ACTION_SUCC
            });
        })
    },

    driverVersionUpdate: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('new_version_ios', message.IOS_VERSION_REQUIRED).notEmpty();
                req.checkBody('new_version_android', message.ANDROID_VERSION_REQUIRED).notEmpty();
                req.checkBody('force_update', message.FORCE_UPDATE_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** update minimum balance */
            function (body, nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSettingData[0]) {
                        let updateData = {
                            driverVersionUpdate: {
                                "new_version_ios": body.new_version_ios,
                                "new_version_android": body.new_version_android,
                                "force_update": body.force_update
                            }
                        }
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $set: updateData
                        },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                _self.addActionLog(req.user, log_message.SECTION.ADMIN_SETTING, log_message.ACTION.UPDATE_DRIVER_APP_VERSION)
                                nextCall(null)
                            });
                    } else {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                })
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.SYSTEM_SETTING_ACTION_SUCC
            });
        })
    },

    passengerVersionUpdate: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                req.checkBody('new_version_ios', message.IOS_VERSION_REQUIRED).notEmpty();
                req.checkBody('new_version_android', message.ANDROID_VERSION_REQUIRED).notEmpty();
                req.checkBody('force_update', message.FORCE_UPDATE_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** update minimum balance */
            function (body, nextCall) {
                SystemSettingsSchema.find({}).exec(function (err, getSettingData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (getSettingData[0]) {
                        let updateData = {
                            passengerVersionUpdate: {
                                "new_version_ios": body.new_version_ios,
                                "new_version_android": body.new_version_android,
                                "force_update": body.force_update
                            }
                        }
                        SystemSettingsSchema.findOneAndUpdate({}, {
                            $set: updateData
                        },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                _self.addActionLog(req.user, log_message.SECTION.ADMIN_SETTING, log_message.ACTION.UPDATE_PASSENGER_APP_VERSION)
                                nextCall(null)
                            });
                    } else {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                })
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.SYSTEM_SETTING_ACTION_SUCC
            });
        })
    },

    /** Notification Module */
    sendNotificationToDriver: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                if (!req.body.flag && req.body.flag != 'all') {
                    req.checkBody('ids', message.DRIVER_IDS_ARRAY_REQUIRED).notEmpty();
                }
                req.checkBody('title', message.TITLE_REQUIRED).notEmpty();
                req.checkBody('message', message.MESSAGE_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** admin a notification to driver or selected driver or all driver */
            function (body, nextCall) {
                if (body.ids && typeof body.ids == "string") {
                    body.ids = JSON.parse(body.ids);
                }

                if (body.flag && body.flag == 'all') {
                    var matchObj = {
                        'isDeleted': false
                    };
                } else {
                    var matchObj = {
                        'isDeleted': false,
                        '_id': {
                            $in: body.ids
                        }
                    };
                }

                DriverSchema.find(matchObj, {
                    '_id': 1,
                    'name': 1,
                    'email': 1,
                    'phoneNumber': 1,
                    'autoIncrementID': 1,
                    'deviceDetail': 1
                })
                    .exec(function (err, drivers) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            })
                        } else {
                            async.mapSeries(drivers, function (driver, nextDriver) {

                                async.waterfall([
                                    function (nextCall) {
                                        _self.badgeCount(driver._id, isDriver = true, function (err, badgeCount) {
                                            if (err) {
                                                nextCall({ message: err })
                                            }
                                            else {
                                                badgeCount = badgeCount ? badgeCount + 1 : 0
                                                nextCall(null, badgeCount)
                                            }
                                        })
                                    },
                                    function (badgeCount, nextCall) {
                                        let pushNotificationData = {
                                            to: (driver.deviceDetail && driver.deviceDetail.token) || '',
                                            type: 'driver',
                                            data: {
                                                title: body.title,
                                                type: 16,
                                                body: body.message,
                                                badge: badgeCount,
                                                tag: 'System Notification',
                                                data: {}
                                            }
                                        }
                                        nextCall(null, pushNotificationData)
                                    },
                                    function (pushNotificationData, nextCall) {
                                        pn.fcm(pushNotificationData, function (err, Success) {
                                            let notificationData = {
                                                title: pushNotificationData.data.title,
                                                note: pushNotificationData.data.body,
                                                receiver_type: 'driver',
                                                driverId: driver._id
                                            }
                                            let Notification = new NotificationSchema(notificationData);
                                            Notification.save((err, notification) => {
                                                if (err) {
                                                    return nextCall({
                                                        "message": message.SOMETHING_WENT_WRONG,
                                                    });
                                                }
                                                nextCall(null, null)
                                            })
                                        })
                                    }
                                ],
                                    function (err, response) {
                                        if (err) {
                                            nextCall({ message: err })
                                        }
                                        else {
                                            nextDriver(null)
                                        }
                                    })

                                // var badgeCountResponse = _self.badgeCount(driver._id, isDriver = true)
                                // var badgeCount = badgeCountResponse.badgeCount ? badgeCountResponse.badgeCount + 1 : 0

                                // let pushNotificationData = {
                                //     to: (driver.deviceDetail && driver.deviceDetail.token) || '',
                                //     type: 'driver',
                                //     data: {
                                //         title: body.title,
                                //         type: 16,
                                //         body: body.message,
                                //         badge: badgeCount,
                                //         tag: 'System Notification',
                                //         data: {}
                                //     }
                                // }

                                // pn.fcm(pushNotificationData, function (err, Success) {
                                //     let notificationData = {
                                //         title: pushNotificationData.data.title,
                                //         note: pushNotificationData.data.body,
                                //         receiver_type: 'driver',
                                //         driverId: driver._id
                                //     }
                                //     let Notification = new NotificationSchema(notificationData);
                                //     Notification.save((err, notification) => {
                                //         if (err) {
                                //             return nextCall({
                                //                 "message": message.SOMETHING_WENT_WRONG,
                                //             });
                                //         }
                                //         nextDriver(null)
                                //     })
                                // })
                            }, function (err) {

                                var SEND_NOTIFICATION = log_message.ACTION.SEND_NOTIFICATION_TO_DRIVER
                                if (body.flag && body.flag == 'all') {
                                    SEND_NOTIFICATION = log_message.ACTION.SEND_NOTIFICATION_TO_ALL_DRIVER
                                }
                                _self.addActionLog(req.user, log_message.SECTION.NOTIFICATION, SEND_NOTIFICATION)
                                nextCall(null);
                            });
                        }
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.NOTIFICATION_ACTION_SUCC
            });
        })
    },

    sendNotificationToPassenger: function (req, res) {
        async.waterfall([
            /** check required paremeters */
            function (nextCall) {
                if (!req.body.flag && req.body.flag != 'all') {
                    req.checkBody('ids', message.PASSENGER_IDS_ARRAY_REQUIRED).notEmpty();
                }
                req.checkBody('title', message.TITLE_REQUIRED).notEmpty();
                req.checkBody('message', message.MESSAGE_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** admin a notification to passenger or selected passenger or all passenger */
            function (body, nextCall) {
                if (body.ids && typeof body.ids == "string") {
                    body.ids = JSON.parse(body.ids);
                }

                if (body.flag && body.flag == 'all') {
                    var matchObj = {
                        'isDeleted': false
                    };
                } else {
                    var matchObj = {
                        'isDeleted': false,
                        '_id': {
                            $in: body.ids
                        }
                    };
                }

                PassengerSchema.find(matchObj, {
                    '_id': 1,
                    'name': 1,
                    'email': 1,
                    'phoneNumber': 1,
                    'autoIncrementID': 1,
                    'deviceDetail': 1
                })
                    .exec(function (err, passengers) {
                        if (err) {
                            return nextCall({
                                "message": message.SOMETHING_WENT_WRONG
                            })
                        } else {
                            async.mapSeries(passengers, function (passenger, nextPassenger) {

                                async.waterfall([
                                    function (nextCall) {
                                        _self.badgeCount(passenger._id, isDriver = false, function (err, badgeCount) {
                                            if (err) {
                                                nextCall({ message: err })
                                            }
                                            else {
                                                badgeCount = badgeCount ? badgeCount + 1 : 0
                                                nextCall(null, badgeCount)
                                            }
                                        })
                                    },
                                    function (badgeCount, nextCall) {
                                        let pushNotificationData = {
                                            to: (passenger.deviceDetail && passenger.deviceDetail.token) || '',
                                            type: 'passenger',
                                            data: {
                                                title: body.title,
                                                type: 17,
                                                body: body.message,
                                                badge: badgeCount,
                                                tag: 'System Notification',
                                                data: {}
                                            }
                                        }
                                        nextCall(null, pushNotificationData)
                                    },
                                    function (pushNotificationData, nextCall) {
                                        pn.fcm(pushNotificationData, function (err, Success) {
                                            let notificationData = {
                                                title: pushNotificationData.data.title,
                                                note: pushNotificationData.data.body,
                                                receiver_type: 'passenger',
                                                passengerId: passenger._id
                                            }
                                            let Notification = new NotificationSchema(notificationData);
                                            Notification.save((err, notification) => {
                                                if (err) {
                                                    return nextCall({
                                                        "message": message.SOMETHING_WENT_WRONG,
                                                    });
                                                }
                                                nextCall(null, null)
                                            })
                                        })
                                    }
                                ],
                                    function (err, response) {
                                        if (err) {
                                            nextCall({ message: err })
                                        }
                                        else {
                                            nextPassenger(null)
                                        }
                                    })
                                // var badgeCountResponse = _self.badgeCount(passenger._id, isDriver = false)
                                // console.log("badgeCountResponse", badgeCountResponse)
                                // var badgeCount = badgeCountResponse.badgeCount ? badgeCountResponse.badgeCount + 1 : 0

                                // console.log("before", badgeCount)

                                // let pushNotificationData = {
                                //     to: (passenger.deviceDetail && passenger.deviceDetail.token) || '',
                                //     type: 'passenger',
                                //     data: {
                                //         title: body.title,
                                //         type: 17,
                                //         body: body.message,
                                //         badge: badgeCount,
                                //         tag: 'System Notification',
                                //         data: {}
                                //     }
                                // }

                                // console.log("after", badgeCount)

                                // pn.fcm(pushNotificationData, function (err, Success) {
                                //     let notificationData = {
                                //         title: pushNotificationData.data.title,
                                //         note: pushNotificationData.data.body,
                                //         receiver_type: 'passenger',
                                //         passengerId: passenger._id
                                //     }
                                //     let Notification = new NotificationSchema(notificationData);
                                //     Notification.save((err, notification) => {
                                //         if (err) {
                                //             return nextCall({
                                //                 "message": message.SOMETHING_WENT_WRONG,
                                //             });
                                //         }
                                //         nextPassenger(null)
                                //     })
                                // })
                            }, function (err) {
                                var SEND_NOTIFICATION = log_message.ACTION.SEND_NOTIFICATION_TO_PASSENGER
                                if (body.flag && body.flag == 'all') {
                                    SEND_NOTIFICATION = log_message.ACTION.SEND_NOTIFICATION_TO_ALL_PASSENGER
                                }
                                _self.addActionLog(req.user, log_message.SECTION.NOTIFICATION, SEND_NOTIFICATION)
                                nextCall(null);
                            });
                        }
                    });
            }
        ], function (err) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }
            return res.sendToEncode({
                status_code: 200,
                message: message.NOTIFICATION_ACTION_SUCC
            });
        })
    },

    /** CMS Module */
    updatePrivacyPolicyData: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('privacy_policy', message.PRIVACY_POLICY_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** insert privacyPolicy */
            function (body, nextCall) {
                CMSSchema.find({}).exec(function (err, cmsData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (cmsData[0]) {
                        let updateData = {
                            "privacyPolicy": body.privacy_policy
                        }
                        CMSSchema.findOneAndUpdate({}, {
                            $set: updateData
                        }, {
                                new: true
                            },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                _self.addActionLog(req.user, log_message.SECTION.ADMIN_SETTING, log_message.ACTION.UPDATE_PRIVACY_POLICY)
                                nextCall(null, updateData)
                            });
                    } else {
                        let cms = new CMSSchema(body);
                        cms.save(function (err, insertData) {
                            if (err) {
                                return nextCall({
                                    "message": message.OOPS_SOMETHING_WRONG
                                })
                            }
                            _self.addActionLog(req.user, log_message.SECTION.ADMIN_SETTING, log_message.ACTION.ADD_PRIVACY_POLICY)
                            nextCall(null, insertData)
                        });
                    }
                })
            }
        ], function (err, resopnseData) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.PRIVACY_POLICY_UPDATE_SUCC,
                data: resopnseData
            });
        });
    },

    updateTermAndConditionData: function (req, res) {
        async.waterfall([
            /** chek required parameters */
            function (nextCall) {
                req.checkBody('term_and_condition', message.TERM_AND_CONDITION_REQUIRED).notEmpty();
                var error = req.validationErrors();
                if (error && error.length) {
                    return nextCall({
                        message: error[0].msg
                    });
                }
                nextCall(null, req.body);
            },
            /** insert term and condition */
            function (body, nextCall) {
                CMSSchema.find({}).exec(function (err, cmsData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (cmsData[0]) {
                        let updateData = {
                            "termAndCondition": body.term_and_condition
                        }
                        CMSSchema.findOneAndUpdate({}, {
                            $set: updateData
                        }, {
                                new: true
                            },
                            function (err, updateData) {
                                if (err) {
                                    return nextCall({
                                        "message": message.SOMETHING_WENT_WRONG
                                    });
                                }
                                _self.addActionLog(req.user, log_message.SECTION.ADMIN_SETTING, log_message.ACTION.UPDATE_TERM_AND_CONDITION)
                                nextCall(null, updateData)
                            });
                    } else {
                        let cms = new CMSSchema(body);
                        cms.save(function (err, insertData) {
                            if (err) {
                                return nextCall({
                                    "message": message.OOPS_SOMETHING_WRONG
                                })
                            }
                            _self.addActionLog(req.user, log_message.SECTION.ADMIN_SETTING, log_message.ACTION.ADD_TERM_AND_CONDITION)
                            nextCall(null, insertData)
                        });
                    }
                })
            }
        ], function (err, resopnseData) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.TERM_AND_CONDITION_UPDATE_SUCC,
                data: resopnseData
            });
        });
    },

    getCMSData: function (req, res) {
        async.waterfall([
            function (nextCall) {
                CMSSchema.find({}).exec(function (err, cmsData) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        });
                    }
                    if (cmsData[0]) {
                        nextCall(null, cmsData)

                    } else {
                        nextCall({
                            "message": "CMS data not found."
                        })
                    }
                })
            }
        ], function (err, resopnseData) {
            if (err) {
                return res.sendToEncode({
                    status: 400,
                    message: (err && err.message) || message.SOMETHING_WENT_WRONG
                });
            }

            return res.sendToEncode({
                status_code: 200,
                message: message.TERM_AND_CONDITION_UPDATE_SUCC,
                data: resopnseData
            });
        });
    },

    /** Logs Module */
    addActionLog: (reqUser, section, action) => {
        async.waterfall([
            function (nextCall) {
                let insertData = [];
                insertData.section = section;
                insertData.action = action;
                insertData.actionAt = DS.now();
                insertData.userType = reqUser.type;
                insertData.userName = reqUser.email;
                insertData.userId = mongoose.Types.ObjectId(reqUser._id);
                nextCall(null, insertData);
            },
            /** get emergency auto increment id */
            function (insertData, nextCall) {
                _self.getLogAutoIncrement(function (err, response) {
                    if (err) {
                        return nextCall({
                            "message": message.SOMETHING_WENT_WRONG
                        })
                    }
                    insertData.autoIncrementID = response.logAutoIncrement;
                    nextCall(null, insertData);
                });
            },
            /** register emergency */
            function (insertData, nextCall) {
                let actionLogs = new ActionLogsSchema(insertData);
                actionLogs.save(function (err, insertData) {
                    if (err) {
                        return nextCall({
                            "message": message.OOPS_SOMETHING_WRONG
                        })
                    }
                    nextCall(null)
                });
            }
        ], function (err, response) {
            // callback(null);
        })
    },

    ListOfAllActionLog: function (req, res) {
        var response = {
            "draw": req.body.draw,
            "recordsTotal": 0,
            "recordsFiltered": 0,
            "data": []
        };
        async.waterfall([
            function (nextCall) {
                var matchObj = {};
                var sort = {};
                if (req.body.order && req.body.order.length > 0) {
                    req.body.order = req.body.order[0];
                    sort[req.body.columns[req.body.order.column].data] = req.body.order.dir === 'asc' ? 1 : -1;
                }
                if (req.body.search && req.body.search.value) {
                    var search_value = req.body.search.value;
                    var regex = new RegExp(search_value, 'i');
                    var or = [{
                        'section': regex
                    }, {
                        'action': regex
                    }, {
                        'userType': regex
                    }, {
                        'userName': regex
                    }];
                    matchObj.$or = or;
                    if (req.body.search && req.body.search.value && !isNaN(req.body.search.value)) {
                        matchObj.$or = [{
                            'autoIncrementID': Number(req.body.search.value)
                        }]
                    }
                }
                nextCall(null, matchObj, sort);
            },
            function (matchObj, sort, nextCall) {
                ActionLogsSchema.count(matchObj, function (err, count) {
                    if (err) {
                        return nextCall({
                            code: 400,
                            status: 0,
                            message: message.NO_DATA_FOUND
                        });
                    }
                    response.recordsTotal = count;
                    response.recordsFiltered = count
                    nextCall(null, matchObj, sort);
                });
            },
            function (matchObj, sort, nextCall) {
                ActionLogsSchema
                    .find(matchObj, {
                        '_id': 1,
                        'section': 1,
                        'action': 1,
                        'userType': 1,
                        'userName': 1,
                        'autoIncrementID': 1,
                        'actionAt': 1,
                        'createdAt': 1
                    }, {
                            limit: Number(req.body.length),
                            skip: Number(req.body.start)
                        })
                    .sort(sort)
                    .lean()
                    .exec(function (err, actionLogs) {
                        if (err) {
                            return nextCall({
                                "error": err,
                                "status_code": 0,
                                "message": message.SOMETHING_WENT_WRONG,
                                error: err
                            });
                        } else if (actionLogs.length > 0) {
                            response.data = actionLogs;
                            nextCall();
                        } else {
                            nextCall();
                        }
                    });
            },
        ], function (err) {
            if (err) {
                return res.sendToEncode(err);
            }
            res.sendToEncode(response);
        });
    },

    badgeCount: function (id, isDriver, callback) {
        var matchObj = {}
        var response = {}
        if (isDriver) {
            matchObj = {
                driverId: id,
                isRead: false
            }
        }
        else {
            matchObj = {
                passengerId: id,
                isRead: false
            }
        }
        NotificationSchema.count(matchObj).exec(function (err, result) {
            if (err) {
                return callback({ err: err })
            }
            else {
                return callback(null, result)
            }
        })
        return response
    }
};
module.exports = _self;