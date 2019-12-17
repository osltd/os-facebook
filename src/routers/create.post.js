/**
 *  ------------- Load dependencies -------------
 */
const express     = require('express');
const router      = express.Router();
const FB          = require('fb');
const request     = require('request');
const bodyParser  = require('body-parser');
const fbUpload    = require('../helpers/facebook.upload');
const config      = require('../constants/config');
const db          = require('../helpers/db');
const jsonParser  = bodyParser.json();
const h2p         = require('html2plaintext');
// AWS
const aws         = require('aws-sdk');
const s3          = new aws.S3(config.S3);
const BUCKET      = 'cdn.oneshop.cloud';





/**
 *      --------- Publish article to page ---------
 */
router.post('/pre-release', jsonParser, function(req, res){
    // response first
    res.status(200).end('posted.');
    // release
    request({
        url      : config.APP.URL + '/release',
        method   : 'POST',
        headers : {
            'Content-Type'  : 'application/json',
        },
        body     : JSON.stringify({feed:req.body.feed})
    }, (error, resp, body) => {});
});




router.post('/release', jsonParser, function(req, res) {
    // setup data process container
    var data = {};
    // setup get article method
    var fetchArticleWithStatusnId = function(status, id){
        console.log(`=====> Fetching ${status} posts...`);
        // fetch articles
        return new Promise((resolve, reject) => request({
            url    : `${config.OS.ENDPOINT}/articles?statuses=${status}&ids=${id}`,
            // HHH Test
            //url    : `${config.OS.ENDPOINT}/articles?ids=${id}`,
            method : 'GET',
            auth   : {
                'user' : config.OS.ID,
                'pass' : config.OS.KEY
            }
        }, (error, resp, body) => {
            let result = null;
            try {result = JSON.parse(body)} catch(e) {result = null} finally {result = result || {}}
           resolve((result.data || {}).rows || []);
        }));
    };
    // fetch published articles
    new Promise((resolve, reject) => fetchArticleWithStatusnId('published', req.body.feed)
    // no articles found? fetch scheduled articles
    .then(rows => rows.length ? resolve(rows) : fetchArticleWithStatusnId('scheduled', req.body.feed).then(resolve)))
    // got article
    .then(rows => new Promise((resolve, reject) => {
        // get article
        const article = rows.shift() || {};
        // save article
        data.article = article;
        // pass article
        !(article.sections || []).length ? reject({
            code    : 404,
            message : 'page.not.found'
        }) : resolve();
    }))
    // fetch shop info
    .then(() => new Promise((resolve, reject) => {
        // fetch shops
        db.query(`SELECT * FROM tokens WHERE shop_id = ?`, [data.article.shop.id])
        // 
        .then(rows  => {
             // no record
             if ((rows || []).length < 1) {
                reject({
                    code    : 404,
                    message : `shop.not.found`
                });
            } else { 
                console.log("=====> 2. shop fetched");
                // save shop
                data.shop = rows[0];
                // next
                resolve();
            }
        })
        // db error
        .catch(reject);
    }))


    // fetch Facebook Feed by feed id
    .then(() => new Promise((resolve, reject) => {
        // fetch feed
        db.query('SELECT * FROM feeds WHERE os_id = ?', [data.article.id])
        // got feeds
        .then(rows => {
            console.log(rows.length ? "=====> 3. feed existed already" : "=====> 3. feed not exist, create a new one");
            // save feed data if exists
            data.facebookFeed = rows.length ? rows[0] : null;
            // next process
            resolve();
        })
        // db error
        .catch(reject);
    }))

    // set upload config
    .then(() => new Promise((resolve, reject) => {
        // preset upload type
        data.type = 'feed';
        // get total sections
        var totalSections = data.article.sections.length;
        // setup config data
        var feedConf = {};
        // link post
        if (totalSections > 1) {
            // setup config data
            feedConf.message = h2p(((data.article.sections || [])[0] || {}).description || '');
            // append link
            feedConf.link = config.APP.URL + '/articles/' + data.article.id;
        } else
        // image/video post
        if ((data.article.sections[0].medias || []).length > 0) {
            // get media url
            var url = data.article.sections[0].medias[0].url;
            // extract extension
            var extension = (url.split('?').shift() || '').split('.').pop();
            // image?
            if(!/mov|mpeg4|mp4|avi|wmv|mpegps|flv|3gpp|webm|dnxhr|prores|cineform|hevc|qt/i.test(extension)){
                // set type
                data.type = 'photos';
                // setup config data
                feedConf.caption = h2p(data.article.sections[0].description || '');
                // append link
                feedConf.url = data.article.sections[0].medias[0].url;
            } 
            // videos?
            else {
                // set type
                data.type = 'videos';
                // get key name
                var key = (url.split('?').shift() || '').split('/').pop();
                // set title
                feedConf.title = h2p(data.article.sections[0].title || '');
                // set description
                feedConf.description = h2p(data.article.sections[0].description || '');
                // file
                feedConf.source = s3.getObject({ 
                    Bucket : BUCKET, 
                    Key    : key
                }).createReadStream();
            }
        } else {
            // setup config data
            feedConf.message = h2p(((data.article.sections || [])[0] || {}).description || '');
        }
        // append hashtag
        if((((data.article.sections || [])[0] || {}).tags || []).length > 0) 
            feedConf[typeof feedConf.caption != 'undefined' ? 'caption' : 'message'] += "\n\n#" + data.article.tags.join(' #');    
        
        // HHH Test
        // Test with specified schedule    
        // need to set schedule?
        if(new Date(data.article.time).getTime() > new Date().getTime()) {
            feedConf.published = false;
            // set publish time
            feedConf.scheduled_publish_time = new Date(data.article.time).getTime() / 1000;
        }
        // save feed conf
        data.feedConf = feedConf;
        // next
        resolve();
    }))
    
    // upload
    .then(() => new Promise((resolve, reject) => {
        // -------- Create new post
        if(!data.facebookFeed){
            // photos or feed?
            if(/^photos|feed$/i.test(data.type)){
                console.log('====> Creating photo feed...');
                // connect fb
                FB.setAccessToken(data.shop.token);
                // post feed
                FB.api(`${data.shop.page_id}/${data.type}`, 'POST', data.feedConf, response => {
                    console.log("====> data.facebookFeed.fb_id (Create) : ");
                    console.log(response);
                    // save result
                    data.fbApiRes = response;
                    // Photo Result :
                    //{ id: '118450802970145',
                    //post_id: '112470303568195_118450802970145' }
                    // Msg Result :
                    //{ id: '112470303568195_118451569636735' }
                    // next process
                    (response || {}).error ? reject({
                        code    : 400,
                        message : `post.failed.${(response.error || {}).message}`
                    }) : resolve(response.id);
                });
            } 
            // videos
            else {
                console.log('====> Creating video feed...');
                // start upload
                fbUpload({
                    token         : data.shop.token,
                    id            : data.shop.page_id,
                    stream        : data.feedConf.source,
                    title         : data.feedConf.title,
                    description   : data.feedConf.description,
                    scheduledTime : data.feedConf.scheduled_publish_time || null
                }).then((result) => {
                    // save result
                    data.fbApiRes = result;
                    // success?
                    result.success ? resolve(result.video_id) : reject({ code : 400, message : `video.upload.known.error`});
                }).catch((e) => {
                    console.log("====> upload err: ", e);
                    reject({ code : 400, message : `video.upload.error:${e}`})
                });
            }
        } else {
            // connect fb
            FB.setAccessToken(data.shop.token);
            // connect fb
            FB.setAccessToken(data.shop.token);
            console.log('====> updating feed...');
            //setup payload
            var params = {};
            switch (data.type) {
                case 'feed':
                    params = {message : data.feedConf.message};
                    break;
                case 'photos':
                    params = {
                        // Not solve this case yet
                        caption : data.feedConf.caption
                    };
                    break;
                case 'videos':
                    params = {
                        title       : data.feedConf.title,
                        description : data.feedConf.description
                    };
                    break;
                default:
                    break;    
            }
            // update post
            FB.api(`/${data.facebookFeed.fb_id}`, 'POST', params, response => {  
                // save response
                data.fbApiRes = response;
                console.log("====> data.facebookFeed.fb_id : ");
                console.log(data);
                console.log("====> params : ");
                console.log(params);
                // next process
                (response || {}).error ? reject({
                    code    : 400,
                    message : `post.failed.${(response.error || {}).message}`
                }) : resolve(response.id);
            });
        }
    }))
    // save post info
    .then((postId) => new Promise((resolve, reject) => {
        // feed not exists, create new one
        if(!data.facebookFeed){
            console.log('====> posted. saving to db....');
            db.query(
                "REPLACE INTO `feeds` (`fb_id`,`shop_id`,`os_id`,`publish_time`) VALUES (?,?,?,?)",
                [postId, data.article.shop.id, req.body.feed, new Date(data.article.time)]
            )
            // saved successfully?
            .then(res => res.affectedRows == 0 ? reject({code:500,messgae:`save.post.failed`}) : resolve())
            // db error
            .catch(reject);
        } else {
            // by pass
            resolve();
        }
    }))
    // save log
    .then(() => db.query(
        "INSERT INTO `logs` (`feed_id`, `shop_id`, `log_result`, `log_action`, `log_response_context`) VALUES (?,?,?,?,?)",
        [
            req.body.feed, 
            data.article.shop.id, 
            'SUCCESS', 
            data.facebookFeed ? 'UPDATE' : 'CREATE', 
            !/^string$/i.test(typeof data.fbApiRes) ? JSON.stringify(data.fbApiRes) : data.fbApiRes
        ]
    ))
    // all process has finished
    .then(() => res.status(200).json({
        result   : true,
        messages : [`post.succeed`]
    }))
    // any error?
    .catch(err => {
        // Check the error log of authorized access token
        var shopIdVal = ((data.article || {}).shop || {}).id || 0;
        var errStr = !/^string$/i.test(typeof err) ? JSON.stringify(err) : err;
        if(errStr.includes("Error validating access token: The user has not authorized application")) {
            // update shop status (Change shop status back to "DRAFT" state if the related token invalid)
            request({
                url: config.OS.ENDPOINT + '/shops/' + shopIdVal,
                method: 'PUT',
                headers: {
                    'content-type': 'application/json'
                },
                auth: {
                    'user': config.OS.ID,
                    'pass': config.OS.KEY
                },
                body: JSON.stringify({
                    status: 'DRAFT'
                })
            }, (error, resp, body) => {
                // setup result container
                var result = null;
                // parse result
                try {result = JSON.parse(body)} catch(e) {result = null} finally {result = result || {}}
                // shop status updated
                if (result.result) {
                }
            }); 
        }
        // create log
        db.query(
            "INSERT INTO `logs` (`feed_id`, `shop_id`, `log_result`, `log_action`, `log_response_context`) VALUES (?,?,?,?,?)",
            [
                req.body.feed, 
                //((data.article || {}).shop || {}).id || 0, 
                shopIdVal,
                'FAILED', 
                data.facebookFeed ? 'UPDATE' : 'CREATE', 
                //!/^string$/i.test(typeof err) ? JSON.stringify(err) : err
                errStr
            ]
        )
        // response
        .then(result => res.status(401).json({
            result   : false,
            messages : `post.failed`
        }))
        // db error
        .catch(error => {
            res.status(500).json({
            result   : false,
            messages : `save.error.failed:${error}`
        })});
    });
});

module.exports = router;