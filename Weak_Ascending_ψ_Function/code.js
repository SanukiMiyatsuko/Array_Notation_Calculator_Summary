"use strict";
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
        (r.style.display === "none") ? "block" : "none";
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
        output.innerText = text;
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
        output.innerText = text;
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
        output.innerText = text;
    }
}
var Z = { type: "zero" };
var ONE = { type: "psi", sub: 0, arg: Z };
var OMEGA = { type: "psi", sub: 0, arg: ONE };
// オブジェクトの相等判定（クソが代斉唱）
// みんなはlodashとか使おう！
function equal(s, t) {
    if (s.type === "zero") {
        return t.type === "zero";
    }
    else if (s.type === "plus") {
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
        return (s.sub === t.sub) && equal(s.arg, t.arg);
    }
}
function psi(sub, arg) {
    return { type: "psi", sub: sub, arg: arg };
}
// a+b を適切に整形して返す
function plus(a, b) {
    if (a.type === "zero") {
        return b;
    }
    else if (a.type === "psi") {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "psi") {
            return { type: "plus", arr: [a, b] };
        }
        else {
            return { type: "plus", arr: __spreadArray([a], b.arr, true) };
        }
    }
    else {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "psi") {
            return { type: "plus", arr: __spreadArray(__spreadArray([], a.arr, true), [b], false) };
        }
        else {
            return { type: "plus", arr: a.arr.concat(b.arr) };
        }
    }
}
// 要素が1個の配列は潰してから返す
function sanitize_plus_term(arr) {
    if (arr.length === 1) {
        return { type: "psi", sub: arr[0].sub, arg: arr[0].arg };
    }
    else {
        return { type: "plus", arr: arr };
    }
}
// s < t を判定
function less_than(s, t) {
    if (s.type === "zero") {
        return t.type != "zero";
    }
    else if (s.type === "psi") {
        if (t.type === "zero") {
            return false;
        }
        else if (t.type === "psi") {
            return s.sub < t.sub ||
                ((s.sub === t.sub) && less_than(s.arg, t.arg));
        }
        else {
            return equal(s, t.arr[0]) || less_than(s, t.arr[0]);
        }
    }
    else {
        if (t.type === "zero") {
            return false;
        }
        else if (t.type === "psi") {
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
    if (t.type === "zero") {
        return Z;
    }
    else if (t.type === "plus") {
        return dom(t.arr[t.arr.length - 1]);
    }
    else {
        var domarg = dom(t.arg);
        if (equal(domarg, Z)) {
            return t;
        }
        else if (equal(domarg, ONE)) {
            return OMEGA;
        }
        else {
            if (domarg.type != "psi")
                throw Error("なんでだよ");
            var c = domarg.sub;
            if (t.sub >= c) {
                return domarg;
            }
            else {
                return OMEGA;
            }
        }
    }
}
// dom_2(t)
function dom_2(t) {
    if (t.type === "zero") {
        return Z;
    }
    else if (t.type === "plus") {
        return dom_2(t.arr[t.arr.length - 1]);
    }
    else {
        var domarg = dom_2(t.arg);
        if (equal(domarg, Z)) {
            return t;
        }
        else {
            return OMEGA;
        }
    }
}
// search(t)
function search(Gamma, BP) {
    if (equal(dom_2(BP), Z) || equal(dom_2(BP), ONE) || equal(dom_2(BP), OMEGA)) {
        if (Gamma.type === "plus" && BP.type === "plus") {
            var gammalength = --Gamma.arr.length;
            var BPlength = --BP.arr.length;
            var b_gamma = { type: "plus", arr: __spreadArray([], Gamma.arr.slice(-gammalength), true) };
            var d_bp = { type: "plus", arr: __spreadArray([], BP.arr.slice(-BPlength), true) };
            return search(b_gamma, d_bp);
        }
        else if (Gamma.type === "psi" && BP.type === "psi") {
            var arg_gamma = Gamma.arg;
            var arg_bp = BP.arg;
            return search(arg_gamma, arg_bp);
        }
        else {
            return Z;
        }
    }
    else {
        return Gamma;
    }
}
// Delta(t)
function Delta(bp, delta, br) {
    if (bp.type === "zero") {
        return Z;
    }
    else if (bp.type === "plus") {
        var bpdeltaarr = bp.arr.map(function (a) { return PTDelta(a, delta, br); });
        return { type: "plus", arr: bpdeltaarr };
    }
    else {
        return PTDelta(bp, delta, br);
    }
}
// PTDelta(t)
function PTDelta(bp, delta, br) {
    if (bp.sub <= br)
        return bp;
    var bpsub = bp.sub;
    var bparg = bp.arg;
    return psi(bpsub + delta, Delta(bparg, delta, br));
}
// x[y]
function fund(x, y) {
    if (x.type === "zero") {
        return Z;
    }
    else if (x.type === "plus") {
        var lastfund = fund(x.arr[x.arr.length - 1], y);
        var remains = sanitize_plus_term(x.arr.slice(0, x.arr.length - 1));
        return plus(remains, lastfund);
    }
    else {
        var sub = x.sub;
        var arg = x.arg;
        var domarg = dom(arg);
        if (equal(domarg, Z)) {
            return y;
        }
        else if (equal(domarg, ONE)) {
            if (equal(dom(y), ONE)) {
                return plus(fund(x, fund(y, Z)), psi(sub, fund(arg, Z)));
            }
            else {
                return Z;
            }
        }
        else {
            if (domarg.type != "psi")
                throw Error("domarg.type != \"psi\"");
            var c = domarg.sub;
            if ((c < sub) || (c === sub))
                return psi(sub, fund(arg, y));
            if (c - sub <= 1) {
                if (equal(dom(y), ONE)) {
                    var p = fund(x, fund(y, Z));
                    if (p.type != "psi")
                        throw Error("p.type != \"psi\"");
                    var gamma = p.arg;
                    return psi(sub, fund(arg, psi(c - 1, search(gamma, arg))));
                }
                else {
                    return psi(sub, fund(arg, psi(c - 1, Z)));
                }
            }
            else {
                var delta = c - sub - 1;
                if (equal(dom(y), ONE)) {
                    var p = fund(x, fund(y, Z));
                    if (p.type != "psi")
                        throw Error("p.type != \"psi\"");
                    var gamma = p.arg;
                    return psi(sub, fund(arg, psi(c - 1, Delta(search(gamma, arg), delta, sub))));
                }
                else {
                    return psi(sub, fund(arg, psi(c - 1, Z)));
                }
            }
        }
    }
}
// =======================================
// オブジェクトから文字列へ
function term_to_string(t) {
    if (t.type === "zero") {
        return "0";
    }
    else if (t.type === "psi") {
        return "ψ_{" + t.sub + "}(" + term_to_string(t.arg) + ")";
    }
    else {
        return t.arr.map(term_to_string).join("+");
    }
}
function abbrviate(str) {
    str = str.replace(/ψ_\{0\}\(0\)/g, "1");
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
        str = str.replace(/ψ_\{0\}\(1\)/g, "ω");
    if (ABBR_LARGE_OMEGA)
        str = str.replace(/ψ_\{1\}\(0\)/g, "Ω");
    if(TO_TEX)
        str = to_TeX(str);
    return str;
}
function to_TeX(str) {
    str = str.replace(/ψ/g, "\\psi");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    return str;
}
// =======================================
// position以降のbeginはじまりend終わりの対応するカッコを探し，
// その位置を返す
function search_closure(str, position, begin, end) {
    var count = 0;
    var pos = position;
    while (str[pos] != begin && pos < str.length) {
        pos += 1;
    }
    for (; pos < str.length; pos += 1) {
        var ch = str[pos];
        if (ch === begin)
            count += 1;
        if (ch === end)
            count -= 1;
        if (count === 0)
            return pos;
    }
    throw Error("Unclosed braces");
}
// 最も左のAP
function leftmost_principal(str) {
    var subpos = search_closure(str, 0, "{", "}");
    var argpos = search_closure(str, subpos + 1, "(", ")");
    return str.substring(0, argpos + 1);
}
function string_to_term(str) {
    if (str === "")
        throw Error("Empty string");
    if (str === "0")
        return Z;
    var left = leftmost_principal(str);
    var leftlen = left.length;
    if (left === str)
        return principal_string_to_term(left);
    var remains = str.slice(leftlen + 1);
    return plus(principal_string_to_term(left), string_to_term(remains));
}
function principal_string_to_term(str) {
    if (str.length === 0)
        throw Error("Empty principal term");
    var position = 0;
    if (position >= str.length)
        throw Error("PT成分をTermにできなかったよ");
    var ch = str[position];
    if (ch != "ψ" && ch != "p")
        throw Error("Unexpected token '".concat(ch, "' in AP element"));
    position += 1;
    var ch2 = str[position];
    if (ch2 != "_")
        throw Error("Unexpected token '".concat(ch2, "' after \u03C8 or p"));
    position += 1;
    var ch3 = str[position];
    if (ch3 != "{")
        throw Error("Invalid subscript ".concat(ch3));
    var subpos = search_closure(str, position, "{", "}");
    var subst = str.substring(position + 1, subpos);
    var arr = subst.match(/p_\{0\}\(0\)/g);
    var sub = 0;
    if (arr !== null) {
        sub = arr.length;
    }
    position = subpos + 1;
    var ch4 = str[position];
    if (ch4 != "(")
        throw Error("Invalid subscript ".concat(ch4));
    var argpos = search_closure(str, position, "(", ")");
    var arg = str.substring(position + 1, argpos);
    return psi(sub, string_to_term(arg));
}
function sanitize_string(str) {
    str = str.replace(/\s/g, "");
    while (true) {
        var numstr = str.match(/[1-9][0-9]*/);
        if (!numstr)
            break;
        var num = parseInt(numstr[0]);
        var numterm = "p_{0}(0)";
        for (var i = 1; i < num; i++) {
            numterm += "+p_{0}(0)";
        }
        str = str.replace(numstr[0], numterm);
    }
    str = str.replace(/[wω]/g, "p_{0}(p_{0}(0))");
    str = str.replace(/[WΩ]/g, "p_{p_{0}(0)}(0)");
    return str;
}
