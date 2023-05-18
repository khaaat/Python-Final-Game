/*
 * transform: A jQuery cssHooks adding cross-browser 2d transform capabilities to $.fn.css() and $.fn.animate()
 *
 * limitations:
 * - requires jQuery 1.4.3+
 * - Should you use the *translate* property, then your elements need to be absolutely positionned in a relatively positionned wrapper **or it will fail in IE678**.
 * - transformOrigin is not accessible
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery.transform.js
 *
 * Copyright 2011 @louis_remi
 * Licensed under the MIT license.
 *
 * This saved you an hour of work?
 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
 *
 */
(function ($, window, document, Math, undefined) {

    /*
 * Feature tests and global variables
 */
    var div = document.createElement("div"),
        divStyle = div.style,
        suffix = "Transform",
        testProperties = [
            "O" + suffix,
            "ms" + suffix,
            "Webkit" + suffix,
            "Moz" + suffix
        ],
        i = testProperties.length,
        supportProperty,
        supportMatrixFilter,
        supportFloat32Array = "Float32Array" in window,
        propertyHook,
        propertyGet,
        rMatrix = /Matrix([^)]*)/,
        rAffine = /^\s*matrix\(\s*1\s*,\s*0\s*,\s*0\s*,\s*1\s*(?:,\s*0(?:px)?\s*){2}\)\s*$/,
        _transform = "transform",
        _transformOrigin = "transformOrigin",
        _translate = "translate",
        _rotate = "rotate",
        _scale = "scale",
        _skew = "skew",
        _matrix = "matrix";

    // test different vendor prefixes of these properties
    while (i--) {
        if (testProperties[i] in divStyle) {
            $.support[_transform] = supportProperty = testProperties[i];
            $.support[_transformOrigin] = supportProperty + "Origin";
            continue;
        }
    }
    // IE678 alternative
    if (!supportProperty) {
        $.support.matrixFilter = supportMatrixFilter = divStyle.filter === "";
    }

    // px isn't the default unit of these properties
    $.cssNumber[_transform] = $.cssNumber[_transformOrigin] = true;

    /*
 * fn.css() hooks
 */
    if (supportProperty && supportProperty != _transform) {
        // Modern browsers can use jQuery.cssProps as a basic hook
        $.cssProps[_transform] = supportProperty;
        $.cssProps[_transformOrigin] = supportProperty + "Origin";

        // Firefox needs a complete hook because it stuffs matrix with "px"
        if (supportProperty == "Moz" + suffix) {
            propertyHook = {
                get: function (elem, computed) {
                    return (computed ?
                        // remove "px" from the computed matrix
                        $.css(elem, supportProperty).split("px").join("") :
                        elem.style[supportProperty]
                    );
                },
                set: function (elem, value) {
                    // add "px" to matrices
                    elem.style[supportProperty] = /matrix\([^)p]*\)/.test(value) ?
                        value.replace(/matrix((?:[^,]*,){4})([^,]*),([^)]*)/, _matrix + "$1$2px,$3px") :
                        value;
                }
            };
            /* Fix two jQuery bugs still present in 1.5.1
     * - rupper is incompatible with IE9, see http://jqbug.com/8346
     * - jQuery.css is not really jQuery.cssProps aware, see http://jqbug.com/8402
     */
        } else if (/^1\.[0-5](?:\.|$)/.test($.fn.jquery)) {
            propertyHook = {
                get: function (elem, computed) {
                    return (computed ?
                        $.css(elem, supportProperty.replace(/^ms/, "Ms")) :
                        elem.style[supportProperty]
                    );
                }
            };
        }
        /* TODO: leverage hardware acceleration of 3d transform in Webkit only
    else if ( supportProperty == "Webkit" + suffix && support3dTransform ) {
        propertyHook = {
            set: function( elem, value ) {
                elem.style[supportProperty] = 
                    value.replace();
            }
        }
    }*/

    } else if (supportMatrixFilter) {
        propertyHook = {
            get: function (elem, computed, asArray) {
                var elemStyle = (computed && elem.currentStyle ? elem.currentStyle : elem.style),
                    matrix, data;

                if (elemStyle && rMatrix.test(elemStyle.filter)) {
                    matrix = RegExp.$1.split(",");
                    matrix = [
                        matrix[0].split("=")[1],
                        matrix[2].split("=")[1],
                        matrix[1].split("=")[1],
                        matrix[3].split("=")[1]
                    ];
                } else {
                    matrix = [1, 0, 0, 1];
                }

                if (!$.cssHooks[_transformOrigin]) {
                    matrix[4] = elemStyle ? parseInt(elemStyle.left, 10) || 0 : 0;
                    matrix[5] = elemStyle ? parseInt(elemStyle.top, 10) || 0 : 0;

                } else {
                    data = $._data(elem, "transformTranslate", undefined);
                    matrix[4] = data ? data[0] : 0;
                    matrix[5] = data ? data[1] : 0;
                }

                return asArray ? matrix : _matrix + "(" + matrix + ")";
            },
            set: function (elem, value, animate) {
                var elemStyle = elem.style,
                    currentStyle,
                    Matrix,
                    filter,
                    centerOrigin;

                if (!animate) {
                    elemStyle.zoom = 1;
                }

                value = matrix(value);

                // rotate, scale and skew
                Matrix = [
                    "Matrix(" +
                    "M11=" + value[0],
                    "M12=" + value[2],
                    "M21=" + value[1],
                    "M22=" + value[3],
                    "SizingMethod='auto expand'"
                ].join();
                filter = (currentStyle = elem.currentStyle) && currentStyle.filter || elemStyle.filter || "";

                elemStyle.filter = rMatrix.test(filter) ?
                    filter.replace(rMatrix, Matrix) :
                    filter + " progid:DXImageTransform.Microsoft." + Matrix + ")";

                if (!$.cssHooks[_transformOrigin]) {

                    // center the transform origin, from pbakaus's Transformie http://github.com/pbakaus/transformie
                    if ((centerOrigin = $.transform.centerOrigin)) {
                        elemStyle[centerOrigin == "margin" ? "marginLeft" : "left"] = -(elem.offsetWidth / 2) + (elem.clientWidth / 2) + "px";
                        elemStyle[centerOrigin == "margin" ? "marginTop" : "top"] = -(elem.offsetHeight / 2) + (elem.clientHeight / 2) + "px";
                    }

                    // translate
                    // We assume that the elements are absolute positionned inside a relative positionned wrapper
                    elemStyle.left = value[4] + "px";
                    elemStyle.top = value[5] + "px";

                } else {
                    $.cssHooks[_transformOrigin].set(elem, value);
                }
            }
        };
    }
    // populate jQuery.cssHooks with the appropriate hook if necessary
    if (propertyHook) {
        $.cssHooks[_transform] = propertyHook;
    }
    // we need a unique setter for the animation logic
    propertyGet = propertyHook && propertyHook.get || $.css;

    /*
 * fn.animate() hooks
 */
    $.fx.step.transform = function (fx) {
        var elem = fx.elem,
            start = fx.start,
            end = fx.end,
            pos = fx.pos,
            transform = "",
            precision = 1E5,
            i, startVal, endVal, unit;

        // fx.end and fx.start need to be converted to interpolation lists
        if (!start || typeof start === "string") {

            // the following block can be commented out with jQuery 1.5.1+, see #7912
            if (!start) {
                start = propertyGet(elem, supportProperty);
            }

            // force layout only once per animation
            if (supportMatrixFilter) {
                elem.style.zoom = 1;
            }

            // replace "+=" in relative animations (-= is meaningless with transforms)
            end = end.split("+=").join(start);

            // parse both transform to generate interpolation list of same length
            $.extend(fx, interpolationList(start, end));
            start = fx.start;
            end = fx.end;
        }

        i = start.length;

        // interpolate functions of the list one by one
        while (i--) {
            startVal = start[i];
            endVal = end[i];
            unit = +false;

            switch (startVal[0]) {

                case _translate:
                    unit = "px";
                case _scale:
                    unit || (unit = "");

                    transform = startVal[0] + "(" +
                        Math.round((startVal[1][0] + (endVal[1][0] - startVal[1][0]) * pos) * precision) / precision + unit + "," +
                        Math.round((startVal[1][1] + (endVal[1][1] - startVal[1][1]) * pos) * precision) / precision + unit + ")" +
                        transform;
                    break;

                case _skew + "X":
                case _skew + "Y":
                case _rotate:
                    transform = startVal[0] + "(" +
                        Math.round((startVal[1] + (endVal[1] - startVal[1]) * pos) * precision) / precision + "rad)" +
                        transform;
                    break;
            }
        }

        fx.origin && (transform = fx.origin + transform);

        propertyHook && propertyHook.set ?
            propertyHook.set(elem, transform, +true) :
            elem.style[supportProperty] = transform;
    };

    /*
 * Utility functions
 */

    // turns a transform string into its "matrix(A,B,C,D,X,Y)" form (as an array, though)
    function matrix(transform) {
        transform = transform.split(")");
        var
            trim = $.trim
            , i = -1
            // last element of the array is an empty string, get rid of it
            , l = transform.length - 1
            , split, prop, val
            , prev = supportFloat32Array ? new Float32Array(6) : []
            , curr = supportFloat32Array ? new Float32Array(6) : []
            , rslt = supportFloat32Array ? new Float32Array(6) : [1, 0, 0, 1, 0, 0]
            ;

        prev[0] = prev[3] = rslt[0] = rslt[3] = 1;
        prev[1] = prev[2] = prev[4] = prev[5] = 0;

        // Loop through the transform properties, parse and multiply them
        while (++i < l) {
            split = transform[i].split("(");
            prop = trim(split[0]);
            val = split[1];
            curr[0] = curr[3] = 1;
            curr[1] = curr[2] = curr[4] = curr[5] = 0;

            switch (prop) {
                case _translate + "X":
                    curr[4] = parseInt(val, 10);
                    break;

                case _translate + "Y":
                    curr[5] = parseInt(val, 10);
                    break;

                case _translate:
                    val = val.split(",");
                    curr[4] = parseInt(val[0], 10);
                    curr[5] = parseInt(val[1] || 0, 10);
                    break;

                case _rotate:
                    val = toRadian(val);
                    curr[0] = Math.cos(val);
                    curr[1] = Math.sin(val);
                    curr[2] = -Math.sin(val);
                    curr[3] = Math.cos(val);
                    break;

                case _scale + "X":
                    curr[0] = +val;
                    break;

                case _scale + "Y":
                    curr[3] = val;
                    break;

                case _scale:
                    val = val.split(",");
                    curr[0] = val[0];
                    curr[3] = val.length > 1 ? val[1] : val[0];
                    break;

                case _skew + "X":
                    curr[2] = Math.tan(toRadian(val));
                    break;

                case _skew + "Y":
                    curr[1] = Math.tan(toRadian(val));
                    break;

                case _matrix:
                    val = val.split(",");
                    curr[0] = val[0];
                    curr[1] = val[1];
                    curr[2] = val[2];
                    curr[3] = val[3];
                    curr[4] = parseInt(val[4], 10);
                    curr[5] = parseInt(val[5], 10);
                    break;
            }

            // Matrix product (array in column-major order)
            rslt[0] = prev[0] * curr[0] + prev[2] * curr[1];
            rslt[1] = prev[1] * curr[0] + prev[3] * curr[1];
            rslt[2] = prev[0] * curr[2] + prev[2] * curr[3];
            rslt[3] = prev[1] * curr[2] + prev[3] * curr[3];
            rslt[4] = prev[0] * curr[4] + prev[2] * curr[5] + prev[4];
            rslt[5] = prev[1] * curr[4] + prev[3] * curr[5] + prev[5];

            prev = [rslt[0], rslt[1], rslt[2], rslt[3], rslt[4], rslt[5]];
        }
        return rslt;
    }

    // turns a matrix into its rotate, scale and skew components
    // algorithm from http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp
    function unmatrix(matrix) {
        var
            scaleX
            , scaleY
            , skew
            , A = matrix[0]
            , B = matrix[1]
            , C = matrix[2]
            , D = matrix[3]
            ;

        // Make sure matrix is not singular
        if (A * D - B * C) {
            // step (3)
            scaleX = Math.sqrt(A * A + B * B);
            A /= scaleX;
            B /= scaleX;
            // step (4)
            skew = A * C + B * D;
            C -= A * skew;
            D -= B * skew;
            // step (5)
            scaleY = Math.sqrt(C * C + D * D);
            C /= scaleY;
            D /= scaleY;
            skew /= scaleY;
            // step (6)
            if (A * D < B * C) {
                A = -A;
                B = -B;
                skew = -skew;
                scaleX = -scaleX;
            }

            // matrix is singular and cannot be interpolated
        } else {
            // In this case the elem shouldn't be rendered, hence scale == 0
            scaleX = scaleY = skew = 0;
        }

        // The recomposition order is very important
        // see http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp#l971
        return [
            [_translate, [+matrix[4], +matrix[5]]],
            [_rotate, Math.atan2(B, A)],
            [_skew + "X", Math.atan(skew)],
            [_scale, [scaleX, scaleY]]
        ];
    }

    // build the list of transform functions to interpolate
    // use the algorithm described at http://dev.w3.org/csswg/css3-2d-transforms/#animation
    function interpolationList(start, end) {
        var list = {
            start: [],
            end: []
        },
            i = -1, l,
            currStart, currEnd, currType;

        // get rid of affine transform matrix
        (start == "none" || isAffine(start)) && (start = "");
        (end == "none" || isAffine(end)) && (end = "");

        // if end starts with the current computed style, this is a relative animation
        // store computed style as the origin, remove it from start and end
        if (start && end && !end.indexOf("matrix") && toArray(start).join() == toArray(end.split(")")[0]).join()) {
            list.origin = start;
            start = "";
            end = end.slice(end.indexOf(")") + 1);
        }

        if (!start && !end) { return; }

        // start or end are affine, or list of transform functions are identical
        // => functions will be interpolated individually
        if (!start || !end || functionList(start) == functionList(end)) {

            start && (start = start.split(")")) && (l = start.length);
            end && (end = end.split(")")) && (l = end.length);

            while (++i < l - 1) {
                start[i] && (currStart = start[i].split("("));
                end[i] && (currEnd = end[i].split("("));
                currType = $.trim((currStart || currEnd)[0]);

                append(list.start, parseFunction(currType, currStart ? currStart[1] : 0));
                append(list.end, parseFunction(currType, currEnd ? currEnd[1] : 0));
            }

            // otherwise, functions will be composed to a single matrix
        } else {
            list.start = unmatrix(matrix(start));
            list.end = unmatrix(matrix(end))
        }

        return list;
    }

    function parseFunction(type, value) {
        var
            // default value is 1 for scale, 0 otherwise
            defaultValue = +(!type.indexOf(_scale)),
            scaleX,
            // remove X/Y from scaleX/Y & translateX/Y, not from skew
            cat = type.replace(/e[XY]/, "e");

        switch (type) {
            case _translate + "Y":
            case _scale + "Y":

                value = [
                    defaultValue,
                    value ?
                        parseFloat(value) :
                        defaultValue
                ];
                break;

            case _translate + "X":
            case _translate:
            case _scale + "X":
                scaleX = 1;
            case _scale:

                value = value ?
                    (value = value.split(",")) && [
                        parseFloat(value[0]),
                        parseFloat(value.length > 1 ? value[1] : type == _scale ? scaleX || value[0] : defaultValue + "")
                    ] :
                    [defaultValue, defaultValue];
                break;

            case _skew + "X":
            case _skew + "Y":
            case _rotate:
                value = value ? toRadian(value) : 0;
                break;

            case _matrix:
                return unmatrix(value ? toArray(value) : [1, 0, 0, 1, 0, 0]);
                break;
        }

        return [[cat, value]];
    }

    function isAffine(matrix) {
        return rAffine.test(matrix);
    }

    function functionList(transform) {
        return transform.replace(/(?:\([^)]*\))|\s/g, "");
    }

    function append(arr1, arr2, value) {
        while (value = arr2.shift()) {
            arr1.push(value);
        }
    }

    // converts an angle string in any unit to a radian Float
    function toRadian(value) {
        return ~value.indexOf("deg") ?
            parseInt(value, 10) * (Math.PI * 2 / 360) :
            ~value.indexOf("grad") ?
                parseInt(value, 10) * (Math.PI / 200) :
                parseFloat(value);
    }

    // Converts "matrix(A,B,C,D,X,Y)" to [A,B,C,D,X,Y]
    function toArray(matrix) {
        // remove the unit of X and Y for Firefox
        matrix = /([^,]*),([^,]*),([^,]*),([^,]*),([^,p]*)(?:px)?,([^)p]*)(?:px)?/.exec(matrix);
        return [matrix[1], matrix[2], matrix[3], matrix[4], matrix[5], matrix[6]];
    }

    $.transform = {
        centerOrigin: "margin"
    };

})(jQuery, window, document, Math);


