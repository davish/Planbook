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
      res.redirect('/login?why=incorrect')
    } else {
      login(req, res);
    }
  }
};

function login(req, res) {
  res.type('text/json');
  var options = {host: 'compsci.dalton.org',port: 8080, path: '/zbuttenwieser/validation/index.jsp?username='+req.body.username+'&password='+req.body.password};
  http.get(options, function(r) {
    switch (r.statusCode) {
      case 200: // user exists in Dalton db
        // check if they exist in our db:
        db.collection("users").find({'name': req.body.username}).toArray(function(err, docs) {
          if (!err) {
            if (docs[0]) {
              // check if they have their schedule credentials in their account.
              // update the lastLogin field, which is used for analytics
              db.collection("users").findOneAndUpdate({'name': req.body.username}, {$set: {'lastLogin': new Date(), 'lastAccess': new Date()}}, 
                function(err, result) {
                  req.session.username = req.body.username;
                  res.redirect('/'); // redirect back to the homepage, which is now the Planner.
                }
              );
            } else {
              signup(req, res);
            }
          } else {
            res.send(500, err);
          }
        });
        break;
      case 404: // not found in Dalton
        // res.send(404, {'message': 'The username and password entered do not match.'});
        res.redirect('/login?why=incorrect');
        break;
    }
  }).on('error', function(e) {
    res.end(500);
  });
}
// add user to db
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
          if (!err) {
            login(req, res);
          }
          else
            res.send(500, err);
        });
      } else {
        // res.send(403, {'message': 'The username and password already exist.'});
        res.redirect('/login?why=incorrect')
      }
    } else {
      res.send(500, err);
    }
  });
}