var http = require('http');
var https = require('https');
// validate user with req.body.username and req.body.password.
module.exports = {
  get: function(req, res) { // render login page.
    if (req.session.username)
      res.redirect('/');
    else {
      if (req.param('why') == 'incorrect')
        res.render('signin.html', {error: 'The username and password entered is incorrect.'});
      else if (req.param('why') == 'whitelist')
        res.render('signin.html', {error: 'You do not have permission to use the planbook. If this is a mistake, contact Andrew Milich or Davis Haupt.'});
      else
        res.render('signin.html', {error: ''});
    }
  },
  post: function(req, res) { // login with req.body.username and req.body.password
    if (!req.body.password) {
      res.redirect('/login?why=incorrect'); // fix bug where empty password lets you login BUTTEN!!!
    } else {
      login(req, res);
    }
  }
};

function login(req, res) {
  res.type('text/json');
  validateUser(req.body.username, req.body.password, function(result) {
    if (!result.error) { // if there wasn't an error logging in,
      req.body.username = result.username; // make sure they're in the right format, not davis_haupt but c17dh
      // check if they exist in our db:
      db.collection("users").find({'name': req.body.username}).toArray(function(err, docs) {
        if (!err) {
          if (docs[0]) { // if they exist,
            // update analytics fields
            // we don't really care if/when this finishes, so no callback.
            db.collection("users").update({'_id': docs[0]._id}, {
              $set: { 'lastLogin': new Date(), 'lastAccess': new Date() }
            });
            if (!docs[0].fullname) { // if we haven't had the chance to update with metadata
              db.collection("users").update({'_id': docs[0]._id}, {$set: {
                'ssid': result.ssid,
                'fullname': result.fullname,
                'email': result.email.toLowerCase(),
                'groups': result.groups
              }}, function(e, r) {
                req.session.username = req.body.username;
                res.redirect('/'); // redirect back to the homepage, which is now their Planner.
              });
            } else { // if we've already added the metadata, then just go ahead and log 'em in.
              req.session.username = req.body.username;
              res.redirect('/'); // redirect back to the homepage, which is now their Planner.
            }
          } else { // if they don't exist in the DB, sign them up.
            signup(req, res);
          }
        } else {
          res.send(500, err);
        }
      });
    } else {
      res.send(404, {message: 'the username and password do not match.'});
    }
  });
}
/**
 * add user to db
 */
function signup(req, res) {
  res.type('text/json');
  db.collection("users").find({'name': req.body.username}).toArray(function(err, docs) {
    if (!err) {
      if (docs[0] == undefined) {
        var user = { // create the user schema
          name: req.body.username,
          settings: require('./settings.js').defaults,
          registrationDate: new Date()
        };
        db.collection("users").insert(user, function(err, result) {
          if (!err) { // if there wasn't an error adding them, then log them in again.
            // TODO: This requires sending requests to Dalton twice, which is kind of redundant.
            login(req, res);
          }
          else
            res.send(500, err);
        });
      } else {
        // res.send(403, {'message': 'The username and password already exist.'});
        res.redirect('/login?why=incorrect');
      }
    } else {
      res.send(500, err);
    }
  });
}

/**
 *
 * @param username
 * @param password in plaintext
 * @param callback is passed the JSON response or error from the request.
 */
function validateUser(username, password, callback) {
  var options = {
    method: 'POST',
    host: 'sandbox.dalton.org',
    path: '/webapps/auth/index.php/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': 'username=temp&password=temp'.length
    }
  };

  https.request(options, function(res) {
    res.on('data', function(t) {
      // get the token from the response object. if this doesn't work we're fucked so don't catch the parse error.
      var token = JSON.parse(t.toString()).token;
      var s = 'username='+username+'&password='+password+'&token='+token; // query string
      // keep the options object, cuz some parts are useful and no reason not to.
      options.path='/webapps/auth/index.php/login'; // change the url it's going to request though
      options.headers['Content-Length'] = s.length; // change the length too, for a different query string.
      var req2 = https.request(options, function(res2) { // make the request
        res2.on('data', function(l) {
          var d;
          try { // try to parse the JSON. if it returns something that isn't JSON, pass down an error.
            d = JSON.parse(l.toString());
          } catch(e) {
            d = {error: "could not parse response."};
          }
          callback && callback(d);
        });
      }).end(s);
    });
  }).end('username=temp&password=temp');
}