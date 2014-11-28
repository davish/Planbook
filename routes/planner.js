var fridays = require('./fridays.js');
module.exports = {
  get: function(req, res) { // get this week's assignments, with req.session.username, req.body.monday.
    res.type('text/json');
    db.collection("assignments").find({$and: [{'name': req.session.username}, {'monday': req.param('monday')}]}).toArray(function(err, docs) {
      if (docs[0])
        res.send({'assignments': docs[0].data, 'friday': fridays[req.param('monday')]});
      else
        res.send(404, {'friday': fridays[req.param('monday')]}); // client deals with the 404.
    });
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