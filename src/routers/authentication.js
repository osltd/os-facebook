/**
 *  ------------- Load dependencies -------------
 */
const express          = require('express');
const router           = express.Router();
const passport         = require('passport');
const FB               = require('fb');
const request          = require('request');
const bodyParser       = require('body-parser');
const csrf             = require('csurf');
const csrfProtection   = csrf({ cookie: true });
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const config           = require('../constants/config');
const db               = require('../helpers/db');



/**
 *  ------------- Start authentication -------------
 */
router.get('/auth/facebook', (req, res, next) => passport.authenticate('facebook', {
    scope   : [
        'manage_pages',
        'publish_pages'
    ],
    state   : req.query.shops,
    display : 'popup'
})(req, res, next));




/**
 *  ------------- callback page -------------
 */
router.get('/pages', passport.authenticate('facebook',{failureRedirect:'/login'}), csrfProtection, (req, res) => {
    new Promise((resolve, reject) => request({
        url: `${config.OS.ENDPOINT}/shops?ids=${req.query.state}`,
        method: 'GET',
        headers : {
            'Content-Type'  : 'application/json'
        },  
        auth: {
            'user': config.OS.ID,
            'pass': config.OS.KEY
        }
    }, (error, resp, body) => {
        if(resp.statusCode <= 200){
            let result = null;
            try {result = JSON.parse(body)} catch(e) {result = null} finally {result = result || {}}
            //resolve(((result.data || {}).shops || []).shift() || {});
            resolve(((result.data || {}).rows || []).shift() || {});
        } else {
            res.status(500).end(`Error: ${body || error.toString()}`);
        }
    }))
    .then(shop => FB.api('me/accounts', result => {

        var headerStyle = `
        <style>
                /*the container must be positioned relative:*/
                .custom-select {
                  position: relative;
                  font-size: 14px;
                }
                
                .custom-select select {
                  display: none; /*hide original SELECT element:*/
                }
                
                .select-selected {
                  background-color: white;
                }
                
                /*style the arrow inside the select element:*/
                .select-selected:after {
                  position: absolute;
                  content: "";
                  top: 14px;
                  right: 10px;
                  width: 0;
                  height: 0;
                  border: 6px solid transparent;
                  border-color: #000 transparent transparent transparent;
                }
                
                /*point the arrow upwards when the select box is open (active):*/
                .select-selected.select-arrow-active:after {
                  border-color: transparent transparent #fff transparent;
                  top: 7px;
                }
                
                /*style the items (options), including the selected item:*/
                .select-items div {
                  color: #000000;
                  padding: 8px 16px;
                  border: 1px solid transparent;
                  
                  cursor: pointer;
                  user-select: none;
                }
                
                .select-selected {
                  color: #000000;
                  padding: 8px 16px;
                  border: 1px solid transparent;
                  border-color: rgba(0, 0, 0, 0.1);
                  border-radius: 2px;
                  cursor: pointer;
                  user-select: none;
                }
                
                /*style items (options):*/
                .select-items {
                  position: absolute;
                  background-color: white;
                  top: 100%;
                  left: 0;
                  right: 0;
                  z-index: 99;
                }
                
                /*hide the items when the select box is closed:*/
                .select-hide {
                  display: none;
                }
                
                .select-items div:hover, .same-as-selected {
                  background-color: rgba(0, 0, 0, 0.1);
                }
        </style>
        `;

        var contentScript = `
        <script>
                var x, i, j, selElmnt, a, b, c;
                /*look for any elements with the class "custom-select":*/
                x = document.getElementsByClassName("custom-select");
                for (i = 0; i < x.length; i++) {
                  selElmnt = x[i].getElementsByTagName("select")[0];
                  /*for each element, create a new DIV that will act as the selected item:*/
                  a = document.createElement("DIV");
                  a.setAttribute("class", "select-selected");
                  a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
                  x[i].appendChild(a);
                  /*for each element, create a new DIV that will contain the option list:*/
                  b = document.createElement("DIV");
                  b.setAttribute("class", "select-items select-hide");
                  for (j = 1; j < selElmnt.length; j++) {
                    /*for each option in the original select element,
                    create a new DIV that will act as an option item:*/
                    c = document.createElement("DIV");
                    c.innerHTML = selElmnt.options[j].innerHTML;
                    c.addEventListener("click", function(e) {
                        /*when an item is clicked, update the original select box,
                        and the selected item:*/
                        var y, i, k, s, h;
                        s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                        h = this.parentNode.previousSibling;
                        for (i = 0; i < s.length; i++) {
                          if (s.options[i].innerHTML == this.innerHTML) {
                            s.selectedIndex = i;
                            h.innerHTML = this.innerHTML;
                            y = this.parentNode.getElementsByClassName("same-as-selected");
                            for (k = 0; k < y.length; k++) {
                              y[k].removeAttribute("class");
                            }
                            this.setAttribute("class", "same-as-selected");
                            break;
                          }
                        }
                        h.click();
                    });
                    b.appendChild(c);
                  }
                  x[i].appendChild(b);
                  a.addEventListener("click", function(e) {
                      /*when the select box is clicked, close any other select boxes,
                      and open/close the current select box:*/
                      e.stopPropagation();
                      closeAllSelect(this);
                      this.nextSibling.classList.toggle("select-hide");
                      this.classList.toggle("select-arrow-active");
                    });
                }
                function closeAllSelect(elmnt) {
                  /*a function that will close all select boxes in the document,
                  except the current select box:*/
                  var x, y, i, arrNo = [];
                  x = document.getElementsByClassName("select-items");
                  y = document.getElementsByClassName("select-selected");
                  for (i = 0; i < y.length; i++) {
                    if (elmnt == y[i]) {
                      arrNo.push(i)
                    } else {
                      y[i].classList.remove("select-arrow-active");
                    }
                  }
                  for (i = 0; i < x.length; i++) {
                    if (arrNo.indexOf(i)) {
                      x[i].classList.add("select-hide");
                    }
                  }
                }
                /*if the user clicks anywhere outside the select box,
                then close all select boxes:*/
                document.addEventListener("click", closeAllSelect);
        </script>
        `;

        res.set('Content-Type', 'text/html');
        // res.end(Buffer.from('<html>' +
        //     '<head>' +
        //         '<meta charset="utf-8"/>' +
        //         '<title>Pairing</title>' +
        //     '</head>' +
        //     '<body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100%;">' +
        //         '<p style="margin: 0 auto; color: #808080;">Please select the facebook page that you want to connect with OneShop.</p>' +
        //         '<form' +
        //             ' style="display: flex; flex-direction: row; align-items: center; justify-content: center; padding: 0; margin: 20px 0 0;"' +
        //             ' action="/shops/' + (shop.id || 0)+ '/pages"' +
        //             ' method="POST"' +
        //         '>' +
        //             '<div style="display: flex; justify-content: center; align-items: center;">' +
        //                 `<img src="${(shop.logo || "").length > 0 ? shop.logo : (shop.channel || {}).logo}" height="25"/>` +
        //                 '&nbsp;&nbsp;' +
        //                 '<b>' + (shop.name || "") + '</b>' +
        //                 '<input type="hidden" name="_csrf" value="' + req.csrfToken() + '">' +
        //             '</div>' +
        //             '<div style="margin: 0 10px;"> => </div>' +
        //             '<div>' +
        //                 '<select' +
        //                     ' name="page"' +
        //                     ' onchange="!(!this.value && alert()) && this.form.submit()"' +
        //                 '>' +
        //                     '<option value="">-- Please Select --</option>' +
        //                     ((result || {}).data || []).map(p => {
        //                         return '<option value="' + p.id + ':' + p.access_token + '">' + p.name + '</option>';
        //                     }).join('') +
        //                 '</select>' +
        //             '</div>' +
        //         '</form>' +
        //     '</body>' +
        // '</html>'));

        res.end(Buffer.from('<html>' +
            '<head>' +
                '<meta charset="utf-8"/>' +
                '<title>Pairing</title>' +
                headerStyle +
            '</head>' +
            '<body style="margin: 0; padding: 0; display: flex;  align-items: center; flex-direction: column; height: 100%; background-color: #885FBD; font-family:  Arial, Helvetica, sans-serif;">' +
                '<div style="background-color: #eeeeee; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 60px 30px 60px; margin: 100px 0 0;">' + 
                    '<img src="https://oneshop.cloud/assets/img/logo.png" style="width:150px;height:auto; margin: 0px 0px 40px 0px;" />' + 
                    '<b style="margin: 0 auto; color: black; font-size: 16px; width:400px; text-align: center;">Please select the facebook page that you want to connect with OneShop.</b>' +
                    '<form' +
                        ' style="margin: 0;"' +
                        ' action="/shops/' + (shop.id || 0)+ '/pages"' +
                        ' method="POST"' +
                    '>' +
                        '<div style="display: flex; justify-content: center; align-items: center;">' +
                            `<img src="" height="25"/>` +
                            '&nbsp;&nbsp;' +
                            '<input type="hidden" name="_csrf" value="' + req.csrfToken() + '">' +
                        '</div>' +
                        '<div class="custom-select" style="width:260px;">' +
                            '<select' +
                                ' name="page"' +
                                ' onchange="!(!this.value && alert()) && this.form.submit()"' +
                            '>' +
                                '<option value="">-- Please Select --</option>' +
                                ((result || {}).data || []).map(p => {
                                    return '<option value="' + p.id + ':' + p.access_token + '">' + p.name + '</option>';
                                }).join('') +
                            '</select>' +
                        '</div>' +
                    '</form>' +
                '</div>' +  
                contentScript+  
            '</body>' +
        '</html>'));
    }))
    .catch(error => {
        res.status(500).end(error);
    });
});




