"use strict";
//const katex = require('katex');
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// DOM操作用の諸々
var ABBR_SMALL_OMEGA = false;
var ABBR_LARGE_OMEGA = false;
let TO_TEX = false;
window.onload = function (e) {
    var small_omega = document.getElementById("small-omega");
    var large_omega = document.getElementById("large-omega");
    const to_tex = document.getElementById("to-tex");
    if (small_omega)
        small_omega.addEventListener("click", function () {
            ABBR_SMALL_OMEGA = !ABBR_SMALL_OMEGA;
        });
    if (large_omega)
        large_omega.addEventListener("click", function () {
            ABBR_LARGE_OMEGA = !ABBR_LARGE_OMEGA;
        });
    if(to_tex) 
        to_tex.addEventListener("click", () => {
            TO_TEX = !TO_TEX;
        });
};
function toggle_options() {
    var r = document.getElementById("options");
    if (!r)
        throw new Error("要素がないよ");
    r.style.display =
        (r.style.display == "none") ? "block" : "none";
}
function compute_fund() {
    var str = document.getElementById("str");
    var num = document.getElementById("num");
    var output = document.getElementById("output");
    if (!str || !num || !output)
        throw Error("要素がなかったよ");
    var text = "";
    try {
        var x = string_to_term(sanitize_string(str.value));
        var y = string_to_term(sanitize_string(num.value));
        text = abbrviate(term_to_string(fund(x, y)));
    }
    catch (error) {
        console.log(error);
        text = "Invalid";
    }
    if(TO_TEX) {
        katex.render(text, output);
    } else {
        output.innerHTML = text;
    }
}
function compute_lt() {
    var str = document.getElementById("str");
    var num = document.getElementById("num");
    var output = document.getElementById("output");
    if (!str || !num || !output)
        throw Error("要素がなかったよ");
    var text = "";
    try {
        var x = string_to_term(sanitize_string(str.value));
        var y = string_to_term(sanitize_string(num.value));
        text = less_than(x, y) ? "真" : "偽";
    }
    catch (error) {
        console.log(error);
        text = "Invalid";
    }
    if(TO_TEX) {
        katex.render(text, output);
    } else {
        output.innerHTML = text;
    }
}
function compute_dom() {
    var str = document.getElementById("str");
    var output = document.getElementById("output");
    if (!str || !output)
        throw Error("要素がなかったよ");
    var text = "";
    try {
        var x = string_to_term(sanitize_string(str.value));
        text = abbrviate(term_to_string(dom(x)));
    }
    catch (error) {
        console.log(error);
        text = "Invalid";
    }
    if(TO_TEX) {
        katex.render(text, output);
    } else {
        output.innerHTML = text;
    }
}
var Z = { type: "zero" };
var ONE = { type: "psi", sub: Z, arg: Z };
var OMEGA = { type: "psi", sub: Z, arg: ONE };
// オブジェクトの相等判定（クソが代斉唱）
// みんなはlodashとか使おう！
function equal(s, t) {
    if (s.type == "zero") {
        return t.type == "zero";
    }
    else if (s.type == "plus") {
        if (t.type != "plus")
            return false;
        if (t.arr.length != s.arr.length)
            return false;
        for (var i = 0; i < t.arr.length; i++) {
            if (!equal(s.arr[i], t.arr[i]))
                return false;
        }
        return true;
    }
    else {
        if (t.type != "psi")
            return false;
        return equal(s.sub, t.sub) && equal(s.arg, t.arg);
    }
}
function psi(sub, arg) {
    return { type: "psi", sub: sub, arg: arg };
}
// a+b を適切に整形して返す
function plus(a, b) {
    if (a.type == "zero") {
        return b;
    }
    else if (a.type == "psi") {
        if (b.type == "zero") {
            return a;
        }
        else if (b.type == "psi") {
            return { type: "plus", arr: [a, b] };
        }
        else {
            return { type: "plus", arr: __spreadArray([a], b.arr, true) };
        }
    }
    else {
        if (b.type == "zero") {
            return a;
        }
        else if (b.type == "psi") {
            return { type: "plus", arr: __spreadArray(__spreadArray([], a.arr, true), [b], false) };
        }
        else {
            return { type: "plus", arr: a.arr.concat(b.arr) };
        }
    }
}
// 要素が1個の配列は潰してから返す
function sanitize_plus_term(arr) {
    if (arr.length == 1) {
        return { type: "psi", sub: arr[0].sub, arg: arr[0].arg };
    }
    else {
        return { type: "plus", arr: arr };
    }
}
// s < t を判定
function less_than(s, t) {
    if (s.type == "zero") {
        return t.type != "zero";
    }
    else if (s.type == "psi") {
        if (t.type == "zero") {
            return false;
        }
        else if (t.type == "psi") {
            return less_than(s.sub, t.sub) ||
                (equal(s.sub, t.sub) && less_than(s.arg, t.arg));
        }
        else {
            return equal(s, t.arr[0]) || less_than(s, t.arr[0]);
        }
    }
    else {
        if (t.type == "zero") {
            return false;
        }
        else if (t.type == "psi") {
            return less_than(s.arr[0], t);
        }
        else {
            var s2 = sanitize_plus_term(s.arr.slice(1));
            var t2 = sanitize_plus_term(t.arr.slice(1));
            return less_than(s.arr[0], t.arr[0]) ||
                (equal(s.arr[0], t.arr[0]) && less_than(s2, t2));
        }
    }
}
// dom(t)
function dom(t) {
    if (t.type == "zero") {
        return Z;
    }
    else if (t.type == "plus") {
        return dom(t.arr[t.arr.length - 1]);
    }
    else {
        var domsub = dom(t.sub);
        var domarg = dom(t.arg);
        if (equal(domarg, Z)) {
            if (equal(domsub, Z) || equal(domsub, ONE))
                return t;
            return domsub;
        }
        else if (equal(domarg, ONE)) {
            return OMEGA;
        }
        else {
            if (less_than(domarg, t))
                return domarg;
            if (domarg.type != "psi")
                throw Error("そうはならんやろ");
            var domargarg = dom(domarg.arg);
            if (less_than(domargarg, domarg)) {
                if (equal(domarg.sub, plus(t.sub, ONE)))
                    return t;
                return OMEGA;
            }
            else {
                return OMEGA;
            }
        }
    }
}
// find_parent(t)
function find_parent(s, t) {
    if (s.type == "zero") {
        return Z;
    }
    else if (s.type == "plus") {
        var sub = s.arr[0].sub;
        var remnant = sanitize_plus_term(s.arr.slice(1));
        if (equal(sub, t))
            return s;
        return find_parent(remnant, t);
    }
    else {
        var sub = s.sub;
        var arg = s.arg;
        if (equal(sub, t))
            return s;
        return find_parent(arg, t);
    }
}
// x[y]
function fund(x, y) {
    if (x.type == "zero") {
        return Z;
    }
    else if (x.type == "plus") {
        var lastfund = fund(x.arr[x.arr.length - 1], y);
        var remains = sanitize_plus_term(x.arr.slice(0, x.arr.length - 1));
        return plus(remains, lastfund);
    }
    else {
        var sub = x.sub;
        var arg = x.arg;
        var domsub = dom(sub);
        var domarg = dom(arg);
        if (equal(domarg, Z)) {
            if (equal(domsub, Z)) {
                return Z;
            }
            else if (equal(domsub, ONE)) {
                return y;
            }
            else {
                return psi(fund(sub, y), Z);
            }
        }
        else if (equal(domarg, ONE)) {
            if (less_than(y, OMEGA) && equal(dom(y), ONE)) {
                return plus(fund(x, fund(y, Z)), psi(sub, fund(arg, Z)));
            }
            else {
                return Z;
            }
        }
        else {
            if (less_than(domarg, x)) {
                return psi(sub, fund(arg, y));
            }
            else {
                if (domarg.type != "psi")
                    throw Error("なんでだよ");
                var domargarg = dom(domarg.arg);
                if (domargarg.type == "zero") {
                    var c = domarg.sub;
                    if (equal(c, plus(sub, ONE)))
                        return psi(sub, fund(arg, y));
                    if (equal(dom(y), ONE)) {
                        var p = fund(x, fund(y, Z));
                        if (p.type != "psi")
                            throw Error("なんでだよ");
                        var gamma = p.arg;
                        return psi(sub, fund(arg, psi(fund(c, Z), gamma)));
                    }
                    else {
                        return psi(sub, fund(arg, psi(fund(c, Z), Z)));
                    }
                }
                else {
                    var e = domargarg.sub;
                    if (equal(e, plus(sub, ONE))) {
                        if (equal(dom(y), ONE)) {
                            var p = fund(x, fund(y, Z));
                            if (p.type != "psi")
                                throw Error("なんでだよ");
                            var gamma = p.arg;
                            return psi(sub, fund(arg, find_parent(gamma, sub)));
                        }
                        else {
                            return psi(sub, fund(arg, Z));
                        }
                    }
                    else {
                        if (equal(dom(y), ONE)) {
                            var p = fund(x, fund(y, Z));
                            if (p.type != "psi")
                                throw Error("なんでだよ");
                            var gamma = p.arg;
                            return psi(sub, fund(arg, psi(fund(e, Z), gamma)));
                        }
                        else {
                            return psi(sub, fund(arg, psi(fund(e, Z), Z)));
                        }
                    }
                }
            }
        }
    }
}
// ======================================
// オブジェクトから文字列へ
function term_to_string(t) {
    if (t.type == "zero") {
        return "0";
    }
    else if (t.type == "psi") {
        return "茸_{" + term_to_string(t.sub) + "}(" + term_to_string(t.arg) + ")";
    }
    else {
        return t.arr.map(term_to_string).join("+");
    }
}
function abbrviate(str) {
    str = str.replace(/茸_\{0\}\(0\)/g, "1");
    while (true) {
        var numterm = str.match(/1(\+1)+/);
        if (!numterm)
            break;
        var matches = numterm[0].match(/1/g);
        if (!matches)
            throw ("そんなことある？");
        var count = matches.length;
        str = str.replace(numterm[0], count.toString());
    }
    if (ABBR_SMALL_OMEGA)
        str = str.replace(/茸_\{0\}\(1\)/g, "ω");
    if (ABBR_LARGE_OMEGA)
        str = str.replace(/茸_\{1\}\(0\)/g, "Ω");
    if(TO_TEX) str = to_TeX(str);
    return str;
}

