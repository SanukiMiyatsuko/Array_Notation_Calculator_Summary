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
        (r.style.display == "none") ? "block" : "none";
}
function compute_nG() {
    const str = document.getElementById("str");
    lambda = variable(str.value);
    const output = document.getElementById("output");
    if (!str || !output)
        throw Error("要素がなかったよ");
    let text = "";
    try {
        const x = string_to_term(sanitize_string(str.value));
        text = abbrviate(term_to_string(nG(x)));
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
    if (a.type == "zero") {
        return b;
    }
    else if (a.type == "Psi") {
        if (b.type == "zero") {
            return a;
        }
        else if (b.type == "Psi") {
            return { type: "plus_2", add_2: [a, b] };
        }
        else {
            return { type: "plus_2", add_2: [a, ...b.add_2] };
        }
    }
    else {
        if (b.type == "zero") {
            return a;
        }
        else if (b.type == "Psi") {
            return { type: "plus_2", add_2: [...a.add_2, b] };
        }
        else {
            return { type: "plus_2", add_2: a.add_2.concat(b.add_2) };
        }
    }
}
// 要素が1個の配列は潰してから返す
function sanitize_plus_term_2(arr_2) {
    if (arr_2.length == 1) {
        return { type: "Psi", sub: arr_2[0].sub, arg: arr_2[0].arg };
    }
    else {
        return { type: "plus_2", add_2: arr_2 };
    }
}
function replace(s, n) {
    if (s.type == "zero") {
        return Z;
    }
    else if (s.type == "plus_2") {
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
// ============================================
// 関数の定義
function nG(s) {
    if (s.type == "zero") {
        return Z;
    }
    else if (s.type == "plus_lambda") {
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
// ======================================
// オブジェクトから文字列へ
function term_to_string(t) {
    if (t.type === "zero") {
        return "0";
    }
    else if (t.type === "Psi") {
        if (TO_TEX) return "Ψ_{" + t.sub.toString() + "}(" + term_to_string(t.arg) + ")";
        return "Ψ_" + t.sub.toString() + "(" + term_to_string(t.arg) + ")";
    }
    else {
        return t.add_2.map(term_to_string).join("+");
    }
}
function abbrviate(str) {
    if (TO_TEX){
        str = str.replace(/Ψ_\{0\}\(0\)/g, "1");
        while (true) {
            const numterm = str.match(/1(\+1)+/);
            if (!numterm) break;
            const matches = numterm[0].match(/1/g);
            if (!matches) throw ("そんなことある？")
            const count = matches.length;
            str = str.replace(numterm[0], count.toString());
        }
        if (ABBR_SMALL_OMEGA) str = str.replace(/Ψ_\{0\}\(1\)/g, "ω");
        if (ABBR_LARGE_OMEGA) str = str.replace(/Ψ_\{1\}\(0\)/g, "Ω");
        if (TO_TEX) str = to_TeX(str);
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
    str = str.replace(/Ψ/g, "\\Psi");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
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
    let i = 1;
    compo[0] = -1;
    compo[lambda] = str.length;
    for (let pos = 0; pos < str.length; pos += 1) {
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
    if (str.match(/[pψ]/)) {
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
    return plus_lambda(principal_string_to_term(left), string_to_term(remains));
}
function principal_string_to_term(str) {
    if (str.length == 0)
        throw Error(`Empty principal term`);
    let position = 0;
    if (position >= str.length)
        throw Error("PT成分をTermにできなかったよ");
    const ch = str[position];
    if (ch != "ψ" && ch != "p")
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
    return psi(array);
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
        let numterm = "p(" + array + ")";
        for (let i = 1; i < num; i++) {
            numterm += "+p(" + array + ")";
        }
        str = str.replace(numstr[0], numterm);
    }
    if (lambda == 1 && str.match(/[wω]/)) {
        str = str.replace(/[wω]/g, "p(p(0))");
    }
    else {
        let array_1 = "0";
        for (let _i = 1; _i < lambda - 1; _i++) {
            array_1 = array_1 + ",0";
        }
        str = str.replace(/[wω]/g, "p(" + array_1 + ",p(" + array_1 + ",0))");
    }
    if (lambda == 1 && str.match(/[WΩ]/))
        throw Error("Ωはないよなぁ？");
    if (lambda == 2) {
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
    if (lambda == 3) {
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
