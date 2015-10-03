var fridays = require('./fridays.js');
module.exports = {
  get: function(req, res) { // get this week's assignments, with req.session.username, req.body.monday.
    res.type('text/json');
    if (req.session.username) {
      db.collection("assignments").find({$and: [{'name': req.session.username}, {'monday': req.param('monday')}]}).toArray(function(err, week) {
        db.collection("announcements").find({'monday': req.param('monday')}).toArray(function(err, announcements) {
          if (week[0]) {
            res.send({'assignments': week[0].data, 'friday': fridays[req.param('monday')], 'announcements': announcements[0] ? announcements[0].data: '{}'});
          }
          else {
            res.send({'assignments': '{}', 'friday': fridays[req.param('monday')], 'announcements': announcements[0] ? announcements[0].data: '{}'});
          }
        });
      });
      db.collection("users").findOneAndUpdate({'name': req.session.username}, {$set: {'lastAccess': new Date()}}, function(err, result) {
        // don't do anything, just be happy! this doesn't really matter if it fails.
      });
    }
    else {
      res.send(403);
    }

  },
  post: function(req, res) { // update this week's assignments, with req.session.username, req.body.monday and req.body.data
    res.type('text/json');
    var assignments = db.collection("assignments").find(
    {
      $and: 
      [
        {'name': req.session.username},
        {'monday': req.body.monday}
      ]
    }).toArray(function(err, docs) {
      if (!err) {
        if (docs[0]) { // doc exists
          db.collection("assignments").findOneAndUpdate({_id: docs[0]._id}, {
            $set: {'data': req.body.data}
          }, function (err, result) {
            if (!err)
              res.send(200);
            else
              res.send(500, err);
          });
        } else {
          db.collection("assignments").insert({
            'name': req.session.username, 'monday': req.body.monday, 'data': req.body.data}, 
          function(err, result) {
            if (!err)
              res.send(200);
            else
              res.send(500, err);
          });
        }
      } else {
        res.send(500, err);
      }
    });
  }
}