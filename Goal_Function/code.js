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
        (r.style.display === "none") ? "block" : "none";
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
    if(TO_TEX) {
        katex.render(text, output);
    } else {
        output.innerText = text;
    }
}
const Z = { type: "zero" };
const ONE = { type: "Goal", sub: 0, arg: Z };
const OMEGA = { type: "Goal", sub: 0, arg: ONE };
// オブジェクトの相等判定（クソが代斉唱）
// みんなはlodashとか使おう！
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
        if (t.type !== "Goal")
            return false;
        return (s.sub === t.sub) && equal(s.arg, t.arg);
    }
}
function Goal(sub, arg) {
    return { type: "Goal", sub: sub, arg: arg };
}
// a+b を適切に整形して返す
function plus(a, b) {
    if (a.type === "zero") {
        return b;
    }
    else if (a.type === "Goal") {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "Goal") {
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
        else if (b.type === "Goal") {
            return { type: "plus", add: [...a.add, b] };
        }
        else {
            return { type: "plus", add: a.add.concat(b.add) };
        }
    }
}
// 要素が1個の配列は潰してから返す
function sanitize_plus_term(arr) {
    if (arr.length === 1) {
        return { type: "Goal", sub: arr[0].sub, arg: arr[0].arg };
    }
    else {
        return { type: "plus", add: arr };
    }
}
// s < t を判定
function less_than(s, t) {
    if (s.type === "zero") {
        return t.type !== "zero";
    }
    else if (s.type === "Goal") {
        if (t.type === "zero") {
            return false;
        }
        else if (t.type === "Goal") {
            return (s.sub < t.sub) ||
                ((s.sub === t.sub) && less_than(s.arg, t.arg));
        }
        else {
            return equal(s, t.add[0]) || less_than(s, t.add[0]);
        }
    }
    else {
        if (t.type === "zero") {
            return false;
        }
        else if (t.type === "Goal") {
            return less_than(s.add[0], t);
        }
        else {
            const s2 = sanitize_plus_term(s.add.slice(1));
            const t2 = sanitize_plus_term(t.add.slice(1));
            return less_than(s.add[0], t.add[0]) ||
                (equal(s.add[0], t.add[0]) && less_than(s2, t2));
        }
    }
}
// dom(t)
function dom(t) {
    if (t.type === "zero") {
        return Z;
    }
    else if (t.type === "plus") {
        return dom(t.add[t.add.length - 1]);
    }
    else {
        const b = t.arg;
        const domb = dom(b);
        if (equal(domb, Z)) {
            return t;
        }
        else if (equal(domb, ONE)) {
            return OMEGA;
        }
        else if (equal(domb, OMEGA)) {
            return OMEGA;
        }
        else {
            if (domb.type !== "Goal")
                throw Error("そうはならんやろ");
            const d = domb.arg;
            const domd = dom(domb.arg);
            if (equal(domd, Z)) {
                return t;
            }
            else {
                if (less_than(b, d)) {
                    return OMEGA;
                }
                else {
                    return domb;
                }
            }
        }
    }
}
// find(s, t)
function find(s, t) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "plus") {
        const sub = s.add[0].sub;
        const remnant = sanitize_plus_term(s.add.slice(1));
        if (sub === t)
            return s;
        return find(remnant, t);
    }
    else {
        return s;
    }
}
// replace(s, t)
function replace(s, t) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "plus") {
        const a = s.add[0];
        const remnant = sanitize_plus_term(s.add.slice(1));
        return plus(replace(a, t), replace(remnant, t));
    }
    else {
        const arg = s.arg;
        return Goal(t, arg);
    }
}
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
        const a = x.sub;
        const b = x.arg;
        const domb = dom(b);
        if (equal(domb, Z)) {
            return y;
        }
        else if (equal(domb, ONE)) {
            if (less_than(y, OMEGA) && equal(dom(y), ONE)) {
                return plus(fund(x, fund(y, Z)), Goal(a, fund(b, Z)));
            }
            else {
                return Z;
            }
        }
        else if (equal(domb, OMEGA)) {
            return Goal(a, fund(b, y));
        }
        else {
            if (domb.type !== "Goal")
                throw Error("なんでだよ");
            const d = domb.arg;
            const domd = dom(d);
            if (equal(d, b) || less_than(d, b))
                return Goal(a, fund(b, y));
            if (domd.type !== "Goal")
                throw Error("なんでだよ");
            const e = domd.sub;
            if (b.type === "plus") {
                const g = b.add[b.add.length - 1].sub;
                if (less_than(y, OMEGA) && equal(dom(y), ONE)) {
                    const p = fund(x, fund(y, Z));
                    if (p.type !== "Goal")
                        throw Error("なんでだよ");
                    const gamma = p.arg;
                    return Goal(a, fund(b, replace(find(gamma, g), e - 1)));
                }
                else {
                    return Goal(a, fund(b, Z));
                }
            }
            else {
                if (less_than(y, OMEGA) && equal(dom(y), ONE)) {
                    const p = fund(x, fund(y, Z));
                    if (p.type !== "Goal")
                        throw Error("なんでだよ");
                    const gamma = p.arg;
                    return Goal(a, fund(b, replace(gamma, e - 1)));
                }
                else {
                    return Goal(a, fund(b, Z));
                }
            }
        }
    }
}
// ===========================================
// オブジェクトから文字列へ
function term_to_string(t) {
    if (t.type === "zero") {
        return "0";
    }
    else if (t.type === "Goal") {
        if (TO_TEX) return "G_{" + t.sub.toString() + "}(" + term_to_string(t.arg) + ")";
        return "G_" + t.sub.toString() + "(" + term_to_string(t.arg) + ")";
    }
    else {
        return t.add.map(term_to_string).join("+");
    }
}
function abbrviate(str) {
    if (TO_TEX){
        str = str.replace(/G_\{0\}\(0\)/g, "1");
        while (true) {
            const numterm = str.match(/1(\+1)+/);
            if (!numterm) break;
            const matches = numterm[0].match(/1/g);
            if (!matches) throw ("そんなことある？");
            const count = matches.length;
            str = str.replace(numterm[0], count.toString());
        }
        if (ABBR_SMALL_OMEGA)
            str = str.replace(/G_\{0\}\(1\)/g, "ω");
        if (ABBR_LARGE_OMEGA)
            str = str.replace(/G_\{1\}\(0\)/g, "Ω");
        str = to_TeX(str);
        return str;
    }
    str = str.replace(/G_0\(0\)/g, "1");
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
        str = str.replace(/G_0\(1\)/g, "ω");
    if (ABBR_LARGE_OMEGA)
        str = str.replace(/G_1\(0\)/g, "Ω");
    return str;
}
function to_TeX(str) {
    str = str.replace(/G/g, "\\textrm{G}");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    return str;
}
// ===========================================
// position以降のbeginはじまりend終わりの対応するカッコを探し，
// その位置を返す
function search_closure(str, position, begin, end) {
    let count = 0;
    let pos = position;
    while (str[pos] !== begin && pos < str.length) {
        pos += 1;
    }
    for (; pos < str.length; pos += 1) {
        const ch = str[pos];
        if (ch === begin)
            count += 1;
        if (ch === end)
            count -= 1;
        if (count === 0)
            return pos;
    }
    throw Error(`Unclosed braces`);
}
// 最も左のAP
function leftmost_principal(str) {
    const subpos = search_closure(str, 0, "_", "(");
    const argpos = search_closure(str, subpos, "(", ")");
    return str.substring(0, argpos + 1);
}
function string_to_term(str) {
    if (str === "")
        throw Error("Empty string");
    if (str === "0")
        return Z;
    const left = leftmost_principal(str);
    const leftlen = left.length;
    if (left === str)
        return principal_string_to_term(left);
    const remains = str.slice(leftlen + 1);
    return plus(principal_string_to_term(left), string_to_term(remains));
}
function principal_string_to_term(str) {
    if (str.length === 0)
        throw Error(`Empty principal term`);
    let position = 0;
    if (position >= str.length)
        throw Error("PT成分をTermにできなかったよ");
    const ch = str[position];
    if (ch !== "G" && ch !== "g")
        throw Error(`Unexpected token '${ch}' in AP element`);
    position += 1;
    const ch2 = str[position];
    if (ch2 !== "_")
        throw Error(`Unexpected token '${ch2}' after ψ or p`);
    position += 1;
    const ch3 = str[position];
    if (ch3 !== "{") {
        if (ch3 !== "G" && ch3 !== "g" && ch3 !== "0")
            throw Error(`Invalid subscript ${ch3}`);
        const subpos = search_closure(str, position - 1, "_", "(");
        const subst = str.substring(position, subpos);
        const arr = subst.match(/g_0\(0\)/g);
        let sub = 0;
        if (arr !== null) {
            sub = arr.length;
        }
        position = subpos;
        const ch4 = str[position];
        if (ch4 !== "(")
            throw Error(`Invalid subscript ${ch4}`);
        const argpos = search_closure(str, position, "(", ")");
        const arg = str.substring(position + 1, argpos);
        return Goal(sub, string_to_term(arg));
    }
    const subpos = search_closure(str, position, "{", "}");
    const subst = str.substring(position + 1, subpos);
    const arr = subst.match(/g_0\(0\)/g);
    let sub = 0;
    if (arr !== null) {
        sub = arr.length;
    }
    position = subpos + 1;
    const ch4 = str[position];
    if (ch4 !== "(")
        throw Error(`Invalid subscript ${ch4}`);
    const argpos = search_closure(str, position, "(", ")");
    const arg = str.substring(position + 1, argpos);
    return Goal(sub, string_to_term(arg));
}
function sanitize_string(str) {
    str = str.replace(/\s/g, "");
    while (true) {
        const numstr = str.match(/[1-9][0-9]*/);
        if (!numstr)
            break;
        const num = parseInt(numstr[0]);
        let numterm = "g_0(0)";
        for (let i = 1; i < num; i++) {
            numterm += "+g_0(0)";
        }
        str = str.replace(numstr[0], numterm);
    }
    str = str.replace(/[wω]/g, "g_0(g_0(0))");
    str = str.replace(/[WΩ]/g, "g_g_0(0)(0)");
    return str;
}
