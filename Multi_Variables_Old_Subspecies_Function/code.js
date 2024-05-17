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
    if (TO_TEX) {
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
    if (TO_TEX) {
        katex.render(text, output);
    } else {
        output.innerText = text;
    }
}
// "0","1","ω"の形式化
let Z = { type: "zero" };
let ONE = { type: "subspecies", arr: [Z] };
let OMEGA = { type: "subspecies", arr: [ONE] };
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
        if (t.type !== "subspecies")
            return false;
        const m = s.arr.length;
        const n = t.arr.length;
        if (m === n) {
            for (let k = 0; k < n; k++) {
                if (!equal(s.arr[k], t.arr[k]))
                    return false;
            }
            return true;
        }
        else if (m < n) {
            let k = 0;
            while (k < n - m) {
                if (!equal(t.arr[k], Z))
                    return false;
                k++;
            }
            while (k < n) {
                if (!equal(s.arr[k - n + m], t.arr[k]))
                    return false;
                k++;
            }
            return true;
        }
        else {
            let k = 0;
            while (k < m - n) {
                if (!equal(s.arr[k], Z))
                    return false;
                k++;
            }
            while (k < m) {
                if (!equal(t.arr[k - m + n], s.arr[k]))
                    return false;
                k++;
            }
            return true;
        }
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
function less_than(s, t) {
    if (s.type === "zero") {
        return t.type !== "zero";
    }
    else if (s.type === "subspecies") {
        if (t.type === "zero") {
            return false;
        }
        else if (t.type === "subspecies") {
            const m = s.arr.length;
            const n = t.arr.length;
            if (m === n) {
                for (let k = 0; k < n; k++) {
                    if (!equal(s.arr[k], t.arr[k]))
                        return less_than(s.arr[k], t.arr[k]);
                }
                return false;
            }
            else if (m < n) {
                let k = 0;
                while (k < n - m) {
                    if (!equal(t.arr[k], Z))
                        return true;
                    k++;
                }
                while (k < n) {
                    if (!equal(s.arr[k - n + m], t.arr[k]))
                        return less_than(s.arr[k - n + m], t.arr[k]);
                    k++;
                }
                return false;
            }
            else {
                let k = 0;
                while (k < m - n) {
                    if (!equal(s.arr[k], Z))
                        return false;
                    k++;
                }
                while (k < m) {
                    if (!equal(s.arr[k], t.arr[k - m + n]))
                        return less_than(s.arr[k], t.arr[k - m + n]);
                    k++;
                }
                return false;
            }
        }
        else {
            return equal(s, t.add[0]) || less_than(s, t.add[0]);
        }
    }
    else {
        if (t.type === "zero") {
            return false;
        }
        else if (t.type === "subspecies") {
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
// ==================================================
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
        const m = t.arr.length - 1;
        let k_0 = m;
        while (k_0 > -1) {
            if (!equal(t.arr[k_0], Z))
                break;
            k_0--;
        }
        if (k_0 === -1)
            return ONE;
        if (k_0 < m) {
            const dom_k_0 = dom(t.arr[k_0]);
            if (equal(dom_k_0, ONE))
                return t;
            if (equal(dom_k_0, OMEGA))
                return OMEGA;
            if (dom_k_0.type !== "subspecies")
                throw Error("なんでだよ");
            const n = dom_k_0.arr.length - 1;
            let l_0 = n - 1;
            while (l_0 > -1) {
                if (!equal(dom_k_0.arr[l_0], Z))
                    break;
                l_0--;
            }
            if (l_0 === -1)
                throw Error("なんでだよ");
            if (n - l_0 <= m - k_0)
                return dom_k_0;
            return OMEGA;
        }
        return OMEGA;
    }
}
;
// x[y]
function fund(s, t) {
    if (s.type === "zero") {
        return Z;
    }
    else if (s.type === "plus") {
        const lastfund = fund(s.add[s.add.length - 1], t);
        const remains = sanitize_plus_term(s.add.slice(0, s.add.length - 1));
        return plus(remains, lastfund);
    }
    else {
        const m = s.arr.length - 1;
        let k_0 = m;
        while (k_0 > -1) {
            if (!equal(s.arr[k_0], Z))
                break;
            k_0--;
        }
        if (k_0 === -1)
            return Z;
        const dom_k_0 = dom(s.arr[k_0]);
        if (equal(dom_k_0, ONE)) {
            if (k_0 < m) {
                return t;
            }
            else {
                if (equal(dom(t), ONE)) {
                    let sArray = [...s.arr];
                    sArray[m] = fund(s.arr[m], Z);
                    return plus(fund(s, fund(t, Z)), subspecies(sArray));
                }
                else {
                    return Z;
                }
            }
        }
        else if (equal(dom_k_0, OMEGA)) {
            let sArray = [...s.arr];
            sArray[k_0] = fund(s.arr[k_0], t);
            return subspecies(sArray);
        }
        else {
            if (dom_k_0.type !== "subspecies")
                throw Error("なんでだよ");
            const n = dom_k_0.arr.length - 1;
            let l_0 = n - 1;
            while (l_0 > -1) {
                if (!equal(dom_k_0.arr[l_0], Z))
                    break;
                l_0--;
            }
            if (l_0 === -1)
                throw Error("なんでだよ");
            if (n - l_0 <= m - k_0) {
                let sArray = [...s.arr];
                sArray[k_0] = fund(s.arr[k_0], t);
                return subspecies(sArray);
            }
            let u = 0;
            while (u < l_0) {
                if (!equal(dom_k_0.arr[u], Z))
                    break;
                u++;
            }
            if (l_0 === u && equal(dom_k_0.arr[l_0], ONE)) {
                if (equal(dom(t), ONE)) {
                    const p = fund(s, fund(t, Z));
                    if (p.type !== "subspecies")
                        throw Error("なんでだよ");
                    let dom_k_0Array = [...dom_k_0.arr.slice(l_0)];
                    dom_k_0Array[0] = p.arr[k_0];
                    let sArray = [...s.arr];
                    sArray[k_0] = fund(s.arr[k_0], subspecies(dom_k_0Array));
                    return subspecies(sArray);
                }
                else {
                    let sArray = [...s.arr];
                    sArray[k_0] = fund(s.arr[k_0], ONE);
                    return subspecies(sArray);
                }
            }
            else {
                let dom_k_0Array = [...dom_k_0.arr];
                dom_k_0Array[l_0] = fund(dom_k_0.arr[l_0], Z);
                if (equal(dom(t), ONE)) {
                    const p = fund(s, fund(t, Z));
                    if (p.type !== "subspecies")
                        throw Error("なんでだよ");
                    dom_k_0Array[k_0 + 1] = p.arr[k_0];
                    let sArray = [...s.arr];
                    sArray[k_0] = fund(s.arr[k_0], subspecies(dom_k_0Array));
                    return subspecies(sArray);
                }
                else {
                    let sArray = [...s.arr];
                    sArray[k_0] = fund(s.arr[k_0], subspecies(dom_k_0Array));
                    return subspecies(sArray);
                }
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
    else if (t.type === "subspecies") {
        let array = term_to_string(t.arr[0]);
        for (let i = 1; i < t.arr.length; i++) {
            array = array + "," + term_to_string(t.arr[i]);
        }
        return "亞(" + array + ")";
    }
    else {
        return t.add.map(term_to_string).join("+");
    }
}
function abbrviate(str) {
    const re = new RegExp("亞\\(0\\)", "g");
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
    if (ABBR_SMALL_OMEGA)
        str = str.replace(/亞\(1\)/g, "ω");
    if (ABBR_LARGE_OMEGA)
        str = str.replace(/亞\(1,0\)/g, "Ω");
    if (ABBR_LARGE_IOTA)
        str = str.replace(/亞\(1,0,0\)/g, "I");
    if (TO_TEX) str = to_TeX(str);
    return str;
}
function to_TeX(str) {
    str = str.replace(/亞/g, "\\textrm{亞}");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    str = str.replace(/I/g, "\\textrm{I}");
    return str;
}
// ===========================================
// position以降の"("に対応する")"を探し，
// その位置を返す
function search_closure(str, position) {
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
function search_open_parenthesis(str) {
    let pos = 0;
    while (str[pos] !== "(") { // なぜか" && pos < str.length"この呪文を入れないと自分の環境では実行できません。
        if (pos >= str.length)
            throw Error("「(」が見つからないよ。開き括弧の関数だよ");
        pos += 1;
    }
    return pos;
}
// commaの位置を列挙する。
function search_comma(str) {
    let count = 0;
    let compo = [-1];
    let i = 1;
    for (let pos = 0; pos < str.length; pos += 1) {
        const ch = str[pos];
        if (ch === "(")
            count += 1;
        if (ch === ")")
            count -= 1;
        if (count === 0 && ch === ",") {
            compo.push(pos);
            i += 1;
        }
    }
    compo.push(str.length);
    return compo;
}
// 最も左のAP
function leftmost_principal(str) {
    const argpos = search_closure(str, 0);
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
    if (ch !== "亞" && ch !== "A")
        throw Error(`Unexpected token '${ch}' in AP element`);
    position += 1;
    const ch4 = str[position];
    if (ch4 !== "(")
        throw Error(`Invalid subscript ${ch4}`);
    const argpos = search_closure(str, position);
    const arg = str.substring(position + 1, argpos);
    let array = [];
    const arg_comma = search_comma(arg);
    for (let i = 0; i < arg_comma.length - 1; i++) {
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
        let numterm = "A(0)";
        for (let i = 1; i < num; i++) {
            numterm += "+A(0)";
        }
        str = str.replace(numstr[0], numterm);
    }
    if (str.match(/[wω]/))
        str = str.replace(/[wω]/g, "A(A(0))");
    if (str.match(/[WΩ]/))
        str = str.replace(/[WΩ]/g, "A(A(0),0)");
    if (str.match("I"))
        str = str.replace(/I/g, "A(A(0),0,0)");
    return str;
}