/* val() function of jquery to return number instead of string in an input box */
(function ($) {
    var originalVal = $.fn.val;
    $.fn.val = function (value) {
        if (typeof value == 'undefined') {
            var text = this[0].value;
            var textInNum = parseInt(text);
            var type = this.attr('type');
            if (text == textInNum) {
                return textInNum;
            } else {
                if (type == 'number') {
                    return parseFloat(text);
                } else {
                    return this[0].value;
                }
            }
        } else {
            return originalVal.call(this, value);
        }
    };
})(jQuery);


var Canvas;
var pause_timeTime = 0;
var start = function () {
    Canvas = $('#canvas');
};



/**
 * If there is no heading, adds a heading to project with id heading otherwise, it updates the existing heading. 
 * @example
 * print_heading("Heading text", 64)
 * @param {string[]} heading text of heading
 * @param {number} size size of heading
 */
var print_heading = function (heading, size) {
    if ($('#heading').length) {
        $('#heading').text(heading);
    } else {
        Canvas.append('<h1 class="heading" id="heading">' + heading + '</h1>');
    }
    $('#heading').css({
        'font-size': size + 'px'
    });
};

/** 
  * Returns a random number within given range
  * @example
  * random_num(1,10);
  * @param {number} start Minimum number of range
  * @param {number} end Maximum number of range
  */
