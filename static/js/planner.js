var ref = {
  'monday': getMonday(new Date()),
  'lastUpdate': new Date()
};

$('document').ready(function() {
  $('.stuff').hide();
  $('.mAll').hide();
  $('.navbar').hide();
  $.ajax({
    url: "/session",
    success: function(data) {
      if (data.username) {
        ref.user = data.username;
        $('.stuff').show();
        $('.navbar').show()
        $('.mAll').show();
        $('li#username').children('a').text(ref.user);
        $('.loggedIn').show();
        $('.loggedOut').hide();
        $('textarea').each(function(index, attribute) {
          $(this).removeAttr("disabled");
        });

        $.ajax({
          type: "GET",
          url: "/settings", 
          data: {
            'settings': ref.settings
          },
          statusCode: { 
            500: function() {
              alert("There's been a server error. Contact NLTL for assistance.");
            }
          },
          success: function(data) {
            ref.settings = data.settings;
            renderRows(ref.settings.rows);
          }
        });

      } else { // no one session for this browser found
        $('.choiceModal').modal({backdrop: 'static', 'keyboard': false});
        $('li#username').children('a').text('');
        $('.loggedIn').hide();
        $('.loggedOut').show();
        $('textarea').each(function(index, attribute) {
          $(this).attr("disabled", "");
        });
      }
    }
  });
  drawDates();
  $("#subjects").append('<div class="row"><div class="col-sm-2 col-sm-offset-10" id="year"></div></div>')
});

function saveWeek(o) {
  $.ajax({ // now get a new auth cookie from couch
    type: "POST",
    url: "/planner", 
    data: {
      'monday': ref.monday.toISOString().slice(0, 10),
      'data': JSON.stringify(o)
    },
    statusCode: {
      500: function() {
        alert("There's been a server error. Contact NLTL for assistance.");
      }
    },
    success: function(data) {
      // if you haven't updated from THIS client to the DB in a while, it's gonna do some cool shit.

    }
  });
  ref.lastUpdate = new Date(); 
}

function getWeek(c) {
  $.ajax({
    type: "GET",
    url: "/planner",
    data: {
      monday: ref.monday.toISOString().slice(0, 10) 
    },
    statusCode: {
      404: function() { // if week doesn't exist
        c(genBlankAssignments());
      },
      500: function() {
        alert("There's been a server error. Contact NLTL for assistance.");
      }
    },
    success: function(data) {
      c(JSON.parse(data.assignments));
    }
  });
}

function getAssignmentValues() {
  var d = {};
  $('textarea').each(function (index, ta) {
    // with the cell's ID as the key, put the contents of the array, 
    // and the boolean of if it's completed or not, into the object.
    
    var code = '';
    if ($(this).css("background-color") != "rgb(255, 255, 255)") {
      for (var prop in ref.settings.colorCode) {
        if (ref.settings.colorCode.hasOwnProperty(prop)) {
          if (ref.settings.colorCode[prop] === $(this).css("background-color")) {
            code = prop;
            break;
          }
        }
      }
    }
    d[ta.id] = [ta.value, $(this).css("text-decoration") == "line-through", code]; 
  });
  return d;
}

function setAssignmentValues(d) {
  $('textarea').each(function (index, ta) {
    $(ta).css("text-decoration", "none solid rgb(0, 0, 0)");
    $(ta).css("background-color", "rgb(255, 255, 255)");
    if (d[ta.id]) {
      $(ta).val(d[ta.id][0]);
      if (d[ta.id][1])
        $(ta).css("text-decoration", "line-through");
      if (d[ta.id][2])
        $(ta).css("background-color", ref.settings.colorCode[d[ta.id][2]]);
    }
    else
      $(ta).val('');
  });
}

function setSettings(s, callback) {
  $.ajax({
    type: "POST",
    url: "/settings", 
    data: {'settings': s},
    statusCode: { 
      200: callback,
      500: function() {
        alert("There's been a server error. Contact NLTL for assistance.");
      }
    },
    success: callback
  });
}

function login(user, pswd, c, fail) {
  $.ajax({ // now get a new auth cookie from couch
    type: "POST",
    url: "/login", 
    data: {
      'username': user,
      'password': pswd
    },
    statusCode: {
      403: fail,
      500: function() {
        alert("There's been a server error. Contact NLTL for assistance.");
      }
    },
    success: function(data) {
      ref.settings = data.settings;
      renderRows(ref.settings.rows);
      
      if (c) c(data);
    }
  });
}

function signup(user, pswd, c, fail) {
  $.ajax({
    type: "POST",
    url: "/signup", 
    data: {
      'username': user,
      'password': pswd
    },
    statusCode: { 
      403: fail,
      500: function() {
        alert("There's been a server error. Contact NLTL for assistance.");
      }
    },
    success: function(data) {
      location.reload(true);
    }
  });
}