/**
 *  ------------- Match page with shop -------------
 */
router.post('/shops/:shopId/pages', urlencodedParser, csrfProtection, (req, res) => {
    var shopId = req.params.shopId || '';
    var pageId = (req.body.page || '').split(':');
    var token = pageId.pop() || '';
    pageId = pageId.shift() || '';
    var output = '<html>' +
        '<head>' +
            '<meta charset="utf-8"/>' +
            '<title>Matching...</title>' +
        '</head>' +
        '<body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100%;">' +
            '<p style="color: #808080;">Failed. This window will automatically close in <span id="countdown" style="color: #fb9e9e; font-weight: 600;">5</span>s.</p>' +
            '<a style="display: inline-block; background-color: #3257a3;color: #fff; padding: 3px 20px; text-decoration: none; border-radius: 5px;" href="javascript:window.close();">Done</a>' +
            '<script>' +
                'var timer = setInterval(function() {' +
                    'var current = parseInt(document.getElementById("countdown").innerText);' +
                    '--current < 1 ? window.close() : (document.getElementById("countdown").innerText = current);' +
                '}, 1000);' +
            '</script>' +
        '</body>' +
    '</html>';
    // make sure page id, token and shop id are existed
    if (!(pageId.length > 0 && token.length > 0 && shopId.length > 0)) {
        // output result
        res.set('Content-Type', 'text/html');
        res.end(Buffer.from(output));
    } else {
        // update shop status
        request({
            url: config.OS.ENDPOINT + '/shops/' + shopId,
            method: 'PUT',
            headers: {
                'content-type': 'application/json'
            },
            auth: {
                'user': config.OS.ID,
                'pass': config.OS.KEY
            },
            body: JSON.stringify({
                status: 'ACTIVE'
            })
        }, (error, resp, body) => {
            // setup result container
            var result = null;
            // parse result
            try {result = JSON.parse(body)} catch(e) {result = null} finally {result = result || {}}
            // shop status updated
            if (!result.result) {
                // output result
                res.set('Content-Type', 'text/html');
                res.end(Buffer.from(output));
            } else {

                
                new Promise((resolve, reject) => {
                    // fetch shops
                    db.query(`SELECT * FROM tokens WHERE shop_id = ?`, [shopId])
                    // fetch shop info
                    .then(rows => resolve(rows))
                    // db error
                    .catch(reject);
                })
                .then(rows => new Promise((resolve, reject) => {
                    // store query string for the case of found out the record
                    var qry = `UPDATE tokens SET page_id = "${pageId}", token = "${token}"  WHERE shop_id = ${shopId}`;
                    // store query string for the case of NOT found the record
                    if ((rows || []).length < 1) {
                        qry = `INSERT INTO tokens (shop_id, page_id, token) VALUES (${shopId}, "${pageId}", "${token}")`;
                    }
                    // save latest token info
                    db.query(qry)
                    .then((res) => {
                        // success
                        if(res.affectedRows){
                            var redirectUrl = `https://panel.oneshop.cloud/shops/${shopId}/settings`
                            // set output
                            output = '<html>' +
                                '<head>' +
                                    '<meta charset="utf-8"/>' +
                                    '<title>Matching...</title>' +
                                '</head>' +
                                '<body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100%;">' +
                                    '<p style="color: #808080;">All set. This window will automatically back to panel in <span id="countdown" style="color: #fb9e9e; font-weight: 600;">5</span>s.</p>' +
                                    `<a style="display: inline-block; background-color: #3257a3;color: #fff; padding: 3px 20px; text-decoration: none; border-radius: 5px;" href="javascript:location.replace('${redirectUrl}');">Done</a>` +
                                    '<script>' +
                                        'var timer = setInterval(function() {' +
                                            'var current = parseInt(document.getElementById("countdown").innerText);' +
                                            `--current < 1 ? location.replace('${redirectUrl}') : (document.getElementById("countdown").innerText = current);` +
                                        '}, 1000);' +
                                    '</script>' +
                                '</body>' +
                            '</html>';
                        }
                        // output result
                        res.set('Content-Type', 'text/html');
                        res.end(Buffer.from(output));
                    })
                    // db error?
                    .catch(err => {
                        // output result
                        res.set('Content-Type', 'text/html');
                        res.end(Buffer.from(output));
                    });
                }))
                // db error?
                .catch(err => {
                    // output result
                    res.set('Content-Type', 'text/html');
                    res.end(Buffer.from(output));
                });

                // save token info
                // db.query("REPLACE INTO `tokens` (`shop_id`,`page_id`,`token`) VALUES (?, ?, ?)", [shopId, pageId, token])
                // .then((res) => {
                //     // success
                //     if(res.affectedRows){
                //         // set output
                //         output = '<html>' +
                //             '<head>' +
                //                 '<meta charset="utf-8"/>' +
                //                 '<title>Matching...</title>' +
                //             '</head>' +
                //             '<body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100%;">' +
                //                 '<p style="color: #808080;">All set. This window will automatically close in <span id="countdown" style="color: #fb9e9e; font-weight: 600;">5</span>s.</p>' +
                //                 '<a style="display: inline-block; background-color: #3257a3;color: #fff; padding: 3px 20px; text-decoration: none; border-radius: 5px;" href="javascript:window.close();">Done</a>' +
                //                 '<script>' +
                //                     'var timer = setInterval(function() {' +
                //                         'var current = parseInt(document.getElementById("countdown").innerText);' +
                //                         '--current < 1 ? window.close() : (document.getElementById("countdown").innerText = current);' +
                //                     '}, 1000);' +
                //                 '</script>' +
                //             '</body>' +
                //         '</html>';
                //     }
                //     // output result
                //     res.set('Content-Type', 'text/html');
                //     res.end(Buffer.from(output));
                // })
                // // db error?
                // .catch(err => {
                //     // output result
                //     res.set('Content-Type', 'text/html');
                //     res.end(Buffer.from(output));
                // });

            }
        });
    }
});


module.exports = router;