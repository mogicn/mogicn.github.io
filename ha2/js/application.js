function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

window.requestAnimationFrame(function () {
  var texts = [];
  texts[0] = "苟利国家生死以岂因祸福避趋之";
  texts[1] = "敢同恶鬼争高下不向霸王让寸分";
  texts[2] = "垂死病中惊坐起谈笑风生又一年";
  texts[3] = "轻关易道通商宽衣";
  texts[4] = [
    "扬州江少",
    "中央大学",
    "交通大学",
    "长春一汽",
    "上海市长",
    "市委书记",
    "螳臂当车",
    "苟利国家",
    "如履薄冰",
    "九八抗洪",
    "三个代表",
    "谈笑风生",
    "怒斥港记",
    "很惭愧"
  ];
  texts[5] = "稻花香里说丰年听取蛙声一片";

  var colors = [
    "#eee4da",
    "#ede0c8",
    "#f2b179",
    "#f59563",
    "#f67c5f",
    "#f65e3b",
    "#edcf72",
    "#edcc61",
    "#edc850",
    "#edc850",
    "#edc850",
    "#3c3a32"
  ];
  var textColors = [
    "#776e65",
    "#776e65",
    "#f9f6f2"
  ];
  var set = getParameterByName("poetry");
  if (!set) {
    set = Number.parseInt(getParameterByName("id"));
    if (!set || set < 0) set = 0;
    set = texts[set] || texts[0];
  } else {
    if (set.indexOf(",") >= 0) {
      set = set.split(",");
      if (!set[set.length - 1]) set.pop();
    }
  }
  var difficulty = Number.parseInt(getParameterByName("difficulty"));
  if (!difficulty || difficulty < 0) difficulty = 0;
  var options = {
    difficulty: difficulty
  };
  options.contents = [];
  
  for (var i =0; i< set.length;i++) {
    options.contents.push({text: set[i], color: colors[i], textColor: textColors[i]});
  }
  new GameManager(options);
});