var random_num = function (start, end) {
    return Math.floor(start + (Math.random() * (end - start)));
}

/**
 * Adds background image
 * @example
 * add_background("background.jpg")
 * @param {string[]} url path to image
 */
var add_background = function (url) {
    $('#canvas').css("background-image", "url('" + url + "')")
}

/**
 * Adds background color
 * @example
 * background_color("#000000")
 * @param {string} color code
 */
var background_color = function (color) {
    $('body').css("background-color", color)
    console.log(color)
}

/**
 * Adds a button with label
 * @example
 * add_button("Submit")
 * @param {string[]} label Text to be shown on button
 */
var add_button = function (label) {
    var uid = 'button' + $('button').length;
    Canvas.append('<button id="' + uid + '">' + label + '</button>');
    return $('#' + uid);
}

/**
 * Adds input type text to the project.
 * @example
 * input("Enter your name")
 * @param {string[]} text placeholder of the input
 */
var input = function (text) {
    var uid = 'input' + $('input').length;

    Canvas.append("<input type='text' id=" + uid + " placeholder='" + text + "'>");

    return $("#" + uid);
}

/**
 * Adds input type number to the project.
 * @example
 * input_num("Enter your age")
 * @param {string[]} text placeholder of the input
 */
var input_num = function (text) {
    var uid = 'input' + $('input').length;

    Canvas.append("<input type='number' id=" + uid + " placeholder='" + text + "'>");

    return $("#" + uid);
}

