var express = require('express');
var router = express.Router();
var async = require('async');
var message = require('../config/messages/en');
const { OperationHelper } = require('apac');
var nodeTelegramBotApi = require("node-telegram-bot-api");
let request = require("request");
var config = require('../config/global');
var connection = require('../config/connection');
const BitlyClient = require('bitly').BitlyClient;
const bitly = new BitlyClient('6050528e1d5594c2b447fe6b403f047c5f8e5dd6');
var tall = require('tall').default;

const axios = require('axios');
var textVersion = require("textversionjs");
const cheerio = require('cheerio')
var _ = require('underscore');
const opHelper = new OperationHelper({
  'awsId': 'AKIAJLFL6KDKK2CQOM3A',
  'awsSecret': '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',
  'assocId': 'kudrati-21',
  'locale': 'IN'
});
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


/**
     * Authentication apis
     */
router.post('/login', function (req, res) {
  async.waterfall([
    function (nextCall) {
      let sql = 'SELECT * FROM login WHERE email = ? AND password = ?';
      connection.query(sql, [req.body.email, req.body.password], function (err, rides) {
        if (err) {
          return nextCall({
            "message": "something went wrong",
          });
        } else if (rides.length > 0) {
          nextCall(null, rides[0]);
        } else {
          return nextCall({
            "message": "something went wrong",
          });
        }
      })
    }
  ], function (err, response) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send({
      status: 200,
      message: "Login sucessfully",
      user: response
    });
  });
});

router.post('/addAllInOneData', function (req, res) {
  async.waterfall([
    function (nextCall) {
      values =   [ [
                   req.body.storeIcon,
                   req.body.sNLink,
                   req.body.sALink,
                   req.body.storeN,
                   req.body.isAffiliated,
                   req.body.storeID,
                ] ]
      let sqlss = "INSERT INTO all_in_one (storeIcon,sNLink,sALink,storeN,isAffiliated,storeID) VALUES ?";
      connection.query(sqlss, [values], function (err, rides) {
        if (err) {
          return nextCall({
            "message": "something went wrong",
          });
        }
        nextCall(null, rides[0]);
      })
    }
  ], function (err, response) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send({
      status: 200,
      message: "add post create sucessfully",
      data: response
    });
  });
});

router.post('/addtokenData', function (req, res) {
  async.waterfall([
    function (nextCall) {
      values =   [ [
                   req.body.sNLink
                ] ]
      let sqlss = "INSERT INTO bitly_token (token) VALUES ?";
      connection.query(sqlss, [values], function (err, rides) {
        if (err) {
          return nextCall({
            "message": "something went wrong",
          });
        }
        nextCall(null, rides);
      })
    }
  ], function (err, response) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send({
      status: 200,
      message: "add token sucessfully",
      data: response
    });
  });
});

router.post('/editAllInOneData', function (req, res) {
  async.waterfall([
    function (nextCall) {
      values =  [
                   req.body.storeIcon,
                   req.body.sNLink,
                   req.body.sALink,
                   req.body.storeN,
                   req.body.isAffiliated,
                   req.body.storeID,
                   req.body.id,
                ]
      var sqlss = "UPDATE all_in_one set storeIcon =? , sNLink =? ,sALink =? , storeN =?,isAffiliated =? , storeID =?  WHERE id = ?";
      connection.query(sqlss, values, function (err, rides) {
        if (err) {
          return nextCall({
            "message": "something went wrong",
          });
        }
        nextCall(null, rides[0]);
      })
    }
  ], function (err, response) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send({
      status: 200,
      message: "Edit post create sucessfully",
      data: response
    });
  });
});

router.post('/editpostFlags', function (req, res) {
  async.waterfall([
    function (nextCall) {
      values =  [
                   req.body.tele_flag,
                   req.body.watts_flag,
                ]
      var sqlss = "UPDATE post_flags set tele_flag =? , watts_flag =?  WHERE id = 1";
      connection.query(sqlss, values, function (err, rides) {
        if (err) {
          return nextCall({
            "message": "something went wrong",
          });
        }
        nextCall(null, rides[0]);
      })
    }
  ], function (err, response) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send({
      status: 200,
      message: "Edit post flag update sucessfully",
      data: response
    });
  });
});

