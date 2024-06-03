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
        (r.style.display === "none") ? "block" : "none";
}
function compute_nG() {
    const str = document.getElementById("str");
    lambda = variable_Tlambda_to_T2(str.value);
    const output = document.getElementById("output");
    if (!str || !output)
        throw Error("要素がなかったよ");
    let text = "";
    try {
        const x = string_to_term_Tlambda_to_T2(sanitize_string_Tlambda_to_T2(str.value));
        text = abbrviate_Tlambda_to_T2(term_to_string_Tlambda_to_T2(nG(x)));
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
function compute_nGinv() {
    const str = document.getElementById("str");
    lambda = variable_T2_to_Tlambda(str.value);
    const output = document.getElementById("output");
    if (!str || !output)
        throw Error("要素がなかったよ");
    let text = "";
    try {
        const x = string_to_term_T2_to_Tlambda(sanitize_string_T2_to_Tlambda(str.value));
        text = abbrviate_T2_to_Tlambda(term_to_string_T2_to_Tlambda(nGinv(x)));
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
// ==================================================
// ψ表記の定義
let lambda; // 変数の個数λ
// "0","1","ω"の形式化
let Z = { type: "zero" };
function psi(arr_lambda) {
    return { type: "psi", arr_lambda: arr_lambda };
}
;
// a+b を適切に整形して返す
function plus_lambda(a, b) {
    if (a.type === "zero") {
        return b;
    }
    else if (a.type === "psi") {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "psi") {
            return { type: "plus_lambda", add_lambda: [a, b] };
        }
        else {
            return { type: "plus_lambda", add_lambda: [a, ...b.add_lambda] };
        }
    }
    else {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "psi") {
            return { type: "plus_lambda", add_lambda: [...a.add_lambda, b] };
        }
        else {
            return { type: "plus_lambda", add_lambda: a.add_lambda.concat(b.add_lambda) };
        }
    }
}
;
// 要素が1個の配列は潰してから返す
function sanitize_plus_term_lambda(add_lambda) {
    if (add_lambda.length === 1) {
        return add_lambda[0];
    }
    else {
        return { type: "plus_lambda", add_lambda: add_lambda };
    }
}
;
function Psi(sub, arg) {
    return { type: "Psi", sub: sub, arg: arg };
}
// a+b を適切に整形して返す
function plus_2(a, b) {
    if (a.type === "zero") {
        return b;
    }
    else if (a.type === "Psi") {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "Psi") {
            return { type: "plus_2", add_2: [a, b] };
        }
        else {
            return { type: "plus_2", add_2: [a, ...b.add_2] };
        }
    }
    else {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "Psi") {
            return { type: "plus_2", add_2: [...a.add_2, b] };
        }
        else {
            return { type: "plus_2", add_2: a.add_2.concat(b.add_2) };
        }
    }
}
// 要素が1個の配列は潰してから返す
function sanitize_plus_term_2(arr_2) {
    if (arr_2.length === 1) {
        return { type: "Psi", sub: arr_2[0].sub, arg: arr_2[0].arg };
    }
    else {
        return { type: "plus_2", add_2: arr_2 };
    }
}
function replace(s, n) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "plus_2") {
        const a = s.add_2[0];
        const b = sanitize_plus_term_2(s.add_2.slice(1));
        return plus_2(replace(a, n), replace(b, n));
    }
    else {
        const b = s.arg;
        return Psi(n, b);
    }
}
function addarr(alpha) {
    if (alpha.length === 0) {
        throw Error("空列入れんな");
    }
    else if (alpha.length === 1) {
        return replace(alpha[0], lambda - 1);
    }
    else {
        const a = addarr(alpha.slice(0, alpha.length - 1));
        const b = replace(alpha[alpha.length - 1], lambda - alpha.length);
        return plus_2(a, b);
    }
}
// ==================================================
// 関数の定義
function nG(s) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "plus_lambda") {
        const a = s.add_lambda[0];
        const b = sanitize_plus_term_lambda(s.add_lambda.slice(1));
        return plus_2(nG(a), nG(b));
    }
    else {
        const alpha = s.arr_lambda;
        const beta = alpha.map((x) => nG(x));
        return Psi(0, addarr(beta));
    }
}
function auxiliary(s, foo) {
    if (s.type === "zero") {
        return foo;
    }
    else if (s.type === "plus_2") {
        const left = s.add_2[0];
        const right = sanitize_plus_term_2(s.add_2.slice(1));
        foo[lambda - left.sub - 1] = plus_lambda(foo[lambda - left.sub - 1], nGinv(left));
        return auxiliary(right, foo);
    }
    else {
        foo[lambda - s.sub - 1] = plus_lambda(foo[lambda - s.sub - 1], nGinv(s));
        return foo;
    }
}
function nGinv(s) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "plus_2") {
        const a = s.add_2[0];
        const b = sanitize_plus_term_2(s.add_2.slice(1));
        return plus_lambda(nGinv(a), nGinv(b));
    }
    else {
        const b = s.arg;
        const foo = Array(lambda).fill(Z);
        return psi(auxiliary(b, foo));
    }
}
// Tlambda_to_T2===========================================
// オブジェクトから文字列へ
function term_to_string_Tlambda_to_T2(t) {
    if (t.type === "zero") {
        return "0";
    }
    else if (t.type === "Psi") {
        if (TO_TEX) return "Ψ_{" + t.sub.toString() + "}(" + term_to_string_Tlambda_to_T2(t.arg) + ")";
        return "Ψ_" + t.sub.toString() + "(" + term_to_string_Tlambda_to_T2(t.arg) + ")";
    }
    else {
        return t.add_2.map(term_to_string_Tlambda_to_T2).join("+");
    }
}
function abbrviate_Tlambda_to_T2(str) {
    if (TO_TEX){
        str = str.replace(/Ψ_\{0\}\(0\)/g, "1");
        while (true) {
            const numterm = str.match(/1(\+1)+/);
            if (!numterm) break;
            const matches = numterm[0].match(/1/g);
            if (!matches) throw ("そんなことある？");
            const count = matches.length;
            str = str.replace(numterm[0], count.toString());
        }
        if (ABBR_SMALL_OMEGA)
            str = str.replace(/Ψ_\{0\}\(1\)/g, "ω");
        if (ABBR_LARGE_OMEGA)
            str = str.replace(/Ψ_\{1\}\(0\)/g, "Ω");
        str = to_TeX(str);
        return str;
    }
    str = str.replace(/Ψ_0\(0\)/g, "1");
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
        str = str.replace(/Ψ_0\(1\)/g, "ω");
    if (ABBR_LARGE_OMEGA)
        str = str.replace(/Ψ_1\(0\)/g, "Ω");
    return str;
}
function to_TeX(str) {
    str = str.replace(/ψ/g, "\\psi");
    str = str.replace(/Ψ/g, "\\Psi");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    str = str.replace(/I/g, "\\textrm{I}");
    return str;
}
// ===========================================
// position以降の"("に対応する")"を探し，
// その位置を返す
function search_closure_Tlambda_to_T2(str, position) {
    let count = 0;
    let pos = position;
    while (str[pos] !== "(" && pos < str.length) { // なぜか" && pos < str.length"この呪文を入れないと自分の環境では実行できません。
        if (pos >= str.length)
            throw Error("(が見つからないよ。閉じ括弧の関数だよ");
        pos += 1;
    }
    for (; pos < str.length; pos += 1) {
        const ch = str[pos];
        if (ch === "(")
            count += 1;
        if (ch === ")")
            count -= 1;
        if (count === 0)
            return pos;
    }
    throw Error(`Unclosed braces`);
}
function search_open_parenthesis_Tlambda_to_T2(str) {
    let pos = 0;
    while (str[pos] !== "(") { // なぜか" && pos < str.length"この呪文を入れないと自分の環境では実行できません。
        if (pos >= str.length)
            throw Error("「(」が見つからないよ。開き括弧の関数だよ");
        pos += 1;
    }
    return pos;
}
// commaの位置を列挙する。
function search_comma_Tlambda_to_T2(str) {
    let count = 0;
    let compo = Array(lambda + 1);
    let i = 1;
    compo[0] = -1;
    compo[lambda] = str.length;
    for (let pos = 0; pos < str.length; pos += 1) {
        const ch = str[pos];
        if (ch === "(")
            count += 1;
        if (ch === ")")
            count -= 1;
        if (count === 0 && ch === ",") {
            if (i >= lambda)
                throw Error("変数が多いよ");
            compo[i] = pos;
            i += 1;
        }
    }
    return compo;
}
// 変数の個数を返す
function variable_Tlambda_to_T2(str) {
    if (str.match(/[pψ]/)) {
        let i = 1;
        const argpos = search_closure_Tlambda_to_T2(str, 1);
        const argopen = search_open_parenthesis_Tlambda_to_T2(str);
        const arg = str.substring(argopen + 1, argpos);
        let count = 0;
        for (let pos = 0; pos < arg.length; pos += 1) {
            const ch = arg[pos];
            if (ch === "(")
                count += 1;
            if (ch === ")")
                count -= 1;
            if (count === 0 && ch === ",") {
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
function leftmost_principal_Tlambda_to_T2(str) {
    const argpos = search_closure_Tlambda_to_T2(str, 0);
    return str.substring(0, argpos + 1);
}
function string_to_term_Tlambda_to_T2(str) {
    if (str === "")
        throw Error("Empty string");
    if (str === "0")
        return Z;
    const left = leftmost_principal_Tlambda_to_T2(str);
    const leftlen = left.length;
    if (left === str)
        return principal_string_to_term_Tlambda_to_T2(left);
    const remains = str.slice(leftlen + 1);
    return plus_lambda(principal_string_to_term_Tlambda_to_T2(left), string_to_term_Tlambda_to_T2(remains));
}
function principal_string_to_term_Tlambda_to_T2(str) {
    if (str.length === 0)
        throw Error(`Empty principal term`);
    let position = 0;
    if (position >= str.length)
        throw Error("PT成分をTermにできなかったよ");
    const ch = str[position];
    if (ch !== "ψ" && ch !== "p")
        throw Error(`Unexpected token '${ch}' in AP element`);
    position += 1;
    const ch4 = str[position];
    if (ch4 !== "(")
        throw Error(`Invalid subscript ${ch4}`);
    const argpos = search_closure_Tlambda_to_T2(str, position);
    const arg = str.substring(position + 1, argpos);
    let array = Array(lambda);
    const arg_comma = search_comma_Tlambda_to_T2(arg);
    for (let i = 0; i < lambda; i++) {
        const index = arg.substring(arg_comma[i] + 1, arg_comma[i + 1]);
        array[i] = string_to_term_Tlambda_to_T2(index);
    }
    return psi(array);
}
function sanitize_string_Tlambda_to_T2(str) {
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
        let numterm = "p(" + array + ")";
        for (let i = 1; i < num; i++) {
            numterm += "+p(" + array + ")";
        }
        str = str.replace(numstr[0], numterm);
    }
    if (lambda === 1 && str.match(/[wω]/)) {
        str = str.replace(/[wω]/g, "p(p(0))");
    }
    else {
        let array_1 = "0";
        for (let _i = 1; _i < lambda - 1; _i++) {
            array_1 = array_1 + ",0";
        }
        str = str.replace(/[wω]/g, "p(" + array_1 + ",p(" + array_1 + ",0))");
    }
    if (lambda === 1 && str.match(/[WΩ]/))
        throw Error("Ωはないよなぁ？");
    if (lambda === 2) {
        str = str.replace(/[WΩ]/g, "p(p(0,0),0)");
    }
    else {
        let array_2 = "0";
        for (let _i = 1; _i < lambda - 2; _i++) {
            array_2 = array_2 + ",0";
        }
        str = str.replace(/[WΩ]/g, "p(" + array_2 + ",p(" + array_2 + ",0,0),0)");
    }
    if (lambda <= 2 && str.match("I"))
        throw Error("Iはないよなぁ？");
    if (lambda === 3) {
        str = str.replace(/I/g, "p(p(0,0,0),0,0)");
    }
    else {
        let array_3 = "0";
        for (let _i = 1; _i < lambda - 3; _i++) {
            array_3 = array_3 + ",0";
        }
        str = str.replace(/I/g, "p(" + array_3 + ",p(" + array_3 + ",0,0,0),0,0)");
    }
    return str;
}
// T2_to_Tlambda===========================================
// オブジェクトから文字列へ
function term_to_string_T2_to_Tlambda(t) {
    if (t.type === "zero") {
        return "0";
    }
    else if (t.type === "psi") {
        let array = term_to_string_T2_to_Tlambda(t.arr_lambda[0]);
        for (let i = 1; i < lambda; i++) {
            array = array + "," + term_to_string_T2_to_Tlambda(t.arr_lambda[i]);
        }
        return "ψ(" + array + ")";
    }
    else {
        return t.add_lambda.map(term_to_string_T2_to_Tlambda).join("+");
    }
}
function abbrviate_T2_to_Tlambda(str) {
    let array = "0";
    for (let _i = 1; _i < lambda; _i++) {
        array = array + ",0";
    }
    const re = new RegExp("ψ\\(" + array + "\\)", "g");
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
        if (lambda === 1) {
            str = str.replace(/ψ\(1\)/g, "ω");
        }
        else {
            let array_1 = "0";
            for (let _i = 1; _i < lambda - 1; _i++) {
                array_1 = array_1 + ",0";
            }
            array_1 = array_1 + ",1";
            const re_1 = new RegExp("ψ\\(" + array_1 + "\\)", "g");
            str = str.replace(re_1, "ω");
        }
    }
    if (ABBR_LARGE_OMEGA) {
        if (lambda === 2) {
            str = str.replace(/ψ\(1,0\)/g, "Ω");
        }
        else {
            let array_2 = "0";
            for (let _i = 1; _i < lambda - 2; _i++) {
                array_2 = array_2 + ",0";
            }
            array_2 = array_2 + ",1,0";
            const re_2 = new RegExp("ψ\\(" + array_2 + "\\)", "g");
            str = str.replace(re_2, "Ω");
        }
    }
    if (ABBR_LARGE_IOTA) {
        if (lambda === 3) {
            str = str.replace(/ψ\(1,0,0\)/g, "I");
        }
        else {
            let array_3 = "0";
            for (let _i = 1; _i < lambda - 3; _i++) {
                array_3 = array_3 + ",0";
            }
            array_3 = array_3 + ",1,0,0";
            const re_3 = new RegExp("ψ\\(" + array_3 + "\\)", "g");
            str = str.replace(re_3, "I");
        }
    }
    if (TO_TEX) str = to_TeX(str);
    return str;
}
// ===========================================
// position以降の"("に対応する")"を探し，
// その位置を返す
function search_closure_T2_to_Tlambda(str, position, begin, end) {
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
function leftmost_principal_T2_to_Tlambda(str) {
    const subpos = search_closure_T2_to_Tlambda(str, 0, "_", "(");
    const argpos = search_closure_T2_to_Tlambda(str, subpos, "(", ")");
    return str.substring(0, argpos + 1);
}
function string_to_string_T2_to_Tlambda(str) {
    if (str === "")
        throw Error("Empty string");
    if (str === "I") 
        throw Error("Iは2変数ではありません。");
    if (str === "0")
        return "0";
    const left = leftmost_principal_T2_to_Tlambda(str);
    const leftlen = left.length;
    if (left === str)
        return principal_string_to_string_T2_to_Tlambda(left);
    const remains = str.slice(leftlen + 1);
    return principal_string_to_string_T2_to_Tlambda(left) + "+" + string_to_string_T2_to_Tlambda(remains);
}
function principal_string_to_string_T2_to_Tlambda(str) {
    if (str.length === 0)
        throw Error(`Empty principal term`);
    let position = 0;
    if (position >= str.length)
        throw Error("PT成分をTermにできなかったよ");
    const ch = str[position];
    if (ch !== "Ψ" && ch !== "P")
        throw Error(`Unexpected token '${ch}' in AP element`);
    position += 1;
    const ch2 = str[position];
    if (ch2 !== "_")
        throw Error(`Unexpected token '${ch2}' after ψ or p`);
    position += 1;
    const ch3 = str[position];
    if (ch3 !== "{") {
        if (ch3 !== "Ψ" && ch3 !== "P" && ch3 !== "0")
            throw Error(`Invalid subscript ${ch3}`);
        const subpos = search_closure_T2_to_Tlambda(str, position - 1, "_", "(");
        const subst = str.substring(position, subpos);
        const arr = subst.match(/P_0\(0\)/g);
        let sub = 0;
        if (arr !== null) {
            sub = arr.length;
        }
        position = subpos;
        const ch4 = str[position];
        if (ch4 !== "(")
            throw Error(`Invalid subscript ${ch4}`);
        const argpos = search_closure_T2_to_Tlambda(str, position, "(", ")");
        const arg = str.substring(position + 1, argpos);
        return "P_" + sub.toString() + "(" + string_to_string_T2_to_Tlambda(arg) + ")";
    }
    const subpos = search_closure_T2_to_Tlambda(str, position, "{", "}");
    const subst = str.substring(position + 1, subpos);
    const arr = subst.match(/P_0\(0\)/g);
    let sub = 0;
    if (arr !== null) {
        sub = arr.length;
    }
    position = subpos + 1;
    const ch4 = str[position];
    if (ch4 !== "(")
        throw Error(`Invalid subscript ${ch4}`);
    const argpos = search_closure_T2_to_Tlambda(str, position, "(", ")");
    const arg = str.substring(position + 1, argpos);
    return "P_" + sub.toString() + "(" + string_to_string_T2_to_Tlambda(arg) + ")";
}
// 変数の個数を返す
function variable_T2_to_Tlambda(str) {
    if (str === "0")
        return 1;
    str = sanitize_string_T2_to_Tlambda(str);
    str = string_to_string_T2_to_Tlambda(str);
    const numstr = str.match(/[1-9][0-9]*/);
    if (!numstr) return 1;
    let num = Array(numstr.length);
    for (let _ = 0; _ < numstr.length; _++) {
        num[_] = parseInt(numstr[_]);
    }
    return Math.max(...num) + 1;
}
function string_to_term_T2_to_Tlambda(str) {
    if (str === "")
        throw Error("Empty string");
    if (str === "0")
        return Z;
    const left = leftmost_principal_T2_to_Tlambda(str);
    const leftlen = left.length;
    if (left === str)
        return principal_string_to_term_T2_to_Tlambda(left);
    const remains = str.slice(leftlen + 1);
    return plus_2(principal_string_to_term_T2_to_Tlambda(left), string_to_term_T2_to_Tlambda(remains));
}
function principal_string_to_term_T2_to_Tlambda(str) {
    if (str.length === 0)
        throw Error(`Empty principal term`);
    let position = 0;
    if (position >= str.length)
        throw Error("PT成分をTermにできなかったよ");
    const ch = str[position];
    if (ch !== "Ψ" && ch !== "P")
        throw Error(`Unexpected token '${ch}' in AP element`);
    position += 1;
    const ch2 = str[position];
    if (ch2 !== "_")
        throw Error(`Unexpected token '${ch2}' after ψ or p`);
    position += 1;
    const ch3 = str[position];
    if (ch3 !== "{") {
        if (ch3 !== "Ψ" && ch3 !== "P" && ch3 !== "0")
            throw Error(`Invalid subscript ${ch3}`);
        const subpos = search_closure_T2_to_Tlambda(str, position - 1, "_", "(");
        const subst = str.substring(position, subpos);
        const arr = subst.match(/P_0\(0\)/g);
        let sub = 0;
        if (arr !== null) {
            sub = arr.length;
        }
        position = subpos;
        const ch4 = str[position];
        if (ch4 !== "(")
            throw Error(`Invalid subscript ${ch4}`);
        const argpos = search_closure_T2_to_Tlambda(str, position, "(", ")");
        const arg = str.substring(position + 1, argpos);
        return Psi(sub, string_to_term_T2_to_Tlambda(arg));
    }
    const subpos = search_closure_T2_to_Tlambda(str, position, "{", "}");
    const subst = str.substring(position + 1, subpos);
    const arr = subst.match(/P_0\(0\)/g);
    let sub = 0;
    if (arr !== null) {
        sub = arr.length;
    }
    position = subpos + 1;
    const ch4 = str[position];
    if (ch4 !== "(")
        throw Error(`Invalid subscript ${ch4}`);
    const argpos = search_closure_T2_to_Tlambda(str, position, "(", ")");
    const arg = str.substring(position + 1, argpos);
    return Psi(sub, string_to_term_T2_to_Tlambda(arg));
}
function sanitize_string_T2_to_Tlambda(str) {
    str = str.replace(/\s/g, "");
    while (true) {
        const numstr = str.match(/[1-9][0-9]*/);
        if (!numstr)
            break;
        const num = parseInt(numstr[0]);
        let numterm = "P_0(0)";
        for (let i = 1; i < num; i++) {
            numterm += "+P_0(0)";
        }
        str = str.replace(numstr[0], numterm);
    }
    str = str.replace(/[wω]/g, "P_0(P_0(0))");
    str = str.replace(/[WΩ]/g, "P_{P_0(0)}(0)");
    return str;
}
