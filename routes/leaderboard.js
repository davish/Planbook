/**
 * Created by davis on 5/22/15.
 */
module.exports = {
  get: function(req, res) {
    if (req.session.username) {
      res.type("text/json");
      db.collection('scores').find({}).sort({score: -1}).limit(10).toArray(function(err, result) {
        db.collection('scores').find({username: req.session.username}).sort({score:-1}).limit(1).toArray(function(err, r2) {
          res.send({
            "username": req.session.username,
            "scores": result,
            "highscore": r2 ? r2[0] : {score: 0}
          })
        });
      });
    } else {
      res.redirect('/');
    }
  },
  post: function(req, res) {
    db.collection("scores").insert({
      fullname: req.session.fullname,
      username: req.session.username,
      timestamp: new Date(),
      score: parseInt(req.body.score),
      game: 'snake'
    }, function(err, result) {
      if (!err) {
        res.send({success: 'true', result: result});
      }
    });
  }
};