/**
 * Adds audio with preload and without loop, autoplay.
 * @example
 * sound = add_sound_effect("bazinga.mp3")
 * play_audio(sound)
 * @param {string[]} src Path to the audio file
 */
var add_sound_effect = function (src) {
    var audioHTML = "<audio src='" + src + "' preload></audio>";
    $('body').append(audioHTML);
    return $(audioHTML)[0];
}

/**
 * Adds audio with loop and without preload, autoplay.
 * @example
 * song = add_audio("uptown-funk.mp3")
 * play_audio(song)
 * @param {string[]} src Path to the audio file
 */
var add_audio = function (src) {
    var audioHTML = "<audio src='" + src + "' loop></audio>";
    $('body').append(audioHTML);
    return $(audioHTML)[0];
}

/**
  * Plays the audio object passed as parameter
  * @example
  * boom = add_audio("boom.mp3");
  * play_audio(boom);
  * @param {object} audio audio object which is to be played.
  */
var play_audio = function (audio) {
    audio.play();
}

/**
  * Change the position of element to position specified
  * @example
  * demo = add_image("demo.png", 50);
  * place_element(demo, 20, 100);
  * @param {object} element el object whose position is required.
  * @param {number} left required left position of element
  * @param {number} top required top position of element
  */
var place_element = function (el, left, top) {
    el.css({
        'position': 'absolute',
        'top': top + 'px',
        'left': left + 'px'
    });
};

