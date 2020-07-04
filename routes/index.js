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
var isLoggedInPolicie = require('../policies/isLoggedIn.js');
var isUserAuthenticatedPolicy = require('../policies/isUserAuthenticated.js');
var jwt = require('jsonwebtoken');


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
        console.log('rides: ', rides);
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
    },
    function (admin, nextCall) {
      var jwtData = {
          id: admin.id,
          email: admin.email
      };
      // create a token
      admin.auth_token = jwt.sign(jwtData, config.secret, {
          expiresIn: 3600 * 1 // expires in 24 hours
      });
      console.log('admin: ', admin);
      // delete admin.password;
      nextCall(null, admin);
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

router.post('/register', function (req, res) {
  async.waterfall([
    function (nextCall) {
      let sql = 'SELECT COUNT(*) as cnt FROM login WHERE login.email ="' + req.body.email +'"';
          connection.query(sql, function (err, rides) {
            if (err) {
              return nextCall({
                "message": "something went wrong",
              });
            }
            else if (rides[0].cnt == 0) {
              nextCall(null, rides[0].cnt);
            } else {
              return nextCall({
                "message": "User is alerady Register",
              });
            }
          })
        },function (admin,nextCall) {
           values =   [ [
                   req.body.Username,
                   req.body.email,
                   req.body.Phonenumber,
                   req.body.password,
                   "Pendding",
                   " ",
                   " "
                ] ]

      let sqlss = "INSERT INTO login (username,email,phonenubmer,password,status,auth_token,tag_id) VALUES ?";
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
      message: "user register sucessfully now wait account conformation.",
      data: response
    });
  });
});

router.all('/api/*', isUserAuthenticatedPolicy, isLoggedInPolicie);

