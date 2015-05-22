/**
 * Created by davis on 5/22/15.
 */
module.exports = {
  get: function(req, res) {
    if (req.session.username) {
      res.type("text/json");
      res.send({"username": req.session.username});
    } else {
      res.redirect('/');
    }
  },
  post: function(req, res) {

  }
};