/**
 * Adds a image to project
 * @example
 * add_image("demo.png", 100)
 * @param {string[]} src path of image to be added
 * @param {number} size width of the image
 */
var add_image = function (src, size) {
    console.log(src);
    var filename = src.replace(/^.*[\\\/]/, ''); // gets the filename from file path
    var name = filename.split('.')[0];
    var imgClass = name;
    var id = name + $('.' + name).length;
    Canvas.append('<img class="' + imgClass + '" src ="' + src + '" id = "' + id + '" width="' + size + 'px"/>');
    $('#' + id).css({
        'position': 'absolute'
    });
    return $('#' + id);
};

/**
 * Resizes an image
 */

var resize_image = function (el, size) {
    $(el).css('width', size + 'px');
}

/**
 * Adds text using a p tag with a unique id.
 * @example
 * print_text("Hello world", 24)
 * @param {string[]} text content of text
 * @param {number} size size of text
 */
var print_text = function (text, size) {
    uid = 'text' + $('p').length;
    Canvas.append('<p id="' + uid + '" style="font-size:' + size + 'px">' + text + '</p>');
    return $('#' + uid);
};

/**
  * Updates the text element added using print_text
  * @example
  * text = print_text("Hello world", 25)
  * update_text(text, "Hi there")
  * @param {object} el text element whose text is to be updated
  * @param {string[]} text text message
  */
var update_text = function (el, text) {
    el.text(text);
};

/**
  * Show error message using alert
  * @example
  * alert("Bug on line 24")
  * @param {string[]} error Error message to be shown
  */
var showError = function (error) {
    alert(error);
};

/*
Incomplete attempt to create weapon firing capability
Issues left to solve:
-moving weapons with player element
-Directional aim (partially complete, see v2)
-Implementing collision detection

var arm_player = function (el, img, num) {
    var weapon;
    var top = $(el).css('top');
    var left = $(el).css('left');
    left = parseInt(left);
    top = parseInt(top);
    console.log(typeof left);
    for (let i = 0; i < num; i++) {
        weapon = add_image(img, 80);
        place_element(weapon, left, top);
    }
    fire_weapon(num, weapon);
    //return weapon;
}

var fire_weapon = function (num, weapon) {
    counter = num;
    shoot = {
        'top': '-100px'
    }
    imgName = $(weapon).attr('class');
    console.log(imgName);
    document.addEventListener('click', function () {
        counter = counter - 1
        $('#' + imgName + counter).animate(shoot, 250);
    })
}
*/

/** 
  * Defines the bouncing effect used by the bounce function
  *
  * @param {object} el element on which animation is to be applied
  * @param {number} scale magnitude of bounce effect
  * @param {number} pause delay before animation start
  */
