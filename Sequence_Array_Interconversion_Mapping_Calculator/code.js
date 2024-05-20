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
        (r.style.display === "none") ? "block" : "none";
}
function compute_trans_S_to_A() {
    const str = document.getElementById("str");
    const output = document.getElementById("output");
    if (!str || !output)
        throw Error("要素がなかったよ");
    let text = "";
    try {
        const x = str.value;
        const ary = x.split(',');
        let numary = Array(ary.length);
        for (let _ = 0; _ < ary.length; _++) {
            numary[_] = Number(ary[_]);
        }
        text = abbrviate(term_to_string(O_STtoRT(numary)));
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
function compute_trans_A_to_S() {
    const str = document.getElementById("str");
    const output = document.getElementById("output");
    if (!str || !output)
        throw Error("要素がなかったよ");
    let text = "";
    try {
        const x = string_to_term(sanitize_string(str.value));
        text = O_RTtoST(x).toString();
    }
    catch (error) {
        console.log(error);
        text = "Invalid";
    }
    output.innerText = text;
}
// "0","1","ω"の形式化
let Z = { type: "zero" };
let ONE = { type: "psi", sub: 0, arg: Z };
let OMEGA = { type: "psi", sub: 0, arg: ONE };
// オブジェクトの相等判定
function equal(s, t) {
    if (s.type === "zero") {
        return t.type === "zero";
    }
    else if (s.type === "plus") {
        if (t.type !== "plus")
            return false;
        if (t.add.length < s.add.length)
            return false;
        for (let i = 0; i < t.add.length; i++) {
            if (!equal(s.add[i], t.add[i]))
                return false;
        }
        return true;
    }
    else {
        if (t.type !== "psi")
            return false;
        return (s.sub === t.sub) && equal(s.arg, t.arg);
    }
}
;
function psi(sub, arg) {
    return { type: "psi", sub: sub, arg: arg };
}
;
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
        else if (b.type === "psi") {
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
// 置き換え
function replace(s, n) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "plus") {
        const a = s.add[0];
        const b = sanitize_plus_term(s.add.slice(1));
        return plus(replace(a, n), replace(b, n));
    }
    else {
        const b = s.arg;
        return psi(n, b);
    }
}
;
// ================================================================
// 数列の定義
// 条件文
function predicate(alpha, m, n) {
    if ((alpha.length === 1 && alpha[0] === 0) || alpha[0] !== 0 || alpha.length === 0)
        throw Error("predicate: alphaが(0)を除いたSPTでない");
    for (let _ = 1; _ < alpha.length; _++) {
        if (alpha[_] === 0)
            throw Error("predicate: alphaが(0)を除いたSPTでない");
    }
    if (m < 0)
        throw Error("predicate: mが0未満");
    if (n < 0)
        throw Error("predicate: nが0未満");
    if (m === 0 || n === 0) {
        return true;
    }
    else if (-1 < m && m < n && n < alpha.length) {
        return predicate(alpha, m - 1, n) && (alpha[m] >= alpha[n]);
    }
    return false;
}
function NF(alpha, n) {
    if ((alpha.length === 1 && alpha[0] === 0) || alpha[0] !== 0 || alpha.length === 0)
        throw Error("predicate: alphaが(0)を除いたSPTでない");
    for (let _ = 1; _ < alpha.length; _++) {
        if (alpha[_] === 0)
            throw Error("predicate: alphaが(0)を除いたSPTでない");
    }
    if (n < 1)
        throw Error("predicate: nが1未満");
    if (predicate(alpha, n - 1, n)) {
        return n;
    }
    return NF(alpha, n - 1);
}
// ================================================================
// 配列to数列の定義
function O_RTtoST(s) {
    if (s.type === "zero") {
        return [];
    }
    else if (s.type === "plus") {
        const a = s.add[0];
        const b = sanitize_plus_term(s.add.slice(1));
        return O_RTtoST(a).concat(O_RTtoST(b));
    }
    else {
        const a = s.sub;
        const b = s.arg;
        const beta = [a];
        const gamma = [...O_RTtoST(b).map((x) => x + (a + 1))];
        return beta.concat(gamma);
    }
}
// 数列to配列の定義
function O_STtoRT(alpha) {
    if (alpha[0] !== 0)
        throw Error("predicate: alphaがSTでない");
    if (alpha.length === 0) {
        return Z;
    }
    else if (alpha.length === 1 && alpha[0] === 0) {
        return ONE;
    }
    else {
        let i = 1;
        for (; i < alpha.length; i++) {
            if (alpha[i] === 0)
                break;
        }
        if (i !== alpha.length) {
            const Left = [...alpha.slice(0, i)];
            const Right = [...alpha.slice(i)];
            return plus(O_STtoRT(Left), O_STtoRT(Right));
        }
        else {
            const MCLeft = [...alpha.slice(0, NF(alpha, alpha.length - 1))];
            const t = O_STtoRT(MCLeft);
            if (t.type !== "psi")
                throw Error("O_STtoRT: tがpsiでない");
            if (t.sub !== 0)
                throw Error("O_STtoRT: t.subが0でない");
            const s = t.arg;
            const plusMCRight = [...alpha.slice(NF(alpha, alpha.length - 1))];
            const delta = alpha[NF(alpha, alpha.length - 1)];
            const MCRight = [...plusMCRight.map((x) => x - delta)];
            return psi(0, plus(s, replace(O_STtoRT(MCRight), delta - 1)));
        }
    }
}
;
// ===========================================
// オブジェクトから文字列へ
function term_to_string(t) {
    if (t.type === "zero") {
        return "0";
    }
    else if (t.type === "psi") {
        return "ψ_{" + t.sub.toString() + "}(" + term_to_string(t.arg) + ")";
        ;
    }
    else {
        return t.add.map(term_to_string).join("+");
    }
}
function abbrviate(str) {
    str = str.replace(/ψ_\{0\}\(0\)/g, "1");
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
        str = str.replace(/ψ_\{0\}\(1\)/g, "ω");
    if (ABBR_LARGE_OMEGA)
        str = str.replace(/ψ_\{1\}\(0\)/g, "Ω");
    if(TO_TEX) str = to_TeX(str);
    return str;
}
function to_TeX(str) {
    str = str.replace(/ψ/g, "\\psi");
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
    while (str[pos] != begin && pos < str.length) {
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
    const subpos = search_closure(str, 0, "{", "}");
    const argpos = search_closure(str, subpos + 1, "(", ")");
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
    if (ch != "ψ" && ch != "p")
        throw Error(`Unexpected token '${ch}' in AP element`);
    position += 1;
    const ch2 = str[position];
    if (ch2 != "_")
        throw Error(`Unexpected token '${ch2}' after ψ or p`);
    position += 1;
    const ch3 = str[position];
    if (ch3 != "{")
        throw Error(`Invalid subscript ${ch3}`);
    const subpos = search_closure(str, position, "{", "}");
    const subst = str.substring(position + 1, subpos);
    let arr = subst.match(/p_\{0\}\(0\)/g);
    let sub = 0;
    if (arr !== null) {
        sub = arr.length;
    }
    position = subpos + 1;
    const ch4 = str[position];
    if (ch4 != "(")
        throw Error(`Invalid subscript ${ch4}`);
    const argpos = search_closure(str, position, "(", ")");
    const arg = str.substring(position + 1, argpos);
    return psi(sub, string_to_term(arg));
}
function sanitize_string(str) {
    str = str.replace(/\s/g, "");
    while (true) {
        const numstr = str.match(/[1-9][0-9]*/);
        if (!numstr)
            break;
        const num = parseInt(numstr[0]);
        let numterm = "p_{0}(0)";
        for (let i = 1; i < num; i++) {
            numterm += "+p_{0}(0)";
        }
        str = str.replace(numstr[0], numterm);
    }
    str = str.replace(/[wω]/g, "p_{0}(p_{0}(0))");
    str = str.replace(/[WΩ]/g, "p_{1}(0)");
    return str;
}
