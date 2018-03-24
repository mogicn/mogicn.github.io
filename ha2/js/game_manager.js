function GameManager(options) {
  this.winningNumber = options.contents.length;
  this.size          = 4; // Size of the grid
  this.difficulty    = options.difficulty || (this.size * this.size - 1);
  this.inputManager  = new KeyboardInputManager;
  this.scoreManager  = new LocalScoreManager;
  this.actuator      = new HTMLActuator(options.contents);
  this.aiEnabled     = false;
  this.aiTimer       = null;

  this.startTiles   = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.inputManager.on("hint", this.hint.bind(this));

  this.inputManager.on('ai', function() {
    this.startAI(!this.aiEnabled);
  }.bind(this));

  this.setup();
  this.startAI(false);
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.continue();
  this.setup();
  this.startAI(false);
};

// Keep playing after winning
GameManager.prototype.keepPlaying = function () {
  this.actuator.continue();
  this.setup();
  this.startAI(true);
};

GameManager.prototype.isGameTerminated = function () {
  if (this.over || this.won) {
    return true;
  } else {
    return false;
  }
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid        = new Grid(this.size);

  this.score       = 0;
  this.over        = false;
  this.won         = false;

  // Add the initial tiles
  this.addStartTiles();

  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var exponent = this.createNumber();
    var tile = new Tile(this.grid.randomAvailableCell(), exponent);

    this.grid.insertTile(tile);
  }
};

GameManager.prototype.createNumber = function () {
  var minMax = this.findMinMaxNumber(), min = minMax[0], max = minMax[1];
  var n = (max + 1) - this.difficulty;
  if (n > min) n = min;
  if (n < 1) n = 1;
  return n;
};

GameManager.prototype.findMinMaxNumber = function () {
  var min = 0, max = 0, tile;
  for (var x = 0; x < this.grid.size; x++) {
    for (var y = 0; y < this.grid.size; y++) {
      if (tile = this.grid.cells[x][y]) {
        if (!min || min > tile.exponent) {
          min = tile.exponent;
        }
        if (max < tile.exponent) {
          max = tile.exponent;
        }
      }
    }
  }
  return [min, max];
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.scoreManager.get() < this.score) {
    this.scoreManager.set(this.score);
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.scoreManager.get(),
    terminated: this.isGameTerminated()
  });

};

// Creates a timer that will cause the AI to make a single move.
GameManager.prototype.aiMove = function () {
  var self = this;
  if (!this.aiEnabled || this.isGameTerminated()) return; // Don't do anything if the game's over

  if(this.aiTimer != null) {
    clearTimeout(this.aiTimer)
    this.aiTimer = null;
  }

  this.aiTimer = setTimeout(function(){
    self.aiTimer = null;
    self.move(JS_MinimaxBestMove(self.grid.cells));
    self.aiMove();
  }, 100);
};

GameManager.prototype.startAI = function (start) {
  if (start) {
    this.aiEnabled = true;
    this.aiMove();
    this.actuator.setAIButton(0);
  } else {
    this.aiEnabled = false;
    this.actuator.setAIButton(1);
  }
};

GameManager.prototype.hint = function () {
  var i = false;
  if (this.isGameTerminated()) {
    i = this.won;
  } else {
    i = JS_MinimaxBestMove(this.grid.cells);
  }
  this.actuator.showHint(i);
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2:down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.exponent === tile.exponent && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.exponent + 1);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.exponent;

          // The mighty 2048 tile
          if (merged.exponent === self.winningNumber) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // up
    1: { x: 1,  y: 0 },  // right
    2: { x: 0,  y: 1 },  // down
    3: { x: -1, y: 0 }   // left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.exponent === tile.exponent) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