var bounce_animate = function (el, scale, pause) {
    randomDuration = Math.floor(Math.random() * 500);
    pause = typeof pause !== 'undefined' ? pause : pause_timeTime;
    var aniObj = {
        duration: 1000 + randomDuration,
        queue: 'bounce' + el[0].id
    };
    el.delay(pause, 'bounce' + el[0].id).animate({
        "top": "+=" + scale + "px"
    }, aniObj).animate({
        "top": "-=" + scale + "px"
    }, {
        duration: aniObj.duration,
        queue: aniObj.queue,
        complete: function () {
            bounce_animate(el, scale, pause);
        }
    });
};

/**
  * Adds/increments delay time to animation
  * @example
  * pause_time(2)
  * @param time delay time in seconds
  */
var pause_time = function (time) {
    pause_timeTime += time * 1000;
};

/**
 * Adds bounce effect to the element. Uses bounce_animate for effect
 * @example
 * demo = add_image("ball.png", 30)
 * bounce(demo, 20)
 * @param {object} el element on which animation is to be applied
 * @param {number} scale magnitude of bounce effect
 */
var bounce = function (el, scale) {
    bounce_animate(el, scale);
    el.dequeue('bounce' + el[0].id);
};

/**
  * Remove an element with fade effect
  * @example
  * demo = add_image("demo.png", 20)
  * remove_el(demo)
  * @param {object} el element to be removed
  */
var remove_el = function (el) {
    var blastCSS = {
        'width': '80',
        'height': 'auto',
        'opacity': 0,
    }
    $(el).animate(blastCSS, function () {
        $(el).remove();
    });
}

/**
 * Makes an element jump the specified Y value on click
 */

var jump = function (el, how_high, speed) {

    document.addEventListener("click", function () {
        var currentYPos = $(el).css("top");
        //console.log(currentYPos)
        var currentYPosNum = parseInt(currentYPos);
        newHeight = currentYPosNum - how_high;
        //console.log(newHeight);
        height = {
            "top": newHeight + 'px'
        }
        current = {
            "top": currentYPos
        }
        $(el).animate(height, speed);
        $(el).animate(current, speed);
    });
}

/**
 * Makes an element jump the specified Y value on click of space bar
 */

var jump_spacebar = function (el, how_high, speed) {
    $(document).keydown(function (event) {
        var key = event.originalEvent.code;
        console.log(key)
        if (key == "Space") {
            var currentYPos = $(el).css("top");
            //console.log(currentYPos)
            var currentYPosNum = parseInt(currentYPos);
            newHeight = currentYPosNum - how_high;
            //console.log(newHeight);
            height = {
                "top": newHeight + 'px'
            }
            current = {
                "top": currentYPos
            }
            $(el).animate(height, speed);
            $(el).animate(current, speed);
        }
    });
}

/**
 * Moves the element horizontally. Use moveHAnimation for animation effect.
 * @example
 * var demo = add_image("ball.png", 30);
 * animate_x(demo, 20, 80, 2, false, 100);
 * @param {object} el element on which animation is to be applied
 * @param {number} initialX initial position of element
 * @param {number} finalX final position of element after moving
 * @param {number} turns turns of how many time animation should take effect, infinite for never ending animation
 * @param {boolean} alternate if true animates the element to final and then back to initial, if false doesn't animate the element from final to initial position.
 * @param {number} speed speed of moving
 */
var animate_x = function (el, initialX, finalX, turns, alternate, speed) {
    var randomSpeed = Math.floor(Math.random() * 100) + 100;
    speed = typeof speed !== 'undefined' ? speed : randomSpeed;

    var distance = Math.abs(finalX - initialX);
    var duration = (distance / speed) * 1000;
    moveHAnimation(el, initialX, finalX, turns, alternate, duration, 'linear');
    el.dequeue('animate_x' + el[0].id);
}

/**
 * Moves the element vertically. Use moveVAnimation for animation effect.
 * @example
 * var demo = add_image("ball.png", 30);
 * animate_y(demo, 20, 80, 2, false, 100);
 * @param {object} el element on which animation is to be applied
 * @param {number} initialY initial position of element
 * @param {number} finalY final position of element after moving
 * @param {number} turns turns of how many time animation should take effect, infinite for never ending animation
 * @param {boolean} alternate if true animates the element to final and then back to initial, if false doesn't animate the element from final to initial position.
 * @param {number} speed speed of moving
 */
var animate_y = function (el, initialY, finalY, turns, alternate, speed, pause) {
    var randomSpeed = Math.floor(Math.random() * 100) + 100;
    speed = typeof speed !== 'undefined' ? speed : randomSpeed;
    pause = typeof pause !== 'undefined' ? pause : pause_timeTime;
    var distance = Math.abs(finalY - initialY);
    var duration = (distance / speed) * 1000;
    moveVAnimation(el, initialY, finalY, turns, alternate, duration, 'linear', pause);
    el.dequeue('animate_y' + el[0].id);
}

