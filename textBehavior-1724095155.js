
(function(){
"use strict";
function modify()
{
function replaceChildren(elt, map) {
for (var i=0; i<elt.childNodes.length; i++)
replace(elt.childNodes[i], map);
}
function installTranslate(button, src, dst, expected)
{
if (!src || !dst || !expected)
return;
var a = src.getAttribute('blink');
if (a != 'true' && a != 'yes') {
addParenBlink(src, 200);
}
button.addEventListener('click', function() {
var str = src.value;
var entered = parseSentence(str);
if (!entered) {
setText(dst, 'Ill-formed');
return;
}
for (var i=0; i<expected.length; i++) {
var eq = FOLEquivalent(entered, expected[i]);
var u = false;
switch(eq) {
case 'equivalent':
setText(dst, 'Correct!');
return;
case 'not equivalent':
break;
case 'timeout':
u = true;
break;
}
}
setText(dst, u ? 'Unknown.' : 'Incorrect.');
}, false);
}
function installReveal(button, dst, xtext)
{
button.addEventListener('click', function() {
setText(dst, xtext[0]);
}, false);
}
function replace(elt, map) {
var a, m, x, i, b, op, sid, oid, src, dst;
if (!elt.getAttribute)
return;
a = elt.getAttribute('translate');
if (a == 'true' || a == 'yes') {
m = {};
x = elt.getAttribute('expected').split('.');
m.expected = x.map(parseSentence);
replaceChildren(elt, m);
var buttons = m.buttons;
if (!buttons)
return;
buttons.forEach(b => {
op = b.getAttribute('t_op');
switch(op) {
case 'translate':
sid = 'id:'+b.getAttribute('t_source');
oid = 'id:'+b.getAttribute('t_out');
src = m[sid];
dst = m[oid];
installTranslate(b, src, dst, m.expected);
break;
case 'reveal':
oid = 'id:'+b.getAttribute('t_out');
dst = m[oid];
installReveal(b, dst, x);
break;
}
});
return;
}
a = elt.getAttribute('blink');
if (a == 'true' || a == 'yes') {
addParenBlink(elt, 200);
}
a = elt.getAttribute('t_id');
if (a) {
map['id:'+a] = elt;
}
a = elt.getAttribute('t_op');
if (a) {
if (!map.buttons)
map.buttons = [elt];
else
map.buttons.push(elt);
}
replaceChildren(elt, map);
}
replace(document.body, {});
}
document.addEventListener('DOMContentLoaded', function() {
modify();
}, false);
}());

