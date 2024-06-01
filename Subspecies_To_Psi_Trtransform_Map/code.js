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
function compute_trans() {
    const str = document.getElementById("str");
    lambda = variable(str.value);
    const output = document.getElementById("output");
    if (!str || !output)
        throw Error("要素がなかったよ");
    let text = "";
    try {
        const x = string_to_term(sanitize_string(str.value));
        text = abbrviate(term_to_string(truns(x)));
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
// ================================================================
// 表記Sの定義
let lambda;
// "0"の形式化
const Z = { type: "zero" };
// オブジェクトの相等判定
function equal(s, t) {
    if (s.type === "zero") {
        return t.type === "zero";
    }
    else if (s.type === "pluss") {
        if (t.type !== "pluss")
            return false;
        if (t.adds.length !== s.adds.length)
            return false;
        for (let i = 0; i < t.adds.length; i++)
            if (!equal(s.adds[i], t.adds[i]))
                return false;
        return true;
    }
    else {
        if (t.type !== "subspecies")
            return false;
        for (let i = 0; i < t.arr.length; i++)
            if (!equal(s.arr[i], t.arr[i]))
                return false;
        return true;
    }
}
;
function subspecies(arr) {
    return { type: "subspecies", arr: arr };
}
;
// a+b を適切に整形して返す
function plus_S(a, b) {
    if (a.type === "zero") {
        return b;
    }
    else if (a.type === "subspecies") {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "subspecies") {
            return { type: "pluss", adds: [a, b] };
        }
        else {
            return { type: "pluss", adds: [a, ...b.adds] };
        }
    }
    else {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "subspecies") {
            return { type: "pluss", adds: [...a.adds, b] };
        }
        else {
            return { type: "pluss", adds: a.adds.concat(b.adds) };
        }
    }
}
;
// 要素が1個の配列は潰してから返す
function sanitize_plus_term_S(adds) {
    if (adds.length === 1) {
        return adds[0];
    }
    else {
        return { type: "pluss", adds: adds };
    }
}
;
// "1"の形式化
const ONE_B = { type: "psi", sub: 0, arg: Z };
// オブジェクトの相等判定
function equal_B(s, t) {
    if (s.type === "zero") {
        return t.type === "zero";
    }
    else if (s.type === "plusb") {
        if (t.type !== "plusb")
            return false;
        if (t.addb.length < s.addb.length)
            return false;
        for (let i = 0; i < t.addb.length; i++) {
            if (!equal_B(s.addb[i], t.addb[i]))
                return false;
        }
        return true;
    }
    else {
        if (t.type !== "psi")
            return false;
        return (s.sub === t.sub) && equal_B(s.arg, t.arg);
    }
}
;
function psi(subb, argb) {
    return { type: "psi", sub: subb, arg: argb };
}
;
// a+b を適切に整形して返す
function plus_B(a, b) {
    if (a.type === "zero") {
        return b;
    }
    else if (a.type === "psi") {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "psi") {
            return { type: "plusb", addb: [a, b] };
        }
        else {
            return { type: "plusb", addb: [a, ...b.addb] };
        }
    }
    else {
        if (b.type === "zero") {
            return a;
        }
        else if (b.type === "psi") {
            return { type: "plusb", addb: [...a.addb, b] };
        }
        else {
            return { type: "plusb", addb: a.addb.concat(b.addb) };
        }
    }
}
;
// 要素が1個の配列は潰してから返す
function sanitize_plus_term_B(addb) {
    if (addb.length === 1) {
        return addb[0];
    }
    else {
        return { type: "plusb", addb: addb };
    }
}
;
// s <_T t を判定
function less_than_B(s, t) {
    if (s.type === "zero") {
        return t.type !== "zero";
    }
    else if (s.type === "psi") {
        if (t.type === "zero") {
            return false;
        }
        else if (t.type === "psi") {
            return (s.sub < t.sub) ||
                ((s.sub === t.sub) && less_than_B(s.arg, t.arg));
        }
        else {
            return equal_B(s, t.addb[0]) || less_than_B(s, t.addb[0]);
        }
    }
    else {
        if (t.type === "zero") {
            return false;
        }
        else if (t.type === "psi") {
            return less_than_B(s.addb[0], t);
        }
        else {
            const s2 = sanitize_plus_term_B(s.addb.slice(1));
            const t2 = sanitize_plus_term_B(t.addb.slice(1));
            return less_than_B(s.addb[0], t.addb[0]) ||
                (equal_B(s.addb[0], t.addb[0]) && less_than_B(s2, t2));
        }
    }
}
// ================================================================
// 関数の定義
//ポジティブ_L
function partition_L(n, s) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "plusb") {
        const a = s.addb[0];
        const b = sanitize_plus_term_B(s.addb.slice(1));
        return plus_B(partition_L(n, a), partition_L(n, b));
    }
    else {
        const a = s.sub;
        if (a > n)
            return s;
        return Z;
    }
}
//ポジティブ_S
function partition_S(n, s) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "plusb") {
        const a = s.addb[0];
        const b = sanitize_plus_term_B(s.addb.slice(1));
        return plus_B(partition_S(n, a), partition_S(n, b));
    }
    else {
        const a = s.sub;
        if (a > n)
            return Z;
        return s;
    }
}
//N
function early_collapse(n, s) {
    if (equal_B(partition_L(n, s), Z))
        return partition_S(n, s);
    return plus_B(psi(n, partition_L(n, s)), partition_S(n, s));
}
//Ω×
function CARD_Times(n, s) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "plusb") {
        const a = s.addb[0];
        const b = sanitize_plus_term_B(s.addb.slice(1));
        return plus_B(CARD_Times(n, a), CARD_Times(n, b));
    }
    else {
        const a = s.sub;
        const b = s.arg;
        if (a < n) {
            if (a === 0)
                return psi(n, early_collapse(a, b));
            return psi(n, plus_B(psi(a, Z), early_collapse(a, b)));
        }
        else if (a === n) {
            if (less_than_B(b, psi(n, ONE_B)))
                return psi(n, plus_B(psi(n, Z), b));
            return psi(n, b);
        }
        else {
            return psi(n, b);
        }
    }
}
//前者？
function Lpred(s) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "psi") {
        if (equal_B(s, ONE_B))
            return Z;
        return s;
    }
    else {
        const a = s.addb[0];
        const b = sanitize_plus_term_B(s.addb.slice(1));
        if (equal_B(a, ONE_B))
            return b;
        return s;
    }
}
// sum
function sum(k, s) {
    if (k <= 0) {
        return early_collapse(k, truns(s.arr[lambda - k - 1]));
    }
    else if (k === lambda - 1) {
        const a_k = s.arr[lambda - k - 1];
        const b = CARD_Times(k, Lpred(early_collapse(k, truns(a_k))));
        return plus_B(b, sum(k - 1, s));
    }
    else {
        const a_k = s.arr[lambda - k - 1];
        const b = CARD_Times(k, early_collapse(k, truns(a_k)));
        return plus_B(b, sum(k - 1, s));
    }
}
;
// 変換(t)
function truns(s) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "pluss") {
        const a = s.adds[0];
        const b = sanitize_plus_term_S(s.adds.slice(1));
        return plus_B(truns(a), truns(b));
    }
    else {
        let k = 0;
        while (k < lambda) {
            if (!equal(s.arr[k], Z))
                break;
            k++;
        }
        if (k > lambda - 2)
            return psi(0, truns(s.arr[lambda - 1]));
        const t = sum(lambda - k - 1, s);
        if (t.type === "zero")
            return psi(lambda - k - 1, Z);
        if (t.type === "plusb") {
            if (less_than_B(t.addb[0].arg, psi(lambda - k, Z)))
                return psi(lambda - k - 1, t);
            if (equal_B(partition_S(k, t.addb[0].arg), Z)) {
                const u = sanitize_plus_term_B(t.addb.slice(1));
                return psi(lambda - k - 1, plus_B(partition_L(k, t.addb[0].arg), u));
            }
            else {
                return psi(lambda - k - 1, plus_B(partition_L(k, t.addb[0].arg), t));
            }
        }
        else {
            if (less_than_B(t.arg, psi(lambda - k, Z)))
                return psi(lambda - k - 1, t);
            if (equal_B(partition_S(k, t.arg), Z)) {
                return psi(lambda - k - 1, partition_L(k, t.arg));
            }
            else {
                return psi(lambda - k - 1, plus_B(partition_L(k, t.arg), t));
            }
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
    }
    else {
        return t.addb.map(term_to_string).join("+");
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
    if (str.match(/[A亞]/)) {
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
    return plus_S(principal_string_to_term(left), string_to_term(remains));
}
function principal_string_to_term(str) {
    if (str.length == 0)
        throw Error(`Empty principal term`);
    let position = 0;
    if (position >= str.length)
        throw Error("PT成分をTermにできなかったよ");
    const ch = str[position];
    if (ch != "亞" && ch != "A")
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
        let numterm = "A(" + array + ")";
        for (let i = 1; i < num; i++) {
            numterm += "+A(" + array + ")";
        }
        str = str.replace(numstr[0], numterm);
    }
    if (lambda == 1 && str.match(/[wω]/)) {
        str = str.replace(/[wω]/g, "A(A(0))");
    }
    else {
        let array_1 = "0";
        for (let _i = 1; _i < lambda - 1; _i++) {
            array_1 = array_1 + ",0";
        }
        str = str.replace(/[wω]/g, "A(" + array_1 + ",A(" + array_1 + ",0))");
    }
    if (lambda == 1 && str.match(/[WΩ]/))
        throw Error("Ωはないよなぁ？");
    if (lambda == 2) {
        str = str.replace(/[WΩ]/g, "A(A(0,0),0)");
    }
    else {
        let array_2 = "0";
        for (let _i = 1; _i < lambda - 2; _i++) {
            array_2 = array_2 + ",0";
        }
        str = str.replace(/[WΩ]/g, "A(" + array_2 + ",A(" + array_2 + ",0,0),0)");
    }
    if (lambda <= 2 && str.match("I"))
        throw Error("Iはないよなぁ？");
    if (lambda == 3) {
        str = str.replace(/I/g, "A(A(0,0,0),0,0)");
    }
    else {
        let array_3 = "0";
        for (let _i = 1; _i < lambda - 3; _i++) {
            array_3 = array_3 + ",0";
        }
        str = str.replace(/I/g, "A(" + array_3 + ",A(" + array_3 + ",0,0,0),0,0)");
    }
    return str;
}
