/* 
  Event Handlers
*/
$('document').ready(function() {
  /* 
    Navigation Buttons
  */

  drawDates();
  getAnnouncements(setAnnouncementValues);

  $('#save').click(function() {
    saveAnnouncements(getAnnouncementValues());
  });
  $('#back').click(function() {
    if (!ref.turnInProgress) {
      ref.turnInProgress = true;
      // animation
      saveAnnouncements(getAnnouncementValues()); // save the current state
      ref.monday = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() - 7); // decrement by 1 week
      getAnnouncements(function(o) {
        $("#stuff").slide($(window).width(), 200, function() {
          setAnnouncementValues(o);
          ref.turnInProgress = false;
        });
      });
    }
  });
  $('#next').click(function() {
    if (!ref.turnInProgress) {
      ref.turnInProgress = true;
      saveAnnouncements(getAnnouncementValues()); // save the current state
      ref.monday = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() + 7);

      getAnnouncements(function(o) {
        $("#stuff").slide(-$(window).width(), 200, function() {
          setAnnouncementValues(o);
          ref.turnInProgress = false;
        });
      });
    }
  });
});

function getAnnouncementValues() {
  var d = {};
  $("textarea").each(function() {
    d[$(this).attr("id")] = $(this).val();
  });
  $("input").each(function() {
    d[$(this).attr("id")] = $(this).val();
  });
  return d;
}
function setAnnouncementValues(o) {
  $("textarea").each(function() {
    $(this).val(o[$(this).attr('id')] || "");
  });
  $("input").each(function() {
    $(this).val(o[$(this).attr('id')] || "");
  });
}

function saveAnnouncements(o) {
  $.ajax({ // now get a new auth cookie from couch
    type: "POST",
    url: "/announcements", 
    data: {
      'monday': ref.monday.toISOString().slice(0, 10),
      'data': JSON.stringify(o)
    },
    statusCode: {
      500: function() {
        alert("There's been a server error. Contact NLTL for assistance.");
      },
      200: function() {
        if ($('#save').children('span')[0].classList[1] == "glyphicon-ban-circle")
          $('#save').children('span').attr("class", "glyphicon glyphicon-ok-circle").parent().attr("data-original-title", "All data is saved."); 
      }
    }
  });
  ref.lastUpdate = new Date(); 
}

function getAnnouncements(c) {
  $.ajax({
    type: "GET",
    url: "/announcements",
    data: {
      monday: ref.monday.toISOString().slice(0, 10) 
    },
    statusCode: {
      404: function(data) { // if week doesn't exist
        drawDates();
        c({});
      },
      500: function() {
        alert("There's been a server error. Contact NLTL for assistance.");
      }
    },
    success: function(data) {
      drawDates();
      c(JSON.parse(data.announcements));
    }
  });
}
