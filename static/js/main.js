var ref = {
  'monday': getMonday(new Date()),
  'lastUpdate': new Date()
};

$('document').ready(function() {
    $.ajax({
      type: "GET",
      url: "/settings?json=true", 
      data: {
        'settings': ref.settings
      },
      statusCode: { 
        500: function() {
          alert("There's been a server error. Contact NLTL for assistance.");
        }
      },
      success: function(data) {
        $('li#username').children('a').text(data.name);
        ref.settings = data.settings;

        if (typeof(ref.settings.rows[0]) != "object") { // if it's the old settings format
          for (var i = 0; i < ref.settings.rows.length; i++)
            ref.settings.rows[i] = [ref.settings.rows[i], i+1];
          setSettings(ref.settings, function() {});
        }
        renderRows(ref.settings.rows);
      }
    });
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
      },
      200: function() {
        if ($('#saveIndicator').children('span')[0].classList[1] == "glyphicon-ban-circle")
          $('#saveIndicator').children('span').attr("class", "glyphicon glyphicon-ok-circle").parent().attr("data-original-title", "All data is saved."); 
      }
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
      ref.friday = data.friday;
      getReminders();
      drawDates();
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
    $(ta).parent().children(".tabuttons").children('.done').html('<span class="glyphicon glyphicon-unchecked"></span>')
    if (d[ta.id]) {
      $(ta).val(d[ta.id][0]);
      if (d[ta.id][1]) {
        $(ta).css("text-decoration", "line-through");
        $(ta).parent().children(".tabuttons").children('.done').html('<span class="glyphicon glyphicon-check"></span>')
      }
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

function getReminders() {
  $('textarea').each(function() {
    $(this).children('div').children('button.reminderSet').css('color', '');
  });
  $.ajax({
    type: "GET",
    url: "/reminders",
    data: {
      today: new Date().toISOString().slice(0,10)
    },
    success: function(data) {
      ref.reminders = data;

      data.sort(function(a, b) { // sort the reminders, so that the ones with due dates the first get shown first.
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      $('.notifications').html(""); // reset notifications
      for (var r in data) { // render notifications
        var dd = (new Date(data[r].dueDate).getMonth()+1) + '/' + new Date(data[r].dueDate).getDate();
        $('.notifications').append('<li><a href="#" class="reminder" style="background-color: '+data[r].colorCode+'">'+data[r].description+'<br>Due Date: '+data[r].dueDate+'</a></li>');
      }
      $('#numNotifications').text(data.length); // add counter
    }
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

  var ccs = "";
  for (var key in ref.settings.colorCode) {
    if (key == 'codeWhite')
      ccs = ccs+ '<li><a data-target="#" class="'+key+' cc">ø</a></li>';
    else
      ccs = ccs+ '<li><a data-target="#" class="'+key+' cc" style="color:'+ref.settings.colorCode[key]+'">&#x25a0;</a></li>';
  }

  var buttongroup = '\
  <div class="btn-group tabuttons" style="display: none;">\
  <button class="btn btn-default btn-xs reminderSet"><span class="glyphicon glyphicon-exclamation-sign"></span></button>\
  <button class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown"><span class=caret></span></button>\
  <button class="done btn btn-default btn-xs"><span class="glyphicon glyphicon-ok"></span></button>\
  <ul class="dropdown-menu cCodes" role="menu" width="20px">'+ccs+'</ul>\
  </div>';
  if ($('.container').width() >= 720) {
    $("#planner").html("");
    for (var i = 0; i < rows.length; i++) {
      var row = $("#planner").append('<div class="row"></div>');
      // set ID to rows[i][1] 
      row.append('<div class="subj col-sm-2" id="'+rows[i][1]+'">\
        <span class="subjectspan">'+rows[i][0]+'</span> <span class="subjbtns" style="display: none;">\
        <button class="edit btn btn-default btn-xs"">\<span class="glyphicon glyphicon-edit"></span></button>\
        <button class="delete btn btn-xs btn-danger">-</button></span></div>');
      for (var j = 1; j <= 5; j++) {
        row.append('<div class="col-sm-2"><textarea class="ta" id="'+ String(rows[i][1]) + String(j)+'"></textarea>' + buttongroup + '</div>');
      }
    }
    var labs = $("#planner").append('<div class="row"></div>');
    labs.append('<div class="subj col-sm-2" id="0">Labs</div>');

    for (var j = 1; j <= 5; j++) {
      labs.append('<div class="col-sm-2"><textarea class="labs ta" id="0' + String(j)+'"></textarea>'+ buttongroup +'</div>');
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
        row.append('<div class="col-sm-2"><h4>'+rows[i][0]+'</h4><textarea class="ta" id="'+ String(rows[i][1]) + String(j)+'"></textarea></div>')
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
      if (index == 4)
        $(element).html('<span>' + 'Friday ' + (ref.friday || '') + ' ' + '</span> ' + (d.getMonth()+1) + '/' + d.getDate());
      else
        $(element).html('<span>' + $(element).children('span').html() + '</span> ' + (d.getMonth()+1) + '/' + d.getDate());
      if (isToday)
        $(element).children('span').attr('id', 'today')
      else
        $(element).children('span').attr('id', ''); 
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