function renderRows(rows) {
  var buttongroup = '<span class="tabuttons" style="display: none;"><div class="btn-group">\
  <button class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown"><span class=caret></span></button>\
  <ul class="dropdown-menu" role="menu" width="20px">\
  <li><a data-target="#" class="codeRed cc" style="color: '+ref.settings.colorCode['codeRed']+';">&#x25a0;</a></li>\
  <li><a data-target="#" class="codeYellow cc" style="color: '+ref.settings.colorCode['codeYellow']+';">&#x25a0;</a></li>\
  <li><a data-target="#" class="codeGreen cc" style="color: '+ref.settings.colorCode['codeGreen']+';">&#x25a0;</a></li>\
  <li><a data-target="#" class="codeWhite cc">ø</a></li>\
  </ul>\
  </div><button class="done btn btn-default btn-xs"><span class="glyphicon glyphicon-ok"></span></button></span></div>';
  if ($('.container').width() >= 720) {
    $("#planner").html("");
    for (var i = 0; i < rows.length; i++) {
      var row = $("#planner").append('<div class="row"></div>');
      row.append('<div class="subj col-sm-2" id="'+(i+1)+'">\
        <span class="subjectspan">'+rows[i]+'</span> <span class="subjbtns" style="display: none;">\
        <button class="edit btn btn-default btn-xs"">\<span class="glyphicon glyphicon-edit"></span></button>\
        <button class="delete btn btn-xs btn-danger">-</button></span></div>');
      for (var j = 1; j <= 5; j++) {
        row.append('<div class="col-sm-2"><textarea class="ta" id="'+ String(i+1) + String(j)+'"></textarea>' + buttongroup);
      }
    }
    var labs = $("#planner").append('<div class="row"></div>');
    labs.append('<div class="subj col-sm-2" id="0">Labs</div>');

    for (var j = 1; j <= 5; j++) {
      labs.append('<div class="col-sm-2"><textarea class="labs ta" id="0' + String(j)+'"></textarea></div>');
    }
    taListen();
    subjectListen();
    getWeek(setAssignmentValues);

  }
  else { // Mobile Site
    var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    $(".mobile").html("");
    for (var j = 1; j <= 5; j++) {
      var row = $(".mobile").append('<div class="row"></div>');
      row.append('<div class="col-sm-2"><h3>'+days[j-1]+'<h3></div>');
      for (var i = 0; i < rows.length; i++) {
        row.append('<div class="col-sm-2"><h4>'+rows[i]+'</h4><textarea class="ta" id="'+ String(i+1) + String(j)+'"></textarea></div>')
      }
    }
    taListen();
    $("textarea").each(function() {
      //$(this).prop("readonly", true);
      $(this).css("width", "50%")
    });
    drawDates();
    getWeek(setAssignmentValues);
  }

}

function getMonday(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() - 1));
}


function genBlankAssignments() {
  var d = {};
  $('textarea').each(function (index, ta) {
    d[ta.id] = ['', false];
  });
  return d;
}


function drawDates() {
  if ($('.container').width() >= 720) {
    $('.day').each(function(index, element) {
      var d = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() + index);
      var isToday = (d.getFullYear = new Date().getFullYear && d.getMonth() == new Date().getMonth() && d.getDate() == new Date().getDate())
      if (isToday)
        $(element).html('<span id="today">' + $(element).children('span').html() + '</span> ' + (d.getMonth()+1) + '/' + d.getDate());
      else
        $(element).html('<span>' + $(element).children('span').html() + '</span> ' + (d.getMonth()+1) + '/' + d.getDate());
    });
  } else {
    var i = 0;
    $('h3').each(function(index, element) {
      var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      var d = new Date(ref.monday.getFullYear(), ref.monday.getMonth(), ref.monday.getDate() + days.indexOf($(element).text()));
      var isToday = (d.getFullYear = new Date().getFullYear && d.getMonth() == new Date().getMonth() && d.getDate() == new Date().getDate())
      if (isToday)
        $(element).parent().html('<h3><em><u>'+$(element).text()+ '</u></em></h3>' + (d.getMonth()+1) + '/' + d.getDate());
      else
        $(element).parent().html('<h3>'+$(element).text()+ '</h3>' + (d.getMonth()+1) + '/' + d.getDate());
    });
  }
}

$.fn.slide = function(dist, t, c) {
  // Slide an element to the left or right by a certaind distance, in pixels.
  var element = this[0];
  var p = $(element).css("position");
  $(element).css("position", "relative");
  if (!t)
      t = 500;
  $(element).animate({
      left: "+=" + dist
  }, t, function() {
      $(element).css({left: -dist});
      $(element).animate({left: 0}, t, function() {
        if (element.id == "sidebar")
          $(element).css("left", "-1px");
      });

      if (c)
          c();
  });
  $(element).css("position", p);
}

function setReminder(obj, date, interval, metadata) {
  /*
    Structure of obj:
    Keys are Date ISOStrings, values are arrays with each reminder being an object, with metadata such as the message, duedate, subject, etc.

    Interval is in days.
    Metadata is another object, with, well, metadata.
  */

  var dueDate = new Date(date).stripTime();

  // Count backwards from the duedate, subtracting the number of days in the interval, so you get a date 
  for (var d = dueDate; d.getTime() > new Date().stripTime(); d.setDate(d.getDate() - interval)) {
    if (obj[d.toISOString().slice(0,10)])
      obj[d.toISOString().slice(0,10)].push(metadata);
    else
      obj[d.toISOString().slice(0,10)] = [metadata];
  };

  return obj;
}

Date.prototype.stripTime = function() {
  this.setMilliseconds(0)
  this.setSeconds(0);
  this.setMinutes(0);
  this.setHours(0);
  return this;
}
String.prototype.escapeHTML = function() {
    return $('<div/>').text(this).html();
};