router.get('/singlepostFlags', function (req, res) {
  async.waterfall([
    function (nextCall) {
      var sqlss = " SELECT * FROM post_flags WHERE id = 1";
      connection.query(sqlss, function (err, rides) {
        if (err) {
          return nextCall({
            "message": "something went wrong",
          });
        }
        nextCall(null, rides[0]);
      })
    }
  ], function (err, response) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send({
      status: 200,
      message: "Single recored sucessfully",
      data: response
    });
  });
});

router.post('/automation_posts', function (req, res, next) {
  async.waterfall([
    function (nextCall) {
      console.log('req.body.convertText: ', req.body.convertText);

              let final =[];
              let array = req.body.convertText.split("\n");
              console.log('array: ', array);
               for (let j = 0; j < array.length; j++) {
                 if(array[j].match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)/g)){
                   let xzhxzh;
                     if(array[j].match(/amazon.in/g)){
                      xzhxzh = array[j].replace(/[[\]]/g,'').replace(/ /g, '@')
                     }else{
                     xzhxzh = array[j]
                     }
                   let urls = xzhxzh.match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)/g)
                      tall(urls[0], {
                       method: 'HEAD',
                       maxRedirect: 5
                     }).then(function(unshortenedUrl){ 
                       console.log('unshortenedUrl: ', unshortenedUrl);
                     if(unshortenedUrl.match(/amazon.in/g)){
                       let tagnot;
                       if(unshortenedUrl.match(/earnkaro/g)){
                         let finalLink =unshortenedUrl.split('dl=');
                          if(urlencode(finalLink[1]).match(/[?]/g)){
                           tagnot= urlencode(finalLink[1]).concat('&tag=kudrats-21');
                         }else{
                           tagnot= urlencode(finalLink[1]).concat('?tag=kudrats-21');
                         }
                          function urlencode(str) {
                           return str.replace(/%21/g,'!').replace(/%20/g,' ').replace(/%22/g,'"').replace(/%26/g,'&')
                             .replace(/%27/g,'\'').replace(/%3A/g,':').replace(/%2F/g,'/').replace(/%3D/g,'=')
                             .replace(/%28/g,'(').replace(/%3F/g,'?').replace(/%29/g,')').replace(/%2A/g,'*')
                             .replace(/%20/g, '+');
                         }
                       console.log('tagnot: ', tagnot);
 
                         } else if(unshortenedUrl.match(/tag/g)){
                     let finalLink =unshortenedUrl.split('&');
                     for (let h = 0; h < finalLink.length; h++) {
                         if(finalLink[h].match(/^tag/g)){
                         finalLink[h] = 'tag=kudrats-21'
                       }
                     }
                      tagnot= finalLink.join('&').replace(/@/g, '');
                     }else{
                      tagnot= unshortenedUrl.replace(/@/g, '').concat('&tag=kudrats-21');
                     }
                    example(tagnot);
                         async function example(dddd) {
                           let response =await bitly.shorten(dddd);
                         final[j] = array[j].replace(urls[0].replace(/@/g, ' ').trim(),response.link).replace(/.#x...../g,' %E2%99%A8 ').replace(/&/g, 'and').replace(/;/g, ' ');
                         console.log('final[j]2: ', final[j]);
                       }
                     }else{
                       tall(unshortenedUrl, {
                         method: 'HEAD',
                         maxRedirect: 5
                       }).then(function(unshortenedUrl){ 
                       if(unshortenedUrl.match(/amazon.in/g)){
                         let tagnot;
                         if(unshortenedUrl.match(/tag/g)){
                       let finalLink =unshortenedUrl.split('&');
                       for (let h = 0; h < finalLink.length; h++) {
                           if(finalLink[h].match(/^tag/g)){
                           finalLink[h] = 'tag=kudrats-21'
                         }
                       }
                        tagnot= finalLink.join('&').replace(/@/g, '');
                       }else{
                        tagnot= unshortenedUrl.replace(/@/g, '').concat('&tag=kudrats-21');
                       }
                      example(tagnot);
                           async function example(dddd) {
                             let response =await bitly.shorten(dddd);
                           final[j] = array[j].replace(urls[0].replace(/@/g, ' ').trim(),response.link).replace(/.#x...../g,' %E2%99%A8 ').replace(/&/g, 'and').replace(/;/g, ' ');
                           console.log('final[j]2: ', final[j]);
                         }
                       }else{
                         final[j] = ' ';
                       }
                     })
                     .catch(function(err){ console.error('AAAW 👻', err)})
                     }
                       })
                       .catch(function(err){ console.error('AAAW 👻', err)})
                 }else{
                   final[j] = array[j].replace(/.#x...../g,' %E2%99%A8 ').trim().replace(/[[\]]/g,'').replace(/&/g, 'and').replace(/;/g, ' ').replace(/^\s+|\s+$|\s+(?=\s)/g, '');
                 }
               }
               setTimeout(()=>{
                 let finalAmazon = final.join('\n');
                 console.log('finalAmazon: ', finalAmazon);
               if(finalAmazon.match(/amzn.to/g)){
              nextCall(null, finalAmazon);
             }
               },Math.ceil(array.length/3)*4000);
            }
    ], function (err, response) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send({
      status_code: 200,
      message: "telegrame post create sucessfully",
      data: response
    });
  })
})