/**
 * Defines the vertical animation being used by animate_y
 * @param {object} el element on which animation is to be applied
 * @param {number} initialY initial position of element
 * @param {number} finalY final position of element after moving
 * @param {number} turns turns of how many time animation should take effect, infinite for never ending animation
 * @param {boolean} alternate if true animates the element to final and then back to initial, if false doesn't animate the element from final to initial position.
 * @param {number} duration duration in milliseconds
 * @param {string[]} easing animation effect
 * @param {number} pause animation delay
 */
var moveVAnimation = function (el, initialY, finalY, turns, alternate, duration, easing, pause) {
    el.stop('animate_y' + el[0].id, true);
    pause = typeof pause !== 'undefined' ? pause : pause_timeTime;
    var aniObj = {
        duration: duration,
        easing: easing,
        queue: 'animate_y' + el[0].id,
        complete: function () {
            if (alternate) {
                el.toggleClass('flipV');
                moveVAnimation(el, finalY, initialY, turns, alternate, duration, easing, 0);
            } else {
                moveVAnimation(el, initialY, finalY, turns, alternate, duration, easing, 0);
            }
        }
    };

    if (turns) {
        el.css('top', initialY + 'px');
        el.delay(pause, 'animate_y' + el[0].id).animate({
            top: finalY + 'px'
        }, aniObj);
    }

    if (turns != 'infinite') {
        turns--;
    }
}

/**
 * Defines the horizontal animation being used by animate_x
 * @param {object} el element on which animation is to be applied
 * @param {number} initialX initial position of element
 * @param {number} finalX final position of element after moving
 * @param {number} turns turns of how many time animation should take effect, infinite for never ending animation
 * @param {boolean} alternate if true animates the element to final and then back to initial, if false doesn't animate the element from final to initial position.
 * @param {number} duration duration in milliseconds
 * @param {string[]} easing animation effect
 * @param {number} pause animation delay
 */
var moveHAnimation = function (el, initialX, finalX, turns, alternate, duration, easing, pause) {
    el.stop('animate_x' + el[0].id, true);
    pause = typeof pause !== 'undefined' ? pause : pause_timeTime;
    var randomDuration = Math.floor(Math.random() * 5000) + 5000;
    duration = typeof duration !== 'undefined' ? duration : randomDuration;
    var aniObj = {
        duration: duration,
        easing: easing,
        queue: 'animate_x' + el[0].id,
        complete: function () {
            if (alternate) {
                el.toggleClass('flipH');
                moveHAnimation(el, finalX, initialX, turns, alternate, duration, easing, 0);
            } else {
                moveHAnimation(el, initialX, finalX, turns, alternate, duration, easing, 0);
            }
        }
    };

    if (turns) {
        el.css('left', initialX + 'px');
        el.delay(pause, 'animate_x' + el[0].id).animate({
            left: finalX + 'px'
        }, aniObj);
    }

    if (turns != 'infinite') {
        turns--;
    }
}

/**
 * Defines the rotation animation currently being used by animate_y_rotate
 * @param {object} el element on which animation is to be applied
 * @param {number} duration duration in milliseconds
 * @param {number} turns turns of how many time animation should take effect, infinite for never ending animation 
 * @param {number} pause animation delay
 */
var rotateAnimation = function (el, duration, turns, pause) {
    pause = typeof pause !== 'undefined' ? pause : pause_timeTime;
    var aniObj = {
        queue: 'rotate' + el[0].id,
        duration: duration,
        easing: 'swing'
    }
    var rotateDegree = parseInt(turns) * 360;
    el.delay(pause, 'rotate' + el[0].id).animate({ transform: 'rotate(' + rotateDegree + 'deg)' }, aniObj);
}

/**
 * Makes the element come from bottom and then go back. Uses rotateAnimation and moveVAnimation
 * @example
 * demo = add_image("ball.png", 30)
 * animate_y_rotate(demo, 'center', 2, 100)
 * @param {object} el element on which animation is to be applied
 * @param {string[]} position position from which the element comes possible values are left, right, center
 * @param {number} turns turns of how many time animation should take effect, infinite for never ending animation
 * @param {number} speed speed of moving
 */
var animate_y_rotate = function (el, position, turns, speed) {
    var Xi, Xf, Yi, Yf;

    switch (position) {
        case 'left': Xi = 100; Yi = 800; Xf = 100; Yf = 150; break;
        case 'right': Xi = 1100; Yi = 800; Xf = 1100; Yf = 150; break;
        case 'center': Xi = 600; Yi = 800; Xf = 600; Yf = 150; break;
        default: Xi = 600; Yi = 800; Xf = 600; Yf = 150; break;
    }


    var distance = Math.abs(Yf - Yi);
    var duration = (distance / speed) * 1000;

    el.delay(pause_timeTime, 'come-n-go' + el[0].id).animate({}, duration, function () {
        moveVAnimation(el, Yi, Yf, turns * 2, true, duration, 'swing');
        el.dequeue('animate_y' + el[0].id);

        moveHAnimation(el, Xi, Xf, turns, false, duration, 'swing');
        el.dequeue('animate_x' + el[0].id);

        rotateAnimation(el, duration * (2 * turns), turns);
        el.dequeue('rotate' + el[0].id);
    });

    el.dequeue('come-n-go' + el[0].id);

};

