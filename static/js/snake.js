function Snake(id, size, speed, callbacks) {
  this.callbacks = callbacks;
  this.SQUARE_SIZE = size;
  this.SPEED = speed; // milliseconds delay between steps 
  this.boundaries = [];

  var canvas = document.getElementById(id);
  this.grid_width = Math.floor(canvas.width / this.SQUARE_SIZE);
  this.grid_height = Math.floor(canvas.height / this.SQUARE_SIZE);
  this.ctx = null;
  this.vals = {};

  if (canvas.getContext){
    this.ctx = canvas.getContext('2d');
    this.makeBorder();
    this.reset();
  }
  canvas.tabIndex = 1000;
  canvas.addEventListener("keydown", this.onkeydown(this));
  canvas.style.outline = "none";
}

Snake.prototype.updateSnake = function(body) {
  this.clearField();
  for (var i = 0; i < body.length; i++) {
    this.fillSquare(body[i].x, body[i].y, true, "rgb(0, 100, 500)");
  };
  this.fillSquare(this.vals.head.x, this.vals.head.y, true, "rgb(0, 100, 500)");
  this.vals.snakeHistory.push({x: this.vals.head.x, y: this.vals.head.y});

}

Snake.prototype.fillSquare = function(x, y, fill, color) {
  // fill in a square on the grid based on its x and y coordinates
  if (fill) {
    this.ctx.fillStyle = color || "rgb(0,0,0)"
  } else {
    this.ctx.fillStyle = "rgb(1000, 1000, 1000)"
  }
  this.ctx.fillRect(x * this.SQUARE_SIZE + 1, y * this.SQUARE_SIZE + 1, this.SQUARE_SIZE - 2, this.SQUARE_SIZE - 2);
}

Snake.prototype.makeBorder = function() {
  // fill in the border blocks as black
  boundaries = []; // without this boundaries can get infinitely long, slowing down the game each time you reset.
  for (var i = 0; i < this.grid_width; i++) {
    this.fillSquare(i, 0, true);
    this.boundaries.push({x: i, y: 0});
    this.fillSquare(i, this.grid_height - 1, true);
    this.boundaries.push({x: i, y: this.grid_height - 1});
  }
  for (var i = 0; i < this.grid_height; i++) {
    this.fillSquare(0, i, true);
    this.boundaries.push({x: 0, y: i});
    this.fillSquare(this.grid_width - 1, i, true);
    this.boundaries.push({x: this.grid_width - 1, y: i});
  }
}

Snake.prototype.clearField = function() {
  // reset all blocks to white except for the boundaries
  for (var x = 1; x < this.grid_width-1; x++) {
    for(var y = 1; y < this.grid_height-1; y++) {
      this.fillSquare(x,y,false);
    }
  }
  this.fillSquare(this.vals.fruit.x, this.vals.fruit.y, true, "rgb(1000, 0, 0)");
}

Snake.prototype.reset = function() {
  // reset the board and snake variables
  console.log(this.vals);
  this.vals = {
    add_x: 0,
    add_y: 0,
    head: {x: 5, y: 5},
    snakeHistory: [],
    snakeLength: 0,
    fruit: {},
    pressed: false
  }
  console.log(this.vals);

  document.getElementById("score").innerHTML = this.vals.snakeLength;

  this.clearField();
  this.makeFruit();
  this.makeBorder();
  clearInterval(this.loop);
  var l = this.step;
  var t = this;
  this.loop = setInterval(function() {
    l(t);
  }, this.SPEED);
}

Snake.prototype.step = function(t) {
  // function called by setInterval() to move one step forward in game
  t.vals.pressed = false;
  t.vals.head.x += t.vals.add_x;
  t.vals.head.y += t.vals.add_y;

  var body = t.vals.snakeLength > 0 ? t.vals.snakeHistory.slice(-t.vals.snakeLength) : [];
  var forbidden = t.boundaries.concat(body);

  if (t.vals.fruit.x == t.vals.head.x && t.vals.fruit.y == t.vals.head.y) { // if you ate the fruit
    document.getElementById("score").innerHTML = ++t.vals.snakeLength;
    t.makeFruit(); // make a new one
  }

  for (var i = 0; i < forbidden.length; i++) { // check the head position against the array of stuff you can't hit in to
    if (forbidden[i].x == t.vals.head.x && forbidden[i].y == t.vals.head.y) { // if you ran into a wall or yourself
      console.log("dead");
      t.gameOver();
      return;
    }
  }
  t.updateSnake(body);
}

Snake.prototype.makeFruit = function() {
  var rand_x = Math.floor(Math.random() * (this.grid_width - 3)+1); // 50-3=47; 0 to 47+1 is 1 to 48
  var rand_y = Math.floor(Math.random() * (this.grid_height - 3)+1);

  while ((rand_x <= 0 || rand_x >= this.grid_width - 1)) {
    rand_x = Math.round(Math.random() * this.grid_width - 1);
  }
  while (rand_y <= 0 || rand_y >= this.grid_height - 1) {
    rand_y = Math.round(Math.random() * this.grid_height - 1);
  }

  this.vals.fruit.x = rand_x;
  this.vals.fruit.y = rand_y;
}

Snake.prototype.gameOver = function() {
  clearInterval(this.loop);
  this.callbacks.gameover(this.vals.snakeLength);
  this.makeBorder();
}

Snake.prototype.onkeydown = function(t) {
  // clockwise starting from left arrow 37-40
  // event handler
  return function(event) {
    if (event.which == 37 && (t.vals.snakeLength == 0|| t.vals.add_x != 1) && !t.vals.pressed) {
      // left
      t.vals.add_x = -1;
      t.vals.add_y = 0;
      event.preventDefault();
      event.returnValue = false;
      t.vals.pressed = true;
    } else if (event.which == 38 && (t.vals.snakeLength == 0|| t.vals.add_y != 1) && !t.vals.pressed) {
      // up
      t.vals.add_x = 0;
      t.vals.add_y = -1;
      event.preventDefault();
      event.returnValue = false;
      t.vals.pressed = true;
    } else if (event.which == 39 && (t.vals.snakeLength == 0|| t.vals.add_x != -1) && !t.vals.pressed) {
      // right
      t.vals.add_x = 1;
      t.vals.add_y = 0;
      event.preventDefault();
      event.returnValue = false;
      t.vals.pressed = true;
    } else if (event.which == 40 && (t.vals.snakeLength == 0|| t.vals.add_y != -1) && !t.vals.pressed) {
      // down
      t.vals.add_x = 0;
      t.vals.add_y = 1;
      event.preventDefault();
      event.returnValue = false;
      t.vals.pressed = true;
    }
  }
};