function to_TeX(str) {
    str = str.replace(/茸/g, "\\textrm{茸}");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    return str;
}

// ======================================
// position以降のbeginはじまりend終わりの対応するカッコを探し，
// その位置を返す
function serach_closure(str, position, begin, end) {
    var count = 0;
    var pos = position;
    while (str[pos] != begin && pos < str.length) {
        pos += 1;
    }
    for (; pos < str.length; pos += 1) {
        var ch = str[pos];
        if (ch == begin)
            count += 1;
        if (ch == end)
            count -= 1;
        if (count == 0)
            return pos;
    }
    throw Error("Unclosed braces");
}
// 最も左のAP
function leftmost_principal(str) {
    var subpos = serach_closure(str, 0, "{", "}");
    var argpos = serach_closure(str, subpos + 1, "(", ")");
    return str.substring(0, argpos + 1);
}
function string_to_term(str) {
    if (str == "")
        throw Error("Empty string");
    if (str == "0")
        return Z;
    var left = leftmost_principal(str);
    var leftlen = left.length;
    if (left == str)
        return principal_string_to_term(left);
    var remains = str.slice(leftlen + 1);
    return plus(principal_string_to_term(left), string_to_term(remains));
}
function principal_string_to_term(str) {
    if (str.length == 0)
        throw Error("Empty principal term");
    var position = 0;
    if (position >= str.length)
        throw Error("PT成分をTermにできなかったよ");
    var ch = str[position];
    if (ch != "茸" && ch != "m")
        throw Error("Unexpected token '".concat(ch, "' in AP element"));
    position += 1;
    var ch2 = str[position];
    if (ch2 != "_")
        throw Error("Unexpected token '".concat(ch2, "' after \u8338 or p"));
    position += 1;
    var ch3 = str[position];
    if (ch3 != "{")
        throw Error("Invalid subscript ".concat(ch3));
    var subpos = serach_closure(str, position, "{", "}");
    var sub = str.substring(position + 1, subpos);
    position = subpos + 1;
    var ch4 = str[position];
    if (ch4 != "(")
        throw Error("Invalid subscript ".concat(ch4));
    var argpos = serach_closure(str, position, "(", ")");
    var arg = str.substring(position + 1, argpos);
    return psi(string_to_term(sub), string_to_term(arg));
}
function sanitize_string(str) {
    str = str.replace(/\s/g, "");
    while (true) {
        var numstr = str.match(/[1-9][0-9]*/);
        if (!numstr)
            break;
        var num = parseInt(numstr[0]);
        var numterm = "m_{0}(0)";
        for (var i = 1; i < num; i++) {
            numterm += "+m_{0}(0)";
        }
        str = str.replace(numstr[0], numterm);
    }
    str = str.replace(/[wω]/g, "m_{0}(m_{0}(0))");
    str = str.replace(/[WΩ]/g, "m_{m_{0}(0)}(0)");
    return str;
}