/**
  * Makes the element change its position with mouse click and drag
  * @example
  * demo = add_image("demo.png", 50)
  * cursor_move(demo)
  * @param {object} element Element object whose position is required.
  */
var cursor_move = function (element) {
    element.css({
        'cursor': 'move'
    })
    element.mousedown(function (event) {
        event.preventDefault();
        Canvas.mousemove(function (event) {
            var x = event.clientX - (element.width() / 2);
            var y = event.clientY - (element.height() / 2);

            element.css({
                'position': 'fixed',
                'left': x + 'px',
                'z-index': '2',
                'top': y + 'px',
            });
        });
    }).mouseup(function () {
        Canvas.unbind('mousemove');
    }).mouseout(function () {
        Canvas.unbind('mousemove');
    });
}

/**
  * Makes the element change its position with keyboard arrow keys
  * @example
  * demo = add_image("demo.png", 50)
  * arrows_move(demo);
  * @param {object} element Element object whose position is required.
  */
var arrows_move = function (element) {
    element.css({
        'transition': '0.1s all ease'
    });
    $(document).keydown(function (event) {
        var keyPressed = event.originalEvent.code;
        if (keyPressed == 'ArrowRight') {
            element.css({
                'left': "+=20px"
            });
        } else if (keyPressed == 'ArrowLeft') {
            element.css({
                'left': "-=20px"
            });
        } else if (keyPressed == 'ArrowUp') {
            element.css({
                'top': "-=20px"
            });
        } else if (keyPressed == 'ArrowDown') {
            element.css({
                'top': "+=20px"
            });
        }
    })
}

/**
  * Makes the element change its position with wasd keys
  * @example
  * demo = add_image("demo.png", 50)
  * wasd_move(demo)
  * @param {object} element Element object whose position is required.
  */
var wasd_move = function (element) {
    element.css({
        'transition': '0.1s all ease'
    });
    $(document).keydown(function (event) {
        var keyPressed = event.originalEvent.key;
        console.log(keyPressed)
        if (keyPressed == 'd') {
            element.css({
                'left': "+=20px"
            });
        } else if (keyPressed == 'a') {
            element.css({
                'left': "-=20px"
            });
        } else if (keyPressed == 'w') {
            element.css({
                'top': "-=20px"
            });
        } else if (keyPressed == 's') {
            element.css({
                'top': "+=20px"
            });
        }
    })
}

/**
  * Clears the canvas
  * No parameters
  * @example
  * clear();
  */
var clear = function () {
    Canvas.html(" ");
    $('#canvas > * ').stop();
}

/**
  * Checks for collision by calling collision function every 100ms
  * @example
  * Calls destroy function when bullet and enemy collide
  * bullet = add_image("bullet.png", 20)
  * target = add_image("target.png", 50)
  * def destroy():
        //code to vanish
  * detect_collision(bullet, target, destroy);
  * @param {object} element1 element to be checked with collision
  * @param {object} element2 element to be checked with collision with
  * @param {function} cFunc function to be called when collision occurs
  */
var detect_collision = function (bullet, target, cFunc) {
    var interval = setInterval(function () {
        collision(bullet, target, cFunc);
    }, 100);
}

/**
  * Defines the collision logic used by detect_collision
  * @param {object} bound element to be checked with collision
  * @param {object} compare element to be checked with collision with
  * @param {function} cFunc function to be called when collision occurs
  */
var collision = function (bound, compare, cFunc) {
    var boundArray = bound;
    console.log(boundArray);
    var compareArray = compare;

    if (compareArray.length) {

        for (i = 0; i < boundArray.length; i++) {
            boundOffset = $(boundArray[i]).offset();
            boundOffset.right = boundOffset.left + $(boundArray[i]).width();
            boundOffset.bottom = boundOffset.top + $(boundArray[i]).height();

            for (j = 0; j < compareArray.length; j++) {
                comparePosition = $(compareArray[j]).offset();
                if (boundOffset.bottom > comparePosition.top &&
                    boundOffset.top < comparePosition.top) {
                    if (boundOffset.right > comparePosition.left &&
                        boundOffset.left < comparePosition.left) {
                        //return boundArray[i];
                        if (cFunc) {
                            cFunc();
                        } else {
                            return true;
                        }
                    }
                }
            }
        }
    }
}

/**
  * Get the x position of element
  * @example
  * demo = add_image("demo.png", 50)
  * get_x(demo)
  * @param {object} element Element object whose position is required.
  */
var get_x = function (element) {
    var left = element.css('left');
    left = parseInt(left);
    return left;
}

var get_y = function (element) {
    var top = element.css('top');
    top = parseInt(top);
    return top;
}