router.get('/singleAllInOneData/:id', function (req, res) {
  async.waterfall([
    function (nextCall) {
      var sqlss = " SELECT * FROM all_in_one WHERE id =" + req.params.id;
      connection.query(sqlss, function (err, rides) {
        if (err) {
          return nextCall({
            "message": "something went wrong",
          });
        }
        nextCall(null, rides[0]);
      })
    }
  ], function (err, response) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send({
      status: 200,
      message: "Single recored sucessfully",
      data: response
    });
  });
});

router.get('/singleBitlyData', function (req, res) {
  async.waterfall([
    function (nextCall) {
      var sqlss = " SELECT * FROM bitly_token";
      connection.query(sqlss, function (err, rides) {
        console.log('rides: ', _.last(rides));
        if (err) {
          return nextCall({
            "message": "something went wrong",
          });
        }
        nextCall(null, _.last(rides));
      })
    }
  ], function (err, response) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send({
      status: 200,
      message: "Single recored sucessfully",
      data: response
    });
  });
});

router.delete('/deleteAllInOneData/:id', function (req, res) {
  async.waterfall([
    function (nextCall) {
      var sqlss = " DELETE FROM all_in_one WHERE id =" + req.params.id;
      connection.query(sqlss, function (err, rides) {
        if (err) {
          return nextCall({
            "message": "something went wrong",
          });
        }
        nextCall(null, rides[0]);
      })
    }
  ], function (err, response) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send({
      status: 200,
      message: "deleted recored sucessfully",
      data: response
    });
  });
});

router.post('/getAllInOneData', function (req, res) {
  var response = {
    "draw": req.body.draw || 0,
    "recordsTotal": 0,
    "recordsFiltered": 0,
    "data": []
  };
  async.waterfall([
    function (nextCall) {
      var sql = "Select count(*) as TotalCount from ??";
      connection.query(sql, ['all_in_one'], function (err, rides) {
        if (err) {
          console.log('11');
          return nextCall({
            "message": "something went wrong",
          });
        }
        response.recordsTotal = rides[0].TotalCount;
        response.recordsFiltered = rides[0].TotalCount
        nextCall(null, rides[0].TotalCount);
      })
    }, function (counts, nextCall) {
      startNum = parseInt(req.body.start) || 0;
      LimitNum = parseInt(req.body.length) || 10;
      var query = "Select * from ?? WHERE " + req.body.columns[req.body.order[0].column].data + " LIKE '%" + req.body.search.value + "%' ORDER BY " + req.body.columns[req.body.order[0].column].data + ' ' + req.body.order[0].dir + " limit ? OFFSET ?";
      connection.query(query, ["all_in_one", LimitNum, startNum], function (err, ridess) {
        if (err) {
          return nextCall({
            "message": "something went wrong",
          });
        } else if (ridess.length > 0) {
          response.data = ridess;
          nextCall();
        } else {
          return nextCall({
            "message": "something went wrong",
          });
        }
      })
    }
  ], function (err) {
    if (err) {
      return res.send({
        status: err.code ? err.code : 400,
        message: (err && err.msg) || "someyhing went wrong"
      });
    }
    return res.send(response);
  });
});


module.exports = router;
