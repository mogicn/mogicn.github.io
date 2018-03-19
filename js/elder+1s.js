/**
 * Contribute one second to THE ELDER (i.e. +1s) on every mouse click!
 * EXCITED!
 *
 * Credit: https://lixingcong.github.io/
 *
 * Mogic Party
 * 2017-12-20
 */

"use strict";

$(document).ready(function () {
    var click_counter = 0;
    $("body").bind("click", function (e) {
        e.stopPropagation();
        var $i = $("<elder>").text("+" + (++click_counter) + "s");
        $i.css({
            "z-index": 99999,
            "top": e.pageY-15,
            "left": e.pageX,
            "position": "absolute",
            "color": "red"
        });
        $("body").append($i);
        $i.animate(
            {"top": e.pageY-180, "opacity": 0},
            1500,
            function () { $i.remove(); }
        );
    });
});
