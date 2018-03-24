function HTMLActuator(contents) {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");

  this.hintMessage    = document.querySelector(".hint-message");
  this.aiButton         = document.querySelector(".ai-button");

  var clearMessage = function (event) {
    event.preventDefault();
    this.clearMessage();
  };
  var clearMessageButton = document.querySelector(".clear-message-button");
  clearMessageButton.addEventListener("click", clearMessage.bind(this));
  clearMessageButton.addEventListener("touchend", clearMessage.bind(this));

  for (var i = 1; i < contents.length; i++) {
    if (!contents[i].textColor) {
      contents[i].textColor = contents[i-1].textColor;
    }
    if (!contents[i].color) {
      contents[i].color = contents[i-1].color;
    }
  }
  this.contents = contents;
  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.showHint();
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continue = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};


HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.exponent, positionClass];
  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  this.setTileContent(inner, tile.exponent - 1);

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.setTileContent = function (element, i) {
  if (!this.contents[i]) {
    element.textContent = ++i;
    i = 0;
  } else {
    element.textContent = this.contents[i].text;
  }
  if (this.contents[i].textColor) {
    element.style.color = this.contents[i].textColor;
  }
  if (this.contents[i].color) {
    element.style.backgroundColor = this.contents[i].color;
  }
}

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "续" + difference +"秒";

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = "续" + bestScore + "秒";
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "你可以和我谈笑风生了!" : "还是要提高自己的姿势水平！";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.showHint = function (i) {
  if (i === undefined) {
    this.hintMessage.textContent = "";
  } else if (i === true) {
    this.hintMessage.textContent = "一颗赛艇";
  } else if (i === false) {
    this.hintMessage.textContent = "陷入江菊";
  } else {
    this.hintMessage.textContent = ["↑", "→", "↓", "←"][i];
  }
};

HTMLActuator.prototype.setAIButton = function (run) {
  this.aiButton.textContent = run ? "自动续" : "手动续";
};
