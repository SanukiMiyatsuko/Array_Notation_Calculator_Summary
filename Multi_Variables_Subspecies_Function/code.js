"use strict";
// DOM操作用の諸々
let ABBR_SMALL_OMEGA = false;
let ABBR_LARGE_OMEGA = false;
let ABBR_LARGE_IOTA = false;
let TO_TEX = false;
window.onload = (e) => {
    const small_omega = document.getElementById("small-omega");
    const large_omega = document.getElementById("large-omega");
    const large_iota = document.getElementById("large-iota");
    const to_tex = document.getElementById("to-tex");
    if (small_omega)
        small_omega.addEventListener("click", () => {
            ABBR_SMALL_OMEGA = !ABBR_SMALL_OMEGA;
        });
    if (large_omega)
        large_omega.addEventListener("click", () => {
            ABBR_LARGE_OMEGA = !ABBR_LARGE_OMEGA;
        });
    if (large_iota)
        large_iota.addEventListener("click", () => {
            ABBR_LARGE_IOTA = !ABBR_LARGE_IOTA;
        });
    if (to_tex)
        to_tex.addEventListener("click", () => {
            TO_TEX = !TO_TEX;
        });
};
function toggle_options() {
    const r = document.getElementById("options");
    if (!r)
        throw new Error("要素がないよ");
    r.style.display =
        (r.style.display == "none") ? "block" : "none";
}
function compute_fund() {
    const str = document.getElementById("str");
    const num = document.getElementById("num");
    lambda = variable(str.value);
    Z = { type: "zero" };
    ONE = { type: "subspecies", arr: Array(lambda).fill(Z) };
    foo = Array(lambda).fill(Z);
    foo[lambda - 1] = ONE;
    OMEGA = { type: "subspecies", arr: foo };
    const output = document.getElementById("output");
    if (!str || !num || !output)
        throw Error("要素がなかったよ");
    let text = "";
    try {
        const x = string_to_term(sanitize_string(str.value));
        const y = string_to_term(sanitize_string(num.value));
        text = abbrviate(term_to_string(fund(x, y)));
    }
    catch (error) {
        console.log(error);
        text = "Invalid";
    } 
    if (TO_TEX) {
        katex.render(text, output);
    } else {
        output.innerText = text;
    }
}
function compute_lt() {
    const str = document.getElementById("str");
    const num = document.getElementById("num");
    lambda = variable(str.value);
    Z = { type: "zero" };
    ONE = { type: "subspecies", arr: Array(lambda).fill(Z) };
    foo = Array(lambda).fill(Z);
    foo[lambda - 1] = ONE;
    OMEGA = { type: "subspecies", arr: foo };
    const output = document.getElementById("output");
    if (!str || !num || !output)
        throw Error("要素がなかったよ");
    let text = "";
    try {
        const x = string_to_term(sanitize_string(str.value));
        const y = string_to_term(sanitize_string(num.value));
        text = less_than_T(x, y) ? "真" : "偽";
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
    const str = document.getElementById("str");
    lambda = variable(str.value);
    Z = { type: "zero" };
    ONE = { type: "subspecies", arr: Array(lambda).fill(Z) };
    foo = Array(lambda).fill(Z);
    foo[lambda - 1] = ONE;
    OMEGA = { type: "subspecies", arr: foo };
    const output = document.getElementById("output");
    if (!str || !output)
        throw Error("要素がなかったよ");
    let text = "";
    try {
        const x = string_to_term(sanitize_string(str.value));
        text = abbrviate(term_to_string(dom(x)));
    }
    catch (error) {
        console.log(error);
        text = "Invalid";
    }
    if (TO_TEX) {
        katex.render(text, output);
    } else {
    output.innerText = text;
    }
}
// ============================================
// 表記の定義
let lambda; // 変数の個数λ
// "0","1","ω"の形式化
let Z = { type: "zero" };
let ONE = { type: "subspecies", arr: Array(lambda).fill(Z) };
let foo = Array(lambda).fill(Z);
foo[lambda - 1] = ONE;
let OMEGA = { type: "subspecies", arr: foo };
// オブジェクトの相等判定
function equal(s, t) {
    if (s.type === "zero") {
        return t.type === "zero";
    }
    else if (s.type === "plus") {
        if (t.type !== "plus")
            return false;
        if (t.add.length !== s.add.length)
            return false;
        for (let i = 0; i < t.add.length; i++) {
            if (!equal(s.add[i], t.add[i]))
                return false;
        }
        return true;
    }
    else {
        if (t.type !== "subspecies")
            return false;
        for (let i = 0; i < t.arr.length; i++) {
            if (!equal(s.arr[i], t.arr[i]))
                return false;
        }
        return true;
    }
}
;
function subspecies(arr) {
    return { type: "subspecies", arr: arr };
}
;
// a+b を適切に整形して返す
function plus(a, b) {
    if (a.type === "zero") {
        return b;
    }
    else if (a.type === "subspecies") {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "subspecies") {
            return { type: "plus", add: [a, b] };
        }
        else {
            return { type: "plus", add: [a, ...b.add] };
        }
    }
    else {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "subspecies") {
            return { type: "plus", add: [...a.add, b] };
        }
        else {
            return { type: "plus", add: a.add.concat(b.add) };
        }
    }
}
;
// 要素が1個の配列は潰してから返す
function sanitize_plus_term(add) {
    if (add.length === 1) {
        return add[0];
    }
    else {
        return { type: "plus", add: add };
    }
}
;
// s <_T t を判定
function less_than_T(s, t) {
    if (s.type == "zero") {
        return t.type != "zero";
    }
    else if (s.type == "subspecies") {
        if (t.type == "zero") {
            return false;
        }
        else if (t.type == "subspecies") {
            return less_than_S(s.arr, t.arr);
        }
        else {
            return equal(s, t.add[0]) || less_than_T(s, t.add[0]);
        }
    }
    else {
        if (t.type == "zero") {
            return false;
        }
        else if (t.type == "subspecies") {
            return less_than_T(s.add[0], t);
        }
        else {
            const s2 = sanitize_plus_term(s.add.slice(1));
            const t2 = sanitize_plus_term(t.add.slice(1));
            return less_than_T(s.add[0], t.add[0]) ||
                (equal(s.add[0], t.add[0]) && less_than_T(s2, t2));
        }
    }
}
// s <_S' t を判定
function less_than_S(s, t) {
    if (s.length !== t.length)
        throw Error("変数の個数が違うよ");
    if (s.length === 1) {
        return less_than_T(s[0], t[0]);
    }
    else if (s.length > 1) {
        const s2 = s.slice(1);
        const t2 = t.slice(1);
        return less_than_T(s[0], t[0]) ||
            (equal(s[0], t[0]) && less_than_S(s2, t2));
    }
}
// ============================================
// 関数の定義
// dom(t)
function dom(t) {
    if (t.type === "zero") {
        return Z;
    }
    else if (t.type === "plus") {
        return dom(t.add[t.add.length - 1]);
    }
    else {
        let i_0 = lambda - 1;
        while (i_0 > -1) {
            if (!equal(t.arr[i_0], Z))
                break;
            i_0--;
        }
        if (i_0 === -1)
            return ONE;
        const dom_i_0 = dom(t.arr[i_0]);
        if (i_0 < lambda - 1 && equal(dom_i_0, ONE))
            return t;
        return OMEGA;
    }
}
;
// x[y]
function fund(x, y) {
    if (x.type === "zero") {
        return Z;
    }
    else if (x.type === "plus") {
        const lastfund = fund(x.add[x.add.length - 1], y);
        const remains = sanitize_plus_term(x.add.slice(0, x.add.length - 1));
        return plus(remains, lastfund);
    }
    else {
        let i_0 = lambda - 1;
        while (i_0 > -1) {
            if (!equal(x.arr[i_0], Z))
                break;
            i_0--;
        }
        if (i_0 === -1)
            return Z;
        const dom_i_0 = dom(x.arr[i_0]);
        if (equal(dom_i_0, ONE)) {
            if (i_0 < lambda - 1) {
                return y;
            }
            else {
                if (equal(dom(y), ONE)) {
                    let xArray = [...x.arr];
                    xArray[lambda - 1] = fund(x.arr[lambda - 1], Z);
                    return plus(fund(x, fund(y, Z)), subspecies(xArray));
                }
                else {
                    return Z;
                }
            }
        }
        else if (equal(dom_i_0, OMEGA)) {
            let xArray = [...x.arr];
            xArray[i_0] = fund(x.arr[i_0], y);
            return subspecies(xArray);
        }
        else {
            if (dom_i_0.type !== "subspecies")
                throw Error("なんでだよ");
            let j_0 = lambda - 2;
            while (j_0 > -1) {
                if (!equal(dom_i_0.arr[j_0], Z))
                    break;
                j_0--;
            }
            let dom_i_0Array = [...dom_i_0.arr];
            dom_i_0Array[j_0] = fund(dom_i_0.arr[j_0], Z);
            if (equal(dom(y), ONE)) {
                const p = fund(x, fund(y, Z));
                if (p.type !== "subspecies")
                    throw Error("なんでだよ");
                const Gamma = p.arr[i_0];
                dom_i_0Array[j_0 + 1] = Gamma;
                let xArray = [...x.arr];
                xArray[i_0] = fund(x.arr[i_0], subspecies(dom_i_0Array));
                return subspecies(xArray);
            }
            else {
                let xArray = [...x.arr];
                xArray[i_0] = fund(x.arr[i_0], subspecies(dom_i_0Array));
                return subspecies(xArray);
            }
        }
    }
}
;
// ======================================
// オブジェクトから文字列へ
function term_to_string(t) {
    if (t.type == "zero") {
        return "0";
    }
    else if (t.type == "subspecies") {
        let array = term_to_string(t.arr[0]);
        for (let i = 1; i < lambda; i++) {
            array = array + "," + term_to_string(t.arr[i]);
        }
        return "亜(" + array + ")";
    }
    else {
        return t.add.map(term_to_string).join("+");
    }
}
function abbrviate(str) {
    let array = "0";
    for (let _i = 1; _i < lambda; _i++) {
        array = array + ",0";
    }
    const re = new RegExp("亜\\(" + array + "\\)", "g");
    str = str.replace(re, "1");
    while (true) {
        const numterm = str.match(/1(\+1)+/);
        if (!numterm)
            break;
        const matches = numterm[0].match(/1/g);
        if (!matches)
            throw Error("そんなことある？");
        const count = matches.length;
        str = str.replace(numterm[0], count.toString());
    }
    if (ABBR_SMALL_OMEGA) {
        if (lambda == 1) {
            str = str.replace(/亜\(1\)/g, "ω");
        }
        else {
            let array_1 = "0";
            for (let _i = 1; _i < lambda - 1; _i++) {
                array_1 = array_1 + ",0";
            }
            array_1 = array_1 + ",1";
            const re_1 = new RegExp("亜\\(" + array_1 + "\\)", "g");
            str = str.replace(re_1, "ω");
        }
    }
    if (ABBR_LARGE_OMEGA) {
        if (lambda == 2) {
            str = str.replace(/亜\(1,0\)/g, "Ω");
        }
        else {
            let array_2 = "0";
            for (let _i = 1; _i < lambda - 2; _i++) {
                array_2 = array_2 + ",0";
            }
            array_2 = array_2 + ",1,0";
            const re_2 = new RegExp("亜\\(" + array_2 + "\\)", "g");
            str = str.replace(re_2, "Ω");
        }
    }
    if (ABBR_LARGE_IOTA) {
        if (lambda == 3) {
            str = str.replace(/亜\(1,0,0\)/g, "I");
        }
        else {
            let array_3 = "0";
            for (let _i = 1; _i < lambda - 3; _i++) {
                array_3 = array_3 + ",0";
            }
            array_3 = array_3 + ",1,0,0";
            const re_3 = new RegExp("亜\\(" + array_3 + "\\)", "g");
            str = str.replace(re_3, "I");
        }
    }
    if (TO_TEX) str = to_TeX(str);
    return str;
}
function to_TeX(str) {
    str = str.replace(/亜/g, "\\textrm{亜}");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    str = str.replace(/I/g, "\\textrm{I}");
    return str;
}
// ======================================
// position以降の"("に対応する")"を探し，
// その位置を返す
function search_closure(str, position) {
    let count = 0;
    let pos = position;
    while (str[pos] != "(" && pos < str.length) { // なぜか" && pos < str.length"この呪文を入れないと自分の環境では実行できません。
        if (pos >= str.length)
            throw Error("(が見つからないよ。閉じ括弧の関数だよ");
        pos += 1;
    }
    for (; pos < str.length; pos += 1) {
        const ch = str[pos];
        if (ch == "(")
            count += 1;
        if (ch == ")")
            count -= 1;
        if (count == 0)
            return pos;
    }
    throw Error(`Unclosed braces`);
}
function search_open_parenthesis(str) {
    let pos = 0;
    while (str[pos] != "(") { // なぜか" && pos < str.length"この呪文を入れないと自分の環境では実行できません。
        if (pos >= str.length)
            throw Error("「(」が見つからないよ。開き括弧の関数だよ");
        pos += 1;
    }
    return pos;
}
// commaの位置を列挙する。
function search_comma(str) {
    let count = 0;
    let compo = Array(lambda + 1);
    let i = 0;
    compo[0] = -1;
    compo[lambda] = str.length;
    for (let pos = 1; pos < str.length; pos += 1) {
        const ch = str[pos];
        if (ch == "(")
            count += 1;
        if (ch == ")")
            count -= 1;
        if (count == 0 && ch == ",") {
            if (i >= lambda)
                throw Error("変数が多いよ");
            compo[i] = pos;
            i += 1;
        }
    }
    return compo;
}
// 変数の個数を返す
function variable(str) {
    if (str.match(/[a亜]/)) {
        let i = 1;
        const argpos = search_closure(str, 1);
        const argopen = search_open_parenthesis(str);
        const arg = str.substring(argopen + 1, argpos);
        let count = 0;
        for (let pos = 0; pos < arg.length; pos += 1) {
            const ch = arg[pos];
            if (ch == "(")
                count += 1;
            if (ch == ")")
                count -= 1;
            if (count == 0 && ch == ",") {
                i += 1;
            }
        }
        return i;
    }
    else if (str.match(/I/)) {
        return 3;
    }
    else if (str.match(/[WΩ]/)) {
        return 2;
    }
    else {
        return 1;
    }
}
// 最も左のAP
function leftmost_principal(str) {
    const argpos = search_closure(str, 0);
    return str.substring(0, argpos + 1);
}
function string_to_term(str) {
    if (str == "")
        throw Error("Empty string");
    if (str == "0")
        return Z;
    const left = leftmost_principal(str);
    const leftlen = left.length;
    if (left == str)
        return principal_string_to_term(left);
    const remains = str.slice(leftlen + 1);
    return plus(principal_string_to_term(left), string_to_term(remains));
}
function principal_string_to_term(str) {
    if (str.length == 0)
        throw Error(`Empty principal term`);
    let position = 0;
    if (position >= str.length)
        throw Error("PT成分をTermにできなかったよ");
    const ch = str[position];
    if (ch != "亜" && ch != "a")
        throw Error(`Unexpected token '${ch}' in AP element`);
    position += 1;
    const ch4 = str[position];
    if (ch4 != "(")
        throw Error(`Invalid subscript ${ch4}`);
    const argpos = search_closure(str, position);
    const arg = str.substring(position + 1, argpos);
    let array = Array(lambda);
    const arg_comma = search_comma(arg);
    for (let i = 0; i < lambda; i++) {
        const index = arg.substring(arg_comma[i] + 1, arg_comma[i + 1]);
        array[i] = string_to_term(index);
    }
    return subspecies(array);
}
function sanitize_string(str) {
    str = str.replace(/\s/g, "");
    while (true) {
        const numstr = str.match(/[1-9][0-9]*/);
        if (!numstr)
            break;
        const num = parseInt(numstr[0]);
        let array = "0";
        for (let _i = 1; _i < lambda; _i++) {
            array = array + ",0";
        }
        let numterm = "a(" + array + ")";
        for (let i = 1; i < num; i++) {
            numterm += "+a(" + array + ")";
        }
        str = str.replace(numstr[0], numterm);
    }
    if (lambda == 1 && str.match(/[wω]/)) {
        str = str.replace(/[wω]/g, "a(a(0))");
    }
    else {
        let array_1 = "0";
        for (let _i = 1; _i < lambda - 1; _i++) {
            array_1 = array_1 + ",0";
        }
        str = str.replace(/[wω]/g, "a(" + array_1 + ",a(" + array_1 + ",0))");
    }
    if (lambda == 1 && str.match(/[WΩ]/))
        throw Error("Ωはないよなぁ？");
    if (lambda == 2) {
        str = str.replace(/[WΩ]/g, "a(a(0,0),0)");
    }
    else {
        let array_2 = "0";
        for (let _i = 1; _i < lambda - 2; _i++) {
            array_2 = array_2 + ",0";
        }
        str = str.replace(/[WΩ]/g, "a(" + array_2 + ",a(" + array_2 + ",0,0),0)");
    }
    if (lambda <= 2 && str.match("I"))
        throw Error("Iはないよなぁ？");
    if (lambda == 3) {
        str = str.replace(/I/g, "a(a(0,0,0),0,0)");
    }
    else {
        let array_3 = "0";
        for (let _i = 1; _i < lambda - 3; _i++) {
            array_3 = array_3 + ",0";
        }
        str = str.replace(/I/g, "a(" + array_3 + ",a(" + array_3 + ",0,0,0),0,0)");
    }
    return str;
}
