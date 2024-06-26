"use strict";
// DOM操作用の諸々
let ABBR_SMALL_OMEGA = false;
let ABBR_LARGE_OMEGA = false;
let TO_TEX = false;
window.onload = (e) => {
    const small_omega = document.getElementById("small-omega");
    const large_omega = document.getElementById("large-omega");
    const to_tex = document.getElementById("to-tex");
    if (small_omega)
        small_omega.addEventListener("click", () => {
            ABBR_SMALL_OMEGA = !ABBR_SMALL_OMEGA;
        });
    if (large_omega)
        large_omega.addEventListener("click", () => {
            ABBR_LARGE_OMEGA = !ABBR_LARGE_OMEGA;
        });
    if(to_tex)
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
    if(TO_TEX) {
        katex.render(text, output);
    } else {
        output.innerText = text;
    }
}
function compute_lt() {
    const str = document.getElementById("str");
    const num = document.getElementById("num");
    const output = document.getElementById("output");
    if (!str || !num || !output)
        throw Error("要素がなかったよ");
    let text = "";
    try {
        const x = string_to_term(sanitize_string(str.value));
        const y = string_to_term(sanitize_string(num.value));
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
    const str = document.getElementById("str");
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
    output.innerText = text;
}
const Z = { type: "zero" };
const ONE = { type: "italy", sub: Z, arg: Z };
const OMEGA = { type: "italy", sub: Z, arg: ONE };
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
        for (let i = 0; i < t.arr.length; i++) {
            if (!equal(s.arr[i], t.arr[i]))
                return false;
        }
        return true;
    }
    else {
        if (t.type != "italy")
            return false;
        return equal(s.sub, t.sub) && equal(s.arg, t.arg);
    }
}
function italy(sub, arg) {
    return { type: "italy", sub: sub, arg: arg };
}
// a+b を適切に整形して返す
function plus(a, b) {
    if (a.type == "zero") {
        return b;
    }
    else if (a.type == "italy") {
        if (b.type == "zero") {
            return a;
        }
        else if (b.type == "italy") {
            return { type: "plus", arr: [a, b] };
        }
        else {
            return { type: "plus", arr: [a, ...b.arr] };
        }
    }
    else {
        if (b.type == "zero") {
            return a;
        }
        else if (b.type == "italy") {
            return { type: "plus", arr: [...a.arr, b] };
        }
        else {
            return { type: "plus", arr: a.arr.concat(b.arr) };
        }
    }
}
// 要素が1個の配列は潰してから返す
function sanitize_plus_term(arr) {
    if (arr.length == 1) {
        return { type: "italy", sub: arr[0].sub, arg: arr[0].arg };
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
    else if (s.type == "italy") {
        if (t.type == "zero") {
            return false;
        }
        else if (t.type == "italy") {
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
        else if (t.type == "italy") {
            return less_than(s.arr[0], t);
        }
        else {
            const s2 = sanitize_plus_term(s.arr.slice(1));
            const t2 = sanitize_plus_term(t.arr.slice(1));
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
        const domb = dom(t.arg);
        if (domb.type === "zero") {
            const doma = dom(t.sub);
            if (doma.type === "zero" || equal(doma, ONE)) {
                return t;
            }
            else {
                return OMEGA;
            }
        }
        else if (equal(domb, ONE)) {
            return OMEGA;
        }
        else {
            const domd = dom(domb.arg);
            if (equal(domd, Z))
                return t;
            return OMEGA;
        }
    }
}
// find(s, t)
function find(s, t) {
    if (s.type == "zero") {
        return Z;
    }
    else if (s.type == "plus") {
        const sub = s.arr[0].sub;
        const remnant = sanitize_plus_term(s.arr.slice(1));
        if (equal(sub, t))
            return s;
        return find(remnant, t);
    }
    else {
        return s;
    }
}
// replace(s, t)
function replace(s, t) {
    if (s.type == "zero") {
        return Z;
    }
    else if (s.type == "plus") {
        const a = s.arr[0];
        const b = sanitize_plus_term(s.arr.slice(1));
        return plus(replace(a, t), replace(b, t));
    }
    else {
        return italy(t, s.arg);
    }
}
// x[y]
function fund(s, t) {
    if (s.type == "zero") {
        return Z;
    }
    else if (s.type == "plus") {
        const lastfund = fund(s.arr[s.arr.length - 1], t);
        const remains = sanitize_plus_term(s.arr.slice(0, s.arr.length - 1));
        return plus(remains, lastfund);
    }
    else {
        const a = s.sub;
        const b = s.arg;
        const domb = dom(b);
        if (domb.type === "zero") {
            const doma = dom(a);
            if (doma.type === "zero" || equal(doma, ONE)) {
                return t;
            }
            else if (equal(doma, OMEGA)) {
                return italy(fund(a, t), b);
            }
            else {
                const c = doma.sub;
                const domd = dom(doma.arg);
                if (domd.type === "zero") {
                    if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                        const p = fund(s, fund(t, Z));
                        if (p.type != "italy")
                            throw Error("なんでだよ");
                        const gamma = p.sub;
                        return italy(fund(a, italy(fund(c, Z), gamma)), b);
                    }
                    else {
                        return italy(fund(a, italy(fund(c, Z), Z)), b);
                    }
                }
                else {
                    if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                        const e = domd.sub;
                        const p = fund(s, fund(t, Z));
                        if (p.type != "italy")
                            throw Error("なんでだよ");
                        const gamma = p.sub;
                        return italy(fund(a, replace(find(gamma, c), fund(e, Z))), b);
                    }
                    else {
                        return italy(fund(a, Z), b);
                    }
                }
            }
        }
        else if (equal(domb, ONE)) {
            if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                return plus(fund(s, fund(t, Z)), italy(a, fund(b, Z)));
            }
            else {
                return Z;
            }
        }
        else if (equal(domb, OMEGA)) {
            return italy(a, fund(b, t));
        }
        else {
            const domd = dom(domb.arg);
            if (domd.type === "zero") {
                return italy(a, fund(b, t));
            }
            else {
                if (less_than(t, OMEGA) && equal(dom(t), ONE)) {
                    const c = domb.sub;
                    const e = domd.sub;
                    const p = fund(s, fund(t, Z));
                    if (p.type != "italy")
                        throw Error("なんでだよ");
                    const gamma = p.arg;
                    return italy(a, fund(b, replace(find(gamma, c), fund(e, Z))));
                }
                else {
                    return italy(a, fund(b, Z));
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
    else if (t.type == "italy") {
        return "伊_{" + term_to_string(t.sub) + "}(" + term_to_string(t.arg) + ")";
    }
    else {
        return t.arr.map(term_to_string).join("+");
    }
}
function abbrviate(str) {
    str = str.replace(/伊_\{0\}\(0\)/g, "1");
    while (true) {
        const numterm = str.match(/1(\+1)+/);
        if (!numterm)
            break;
        const matches = numterm[0].match(/1/g);
        if (!matches)
            throw ("そんなことある？");
        const count = matches.length;
        str = str.replace(numterm[0], count.toString());
    }
    if (ABBR_SMALL_OMEGA)
        str = str.replace(/伊_\{0\}\(1\)/g, "ω");
    if (ABBR_LARGE_OMEGA)
        str = str.replace(/伊_\{1\}\(0\)/g, "Ω");
    if(TO_TEX)
        str = to_TeX(str);
    return str;
}
function to_TeX(str) {
    str = str.replace(/伊/g, "\\textrm{伊}");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    return str;
}
// ======================================
// position以降のbeginはじまりend終わりの対応するカッコを探し，
// その位置を返す
function search_closure(str, position, begin, end) {
    let count = 0;
    let pos = position;
    while (str[pos] != begin && pos < str.length) {
        pos += 1;
    }
    for (; pos < str.length; pos += 1) {
        const ch = str[pos];
        if (ch == begin)
            count += 1;
        if (ch == end)
            count -= 1;
        if (count == 0)
            return pos;
    }
    throw Error(`Unclosed braces`);
}
// 最も左のAP
function leftmost_principal(str) {
    const subpos = search_closure(str, 0, "{", "}");
    const argpos = search_closure(str, subpos + 1, "(", ")");
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
    if (ch != "伊" && ch != "i")
        throw Error(`Unexpected token '${ch}' in AP element`);
    position += 1;
    const ch2 = str[position];
    if (ch2 != "_")
        throw Error(`Unexpected token '${ch2}' after 伊 or i`);
    position += 1;
    const ch3 = str[position];
    if (ch3 != "{")
        throw Error(`Invalid subscript ${ch3}`);
    const subpos = search_closure(str, position, "{", "}");
    const sub = str.substring(position + 1, subpos);
    position = subpos + 1;
    const ch4 = str[position];
    if (ch4 != "(")
        throw Error(`Invalid subscript ${ch4}`);
    const argpos = search_closure(str, position, "(", ")");
    const arg = str.substring(position + 1, argpos);
    return italy(string_to_term(sub), string_to_term(arg));
}
function sanitize_string(str) {
    str = str.replace(/\s/g, "");
    while (true) {
        const numstr = str.match(/[1-9][0-9]*/);
        if (!numstr)
            break;
        const num = parseInt(numstr[0]);
        let numterm = "i_{0}(0)";
        for (let i = 1; i < num; i++) {
            numterm += "+i_{0}(0)";
        }
        str = str.replace(numstr[0], numterm);
    }
    str = str.replace(/[wω]/g, "i_{0}(i_{0}(0))");
    str = str.replace(/[WΩ]/g, "i_{i_{0}(0)}(0)");
    return str;
}
