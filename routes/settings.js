module.exports = {
  get: function(req, res) { // get req.session.username's settings and return it in JSON.
    res.type('text/json');
    db.collection("users").find({'name': req.session.username}).toArray(function (err, docs) {
      if (!err) {
        if (docs[0]) {
          s = docs[0].settings;
          var toAdd = 0;
          for (var key in settingsDefaults) {
            if (!s[key]) { // if the default isn't in there
              toAdd++;
              s[key] = settingsDefaults[key]; // add it to settings
            }
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

var settingsDefaults = {
                      'reminders': 
                        {
                          'codeRed':    {startReminding: '7', interval: '1'},
                          'codeYellow': {startReminding: '4', interval: '2'},
                          'codeGreen':  {startReminding: '0', interval: '0'}
                        }
                      }