module.exports = {
  get: function(req, res) { // get req.session.username's settings and return it in JSON.
    if (req.param("json") == "true") {    
    res.type('text/json');
      db.collection("users").find({'name': req.session.username}).toArray(function (err, docs) {
        if (!err) {
          if (docs[0]) {
            s = docs[0].settings;
            var toAdd = 0;
            for (var key in module.exports.defaults) {
              if (!s[key]) { // if the default isn't in there
                toAdd++;
                s[key] = module.exports.defaults[key]; // add it to settings
              }
            }
            if (!s['colorCode']['codeWhite']) {
              toAdd++;
              s['colorCode'] = module.exports.defaults['colorCode'];
            }
            if (toAdd) { // if anything has been added
              db.collection("users").findOneAndUpdate(
                {'name': req.session.username},
                {$set: {settings: s}},
                function(err, result) {
                  if (!err)
                    res.send({'settings': s, 'name': req.session.username})
                  else
                    res.send(500, err);
                });
            } else { // if no defaults need to be added
              res.send({'settings': docs[0].settings, 'name': req.session.username});
            }
          }
          else {
            res.send(403) // user doesn't exist; forbidden
          }
        } else {
          res.send(500, err); // err
        }
      });
    }
    else {
      res.render("settings.html");
    }
  },
  post: function(req, res) { // update req.session.username's settings with req.body.settings.
    res.type('text/json');
    db.collection("users").findOneAndUpdate(
      {'name': req.session.username}, 
      {$set: {'settings': req.body.settings}}, 
      function(err, result) {
        if (!err) {
          res.send({'settings': result.value.settings});
        } else {
          res.send(500);
        }
      }
    );
  }
};

module.exports.defaults = {
                            'rows': 
                            [
                              ["English", 1], 
                              ["History", 2], 
                              ["Math", 3], 
                              ["Science", 4], 
                              ["Language", 5],
                              ["Other", 6]
                            ],
                            'theme': "default",
                            'colorCode': 
                            {
                              codeRed:    'rgb(217, 115, 98)',
                              codeYellow: 'rgb(240, 214, 128)',
                              codeGreen:  'rgb(165, 230, 159)',
                              codeBlue:   'rgb(126, 178, 255)',
                              codeGray:   'rgb(184, 184, 184)',
                              codeWhite:  'rgb(255, 255, 255)'
                            }
                          }