router.get('/api/allinoneappsss', function (req, res, next) {
  async.waterfall([
    function (nextCall) {

    values = [
      [
        "Amazon Offer Alert - 1",
        "916353594230-1570365608@g.us"
      ],
      [
        "Amazon Offer Alert - 2",
        "916353594230-1570379159@g.us"
      ],
      [
        "Amazon Offer Alert - 3",
        "916353594230-1570969831@g.us"
      ],
      [
        "Amazon Offer Alert - 4",
        "916353594230-1570971252@g.us"
      ],
      [
        "Amazon Offer Alert -5",
        "916353594230-1571493437@g.us"
      ],
      [
        "Amazon Offer Alert - 6",
        "916353594230-1571491746@g.us"
      ],
      [
        "Amazon Offer Alert - 7",
        "916353594230-1571491944@g.us"
      ],
      [
        "Amazon Offer Alert - 8",
        "916353594230-1571493106@g.us"
      ],
      [
        "Amazon Offer Alert - 9",
        "916353594230-1571493284@g.us"
      ],
      [
        "Amazon Offer Alert -10",
        "916353594230-1574959445@g.us"
      ],
      [
        "Amazon Offer Alert - 11",
        "916353594230-1574959195@g.us"
      ],
      [
        "Amazon Offer Alert - 12",
        "918160515625-1584094851@g.us"
      ],
      [
        "Amazon Offer Alert - 13",
        "916353594230-1584971104@g.us"
      ],
      [
        "Amazon Offer Alert - 14",
        "916353594230-1584971346@g.us"
      ],
      [
        "Amazon Offer Alert -15",
        "916353594230-1584971429@g.us"
      ],
      [
        "Amazon Offer Alert - 16",
        "916353594230-1584971505@g.us"
      ],
      [
        "Amazon Offer Alert - 17",
        "916353594230-1584971569@g.us"
      ],
      [
        "Amazon Offer Alert - 18",
        "916353594230-1584971645@g.us"
      ],
      [
        "Amazon Offer Alert - 19",
        "916353594230-1584971700@g.us"
      ],
      [
        "Amazon Offer Alert -20",
        "916353594230-1584971760@g.us"
      ],
      [
        "Amazon Offer Alert - 21",
        "916353594230-1585500064@g.us"
      ],
      [
        "Amazon Offer Alert - 22",
        "916353594230-1585500152@g.us"
      ],
      [
        "Amazon Offer Alert - 23",
        "916353594230-1585500294@g.us"
      ],
      [
        "Amazon Offer Alert - 24",
        "916353594230-1585500401@g.us"
      ]
  ]
   
      
    let sqlss = "INSERT INTO watts_group_list (name,watts_id) VALUES ?";
              console.log('sqlss: ', sqlss);
              connection.query(sqlss,[values], function (err, rides) {
                if (err) {
                  return nextCall({
                    "message": "something went wrong",
                  });
                }
        nextCall(null,rides);
              })
    },
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
});


router.post('/api/addAllInOneData', function (req, res) {
  async.waterfall([
    function (nextCall) {
      values =   [ [
                  //  req.body.storeIcon,
                   req.body.sNLink,
                   req.body.sALink,
                   req.body.storeN,
                   req.body.isAffiliated,
                   req.body.storeID,
                ] ]
      let sqlss = "INSERT INTO diff_net_posts (short_url,Landing_Page,Brand,active_flag,domain_url) VALUES ?";
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

router.post('/api/addtokenData', function (req, res) {
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

router.post('/api/editAllInOneData', function (req, res) {
  async.waterfall([
    function (nextCall) {
      values =  [
                  //  req.body.storeIcon,
                   req.body.sNLink,
                   req.body.sALink,
                   req.body.storeN,
                   req.body.isAffiliated,
                   req.body.storeID,
                   req.body.id,
                ]
      var sqlss = "UPDATE diff_net_posts set short_url =? ,Landing_Page =? , Brand =?,active_flag =? , domain_url =?  WHERE id = ?";
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

router.post('/api/editpostFlags', function (req, res) {
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

router.get('/api/singlepostFlags', function (req, res) {
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

function urlencode(str) {
  return str.replace(/%21/g,'!').replace(/%20/g,' ').replace(/%22/g,'"').replace(/%26/g,'&')
    .replace(/%27/g,'\'').replace(/%3A/g,':').replace(/%2F/g,'/api/').replace(/%3D/g,'=')
    .replace(/%28/g,'(').replace(/%3F/g,'?').replace(/%29/g,')').replace(/%2A/g,'*')
    .replace(/%20/g, '+');
}
// router.post('/api/automation_posts', function (req, res, next) {
//   async.waterfall([
//     function (nextCall) {
//               let final =[];
//               let array = req.body.convertText.split("\n");
//                for (let j = 0; j < array.length; j++) {
//                 if(array[j].match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)/g)){
//                   let xzhxzh;
//                     if(array[j].match(/amazon.in/g)){
//                      xzhxzh = array[j].replace(/[[\]]/g,'').replace(/ /g, '@')
//                     }else{
//                     xzhxzh = array[j]
//                     }
//                   let urls = xzhxzh.match(/(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)/g)
//                      tall(urls[0], {
//                       method: 'HEAD',
//                       maxRedirect: 5
//                     }).then(function(unshortenedUrl){ 
//                       console.log('unshortenedUrl--1: ', unshortenedUrl);
//                     if(unshortenedUrl.match(/amazon.in/g)){
//                       console.log('unshortenedUrl--2: ', unshortenedUrl);
//                       let tagnot;
//                       if(unshortenedUrl.match(/earnkaro/g)){
//                         let finalLink =unshortenedUrl.split('dl=');
//                          if(urlencode(finalLink[1]).match(/[?]/g)){
//                           tagnot= urlencode(finalLink[1]).concat('&tag='+req.body.postTagId);
//                         }else{
//                           tagnot= urlencode(finalLink[1]).concat('?tag='+req.body.postTagId);
//                         }
//                       }else if(unshortenedUrl.match(/paisawapas/g)){
//                           let finalLink =unshortenedUrl.split('url=');
//                            if(urlencode(finalLink[1]).match(/[?]/g)){
//                             tagnot= urlencode(finalLink[1]).concat('&tag='+req.body.postTagId);
//                           }else{
//                             tagnot= urlencode(finalLink[1]).concat('?tag='+req.body.postTagId);
//                           }
//                         } else if(unshortenedUrl.match(/tag/g)){
//                     let finalLink =unshortenedUrl.split('&');
//                     for (let h = 0; h < finalLink.length; h++) {
//                       if(finalLink[h].match(/[?]/g)){
//                         if(finalLink[h].match(/tag/g)){
//                           let finalLinkssd =finalLink[h].split('?');
//                           finalLink[h] = finalLinkssd[0].concat('?tag='+req.body.postTagId)
//                         }
//                       }else if(finalLink[h].match(/^ascsubtag/g)){
//                         finalLink[h] = 'demoyou'
//                       }else if(finalLink[h].match(/^ascsub/g)){
//                         finalLink[h] = 'demoyou'
//                       }else if(finalLink[h].match(/^tag/g)){
//                         finalLink[h] = 'tag='+req.body.postTagId
//                       }
//                     }
//                      tagnot= finalLink.join('&').replace(/@/g, '');
//                     }else{
//                      tagnot= unshortenedUrl.replace(/@/g, '').concat('&tag='+req.body.postTagId);
//                     }
//                    example(tagnot.replace(/&demoyou/g, ''));
//                         async function example(dddd) {
//                           let response =await bitly.shorten(dddd);
//                         final[j] = array[j].replace(urls[0].replace(/@/g, ' ').trim(),response.link).replace(/.#x...../g,' %E2%99%A8 ').concat("\n").replace(/&/g, 'and').replace(/;/g, ' ');
//                         console.log('final[j]2: ', final[j]);
//                       }
//                     }else{
//                       tall(unshortenedUrl, {
//                         method: 'HEAD',
//                         maxRedirect: 5
//                       }).then(function(unshortenedUrl){ 
//                         console.log('unshortenedUrl: ', unshortenedUrl);
                    
//                       if(unshortenedUrl.match(/amazon.in/g)){
//                         let tagnot;
//                         if(unshortenedUrl.match(/tag/g)){
//                       let finalLink =unshortenedUrl.split('&');
//                      for (let h = 0; h < finalLink.length; h++) {
//                       if(finalLink[h].match(/[?]/g)){
//                         if(finalLink[h].match(/tag/g)){
//                           let finalLinkssd =finalLink[h].split('?');
//                           finalLink[h] = finalLinkssd[0].concat('?tag='+req.body.postTagId)
//                         }
//                       }else if(finalLink[h].match(/^ascsubtag/g)){
//                         finalLink[h] = 'demoyou'
//                       }else if(finalLink[h].match(/^ascsub/g)){
//                         finalLink[h] = 'demoyou'
//                       }else if(finalLink[h].match(/^tag/g)){
//                         finalLink[h] = 'tag='+req.body.postTagId
//                       }
//                     }
//                      tagnot= finalLink.join('&').replace(/@/g, '');
//                     }else{
//                      tagnot= unshortenedUrl.replace(/@/g, '').concat('&tag='+req.body.postTagId);
//                     }
//                    example(tagnot.replace(/&demoyou/g, ''));
//                           async function example(dddd) {
//                             let response =await bitly.shorten(dddd);
//                           final[j] = array[j].replace(urls[0].replace(/@/g, ' ').trim(),response.link).replace(/.#x...../g,' %E2%99%A8 ').concat("\n").replace(/&/g, 'and').replace(/;/g, ' ');
//                           console.log('final[j]2: ', final[j]);
//                         }
//                       }else{
//                         // let finalLink =unshortenedUrl.split('?');
//                         // final[j] = array[j].replace("["+urls[0].replace(/@/g, ' ').trim()+"]",finalLink[0]).replace(/.#x...../g,' %E2%99%A8 ').replace(/&/g, 'and').replace(/;/g, ' ');
//                         final[j] = ' ';
//                       }
//                     })
//                     .catch(function(err){ console.error('AAAW 👻', err)})
//                     }
//                       })
//                       .catch(function(err){ console.error('AAAW 👻', err)})
//                 }else{
//                   final[j] = array[j].replace(/&#xA0;/g,' ').replace(/.#x...../g,' %E2%99%A8 ').replace(/[[\]]/g,'').replace(/&/g, 'and').replace(/;/g, ' ').replace(/#/g, '').replace(/^\s+|\s+$|\s+(?=\s)/g, '');
//                 }
//               }
//                setTimeout(()=>{
//                  let finalAmazon = final.join('\n');
//                  console.log('finalAmazon: ', finalAmazon);
//                if(finalAmazon.match(/amzn.to/g)){
//               nextCall(null, urlencodedd(finalAmazon));
//              }
//                },Math.ceil(array.length/2)*6000);
//             }
//     ], function (err, response) {
//     if (err) {
//       return res.send({
//         status: err.code ? err.code : 400,
//         message: (err && err.msg) || "someyhing went wrong"
//       });
//     }
//     return res.send({
//       status_code: 200,
//       message: "telegrame post create sucessfully",
//       data: response
//     });
//   })
// })

router.post('/api/automation_posts', function (req, res, next) {
  async.waterfall([
    function (nextCall) {
            let sqlsss = "SELECT * FROM post_flags";
            connection.query(sqlsss, function (err, flagData) {
              if (err) {
                console.log('err: ', err);
              }
              let ListflagData = flagData[0];
                 let finalAmazon = req.body.convertText;
                 let finalPostList = JSON.parse(ListflagData.all_tele_group).telenogroup;
                 for (let l = 0; l < finalPostList.length; l++) {
                    teleAutoPostChannel(finalAmazon,req.body.postImg,finalPostList[l].groupname,ListflagData.kudart_token);
                }
              nextCall(null, urlencodedd(finalAmazon));
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
      status_code: 200,
      message: "telegrame post create sucessfully",
      data: response
    });
  })
})

function teleAutoPostChannel(finalAmazon,img,chanelName,token){
  var chatId = chanelName; // <= replace with yours
  bot = new nodeTelegramBotApi(token);
  bot.sendPhoto(chatId, img, {
    caption: finalAmazon,
    disable_web_page_preview: true
  });
}


function urlencodedd(str) {
  return str.replace(/%E2%82%B9/g,' ₹').replace(/%E2%9A%9C/g,' ⚜').replace(/%F0%9F%8E%B8/g,' 🤝').replace(/%F0%9F%82%A0/g,' 🂠').replace(/%F0%9F%82%A1/g,' 🂡').replace(/%F0%9F%82%A2/g,' 🂢').replace(/%F0%9F%82%A3/g,' 🂣').replace(/%F0%9F%82%A4/g,' 🂤').replace(/%F0%9F%82%A5/g,' 🂥').replace(/%F0%9F%82%A6/g,' 🂦').replace(/%F0%9F%82%A7/g,' 🂧').replace(/%F0%9F%82%A8/g,' 🂨').replace(/%F0%9F%82%A9/g,' 🂩').replace(/%F0%9F%82%AA/g,' 🂪').replace(/%F0%9F%82%AB/g,' 🂫').replace(/%F0%9F%82%AC/g,' 🂬').replace(/%F0%9F%82%AD/g,' 🂭').replace(/%F0%9F%82%AE/g,' 🂮').replace(/%F0%9F%82%B1/g,' 🂱').replace(/%F0%9F%82%B2/g,' 🂲').replace(/%F0%9F%82%B3/g,' 🂳').replace(/%F0%9F%82%B4/g,' 🂴').replace(/%F0%9F%82%B5/g,' 🂵').replace(/%F0%9F%82%B6/g,' 🂶').replace(/%F0%9F%82%B7/g,' 🂷').replace(/%F0%9F%82%B8/g,' 🂸').replace(/%F0%9F%82%B9/g,' 🂹').replace(/%F0%9F%82%BA/g,' 🂺').replace(/%F0%9F%82%BB/g,' 🂻').replace(/%F0%9F%82%BC/g,' 🂼').replace(/%F0%9F%82%BD/g,' 🂽').replace(/%F0%9F%82%BE/g,' 🂾').replace(/%F0%9F%83%81/g,' 🃁').replace(/%F0%9F%83%82/g,' 🃂').replace(/%F0%9F%83%83/g,' 🃃').replace(/%F0%9F%83%84/g,' 🃄').replace(/%F0%9F%83%85/g,' 🃅').replace(/%F0%9F%83%86/g,' 🃆').replace(/%F0%9F%83%87/g,' 🃇').replace(/%F0%9F%83%88/g,' 🃈').replace(/%F0%9F%83%89/g,' 🃉').replace(/%F0%9F%83%8A/g,' 🃊').replace(/%F0%9F%83%8B/g,' 🃋').replace(/%F0%9F%83%8C/g,' 🃌').replace(/%F0%9F%83%8D/g,' 🃍').replace(/%F0%9F%83%8E/g,' 🃎').replace(/%F0%9F%83%8F/g,' 🃏').replace(/%F0%9F%83%91/g,' 🃑').replace(/%F0%9F%83%92/g,' 🃒').replace(/%F0%9F%83%93/g,' 🃓').replace(/%F0%9F%83%94/g,' 🃔').replace(/%F0%9F%83%95/g,' 🃕').replace(/%F0%9F%83%96/g,' 🃖').replace(/%F0%9F%83%97/g,' 🃗')
  .replace(/%F0%9F%83%98/g,' 🃘').replace(/%F0%9F%83%99/g,' 🃙').replace(/%F0%9F%83%9A/g,' 🃚').replace(/%F0%9F%83%9B/g,' 🃛').replace(/%F0%9F%83%9C/g,' 🃜').replace(/%F0%9F%83%9D/g,' 🃝').replace(/%F0%9F%83%9E/g,' 🃞').replace(/%F0%9F%83%9F/g,' 🃟').replace(/%F0%9F%8C%80/g,' 🌀').replace(/%F0%9F%8C%81/g,' 🌁').replace(/%F0%9F%8C%82/g,' 🌂').replace(/%F0%9F%8C%83/g,' 🌃').replace(/%F0%9F%8C%84/g,' 🌄').replace(/%F0%9F%8C%85/g,' 🌅').replace(/%F0%9F%8C%86/g,' 🌆').replace(/%F0%9F%8C%87/g,' 🌇').replace(/%F0%9F%8C%88/g,' 🌈').replace(/%F0%9F%8C%89/g,' 🌉').replace(/%F0%9F%8C%8A/g,' 🌊').replace(/%F0%9F%8C%8B/g,' 🌋').replace(/%F0%9F%8C%8C/g,' 🌌').replace(/%F0%9F%8C%8D/g,' 🌍').replace(/%F0%9F%8C%8E/g,' 🌎').replace(/%F0%9F%8C%8F/g,' 🌏').replace(/%F0%9F%8C%90/g,' 🌐').replace(/%F0%9F%8C%91/g,' 🌑').replace(/%F0%9F%8C%92/g,' 🌒').replace(/%F0%9F%8C%93/g,' 🌓').replace(/%F0%9F%8C%94/g,' 🌔').replace(/%F0%9F%8C%95/g,' 🌕').replace(/%F0%9F%8C%96/g,' 🌖').replace(/%F0%9F%8C%97/g,' 🌗').replace(/%F0%9F%8C%98/g,' 🌘').replace(/%F0%9F%8C%99/g,' 🌙').replace(/%F0%9F%8C%9A/g,' 🌚').replace(/%F0%9F%8C%9B/g,' 🌛').replace(/%F0%9F%8C%9C/g,' 🌜').replace(/%F0%9F%8C%9D/g,' 🌝').replace(/%F0%9F%8C%9E/g,' 🌞').replace(/%F0%9F%8C%9F/g,' 🌟').replace(/%F0%9F%8C%A0/g,' 🌠').replace(/%F0%9F%8C%B0/g,' 🌰').replace(/%F0%9F%8C%B1/g,' 🌱').replace(/%F0%9F%8C%B2/g,' 🌲').replace(/%F0%9F%8C%B3/g,' 🌳').replace(/%F0%9F%8C%B4/g,' 🌴').replace(/%F0%9F%8C%B5/g,' 🌵').replace(/%F0%9F%8C%B7/g,' 🌷').replace(/%F0%9F%8C%B8/g,' 🌸').replace(/%F0%9F%8C%B9/g,' 🌹')
  .replace(/%F0%9F%8C%BA/g,' 🌺').replace(/%F0%9F%8C%BB/g,' 🌻').replace(/%F0%9F%8C%BC/g,' 🌼').replace(/%F0%9F%8C%BD/g,' 🌽').replace(/%F0%9F%8C%BE/g,' 🌾').replace(/%F0%9F%8C%BF/g,' 🌿').replace(/%F0%9F%8D%80/g,' 🍀').replace(/%F0%9F%8D%81/g,' 🍁').replace(/%F0%9F%8D%82/g,' 🍂').replace(/%F0%9F%8D%83/g,' 🍃').replace(/%F0%9F%8D%84/g,' 🍄').replace(/%F0%9F%8D%85/g,' 🍅').replace(/%F0%9F%8D%86/g,' 🍆').replace(/%F0%9F%8D%87/g,' 🍇').replace(/%F0%9F%8D%88/g,' 🍈').replace(/%F0%9F%8D%89/g,' 🍉').replace(/%F0%9F%8D%8A/g,' 🍊').replace(/%F0%9F%8D%8B/g,' 🍋').replace(/%F0%9F%8D%8C/g,' 🍌').replace(/%F0%9F%8D%8D/g,' 🍍').replace(/%F0%9F%8D%8E/g,' 🍎').replace(/%F0%9F%8D%8F/g,' 🍏').replace(/%F0%9F%8D%90/g,' 🍐').replace(/%F0%9F%8D%91/g,' 🍑').replace(/%F0%9F%8D%92/g,' 🍒').replace(/%F0%9F%8D%93/g,' 🍓').replace(/%F0%9F%8D%94/g,' 🍔').replace(/%F0%9F%8D%95/g,' 🍕').replace(/%F0%9F%8D%96/g,' 🍖').replace(/%F0%9F%8D%97/g,' 🍗').replace(/%F0%9F%8D%98/g,' 🍘').replace(/%F0%9F%8D%99/g,' 🍙').replace(/%F0%9F%8D%9A/g,' 🍚').replace(/%F0%9F%8D%9B/g,' 🍛').replace(/%F0%9F%8D%9C/g,' 🍜').replace(/%F0%9F%8D%9D/g,' 🍝').replace(/%F0%9F%8D%9E/g,' 🍞').replace(/%F0%9F%8D%9F/g,' 🍟').replace(/%F0%9F%8D%A0/g,' 🍠').replace(/%F0%9F%8D%A1/g,' 🍡').replace(/%F0%9F%8D%A2/g,' 🍢').replace(/%F0%9F%8D%A3/g,' 🍣').replace(/%F0%9F%8D%A4/g,' 🍤').replace(/%F0%9F%8D%A5/g,' 🍥').replace(/%F0%9F%8D%A6/g,' 🍦').replace(/%F0%9F%8D%A7/g,' 🍧').replace(/%F0%9F%8D%A8/g,' 🍨').replace(/%F0%9F%8D%A9/g,' 🍩').replace(/%F0%9F%8D%AA/g,' 🍪').replace(/%F0%9F%8D%AB/g,' 🍫')
  .replace(/%F0%9F%8D%AC/g,' 🍬').replace(/%F0%9F%8D%AD/g,' 🍭').replace(/%F0%9F%8D%AE/g,' 🍮').replace(/%F0%9F%8D%AF/g,' 🍯').replace(/%F0%9F%8D%B0/g,' 🍰').replace(/%F0%9F%8D%B1/g,' 🍱').replace(/%F0%9F%8D%B2/g,' 🍲').replace(/%F0%9F%8D%B3/g,' 🍳').replace(/%F0%9F%8D%B4/g,' 🍴').replace(/%F0%9F%8D%B5/g,' 🍵').replace(/%F0%9F%8D%B6/g,' 🍶').replace(/%F0%9F%8D%B7/g,' 🍷').replace(/%F0%9F%8D%B8/g,' 🍸').replace(/%F0%9F%8D%B9/g,' 🍹').replace(/%F0%9F%8D%BA/g,' 🍺').replace(/%F0%9F%8D%BB/g,' 🍻').replace(/%F0%9F%8D%BC/g,' 🍼').replace(/%F0%9F%8E%80/g,' 🎀').replace(/%F0%9F%8E%81/g,' 🎁').replace(/%F0%9F%8E%82/g,' 🎂').replace(/%F0%9F%8E%83/g,' 🎃').replace(/%F0%9F%8E%84/g,' 🎄').replace(/%F0%9F%8E%85/g,' 🎅').replace(/%F0%9F%8E%86/g,' 🎆').replace(/%F0%9F%8E%87/g,' 🎇').replace(/%F0%9F%8E%88/g,' 🎈').replace(/%F0%9F%8E%89/g,' 🎉').replace(/%F0%9F%8E%8A/g,' 🎊').replace(/%F0%9F%8E%8B/g,' 🎋').replace(/%F0%9F%8E%8C/g,' 🎌').replace(/%F0%9F%8E%8D/g,' 🎍').replace(/%F0%9F%8E%8E/g,' 🎎').replace(/%F0%9F%8E%8F/g,' 🎏').replace(/%F0%9F%8E%90/g,' 🎐').replace(/%F0%9F%8E%91/g,' 🎑').replace(/%F0%9F%8E%92/g,' 🎒').replace(/%F0%9F%8E%93/g,' 🎓').replace(/%F0%9F%8E%A0/g,' 🎠').replace(/%F0%9F%8E%A1/g,' 🎡').replace(/%F0%9F%8E%A2/g,' 🎢').replace(/%F0%9F%8E%A3/g,' 🎣').replace(/%F0%9F%8E%A4/g,' 🎤').replace(/%F0%9F%8E%A5/g,' 🎥').replace(/%F0%9F%8E%A6/g,' 🎦').replace(/%F0%9F%8E%A7/g,' 🎧').replace(/%F0%9F%8E%A8/g,' 🎨').replace(/%F0%9F%8E%A9/g,' 🎩').replace(/%F0%9F%8E%AA/g,' 🎪').replace(/%F0%9F%8E%AB/g,' 🎫').replace(/%F0%9F%8E%AC/g,' 🎬').replace(/%F0%9F%8E%AD/g,' 🎭')
  .replace(/%F0%9F%8E%AE/g,' 🎮').replace(/%F0%9F%8E%AF/g,' 🎯').replace(/%F0%9F%8E%B0/g,' 🎰').replace(/%F0%9F%8E%B1/g,' 🎱').replace(/%F0%9F%8E%B2/g,' 🎲').replace(/%F0%9F%8E%B3/g,' 🎳').replace(/%F0%9F%8E%B4/g,' 🎴').replace(/%F0%9F%8E%B5/g,' 🎵').replace(/%F0%9F%8E%B6/g,' 🎶').replace(/%F0%9F%8E%B7/g,' 🎷').replace(/%F0%9F%8E%B8/g,' 🎸').replace(/%F0%9F%8E%B9/g,' 🎹').replace(/%F0%9F%8E%BA/g,' 🎺').replace(/%F0%9F%8E%BB/g,' 🎻').replace(/%F0%9F%8E%BC/g,' 🎼').replace(/%F0%9F%8E%BD/g,' 🎽').replace(/%F0%9F%8E%BE/g,' 🎾').replace(/%F0%9F%8E%BF/g,' 🎿').replace(/%F0%9F%8F%80/g,' 🏀').replace(/%F0%9F%8F%81/g,' 🏁').replace(/%F0%9F%8F%82/g,' 🏂').replace(/%F0%9F%8F%83/g,' 🏃').replace(/%F0%9F%8F%84/g,' 🏄').replace(/%F0%9F%8F%86/g,' 🏆').replace(/%F0%9F%8F%87/g,' 🏇').replace(/%F0%9F%8F%88/g,' 🏈').replace(/%F0%9F%8F%89/g,' 🏉').replace(/%F0%9F%8F%8A/g,' 🏊').replace(/%F0%9F%8F%A0/g,' 🏠').replace(/%F0%9F%8F%A1/g,' 🏡').replace(/%F0%9F%8F%A2/g,' 🏢').replace(/%F0%9F%8F%A3/g,' 🏣').replace(/%F0%9F%8F%A4/g,' 🏤').replace(/%F0%9F%8F%A5/g,' 🏥').replace(/%F0%9F%8F%A6/g,' 🏦').replace(/%F0%9F%8F%A7/g,' 🏧').replace(/%F0%9F%8F%A8/g,' 🏨').replace(/%F0%9F%8F%A9/g,' 🏩').replace(/%F0%9F%8F%AA/g,' 🏪').replace(/%F0%9F%8F%AB/g,' 🏫').replace(/%F0%9F%8F%AC/g,' 🏬').replace(/%F0%9F%8F%AD/g,' 🏭').replace(/%F0%9F%8F%AE/g,' 🏮').replace(/%F0%9F%8F%AF/g,' 🏯').replace(/%F0%9F%8F%B0/g,' 🏰').replace(/%F0%9F%90%80/g,' 🐀').replace(/%F0%9F%90%81/g,' 🐁').replace(/%F0%9F%90%82/g,' 🐂').replace(/%F0%9F%90%83/g,' 🐃').replace(/%F0%9F%90%84/g,' 🐄').replace(/%F0%9F%90%85/g,' 🐅')
  .replace(/%F0%9F%90%86/g,' 🐆').replace(/%F0%9F%90%87/g,' 🐇').replace(/%F0%9F%90%88/g,' 🐈').replace(/%F0%9F%90%89/g,' 🐉').replace(/%F0%9F%90%8A/g,' 🐊').replace(/%F0%9F%90%8B/g,' 🐋').replace(/%F0%9F%90%8C/g,' 🐌').replace(/%F0%9F%90%8D/g,' 🐍').replace(/%F0%9F%90%8E/g,' 🐎').replace(/%F0%9F%90%8F/g,' 🐏').replace(/%F0%9F%90%90/g,' 🐐').replace(/%F0%9F%90%91/g,' 🐑').replace(/%F0%9F%90%92/g,' 🐒').replace(/%F0%9F%90%93/g,' 🐓').replace(/%F0%9F%90%94/g,' 🐔').replace(/%F0%9F%90%95/g,' 🐕').replace(/%F0%9F%90%96/g,' 🐖').replace(/%F0%9F%90%97/g,' 🐗').replace(/%F0%9F%90%98/g,' 🐘').replace(/%F0%9F%90%99/g,' 🐙').replace(/%F0%9F%90%9A/g,' 🐚').replace(/%F0%9F%90%9B/g,' 🐛').replace(/%F0%9F%90%9C/g,' 🐜').replace(/%F0%9F%90%9D/g,' 🐝').replace(/%F0%9F%90%9E/g,' 🐞').replace(/%F0%9F%90%9F/g,' 🐟').replace(/%F0%9F%90%A0/g,' 🐠').replace(/%F0%9F%90%A1/g,' 🐡').replace(/%F0%9F%90%A2/g,' 🐢').replace(/%F0%9F%90%A3/g,' 🐣').replace(/%F0%9F%90%A4/g,' 🐤').replace(/%F0%9F%90%A5/g,' 🐥').replace(/%F0%9F%90%A6/g,' 🐦').replace(/%F0%9F%90%A7/g,' 🐧').replace(/%F0%9F%90%A8/g,' 🐨').replace(/%F0%9F%90%A9/g,' 🐩').replace(/%F0%9F%90%AA/g,' 🐪').replace(/%F0%9F%90%AB/g,' 🐫').replace(/%F0%9F%90%AC/g,' 🐬').replace(/%F0%9F%90%AD/g,' 🐭').replace(/%F0%9F%90%AE/g,' 🐮').replace(/%F0%9F%90%AF/g,' 🐯').replace(/%F0%9F%90%B0/g,' 🐰').replace(/%F0%9F%90%B1/g,' 🐱').replace(/%F0%9F%90%B2/g,' 🐲').replace(/%F0%9F%90%B3/g,' 🐳').replace(/%F0%9F%90%B4/g,' 🐴').replace(/%F0%9F%90%B5/g,' 🐵').replace(/%F0%9F%90%B6/g,' 🐶').replace(/%F0%9F%90%B7/g,' 🐷').replace(/%F0%9F%90%B8/g,' 🐸')
  .replace(/%F0%9F%90%B9/g,' 🐹').replace(/%F0%9F%90%BA/g,' 🐺').replace(/%F0%9F%90%BB/g,' 🐻').replace(/%F0%9F%90%BC/g,' 🐼').replace(/%F0%9F%90%BD/g,' 🐽').replace(/%F0%9F%90%BE/g,' 🐾').replace(/%F0%9F%91%80/g,' 👀').replace(/%F0%9F%91%82/g,' 👂').replace(/%F0%9F%91%83/g,' 👃').replace(/%F0%9F%91%84/g,' 👄').replace(/%F0%9F%91%85/g,' 👅').replace(/%F0%9F%91%86/g,' 👆').replace(/%F0%9F%91%87/g,' 👇').replace(/%F0%9F%91%88/g,' 👈').replace(/%F0%9F%91%89/g,' 👉').replace(/%F0%9F%91%8A/g,' 👊').replace(/%F0%9F%91%8B/g,' 👋').replace(/%F0%9F%91%8C/g,' 👌').replace(/%F0%9F%91%8D/g,' 👍').replace(/%F0%9F%91%8E/g,' 👎').replace(/%F0%9F%91%8F/g,' 👏').replace(/%F0%9F%91%90/g,' 👐').replace(/%F0%9F%91%91/g,' 👑').replace(/%F0%9F%91%92/g,' 👒').replace(/%F0%9F%91%93/g,' 👓').replace(/%F0%9F%91%94/g,' 👔').replace(/%F0%9F%91%95/g,' 👕').replace(/%F0%9F%91%96/g,' 👖').replace(/%F0%9F%91%97/g,' 👗').replace(/%F0%9F%91%98/g,' 👘').replace(/%F0%9F%91%99/g,' 👙').replace(/%F0%9F%91%9A/g,' 👚').replace(/%F0%9F%91%9B/g,' 👛').replace(/%F0%9F%91%9C/g,' 👜').replace(/%F0%9F%91%9D/g,' 👝').replace(/%F0%9F%91%9E/g,' 👞').replace(/%F0%9F%91%9F/g,' 👟').replace(/%F0%9F%91%A0/g,' 👠').replace(/%F0%9F%91%A1/g,' 👡').replace(/%F0%9F%91%A2/g,' 👢').replace(/%F0%9F%91%A3/g,' 👣').replace(/%F0%9F%91%A4/g,' 👤').replace(/%F0%9F%91%A5/g,' 👥').replace(/%F0%9F%91%A6/g,' 👦').replace(/%F0%9F%91%A7/g,' 👧').replace(/%F0%9F%91%A8/g,' 👨').replace(/%F0%9F%91%A9/g,' 👩').replace(/%F0%9F%91%AA/g,' 👪').replace(/%F0%9F%91%AB/g,' 👫').replace(/%F0%9F%91%AC/g,' 👬').replace(/%F0%9F%91%AD/g,' 👭')
  .replace(/%F0%9F%91%AE/g,' 👮').replace(/%F0%9F%91%AF/g,' 👯').replace(/%F0%9F%91%B0/g,' 👰').replace(/%F0%9F%91%B1/g,' 👱').replace(/%F0%9F%91%B2/g,' 👲').replace(/%F0%9F%91%B3/g,' 👳').replace(/%F0%9F%91%B4/g,' 👴').replace(/%F0%9F%91%B5/g,' 👵').replace(/%F0%9F%91%B6/g,' 👶').replace(/%F0%9F%91%B7/g,' 👷').replace(/%F0%9F%91%B8/g,' 👸').replace(/%F0%9F%91%B9/g,' 👹').replace(/%F0%9F%91%BA/g,' 👺').replace(/%F0%9F%91%BB/g,' 👻').replace(/%F0%9F%91%BC/g,' 👼').replace(/%F0%9F%91%BD/g,' 👽').replace(/%F0%9F%91%BE/g,' 👾').replace(/%F0%9F%91%BF/g,' 👿').replace(/%F0%9F%92%80/g,' 💀').replace(/%F0%9F%92%81/g,' 💁').replace(/%F0%9F%92%82/g,' 💂').replace(/%F0%9F%92%83/g,' 💃').replace(/%F0%9F%92%84/g,' 💄').replace(/%F0%9F%92%85/g,' 💅').replace(/%F0%9F%92%86/g,' 💆').replace(/%F0%9F%92%87/g,' 💇').replace(/%F0%9F%92%88/g,' 💈').replace(/%F0%9F%92%89/g,' 💉').replace(/%F0%9F%92%8A/g,' 💊').replace(/%F0%9F%92%8B/g,' 💋').replace(/%F0%9F%92%8C/g,' 💌').replace(/%F0%9F%92%8D/g,' 💍').replace(/%F0%9F%92%8E/g,' 💎').replace(/%F0%9F%92%8F/g,' 💏').replace(/%F0%9F%92%90/g,' 💐').replace(/%F0%9F%92%91/g,' 💑').replace(/%F0%9F%92%92/g,' 💒').replace(/%F0%9F%92%93/g,' 💓').replace(/%F0%9F%92%94/g,' 💔').replace(/%F0%9F%92%95/g,' 💕').replace(/%F0%9F%92%96/g,' 💖').replace(/%F0%9F%92%97/g,' 💗').replace(/%F0%9F%92%98/g,' 💘').replace(/%F0%9F%92%99/g,' 💙').replace(/%F0%9F%92%9A/g,' 💚').replace(/%F0%9F%92%9B/g,' 💛').replace(/%F0%9F%92%9C/g,' 💜').replace(/%F0%9F%92%9D/g,' 💝').replace(/%F0%9F%92%9E/g,' 💞').replace(/%F0%9F%92%9F/g,' 💟').replace(/%F0%9F%92%A0/g,' 💠')
  .replace(/%F0%9F%92%A1/g,' 💡').replace(/%F0%9F%92%A2/g,' 💢').replace(/%F0%9F%92%A3/g,' 💣').replace(/%F0%9F%92%A4/g,' 💤').replace(/%F0%9F%92%A5/g,' 💥').replace(/%F0%9F%92%A6/g,' 💦').replace(/%F0%9F%92%A7/g,' 💧').replace(/%F0%9F%92%A8/g,' 💨').replace(/%F0%9F%92%A9/g,' 💩').replace(/%F0%9F%92%AA/g,' 💪').replace(/%F0%9F%92%AB/g,' 💫').replace(/%F0%9F%92%AC/g,' 💬').replace(/%F0%9F%92%AD/g,' 💭').replace(/%F0%9F%92%AE/g,' 💮').replace(/%F0%9F%92%AF/g,' 💯').replace(/%F0%9F%92%B0/g,' 💰').replace(/%F0%9F%92%B1/g,' 💱').replace(/%F0%9F%92%B2/g,' 💲').replace(/%F0%9F%92%B3/g,' 💳').replace(/%F0%9F%92%B4/g,' 💴').replace(/%F0%9F%92%B5/g,' 💵').replace(/%F0%9F%92%B6/g,' 💶').replace(/%F0%9F%92%B7/g,' 💷').replace(/%F0%9F%92%B8/g,' 💸').replace(/%F0%9F%92%B9/g,' 💹').replace(/%F0%9F%92%BA/g,' 💺').replace(/%F0%9F%92%BB/g,' 💻').replace(/%F0%9F%92%BC/g,' 💼').replace(/%F0%9F%92%BD/g,' 💽').replace(/%F0%9F%92%BE/g,' 💾').replace(/%F0%9F%92%BF/g,' 💿').replace(/%F0%9F%93%80/g,' 📀').replace(/%F0%9F%93%81/g,' 📁').replace(/%F0%9F%93%82/g,' 📂').replace(/%F0%9F%93%83/g,' 📃').replace(/%F0%9F%93%84/g,' 📄').replace(/%F0%9F%93%85/g,' 📅').replace(/%F0%9F%93%86/g,' 📆').replace(/%F0%9F%93%87/g,' 📇').replace(/%F0%9F%93%88/g,' 📈').replace(/%F0%9F%93%89/g,' 📉').replace(/%F0%9F%93%8A/g,' 📊').replace(/%F0%9F%93%8B/g,' 📋').replace(/%F0%9F%93%8C/g,' 📌').replace(/%F0%9F%93%8D/g,' 📍').replace(/%F0%9F%93%8E/g,' 📎').replace(/%F0%9F%93%8F/g,' 📏').replace(/%F0%9F%93%90/g,' 📐').replace(/%F0%9F%93%91/g,' 📑').replace(/%F0%9F%93%92/g,' 📒').replace(/%F0%9F%93%93/g,' 📓')
  .replace(/%F0%9F%93%94/g,' 📔').replace(/%F0%9F%93%95/g,' 📕').replace(/%F0%9F%93%96/g,' 📖').replace(/%F0%9F%93%97/g,' 📗').replace(/%F0%9F%93%98/g,' 📘').replace(/%F0%9F%93%99/g,' 📙').replace(/%F0%9F%93%9A/g,' 📚').replace(/%F0%9F%93%9B/g,' 📛').replace(/%F0%9F%93%9C/g,' 📜').replace(/%F0%9F%93%9D/g,' 📝').replace(/%F0%9F%93%9E/g,' 📞').replace(/%F0%9F%93%9F/g,' 📟').replace(/%F0%9F%93%A0/g,' 📠').replace(/%F0%9F%93%A1/g,' 📡').replace(/%F0%9F%93%A2/g,' 📢').replace(/%F0%9F%93%A3/g,' 📣').replace(/%F0%9F%93%A4/g,' 📤').replace(/%F0%9F%93%A5/g,' 📥').replace(/%F0%9F%93%A6/g,' 📦').replace(/%F0%9F%93%A7/g,' 📧').replace(/%F0%9F%93%A8/g,' 📨').replace(/%F0%9F%93%A9/g,' 📩').replace(/%F0%9F%93%AA/g,' 📪').replace(/%F0%9F%93%AB/g,' 📫').replace(/%F0%9F%93%AC/g,' 📬').replace(/%F0%9F%93%AD/g,' 📭').replace(/%F0%9F%93%AE/g,' 📮').replace(/%F0%9F%93%AF/g,' 📯').replace(/%F0%9F%93%B0/g,' 📰').replace(/%F0%9F%93%B1/g,' 📱').replace(/%F0%9F%93%B2/g,' 📲').replace(/%F0%9F%93%B3/g,' 📳').replace(/%F0%9F%93%B4/g,' 📴').replace(/%F0%9F%93%B5/g,' 📵').replace(/%F0%9F%93%B6/g,' 📶').replace(/%F0%9F%93%B7/g,' 📷').replace(/%F0%9F%93%B9/g,' 📹').replace(/%F0%9F%93%BA/g,' 📺').replace(/%F0%9F%93%BB/g,' 📻').replace(/%F0%9F%93%BC/g,' 📼').replace(/%F0%9F%94%80/g,' 🔀').replace(/%F0%9F%94%81/g,' 🔁').replace(/%F0%9F%94%82/g,' 🔂').replace(/%F0%9F%94%83/g,' 🔃').replace(/%F0%9F%94%84/g,' 🔄').replace(/%F0%9F%94%85/g,' 🔅').replace(/%F0%9F%94%86/g,' 🔆').replace(/%F0%9F%94%87/g,' 🔇').replace(/%F0%9F%94%88/g,' 🔈').replace(/%F0%9F%94%89/g,' 🔉').replace(/%F0%9F%94%8A/g,' 🔊')
  .replace(/%F0%9F%94%8B/g,' 🔋').replace(/%F0%9F%94%8C/g,' 🔌').replace(/%F0%9F%94%8D/g,' 🔍').replace(/%F0%9F%94%8E/g,' 🔎').replace(/%F0%9F%94%8F/g,' 🔏').replace(/%F0%9F%94%90/g,' 🔐').replace(/%F0%9F%94%91/g,' 🔑').replace(/%F0%9F%94%92/g,' 🔒').replace(/%F0%9F%94%93/g,' 🔓').replace(/%F0%9F%94%94/g,' 🔔').replace(/%F0%9F%94%95/g,' 🔕').replace(/%F0%9F%94%96/g,' 🔖').replace(/%F0%9F%94%97/g,' 🔗').replace(/%F0%9F%94%98/g,' 🔘').replace(/%F0%9F%94%99/g,' 🔙').replace(/%F0%9F%94%9A/g,' 🔚').replace(/%F0%9F%94%9B/g,' 🔛').replace(/%F0%9F%94%9C/g,' 🔜').replace(/%F0%9F%94%9D/g,' 🔝').replace(/%F0%9F%94%9E/g,' 🔞').replace(/%F0%9F%94%9F/g,' 🔟').replace(/%F0%9F%94%A0/g,' 🔠').replace(/%F0%9F%94%A1/g,' 🔡').replace(/%F0%9F%94%A2/g,' 🔢').replace(/%F0%9F%94%A3/g,' 🔣').replace(/%F0%9F%94%A4/g,' 🔤').replace(/%F0%9F%94%A5/g,' 🔥').replace(/%F0%9F%94%A6/g,' 🔦').replace(/%F0%9F%94%A7/g,' 🔧').replace(/%F0%9F%94%A8/g,' 🔨').replace(/%F0%9F%94%A9/g,' 🔩').replace(/%F0%9F%94%AA/g,' 🔪').replace(/%F0%9F%94%AB/g,' 🔫').replace(/%F0%9F%94%AC/g,' 🔬').replace(/%F0%9F%94%AD/g,' 🔭').replace(/%F0%9F%94%AE/g,' 🔮').replace(/%F0%9F%94%AF/g,' 🔯').replace(/%F0%9F%94%B0/g,' 🔰').replace(/%F0%9F%94%B1/g,' 🔱').replace(/%F0%9F%94%B2/g,' 🔲').replace(/%F0%9F%94%B3/g,' 🔳').replace(/%F0%9F%94%B4/g,' 🔴').replace(/%F0%9F%94%B5/g,' 🔵').replace(/%F0%9F%94%B6/g,' 🔶').replace(/%F0%9F%94%B7/g,' 🔷').replace(/%F0%9F%94%B8/g,' 🔸').replace(/%F0%9F%94%B9/g,' 🔹').replace(/%F0%9F%94%BA/g,' 🔺').replace(/%F0%9F%94%BB/g,' 🔻').replace(/%F0%9F%94%BC/g,' 🔼').replace(/%F0%9F%94%BD/g,' 🔽')
  .replace(/%F0%9F%95%80/g,' 🕀').replace(/%F0%9F%95%81/g,' 🕁').replace(/%F0%9F%95%82/g,' 🕂').replace(/%F0%9F%95%83/g,' 🕃').replace(/%F0%9F%95%90/g,' 🕐').replace(/%F0%9F%95%91/g,' 🕑').replace(/%F0%9F%95%92/g,' 🕒').replace(/%F0%9F%95%93/g,' 🕓').replace(/%F0%9F%95%94/g,' 🕔').replace(/%F0%9F%95%95/g,' 🕕').replace(/%F0%9F%95%96/g,' 🕖').replace(/%F0%9F%95%97/g,' 🕗').replace(/%F0%9F%95%98/g,' 🕘').replace(/%F0%9F%95%99/g,' 🕙').replace(/%F0%9F%95%9A/g,' 🕚').replace(/%F0%9F%95%9B/g,' 🕛').replace(/%F0%9F%95%9C/g,' 🕜').replace(/%F0%9F%95%9D/g,' 🕝').replace(/%F0%9F%95%9E/g,' 🕞').replace(/%F0%9F%95%9F/g,' 🕟').replace(/%F0%9F%95%A0/g,' 🕠').replace(/%F0%9F%95%A1/g,' 🕡').replace(/%F0%9F%95%A2/g,' 🕢').replace(/%F0%9F%95%A3/g,' 🕣').replace(/%F0%9F%95%A4/g,' 🕤').replace(/%F0%9F%95%A5/g,' 🕥').replace(/%F0%9F%95%A6/g,' 🕦').replace(/%F0%9F%95%A7/g,' 🕧').replace(/%F0%9F%97%BB/g,' 🗻').replace(/%F0%9F%97%BC/g,' 🗼').replace(/%F0%9F%97%BD/g,' 🗽').replace(/%F0%9F%97%BE/g,' 🗾').replace(/%F0%9F%97%BF/g,' 🗿').replace(/%E2%9C%81/g,' ✁').replace(/%E2%9C%82/g,' ✂').replace(/%E2%9C%83/g,' ✃').replace(/%E2%9C%84/g,' ✄').replace(/%E2%9C%85/g,' ✅').replace(/%E2%9C%86/g,' ✆').replace(/%E2%9C%87/g,' ✇').replace(/%E2%9C%88/g,' ✈').replace(/%E2%9C%89/g,' ✉').replace(/%E2%9C%8A/g,' ✊').replace(/%E2%9C%8B/g,' ✋').replace(/%E2%9C%8C/g,' ✌').replace(/%E2%9C%8D/g,' ✍').replace(/%E2%9C%8E/g,' ✎').replace(/%E2%9C%8F/g,' ✏').replace(/%E2%9C%90/g,' ✐').replace(/%E2%9C%91/g,' ✑').replace(/%E2%9C%92/g,' ✒').replace(/%E2%9C%93/g,' ✓').replace(/%E2%9C%94/g,' ✔').replace(/%E2%9C%95/g,' ✕')
  .replace(/%E2%9C%96/g,' ✖').replace(/%E2%9C%97/g,' ✗').replace(/%E2%9C%98/g,' ✘').replace(/%E2%9C%99/g,' ✙').replace(/%E2%9C%9A/g,' ✚').replace(/%E2%9C%9B/g,' ✛').replace(/%E2%9C%9C/g,' ✜').replace(/%E2%9C%9D/g,' ✝').replace(/%E2%9C%9E/g,' ✞').replace(/%E2%9C%9F/g,' ✟').replace(/%E2%9C%A0/g,' ✠').replace(/%E2%9C%A1/g,' ✡').replace(/%E2%9C%A2/g,' ✢').replace(/%E2%9C%A3/g,' ✣').replace(/%E2%9C%A4/g,' ✤').replace(/%E2%9C%A5/g,' ✥').replace(/%E2%9C%A6/g,' ✦').replace(/%E2%9C%A7/g,' ✧').replace(/%E2%9C%A8/g,' ✨').replace(/%E2%9C%A9/g,' ✩').replace(/%E2%9C%AA/g,' ✪').replace(/%E2%9C%AB/g,' ✫').replace(/%E2%9C%AC/g,' ✬').replace(/%E2%9C%AD/g,' ✭').replace(/%E2%9C%AE/g,' ✮').replace(/%E2%9C%AF/g,' ✯').replace(/%E2%9C%B0/g,' ✰').replace(/%E2%9C%B1/g,' ✱').replace(/%E2%9C%B2/g,' ✲').replace(/%E2%9C%B3/g,' ✳').replace(/%E2%9C%B4/g,' ✴').replace(/%E2%9C%B5/g,' ✵').replace(/%E2%9C%B6/g,' ✶').replace(/%E2%9C%B7/g,' ✷').replace(/%E2%9C%B8/g,' ✸').replace(/%E2%9C%B9/g,' ✹').replace(/%E2%9C%BA/g,' ✺').replace(/%E2%9C%BB/g,' ✻').replace(/%E2%9C%BC/g,' ✼').replace(/%E2%9C%BD/g,' ✽').replace(/%E2%9C%BE/g,' ✾').replace(/%E2%9C%BF/g,' ✿').replace(/%E2%9D%80/g,' ❀').replace(/%E2%9D%81/g,' ❁').replace(/%E2%9D%82/g,' ❂').replace(/%E2%9D%83/g,' ❃').replace(/%E2%9D%84/g,' ❄').replace(/%E2%9D%85/g,' ❅').replace(/%E2%9D%86/g,' ❆').replace(/%E2%9D%87/g,' ❇').replace(/%E2%9D%88/g,' ❈').replace(/%E2%9D%89/g,' ❉').replace(/%E2%9D%8A/g,' ❊').replace(/%E2%9D%8B/g,' ❋').replace(/%E2%9D%8C/g,' ❌').replace(/%E2%9D%8D/g,' ❍').replace(/%E2%9D%8E/g,' ❎').replace(/%E2%9D%8F/g,' ❏').replace(/%E2%9D%90/g,' ❐').replace(/%E2%9D%91/g,' ❑')
  .replace(/%E2%9D%92/g,' ❒').replace(/%E2%9D%93/g,' ❓').replace(/%E2%9D%94/g,' ❔').replace(/%E2%9D%95/g,' ❕').replace(/%E2%9D%96/g,' ❖').replace(/%E2%9D%97/g,' ❗').replace(/%E2%9D%98/g,' ❘').replace(/%E2%9D%99/g,' ❙').replace(/%E2%9D%9A/g,' ❚').replace(/%E2%9D%9B/g,' ❛').replace(/%E2%9D%9C/g,' ❜').replace(/%E2%9D%9D/g,' ❝').replace(/%E2%9D%9E/g,' ❞').replace(/%E2%9D%9F/g,' ❟').replace(/%E2%9D%A0/g,' ❠').replace(/%E2%9D%A1/g,' ❡').replace(/%E2%9D%A2/g,' ❢').replace(/%E2%9D%A3/g,' ❣').replace(/%E2%9D%A4/g,' ❤').replace(/%E2%9D%A5/g,' ❥').replace(/%E2%9D%A6/g,' ❦').replace(/%E2%9D%A7/g,' ❧').replace(/%E2%9D%A8/g,' ❨').replace(/%E2%9D%A9/g,' ❩').replace(/%E2%9D%AA/g,' ❪').replace(/%E2%9D%AB/g,' ❫').replace(/%E2%9D%AC/g,' ❬').replace(/%E2%9D%AD/g,' ❭').replace(/%E2%9D%AE/g,' ❮').replace(/%E2%9D%AF/g,' ❯').replace(/%E2%9D%B0/g,' ❰').replace(/%E2%9D%B1/g,' ❱').replace(/%E2%9D%B2/g,' ❲').replace(/%E2%9D%B3/g,' ❳').replace(/%E2%9D%B4/g,' ❴').replace(/%E2%9D%B5/g,' ❵').replace(/%E2%9D%B6/g,' ❶').replace(/%E2%9D%B7/g,' ❷').replace(/%E2%9D%B8/g,' ❸').replace(/%E2%9D%B9/g,' ❹').replace(/%E2%9D%BA/g,' ❺').replace(/%E2%9D%BB/g,' ❻').replace(/%E2%9D%BC/g,' ❼').replace(/%E2%9D%BD/g,' ❽').replace(/%E2%9D%BE/g,' ❾').replace(/%E2%9D%BF/g,' ❿').replace(/%E2%9E%80/g,' ➀').replace(/%E2%9E%81/g,' ➁').replace(/%E2%9E%82/g,' ➂').replace(/%E2%9E%83/g,' ➃').replace(/%E2%9E%84/g,' ➄').replace(/%E2%9E%85/g,' ➅').replace(/%E2%9E%86/g,' ➆').replace(/%E2%9E%87/g,' ➇').replace(/%E2%9E%88/g,' ➈').replace(/%E2%9E%89/g,' ➉').replace(/%E2%9E%8A/g,' ➊').replace(/%E2%9E%8B/g,' ➋').replace(/%E2%9E%8C/g,' ➌').replace(/%E2%9E%8D/g,' ➍').replace(/%E2%9E%8E/g,' ➎')
  .replace(/%E2%9E%8F/g,' ➏').replace(/%E2%9E%90/g,' ➐').replace(/%E2%9E%91/g,' ➑').replace(/%E2%9E%92/g,' ➒').replace(/%E2%9E%93/g,' ➓').replace(/%E2%9E%94/g,' ➔').replace(/%E2%9E%98/g,' ➘').replace(/%E2%9E%99/g,' ➙').replace(/%E2%9E%9A/g,' ➚').replace(/%E2%9E%9B/g,' ➛').replace(/%E2%9E%9C/g,' ➜').replace(/%E2%9E%9D/g,' ➝').replace(/%E2%9E%9E/g,' ➞').replace(/%E2%9E%9F/g,' ➟').replace(/%E2%9E%A0/g,' ➠').replace(/%E2%9E%A1/g,' ➡').replace(/%E2%9E%A2/g,' ➢').replace(/%E2%9E%A3/g,' ➣').replace(/%E2%9E%A4/g,' ➤').replace(/%E2%9E%A5/g,' ➥').replace(/%E2%9E%A6/g,' ➦').replace(/%E2%9E%A7/g,' ➧').replace(/%E2%9E%A8/g,' ➨').replace(/%E2%9E%A9/g,' ➩').replace(/%E2%9E%AA/g,' ➪').replace(/%E2%9E%AB/g,' ➫').replace(/%E2%9E%AC/g,' ➬').replace(/%E2%9E%AD/g,' ➭').replace(/%E2%9E%AE/g,' ➮').replace(/%E2%9E%AF/g,' ➯').replace(/%E2%9E%B0/g,' ➰').replace(/%E2%9E%B1/g,' ➱').replace(/%E2%9E%B2/g,' ➲').replace(/%E2%9E%B3/g,' ➳').replace(/%E2%9E%B4/g,' ➴').replace(/%E2%9E%B5/g,' ➵').replace(/%E2%9E%B6/g,' ➶').replace(/%E2%9E%B7/g,' ➷').replace(/%E2%9E%B8/g,' ➸').replace(/%E2%9E%B9/g,' ➹').replace(/%E2%9E%BA/g,' ➺').replace(/%E2%9E%BB/g,' ➻').replace(/%E2%9E%BC/g,' ➼').replace(/%E2%9E%BD/g,' ➽').replace(/%E2%9E%BE/g,' ➾').replace(/%E2%9E%BF/g,' ➿').replace(/%E2%98%80/g,' ☀').replace(/%E2%98%81/g,' ☁').replace(/%E2%98%82/g,' ☂').replace(/%E2%98%83/g,' ☃').replace(/%E2%98%84/g,' ☄').replace(/%E2%98%85/g,' ★').replace(/%E2%98%86/g,' ☆').replace(/%E2%98%87/g,' ☇').replace(/%E2%98%88/g,' ☈').replace(/%E2%98%89/g,' ☉').replace(/%E2%98%8A/g,' ☊').replace(/%E2%98%8B/g,' ☋').replace(/%E2%98%8C/g,' ☌').replace(/%E2%98%8D/g,' ☍')
  .replace(/%E2%98%8E/g,' ☎').replace(/%E2%98%8F/g,' ☏').replace(/%E2%98%90/g,' ☐').replace(/%E2%98%91/g,' ☑').replace(/%E2%98%92/g,' ☒').replace(/%E2%98%93/g,' ☓').replace(/%E2%98%94/g,' ☔').replace(/%E2%98%95/g,' ☕').replace(/%E2%98%96/g,' ☖').replace(/%E2%98%97/g,' ☗').replace(/%E2%98%98/g,' ☘').replace(/%E2%98%99/g,' ☙').replace(/%E2%98%9A/g,' ☚').replace(/%E2%98%9B/g,' ☛').replace(/%E2%98%9C/g,' ☜').replace(/%E2%98%9D/g,' ☝').replace(/%E2%98%9E/g,' ☞').replace(/%E2%98%9F/g,' ☟').replace(/%E2%98%A0/g,' ☠').replace(/%E2%98%A1/g,' ☡').replace(/%E2%98%A2/g,' ☢').replace(/%E2%98%A3/g,' ☣').replace(/%E2%98%A4/g,' ☤').replace(/%E2%98%A5/g,' ☥').replace(/%E2%98%A6/g,' ☦').replace(/%E2%98%A7/g,' ☧').replace(/%E2%98%A8/g,' ☨').replace(/%E2%98%A9/g,' ☩').replace(/%E2%98%AA/g,' ☪').replace(/%E2%98%AB/g,' ☫').replace(/%E2%98%AC/g,' ☬').replace(/%E2%98%AD/g,' ☭').replace(/%E2%98%AE/g,' ☮').replace(/%E2%98%AF/g,' ☯').replace(/%E2%98%B0/g,' ☰').replace(/%E2%98%B1/g,' ☱').replace(/%E2%98%B2/g,' ☲').replace(/%E2%98%B3/g,' ☳').replace(/%E2%98%B4/g,' ☴').replace(/%E2%98%B5/g,' ☵').replace(/%E2%98%B6/g,' ☶').replace(/%E2%98%B7/g,' ☷').replace(/%E2%98%B8/g,' ☸').replace(/%E2%98%B9/g,' ☹').replace(/%E2%98%BA/g,' ☺').replace(/%E2%98%BB/g,' ☻').replace(/%E2%98%BC/g,' ☼').replace(/%E2%98%BD/g,' ☽').replace(/%E2%98%BE/g,' ☾').replace(/%E2%98%BF/g,' ☿').replace(/%E2%99%80/g,' ♀').replace(/%E2%99%81/g,' ♁').replace(/%E2%99%82/g,' ♂').replace(/%E2%99%83/g,' ♃').replace(/%E2%99%84/g,' ♄').replace(/%E2%99%85/g,' ♅').replace(/%E2%99%86/g,' ♆').replace(/%E2%99%87/g,' ♇').replace(/%E2%99%88/g,' ♈').replace(/%E2%99%89/g,' ♉').replace(/%E2%99%8A/g,' ♊')
  .replace(/%E2%99%8B/g,' ♋').replace(/%E2%99%8C/g,' ♌').replace(/%E2%99%8D/g,' ♍').replace(/%E2%99%8E/g,' ♎').replace(/%E2%99%8F/g,' ♏').replace(/%E2%99%90/g,' ♐').replace(/%E2%99%91/g,' ♑').replace(/%E2%99%92/g,' ♒').replace(/%E2%99%93/g,' ♓').replace(/%E2%99%94/g,' ♔').replace(/%E2%99%95/g,' ♕').replace(/%E2%99%96/g,' ♖').replace(/%E2%99%97/g,' ♗').replace(/%E2%99%98/g,' ♘').replace(/%E2%99%99/g,' ♙').replace(/%E2%99%9A/g,' ♚').replace(/%E2%99%9B/g,' ♛').replace(/%E2%99%9C/g,' ♜').replace(/%E2%99%9D/g,' ♝').replace(/%E2%99%9E/g,' ♞').replace(/%E2%99%9F/g,' ♟').replace(/%E2%99%A0/g,' ♠').replace(/%E2%99%A1/g,' ♡').replace(/%E2%99%A2/g,' ♢').replace(/%E2%99%A3/g,' ♣').replace(/%E2%99%A4/g,' ♤').replace(/%E2%99%A5/g,' ♥').replace(/%E2%99%A6/g,' ♦').replace(/%E2%99%A7/g,' ♧').replace(/%E2%99%A8/g,' ♨').replace(/%E2%99%A9/g,' ♩').replace(/%E2%99%AA/g,' ♪').replace(/%E2%99%AB/g,' ♫').replace(/%E2%99%AC/g,' ♬').replace(/%E2%99%AD/g,' ♭').replace(/%E2%99%AE/g,' ♮').replace(/%E2%99%AF/g,' ♯').replace(/%E2%99%B0/g,' ♰').replace(/%E2%99%B1/g,' ♱').replace(/%E2%99%B2/g,' ♲').replace(/%E2%99%B3/g,' ♳').replace(/%E2%99%B4/g,' ♴').replace(/%E2%99%B5/g,' ♵').replace(/%E2%99%B6/g,' ♶').replace(/%E2%99%B7/g,' ♷').replace(/%E2%99%B8/g,' ♸').replace(/%E2%99%B9/g,' ♹').replace(/%E2%99%BA/g,' ♺').replace(/%E2%99%BB/g,' ♻').replace(/%E2%99%BC/g,' ♼').replace(/%E2%99%BD/g,' ♽').replace(/%E2%99%BE/g,' ♾').replace(/%E2%99%BF/g,' ♿').replace(/%E2%9A%80/g,' ⚀').replace(/%E2%9A%81/g,' ⚁').replace(/%E2%9A%82/g,' ⚂').replace(/%E2%9A%83/g,' ⚃').replace(/%E2%9A%84/g,' ⚄').replace(/%E2%9A%85/g,' ⚅').replace(/%E2%9A%86/g,' ⚆').replace(/%E2%9A%87/g,' ⚇')
  .replace(/%E2%9A%88/g,' ⚈').replace(/%E2%9A%89/g,' ⚉').replace(/%E2%9A%8A/g,' ⚊').replace(/%E2%9A%8B/g,' ⚋').replace(/%E2%9A%8C/g,' ⚌').replace(/%E2%9A%8D/g,' ⚍').replace(/%E2%9A%8E/g,' ⚎').replace(/%E2%9A%8F/g,' ⚏').replace(/%E2%9A%90/g,' ⚐').replace(/%E2%9A%91/g,' ⚑').replace(/%E2%9A%92/g,' ⚒').replace(/%E2%9A%93/g,' ⚓').replace(/%E2%9A%94/g,' ⚔').replace(/%E2%9A%95/g,' ⚕').replace(/%E2%9A%96/g,' ⚖').replace(/%E2%9A%97/g,' ⚗').replace(/%E2%9A%98/g,' ⚘').replace(/%E2%9A%99/g,' ⚙').replace(/%E2%9A%9A/g,' ⚚').replace(/%E2%9A%9B/g,' ⚛').replace(/%E2%9A%9C/g,' ⚜').replace(/%E2%9A%9D/g,' ⚝').replace(/%E2%9A%9E/g,' ⚞').replace(/%E2%9A%9F/g,' ⚟').replace(/%E2%9A%A0/g,' ⚠').replace(/%E2%9A%A1/g,' ⚡').replace(/%E2%9A%A2/g,' ⚢').replace(/%E2%9A%A3/g,' ⚣').replace(/%E2%9A%A4/g,' ⚤').replace(/%E2%9A%A5/g,' ⚥').replace(/%E2%9A%A6/g,' ⚦').replace(/%E2%9A%A7/g,' ⚧').replace(/%E2%9A%A8/g,' ⚨').replace(/%E2%9A%A9/g,' ⚩').replace(/%E2%9A%AA/g,' ⚪').replace(/%E2%9A%AB/g,' ⚫').replace(/%E2%9A%AC/g,' ⚬').replace(/%E2%9A%AD/g,' ⚭').replace(/%E2%9A%AE/g,' ⚮').replace(/%E2%9A%AF/g,' ⚯').replace(/%E2%9A%B0/g,' ⚰').replace(/%E2%9A%B1/g,' ⚱').replace(/%E2%9A%B2/g,' ⚲').replace(/%E2%9A%B3/g,' ⚳').replace(/%E2%9A%B4/g,' ⚴').replace(/%E2%9A%B5/g,' ⚵').replace(/%E2%9A%B6/g,' ⚶').replace(/%E2%9A%B7/g,' ⚷').replace(/%E2%9A%B8/g,' ⚸').replace(/%E2%9A%B9/g,' ⚹').replace(/%E2%9A%BA/g,' ⚺').replace(/%E2%9A%BB/g,' ⚻').replace(/%E2%9A%BC/g,' ⚼').replace(/%E2%9A%BD/g,' ⚽').replace(/%E2%9A%BE/g,' ⚾').replace(/%E2%9A%BF/g,' ⚿').replace(/%E2%9B%80/g,' ⛀').replace(/%E2%9B%81/g,' ⛁').replace(/%E2%9B%82/g,' ⛂').replace(/%E2%9B%83/g,' ⛃').replace(/%E2%9B%84/g,' ⛄')
  .replace(/%E2%9B%85/g,' ⛅').replace(/%E2%9B%86/g,' ⛆').replace(/%E2%9B%87/g,' ⛇').replace(/%E2%9B%88/g,' ⛈').replace(/%E2%9B%89/g,' ⛉').replace(/%E2%9B%8A/g,' ⛊').replace(/%E2%9B%8B/g,' ⛋').replace(/%E2%9B%8C/g,' ⛌').replace(/%E2%9B%8D/g,' ⛍').replace(/%E2%9B%8E/g,' ⛎').replace(/%E2%9B%8F/g,' ⛏').replace(/%E2%9B%90/g,' ⛐').replace(/%E2%9B%91/g,' ⛑').replace(/%E2%9B%92/g,' ⛒').replace(/%E2%9B%93/g,' ⛓').replace(/%E2%9B%94/g,' ⛔').replace(/%E2%9B%95/g,' ⛕').replace(/%E2%9B%96/g,' ⛖').replace(/%E2%9B%97/g,' ⛗').replace(/%E2%9B%98/g,' ⛘').replace(/%E2%9B%99/g,' ⛙').replace(/%E2%9B%9A/g,' ⛚').replace(/%E2%9B%9B/g,' ⛛').replace(/%E2%9B%9C/g,' ⛜').replace(/%E2%9B%9D/g,' ⛝').replace(/%E2%9B%9E/g,' ⛞').replace(/%E2%9B%9F/g,' ⛟').replace(/%E2%9B%A0/g,' ⛠').replace(/%E2%9B%A1/g,' ⛡').replace(/%E2%9B%A2/g,' ⛢').replace(/%E2%9B%A3/g,' ⛣').replace(/%E2%9B%A4/g,' ⛤').replace(/%E2%9B%A5/g,' ⛥').replace(/%E2%9B%A6/g,' ⛦').replace(/%E2%9B%A7/g,' ⛧').replace(/%E2%9B%A8/g,' ⛨').replace(/%E2%9B%A9/g,' ⛩').replace(/%E2%9B%AA/g,' ⛪').replace(/%E2%9B%AB/g,' ⛫').replace(/%E2%9B%AC/g,' ⛬').replace(/%E2%9B%AD/g,' ⛭').replace(/%E2%9B%AE/g,' ⛮').replace(/%E2%9B%AF/g,' ⛯').replace(/%E2%9B%B0/g,' ⛰').replace(/%E2%9B%B1/g,' ⛱').replace(/%E2%9B%B2/g,' ⛲').replace(/%E2%9B%B3/g,' ⛳').replace(/%E2%9B%B4/g,' ⛴').replace(/%E2%9B%B5/g,' ⛵').replace(/%E2%9B%B6/g,' ⛶').replace(/%E2%9B%B7/g,' ⛷').replace(/%E2%9B%B8/g,' ⛸').replace(/%E2%9B%B9/g,' ⛹').replace(/%E2%9B%BA/g,' ⛺').replace(/%E2%9B%BB/g,' ⛻').replace(/%E2%9B%BC/g,' ⛼').replace(/%E2%9B%BD/g,' ⛽').replace(/%E2%9B%BE/g,' ⛾').replace(/%E2%9B%BF/g,' ⛿').replace(/%F0%9F%9A%80/g,' 🚀')
  .replace(/%F0%9F%9A%81/g,' 🚁').replace(/%F0%9F%9A%82/g,' 🚂').replace(/%F0%9F%9A%83/g,' 🚃').replace(/%F0%9F%9A%84/g,' 🚄').replace(/%F0%9F%9A%85/g,' 🚅').replace(/%F0%9F%9A%86/g,' 🚆').replace(/%F0%9F%9A%87/g,' 🚇').replace(/%F0%9F%9A%88/g,' 🚈').replace(/%F0%9F%9A%89/g,' 🚉').replace(/%F0%9F%9A%8A/g,' 🚊').replace(/%F0%9F%9A%8B/g,' 🚋').replace(/%F0%9F%9A%8C/g,' 🚌').replace(/%F0%9F%9A%8D/g,' 🚍').replace(/%F0%9F%9A%8E/g,' 🚎').replace(/%F0%9F%9A%8F/g,' 🚏').replace(/%F0%9F%9A%90/g,' 🚐').replace(/%F0%9F%9A%91/g,' 🚑').replace(/%F0%9F%9A%92/g,' 🚒').replace(/%F0%9F%9A%93/g,' 🚓').replace(/%F0%9F%9A%94/g,' 🚔').replace(/%F0%9F%9A%95/g,' 🚕').replace(/%F0%9F%9A%96/g,' 🚖').replace(/%F0%9F%9A%97/g,' 🚗').replace(/%F0%9F%9A%98/g,' 🚘').replace(/%F0%9F%9A%99/g,' 🚙').replace(/%F0%9F%9A%9A/g,' 🚚').replace(/%F0%9F%9A%9B/g,' 🚛').replace(/%F0%9F%9A%9C/g,' 🚜').replace(/%F0%9F%9A%9D/g,' 🚝').replace(/%F0%9F%9A%9E/g,' 🚞').replace(/%F0%9F%9A%9F/g,' 🚟').replace(/%F0%9F%9A%A0/g,' 🚠').replace(/%F0%9F%9A%A1/g,' 🚡').replace(/%F0%9F%9A%A2/g,' 🚢').replace(/%F0%9F%9A%A3/g,' 🚣').replace(/%F0%9F%9A%A4/g,' 🚤').replace(/%F0%9F%9A%A5/g,' 🚥').replace(/%F0%9F%9A%A6/g,' 🚦').replace(/%F0%9F%9A%A7/g,' 🚧').replace(/%F0%9F%9A%A8/g,' 🚨').replace(/%F0%9F%9A%A9/g,' 🚩').replace(/%F0%9F%9A%AA/g,' 🚪').replace(/%F0%9F%9A%AB/g,' 🚫').replace(/%F0%9F%9A%AC/g,' 🚬').replace(/%F0%9F%9A%AD/g,' 🚭').replace(/%F0%9F%9A%AE/g,' 🚮').replace(/%F0%9F%9A%AF/g,' 🚯').replace(/%F0%9F%9A%B0/g,' 🚰').replace(/%F0%9F%9A%B1/g,' 🚱').replace(/%F0%9F%9A%B2/g,' 🚲').replace(/%F0%9F%9A%B3/g,' 🚳').replace(/%F0%9F%9A%B4/g,' 🚴').replace(/%F0%9F%9A%B5/g,' 🚵')
  .replace(/%F0%9F%9A%B6/g,' 🚶').replace(/%F0%9F%9A%B7/g,' 🚷').replace(/%F0%9F%9A%B8/g,' 🚸').replace(/%F0%9F%9A%B9/g,' 🚹').replace(/%F0%9F%9A%BA/g,' 🚺').replace(/%F0%9F%9A%BB/g,' 🚻').replace(/%F0%9F%9A%BC/g,' 🚼').replace(/%F0%9F%9A%BD/g,' 🚽').replace(/%F0%9F%9A%BE/g,' 🚾').replace(/%F0%9F%9A%BF/g,' 🚿').replace(/%F0%9F%9B%80/g,' 🛀').replace(/%F0%9F%9B%81/g,' 🛁').replace(/%F0%9F%9B%82/g,' 🛂').replace(/%F0%9F%9B%83/g,' 🛃').replace(/%F0%9F%9B%84/g,' 🛄').replace(/%F0%9F%9B%85/g,' 🛅').replace(/%F0%9F%98%80/g,' 😀').replace(/%F0%9F%98%81/g,' 😁').replace(/%F0%9F%98%82/g,' 😂').replace(/%F0%9F%98%83/g,' 😃').replace(/%F0%9F%98%84/g,' 😄').replace(/%F0%9F%98%85/g,' 😅').replace(/%F0%9F%98%86/g,' 😆').replace(/%F0%9F%98%87/g,' 😇').replace(/%F0%9F%98%88/g,' 😈').replace(/%F0%9F%98%89/g,' 😉').replace(/%F0%9F%98%8A/g,' 😊').replace(/%F0%9F%98%8B/g,' 😋').replace(/%F0%9F%98%8C/g,' 😌').replace(/%F0%9F%98%8D/g,' 😍').replace(/%F0%9F%98%8E/g,' 😎').replace(/%F0%9F%98%8F/g,' 😏').replace(/%F0%9F%98%90/g,' 😐').replace(/%F0%9F%98%91/g,' 😑').replace(/%F0%9F%98%92/g,' 😒').replace(/%F0%9F%98%93/g,' 😓').replace(/%F0%9F%98%94/g,' 😔').replace(/%F0%9F%98%95/g,' 😕').replace(/%F0%9F%98%96/g,' 😖').replace(/%F0%9F%98%97/g,' 😗').replace(/%F0%9F%98%98/g,' 😘').replace(/%F0%9F%98%99/g,' 😙').replace(/%F0%9F%98%9A/g,' 😚').replace(/%F0%9F%98%9B/g,' 😛').replace(/%F0%9F%98%9C/g,' 😜').replace(/%F0%9F%98%9D/g,' 😝').replace(/%F0%9F%98%9E/g,' 😞').replace(/%F0%9F%98%9F/g,' 😟').replace(/%F0%9F%98%A0/g,' 😠').replace(/%F0%9F%98%A1/g,' 😡').replace(/%F0%9F%98%A2/g,' 😢').replace(/%F0%9F%98%A3/g,' 😣').replace(/%F0%9F%98%A4/g,' 😤').replace(/%F0%9F%98%A5/g,' 😥')
  .replace(/%F0%9F%98%A6/g,' 😦').replace(/%F0%9F%98%A7/g,' 😧').replace(/%F0%9F%98%A8/g,' 😨').replace(/%F0%9F%98%A9/g,' 😩').replace(/%F0%9F%98%AA/g,' 😪').replace(/%F0%9F%98%AB/g,' 😫').replace(/%F0%9F%98%AC/g,' 😬').replace(/%F0%9F%98%AD/g,' 😭').replace(/%F0%9F%98%AE/g,' 😮').replace(/%F0%9F%98%AF/g,' 😯').replace(/%F0%9F%98%B0/g,' 😰').replace(/%F0%9F%98%B1/g,' 😱').replace(/%F0%9F%98%B2/g,' 😲').replace(/%F0%9F%98%B3/g,' 😳').replace(/%F0%9F%98%B4/g,' 😴').replace(/%F0%9F%98%B5/g,' 😵').replace(/%F0%9F%98%B6/g,' 😶').replace(/%F0%9F%98%B7/g,' 😷').replace(/%F0%9F%98%B8/g,' 😸').replace(/%F0%9F%98%B9/g,' 😹').replace(/%F0%9F%98%BA/g,' 😺').replace(/%F0%9F%98%BB/g,' 😻').replace(/%F0%9F%98%BC/g,' 😼').replace(/%F0%9F%98%BD/g,' 😽').replace(/%F0%9F%98%BE/g,' 😾').replace(/%F0%9F%98%BF/g,' 😿').replace(/%F0%9F%99%80/g,' 🙀').replace(/%F0%9F%99%85/g,' 🙅').replace(/%F0%9F%99%86/g,' 🙆').replace(/%F0%9F%99%87/g,' 🙇').replace(/%F0%9F%99%88/g,' 🙈').replace(/%F0%9F%99%89/g,' 🙉').replace(/%F0%9F%99%8A/g,' 🙊').replace(/%F0%9F%99%8B/g,' 🙋').replace(/%F0%9F%99%8C/g,' 🙌').replace(/%F0%9F%99%8D/g,' 🙍').replace(/%F0%9F%99%8E/g,' 🙎').replace(/%F0%9F%99%8F/g,' 🙏').replace(/%E2%96%A0/g,' ■').replace(/%E2%96%A1/g,' □').replace(/%E2%96%A2/g,' ▢').replace(/%E2%96%A3/g,' ▣').replace(/%E2%96%A4/g,' ▤').replace(/%E2%96%A5/g,' ▥').replace(/%E2%96%A6/g,' ▦').replace(/%E2%96%A7/g,' ▧').replace(/%E2%96%A8/g,' ▨').replace(/%E2%96%A9/g,' ▩').replace(/%E2%96%AA/g,' ▪').replace(/%E2%96%AB/g,' ▫').replace(/%E2%96%AC/g,' ▬').replace(/%E2%96%AD/g,' ▭').replace(/%E2%96%AE/g,' ▮').replace(/%E2%96%AF/g,' ▯').replace(/%E2%96%B0/g,' ▰').replace(/%E2%96%B1/g,' ▱').replace(/%E2%96%B2/g,' ▲')
  .replace(/%E2%96%B3/g,' △').replace(/%E2%96%B4/g,' ▴').replace(/%E2%96%B5/g,' ▵').replace(/%E2%96%B6/g,' ▶').replace(/%E2%96%B7/g,' ▷').replace(/%E2%96%B8/g,' ▸').replace(/%E2%96%B9/g,' ▹').replace(/%E2%96%BA/g,' ►').replace(/%E2%96%BB/g,' ▻').replace(/%E2%96%BC/g,' ▼').replace(/%E2%96%BD/g,' ▽').replace(/%E2%96%BE/g,' ▾').replace(/%E2%96%BF/g,' ▿').replace(/%E2%97%80/g,' ◀').replace(/%E2%97%81/g,' ◁').replace(/%E2%97%82/g,' ◂').replace(/%E2%97%83/g,' ◃').replace(/%E2%97%84/g,' ◄').replace(/%E2%97%85/g,' ◅').replace(/%E2%97%86/g,' ◆').replace(/%E2%97%87/g,' ◇').replace(/%E2%97%88/g,' ◈').replace(/%E2%97%89/g,' ◉').replace(/%E2%97%8A/g,' ◊').replace(/%E2%97%8B/g,' ○').replace(/%E2%97%8C/g,' ◌').replace(/%E2%97%8D/g,' ◍').replace(/%E2%97%8E/g,' ◎').replace(/%E2%97%8F/g,' ●').replace(/%E2%97%90/g,' ◐').replace(/%E2%97%91/g,' ◑').replace(/%E2%97%92/g,' ◒').replace(/%E2%97%93/g,' ◓').replace(/%E2%97%94/g,' ◔').replace(/%E2%97%95/g,' ◕').replace(/%E2%97%96/g,' ◖').replace(/%E2%97%97/g,' ◗').replace(/%E2%97%98/g,' ◘').replace(/%E2%97%99/g,' ◙').replace(/%E2%97%9A/g,' ◚').replace(/%E2%97%9B/g,' ◛').replace(/%E2%97%9C/g,' ◜').replace(/%E2%97%9D/g,' ◝').replace(/%E2%97%9E/g,' ◞').replace(/%E2%97%9F/g,' ◟').replace(/%E2%97%A0/g,' ◠').replace(/%E2%97%A1/g,' ◡').replace(/%E2%97%A2/g,' ◢').replace(/%E2%97%A3/g,' ◣').replace(/%E2%97%A4/g,' ◤').replace(/%E2%97%A5/g,' ◥').replace(/%E2%97%A6/g,' ◦').replace(/%E2%97%A7/g,' ◧').replace(/%E2%97%A8/g,' ◨').replace(/%E2%97%A9/g,' ◩').replace(/%E2%97%AA/g,' ◪').replace(/%E2%97%AB/g,' ◫').replace(/%E2%97%AC/g,' ◬').replace(/%E2%97%AD/g,' ◭').replace(/%E2%97%AE/g,' ◮').replace(/%E2%97%AF/g,' ◯').replace(/%E2%97%B0/g,' ◰').replace(/%E2%97%B1/g,' ◱')
  .replace(/%E2%97%B2/g,' ◲').replace(/%E2%97%B3/g,' ◳').replace(/%E2%97%B4/g,' ◴').replace(/%E2%97%B5/g,' ◵').replace(/%E2%97%B6/g,' ◶').replace(/%E2%97%B7/g,' ◷').replace(/%E2%97%B8/g,' ◸').replace(/%E2%97%B9/g,' ◹').replace(/%E2%97%BA/g,' ◺').replace(/%E2%97%BB/g,' ◻').replace(/%E2%97%BC/g,' ◼').replace(/%E2%97%BD/g,' ◽').replace(/%E2%97%BE/g,' ◾').replace(/%E2%97%BF/g,' ◿')
  }


router.get('/api/singleAllInOneData/:id', function (req, res) {
  async.waterfall([
    function (nextCall) {
      var sqlss = " SELECT * FROM diff_net_posts WHERE id =" + req.params.id;
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

router.get('/api/singleBitlyData', function (req, res) {
  async.waterfall([
    function (nextCall) {
      var sqlss = " SELECT * FROM bitly_token";
      connection.query(sqlss, function (err, rides) {
        // console.log('rides: ', _.last(rides));
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
      message: "Single recored sucessfully",
      data: response
    });
  });
});

router.delete('/api/deleteAllInOneData/:id', function (req, res) {
  async.waterfall([
    function (nextCall) {
      var sqlss = " DELETE FROM diff_net_posts WHERE id =" + req.params.id;
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

router.post('/api/getAllInOneData', function (req, res) {
  var response = {
    "draw": req.body.draw || 0,
    "recordsTotal": 0,
    "recordsFiltered": 0,
    "data": []
  };
  async.waterfall([
    function (nextCall) {
      var sql = "Select count(*) as TotalCount from ??";
      // connection.query(sql, ['all_in_one'], function (err, rides) {
      connection.query(sql, ['diff_net_posts'], function (err, rides) {
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
      connection.query(query, ["diff_net_posts", LimitNum, startNum], function (err, ridess) {
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
