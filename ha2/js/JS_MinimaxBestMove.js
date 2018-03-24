function TileToNumber(tile) {
  return tile ? tile.exponent : 0;
}

function JS_MinimaxBestMove(cells) {
  var map = { 0: 0, 1: 2, 2: 3, 3: 1};
  var args = [
    'number', 'number', 'number', 'number',
    'number', 'number', 'number', 'number',
    'number', 'number', 'number', 'number',
    'number', 'number', 'number', 'number'];
  var func = Module.cwrap('JS_MinimaxBestMove', 'number', args);
  var numbers = [];
  for (var i = 0; i < 4; ++i) {
    numbers[i] = [];
    for(var j = 0; j < 4; ++j) {
      numbers[i][j] = cells[j] ? TileToNumber(cells[j][i]) : 0;
    }
  }
  //console.log('Field: ' + numbers);
  var move = func(
    numbers[0][0], numbers[0][1], numbers[0][2], numbers[0][3],
    numbers[1][0], numbers[1][1], numbers[1][2], numbers[1][3],
    numbers[2][0], numbers[2][1], numbers[2][2], numbers[2][3],
    numbers[3][0], numbers[3][1], numbers[3][2], numbers[3][3]);
  //if (move == 0) console.log('Move: UP');
  //if (move == 1) console.log('Move: DOWN');
  //if (move == 2) console.log('Move: LEFT');
  //if (move == 3) console.log('Move: RIGHT');
  if (move < 0 || move > 3)
    throw "No valid move found! move=" + move + ", cells=" + cells;
  return map[move];
}
