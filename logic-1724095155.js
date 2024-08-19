
"use strict";
function addParenBlink(input, delay) {
var start, end;
var savedStart, savedEnd;
var savedStyle;
var timeout = null;
function blink(bstart, bend)
{
setTimeout(function(){
savedStart = input.selectionStart;
savedEnd = input.selectionEnd;
input.selectionStart = bstart;
input.selectionEnd = bend;
}, 10);
timeout = setTimeout(function(){
input.selectionStart = savedStart;
input.selectionEnd = savedEnd;
timeout = null;
}, delay);
}
function badblink()
{
setTimeout(function() {
input.style.backgroundColor='red';
}, 10);
setTimeout(function() {
input.style.backgroundColor=savedStyle;
}, delay);
}
function findMatch(pos)
{
var text = input.value;
var c = text.charAt(pos);
if (c == ')' || c == ']') {
var i, pcount=0;
for (i=pos-1; i>=0; i--) {
var c2 = text.charAt(i);
if (c2 == ')' || c2 == ']')
pcount++;
else if (c2 == '(' || c2 == '[') {
if (pcount == 0) {
return i;
}
else {
pcount--;
}
}
}
return -2;
}
return -1;
}
function doinput()
{
var i = findMatch(end);
if (i >= 0) {
blink(i, i+1);
}
else if (i == -2) {
badblink();
}
}
function dokey(event)
{
if (timeout) {
input.selectionStart = savedStart;
input.selectionEnd = savedEnd;
input.style.backgroundColor = savedStyle;
clearTimeout(timeout);
timeout = null;
}
start = input.selectionStart;
end = input.selectionEnd;
if (start == end && event.keyCode == 39) {
var i = findMatch(end);
if (i >= 0) {
blink(i, i+1);
}
else if (i == -2) {
badblink();
}
}
}
savedStyle = input.style.backgroundColor;
input.addEventListener('input', doinput, false);
input.addEventListener('keydown', dokey, false);
}
function setText(node, text)
{
while (node.firstChild !== null)
node.removeChild(node.firstChild);
var tnode = document.createTextNode(text);
node.appendChild(tnode);
}
function setStyleXB(elt, name, value)
{
var prefixes = ['webkit', 'moz', 'ms', 'o'];
for (var i=0; i<prefixes.length; i++) {
var pname = '-'+prefixes[i]+'-'+name;
elt.style.setProperty(pname, value, null);
}
elt.style.setProperty(name, value, null);
}
function mergeParams(options, defaultOptions)
{
if (options === undefined || options === null)
options = {};
else
options = JSON.parse(JSON.stringify(options));
for (var prop in defaultOptions) {
if (options[prop] === undefined)
options[prop] = defaultOptions[prop];
}
return options;
}
function mergeProofBody(attempt, settings)
{
if (attempt.length !== settings.length)
return attempt;
var len = attempt.length;
for (var i=0; i<len; i++) {
var a = attempt[i];
var s = settings[i];
if (a.s !== undefined && a.s === s.s) {
if (a.ro || s.ro)
a.ro = s.ro;
}
else if (a.p && s.p) {
mergeProofBody(a,s);
}
}
return attempt;
}
function makeHomeworkData(attempt, settings, admin)
{
var result = mergeParams(attempt, settings);
if (settings.sentencesLocked && attempt.sentences)
result.sentences = settings.sentences;
if (settings.piecesLocked && attempt.pieces)
result.pieces = settings.pieces;
if (settings['class'] === 'proof' && settings.goal) {
result.goal = settings.goal;
result.body = mergeProofBody(result.body, settings.body);
}
return mergeParams(admin, result);
}
class ElementRef {
constructor(elt) {
this.elt = elt;
}
child(...args) {
const e = ElementRef.newelt(...args);
this.elt.appendChild(e.elt);
return e;
}
parent(n=1) {
let elt = this.elt;
while (n-- > 0) {
elt = elt.parentNode;
}
return new ElementRef(elt);
}
sibling(...args) {
const e = ElementRef.newelt(...args);
this.elt.parentNode.appendChild(e.elt);
return e;
}
text(t) {
const e = document.createTextNode(t);
this.elt.appendChild(e);
return new ElementRef(e);
}
cap(ob,name) {
if (typeof ob === 'object')
ob[name]=this.elt;
else if (typeof ob === 'function')
ob(this.elt);
return this;
}
static newelt(...args) {
const e = document.createElement(args[0]);
for (let i=1; i<args.length; i++) {
var a2 = args[i];
if (typeof(a2) == 'string') {
const t = document.createTextNode(a2);
e.appendChild(t);
}
else if (typeof(a2) == 'number') {
const t = document.createTextNode(a2.toString());
e.appendChild(t);
}
else {
for (let prop in a2) {
e.setAttribute(prop, a2[prop]);
}
}
}
return new ElementRef(e);
}
}
function makeSpinnerBars(parentElt, numberOfBars)
{
var rotation = 0;
var rotateBy = 360 / numberOfBars;
var animationDelay = 0;
var frameRate = 1 / numberOfBars;
for (var i = 0; i < numberOfBars; ++i) {
var bar = document.createElement('div');
bar.className = 'spinner-bar';
parentElt.appendChild(bar);
setStyleXB(bar, 'transform', 'rotate('+rotation+'deg) translate(0, -142%)');
setStyleXB(bar, 'animation-delay', animationDelay + 's');
rotation += rotateBy;
animationDelay -= frameRate;
}
}
function makeSpinner()
{
var div = document.getElementById('spinner');
var width = window.innerWidth;
var height = window.innerHeight;
div.style.left = width / 2 - 25;
div.style.top = height / 2 - 25;
makeSpinnerBars(div, 10);
}
var spinnerTimeout = null;
function startSpinner()
{
spinnerTimeout = setTimeout(function(){
document.getElementById('spinner').style.display='block';
spinnerTimeout = null;
},250);
}
function endSpinner()
{
document.getElementById('spinner').style.display='none';
if (spinnerTimeout) {
clearTimeout(spinnerTimeout);
spinnerTimeout = null;
}
}
function uiForProblem(data, parent, controller)
{
switch(data['class']) {
case 'world':
return new Chessboard(data, parent, controller);
case 'translation':
return new TranslationUI(data, parent, controller);
case 'parse':
return new ParseTreeUI(data, parent, controller);
case 'proof':
return new ProofController(data, parent, controller);
case 'essay':
return new EssayUI(data, parent, controller);
default:
return null;
}
}
function objectsAreEqual(a, b)
{
if (typeof(a) == 'string')
a = JSON.parse(a);
if (typeof(b) == 'string')
b = JSON.parse(b);
return eql(a, b, 'ts');
function eql(x, y, toIgnore)
{
var key;
switch (typeof(x)) {
case 'object':
if (typeof(y) !== 'object')
return false;
if (x === null || y === null)
return x === y;
for (key in x) {
if (key !== toIgnore && !eql(x[key], y[key]))
return false;
}
for (key in y) {
if (key !== toIgnore && x[key] === undefined)
return false;
}
return true;
case 'array':
if (x === y)
return true;
if (typeof(y) !== 'array')
return false;
return x.length === y.length && x.every((e, i) => eql(e, y[i]));
case 'function':
return true;
default:
return x === y;
}
}
}
function isAVariable(s)
{
return /^[u-z][u-z0-9]*$/.test(s)
}
function parseURLQuery(url)
{
if (!url)
url = window.location.href;
var result = {};
var p1 = url.split('?');
if (p1.length < 2)
return result;
var p2 = p1[1].split('&');
p2.forEach(keyval => {
let m = keyval.match(/(.*)=(.*)/);
if (m && m[1] && m[2]) {
result[m[1]] = decodeURIComponent(m[2]);
}
});
return result;
}
function locationLastComponent()
{
var path = window.location.pathname;
var comps = path.split('/');
return comps.pop();
}
function urlQueryString(url) {
if (/\.html$/.test(url)) {
url = url.slice(0,-5);
}
return 'url='+url;
}
function transition1(elt) {
return new Promise(resolve => {
let first = true;
const handler = event => {
if (first) {
first = false;
elt.removeEventListener('transitionend', handler, false);
event.stopPropagation();
resolve();
}
}
elt.addEventListener('transitionend', handler, false);
})
}
function animationEnd(elt) {
return new Promise(resolve => {
const handler = () => {
elt.removeEventListener('animationend', handler, false);
resolve();
}
elt.addEventListener('animationend', handler, false);
});
}
var rootRef = null;
function initApp()
{
if (rootRef)
return;
const config = {
apiKey: "AIzaSyBuVgrylsw-crlCrJg0m7sQvzGjIIILfxc",
authDomain: "jb-pw-187154.firebaseapp.com",
databaseURL: "https://jb-pw-187154.firebaseio.com",
storageBucket: "jb-pw-187154.appspot.com",
messagingSenderId: "1049885100638"
};
firebase.initializeApp(config);
rootRef = firebase.database().ref();
}
const CURRENT_INSTANCE = '2024-FA-01';
const CURRENT_TERM_START = { month: 8, day: 26, year: 2024 };
const IS_HALF_SEMESTER = false
const FIREBASE_SECRET = null;

var parseSentence;
var parsePattern;
var parsePremise;
(function(){
"use strict";
parseSentence = function(str)
{
const stream = new Stream(str)
const sent = stream.parseSentence()
return stream.isEmpty() && sent
}
parsePattern = function(str)
{
const stream = new Stream(str)
const pat = stream.parsePattern()
return stream.isEmpty() && pat
}
parsePremise = function(str)
{
const stream = new Stream(str)
const prem = stream.parsePremise()
return stream.isEmpty() && prem
}
class Stream {
constructor(str) {
this.str = str
this.pos = 0
}
isEmpty()
{
const t = this.parseToken()
return t === ""
}
parsePattern()
{
const saved = this.pos
const key = this.parseID()
if (key === 'new' || key === 'local' || key === 'arbitrary') {
const op = key.toUpperCase()
const name = this.parseName()
if (name) {
const inf = this.parseInference()
return inf && new Expression(op, name, inf)
}
}
else {
this.pos = saved
return this.parseInference()
}
}
parseInference()
{
const saved = this.pos
let sym = this.parseToken()
if (sym === '>') {
const sent = this.parseSentence()
return sent && new Expression('PROVES', new Expression('NULL'), sent)
}
else {
this.pos = saved
let sent1 = this.parseSentence()
if (!sent1) {
this.pos = saved
sent1 = this.parseName()
if (!sent1)
return null
}
const saved2 = this.pos
sym = this.parseToken()
if (sym === '>') {
const sent2 = this.parseSentence()
return sent2 && new Expression('PROVES', sent1, sent2)
}
else {
this.pos = saved2
return sent1
}
}
}
parsePremise() {
const saved = this.pos
let result = this.parseSentence()
if (!result) {
this.pos = saved
result = this.parseName()
}
return result
}
parseSentence(ctx) {
if (!ctx)
ctx = new Vmap()
const sent1 = this.parseGrouped(ctx)
if (!sent1)
return null
const saved = this.pos
const sym = this.parseToken()
let sent2
switch(sym) {
case '&':
sent2 = this.parseConj(ctx)
return sent2 && new Expression('AND', sent1, sent2)
case '|':
sent2 = this.parseDisj(ctx)
return sent2 && new Expression('OR', sent1, sent2)
case '->':
sent2 = this.parseGrouped(ctx)
return sent2 && new Expression('IF', sent1, sent2)
case '<->':
sent2 = this.parseGrouped(ctx)
return sent2 && new Expression('IFF', sent1, sent2)
default:
this.pos = saved
return sent1
}
}
parseConj(ctx)
{
return this.parseUngrouped(ctx, '&', 'AND')
}
parseDisj(ctx)
{
return this.parseUngrouped(ctx, '|', 'OR')
}
parseUngrouped(ctx, symb, op)
{
const sent1 = this.parseGrouped(ctx)
if (!sent1)
return null
const saved = this.pos
if (this.parseToken() === symb) {
const sent2 = this.parseUngrouped(ctx, symb, op)
return sent2 && new Expression(op, sent1, sent2)
}
else {
this.pos = saved
return sent1
}
}
parseGrouped(ctx)
{
const saved = this.pos
const q = this.parseQuantified(ctx)
if (q)
return q
this.pos = saved
const sym = this.parseToken()
if (sym === '(' || sym === '[') {
const sent = this.parseSentence(ctx)
return isRight(this.parseToken(), sym) ? sent : null
}
else if (sym === '~') {
const sent = this.parseGrouped(ctx)
return sent && new Expression('NOT', sent)
}
this.pos = saved
return this.parseAtom(ctx)
}
parseQuantified(ctx)
{
const sym = this.parseToken()
let q, v = null
if (sym === '(' || sym === '[') {
const saved = this.pos
const sym2 = this.parseToken()
if (sym2 === 'A' || sym2 === 'E') {
q = sym2
}
else {
this.pos = saved
q = 'A'
}
v = this.parseVariable()
if (!v || !isRight(this.parseToken(), sym))
return null
}
else if (sym === 'A' || sym == 'E') {
q = sym
v = this.parseVariable()
if (!v)
return null
}
else {
return null
}
const ctx2 = ctx.clone()
ctx2.add(v)
const vx = new Expression('NAME', v, ctx2)
const op = (q === 'A') ? 'ALL' : 'EXISTS'
const sent = this.parseGrouped(ctx2)
return sent && new Expression(op, vx, sent)
}
parseAtom(ctx)
{
const saved = this.pos
if (this.parseToken() === '!')
return new Expression('EET')
this.pos = saved
const pred = this.parsePredicate()
if (pred) {
const args = this.parseTermListOpt(ctx)
return args && new Expression('PRED', pred, args)
}
this.pos = saved
const t1 = this.parseTerm(ctx)
const sym = t1 && this.parseToken()
const t2 = (sym === '=' || sym === '!=') && this.parseTerm(ctx)
if (!t2)
return null
let expr = new Expression('EQUAL', t1, t2)
if (sym === '!=')
expr = new Expression('NOT', expr)
return expr
}
parseTermListOpt(ctx)
{
const saved = this.pos
const sym = this.parseToken()
if (sym === '(' || sym === '[') {
let args = []
for (;;) {
const t = this.parseTerm(ctx)
if (!t)
return null
args.push(t)
const sym2 = this.parseToken()
if (isRight(sym2, sym))
return args;
else if (sym2 !== ',')
return null
}
}
else {
this.pos = saved
return []
}
}
parseTerm(ctx)
{
const n = this.parseID()
if (!n)
return null
if (isVariable(n)) {
return new Expression('NAME', n, ctx)
}
if (!isConstant(n)) {
return null
}
const args = this.parseTermListOpt(ctx)
if (args === null)
return null
if (args.length === 0)
return new Expression('NAME', n)
else {
const expr = new Expression('FUNCTOR', n)
return new Expression('FUNC', expr, args)
}
}
parsePredicate()
{
const pr = this.parseID()
return isPredicate(pr) ? new Expression('FUNCTOR', pr) : null
}
parseName()
{
const str = this.parseID()
return isConstant(str) ? new Expression('NAME', str) : null
}
parseVariable()
{
const str = this.parseID()
return isVariable(str) ? str : null
}
parseID()
{
const re = /^\s*([A-Za-z_][A-Za-z_0-9]*)/
const match = re.exec(this.str.substring(this.pos))
if (!match)
return null
else {
this.pos += match[0].length
return match[1]
}
}
parseToken()
{
if (this.pos >= this.str.length)
return ""
const re = /^\s*(->|<->|!=|[^ ])/
const match = re.exec(this.str.substring(this.pos))
if (!match)
return ""
this.pos += match[0].length
return match[1]
}
}
function isPredicate(str)
{
return str && /^[A-Z][A-Za-z0-9_]*$/.test(str)
}
function isVariable(str)
{
return str && /^[u-z][A-Za-z0-9_]*$/.test(str)
}
function isConstant(str)
{
return str && /^[a-t][A-Za-z0-9_]*$/.test(str)
}
function isRight(right, left)
{
if (left === '(')
return right === ')'
else if (left === '[')
return right === ']'
else
return false
}
}());

"use strict";
class Expression {
constructor(op) {
this.op = op;
this.atom = null;
this.variable = 0;
this.args = [];
var vmap, v;
switch (op) {
case 'NAME':
this.atom = arguments[1];
if (arguments.length > 2) {
vmap = arguments[2];
if (vmap) {
v = vmap.map(this.atom);
if (v !== undefined)
this.variable = v;
}
}
break;
case 'FUNCTOR':
this.atom = arguments[1];
break;
default:
Array.from(arguments).slice(1).forEach(a => {
if (Array.isArray(a)) {
this.args = this.args.concat(a);
}
else {
this.args.push(a);
}
});
}
}
stringify()
{
if (this.op === 'EET')
return '!';
if (this.op === 'NULL')
return '';
if (this.atom)
return this.atom;
if (this.op === 'NOT')
return '~' + this.args[0].stringify();
var i = ['AND','OR','IF','IFF','EQUAL','PROVES'].indexOf(this.op);
if (i >= 0) {
var conn = [' & ',' | ',' -> ',' <-> ',' = ',' => '][i];
var rtn = this.args[0].stringify() + conn + this.args[1].stringify();
if (i<4)
rtn = '(' + rtn + ')';
return rtn;
}
i = ['ALL','EXISTS','NEW','LOCAL','ARBITRARY'].indexOf(this.op);
if (i >= 0) {
var quant = ['A','E','new ','local ','arbitrary '][i];
return quant + this.args[0].stringify() + ' ' + this.args[1].stringify();
}
if (this.op === 'PRED' || this.op === 'FUNC') {
if (this.op === 'PRED' && this.args.length === 1)
return this.args[0].stringify();
else
return this.args[0].stringify() + '(' + this.args.slice(1).map(a => a.stringify()).join(', ') + ')';
}
}
equals(e)
{
if (this.op != e.op || this.args.length != e.args.length)
return false;
if (this.op == "NAME") {
return this.atom == e.atom && ((this.variable === 0 && e.variable === 0) || (this.variable !== 0 && e.variable !== 0))
}
else if (this.op == 'FUNCTOR') {
return this.atom == e.atom;
}
else {
return this.args.every((a,i) => a.equals(e.args[i]));
}
}
containsBoundVariables()
{
return this.variable || (this.op !== 'NAME' && this.args.some(a => a.containsBoundVariables()));
}
containsFreeVariables()
{
if (this.op === 'NAME') {
return !this.variable && isAVariable(this.atom);
}
else {
return this.args.some(a => a.containsFreeVariables());
}
}
isTerm()
{
return this.op == "NAME" || this.op == "FUNC";
}
strictlyContains(term)
{
switch(this.op) {
case 'FUNCTOR':
return false;
case 'NAME':
return this.strictlyEquals(term);
case 'FUNC':
if (this.strictlyEquals(term))
return true;
default:
return this.args.some(a => a.strictlyContains(term));
}
}
strictlyEquals(expr)
{
switch(this.op) {
case 'FUNCTOR':
return expr.op == 'FUNCTOR' && this.atom == expr.atom;
case 'NAME':
return this.atom == expr.atom && this.variable == expr.variable;
default:
if (this.op != expr.op || this.args.length != expr.args.length)
return false;
return this.args.every((a,i) => a.strictlyEquals(expr.args[i]));
}
}
}

"use strict";
class Model {
constructor() {}
eval(expr, vmap)
{
if (['NOT','AND','OR','IF','IFF'].indexOf(expr.op) >= 0) {
const v = expr.args.map(a => this.eval(a, vmap));
if (v.some(val => val === undefined))
return undefined;
else
switch (expr.op) {
case 'NOT':
return !v[0];
case 'AND':
return v[0] && v[1];
case 'OR':
return v[0] || v[1];
case 'IF':
return !v[0] || v[1];
case 'IFF':
return v[0] === v[1];
}
}
else if (expr.op === 'EET') {
return false;
}
}
}
class ObjectModel extends Model {
constructor()
{
super();
}
eval(expr, vmap)
{
vmap = vmap || {};
switch(expr.op) {
case "PRED":
const objects = expr.args.slice(1).map(a => this.termval(a, vmap));
if (objects.some(o => o === undefined || o === null))
return undefined;
const pred = expr.args[0].atom;
return this.appliesTo(pred, objects);
case "EQUAL":
const v1 = this.termval(expr.args[0], vmap);
const v2 = this.termval(expr.args[1], vmap);
return v1 && v2 ? this.areEqual(v1, v2) : undefined;
case "ALL":
case "EXISTS":
const dom = this.domain();
const variable = expr.args[0].atom;
const matrix = expr.args[1];
let vm2 = JSON.parse(JSON.stringify(vmap));
if (expr.op === "ALL")
return dom.reduce((t,ob) => t && (vm2[variable]=ob, this.eval(matrix, vm2)), true);
else
return dom.reduce((t,ob) => t === undefined ? undefined :
t || (vm2[variable]=ob, this.eval(matrix, vm2)),
false);
default:
return super.eval(expr, vmap);
}
}
termval(expr, vmap)
{
if (expr.variable) {
return vmap[expr.atom];
}
else if (expr.op == "NAME") {
return this.nameValue(expr.atom);
}
else {
let objects = [];
for (let i=1; i<expr.args.length; i++) {
const term = expr.args[i];
const a = this.termval(term, vmap);
if (a == null)
return null;
objects.push(a);
}
const func = expr.args[0].atom;
return this.funcValue(func, objects);
}
}
}
class TTModel extends Model {
constructor(exprs, vals)
{
super();
this.sentences = exprs;
this.values = vals;
}
eval(expr)
{
if (['NOT', 'AND', 'OR', 'IF', 'IFF', 'EET'].indexOf(expr.op) >= 0)
return super.eval(expr);
else {
const i = this.sentences.findIndex(e => e.equals(expr));
return i >= 0 ? this.values[i] : undefined;
}
}
}

var Vmap;
(function(){
"use strict";
var currentVariable = 1;
function newVariable() { return currentVariable++; }
Vmap = function(m)
{
var _map = m || {};
this.add = function(atom) {
_map[atom] = newVariable();
}
this.clone = function() {
var m2 = JSON.parse(JSON.stringify(_map));
return new Vmap(m2);
}
this.map = function(atom) {
return _map[atom];
}
}
}());

let Chessboard, ChessboardModel;
(function(){
"use strict";
const urlmap = {
"bsquare": "./shapes/bbsquare.gif",
"ssquare": "./shapes/sbsquare.gif",
"bdiamond": "./shapes/bgdiamond.gif",
"sdiamond": "./shapes/sgdiamond.gif",
"boct": "./shapes/broct.gif",
"soct": "./shapes/sroct.gif"
}
function absolutePos(obj) {
let curleft = 0;
let curtop = 0;
while (obj && obj.offsetParent) {
curleft += obj.offsetLeft;
curtop += obj.offsetTop;
obj = obj.offsetParent;
}
return {x: curleft, y: curtop};
}
function relativePos(obj, container) {
const a = absolutePos(obj);
const c = absolutePos(container);
return {x: a.x - c.x, y: a.y-c.y};
}
const BORDER = 2;
class Shape {
constructor(parent, size, classname)
{
this.elt = document.createElement('div');
this.elt.className = classname;
parent.appendChild(this.elt);
let innerSize = size - BORDER * 2;
this.elt.style.width = innerSize + 'px';
this.elt.style.height = innerSize + 'px'
this.size = size;
}
setPosition(x,y)
{
this.elt.style.left = x + 'px';
this.elt.style.top = y + 'px';
}
getSize()
{
return { width: this.size, height: this.size };
}
getDomElement()
{
return this.elt;
}
doWhenLoaded(f)
{
f();
}
isLoaded()
{
return true;
}
relativePosition(fromElt)
{
return relativePos(this.elt, fromElt);
}
}
class SquareShape extends Shape {
constructor(parent, sz) {
super(parent, sz, 'square-piece');
}
}
class DiamondShape extends Shape {
constructor(parent, sz) {
let s = Math.ceil(sz * 1.414);
let sq = document.createElement('div');
parent.appendChild(sq);
sq.className = 'diamond-outer';
sq.style.width = s + 'px';
sq.style.height = s + 'px';
super(sq, sz, 'diamond-piece');
this.elt = sq;
this.size = s;
}
}
class OctagonShape extends Shape {
constructor(parent, sz) {
super(parent, sz, 'oct-outer');
let inner = document.createElement('div');
inner.className = 'oct-inner';
this.elt.appendChild(inner);
let border = document.createElement('div');
border.className = 'oct-border';
inner.appendChild(border);
this.inner = inner;
}
getDomElement()
{
return this.inner;
}
getSize()
{
return { width: this.size - BORDER, height: this.size - BORDER };
}
}
class ShapeImage {
constructor(ptype, parent) {
this._elt = (new ElementRef(parent)).child('img', {src: urlmap[ptype]}).elt;
}
getSize() {
return {width: this._elt.width, height: this._elt.height};
}
getDomElement() {
return this._elt;
}
doWhenLoaded(f) {
const doit = () => {
f();
this._elt.removeEventListener('load', doit, false);
}
if (this._elt.complete) {
f();
}
else {
this._elt.addEventListener('load', doit, false);
}
}
isLoaded() { return this._elt.complete; }
relativePosition(fromElt) {
return relativePos(this._elt, fromElt);
}
}
function newShape(ptype, container)
{
return new ShapeImage(ptype, container);
switch(ptype) {
case 'bsquare':
return new SquareShape(container, 64);
case 'ssquare':
return new SquareShape(container, 32);
case 'bdiamond':
return new DiamondShape(container, 48);
case 'sdiamond':
return new DiamondShape(container, 30);
case 'boct':
return new OctagonShape(container, 64);
case 'soct':
return new OctagonShape(container, 36);
default:
return new ShapeImage(ptype, container);
}
}
class Chesspiece {
constructor(parent, controller, options)
{
this._domElt = document.createElement("div");
this._domElt.className = 'movable';
this._names = [];
this._inputField = null;
this._nameElt = null;
this._controller = controller;
this._locked = (options.locked === true);
this.location = null;
if (options.className) {
this._ptype = options.className;
}
else {
switch(options.shape) {
case 'square':
this._ptype = (options.size == 'small') ? 'ssquare' : 'bsquare';
break;
case 'diamond':
this._ptype = (options.size == 'small') ? 'sdiamond' : 'bdiamond';
break;
case 'octagon':
this._ptype = (options.size == 'small') ? 'soct' : 'boct';
break;
}
}
this._shapeImage = new ShapeImage(this._ptype, this._domElt);
if (options.visible === false)
this._domElt.style.display='none';
this.setPosition(options.x, options.y);
parent.appendChild (this._domElt);
this._domElt.addEventListener('mousedown', event => {
this.click(event);
event.preventDefault();
}, false);
this._domElt.addEventListener('dblclick', event => this.doubleClick(event), false);
if (options.names)
this.setNames(options.names);
}
setPosition(x, y)
{
this._domElt.style.left = x + 'px';
this._domElt.style.top = y + 'px';
}
fixPosition (cx, cy, animate)
{
let sz = this._shapeImage.getSize();
let x = cx - Math.floor(sz.width/2);
let y = cy - Math.floor(sz.height/2);
this._domElt.style.width = sz.width + 'px';
this._domElt.style.height = sz.height + 'px';
this._domElt.style.display='block';
const {x:oldX, y:oldY} = this.position();
if (x === oldX && y === oldY)
return;
if (animate) {
this._domElt.classList.add('snap');
this.setPosition(x, y);
transition1(this._domElt).then(() => this._domElt.classList.remove('snap'));
}
else {
this.setPosition(x, y);
}
}
doSetNames (names)
{
if (this._nameElt) {
this._domElt.removeChild(this._nameElt);
this._nameElt = null;
}
if (names.length >= 1) {
let ref = (new ElementRef(this._domElt)).child('span', {'class': 'nametagWrapper'});
this._nameElt = ref.elt;
let x = -3;
let y = 4 + this._shapeImage.getSize().height / 2;
this._nameElt.style.left = x + 'px';
this._nameElt.style.top = y + 'px';
names.forEach(n => ref.child('span', n.toString(), {'class': 'nametag'}));
}
}
position()
{
let x = parseInt(this._domElt.style.left);
let y = parseInt(this._domElt.style.top);
return {x:x, y:y};
}
relativePosition(elt)
{
return this._shapeImage.relativePosition(elt);
}
size()
{
return this._shapeImage.getSize();
}
getNames()
{
return this._names.slice(0);
}
setNames(names)
{
this._names = names.slice(0);
this._shapeImage.doWhenLoaded(() => this.doSetNames(this._names));
}
properties()
{
let result = {};
if (this._ptype == "bsquare" || this._ptype == "ssquare")
result.shape = "square";
else if (this._ptype == "bdiamond" || this._ptype == "sdiamond")
result.shape = "diamond";
else
result.shape = "octagon";
if (this._ptype == "bsquare" || this._ptype == "bdiamond" || this._ptype == "boct")
result.size = "large";
else
result.size = "small";
return result;
}
attach(loc, cx, cy, parent, animate)
{
this.location = loc;
let root = this._domElt.parentNode;
if (root && root !== parent) {
let pos = this.relativePosition(parent);
root.removeChild(this._domElt);
parent.appendChild(this._domElt);
this.setPosition(pos.x, pos.y);
if (animate && this._shapeImage.isLoaded()) {
this.fixPosition(cx, cy, true);
return;
}
}
else if (!root) {
parent.appendChild(this._domElt);
}
this._shapeImage.doWhenLoaded(() => this.fixPosition(cx, cy, animate));
}
putAway()
{
let parent = this._domElt.parentNode;
if (parent)
parent.removeChild(this._domElt);
}
animatePutAway()
{
this._domElt.classList.add('exited');
transition1(this._domElt).then(() => this.putAway());
}
click(e)
{
if (!this._locked)
this.drag(e);
}
doubleClick(event) {
if (!this._locked) {
this.beginEdit();
}
}
drag(event)
{
let dragCell = this.location;
let dragStart = this.position();
let dragOffset = { x: event.clientX - dragStart.x,
y: event.clientY - dragStart.y };
let cstyle = window.getComputedStyle(this._domElt);
let oldCursor = cstyle.getPropertyValue('cursor');
let newCursor = oldCursor && oldCursor.replace('grab', 'grabbing');
this._domElt.style.cursor = newCursor;
const dragMove = (event) => {
const x = event.clientX-dragOffset.x;
const y = event.clientY-dragOffset.y;
this.setPosition(x,y);
}
const dragEnd = () => {
document.removeEventListener("mousemove", dragMove, false);
document.removeEventListener("mouseup", dragEnd, false);
if (oldCursor)
this._domElt.style.cursor = oldCursor;
this._controller.pieceDragged(this, dragCell, dragStart);
}
document.addEventListener("mousemove", dragMove, false);
document.addEventListener("mouseup", dragEnd, false);
}
async snapBack(pos)
{
this._domElt.classList.add('snap');
this.setPosition(pos.x, pos.y);
await transition1(this._domElt);
this._domElt.classList.remove('snap');
}
beginEdit()
{
const sz = this._shapeImage.getSize();
const cx = Math.floor(sz.width / 2);
const cy = Math.floor(sz.height / 2);
const width = 100;
const x = cx - width/2;
const y = cy;
let wrapper = document.createElement("div");
wrapper.style.position='absolute';
wrapper.style.display='block';
wrapper.style.left = x + 'px';
wrapper.style.top = y + 'px';
const input = document.createElement("input");
this._inputField=input;
input.setAttribute("type","text");
input.style.width = width + 'px';
wrapper.appendChild(input);
input.value = this._names.join(', ');
this._mouseOutsideEdit = event => {
if (event.target === this._inputField)
return;
event.preventDefault();
event.stopPropagation();
this.endEdit();
}
document.addEventListener('mousedown', this._mouseOutsideEdit, true);
this._domElt.appendChild(wrapper);
input.addEventListener('keydown', event => {
if (event.key === 'Enter') {
this.endEdit();
}
else if (event.key === 'Tab') {
event.preventDefault();
event.stopPropagation();
}
}, false);
input.addEventListener('mousedown', e => e.stopPropagation(), false);
setTimeout(() => input.select(), 50);
}
endEdit()
{
let text = this._inputField.value;
text = text.replace(/^\s*/,'').replace(/\s*$/,'');
let names = text.split(/\s+|\s*,\s*/);
names = names.filter(n => n !== "")
const error = this._controller.renamePiece(this, names);
if (error) {
alert(error);
}
else {
const wrapper = this._inputField.parentNode;
wrapper.parentNode.removeChild(wrapper);
document.removeEventListener('mousedown', this._mouseOutsideEdit, true);
}
}
export()
{
const prop = this.properties();
return { x: this.location.column,
y: this.location.row,
shape: prop.shape,
size: prop.size,
names: this.getNames()
};
}
}
function between(x,y,x0,y0,x1,y1)
{
let d = x0*y1 + y0*x + x1*y - x*y1 - x1*y0 - x0*y;
if (d != 0)
return false;
if (y0 == y1 && x0 == x1)
return false;
let a = (x0 == x1) ? (y-y1)/(y0-y1) : (x-x1)/(x0-x1);
return (a > 0 && a < 1);
}
const ARITIES = { 'Small': 1, 'IsSmall': 1, 'Large': 1, 'IsLarge': 1,
'Square': 1, 'IsSquare': 1, 'Diamond': 1, 'IsDiamond': 1,
'Oct': 1, 'Octagon': 1, 'IsOct': 1, 'IsOctagon': 1,
'SameShape': 2, 'SameSize': 2, 'LeftOf': 2, 'IsLeftOf': 2,
'RightOf': 2, 'IsRightOf': 2, 'Below': 2, 'IsBelow': 2,
'Above': 2, 'IsAbove': 2, 'SameRow': 2,
'SameCol': 2, 'SameColumn': 2,
'Between': 3, 'IsBetween': 3 };
ChessboardModel = class extends ObjectModel {
constructor(pieces)
{
super();
if (typeof(pieces) !== 'string')
pieces = JSON.stringify(pieces);
this.pieces = JSON.parse(pieces);
}
domain()
{
return this.pieces;
}
nameValue(name)
{
return this.pieces.find(({names}) => names.find(n => n == name)) || null;
}
funcValue(func, arr)
{
return null;
}
areEqual(shape1, shape2)
{
return shape1.x == shape2.x && shape1.y == shape2.y;
}
appliesTo(pred, args)
{
const arity = ARITIES[pred];
if (arity === undefined || arity !== args.length)
return undefined;
switch(pred) {
case 'Small':
case 'IsSmall':
return args[0].size == 'small';
case 'Large':
case 'IsLarge':
return args[0].size == 'large';
case 'Square':
case 'IsSquare':
return args[0].shape == 'square';
case 'Diamond':
case 'IsDiamond':
return args[0].shape == 'diamond';
case 'Oct':
case 'Octagon':
case 'IsOct':
case 'IsOctagon':
return args[0].shape == 'octagon';
case 'SameShape':
return args[0].shape == args[1].shape;
case 'SameSize':
return args[0].size == args[1].size;
case 'LeftOf':
case 'IsLeftOf':
return args[0].x < args[1].x;
case 'RightOf':
case 'IsRightOf':
return args[0].x > args[1].x;
case 'Below':
case 'IsBelow':
return args[0].y > args[1].y;
case 'Above':
case 'IsAbove':
return args[0].y < args[1].y;
case 'SameRow':
return args[0].y == args[1].y;
case 'SameCol':
case 'SameColumn':
return args[0].x == args[1].x;
case 'Between':
case 'IsBetween':
return between(args[0].x, args[0].y, args[1].x, args[1].y, args[2].x, args[2].y);
default:
return undefined;
}
}
}
const DISPLAY_ROWS = 13;
class RowEval {
constructor (feedback, sentences, rows) {
if (!feedback) {
this.corr = [];
this.rows = [];
}
else {
this.corr = feedback.slice();
this.rows = rows.filter((_,i) => sentences[i]);
}
}
eval(row) {
return this.corr[this.rows.indexOf(row)];
}
}
class SentenceTable {
constructor(chessboard, options, parentElt)
{
this.chessboard = chessboard;
this.options = options;
this.locked = (options.sentencesLocked === true);
this.dom = {};
(new ElementRef(parentElt)) .child('div', {class: 'sentence-table'})
.cap(this.dom, 'table')
.child('div', {class: 'head'})
.child('div', 'Enter a sentence')
.sibling('div', 'Result')
.parent().sibling('div', {class: 'body'}) .cap(this.dom, 'tbody')
.sibling('div', {class: 'scrollbar'}) .cap(this.dom, 'scrollbar')
.child('div', {class: 'thumb'}) .cap(this.dom, 'thumb');
this.installScrollEvents();
const sent = (options && options.sentences) || [];
this.createRows(sent);
this.scroll();
}
createRows(sentences)
{
let feedback = null;
if (this.options.ui_properties.gradable) {
feedback = ['feedback', 'instructorInfo', 'sentences'].reduce((o, a) => o && o[a], this.options);
}
else if (this.options.ui_properties.feedback) {
feedback = ['feedback', 'studentInfo', 'sentences'].reduce((o, a) => o && o[a], this.options);
}
if (!sentences.length)
sentences = [''];
sentences = sentences.map(s => (s === null) ? '' : s);
if (sentences.length < DISPLAY_ROWS) {
sentences = sentences.concat(Array(DISPLAY_ROWS - sentences.length).fill(null));
}
const rows = sentences.map(s => this.createNewRow(s));
this.eval = new RowEval(feedback, sentences, rows);
}
installScrollEvents() {
this.dom.tbody.addEventListener('scroll', () => this.scroll(), false);
this.dom.thumb.addEventListener('mousedown', event => this.scrollStart(event), false);
this._mouseMove = event => this.scrollMove(event);
document.body.addEventListener('mousemove', this._mouseMove, false);
this._mouseUp = event => this.scrollEnd(event);
document.body.addEventListener('mouseup', this._mouseUp, false);
}
remove() {
if (this._mouseMove) {
document.body.removeEventListener('mousemove', this._mouseMove, false);
}
if (this._mouseUp) {
document.body.removeEventListener('mouseup', this._mouseUp, false);
}
}
createNewRow(sent, before)
{
let row = document.createElement('div');
row.className = 'row';
if (sent === null) {
if (!this.locked) {
const handler = () => this.emptyRowClick(row, handler);
row.addEventListener('click', handler, false);
}
}
else {
this._makeRowContents(row, sent);
}
let body = this.tableBody();
if (before) {
body.insertBefore(row, before);
}
else {
body.appendChild(row);
}
return row;
}
_makeRowContents(row, sent) {
let newInput;
const inputSettings = { autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false'};
(new ElementRef(row))
.child('div', {class: 'line-number'})
.sibling('div', {class: 'sentence'})
.child('input', inputSettings).cap(input => {
newInput = input;
addParenBlink(input, 200);
if (sent !== undefined)
input.value = sent || '';
if (this.locked) {
input.disabled = true;
}
else {
this.installSentenceEvents(input);
}
})
.parent().sibling('div');
return newInput;
}
emptyRowClick(row, handler) {
const prev = row.previousSibling;
if (prev) {
const sent = this.getRowContent(prev);
if (sent !== null) {
const input = this._makeRowContents(row, '');
row.removeEventListener('click', handler, false);
setTimeout(() => input.focus());
}
}
}
installSentenceEvents(input)
{
input.addEventListener('keydown', event => {
switch(event.key) {
case 'Enter':
this.handleInputEnter(input);
this.chessboard.sentencesChanged();
break;
case 'Backspace':
this.handleInputDelete(input, event);
this.chessboard.sentencesChanged();
break;
case 'ArrowUp':
this.handleInputArrow(input, true);
break;
case 'ArrowDown':
this.handleInputArrow(input, false);
break;
}
}, false);
input.addEventListener('input', () => {
this.refreshRow(this.rowForInputNode(input), this.chessboard.getModel());
this.chessboard.sentencesChanged();
}, false);
}
rowForInputNode(input)
{
const cell = input.parentNode;
return cell.parentNode;
}
inputNodeForRow(row)
{
const cell = row.childNodes[1];
return cell ? cell.firstChild : null;
}
getRowContent(row)
{
let input = this.inputNodeForRow(row);
return input && input.value.trim();
}
setRowContent(row, sentence, value, signal)
{
let sentenceCell = row.childNodes[1];
if (!sentenceCell)
return;
let valueCell = row.childNodes[2];
let input = sentenceCell.firstChild;
if (sentence !== null)
input.value = sentence;
if (value !== null)
setText(valueCell, value);
if (signal !== undefined)
valueCell.className = signal ? 'ill-formed' : '';
let val = this.eval.eval(row);
if (val !== undefined) {
valueCell.className = val ? '' : 'ill-formed';
}
}
focusRow(row, now)
{
let input = this.inputNodeForRow(row);
if (input) {
if (now)
input.focus();
else
setTimeout(() => input.focus());
}
}
refresh()
{
let model = this.chessboard.getModel();
this.getRows().forEach(row => this.refreshRow(row, model));
}
refreshRow(row, model)
{
if (this.options.tvFeedback == false) {
if (!this.options.ui_properties)
return;
if (!this.options.ui_properties.gradable && !this.options.ui_properties.feedback)
return;
}
const sent = this.getRowContent(row);
if (sent === null || sent === "") {
this.setRowContent(row, null, '', false);
return;
}
const expr = parseSentence(sent);
const val = expr ? model.eval(expr) : undefined;
const valText = (val === undefined) ? '--' : (val ? 'T' : 'F');
this.setRowContent(row, null, valText, val === undefined);
}
deleteLine(row)
{
let body = row.parentNode;
body.removeChild(row);
if (this.getRows().length < DISPLAY_ROWS) {
this.createNewRow(null);
}
this.scroll();
}
handleInputDelete(input, event)
{
const start = input.selectionStart;
const end = input.selectionEnd;
if (start == end && start == 0) {
const row = this.rowForInputNode(input);
const prev = this.nextRow(row, -1);
if (prev) {
const prevVal = this.getRowContent(prev);
if (prevVal === null || prevVal === "") {
this.deleteLine(prev);
}
else if (input.value.length == 0) {
this.deleteLine(row);
event.preventDefault();
this.focusRow(prev, false);
}
}
}
}
handleInputArrow(input, up)
{
const row = this.rowForInputNode(input);
const row2 = this.nextRow(row, up ? -1 : 1);
if (row2) {
this.focusRow(row2, true);
}
}
handleInputEnter(input)
{
const end = input.selectionEnd;
const text = input.value;
const suffix = text.substr(end);
const row = this.rowForInputNode(input);
this.newLine(row, !(/[^ ]/.test(suffix)));
}
newLine(row, after)
{
let body = row.parentNode;
let lastrow = body.lastChild;
if (row !== lastrow && this.getRowContent(lastrow) === null)
body.removeChild(lastrow);
let before = this.nextRow(row, after ? 1 : 0);
let newrow = this.createNewRow('', before);
if (after) {
this.focusRow(newrow, false);
}
this.scroll();
}
getSentences()
{
let sentences = this.getRows().map(r => this.getRowContent(r));
sentences = sentences.filter(s => s !== null).map(s => s === "" ? null : s);
return sentences;
}
scroll()
{
const body = this.tableBody();
const thumb = this.dom.thumb;
const ch = body.clientHeight;
const sh = body.scrollHeight;
const st = body.scrollTop;
const sb = this.dom.scrollbar.clientHeight;
if (sh <= ch) {
thumb.style.display = 'none';
}
else {
thumb.style.top = Math.round(sb * st / sh) + 'px';
thumb.style.height = Math.round(sb * ch / sh) + 'px';
thumb.style.display = 'block';
}
}
scrollStart(event) {
event.preventDefault();
event.stopPropagation();
this._scrolling = true;
this._scrollStart = event.clientY;
this._scrollTopStart = this.tableBody().scrollTop;
}
scrollMove(event) {
if (this._scrolling) {
const dy = event.clientY - this._scrollStart;
const body = this.tableBody();
const dt = dy * body.scrollHeight / body.clientHeight;
const top = dt + this._scrollTopStart;
body.scrollTop = top;
this.scroll();
event.preventDefault();
event.stopPropagation();
}
}
scrollEnd(event) {
if (this._scrolling) {
this._scrolling = false;
}
}
tableBody()
{
return this.dom.tbody;
}
getRows()
{
let children = Array.from(this.dom.tbody.childNodes);
return children.filter(c => c.className == 'row');
}
nextRow(row, offset)
{
let rows = this.getRows();
let idx = rows.indexOf(row);
if (idx < 0) {
return null;
}
else {
return rows[idx + offset] || null;
}
}
}
class BoardView {
constructor(options, parent, controller) {
this.options = options;
this.controller = controller;
this.outer = parent;
this.board = null;
this.squareSize = null;
this.width = 0;
this.height = 0;
this.pieces = [];
this.locked = (options.piecesLocked === true);
this.theSquares = null;
this.lastClickTime = 0;
this.lastClickLock = null;
this._model = null;
this.createBoard(options);
}
createBoard(options)
{
(new ElementRef(this.outer)).child('div', {class: 'board'}).cap(this, 'board');
this.squareSize = options.squareSize;
this.width = options.width;
this.height = options.height;
this.createSquares();
if (options.pieces !== undefined)
this.createPieces(options.pieces);
}
createPieces(pieces)
{
pieces.forEach(p => {
let properties = { x: 0, y: 0, shape: p.shape, size: p.size, names: p.names, visible: false, locked: this.locked };
const piece = new Chesspiece(document.body, this.controller, properties);
const loc = {column:p.x, row:p.y};
this.addPiece(piece, loc, false);
});
}
createSquares()
{
this.theSquares = [];
this.board.style.width = (this.width * this.squareSize) + "px";
this.board.style.height = (this.height * this.squareSize) + "px";
for (let y=0; y<this.height; y++) {
let row = [];
for (let x=0; x<this.width; x++) {
let square= document.createElement("div");
row.push(square);
square.className = (x+y)%2 ? 'oddSquare' : 'evenSquare';
square.style.width = this.squareSize + 'px';
square.style.height = this.squareSize + 'px';
square.style.top = (y * this.squareSize) + 'px';
square.style.left = (x * this.squareSize) + 'px';
this.board.appendChild(square);
}
this.theSquares.push(row);
}
}
dropLoc(piece)
{
let pos = piece.relativePosition(this.board);
let sz = piece.size();
let x = pos.x + sz.width/2;
let y = pos.y + sz.height/2;
if (document.body.offsetLeft) {
x -= document.body.offsetLeft;
y -= document.body.offsetTop;
}
let i = Math.floor(x / this.squareSize);
let j = Math.floor(y / this.squareSize);
return {column:i, row:j};
}
addPiece(piece, loc, animate)
{
let sz = this.squareSize;
let cx = Math.floor(loc.column * sz + sz/2);
let cy = Math.floor(loc.row * sz + sz/2);
piece.attach(loc, cx, cy, this.board, animate);
if (this.pieces.indexOf(piece) < 0)
this.pieces.push(piece);
this._model = null;
}
placePiece(piece, loc, animate)
{
this.addPiece(piece, loc, animate);
this.controller.piecesChanged();
}
removePiece(piece, animate)
{
if (animate)
piece.animatePutAway();
else
piece.putAway();
let i = this.pieces.indexOf(piece);
if (i >= 0) {
this.pieces.splice(i,1);
this._model = null;
}
}
pieceDragged(piece, dragCell, dragStart)
{
const loc = this.dropLoc(piece);
const hit = !this.locked && loc.column >= 0 && loc.column < this.width && loc.row >= 0 && loc.row < this.height;
if (hit) {
let fnd = this.pieces.find(({location}) => location.row == loc.row && location.column == loc.column);
if (fnd) {
if (fnd === piece) {
this.placePiece(piece, dragCell, true);
}
else {
piece.snapBack(dragStart).then(() => {
if (dragCell) {
this.placePiece(piece, dragCell, false);
}
else {
piece.putAway();
}
});
}
}
else {
this.placePiece(piece, loc, true);
}
}
return hit;
}
renamePiece(piece, newNames)
{
const re = /^\s*([a-z][a-zA-Z0-9_]*)\s*$/;
let illegal = newNames.find(n => !re.test(n));
if (illegal)
return "Illegal name: " + illegal;
illegal = newNames.find(n => isAVariable(n));
if (illegal)
return illegal + " is a variable, not a name";
let existingNames = this.pieces.filter(p => p !== piece).reduce((ns, p) => ns.concat(p.getNames()), []);
let dup = newNames.find(n => existingNames.indexOf(n) >= 0);
if (dup)
return "Another object is already named '"+dup + "'. Please choose a different name.";
piece.setNames(newNames);
this._model = null;
this.controller.piecesChanged();
return null;
}
export()
{
return this.pieces.map(p => p.export());
}
getModel()
{
if (!this._model) {
this._model = new ChessboardModel(this.export());
}
return this._model;
}
getDom() {
return this.board;
}
}
class ShapeBin {
constructor(shapes, parent, controller) {
this.controller = controller;
this.parent = parent;
let ref =
(new ElementRef(parent)).child('div', {class: 'shapebin'}).cap(this, 'domElt')
.child('h3', 'Drag to the board')
.sibling('table')
.child('tbody');
for (const sr of shapes) {
let rref = ref.child('tr');
for (const shape of sr) {
let td = rref.child('td').elt;
let img = newShape(shape, td);
let elt = img.getDomElement();
elt.addEventListener('mousedown', event => {
let pos = img.relativePosition(this.domElt);
let properties = {x: pos.x, y: pos.y, className: shape, visible: true};
let piece = new Chesspiece(this.domElt, controller, properties);
event.preventDefault();
piece.drag(event);
}, false);
elt.addEventListener('click', () => false, false);
}
}
}
}
const defaultOptions = { squareSize: 75, width: 8, height: 8, tvFeedback: true, hasShapeBin: true };
Chessboard = class {
constructor (options, parent, controller)
{
this.controller = controller || null;
this.options = options = mergeParams(options, defaultOptions);
if (options.ui_properties && !options.ui_properties.editable) {
options.piecesLocked = true;
options.sentencesLocked = true;
}
this.parent = parent;
this.outer = document.createElement('div');
this.outer.className = 'world';
parent.appendChild(this.outer);
this.boardView = new BoardView(options, this.outer, this);
this.outer.style.height = this.boardView.getDom().offsetHeight + 'px';
const shapes = [['bsquare','ssquare'], ['bdiamond','sdiamond'], ['boct','soct']];
if (options.hasShapeBin) {
this.shapeBin = new ShapeBin(shapes, this.outer, this);
}
this.createMessageBoard(this.outer, options);
this.sentenceTable = new SentenceTable(this, options, this.outer);
this.sentenceTable.refresh();
}
remove()
{
this.parent.removeChild(this.outer);
this.sentenceTable.remove();
}
export()
{
return { pieces: this.boardView.export(),
sentences: this.sentenceTable.getSentences() };
}
getModel()
{
return this.boardView.getModel();
}
piecesChanged()
{
if (this.sentenceTable)
this.sentenceTable.refresh();
if (this.controller)
this.controller.attemptChanged();
}
sentencesChanged()
{
if (this.controller)
this.controller.attemptChanged();
}
createMessageBoard(parent, options)
{
if (options.messageHeader === undefined && options.messageText === undefined)
return;
(new ElementRef(parent)).child('div', {class: 'message-board'})
.child('h3', options.messageHeader)
.sibling('div', options.messageText);
}
pieceDragged(piece, dragCell, dragStart)
{
if (!this.boardView.pieceDragged(piece, dragCell, dragStart)) {
if (dragCell) {
this.boardView.removePiece(piece, true);
this.piecesChanged();
}
else {
piece.snapBack(dragStart).then(() => piece.putAway());
}
}
}
renamePiece(piece, newNames)
{
return this.boardView.renamePiece(piece, newNames);
}
}
}());

var ParseTreeUI, Line, TreeMap, TruthTableData;
(function(){
"use strict";
var ParseTreeUIElt, ParseTreeView;
function setPos(elt, x, y)
{
elt.style.left = x + 'px';
elt.style.top = y + 'px';
}
function addVLine(x, y, height, parent)
{
let node = document.createElement('div');
node.setAttribute('class', 'vertical-line');
setPos(node, x, y);
node.style.height = height + 'px';
parent.appendChild(node);
return node;
}
Line = class {
constructor(className)
{
this.elt = document.createElement('div');
this.elt.className = className || 'vertical-line';
}
setEndpoints(x0, y0, x1, y1)
{
const cx = (x0+x1)/2, cy = (y0+y1)/2;
const dx = (x1-x0), dy = (y1-y0);
const length = Math.sqrt(dx*dx + dy*dy);
const top = cy - length/2;
let angle;
if (dy == 0)
angle = 90;
else {
const slope = -dx/dy;
angle = Math.atan(slope);
angle = angle * 180 / Math.PI;
angle = Math.round(angle);
}
this.elt.style.left = Math.round(cx) + 'px';
this.elt.style.top = Math.round(top) + 'px';
this.elt.style.height = Math.round(length) + 'px';
this.elt.style.transform = "rotate("+angle+"deg)";
this.elt.style.msTransform = "rotate("+angle+"deg)";
}
getDomElement()
{
return this.elt;
}
}
function addDLine(x0, y0, x1, y1, parent)
{
const line = new Line();
line.setEndpoints(x0, y0, x1, y1);
const elt = line.getDomElement();
if (parent)
parent.appendChild(elt);
return elt;
}
function maskConnective(elt)
{
var mask = document.createElement('div');
elt.parentNode.appendChild(mask);
mask.className = 'connective-mask';
mask.style.left = elt.style.left;
mask.style.top = elt.style.top;
mask.style.display = 'block';
animationEnd(mask).then(() => mask.parentNode.removeChild(mask));
}
const HGAP = 50
const VGAP = 60
ParseTreeUIElt = class {
constructor(expr, cText, treeLoc, options, ui)
{
this.parent = ui.container;
this.owner = ui;
this.editable = options.ui_properties ? options.ui_properties.editable : true;
this.expr = expr;
this.treeLoc = treeLoc;
this.sText = exprString(expr);
this.cText = cText;
this.domElt = null;
this.centerX = this.centerY = 0;
this.conElt = null;
this.childNodes = [];
this.lineDomElts = [];
this.selfWidth = 0;
this.childrenWidth = 0;
this.selfHeight = 0;
this.totalWidth = 0;
this.isCollapsed = false;
this.selected = false;
}
_addChild(child)
{
this.childNodes.push(child);
}
preInit()
{
this.childNodes.forEach(c => c.preInit());
this.domElt = document.createElement('div');
this.domElt.setAttribute('class', 'sentence-node');
if (typeof sText === 'string') {
setText(this.domElt, this.sText);
}
else {
this._createNodes(this.sText);
}
this.domElt.addEventListener("click", e => this.click(e));
this.domElt.addEventListener('mousedown', e => {
if (this.owner.mousedown !== undefined)
this.owner.mousedown(e, this);
});
this.parent.appendChild(this.domElt);
if (this.cText) {
this.conElt = document.createElement('div');
this.conElt.setAttribute('class', 'connective-node');
const tnode = document.createTextNode(this.cText);
this.conElt.appendChild(tnode);
this.parent.appendChild(this.conElt);
if (this.cText == '<->') {
this.conElt.setAttribute('class', 'connective-node wide');
}
}
this.selfWidth = this.domElt.clientWidth;
this.selfHeight = this.domElt.clientHeight;
this.childrenWidth = this.childNodes.reduce((w,c) => w + c.totalWidth, 0);
if (this.childNodes.length)
this.childrenWidth += HGAP * (this.childNodes.length - 1);
this.totalWidth = Math.max(this.childrenWidth, this.selfWidth);
}
finalize(cx, cy)
{
this.centerX = cx;
this.centerY = cy;
let x = cx - this.selfWidth / 2;
let y = cy - this.selfHeight / 2;
setPos(this.domElt, x, y);
if (this.conElt) {
cy += VGAP;
x = Math.round(cx - this.conElt.clientWidth / 2);
y = Math.round(cy - this.conElt.clientHeight / 2);
setPos(this.conElt, x, y);
let line = addVLine(this.centerX, this.centerY, VGAP, this.parent);
this.lineDomElts.push(line);
const cxs = this._calculateChildren();
this.childNodes.forEach( (n, i) => {
var childx = cxs[i];
var childy = cy + VGAP;
n.finalize(childx, childy);
line = addDLine(cx, cy, childx, childy, this.parent);
this.lineDomElts.push(line);
});
}
}
_calculateChildren()
{
var left = this.centerX - this.childrenWidth / 2;
var edges = this.childNodes.reduce((t, c, i) =>
t.concat([t[i] + HGAP + c.totalWidth]), [left - HGAP]);
var leftEdges = edges.slice(0,-1).map(e => e + HGAP);
var rightEdges = edges.slice(1);
return leftEdges.map((e,i) => Math.round((e + rightEdges[i])/2));
}
_decorate(context)
{
const x = this.centerX + this.selfWidth / 2;
const y = this.centerY - this.selfHeight / 2;
const vis = this.domElt.style.display != 'none';
const oldDecoration = this.decoration;
const decoration = (new ElementRef(this.parent)).child('div', {'class': 'tree-decoration'}).elt;
this.decoration = decoration;
if (vis) {
decoration.classList.add('exited');
setTimeout(() => decoration.classList.remove('exited'));
}
setPos(decoration, x+10, y);
if (oldDecoration) {
if (vis) {
oldDecoration.classList.add('exited');
transition1(oldDecoration, () => this.parent.removeChild(oldDecoration));
}
else {
this.parent.removeChild(oldDecoration);
}
}
const value = context.enteredValue(this.treeLoc);
if (value === true || value === false) {
setText(decoration, value ? 'T' : 'F');
if (this.owner.showMistakes() && value !== context.correctValue(this.treeLoc))
decoration.style.color='red';
decoration.style.paddingTop = '6px';
return;
}
else if (value !== null) {
return;
}
let top, bottom;
(new ElementRef(decoration)).child('div', 'T', {'class': 'truthopt'}).cap(e => top=e)
.sibling('div', 'F', {'class': 'truthopt'}).cap(e => bottom=e);
bottom.classList.add('bottom');
let handlers = [];
[0,1].forEach(i => {
const val = (i === 0);
const elt = (i === 0) ? top : bottom;
const alt = (i === 0) ? bottom : top;
handlers[i] = () => {
if (!this.owner.acceptsOption(this, context))
return;
if (!this.editable)
return;
if (this.owner.handleOption(this, context, val)) {
elt.classList.add('big');
alt.classList.add('exited');
top.removeEventListener('click', handlers[0], false);
bottom.removeEventListener('click', handlers[1], false);
this.owner.didHandleOption(this, context, val, true);
}
else {
elt.classList.add('shake');
animationEnd(elt).then(() => elt.classList.remove('shake'));
this.owner.didHandleOption(this, context, val, false);
}
}
elt.addEventListener('click', handlers[i], false);
})
}
decorateWithSource(source)
{
this._decorate(source);
if (['NOT','AND','OR','IF','IFF'].indexOf(this.expr.op) >= 0) {
this.childNodes.forEach(n => n.decorateWithSource(source));
}
}
removeSelfAndChildren()
{
this.childNodes.forEach(c => c.removeSelfAndChildren());
this.lineDomElts.forEach(e => this.parent.removeChild(e));
if (this.decoration)
this.parent.removeChild(this.decoration);
if (this.conElt) {
this.parent.removeChild(this.conElt);
this.conElt = null;
}
this.parent.removeChild(this.domElt);
this.domElt = null;
}
_setCollapsed(collapsing, animate=true, toplevel=true)
{
if (toplevel) {
this.isCollapsed = collapsing;
}
else {
setVisibility(this.domElt, !collapsing, animate);
if (this.decoration)
setVisibility(this.decoration, !collapsing, animate);
}
const vis = !collapsing && !this.isCollapsed;
this.lineDomElts.forEach(e => setVisibility(e, vis, animate));
if (this.conElt) {
setVisibility(this.conElt, vis, animate);
if (vis && animate)
maskConnective(this.conElt);
}
this.childNodes.forEach(c => c._setCollapsed(!vis, animate, false));
function setVisibility(elt, vis, animate) {
if (!animate || !vis) {
elt.style.display = vis ? 'block' : 'none';
}
else {
elt.style.display = 'block';
elt.classList.add('entering');
animationEnd(elt).then(() => elt.classList.remove('entering'));
}
}
}
collapseAll()
{
this.collapse('X', false);
}
collapse(cstate, animate=true)
{
let rest = cstate.substr(1);
if (cstate.charAt(0) == 'X') {
this.childNodes.forEach(c => c.collapse('X', animate));
this._setCollapsed(true);
}
else {
this._setCollapsed(false, animate);
rest = this.childNodes.reduce((r, c) => c.collapse(r, animate), rest);
}
return rest;
}
isFullyExpanded()
{
if (this.domElt.style.display == 'none')
return false;
return this.childNodes.every(n => n.isFullyExpanded());
}
_createNodes(parts)
{
parts.forEach(({str, level}) => {
(new ElementRef(this.domElt)).child('span', str).cap(elt => {
if (level >= 0) {
elt.className = 'connective';
elt.addEventListener('click',
event => this._clickConnective(event, level === 0),
false);
}
});
});
}
_clickConnective(event, isMain)
{
if (!this.editable)
return;
if (this.owner.nodeCanExpand !== undefined && !this.owner.nodeCanExpand(this))
return;
if (this.isCollapsed) {
if (isMain) {
this._setCollapsed(false);
this.owner.clickConnective(this, true, event);
}
else {
this.owner.clickConnective(this, false, event);
const elt = this.domElt;
elt.classList.add('shake');
animationEnd(elt).then(() => elt.classList.remove('shake'));
}
}
}
click(event)
{
}
setSelected(sel)
{
this.selected = sel;
this.domElt.className = sel ? 'sentence-node-selected' : 'sentence-node';
}
getCollapseState()
{
if (this.isCollapsed) {
return 'X';
}
return this.childNodes.reduce((r, c) =>
r + c.getCollapseState(),
this.childNodes.length.toString());
}
getText()
{
if (typeof this.sText === 'string')
return this.sText;
else
return this.sText.reduce((a,b) => a + b.str, "");
}
static nodeForExpression(expr, treeLoc, options, parent)
{
var node, i;
var ctext;
switch(expr.op) {
case 'NAME':
case 'PRED':
case 'FUNC':
case 'EQUAL':
case 'EET':
return new ParseTreeUIElt(expr, null, treeLoc, options, parent);
case 'NOT':
ctext = '~';
break;
case 'AND':
ctext = '&';
break;
case 'OR':
ctext = '|';
break;
case 'IF':
ctext = '->';
break;
case 'IFF':
ctext = '<->';
break;
case 'ALL':
ctext = 'A';
break;
case 'EXISTS':
ctext = 'E';
break;
default:
return null;
}
node = new ParseTreeUIElt(expr, ctext, treeLoc, options, parent);
expr.args.forEach( (a, i) =>
node._addChild(ParseTreeUIElt.nodeForExpression(a, treeLoc.child(i), options, parent)) );
return node;
}
}
function exprString(expr, level=0)
{
var str, left, right, con, result;
switch(expr.op) {
case 'FUNC':
case 'PRED':
str = expr.args[0].atom;
if (expr.args.length != 1 || expr.op == 'FUNC') {
str += '(' + expr.args.slice(1).map(a => exprString(a)[0].str).join(', ') + ')';
}
return [{str: str, level:-1}];
case 'NAME':
return [{str: expr.atom, level:-1}];
case 'EET':
return [{str: '!', level: -1}];
case 'NOT':
left = exprString(expr.args[0], level+1);
return [{str:'~', level:level}].concat(left);
case 'AND':
con = ' & ';
break;
case 'OR':
con = ' | ';
break;
case 'IF':
con = ' -> ';
break;
case 'IFF':
con = ' <-> ';
break;
case 'ALL':
right = exprString(expr.args[1], level+1);
left = [{str: expr.args[0].atom+' ', level: -1}];
return [{str:'A', level: level}].concat(left, right);
case 'EXISTS':
right = exprString(expr.args[1], level+1);
left = [{str: expr.args[0].atom+' ', level: -1}];
return [{str:'E', level: level}].concat(left, right);
case 'EQUAL':
con = '=';
break;
default:
return null;
}
left = exprString(expr.args[0], level+1);
right = exprString(expr.args[1], level+1);
con = [{str: con, level: level}];
result = left.concat(con, right);
if (level>0) {
result = [{str: '(', level: -1}].concat(result, [{str: ')', level: -1}]);
}
return result;
}
ParseTreeView = class {
constructor(options, parentElt, controller)
{
this.roots = [];
this.parent = controller;
this.outer = parentElt;
(new ElementRef(this.outer)) .child('div', {class: 'parse-tree'}) .cap(this, 'container');
this.enforceTree = !(options.enforceTree === false);
this.enforceNodes = options.enforceNodes || false;
this.ui_properties = options.ui_properties || { editable: true, feedback: false, gradable: false };
if (!options.sentences)
return;
const ee = options.sentences.map(parseSentence);
if (ee.every(e=>e)) {
this.exprs = ee;
this.initWithExpressions(this.exprs, options);
}
}
initWithExpressions(exprs, options)
{
exprs.forEach((expr, i) => {
const loc = new TreeLocation(exprs, i);
this.roots[i] = ParseTreeUIElt.nodeForExpression(expr, loc, options, this);
this.roots[i].preInit();
});
const spacer = 60;
const positions = this.roots.reduce((p, r, i) => p.concat([p[i] + r.totalWidth + spacer]), [0]);
this.roots.forEach((root, i) => {
const x = positions[i] + root.totalWidth / 2;
const y = root.selfHeight / 2;
root.finalize(x, y);
});
if (options.cstate) {
this.roots.forEach((r, i) => r.collapse(options.cstate[i], false));
}
else if (options.collapsed)
this.collapseAll();
const width = positions[positions.length-1] - spacer;
const height = this.height();
this.container.style.width = (width+2) + 'px';
this.container.style.height = height + 'px';
this._width = width;
}
setPosition(top, left)
{
setPos(this.container, left, top);
}
width()
{
return this._width;
}
height()
{
const minY = this.roots.reduce((y, root) => Math.min(y, top(root)), 1000000);
const maxY = this.roots.reduce((y, root) => Math.max(y, bottom(root)), -1000000);
return maxY - minY;
function top(node) {
const t = node.centerY - node.selfHeight / 2;
return node.childNodes.reduce((y, n) => Math.min(y, top(n)), t);
}
function bottom(node) {
const b = node.centerY + node.selfHeight / 2;
return node.childNodes.reduce((y, n) => Math.max(y, bottom(n)), b);
}
}
canDecorate()
{
return this.roots.every(r => r.isFullyExpanded());
}
showMistakes()
{
return this.ui_properties.feedback || this.ui_properties.gradable
}
decorate(source)
{
this.roots.forEach(r => r.decorateWithSource(source));
}
collapseAll()
{
this.roots.forEach(r => r.collapse('X'))
}
clickConnective(elt, correct, event)
{
this.parent.clickConnective(elt, correct, event);
}
acceptsOption(node, context)
{
if (!this.enforceTree)
return true;
var loc = node.treeLoc;
return node.childNodes.every((n,i) => context.enteredValue(loc.child(i)) !== null);
}
handleOption(node, context, val)
{
return !this.enforceNodes || val === context.correctValue(node.treeLoc);
}
didHandleOption(node, context, val, succ)
{
var index = this.roots.indexOf(node);
this.parent.didHandleOption(index, node, context, val, succ);
}
export()
{
return { cstate: this.roots.map(r => r.getCollapseState()) }
}
}
class EntryBox {
constructor(left, top, width, type, editable, selection, parentElt, exprs, controller)
{
this.controller = controller;
var div = document.createElement('div');
div.style.position = 'absolute';
setPos(div, left, top);
div.style.width = width + 'px';
parentElt.appendChild(div);
var message;
switch(type) {
case 'impl':
if (exprs.length == 2) {
message = "#1 $Implies,Doesn't Imply$ #2";
}
else {
message = "#f $Imply,Don't Imply$ #l";
}
break;
case 'equiv':
message = "#1 and #2 are $Equivalent,Not Equivalent$";
break;
case 'taut':
message = "#1 $Is,Is Not$ a tautology";
break;
case 'contr':
message = "#1 $Is,Is Not$ a contradiction";
break;
default:
message = '';
}
var strings = exprs.map(e => exprToString(e));
message = message.replace(/#(.)/g, (_, c) => {
if (c >= '0' && c <= '9')
return strings[Number(c)-1];
else if (c === 'f')
return strings.slice(0, -2).join(', ') + ' and ' + strings.slice(-2)[0];
else if (c === 'l')
return strings.slice(-1)[0];
else
return '';
});
var segs = message.split('$');
(new ElementRef(div)).child('span', segs[0])
.sibling('select').cap(this, 'menu');
var firstopt = new Option("(choose)");
this.menu.add(firstopt);
firstopt.disabled = true;
segs[1].split(',').forEach(o => this.menu.add(new Option(o,o)));
if (segs.length > 2) {
(new ElementRef(div)).child('span', segs[2]);
}
if (selection) {
this.menu.selectedIndex = selection;
}
this.menu.disabled = !editable;
this.menu.addEventListener('change', () => this.controller.tableChanged(), false);
}
getSelection()
{
return this.menu.selectedIndex;
}
}
var defaultOptions = { hasTruthTable: true, y: 75, errbox: true, enforceNodes: true, enforceTree: true, undoButton:false };
ParseTreeUI = class {
constructor(options, parent, controller)
{
this.controller = controller || null;
options = mergeParams(options, defaultOptions);
this.options = JSON.parse(JSON.stringify(options));
this.ui_properties = this.options.ui_properties || { editable: true, feedback: false, gradable: false };
this.createMessage(parent);
var container = document.createElement('div');
container.className = 'parse-tree';
parent.appendChild(container);
this.parent = parent;
this.container = container;
this.undoStack = [];
this.redoStack = [];
if (!this.options.sentences)
return;
this.initTree();
if (this.options.tt !== undefined) {
var show = this.ui_properties.feedback || this.ui_properties.gradable;
this.truthTable.import(this.options.tt, show);
}
if (this.options.ecount !== undefined) {
this.importErrors(this.options.ecount);
}
}
createMessage(parent)
{
if (this.options.message) {
var p = document.createElement('p');
p.className = 'homework-message';
p.innerHTML = this.options.message;
parent.appendChild(p);
this.messageElt = p;
}
}
initTree()
{
var t=null;
this.tree = new ParseTreeView(this.options, this.container, this);
var width = this.tree.width();
var exprs = this.tree.exprs;
if (this.options.hasTruthTable) {
this.truthTable = new TruthTable(exprs, this.container, this);
t = this.truthTable.table;
if (this.options.ttPosition != 'bottom') {
width += 60 + t.clientWidth;
}
}
var x = (this.parent.clientWidth - width) / 2;
var top = this.options.y - 20;
this.tree.setPosition(top, x);
var totalHeight = top + this.tree.height();
var right = this.tree.width() + x + 60;
if (t) {
if (this.options.ttPosition == 'bottom') {
top = totalHeight + 50;
t.style.top = top + 'px';
var cx = this.parent.clientWidth / 2
t.style.left = (cx - t.clientWidth / 2) + 'px';
}
else {
setPos(t, right, top);
}
top += t.clientHeight + 20;
}
if (this.options.undoButton && this.ui_properties.editable) {
top = this.makeUndoButton(right, top);
}
if (this.options.errbox) {
this.makeErrorBox(right, top);
}
else if (this.options.entryType) {
this.entryBox = new EntryBox(right, top, 350, this.options.entryType, this.ui_properties.editable, this.options.sel, this.container, this.tree.exprs, this);
}
if (top > totalHeight)
totalHeight = top;
this.container.style.height = totalHeight + 'px';
}
makeUndoButton(left, top)
{
var reset = document.createElement('div');
reset.className = 'parse-button';
setPos(reset, left, top);
this.container.appendChild(reset);
var undobtn = document.createElement('span');
reset.appendChild(undobtn);
setText(undobtn, 'Undo');
undobtn.addEventListener('click', () => this.undo(), false);
var redobtn = document.createElement('span');
reset.appendChild(redobtn);
setText(redobtn, 'Redo');
redobtn.addEventListener('click', () => this.redo(), false);
var resetbtn = document.createElement('span');
reset.appendChild(resetbtn);
setText(resetbtn, 'Reset Row');
resetbtn.addEventListener('click', () => this.reset(), false);
var height = reset.clientHeight;
return top + height + 30;
}
makeErrorBox(x, y)
{
var e = {};
(new ElementRef(this.container))
.child('div', {class:'status-box'}) .cap(e, 'box')
.child('div', 'Mistakes: ')
.sibling('div') .cap(this, 'errorBox');
this.errorCount = 0;
setPos(e.box, this.options.ex || x, this.options.ey || y);
}
canDecorate()
{
return this.tree.canDecorate();
}
decorate(source)
{
this.tree.decorate(source);
}
remove()
{
this.parent.removeChild(this.container);
if (this.messageElt)
this.messageElt.parentNode.removeChild(this.messageElt);
}
markError()
{
var xmark = document.createTextNode('\u2717');
this.errorBox.appendChild(xmark);
this.errorCount++;
}
clickConnective(elt, correct, event)
{
if (correct) {
this.treeChanged();
}
else if (this.options.errbox) {
this.markError();
this.treeChanged();
}
}
didHandleOption(index, node, context, val, succ)
{
if (succ) {
this.undoStack.push(this.getState());
var loc = node.treeLoc;
context.setValue(loc, val);
if (this.truthTable && index >= 0) {
this.truthTable.set(val, index);
}
this.tableChanged();
}
else if (this.options.errbox) {
this.markError();
this.tableChanged();
}
}
getState()
{
return this.truthTable && this.truthTable.getState();
}
setState(state)
{
if (state && this.truthTable) {
this.truthTable.setState(state);
this.tableChanged();
}
}
undo()
{
var state = this.undoStack.pop();
if (state) {
var old = this.getState();
this.setState(state);
this.redoStack.push(old);
}
}
redo()
{
var state = this.redoStack.pop();
if (state) {
var old = this.getState();
this.setState(state);
this.undoStack.push(old);
}
}
reset()
{
if (this.truthTable) {
this.undoStack.push(this.getState());
this.truthTable.resetRow();
this.tableChanged();
}
}
importErrors(e)
{
if (this.errorBox) {
setText(this.errorBox, '');
this.errorCount = 0;
while (e-- > 0)
this.markError();
}
}
export()
{
var result = this.tree.export();
if (this.truthTable) {
result.tt = this.truthTable.export();
}
if (this.options.sentences)
result.sentences = this.options.sentences.slice(0);
if (this.options.errbox == true)
result.ecount = this.errorCount;
if (this.entryBox)
result.sel = this.entryBox.getSelection();
return result;
}
treeChanged()
{
if (this.controller)
this.controller.attemptChanged();
}
tableChanged()
{
if (this.controller)
this.controller.attemptChanged();
}
}
function exprToString(expr)
{
var s = exprString(expr);
return s.map(({str}) => str).join('');
}
class TruthTable {
constructor(exprs, parent, ui)
{
this.parent = parent;
this.data = new TruthTableData(exprs);
this.ttrows = this.data.getAllRows();
this.sentences = exprs.slice(0);
this.atoms = this.data.getSentences();
this.ui = ui;
var ref = (new ElementRef(parent))
.child('table', {class:'truth-table'}) .cap(this, 'table')
.child('thead')
.child('tr');
this.atoms.forEach(a => ref.child('td', exprToString(a)));
this.sentences.forEach(s => ref.child('td', exprToString(s), {class: 'result'}));
this.maps = this.ttrows.map(row => {
var m = new TreeMap(this.sentences);
m.setExplicitly(this.atoms, row);
return m;
});
this.currentRow = -1;
ref = ref.parent(2).child('tbody').cap(this,'body');
this.ttrows.forEach((row, i) => {
var ref2 = ref.child('tr');
row.forEach(v => ref2.child('td', v ? 'T' : 'F'));
this.sentences.forEach(sent => {
var rcell = ref2.child('td', '', {class:'result'}).elt;
var idx = this.atoms.findIndex(a => a.equals(sent));
if (idx >= 0) {
setText(rcell, row[idx] ? 'T' : 'F');
}
});
ref2.elt.addEventListener('click', () => {
if (!ui.canDecorate())
return;
ui.decorate(this._getSource(i));
if (this.currentRow >= 0)
this.body.childNodes[this.currentRow].className = 'normal';
this.currentRow = i;
ref2.elt.className = 'selected';
}, false);
});
}
_getSource(ttrow)
{
var map = this.maps[ttrow];
var model = new TTModel(this.atoms, this.ttrows[ttrow]);
return new TruthSource(map, model);
}
set(val, idx)
{
var body = this.table.childNodes[1];
var row = body.childNodes[this.currentRow];
var cell = row.childNodes[this.atoms.length + idx];
setText(cell, val ? 'T' : 'F');
}
setRow(row)
{
this.ui.decorate(this._getSource(row));
if (row === this.currentRow)
return;
if (this.currentRow >= 0) {
this.body.childNodes[this.currentRow].className = 'normal';
}
this.currentRow = row;
if (this.currentRow >= 0) {
this.body.childNodes[this.currentRow].className = 'selected';
}
}
resetRow(row)
{
if (row === undefined) {
row = this.currentRow;
if (row < 0)
return;
}
this.maps[row] = new TreeMap(this.sentences);
this.maps[row].setExplicitly(this.atoms, this.ttrows[row]);
if (row === this.currentRow) {
this.ui.decorate(this._getSource(row));
}
this._redrawRow(row, false);
}
remove()
{
this.parent.removeChild(this.table);
}
getState()
{
return {state:this.export(), row:this.currentRow};
}
setState(s)
{
this.import(s.state);
this.setRow(s.row);
}
export()
{
var result = this.maps.map(m => m.export());
return result[0].map((col, i) => result.map(row => row[i]));
}
_redrawRow(idx, showErr)
{
const model = new TTModel(this.atoms, this.ttrows[idx]);
const body = this.table.childNodes[1];
const tr = body.childNodes[idx];
for (let i=0; i<this.sentences.length; i++) {
const loc = new TreeLocation(this.sentences, i)
const map = this.maps[idx];
const v = map.getValue(loc);
const entry = (v === null) ? "" : (v ? 'T' : 'F');
const td = tr.childNodes[this.atoms.length + i];
setText(td, entry);
if (showErr && v !== model.eval(this.sentences[i]))
td.style.color = 'red';
}
}
import(arr, showErr)
{
arr = arr[0].map((col, i) => arr.map(row => row[i]));
for (var row=0; row<arr.length; row++) {
var map = new TreeMap(this.sentences);
map.import(arr[row]);
this.maps[row] = map;
this._redrawRow(row, showErr);
}
}
}
class TreeLocation {
constructor(exprs, idx)
{
this.exprs = exprs;
if (idx !== undefined)
this.path = [idx];
}
expression()
{
return this.path.reduce((e, p) => e ? e.args[p] : this.exprs[p], null);
}
child(idx)
{
const e = this.expression();
if (e.args.length <= idx)
return null;
let result = new TreeLocation(this.exprs);
result.path = this.path.concat([idx]);
return result;
}
parent()
{
if (this.path.length === 1)
return null;
let result = new TreeLocation(this.exprs);
result.path = this.path.slice(0, -1);
return result;
}
}
TreeMap = class {
constructor(exprs)
{
this.exprs = exprs;
this.children = exprs.map(e => _make(e, 0));
function _make(expr, depth)
{
let children = [];
if (['NOT','AND','OR','IF','IFF','ALL','EXISTS'].indexOf(expr.op) >= 0) {
children = expr.args.map(a => _make(a, depth+1));
}
return { value: undefined, children: children, depth: depth };
}
}
_getNode(loc)
{
return loc.path.reduce((n, p) => n && n.children[p], this);
}
getValue(loc)
{
const n = this._getNode(loc);
return n && n.value;
}
setValue(loc, val)
{
let n = this._getNode(loc);
if (n)
n.value = val;
}
forEach(f)
{
_for(this.exprs, this.children);
function _for(es, cs)
{
cs.forEach((c, j) => {
const e = es[j];
if (f(e,c))
_for(e.args, c.children)
});
}
}
setFromModel(m)
{
this.forEach(function(expr, node) {
node.value = m.eval(expr);
return ['NOT','AND','OR','IF','IFF'].indexOf(expr.op) >= 0;
});
}
setExplicitly(sentences, vals, dflt=null)
{
this.forEach((expr, node) => {
const idx = sentences.findIndex(e => e.equals(expr));
if (idx >= 0) {
node.value = vals[idx];
}
else if (expr.op === 'EET') {
node.value = false;
}
else {
node.value = dflt;
}
return ['NOT','AND','OR','IF','IFF'].indexOf(expr.op) >= 0;
});
}
export()
{
let result = [];
this.forEach(function(expr, node) {
if (node.depth === 0)
result.push("");
const v = node.value;
let s;
if (v === null)
s = 'U';
else if (v === undefined)
s = '-';
else
s = v ? 'T' : 'F';
result[result.length-1] += s;
return ['NOT','AND','OR','IF','IFF'].indexOf(expr.op) >= 0;
});
return result;
}
import(arr)
{
var i=0, s;
var m = { 'T': true, 'F': false, 'U': null, '-': undefined };
this.forEach((e, _) => { e.value = undefined; });
this.forEach(function(expr, node) {
if (node.depth === 0)
s = arr[i++];
var c = s.charAt(0);
s = s.slice(1);
node.value = m[c];
return ['NOT','AND','OR','IF','IFF'].indexOf(expr.op) >= 0;
});
}
}
class TruthSource {
constructor(map, model)
{
this.map = map;
this.model = model;
}
enteredValue(treeLoc)
{
return this.map.getValue(treeLoc);
}
correctValue(treeLoc)
{
const e = treeLoc.expression();
return this.model.eval(e);
}
setValue(treeLoc, val)
{
this.map.setValue(treeLoc, val);
}
}
TruthTableData = class {
constructor(exprs)
{
this.sentences = [];
const add1 = e => {
if (['NOT','AND','OR','IF','IFF'].indexOf(e.op) >= 0) {
e.args.forEach(add1);
}
else if (e.op !== 'EET') {
const idx = this.sentences.findIndex(ee => ee.equals(e));
if (idx < 0)
this.sentences.push(e);
}
};
exprs.forEach(add1);
}
getSentences()
{
return this.sentences.slice(0);
}
getAllRows()
{
const n = this.sentences.length;
const r = 1 << n;
let result = [];
for (let i=0; i<r; i++) {
let row = [];
for (let b=n-1; b>=0; b--) {
const v = (1 << b) & i;
row.push(v === 0);
}
result.push(row);
}
return result;
}
}
}());

"use strict";
class Table {
constructor(columnNames) {
this.rows = [];
this.columnNames = columnNames.slice(0);
}
select(columns, filter)
{
if (!columns)
columns = this.columnNames;
var result = new Table(columns);
this.rows.forEach(r => {
var nr = {};
columns.forEach(c => nr[c] = r[c]);
if (!filter || filter(r))
result.rows.push(nr);
});
return result;
}
sort(columns)
{
this.rows.sort((r1, r2) => {
for (var i=0; i<columns.length; i++) {
var key = columns[i];
var a = r1[key], b = r2[key];
if (Number(a) > Number(b))
return 1;
else if (Number(b) > Number(a))
return -1;
else if (a > b)
return 1;
else if (b > a)
return -1;
}
return 0;
});
}
insert(values, columns)
{
var r = {};
this.columnNames.forEach((key, _) => r[key] = null);
columns.forEach((key, i) => r[key] = values[i]);
this.rows.push(r);
this.index = null;
}
join(t2, left, right, commonCols, leftCols, rightCols)
{
var i, j, cmp;
var resultCols = this.columnNames.concat(t2.columnNames);
resultCols.sort();
var c = [];
for (i=1; i<resultCols.length; i++) {
if (resultCols[i] == resultCols[i-1]) {
c.push(resultCols[i]);
resultCols.splice(i--, 1);
}
}
commonCols = commonCols || c;
var colTbl = resultCols.map(col => {
if (leftCols && leftCols.indexOf(col) >= 0)
return 0;
else if (rightCols && rightCols.indexOf(col) >= 0)
return 1;
var leftX = this.columnNames.indexOf(col) >= 0;
var rightX = t2.columnNames.indexOf(col) >= 0;
var idx = leftX ? 0 : 1;
if (leftX && rightX)
idx = left ? 0 : (right ? 1 : 0);
return idx;
});
var result = new Table(resultCols);
var tab1 = this.rows.slice(0);
var tab2 = t2.rows.slice(0);
if (commonCols.length) {
tab1.sort(compare);
tab2.sort(compare);
}
var last=0;
for (i=0; i<tab1.length; i++) {
var added = false;
for (j=last; j<tab2.length; j++) {
cmp = compare(tab1[i], tab2[j]);
if (cmp === 0) {
add(tab1[i], tab2[j]);
added = true;
}
else if (cmp < 0) {
break;
}
else {
last = j+1;
}
}
if (!added && left) {
addNull(tab1[i]);
}
}
if (right) {
for (j=0, i=0; j<tab2.length; j++) {
added = false;
for (; i<tab1.length; i++) {
cmp = compare(tab1[i], tab2[j]);
if (cmp === 0) {
added = true;
break;
}
else if (cmp > 0) {
break;
}
}
if (!added) {
addNull(tab2[j]);
}
}
}
return result;
function compare(row1, row2)
{
for (var i=0; i<commonCols.length; i++) {
var key = commonCols[i];
var a = String(row1[key]), b = String(row2[key]);
if (a > b)
return 1;
else if (b > a)
return -1;
}
return 0;
}
function add(row1, row2)
{
var r = {};
for (var i=0; i<resultCols.length; i++) {
var key = resultCols[i];
var row = arguments[colTbl[i]];
r[key] = row && row[key];
}
result.rows.push(r);
}
function addNull(row)
{
var r = {};
for (var i=0; i<resultCols.length; i++) {
var key = resultCols[i];
r[key] = row[key] || null;
}
result.rows.push(r);
}
}
outerJoin(table, commonCols, leftCols, rightCols)
{
return this.join(table, true, true, commonCols, leftCols, rightCols);
}
leftJoin(table, commonCols, leftCols, rightCols)
{
return this.join(table, true, false, commonCols, leftCols, rightCols);
}
rightJoin(table, commonCols, leftCols, rightCols)
{
return this.join(table, false, true, commonCols, leftCols, rightCols);
}
innerJoin(table, commonCols, leftCols, rightCols)
{
return this.join(table, false, false, commonCols, leftCols, rightCols);
}
simpleJoin(table, keyCols)
{
var r1 = this.rows.map(r => [r, null, key(r)]);
var r2 = table.rows.map(r => [null, r, key(r)]);
var rows = r1.concat(r2);
rows.sort((a, b) => a[2] < b[2] ? -1 : (a[2] > b[2] ? 1 : 0));
var res = [];
rows.forEach(r => {
if (res.length === 0) {
res.push(r);
}
else {
let last = res[res.length - 1];
if (last[2] === r[2]) {
last[0] = last[0] || r[0];
last[1] = last[1] || r[1];
}
else {
res.push(r);
}
}
});
return res;
function key(row)
{
var vals = keyCols.map(k => row[k]);
return vals.join('%');
}
}
reduce(columns)
{
if (columns === undefined)
columns = this.columnNames;
this.sort(columns);
this.rows = this.rows.filter((row, i) =>
i === 0 || columns.some(c => this.rows[i-1][c] != row[c])
);
this.index = null;
}
mergeColumns(col1, col2, newcol, f)
{
var i, r, v, v1, v2;
for (i=0; i<this.rows.length; i++) {
r = this.rows[i];
v1 = r[col1];
v2 = r[col2];
if (v1 === null)
v = v2;
else if (v2 === null)
v = v1;
else
v = f(v1, v2);
delete r[col1];
delete r[col2];
r[newcol] = v;
}
i = this.columnNames.indexOf(col1);
if (i >= 0)
this.columnNames.splice(i,1);
i = this.columnNames.indexOf(col2);
if (i >= 0)
this.columnNames.splice(i,1);
this.columnNames.push(newcol);
this.index = null;
}
update(f)
{
this.rows.forEach(f);
}
forEach(f)
{
this.rows.forEach(f);
}
getRow(idx)
{
if (idx < 0 || idx >= this.rows.length)
return null;
else
return this.rows[idx];
}
getIndexOf(map)
{
return this.rows.findIndex(r => {
for (var key in map) {
if (r[key] != map[key])
return false;
}
return true;
});
}
numberOfRows()
{
return this.rows.length;
}
getColumns()
{
return this.columnNames.slice(0);
}
export(columns, filter)
{
var result = {};
for (var i=0; i<this.rows.length; i++) {
if (!filter || filter(this.rows[i]))
exportRow(result, this.rows[i], 0);
}
return result;
function exportRow(result, row, idx) {
if (idx === columns.length)
return result;
var key;
var col = columns[idx];
switch(col.charAt(0)) {
case '$':
key = row[col.substr(1)];
result[key] = exportRow(result[key] || {}, row, idx+1);
return result;
case '%':
col = col.substr(1);
result[col] = row[col];
exportRow(result, row, idx+1);
return result;
case '#':
key = col.substr(1);
return JSON.stringify(row[key]);
default:
return row[col];
}
}
}
import(data, columns)
{
this.rows = [];
this.index = null;
if (!data)
return;
var cleanColumns = columns.map(col => col.replace(/^[$%#]/, ''));
var self=this;
importRows([], data, 0);
function importRows(row, d, idx)
{
if (idx === columns.length) {
self.insert(row, cleanColumns);
return;
}
var col = columns[idx];
var k;
switch (col.charAt(0)) {
case '$':
if (Array.isArray(d)) {
d.forEach((dd, i) => {
if (dd !== null)
importRows(row.concat([i]), dd, idx+1);
});
}
else {
for (let k in d) {
importRows(row.concat([k]), d[k], idx+1);
}
}
break;
case '%':
k = d[col.substr(1)];
if (k === undefined) k = null;
importRows(row.concat([k]), d, idx+1);
break;
case '#':
d = JSON.parse(d);
self.insert(row.concat([d]), cleanColumns);
break;
default:
self.insert(row.concat([d]), cleanColumns);
break;
}
}
}
serialize()
{
var result = this.rows.map(row => this.columnNames.map(col => row[col]));
result = [this.columnNames].concat(result);
return JSON.stringify(result);
}
createIndex(columns)
{
this.indexColumns = columns.slice(0);
this.index = {};
this.rows.forEach(row => {
var key = columns.map(c => String(row[c])).join('%');
var entry = this.index[key];
if (!entry)
this.index[key] = [row];
else
entry.push(row);
});
}
_onlyIndexed(map)
{
return this.index && this.indexColumns.every(key => map[key] !== undefined);
}
_allIndexed(map)
{
if (!this.index)
return false;
for (var key in map) {
if (this.indexColumns.indexOf(key) < 0)
return false;
}
return true;
}
getData(map)
{
var i, found, row, rows, key;
if (this._onlyIndexed(map)) {
var key = this.indexColumns.map(col => String(map[col]));
var keyStr = key.join('%');
rows = this.index[keyStr] || [];
if (this._allIndexed(map)) {
return rows.length ? rows[0] : null;
}
}
else {
rows = this.rows;
}
return rows.find(row => {
for (key in map) {
if (row[key] != map[key])
return false;
}
return true;
});
}
doWhereEqual(map, f)
{
var rows = this.rows;
var only = this._onlyIndexed(map);
if (only) {
var key = this.indexColumns.map(col => String(map[col]));
var keyStr = key.join('%');
rows = this.index[keyStr] || [];
}
if (!only || !this._allIndexed(map)) {
rows = rows.filter(row => {
for (var k in map) {
if (row[k] != map[k])
return false;
}
return true;
});
}
rows.forEach(f);
return rows.length;
}
selectWhereEqual(columns, map)
{
if (!columns)
columns = this.columnNames;
var result = new Table(columns);
this.doWhereEqual(map, function(row) {
var newRow = {};
columns.forEach(c => newRow[c] = row[c]);
result.rows.push(newRow);
});
return result;
}
rename(map)
{
var newNames = this.columnNames.map(col => map[col] || col);
var i,j;
var result = new Table(newNames);
result.rows = this.rows.map(r => {
var nr = {};
newNames.forEach((n, j) => nr[n] = r[this.columnNames[j]]);
return nr;
});
return result;
}
union(tbl2)
{
var result = new Table(this.columnNames);
result.rows = this.rows.concat(tbl2.rows);
return result;
}
difference(tbl)
{
var cols = this.columnNames;
var t1 = this.rows.slice(0);
var t2 = tbl.rows.slice(0);
t1.sort(compare);
t2.sort(compare);
var result = new Table(this.columnNames);
var i,j;
for (i=0, j=0; i<t1.length; i++) {
while (j<t2.length) {
var cmp = compare(t1[i], t2[j]);
if (cmp === 0)
break;
else if (cmp < 0) {
result.rows.push(t1[i]);
break;
}
else
j++
}
if (j >= t2.length)
result.rows.push(t1[i]);
}
return result;
function compare(row1, row2)
{
for (var i=0; i<cols.length; i++) {
var key = cols[i];
var a = String(row1[key]), b = String(row2[key]);
if (a > b)
return 1;
else if (b > a)
return -1;
}
return 0;
}
}
static deserialize(s)
{
if (!s)
return null;
var a = JSON.parse(s);
if (!Array.isArray(a))
return null;
var cols = a[0];
if (!Array.isArray(cols))
return null;
var result = new Table(cols);
for (var i=1; i<a.length; i++) {
if (!Array.isArray(a[i]) || a[i].length !== cols.length)
return null;
result.insert(a[i], cols);
}
return result;
}
}

"use strict";
class MyDate {
constructor(year, day, month)
{
this._year = year;
if (month !== undefined) {
const lengths = this.monthTable(year);
let d = 0, m = 0;
while (m+1 < month) {
d += lengths[m++];
}
this._day = day + d;
}
else {
this._day = day;
}
}
isLeapYear(year) {
return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
}
monthTable(year) {
let monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
if (this.isLeapYear(year))
monthLengths[1] = 29;
return monthLengths;
}
getYear() { return this._year; }
getDayOfYear() { return this._day; }
monthAndDay() {
const lengths = this.monthTable(this._year);
let d = this._day, m = 0;
while (d > lengths[m]) {
d -= lengths[m++];
}
return {month: m, day: d};
}
plus(days)
{
let year = this._year;
let day = this._day + days;
for (;;) {
const ylen = this.isLeapYear(year) ? 366 : 365;
if (day <= ylen)
break;
day -= ylen;
year++;
}
return new MyDate(year, day);
}
startOfWeek() {
return new MyDate(this._year, this._day - this.dayOfWeek());
}
daysSince(d) {
const l2 = Math.ceil(d.getYear()/4) - Math.ceil(d.getYear()/100) + Math.ceil(d.getYear()/400);
const l1 = Math.ceil(this._year/4) - Math.ceil(this._year/100) + Math.ceil(this._year/400);
return 365 * (this._year - d.getYear()) + this._day - d.getDayOfYear() + l1 - l2;
}
dayOfWeek() {
const d = new MyDate(1904, 3);
const days = this.daysSince(d);
return days % 7;
}
date() {
var md = this.monthAndDay();
return new Date(this._year, md.month, md.day);
}
string(fmt) {
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const md = this.monthAndDay();
const dw = days[this.dayOfWeek()];
return fmt.replace(/yyyy/g, this._year.toString())
.replace(/mm/g, months[md.month])
.replace(/dd/g, md.day.toString())
.replace(/dw/g, dw);
}
thanksgiving() {
const d = new MyDate(this._year, 1, 11);
const dw = d.dayOfWeek();
let offs = 4-dw;
if (offs<0) offs += 7;
offs += 21;
return d.plus(offs);
}
springBreak() {
const weeks = 8;
return this.plus(weeks * 7);
}
sameWeek(d) {
const d1 = this.dayOfWeek();
const d2 = d.dayOfWeek();
return this._year == d.getYear() && this._day - d1 == d.getDayOfYear() - d2;
}
static fromDate(d) {
const year = d.getFullYear();
const month = d.getMonth() + 1;
const day = d.getDate();
return new MyDate(year, day, month);
}
static today() {
return this.fromDate(new Date());
}
}
class Semester {
constructor (startDate, isHalf) {
this.startDate = new MyDate(startDate.year, startDate.day, startDate.month)
this.breakWeeks = []
this.numWeeks = isHalf ? 8 : 16
if (startDate.month >= 8) {
this.semesterCode = 3
}
else if (startDate.month >= 5) {
this.semesterCode = 2
this.numWeeks = 8
}
else {
this.semesterCode = 1
this.breakWeeks = [8]
}
}
numberOfWeeks () {
return this.numWeeks
}
week2date (week) {
let incr = 0
this.breakWeeks.forEach(b => {
if (b <= week)
incr++
})
return this.startDate.plus(7 * (week + incr - 1))
}
unitLabel () {
return this.numWeeks === 8 ? 'Unit' : 'Week'
}
static _current = null;
static getCurrent() {
if (!Semester._current)
Semester._current = new Semester(CURRENT_TERM_START, IS_HALF_SEMESTER);
return Semester._current;
}
}
function getCurrentSemester() {
return Semester.getCurrent();
}

var Homework;
(function(){
"use strict";
var homework = [];
homework[1] = [
{"class":"world","messageHeader":"Problem #1 Instructions","messageText":"Enter sentences and configure the board so that all your sentences are true. You must use ALL of the following predicates: =, !=, Square, Diamond, Octagon, Large, Small, Above, Below, SameRow, SameColumn, SameShape, SameSize, LeftOf, RightOf, Between."},
{"class":"world","pieces":[{"x":2,"y":4,"shape":"octagon","size":"large","names":["c1","c2"]},{"x":5,"y":1,"shape":"diamond","size":"large","names":["b"]},{"x":3,"y":3,"shape":"octagon","size":"small","names":["d"]},{"x":5,"y":4,"shape":"square","size":"large","names":["a"]}],"sentences":[],"messageHeader":"Problem #2 Instructions","messageText":"Enter sentences that are true in the world. You must use ALL of the following predicates: =, !=, Square, Diamond, Octagon, Large, Small, Above, Below, SameRow, SameColumn, SameShape, SameSize, LeftOf, RightOf, Between.","piecesLocked":true},
{"class":"world","sentences":["e=f","a!=b","Square(a)","Diamond(c)","Octagon(f)","Large(d)","Small(c)","Above(e,c)","Below(d,a)","SameRow(d,b)","SameColumn(c,a)","SameShape(a,d)","SameSize(a,c)","LeftOf(e,b)","RightOf(f,d)","Between(e,d,b)"],"sentencesLocked":true,"messageHeader":"Problem #3 Instructions","messageText":"Arrange pieces on the board so that all of the sentences below are true."}
];
homework[2] = [
{"class":"world","sentences":["Square(a) & Diamond(b)","Square(a) | Square(b)","Square(b) -> Diamond(a)","Square(a) -> Octagon(c)","Diamond(d) <-> Octagon(c)","~Square(f)"],"sentencesLocked":true,"messageHeader":"Problem #1 Instructions","messageText":"Add pieces to the board to make the sentences below true."},
{"class":"world","sentences":["(Square(a) & Diamond(b)) | Small(c)","Square(a) & (Diamond(b) | Small(c))","","~Octagon(d) | LeftOf(d,e)","~[Octagon(d) | LeftOf(d,e)]","","[Large(f) & Small(g)] -> Square(h)","Large(f) & [Small(g) -> Square(h)]"],"messageHeader":"Problem #2 Instructions","messageText":"In each pair of sentences, make the first sentence TRUE and the second sentence FALSE.","sentencesLocked":true},
{"class":"world","sentences":["Large(c) -> Above(c,b)","SameShape(b,e) -> ~SameSize(b,e)","SameShape(a,d) & ~SameSize(a,d)","Small(c) & SameSize(c,e)","Above(d,e) | Below(d,e)","~Above(a,b) & ~Below(a,b)","Large(c) | SameShape(c,e) | SameSize(c,e)","Large(d) | (~SameShape(d,e) & SameSize(d,e))","Square(b)","LeftOf(c,b)"],"messageHeader":"Problem #3 Instructions","messageText":"Add pieces to the board to make the sentences below true.","sentencesLocked":true},
{"class":"world","pieces":[{"x":3,"y":3,"shape":"square","size":"large","names":["a"]},{"x":5,"y":3,"shape":"diamond","size":"small","names":["b"]}],"piecesLocked":true,"messageHeader":"Problem #4 Instructions","messageText":"Enter 5 sentences that are true in this world, and which are built entirely from the sentences Square(a) and Square(b) and the connectives. All 5 connectives must be used, and each sentence must have at least one connective."}
];
homework[3] = [
{"class":"translation",
"problemId":"03_01",
"english":["Either Amy likes cookies or both Brett and Craig are hungry.",
"Sarah and Michael are both sad.",
"Amy and Brett both have cats, but neither Sarah nor Michael do.",
"Either Craig has cats, or both Sarah and Amy like cookies.",
"Amy and Sarah are either both happy or both hungry.",
"Sarah is hungry, but she doesn't like cookies.",
"If Michael is sad, then so is Sarah.",
"If Michael is sad, then Amy and Brett are both happy.",
"Craig likes cookies unless Amy is sad.",
"If Brett likes cookies, then neither Michael nor Sarah is hungry.",
"Michael is happy if Sarah is.",
"Craig is not happy unless both Amy and Brett are happy.",
"Amy is happy if Brett has cats and Craig likes cookies.",
"Sarah is happy if and only if she has cats.",
"Michael is only happy if Sarah has cats.",
"Unless Amy has cats and Brett is happy, Craig is sad."],
"logical":["LikesCookies(amy) | (IsHungry(brett) & IsHungry(craig))",
"IsSad(sarah) & IsSad(michael)",null,
"HasCats(craig) | (LikesCookies(sarah) & LikesCookies(amy))",
"(IsHappy(amy) & IsHappy(sarah)) | (IsHungry(amy) & IsHungry(sarah))",null,
"IsSad(michael) -> IsSad(sarah)",null,
"~IsSad(amy) -> LikesCookies(craig)",null,null,null,
"(HasCats(brett) & LikesCookies(craig)) -> IsHappy(amy)",null,null,
"(HasCats(amy) & IsHappy(brett)) | IsSad(craig)"],
"message":"Please translate the following sentences into logical notation. On some problems, you will be able to check your answer before you submit. On other problems, you will not. <b>4 points each.</b>"},
{"class":"world","sentences":["Square(a)","a=k","a != f","LeftOf(a, e)","~SameShape(a, e)","SameRow(f, e)","SameSize(a, e) & ~SameSize(k, f)","Diamond(f)","Octagon(g)","RightOf(b, g)","SameShape(b, h)","Square(a) -> Square(b)"],"sentencesLocked":true,"tvFeedback":false,"messageHeader":"Problem #2 Instructions","messageText":"Arrange the pieces to make the following sentences true. Note that you will not get instant feedback on the sentences' truth values. 3 points per sentence."}
];
homework[4] = [
{"class":"parse","cstate":["X"],"hasTruthTable":false,"errbox":false,"sentences":["~(A&B)->(B->~A)"],"message":"<b>Problem 1.</b> Expand the following sentence into a parse tree."},
{"class":"parse","cstate":["X"],"hasTruthTable":false,"errbox":true,"sentences":["~A->(~B|(A&B))"],"message":"<b>Problem 2.</b> Expand the following sentence into a parse tree. <b>Any mistakes you make will count against your score</b>, so be careful!"},
{"class":"parse","cstate":["X"],"hasTruthTable":true,"errbox":true,"sentences":["A->(A|B)"],"message":"<b>Problem 3.</b> Expand the following sentence into a parse tree, and then complete the truth table. As before, any mistakes will be counted so be careful."},
{"class":"parse","cstate":["X"],"hasTruthTable":true,"errbox":true,"sentences":["(A&~B)<->~A"],"message":"<b>Problem 4.</b> Expand the following sentence into a parse tree, and complete the truth table."},
{"class":"parse","cstate":["X"],"hasTruthTable":true,"errbox":true,"sentences":["~(A&B)->(~C|A)"],"message":"<b>Problem 5.</b> Expand the following sentence into a parse tree, and complete the truth table."}
];
homework[5] = [
{"class":"parse","cstate":["X"],"hasTruthTable":true,"errbox":false,"sentences":["A->(B->(A&B))"],"enforceNodes":false,"undoButton":true,"message":"<b>Problem 1.</b> Complete the following truth table. <b>Note:</b> The usual error-checking mechanism is turned off for this problem. If you enter an incorrect truth value, there will be no warning. So be careful! But if you make a mistake, you can always click Undo. Click Reset Row to start a row over again."},
{"class":"parse","cstate":["X"],"hasTruthTable":true,"errbox":false,"sentences":["(A->B)->(~B->~A)"],"enforceNodes":false,"enforceTree":false,"undoButton":true,"message":"<b>Problem 2.</b> Expand the following sentence into a parse tree. Error checking is turned off as in the last problem, and in addition, you can &quot;live dangerously&quot; by assigning a truth value to a sentence without assigning one to those below it."},
{"class":"parse","cstate":["X"],"hasTruthTable":true,"errbox":false,entryType:"taut","sentences":["A->(A|B)"],"message":"<b>Problem 3.</b> Use the truth table to determine whether the given sentence is a tautology. Before submitting, make sure to select the appropriate answer from the drop-down menu (located under the truth table)."},
{"class":"parse","cstate":["X","X"],"hasTruthTable":true,"errbox":false,entryType:"impl","enforceNodes":false,"enforceTree":false,"undoButton":true,"sentences":["A->~B","~B->A"],"message":"<b>Problem 4.</b> Determine whether the one sentence implies the other. Error checking is turned off and you may &quot;live dangerously&quot; if you wish. Make sure to select the appropriate response from the drop-down."},
{"class":"parse","cstate":["X","X"],"hasTruthTable":true,"errbox":false,entryType:"equiv","enforceNodes":false,"enforceTree":false,"undoButton":true,"sentences":["A<->~B","~(A<->B)"],"message":"<b>Problem 5.</b> Determine whether the following two sentences are equivalent. Error checking is turned off and you may &quot;live dangerously&quot; if you wish. Make sure to select the appropriate response from the drop-down."},
];
homework[6] = [
{"class":"proof","goal":"C & (A | B)","ro":1,"premises":[{"s":"(A | B) & (C & D)"}],"body":[{"s":"A | B","r":"& Elim","c":[],ro:3},{"s":"C & D","r":"& Elim","c":[],ro:3},{"s":"C","r":"& Elim","c":[],ro:3},{"s":"D","r":"& Elim","c":[],ro:3},{"s":"C & (A | B)","r":"& Intro","c":[],ro:3}],"enabledRules":["& Intro","& Elim"],"message":"Instructions: Supply the missing citations."},
{"class":"proof","goal":"(A & C) & (B & D)","ro":1,"premises":[{"s":"A & B"},{"s":"C & D"}],"body":[{"s":"A","c":[],"ro":1},{"s":"B","c":[],"ro":1},{"s":"C","c":[],"ro":1},{"s":"D","c":[],"ro":1},{"s":"A & C","c":[],"ro":1},{"s":"B & D","c":[],"ro":1},{"s":"(A & C) & (B & D)","c":[],"ro":1}],"enabledRules":["& Intro","& Elim","| Intro"],"message":"Instructions: Supply the missing justifications."},
{"class":"proof","goal":"A & B","ro":1,"premises":[{"s":"A"},{"s":"B"}],"body":[{"s":"","c":[]}],"enabledRules":["& Intro","& Elim","| Intro"],"message":"Instructions: Complete the proof."},
{"class":"proof","goal":"(A | B) & (B | C)","ro":1,"premises":[{"s":"A & (B | C)"},{"s":"(A | B) & C"}],"body":[{"s":"","c":[]}],"enabledRules":["& Intro","& Elim","| Intro"],"message":"Instructions: Complete the proof."},
{"class":"proof","goal":"E","ro":1,"premises":[{"s":"A & (B & (C & (D & E)))"}],"body":[{"s":"","c":[]}],"enabledRules":["& Intro","& Elim","| Intro"],"message":"Instructions: Complete the proof."}
];
homework[7] = [
{"class":"proof","goal":"~E","ro":1,"premises":[{"s":"(A | B) -> (C & D)"},{"s":"~~A"},{"s":"D <-> ~E"}],"body":[{"s":"A","ro":1},{"s":"A | B","ro":1},{"s":"C & D","ro":1},{"s":"D","ro":1},{"s":"~E","ro":1}],"message":"Instructions: Supply the missing justifications, so that the proof is fully justified.","enabledRules":["& Intro","& Elim","~ Elim","| Intro","-> Elim","<-> Elim"]},
{"class":"proof","goal":"E","ro":1,"premises":[{"s":"A -> ~~(B -> (C -> (D -> E)))"},{"s":"A"},{"s":"B"},{"s":"~~C"},{"s":"D"}],"body":[{"s":"~~(B -> (C -> (D -> E)))","ro":1},{"s":"B -> (C -> (D -> E))","ro":1},{"s":"C -> (D -> E)","ro":1},{"s":"C","ro":1},{"s":"D -> E","ro":1},{"s":"E","ro":1}],"enabledRules":["& Intro","& Elim","~ Elim","| Intro","-> Elim","<-> Elim"],"message":"Instructions: Supply the missing justifications."},
{"class":"proof","goal":"G","ro":1,"premises":[{"s":"(A | B) -> (C & D)","l":1},{"s":"(A & C) -> ~~G","l":2},{"s":"A","l":3}],"body":[{"s":"A | B","ro":1,"l":4,"c":[]},{"s":"","l":5,"ro":6,"r":"-> Elim","c":[4,1]},{"s":"C","l":6,"c":[],"ro":1},{"s":"","l":7,"r":"& Intro","c":[3,6],"ro":6},{"s":"~~G","l":8,"c":[],"ro":1},{"s":"","l":9,"r":"~ Elim","c":[8],"ro":6}],"enabledRules":["& Intro","& Elim","~ Elim","| Intro","-> Elim","<-> Elim"],"message":"Instructions: Supply the missing rules and steps to make the proof correct."},
{"class":"proof","goal":"G & H","ro":1,"premises":[{"s":"A & B"},{"s":"A -> (C & D)"},{"s":"B -> (E & F)"},{"s":"(C & E) -> G"},{"s":"(D & F) -> H"}],"body":[{"s":""}],"enabledRules":["& Intro","& Elim","-> Elim"],"message":"Complete the proof. The only rules you need are the & rules and -> Elim."},
{"class":"proof","goal":"(A | C) & (B | D)","ro":1,"premises":[{"s":"A & B","l":1}],"body":[{"s":"","l":2,"c":[]}],"enabledRules":["& Intro","& Elim","~ Elim","| Intro","-> Elim","<-> Elim"],"message":"Instructions: Complete the proof."},
{"class":"proof","goal":"D","ro":1,"premises":[{"s":"A -> ((B | C) -> D)","l":1},{"s":"A -> ~~~~B","l":2},{"s":"A","l":3}],"body":[{"s":"","l":4,"c":[]}],"enabledRules":["& Intro","& Elim","~ Elim","| Intro","-> Elim","<-> Elim"],"message":"Instructions: Complete the proof."}
];
homework[8] = [
{"class":"proof","ro":1,"premises":[{"s":"~(A & B)","l":1,"ro":1}],"body":[{"p":{"premises":[{"s":"A","l":2,"ro":1}],"body":[{"p":{"premises":[{"s":"B","l":3,"ro":1}],"body":[{"s":"A & B","l":4,"c":[],"ro":1},{"s":"!","l":5,"c":[],"ro":1}]},"l":6},{"s":"~B","l":7,"c":[],"ro":1}]},"l":8},{"s":"A -> ~B","l":9,"c":[],"ro":1}],"goal":"A -> ~B","hasToolbar":true,"hasDialog":true,"enabledRules":["~ Elim","& Elim","-> Elim","<-> Elim","= Elim","~ Intro","& Intro","| Intro","-> Intro","<-> Intro","= Intro","Reit","Contradiction"],"message":"Complete the proof by supplying justifications."},
{"class":"proof","ro":1,"premises":[{"s":"(A & B) -> C","l":1,"ro":1},{"s":"B -> ~C","l":2,"ro":1},{"s":"A","l":3,"ro":1}],"body":[{"p":{"premises":[{"s":"B","l":4,"ro":1}],"body":[{"s":"A & B","l":5,"c":[],"ro":1},{"s":"C","l":6,"c":[],"ro":1},{"s":"","l":7,"c":[4,2],"ro":4},{"s":"","l":8,"r":"Contradiction","c":[7,6],"ro":6}]},"l":9},{"s":"~B","l":10,"c":[],"ro":1}],"goal":"~B","hasToolbar":true,"hasDialog":true,"enabledRules":["~ Elim","& Elim","-> Elim","<-> Elim","~ Intro","& Intro","| Intro","-> Intro","Reit","Contradiction"],"message":"Instructions: Supply the missing steps and justifications. When you are done, the proof should be fully justified."},
{"class":"proof","goal":"~A","ro":1,"premises":[{"s":"A -> B","l":1},{"s":"~B","l":2}],"body":[{"s":"","l":3,"c":[]}],"disabledRules":["<-> Intro","| Elim","= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Hint: use the ~ Intro rule."},
{"class":"proof","ro":1,"premises":[{"s":"A -> B","l":1,"ro":1},{"s":"B -> C","l":2,"ro":1}],"body":[{"s":"","l":3,"c":[]}],"goal":"A -> (B & C)","hasToolbar":true,"hasDialog":true,"enabledRules":["~ Elim","& Elim","-> Elim","<-> Elim","~ Intro","& Intro","| Intro","-> Intro","<-> Intro","Reit","Contradiction"],"message":"Complete the proof."},
{"class":"proof","ro":1,"premises":[{"s":"B -> ~A","l":1,"ro":1}],"body":[{"s":"","l":2,"c":[]}],"goal":"A -> ~B","hasToolbar":true,"hasDialog":true,"enabledRules":["~ Elim","& Elim","-> Elim","<-> Elim","= Elim","~ Intro","& Intro","| Intro","-> Intro","<-> Intro","= Intro","Reit","Contradiction"],"message":"Complete the proof. Hint: use nested subproofs. You will need to use both of the proof methods described in the lesson, one in the outer subproof and one in the inner subproof."},
{"class":"proof","ro":1,"premises":[{"s":"","l":1}],"body":[{"s":"","l":2,"c":[]}],"goal":"A -> (B -> A)","hasToolbar":true,"hasDialog":true,"enabledRules":["~ Elim","& Elim","-> Elim","<-> Elim","~ Intro","& Intro","| Intro","-> Intro","<-> Intro","Reit","Contradiction"],"message":"Complete the proof. Hint: use nested subproofs."}
];
homework[9] = [
{"class":"proof","goal":"(A & B) -> (C & D)","ro":1,"premises":[{"s":"A -> C","l":1},{"s":"B -> D","l":2}],"body":[{"s":"","l":3,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture."},
{"class":"proof","goal":"(A & ~~B) -> (C | D)","ro":1,"premises":[{"s":"B -> C","l":1}],"body":[{"s":"","l":2,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture."},
{"class":"proof","goal":"~(A & ~B)","ro":1,"premises":[{"s":"B","l":1}],"body":[{"s":"","l":2,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture."},
{"class":"proof","goal":"~(A & B)","ro":1,"premises":[{"s":"A","l":1},{"s":"B -> C","l":2},{"s":"C -> ~A","l":3}],"body":[{"s":"","l":4,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture."},
{"class":"proof","goal":"C","ro":1,"premises":[{"s":"A -> (C & D)","l":1},{"s":"(B & E) -> C","l":2},{"s":"E","l":3},{"s":"A | B","l":4}],"body":[{"s":"","l":5,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture. The proof will use | Elim."},
{"class":"proof","goal":"B | A","ro":1,"premises":[{"s":"A | B","l":1}],"body":[{"s":"","l":2,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture. Hint: There are two disjunctions in the proof: the premise, and the goal. How do you apply | Elim in this case?"}
];
homework[10] = [
{"class":"proof","goal":"~~A -> (B | C)","ro":1,"premises":[{"s":"A -> B","l":1}],"body":[{"s":"","l":2,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture."},
{"class":"proof","goal":"~(A -> ~B)","ro":1,"premises":[{"s":"A & B","l":1}],"body":[{"s":"","l":2,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture."},
{"class":"proof","goal":"B","ro":1,"premises":[{"s":"(A & B) | (B & C)","l":1}],"body":[{"s":"","l":2,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture."},
{"class":"proof","goal":"(A | B) -> [(A & C) | (B & C)]","ro":1,"premises":[{"s":"C","l":1}],"body":[{"s":"","l":2,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture. The proof will require nested subproofs. Also, the | Elim and | Intro rules will be used in conjunction, as described in the lecture."},
{"class":"proof","goal":"(A -> B) -> ~(A -> ~B)","ro":1,"premises":[{"s":"A","l":1}],"body":[{"s":"","l":2,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture. There will be a nested subproof."},
{"class":"proof","goal":"~C","ro":1,"premises":[{"s":"A | B","l":1},{"s":"~(A & C)","l":2},{"s":"~(B & C)","l":3},{"s":"C","l":4}],"body":[{"s":"","l":5,"c":[]}],"disabledRules":["= Intro","= Elim","A Intro","A Elim","E Intro","E Elim","Taut Con"],"hasToolbar":true,"message":"Instructions: Complete the proof. Use the method described in the lecture. There will be nested subproofs."}
];
homework[11] = [
{"class":"proof","goal":"LeftOf(c, d)","ro":1,"premises":[{"s":"LeftOf(a, b)","l":1},{"s":"a = c","l":2},{"s":"b = d","l":3}],"body":[{"s":"","l":4,"c":[]}],"disabledRules":["A Intro","A Elim","E Intro","E Elim"],"hasToolbar":true,"message":"Instructions: Complete the proof."},
{"class":"proof","goal":"Large(c)","ro":1,"premises":[{"s":"Large(a)","l":1},{"s":"a = b","l":2},{"s":"b = c","l":3}],"body":[{"s":"","l":4,"c":[]}],"disabledRules":["A Intro","A Elim","E Intro","E Elim"],"hasToolbar":true,"message":"Instructions: Complete the proof."},
{"class":"proof","goal":"Large(a) & (Small(b) -> LeftOf(c, b))","ro":1,"premises":[{"s":"Large(a) & (Small(b) -> LeftOf(a, b))","l":1},{"s":"a = c","l":2}],"body":[{"s":"","l":3,"c":[]}],"disabledRules":["A Intro","A Elim","E Intro","E Elim"],"hasToolbar":true,"message":"Instructions: Complete the proof."},
{"class":"proof","goal":"B -> ~A","ro":1,"premises":[{"s":"A -> (B -> C)","l":1},{"s":"C -> (B -> ~A)","l":2}],"body":[{"s":"","l":3,"c":[]}],"disabledRules":["A Intro","A Elim","E Intro","E Elim"],"hasToolbar":true,"message":"Instructions: Complete the proof. The proof is extremely simple if you use Taut Con."},
{"class":"proof","goal":"~G(a) -> ~F(b)","ro":1,"premises":[{"s":"F(a) -> G(b)","l":1},{"s":"a = b","l":2}],"body":[{"s":"","l":3,"c":[]}],"disabledRules":["A Intro","A Elim","E Intro","E Elim"],"hasToolbar":true,"message":"Instructions: Complete the proof."}
];
homework[12] = [
{"class":"world","sentencesLocked":true,"sentences":["Ex Square(x)","Ax (Square(x) -> Large(x))","Ex Diamond(x)","Ex Octagon(x)","Ax Ay [(Diamond(x) & Octagon(y)) -> SameSize(x,y)]","Ex Ey LeftOf(x,y)","Ex Ey Above(x,y)","~Ex (Large(x) & Diamond(x))","Ex Diamond(x) & Ex Large(x)","Ex Ey (Square(x) & Square(y) & x != y)"],"messageHeader":"Problem #1 Instructions","messageText":"Arrange pieces on the board so that all of the sentences below are true."},
{"class":"world","sentencesLocked":true,"sentences":["Diamond(a) & Small(a)","Ax (Octagon(x) -> LeftOf(x,a))","Ax [(Diamond(x) & Large(x)) -> LeftOf(x,a)]","Ax (Square(x) -> RightOf(x,a))","Ax Ay [(Octagon(x) & Octagon(y)) -> x = y]","Ex Ey [Square(x) & Square(y) & x != y]","Ex (Square(x) & Small(x))","Ex (Square(x) & Large(x))","Ex Ey (Diamond(x) & Octagon(y) & Above(y, x))","Ex Ey (Square(x) & Square(y) & Below(x,y))"],"messageHeader":"Problem #2 Instructions","messageText":"Arrange pieces on the board so that all of the sentences below are true."},
{"class":"parse","collapsed":true,"sentences":["Ax (F(x) & ~G(x))"],"hasTruthTable":false,"errbox":true,"message":"Expand the following sentence into a parse tree. Be careful, as your mistakes will count against you."},
{"class":"parse","collapsed":true,"sentences":["Ax F(x) & Ex ~G(x)"],"hasTruthTable":false,"errbox":true,"message":"Expand the following sentence into a parse tree. Be careful, as your mistakes will count against you."},
{"class":"parse","collapsed":true,"sentences":["Ax [F(x) -> Ey (F(y) & G(x,y))]"],"hasTruthTable":false,"errbox":true,"message":"Expand the following sentence into a parse tree. Be careful, as your mistakes will count against you."}
];
homework[13] = [
{"class":"translation",
"problemId":"13_01",
"english":["All diamonds are large.",
"Some diamonds are large.",
"Some small diamonds are green.",
"All diamonds are small, and some octagons are also small.",
"All squares and diamonds are large.",
"All squares are large and blue.",
"All squares are large or small.",
"There is a diamond above some square.",
"Not all squares are blue.",
"No squares are green.",
"Some octagons are not large.",
"Some large octagons are not red." ],
"message":"Please translate the following sentences into logical notation. Use the predicates Large, Small, Square, Diamond, Octagon, Blue, Green, Red, Above, LeftOf</b>"}
];
homework[14] = [
{"class":"proof","goal":"Ex F(x) -> Ex G(x)","ro":1,"premises":[{"s":"Ax [F(x) -> G(x)]","l":1}],"body":[{"p":{"premises":[{"s":"Ex F(x)","l":2,"ro":1}],"body":[{"s":"F(a)","l":3,"c":[],"ro":1},{"s":"F(a) -> G(a)","l":4,"c":[],"ro":1},{"s":"G(a)","l":5,"c":[],"ro":1},{"s":"Ex G(x)","l":6,"c":[],"ro":1}]},"l":7},{"s":"Ex F(x) -> Ex G(x)","l":8,"c":[],"ro":1}],"message":"Instructions: Supply the missing justifications.","hasToolbar":true},
{"class":"proof","goal":"Ax Ey F(x, y)","ro":1,"premises":[{"s":"Ey Ax F(x,y)","l":1}],"body":[{"p":{"ro":1,"premises":[{"s":"a","l":2}],"body":[{"s":"","l":3,"r":"E Elim","c":[1],"ro":6},{"s":"","l":4,"r":"A Elim","c":[3],"ro":6},{"s":"","l":5,"r":"E Intro","c":[4],"ro":6}]},"l":6},{"s":"Ax Ey F(x, y)","l":7,"r":"A Intro","c":[6],"ro":7}],"message":"Instructions: Supply the missing steps.","hasToolbar":true},
{"class":"proof","goal":"~Ex~F(x)","ro":1,"premises":[{"s":"Ax F(x)","l":1}],"body":[{"p":{"premises":[{"s":"Ex ~F(x)","l":2,"ro":1}],"body":[{"s":"~F(a)","l":3,"c":[],"ro":1},{"s":"","l":4,"r":"A Elim","c":[1],"ro":6},{"s":"!","l":5,"c":[],"ro":1}]},"l":6,"ro":1},{"s":"~Ex~F(x)","l":7,"c":[],"ro":1}],"message":"Instructions: Supply the missing steps and justifications.","hasToolbar":true},
{"class":"proof","goal":"Ax F(x) -> Ex F(x)","ro":1,"premises":[{"s":"","l":1}],"body":[{"s":"","l":2,"c":[]}],"message":"Instructions: Complete the proof. Hint: You will need to us -> Intro.","hasToolbar":true},
{"class":"proof","goal":"Ex Ey Ez H(x, y, z)","ro":1,"premises":[{"s":"Ax Ay Az H(x, y, z)","l":1}],"body":[{"s":"","l":2,"c":[]}],"message":"Instructions: Complete the proof.","hasToolbar":true}
];
homework[15] = [
{"class":"proof","goal":"Ax [F(x) -> (F(x) | G(x))]","ro":1,"premises":[{"s":"","l":1}],"body":[{"s":"","l":2,"c":[]}],"message":"Instructions: Complete the proof.","hasToolbar":true},
{"class":"proof","goal":"Ex [F(x) | G(x)]","ro":1,"premises":[{"s":"Ex F(x)","l":1}],"body":[{"s":"","l":2,"c":[]}],"message":"Instructions: Complete the proof.","hasToolbar":true},
{"class":"proof","goal":"Ex Square(x)","ro":1,"premises":[{"s":"Ax [Ey Above(x, y) -> Square(x)]","l":1},{"s":"Ex Ey Above(x, y)","l":2}],"body":[{"s":"","l":3,"c":[]}],"message":"Instructions: Complete the proof.","hasToolbar":true},
{"class":"proof","ro":1,"premises":[{"s":"Ax [F(x) & G(x)]","l":1}],"body":[{"s":"","l":2,"c":[]}],"hasToolbar":true,"hasDialog":true,"enabledRules":["~ Elim","& Elim","| Elim","-> Elim","<-> Elim","A Elim","E Elim","= Elim","~ Intro","& Intro","| Intro","-> Intro","<-> Intro","A Intro","E Intro","= Intro","Reit","Contradiction","Taut Con"],"goal":"Ax F(x) & Ax G(x)","message":"Complete the proof. Hint: prove the conjuncts separately."},
{"class":"proof","ro":1,"premises":[{"s":"Ey Ax LessThan(x,y)","l":1}],"body":[{"s":"","l":2,"c":[]}],"hasToolbar":true,"hasDialog":true,"enabledRules":["~ Elim","& Elim","| Elim","-> Elim","<-> Elim","A Elim","E Elim","= Elim","~ Intro","& Intro","| Intro","-> Intro","<-> Intro","A Intro","E Intro","= Intro","Reit","Contradiction","Taut Con"],"goal":"Ax Ey LessThan(x,y)","message":"Complete the proof."}
];
homework[16] = [
{"class":"essay","message":'At the end of the <a href="lecture16.html#soundness" target="_blank">section on soundness</a>, we noted that there are three ways of extending a proof. For each way, we need to show that if the original proof satisfies the boxed statement, then so does the extended proof. The lesson says that this holds trivially in case 3, "add a new subproof." Why is this?'},
{"class":"essay","message":'In proving <a href="lecture16.html#soundness" target="_blank">soundness</a>, we made use of the fact that our rules of inference are valid. This means that if all the premises of a rule are true, then so is its conclusion. But some rules can have subproofs as premises as well as, or instead of, sentences. What does it mean for such a rule to be valid?'},
{"class":"essay","message":'We only proved <a href="lecture16.html#completeness" target="_blank">completeness</a> for the reduced language, without the connectives -> and <->. Explain how to extend the proof to the full language.'},
{"class":"essay","message":'We provided two different version of the <a href="lecture16.html#central" target="_blank">Central Lemma</a>: a simple version, and a more complicated version. It was stated that the complicated version was needed for the proof by induction of the Central Lemma. How would that proof have broken down if we had tried to use the simpler version instead?'},
{"class":"essay","message":'It was <a href="lecture16.html#tautology" target="_blank">stated</a> that the fact that all tautologies are provable is a special case of completeness. Why is this?'}
]
var titles = [ 'Introducing the Language',
'Boolean Connectives',
'Translation',
'Parsing & Truth Tables',
'Logical Implication',
'Introducing Proofs',
'Proofs, Continued',
'Subproofs',
'More Rules',
'Proof Technique',
'Identity',
'Quantifiers',
'Translation & Implication',
'Quantifiers & Proofs',
'Wrapping Up',
'Supplement - Completeness'
];
Homework = {
getProblem: function(unit, prob)
{
return homework[unit][prob-1];
},
maxPoints: function(unit, prob, total)
{
if (total === undefined)
total = 100;
let allocations = [];
const num = homework[unit].length;
let t=0;
for (let i=0; i<num; i++) {
const d = Math.round((i+1)*total/num - t);
allocations[i] = d;
t += d;
}
return allocations[prob-1];
},
numberOfWeeks: function (userInfo)
{
if (!userInfo || userInfo.role === 'graduate')
return homework.length - 1;
else
return homework.length - 2;
},
numberOfProblems: function(unit)
{
return homework[unit].length;
},
dueDate: function(unit)
{
if (unit === 16)
unit = 15
const semester = getCurrentSemester()
const nw = semester.numberOfWeeks()
let week, day
if (nw >= 16) {
week = unit+1
day = 2
}
else {
week = 1 + Math.floor(unit/2)
day = (unit % 2 ? 6 : 2)
}
return semester.week2date(week).plus(day)
},
lessonTitle: function(unit)
{
let t = titles[unit-1];
if (t === undefined) t = 'Lesson '+ unit;
return t;
},
weekAvailable: function(unit)
{
return homework[unit] && homework[unit].disabled !== true;
}
};
}());

var KnowledgeBase, FOLEquivalent;
var subcount = 0;
var prooflog;
(function(){
"use strict";
function pplit(a)
{
return (a.sign == -1) ? ('~' + ppatom(a)) : ppatom(a);
}
function ppatom(a)
{
var result = '';
switch(a.op) {
case 'PRED':
case 'FUNC':
result += a.args[0].atom;
if (a.args.length > 1) {
result += '(';
for (var i=1; i<a.args.length; i++) {
result += ppatom(a.args[i]);
if (i+1 < a.args.length) {
result += ',';
}
}
result += ')';
}
return result;
case 'EQUAL':
return ppatom(a.args[0]) + '=' + ppatom(a.args[1]);
case 'NAME':
result = a.atom;
if (a.variable)
result += a.variable;
return result;
default:
return '';
}
}
var newSkolem;
(function(){
var sknumber = 0;
newSkolem = function() { return '@' + (sknumber++); }
}());
function Prenex(expr)
{
var prefix, matrix;
var p = _prenex(expr, 1);
prefix = p.prefix;
matrix = p.matrix;
this.getPrefix = function() { return prefix; }
this.getMatrix = function() { return matrix; }
this.stringify = function()
{
var result = '';
for (var i=0; i<prefix.length; i++) {
var q = prefix[i];
if (q.type == 'ALL')
result += '(A ';
else
result += '(E ';
result += q.variable.atom + q.variable.variable + ') ';
}
result += '\n';
return result + matrix.stringify();
}
this.skolemized = function()
{
var sub = new Substitution;
var uvar = [];
for (var i=0; i<prefix.length; i++) {
var quant = prefix[i];
if (quant.type == 'EXISTS') {
if (uvar.length > 0) {
var skfun = new Expression('FUNCTOR', newSkolem());
var skterm = new Expression('FUNC', skfun, uvar);
sub.addUnsafe(quant.variable, skterm);
}
else {
var skcon = new Expression('NAME', newSkolem());
sub.addUnsafe(quant.variable, skcon);
}
}
else {
uvar.push(quant.variable);
}
}
var m = matrix.sub(sub);
return m.rewrite(uvar);
}
function _prenex(expr, sign)
{
var e1, e2, pre, p, op;
switch (expr.op) {
case 'PRED':
case 'EQUAL':
e1 = new Expression(expr.op, expr.args);
e1.sign = sign;
return {prefix: [], matrix: CNF.newAtom(e1)};
case 'NOT':
return _prenex(expr.args[0], -sign);
case 'AND':
return _pfbin(expr, sign, sign, sign);
case 'OR':
return _pfbin(expr, sign, sign, -sign);
case 'IF':
return _pfbin(expr, -sign, sign, -sign);
case 'IFF':
e1 = _pfbin(expr, -sign, sign, -sign);
e2 = _pfbin(expr, sign, -sign, -sign);
e2 = _rewrite(e2);
return {prefix: _pfmerge(e1.prefix, e2.prefix),
matrix: e1.matrix.merge(e2.matrix, sign)
};
case 'ALL':
case 'EXISTS':
if (sign == -1)
op = (expr.op == 'ALL' ? 'EXISTS' : 'ALL');
else
op = expr.op;
pre = [{type: op, variable: expr.args[0]}];
p = _prenex(expr.args[1], sign);
pre = pre.concat(p.prefix);
return {prefix: pre, matrix: p.matrix};
default:
return null;
}
}
function _pfbin(expr, s1, s2, s3)
{
var p1 = _prenex(expr.args[0], s1);
var p2 = _prenex(expr.args[1], s2);
return {prefix: _pfmerge(p1.prefix, p2.prefix),
matrix: p1.matrix.merge(p2.matrix, s3)
};
}
function _pfmerge(pre1, pre2)
{
var i=0, j=0;
var combined = [];
for (;;) {
if (i < pre1.length && (pre1[i].type == 'EXISTS' || j == pre2.length)) {
combined.push(pre1[i++]);
}
else if (j < pre2.length) {
combined.push(pre2[j++])
}
else
break;
}
return combined;
}
function _rewrite(prenex)
{
var i, sub, v, v2, vm, pre=[], mat;
sub = new Substitution;
for (i=0; i<prenex.prefix.length; i++) {
v = prenex.prefix[i].variable;
vm = new Vmap;
vm.add(v.atom);
v2 = new Expression('NAME', v.atom, vm);
sub.add1(v, v2);
v2 = sub.sublit(v);
pre.push({variable: v2, type: prenex.prefix[i].type});
}
mat = prenex.matrix.sub(sub);
return {prefix: pre, matrix: mat};
}
}
function CNF(cl)
{
var clauses = cl || [];
this.getClauses = function()
{
return clauses.slice(0);
}
this._getClausesUnsafe = function()
{
return clauses;
}
this.stringify = function()
{
var result = "";
for (var i=0; i<clauses.length; i++) {
result += clauses[i].stringify();
if (i+1 < clauses.length)
result += ' & ';
}
return result;
}
this.sub = function(sub)
{
var result = [];
for (var i=0; i<clauses.length; i++) {
result.push(clauses[i].sub(sub));
}
return new CNF(result);
}
this.rewrite = function(vlist)
{
var i, j, sub, v, v2, vm, clause, result=[];
for (i=0; i<clauses.length; i++) {
sub = new Substitution;
for (j=0; j<vlist.length; j++) {
v = vlist[j];
vm = new Vmap;
vm.add(v.atom);
v2 = new Expression('NAME', v.atom, vm);
sub.addUnsafe(v, v2);
}
clause = clauses[i];
result.push(clause.sub(sub));
}
return new CNF(result);
}
this.weed = function()
{
for (var i=0; i<clauses.length; i++) {
if (clauses[i].weed()) {
clauses.splice(i--,1);
}
}
return this;
}
this.isContradictory = function()
{
for (var i=0; i<clauses.length; i++) {
if (clauses[i].isContradictory()) {
return true;
}
}
return false;
}
this.merge = function(cnf, sign)
{
if (sign > 0) {
var c = clauses.concat(cnf._getClausesUnsafe());
return new CNF(c);
}
var i,j, result=[];
var c2 = cnf._getClausesUnsafe();
for (i=0; i<clauses.length; i++) {
for (j=0; j<c2.length; j++) {
var d = clauses[i].disjunction(c2[j]);
result.push(d);
}
}
return new CNF(result);
}
}
CNF.newAtom = function(e)
{
return new CNF([new Clause([e])]);
}
function Clause(ll)
{
var literals = ll || [];
this.stringify = function()
{
var result = "[";
for (var j=0; j<literals.length; j++) {
result += pplit(literals[j]);
if (j+1 < literals.length) {
result += ' | ';
}
}
return result + ']';
}
this.string = this.stringify();
this.sub = function(sub)
{
var result = [];
for (var i=0; i<literals.length; i++) {
result.push(sub.sublit(literals[i]));
}
return new Clause(result);
}
this.weed = function()
{
for (var i=0; i<literals.length; i++) {
for (var j=i+1; j<literals.length; j++) {
if (literals[i].strictlyEquals(literals[j])) {
if (literals[i].sign !== literals[j].sign) {
return true;
}
else {
literals.splice(j--, 1);
}
}
}
}
this.string = this.stringify();
return false;
}
this.isContradictory = function()
{
return literals.length === 0;
}
this._get = function()
{
return literals;
}
this.disjunction = function(clause)
{
return new Clause(literals.concat(clause._get()));
}
this.unify = function(sub)
{
for (var i=0; i<literals.length; i++) {
literals[i] = sub.sublit(literals[i]);
}
this.string = this.stringify();
}
this.factorsOf = function()
{
var result = [];
var i,j,k, sub, C0, C;
for (i=0; i<literals.length-1; i++) {
for (j=i+1; j<literals.length; j++) {
sub = mgu(literals[i], literals[j]);
if (sub) {
C0 = literals.slice(0);
C0.splice(j,1);
C = new Clause(C0);
C.unify(sub);
C.rewrite();
result.push(C);
if (C.isContradictory())
return result;
}
}
}
return result;
}
this.resolveOf = function(clause2)
{
var result = [];
var i,j, sub, L, M, resolv;
var lits1 = literals;
var lits2 = clause2._get();
for (i=0; i<lits1.length; i++) {
L = lits1[i];
for (j=0; j<lits2.length; j++) {
M = lits2[j];
if (L.sign !== M.sign) {
M.sign = L.sign;
sub = mgu(L, M);
M.sign = -M.sign;
if (sub) {
var r = lits1.concat(lits2);
r.splice(lits1.length+j, 1);
r.splice(i, 1);
resolv = new Clause(r);
resolv.unify(sub);
resolv.rewrite();
result.push(resolv);
if (r.length === 0)
return result;
}
}
}
}
return result;
}
this.reflexOf = function()
{
var i, s, t, sub, C0, C, result = [];
for (i=0; i<literals.length; i++) {
if (literals[i].op == 'EQUAL' && literals[i].sign < 0) {
s = literals[i].args[0];
t = literals[i].args[1];
sub = mgu(s, t);
if (sub) {
C0 = literals.slice(0);
C0.splice(i, 1);
C = new Clause(C0)
C.unify(sub);
C.rewrite();
result.push(C);
if (C0.length === 0)
return result;
}
}
}
return result;
}
this.paramodOf = function(clause2)
{
var i, j, k, s, t, u, ns, nt, L, C, L2, C2, sub, subs;
var lits1 = literals;
var lits2 = clause2._get();
var result = [];
for (i=0; i<lits1.length; i++) {
if (lits1[i].op != 'EQUAL' || lits1[i].sign < 0)
continue;
s = lits1[i].args[0];
t = lits1[i].args[1];
ns = symbolcount(s);
nt = symbolcount(t);
for (j=0; j<lits2.length; j++) {
L = lits2[j];
subs = [];
if (ns >= nt)
subs = getSubstitutions(s, t, L);
if (nt >= ns)
subs = subs.concat(getSubstitutions(t, s, L));
if (subs.length === 0)
continue;
C = lits1.concat(lits2);
C.splice(lits1.length + j, 1);
C.splice(i,1);
for (k=0; k<subs.length; k++) {
L2 = C.slice(0);
L2.push(subs[k].result);
C2 = new Clause(L2);
C2.unify(subs[k].mgu);
C2.rewrite();
result.push(C2);
}
}
}
return result;
}
this.rewrite = function()
{
var sub = new Substitution;
for (var i=0; i<literals.length; i++) {
literals[i] = sub.rewrite(literals[i]);
}
}
this.subsumes = function(clause2)
{
var lits1 = literals;
var lits2 = clause2._get();
subcount++;
if (lits1.length > lits2.length)
return false;
var sub = new Substitution;
return csub(0);
function csub(idx)
{
if (idx >= lits1.length)
return true;
var lit = lits1[idx];
for (var i=0; i<lits2.length; i++) {
var mark = sub.save();
if (litSubsumes(lit, lits2[i], sub)) {
if (csub(idx+1))
return true;
}
sub.restore(mark);
}
return false;
}
}
function litSubsumes(e1, e2, sub)
{
var i, t, e;
if (e1.op == e2.op) {
switch (e1.op) {
case 'FUNC':
case 'PRED':
case 'EQUAL':
if (e1.args.length != e2.args.length)
return false;
if (e1.sign != e2.sign)
return false;
for (i=0; i<e1.args.length; i++) {
if (!litSubsumes(e1.args[i], e2.args[i], sub)) {
return false;
}
}
return true;
case 'FUNCTOR':
return e1.atom === e2.atom;
case 'NAME':
if (!e1.variable)
return (e1.equals(e2));
break;
}
}
else {
if (!e1.variable || e2.op !== 'FUNC')
return false;
}
if (sub.contains(e1)) {
e1 = sub.sublit(e1);
return e1.strictlyEquals(e2);
}
if (e1.strictlyEquals(e2)) {
return true;
}
else {
return sub.add1(e1, e2);
}
}
function getSubstitutions(s, t, E)
{
var subs = [];
var result = [];
var sub, u, Et;
getSubterms(E, subs);
for (var i=0; i<subs.length; i++) {
u = subs[i].t;
sub = mgu(s, u);
if (sub) {
Et = sub1term(E, subs[i].pos, t);
result.push({mgu:sub, result:Et});
}
}
return result;
}
function getSubterms(E, result, iref)
{
if (iref === undefined)
iref = {i: 0};
if (E.variable)
return;
switch(E.op){
case 'NAME':
result.push({t:E, pos:iref.i++});
return;
case 'FUNC':
result.push({t:E, pos:iref.i++});
break;
case 'FUNCTOR':
return;
default:
break;
}
for (var i=0; i<E.args.length; i++) {
getSubterms(E.args[i], result, iref);
}
}
function sub1term(E, pos, t, iref)
{
if (iref === undefined)
iref = {i: 0};
if (E.variable)
return E;
switch(E.op){
case 'NAME':
return (pos == iref.i++) ? t : E;
case 'FUNC':
if (pos == iref.i++)
return t;
break;
case 'FUNCTOR':
return E;
default:
break;
}
var newargs = [];
for (var i=0; i<E.args.length; i++) {
newargs.push(sub1term(E.args[i], pos, t, iref));
}
var result = new Expression(E.op, newargs);
result.sign = E.sign;
return result;
}
function symbolcount(term)
{
switch(term.op) {
case 'NAME':
case 'FUNCTOR':
return 1;
default:
var r = 0;
for (var i=0; i<term.args.length; i++) {
r += symbolcount(term.args[i]);
}
return r;
}
}
}
class Substitution {
constructor() {
this._sub = [];
}
add1(v, t)
{
if (!v.variable)
return false;
for (var i=i; i<this._sub.length; i++) {
if (this._sub[i].v.strictlyEquals(v))
return false;
}
this._sub.push({v:v, t:t});
return true;
}
rewrite(lit)
{
var i, newargs, result, vm, v2;
switch (lit.op) {
case 'NAME':
if (!lit.variable)
return lit;
else {
for (i=0; i<this._sub.length; i++) {
if (this._sub[i].v.strictlyEquals(lit))
return this._sub[i].t;
}
vm = new Vmap;
vm.add(lit.atom);
v2 = new Expression('NAME', lit.atom, vm);
this._sub.push({v:lit, t:v2});
return v2;
}
case 'FUNCTOR':
return lit;
default:
newargs = [];
for (i=0; i<lit.args.length; i++) {
newargs.push(this.rewrite(lit.args[i]));
}
result = new Expression(lit.op, newargs);
result.sign = lit.sign;
return result;
}
}
tryAdd(e1, e2)
{
if (!e1.variable)
return false;
if (e1.variable == e2.variable)
return true;
if (!this.contains(e1) && !e2.strictlyContains(e1)) {
this._add(e1, e2);
return true;
}
return false;
}
_add(e1, e2)
{
var i;
for (i=0; i<this._sub.length; i++) {
if (this._sub[i].v.strictlyEquals(e1))
return;
}
var newsub = new Substitution;
newsub.addUnsafe(e1, e2);
for (i=0; i<this._sub.length; i++) {
this._sub[i].t = newsub.sublit(this._sub[i].t);
}
this.addUnsafe(e1, e2);
}
addUnsafe(v,t)
{
this._sub.push({v:v, t:t});
}
save()
{
return this._sub.length;
}
restore(len)
{
this._sub.splice(len, this._sub.length - len);
}
contains(e)
{
for (var i=0; i<this._sub.length; i++) {
var v = this._sub[i].v;
if (v.variable === e.variable)
return true;
}
return false;
}
sublit(lit)
{
var i, newargs, result;
switch (lit.op) {
case 'NAME':
if (lit.variable == 0)
return lit;
for (i=0; i<this._sub.length; i++) {
if (lit.variable == this._sub[i].v.variable) {
return this._sub[i].t;
}
}
return lit;
case 'FUNCTOR':
return lit;
default:
newargs = [];
for (i=0; i<lit.args.length; i++) {
newargs.push(this.sublit(lit.args[i]));
}
result = new Expression(lit.op, newargs);
result.sign = lit.sign;
return result;
}
}
}
function standardize(expr)
{
return (new Prenex(expr)).skolemized().weed();
}
function mgu(e1, e2)
{
var sub = new Substitution;
return findmgu(e1, e2, sub) ? sub : null;
function findmgu(e1, e2, sub)
{
var i;
if (e1.op == e2.op) {
switch (e1.op) {
case 'FUNC':
case 'PRED':
case 'EQUAL':
if (e1.args.length != e2.args.length) {
return false;
}
if (e1.sign != e2.sign) {
return false;
}
for (i=0; i<e1.args.length; i++) {
if (!findmgu(e1.args[i], e2.args[i], sub))
return false;
}
return true;
case 'FUNCTOR':
return e1.atom === e2.atom;
case 'NAME':
if (!e1.variable && !e2.variable)
return e1.atom === e2.atom;
if (e1.variable === e2.variable)
return true;
break;
}
}
else {
if (!e1.variable && !e2.variable)
return false;
if (e1.op != 'FUNC' && e2.op != 'FUNC')
return false;
}
e1 = sub.sublit(e1);
e2 = sub.sublit(e2);
if (e1.op == 'FUNC' && e2.op == 'FUNC') {
return findmgu(e1, e2, sub);
}
return sub.tryAdd(e1, e2) || sub.tryAdd(e2, e1);
}
}
class FeatureParser {
constructor(clauses)
{
this.preds = [];
this.funcs = [];
this.init(clauses);
}
init(clauses)
{
var self=this;
for (var i=0; i<clauses.length; i++) {
var lits = clauses[i]._get();
for (var j=0; j<lits.length; j++) {
var from;
if (lits[j].op === 'PRED') {
var n = lits[j].args[0].atom;
if (this.preds.indexOf(n) < 0)
this.preds.push(n);
from = 1;
}
else {
from = 0;
}
for (var k=from; k<lits[j].args.length; k++) {
_add(lits[j].args[k]);
}
}
}
function _add(term)
{
var i;
switch(term.op) {
case 'FUNC':
for (i=0; i<term.args.length; i++) {
_add(term.args[i]);
}
break;
case 'NAME':
if (term.variable)
return;
case 'FUNCTOR':
var a = term.atom;
if (self.funcs.indexOf(a) < 0)
self.funcs.push(a);
}
}
}
features(clause)
{
var i,j, self=this;;
var lits = clause._get();
var pos = [[0], [0], [], []];
var neg = [[0], [0], [], []];
_fill(pos);
_fill(neg);
for (var i=0; i<lits.length; i++) {
var arr = (lits[i].sign > 0) ? pos : neg;
arr[0][0]++;
if (lits[i].op == 'EQUAL') {
arr[1][0]++;
}
else {
j = this.preds.indexOf(lits[i].args[0].atom);
if (j >= 0) {
arr[2][j]++;
}
}
for (j=0; j<lits[i].args.length; j++) {
var t = lits[i].args[j];
if (t.op === 'FUNCTOR')
continue;
_add(t, arr);
}
}
var result = [];
for (i=0; i<pos.length; i++) {
result = result.concat(pos[i], neg[i]);
}
return result;
function _add(term, arr)
{
if (term.op === 'FUNC') {
for (var i=0; i<term.args.length; i++) {
_add(term.args[i], arr);
}
return;
}
else if (term.op === 'NAME' && term.variable)
return;
var i = self.funcs.indexOf(term.atom);
if (i >= 0) {
arr[3][i]++;
}
}
function _fill(array)
{
var i;
for (i=0; i<self.preds.length; i++) {
array[2].push(0);
}
for (i=0; i<self.funcs.length; i++) {
array[3].push(0);
}
}
}
numberOfFeatures()
{
return 4 + 2 * this.preds.length + 2 * this.funcs.length;
}
}
class SubsumptionIndex {
constructor(parser)
{
this.root = [];
this.parser = parser;
}
addClause(clause)
{
var v = this.parser.features(clause);
var n = this.root;
for (var i=0; i<v.length; i++) {
var feat = v[i];
while (feat >= n.length) {
n.push([]);
}
n = n[feat];
}
n.push(clause);
}
addClauses(clauses)
{
for (var i=0; i<clauses.length; i++) {
this.addClause(clauses[i]);
}
}
clauses()
{
var n = this.parser.numberOfFeatures();
var r = this.root;
for (var i=0; i<n; i++) {
r = r.reduce(combine, []);
}
return r;
function combine(a,b) { return a.concat(b); }
}
reduce(src)
{
if (!src)
src = this;
var path = [src.root];
var ixx = [0];
var nfeat = this.parser.numberOfFeatures();
for (var i=0; i<nfeat; i++) {
ixx.push(0);
path.push(path[i].length ? path[i][0] : []);
}
ixx[nfeat] = -1;
while (_next(path, ixx)) {
var clauses = path[nfeat];
if (src === this) {
for (var i=0; i<clauses.length; i++) {
for (var j=i+1; j<clauses.length; j++) {
if (clauses[i].subsumes(clauses[j])) {
clauses.splice(j--,1);
}
else if (clauses[j].subsumes(clauses[i])) {
clauses.splice(i--,1);
break;
}
}
}
}
if (!clauses.length) {
continue;
}
var r = [this.root];
var rr = [];
for (i=1; i<=nfeat; i++) {
var len = ixx[i];
r = r.reduce(function(a,b) {
return a.concat(b.slice(len));
}, []);
rr.push(r);
}
if (r.length && r[0] === clauses)
r.shift();
r = r.filter(function(a){ return a.length; });
for (i=0; i<r.length; i++) {
var c2 = r[i];
for (j=0; j<clauses.length; j++) {
for (var k=0; k<c2.length; k++) {
if (clauses[j].subsumes(c2[k])) {
c2.splice(k--, 1);
}
}
}
}
rr.pop();
while (rr.length) {
r = rr.pop();
r.forEach(function(a) {
while (a.length && !a[a.length-1].length)
a.pop();
});
}
}
function _next(p, fs)
{
var done = false;
var depth = nfeat;
while (!done) {
while (depth > 0) {
fs[depth]++;
if (fs[depth] >= p[depth-1].length) {
depth--;
}
else
break;
}
if (depth === 0)
return false;
p[depth] = p[depth-1][fs[depth]];
done = true;
for (var i=depth+1; i<=nfeat; i++) {
fs[i] = 0;
if (p[i-1].length <= fs[i]) {
done = false;
depth = i-1;
break;
}
p[i] = p[i-1][fs[i]];
}
if (done && p[nfeat].length === 0) {
done = false;
depth = nfeat;
}
}
return true;
}
}
}
function logSub(clause1, clause2)
{
}
class KnowledgeBase {
constructor(expr)
{
this.clauses = [];
this.processed = 0;
this.consistent = true;
if (expr)
this.add(expr);
}
stringify()
{
return (new CNF(this.clauses)).stringify();
}
addEquiv(expr1, expr2)
{
var e1 = new Expression('IFF', expr1, expr2);
var e = new Expression('NOT', e1);
this.add(e);
}
add(expr)
{
var cnf = standardize(expr);
var e = cnf.getClauses();
this.clauses = this.clauses.concat(e);
this.consistent = this.consistent && !cnf.isContradictory();
}
checkConsistency(from)
{
for (var i=from; i<this.clauses.length; i++) {
if (this.clauses[i].isContradictory()) {
this.consistent = false;
return false;
}
}
return true;
}
applyUnary(lim) {
for (var i=this.processed; i<lim; i++) {
var from = this.clauses.length;
this.clauses = this.clauses.concat(this.clauses[i].factorsOf());
this.clauses = this.clauses.concat(this.clauses[i].reflexOf());
if (!this.checkConsistency(from))
return;
}
}
applyBinary(lim, limit)
{
for (var i=0; i<lim; i++) {
var start = i < this.processed ? this.processed : 0;
for (var j=start; j<lim; j++) {
var c1 = this.clauses[i];
var c2 = this.clauses[j];
var from = this.clauses.length;
if (i<j)
this.clauses = this.clauses.concat(c1.resolveOf(c2));
if (i !== j)
this.clauses = this.clauses.concat(c1.paramodOf(c2));
if (!this.checkConsistency(from))
return;
}
}
}
weed()
{
for (var i=this.processed; i<this.clauses.length; i++) {
if (this.clauses[i].weed()) {
this.clauses.splice(i--, 1);
}
}
}
subsumeInitial()
{
var index = new SubsumptionIndex(this.parser);
index.addClauses(this.clauses);
index.reduce();
this.clauses = index.clauses();
}
subsume() {
this.weed();
var p = this.processed;
var newClauses = this.clauses.splice(p, this.clauses.length-p);
var index = new SubsumptionIndex(this.parser);
index.addClauses(newClauses);
var index2 = new SubsumptionIndex(this.parser);
index2.addClauses(this.clauses);
index.reduce(index2);
index.reduce();
index2.reduce(index)
this.clauses = index2.clauses();
this.processed = this.clauses.length;
this.clauses = this.clauses.concat(index.clauses());
}
round(limit) {
var lim = this.clauses.length;
this.applyUnary(lim, limit);
this.applyBinary(lim, limit);
if (!this.consistent || this.clauses.length > limit * 50)
return;
this.processed = lim;
this.subsume();
}
generate(limit)
{
this.timeout = false;
this.processed = 0;
this.parser = new FeatureParser(this.clauses);
this.subsumeInitial();
while (this.clauses.length < limit && this.consistent) {
this.round(limit);
if (this.clauses.length === this.processed)
break;
}
if (this.clauses.length >= limit && this.consistent)
this.timeout = true;
else {
for (var i=0; i<this.clauses.length; i++) {
}
}
}
result()
{
if (!this.consistent)
return 'inconsistent';
else if (this.timeout)
return 'timeout';
else
return 'consistent';
}
}
FOLEquivalent = function(s1, s2, timeout)
{
if (timeout === undefined)
timeout = 1000;
var n1 = new Expression('NOT', s1);
var n2 = new Expression('NOT', s2);
var kb = new KnowledgeBase(s1);
kb.add(n2);
kb.generate(timeout);
switch(kb.result()) {
case 'timeout':
return 'timeout';
case 'consistent':
return 'not equivalent';
default:
}
kb = new KnowledgeBase(s2);
kb.add(n1);
kb.generate(timeout);
switch(kb.result()) {
case 'timeout':
return 'timeout';
case 'consistent':
return 'not equivalent';
case 'inconsistent':
return 'equivalent';
}
}
}());

"use strict";
class TranslationUI {
constructor(data, parent, controller)
{
this.controller = controller || null;
(new ElementRef(parent)) .child('div', {'class': 'translation-container'}) .cap(this, 'container');
this.addSentences(data);
}
addSentences(data)
{
var e={};
var english = data.english;
this.inputs = [];
this.feedbackFields = [];
this.feedbackSwitches = [];
this.pointFields = [];
this.errcount = 0;
var maxPoints = data.pointsPossible;
var points;
if (data.message) {
var ref = (new ElementRef(this.container)).child('p', {'class': 'message'});
ref.elt.innerHTML = data.message;
}
var ref = (new ElementRef(this.container)).child('ol').cap(e,'list');
var ui_props = data.ui_properties || { editable: true, feedback: false, gradable: false };
for (var i=0; i<english.length; i++) {
ref.child('li', english[i]).cap(e,'item')
.child('div', 'Translation:')
.sibling('textarea', {cols:'70', rows:'6',
autocorrect: 'off',
autocapitalize: 'off', spellcheck: 'false'}
).cap(e, 'input')
.sibling('span').cap(e,'ng');
this.inputs[i] = e.input;
this.inputs[i].addEventListener('input', () => {
if (this.controller)
this.controller.attemptChanged();
})
if (data.sentences && data.sentences[i]) {
e.input.value = data.sentences[i];
}
if (data.logical && data.logical[i]) {
this.createButton(e, i, data);
}
if (ui_props.editable) {
addParenBlink(e.input, 200);
}
else {
e.input.disabled = true;
}
if (ui_props.feedback) {
if (data.feedback && data.feedback.studentInfo
&& data.feedback.studentInfo.comments[i])
{
(new ElementRef(e.item)).child('div', data.feedback.studentInfo.comments[i], {style:'color:red;'});
}
}
if (ui_props.gradable) {
points = Math.floor(maxPoints / (english.length - i));
this.addGrading(e, i, data, points);
maxPoints -= points;
}
}
if (ui_props.gradable) {
var errdiv = document.createElement('div');
this.container.insertBefore(errdiv, e.list);
setText(errdiv, this.errcount + ' out of '+english.length + ' need grading');
errdiv.style.color = 'red';
}
}
createButton(e, i, data) {
(new ElementRef(e.item))
.child('div')
.child('button', 'Check') .cap(e, 'button')
.sibling('span') .cap(e, 'output');
var s = data.logical[i];
if (typeof(s) == 'string') {
s = [s];
}
var exprs = s.map(parseSentence);
(function(b,ip,op,xpr) {
b.addEventListener('click', function() {
var ue = ip.value;
var expr = parseSentence(ue);
if (!expr) {
setText(op, 'Sentence is not well-formed.');
return;
}
if (xpr.some(e => FOLEquivalent(expr, e) === 'equivalent')) {
setText(op, 'Correct!');
return;
}
setText(op, 'Incorrect.');
}, false);
}(e.button, e.input, e.output, exprs));
}
addGrading(e, i, data, points)
{
(new ElementRef(e.item)).sibling('div')
.child('input', {type:'radio', name:'group'+i}) .cap(e, 'correct')
.parent().text('Correct ')
.sibling('input', {type:'radio', name: 'group'+i}) .cap(e, 'incorrect')
.parent().text('Incorrect ')
.sibling('input', {type:'text', size:'5', value:points}) .cap(e, 'points')
.parent().text(' Points of '+points)
.sibling('div', 'Feedback:')
.sibling('textarea', {cols:'70', rows:'4', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false'}) .cap(e, 'field');
this.feedbackFields[i] = e.field;
this.feedbackSwitches[i] = e.correct;
this.pointFields[i] = e.points;
var fb = data.feedback;
const info = fb && (fb.studentInfo || fb.instructorInfo);
if (info && info.comments && info.comments[i]) {
e.field.value = info.comments[i];
e.incorrect.checked = true;
e.points.value = (info.points && info.points[i]) || 0;
setText(e.ng, 'Needs Grading');
e.ng.style.color = 'red';
this.errcount++;
}
else {
e.correct.checked = true;
}
}
calculatedGrade()
{
return this.pointFields.reduce((g,f) => g + Number(f.value), 0);
}
feedback()
{
var f = this.feedbackFields.map(fld => fld.value);
var p = this.pointFields.map(fld => fld.value);
return {'comments': f, 'points': p};
}
export()
{
const sent = this.inputs.map(i => i.value.trim());
return JSON.stringify({sentences: sent});
}
remove()
{
this.container.parentNode.removeChild(this.container);
}
}

"use strict";
class PatternMatch {
constructor(m)
{
if (m) {
this.bindings = m.bindings.slice();
this.restrictions = m.restrictions.slice();
}
else {
this.bindings = [];
this.restrictions = [];
}
}
addRestriction(type, name, step)
{
var m = new PatternMatch(this);
m.restrictions.push({type:type, name:name, step:step});
return m;
}
addBinding(pat, expr)
{
var fnd = this.bindings.find(b => b.pattern.equals(pat));
if (fnd)
return fnd.match.equals(expr) && this;
if (pat.variable) {
if (!expr.variable)
return null;
}
else if (pat.isTerm() && expr.containsBoundVariables()) {
return null;
}
var m = new PatternMatch(this);
m.bindings.push({pattern: pat, match: expr});
return m;
}
get(pat)
{
var fnd = this.bindings.find(b => b.pattern.equals(pat));
return fnd && fnd.match;
}
matches(sent, pattern)
{
switch(pattern.op) {
case "FUNCTOR":
case "PRED":
case "NAME":
return this.addBinding(pattern, sent);
default:
return sent.op === pattern.op
&& sent.args.length === pattern.args.length
&& sent.args.reduce((m, a, i) => m && m.matches(a, pattern.args[i]),
this);
}
}
verify()
{
return this.bindings.reduce((b, {pattern: pat1, match: match1}, i) => {
if (pat1.op !== 'PRED' || pat1.args.length !== 2)
return b
else
return b && this.bindings.slice(i+1).reduce((b2, {pattern: pat2, match: match2}) => {
if (pat2.op === 'PRED' && pat1.args[0].equals(pat2.args[0]) && pat2.args.length === 2) {
return b2 && b2.matchTerms(match1, match2, pat1.args[1], pat2.args[1])
}
else
return b2
}, b)
}, this)
}
matchTerms(expr1, expr2, a, b)
{
var m;
switch(expr1.op) {
case 'ALL':
case 'EXISTS':
return expr1.op === expr2.op
&& expr1.args[0].equals(expr2.args[0])
&& this.matchTerms(expr1.args[1], expr2.args[1], a, b);
case 'NAME':
case 'FUNC':
return recurse(this) || ((m = this.addBinding(a, expr1)) && m.addBinding(b, expr2))
default:
return recurse(this)
}
function recurse(self) {
return expr1.op === expr2.op
&& expr1.args.length === expr2.args.length
&& expr1.atom === expr2.atom
&& expr1.args.reduce((m, e, i) =>
m && m.matchTerms(e, expr2.args[i], a, b),
self);
}
}
stringify()
{
return '[' + this.bindings.map(({pattern, match}) => pattern.stringify() + '=>' + match.stringify()).join(', ') + ']';
}
}

let ProofUI;
const PREMISES = 1, BODY = 2;
const SENTENCE = 1, RULE = 2, CITATION = 4;
(function(){
"use strict";
const indent = 15;
class ProofUINode {
constructor(parent)
{
this.parent = parent;
}
isEmpty() { return false; }
isEditable()
{
return this.selfIsEditable() && (!this.parent || this.parent.isEditable());
}
areChildrenEditable()
{
return this.selfIsEditable() && this.children.every(c => c.areChildrenEditable());
}
selfIsEditable() { return true; }
get children() { return []; }
get isTop() { return false; }
get top()
{
let n = this;
while (n.parent)
n = n.parent;
return n;
}
previousLine()
{
const p = this.parent;
if (!p)
return null;
const c = p.children;
const i = c.indexOf(this);
return (i>0) ? c[i-1].lastLine() : p.previousLine();
}
nextLine()
{
const p = this.parent;
if (!p)
return null;
const c = p.children;
const i = c.indexOf(this);
return (i+1 < c.length) ? c[i+1].firstLine() : p.nextLine();
}
firstLine()
{
const c = this.children;
return c.length ? c[0].firstLine() : null;
}
lastLine()
{
const c = this.children;
return c.length ? c[c.length-1].lastLine() : null;
}
activeLine()
{
for (const child of this.children) {
const line = child.activeLine();
if (line)
return line;
}
return null;
}
fixCitations()
{
this.children.forEach(c => c.fixCitations());
}
setNumbers(from)
{
return this.children.reduce((f,c) => c.setNumbers(f), from);
}
getNumbers()
{
return this.children.reduce(([first, last], c) => {
const [a,b] = c.getNumbers();
return [first || a, b];
}, [0,0]);
}
}
ProofUI = class extends ProofUINode
{
constructor(options, controller, parentElt)
{
super(null);
this.controller = controller;
this.parentElt = parentElt;
let opt = { hasDialog: true,
subproofsAllowed: true,
ui_properties: { editable: true } };
Object.assign(opt, options);
this.locked = !opt.ui_properties.editable;
this.hasDialog = opt.hasDialog;
this.subproofsAllowed = opt.subproofsAllowed;
let parentRef = new ElementRef(parentElt);
if (options.message) {
parentRef.child('div', {class: 'proof-message'}, options.message).cap(this, 'msgElt');
}
parentRef.child('div', {class: 'proof-outer'}).cap(this, 'topElt');
if (options.hasToolbar) {
this.toolbar = new ProofToolbar(this, this.topElt);
}
if (options.goal !== undefined) {
this.goal = options.goal;
let g = document.createElement('div');
g.className = 'goal-box';
this.topElt.appendChild(g);
this.goalbox = g;
let span = document.createElement('div');
if (options.goalEditable) {
setText(span, 'Goal: ');
let ip = document.createElement('input');
ip.placeholder = "None";
span.appendChild(ip);
ip.value = this.goal;
ip.addEventListener('input', () => this.update(), false);
this.goalInput = ip;
}
else {
setText(span, 'Goal: ' + this.goal);
}
g.appendChild(span);
let fb = document.createElement('div');
this.goalFeedback = fb;
g.appendChild(fb);
}
(new ElementRef(this.topElt))
.child('div', {class: 'proof-editor'}).cap(this, 'outer')
.child('div', {class: 'overlay'}).cap(this, 'overlay')
.sibling('div', {class: 'proof-container'}).cap(this, 'elt')
.sibling('div', {class: 'proof-sidebar'}).cap(this, 'side');
this.numLines = 0;
this.proof = new ProofBlock(this, options, null, []);
this.proofChanged();
this.dialog = new JustificationDialog(this.parentElt, this, options);
this.citeMouse = event => {
event.preventDefault();
event.stopPropagation();
}
this.currentCitation = null;
}
get isTop() { return true; }
get children() { return [this.proof]; }
selfIsEditable() { return !this.locked; }
remove()
{
this.parentElt.removeChild(this.topElt);
if (this.msgElt)
this.parentElt.removeChild(this.msgElt);
if (this.dialog)
this.dialog.remove();
}
startCite(citation)
{
if (this.currentCitation) {
this.currentCitation.end();
this.dialog.hide();
}
else {
this.elt.className = 'proof-container cite';
this.overlay.style.display="block";
this.elt.addEventListener('mousedown', this.citeMouse, true);
}
this.currentCitation = citation;
citation.start();
if (this.hasDialog)
this.dialog.show(citation.parentStep());
}
endCite(citation)
{
if (this.currentCitation === citation) {
this.elt.className = 'proof-container';
this.overlay.style.display = "none";
this.elt.removeEventListener('mousedown', this.citeMouse, true);
this.currentCitation.end();
this.currentCitation = null;
this.dialog.hide();
}
}
cited(step, on)
{
if (this.hasDialog)
this.dialog.cited(step, on);
this.update();
}
proofChanged()
{
if (this.proof) {
const nlines = this.proof.setNumbers(1) - 1;
this.proof.fixCitations();
while (nlines > this.numLines)
this.addLine();
while (nlines < this.numLines)
this.removeLine();
this.update();
}
}
addLine()
{
const num = this.numLines++;
let bar = document.createElement('div');
bar.className = 'proof-stripe';
this.outer.insertBefore(bar, this.overlay);
let div = document.createElement('div');
div.className = 'proof-number';
setText(div, num+1);
this.side.appendChild(div);
}
removeLine()
{
if (this.numLines === 0)
return;
this.numLines--;
this.side.removeChild(this.side.childNodes[this.numLines]);
this.outer.removeChild(this.overlay.previousSibling);
}
getGoal()
{
if (this.goalInput) {
const result = this.goalInput.value;
const blank = /^\s*$/;
return blank.test(result) ? null : result;
}
else {
return this.goal;
}
}
export()
{
let lref = { label: 1 };
let result = this.proof.export(lref);
const goal = this.getGoal();
if (goal)
result.goal = goal;
return result;
}
update()
{
if (!this.controller.shouldCheck())
return;
const report = this.controller.check();
if (report) {
this.proof.mark(report);
this.markGoal(report);
}
}
markGoal(report)
{
while (this.goalFeedback && this.goalFeedback.firstChild) {
this.goalFeedback.removeChild(this.goalFeedback.firstChild);
}
if (this.getGoal()) {
(new ElementRef(this.goalFeedback)).child('div', {class: report.goal ? 'checkmark' : 'xmark'});
}
}
handleNewSubproof()
{
const line = this.proof.activeLine();
if (line)
line.handleCreateSubproof();
}
handleExitSubproof()
{
const line = this.proof.activeLine();
if (line) {
const proof = line.parent.parent;
if (proof.isSubproof) {
proof.exitSubproof();
}
}
}
handleExitBefore()
{
const line = this.proof.activeLine();
if (line) {
const proof = line.parent.parent;
if (proof.isSubproof) {
proof.exitBefore();
}
}
}
handleDeleteLine()
{
const line = this.proof.activeLine();
if (line)
line.parent.handleDeleteLine(line);
}
handleDeleteSubproof()
{
const line = this.proof.activeLine();
if (line) {
const proof = line.parent.parent;
if (proof.isSubproof)
proof.deleteIfEmpty();
}
}
}
class ProofToolbar
{
constructor(ui, parent)
{
this.ui = ui;
this.parent = parent;
(new ElementRef(this.parent))
.child('div', {class: 'proof-toolbar'}).cap(this, 'elt')
.child('span', 'New Subproof').cap(this,'newSubBtn')
.sibling('span', 'Exit Subproof').cap(this,'exitBtn')
.sibling('span', 'Exit Before').cap(this,'beforeBtn')
.sibling('span','Delete Line').cap(this,'dlinBtn')
.sibling('span', 'Delete Subproof').cap(this,'delBtn');
this.elt.addEventListener('mousedown', (event) => {
event.preventDefault();
event.stopPropagation();
}, true);
this.newSubBtn.addEventListener('click', () => this.ui.handleNewSubproof(), false);
this.exitBtn.addEventListener('click', () => this.ui.handleExitSubproof(), false);
this.beforeBtn.addEventListener('click', () => this.ui.handleExitBefore(), false);
this.dlinBtn.addEventListener('click', () => this.ui.handleDeleteLine(), false);
this.delBtn.addEventListener('click', () => this.ui.handleDeleteSubproof(), false);
}
}
class ProofBlock extends ProofUINode
{
constructor(parent, options, before, lmap)
{
super(parent);
this.ro = options.ro || 0;
this.elt = document.createElement('div');
this.elt.className = 'proof-block';
this.elt.style.width = (parent.elt.clientWidth - indent) + 'px';
if (before) {
parent.elt.insertBefore(this.elt, before.elt);
}
else {
parent.elt.appendChild(this.elt);
}
(new ElementRef(this.elt)).child('div', {class: 'hilite'}).cap(this, 'hilite');
this.premiseBlock = new LineBlock(this, true, options, lmap);
this.stepBlock = new LineBlock(this, false, options, lmap);
this.isSubproof = !this.parent.isTop;
this.elt.addEventListener('click', event => this.click(event), false);
}
get children()
{
return [this.premiseBlock, this.stepBlock];
}
insertBefore()
{
this.parent.newLine(this);
}
exitSubproof()
{
const before = this.parent.stepAfter(this);
const line = this.parent.newLine(before);
if (line)
setTimeout(() => line.focus());
}
exitBefore()
{
const line = this.parent.newLine(this);
if (line)
setTimeout(() => line.focus());
}
deleteIfEmpty()
{
if (this.premiseBlock.lines.length == 1
&& this.premiseBlock.lines[0].isEmpty()
&& this.stepBlock.lines.length == 1
&& this.stepBlock.lines[0].isEmpty()
&& !this.parent.isTop)
{
const block = this.parent;
const after = block.stepAfter(this);
if (block.deleteLine(this))
block.handleNewLine(after, false, false);
}
}
occursBefore(step, line)
{
if (step === line)
return false;
if (this.premiseBlock.lines.indexOf(step) >= 0)
return true;
const fnd = this.stepBlock.lines.find(s => s === step || s === line);
return fnd && (fnd === step || (this.isSubproof && this.parent.parent.occursBefore(step, this)));
}
click(event)
{
const top = this.top;
if (top.currentCitation) {
const step = top.currentCitation.parentStep();
if (step.sees(this)) {
top.currentCitation.cite(this);
event.stopPropagation();
}
}
}
cited(on)
{
this.hilite.style.display = on ? 'block' : 'none';
this.top.cited(this, on);
}
hypothesis()
{
return this.premiseBlock.lines[0].sentence();
}
conclusion()
{
if (this.stepBlock.lines.length === 0)
return null;
const last = this.stepBlock.lines[this.stepBlock.lines.length-1];
if (!last.sentence)
return null;
return last.sentence();
}
export(lref)
{
let result = { };
result.premises = this.premiseBlock.export(lref);
result.body = this.stepBlock.export(lref);
result.ro = this.ro;
return result;
}
mark(report)
{
this.stepBlock.mark(report);
}
}
class LineBlock extends ProofUINode
{
constructor(parent, isPremise, options, lmap)
{
super(parent);
this.isPremise = isPremise;
this.ro = options.ro || 0;
let e = {};
(new ElementRef(parent.elt)).child('div', {class: 'line-block'}).cap(this, 'elt')
.child('div', {class: 'vbar'}).cap(e, 'vbar');
if (!isPremise) {
e.vbar.style.top= '0px';
e.vbar.style.bottom = '2px';
(new ElementRef(this.elt)).child('div', {class: 'hbar'});
}
const opts = (isPremise ? options.premises : options.body) || [];
this.lines = opts.map(stepopt => {
let step = null;
stepopt = stepopt || {};
if (stepopt.p === undefined) {
step = new ProofLine(this, this.isPremise, null, stepopt, lmap);
}
else {
step = new ProofBlock(this, stepopt.p, null, lmap);
}
if (step && stepopt.l)
lmap[stepopt.l] = step;
return step;
});
}
get children()
{
return this.lines;
}
selfIsEditable()
{
const locked = this.ro & (this.isPremise ? PREMISES : BODY);
return !locked;
}
addBefore(step, before)
{
if (!before) {
this.lines.push(step);
}
else {
const i = this.lines.indexOf(before);
if (i >= 0)
this.lines.splice(i, 0, step);
}
this.proofChanged();
return step;
}
deleteLine(line)
{
if (!line.isEditable() || !line.areChildrenEditable()) {
return false;
}
const i = this.lines.indexOf(line);
if (i >= 0) {
this.elt.removeChild(line.elt);
this.lines.splice(i,1);
line.parent = null;
this.proofChanged();
return true;
}
else {
return false;
}
}
proofChanged()
{
const top = this.top;
if (top.proofChanged)
top.proofChanged();
}
newSubproof(before, opt)
{
if (!this.isEditable())
return null;
opt = opt || { premises: [{s:''}], body: [{s:''}] };
const p = new ProofBlock(this, opt, before);
return this.addBefore(p, before);
}
newLine(before, opt)
{
if (!this.isEditable())
return null;
opt = opt || {};
const line = new ProofLine(this, this.isPremise, before, opt, []);
return this.addBefore(line, before);
}
handleNewLine(line, isAfter, doEscape)
{
if (this.parent.isSubproof && this.isPremise) {
this.parent.insertBefore();
return;
}
if (doEscape && isAfter && !this.isPremise && this.parent.isSubproof && this.lines[this.lines.length - 1] === line) {
this.parent.exitSubproof();
return;
}
if (line && isAfter) {
line = this.stepAfter(line);
}
const newelt = this.newLine(line);
if (newelt && isAfter) {
setTimeout(() => newelt.focus(), 10);
}
}
handleDelete(line)
{
let prev = this.previousStep(line);
if (!prev) {
if (!this.isPremise || !this.parent.isSubproof)
return;
prev = this.parent.parent.previousStep(this.parent);
if (!prev || prev.isSubproof || !prev.isEmpty())
return;
}
if (prev.isSubproof && this.lastLine() === line)
return;
if (prev.isEmpty()) {
prev.parent.deleteLine(prev);
}
else if (line.isEmpty()) {
if (this.deleteLine(line))
setTimeout(() => prev.lastLine().focus());
}
}
handleDeleteLine(line)
{
if (this.lines.length > 1) {
this.deleteLine(line);
}
}
stepAfter(step)
{
return this.lines.find((_,i) => this.lines[i-1] === step);
}
previousStep(line)
{
return this.lines.find((_, i) => this.lines[i+1] === line)
}
export(lref)
{
return this.lines.map(line => {
let e = line.export(lref);
if (e.premises) {
e = {p: e, l: lref.label++};
}
line.label = e.l;
return e;
});
}
mark(report)
{
this.lines.forEach((l, i) => l.mark(report[i]));
}
}
class ProofLine extends ProofUINode
{
constructor(parent, isPremise, before, opt, lmap)
{
super(parent);
this.ro = opt.ro || 0;
let elt = document.createElement('div');
elt.className = 'proof-line';
if (before) {
parent.elt.insertBefore(elt, before.elt);
}
else {
parent.elt.appendChild(elt);
}
this.elt = elt;
(new ElementRef(this.elt))
.child('div', {class: 'hilite'}) .cap(this, 'hilite')
.sibling('div', {class: 'hilite-select'}) .cap(this, 'hselect');
if (!isPremise) {
(new ElementRef(this.elt)).child('div', {class: 'feedback'}).cap(this, 'feedback');
}
this.step = new Step(this, opt);
this.just = isPremise ? null : new Justification(this, opt, lmap);
this.isSubproof = false;
this.check = (opt.check === undefined) || opt.check;
this.elt.addEventListener('click', event => this.click(event), false);
}
get children()
{
return this.just ? [this.step, this.just] : [this.step];
}
handleInputEnter(input, event)
{
let suffix;
if (input) {
const end = input.selectionEnd;
const text = input.value;
suffix = text.substr(end);
}
else {
suffix = '';
}
this.parent.handleNewLine(this, !(/[^ ]/.test(suffix)), event.shiftKey);
}
handleInputDelete(input, event)
{
const start = input.selectionStart;
const end = input.selectionEnd;
if (start === end && start === 0) {
this.parent.handleDelete(this);
event.preventDefault();
}
}
handleUpArrow(input, event)
{
const prev = this.previousLine();
if (prev)
prev.focus();
event.preventDefault();
}
handleDownArrow(input, event)
{
const next = this.nextLine();
if (next)
next.focus();
event.preventDefault();
}
handleRightArrow(input)
{
if (input.selectionEnd === input.value.length && this.just) {
this.just.elt.focus();
}
}
isEmpty()
{
const input = this.step.input;
return (/^\s*$/.test(input.value));
}
focus()
{
this.step.input.focus();
}
handleCreateSubproof()
{
if (!this.top.subproofsAllowed)
return;
const parent = this.parent;
if (parent.isPremise)
return;
const step = parent.stepAfter(this);
if (this.isEmpty()) {
parent.deleteLine(this);
}
const p = parent.newSubproof(step);
if (p)
setTimeout(() => p.premiseBlock.lines[0].focus());
}
firstLine() { return this; }
lastLine() { return this; }
sees(step)
{
const proof = this.parent.parent;
return proof.occursBefore(step, this);
}
click(event)
{
let top = this.top;
if (top.currentCitation) {
const step = top.currentCitation.parentStep();
if (step.sees(this)) {
top.currentCitation.cite(this);
event.stopPropagation();
}
}
}
cited(on)
{
this.hilite.style.display = on ? 'block' : 'none';
this.top.cited(this, on);
}
citing(on)
{
this.hselect.style.display = on ? 'block' : 'none';
}
setNumbers(from)
{
this.lineNumber = from;
this.step.setNumber(from);
if (this.just)
this.just.setNumber(from);
return from+1;
}
getNumbers()
{
return [this.lineNumber, this.lineNumber];
}
sentence()
{
const s = this.step.input.value;
return (/^\s*$/).test(s) ? null : s;
}
setRule(rule)
{
this.just.setRule(rule);
}
getRule()
{
return this.just.getRule();
}
export(lref)
{
let result = { s: this.step.export(),
l: lref.label++,
ro: this.ro };
if (this.just) {
const j = this.just.export();
if (j.r)
result.r = j.r;
result.c = j.c;
}
return result;
}
mark(report)
{
if (this.feedback) {
while (this.feedback.firstChild) {
this.feedback.removeChild(this.feedback.firstChild);
}
if (this.check && !report.empty) {
let div = document.createElement('div');
div.className = report.valid ? 'checkmark' : 'xmark';
this.feedback.appendChild(div);
}
}
}
update()
{
let top = this.top;
if (top === this)
alert('Error');
top.update();
}
activeLine()
{
return this.step.isActive() ? this : null;
}
}
class Step extends ProofUINode
{
constructor(parent, options)
{
super(parent);
const sentence = (options && options.s) || '';
(new ElementRef(this.parent.elt)) .child('div', {class: 'single-step'}) .cap(this, 'elt');
this.ro = (options && options.ro) || 0;
this.original = sentence;
let input = (new ElementRef(this.elt)).child('input', {type: 'text', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false'}).elt;
addParenBlink(input, 200);
this.contents = '';
if (sentence)
input.value = sentence;
this.contents = sentence;
if (!this.isEditable())
input.readOnly = true;
this.input = input;
input.addEventListener('keydown', event => {
switch(event.keyCode) {
case 13:
parent.handleInputEnter(input, event);
break;
case 8:
parent.handleInputDelete(input, event);
break;
case 38:
parent.handleUpArrow(input, event);
break;
case 39:
parent.handleRightArrow(input, event);
break;
case 40:
parent.handleDownArrow(input, event);
break;
case 75:
if (event.metaKey || event.ctrlKey) {
parent.handleCreateSubproof();
event.preventDefault();
}
break;
}
}, false);
input.addEventListener('input', () => {
this.contents = input.value;
parent.update();
}, false);
}
selfIsEditable() { return !(this.ro & SENTENCE); }
setNumber(n)
{
this.input.tabIndex = 2*n;
}
isActive()
{
return this.input === document.activeElement;
}
export()
{
return this.isEditable() ? this.contents : this.original;
}
}
class Justification extends ProofUINode
{
constructor(parent, opt, lmap)
{
super(parent);
(new ElementRef(parent.elt)) .child('div', {class: 'justification'}) .cap(this, 'elt');
this.ro = (opt && opt.ro) || 0;
this.rule = new JustRule(this, opt);
this.citation = new Citation(this, opt, lmap);
this.elt.addEventListener('click', () => this.elt.focus(), false);
this.elt.addEventListener('keydown', event => this.key(event), false);
this.elt.addEventListener('focus', () => this.click(), false);
this.elt.addEventListener('blur', () => this.top.endCite(this.citation), false);
}
get children()
{
return [this.rule, this.citation];
}
setRule(rule)
{
this.rule.setRule(rule);
}
getRule()
{
return this.rule.getRule();
}
click()
{
this.top.startCite(this.citation);
}
key(event)
{
let line;
switch(event.keyCode) {
case 13:
this.parent.handleInputEnter(null, event);
break;
case 37:
setTimeout(() => this.parent.focus(), 10);
break;
case 38:
line = this.parent.previousLine();
while (line && !line.just)
line = line.previousLine();
if (line)
line.just.elt.focus();
event.preventDefault();
break;
case 40:
line = this.parent.nextLine();
while (line && !line.just)
line = line.nextLine();
if (line)
line.just.elt.focus();
event.preventDefault();
break;
}
}
setNumber(n)
{
this.elt.tabIndex = 2*n+1;
}
export()
{
const r = this.rule.getRule();
const c = this.citation.export();
return r ? {r: r, c: c} : {c: c};
}
}
class JustRule extends ProofUINode
{
constructor(parent, opt)
{
super(parent);
this.ro = (opt && opt.ro) || 0;
this.ruleText = (opt && opt.r) || 'rule?';
(new ElementRef(this.parent.elt))
.child('div', {class: 'just-rule'}).cap(this, 'elt')
.child('span', this.ruleText).cap(this, 'ruleElt');
}
selfIsEditable()
{
return !(this.ro & RULE);
}
setRule(t)
{
if (!this.isEditable())
return;
this.ruleText = t;
setText(this.ruleElt, t);
this.top.update();
}
getRule()
{
return this.ruleText === 'rule?' ? null : this.ruleText;
}
}
class Citation extends ProofUINode
{
constructor(parent, opt, lmap)
{
super(parent);
this.ro = (opt && opt.ro) || 0;
(new ElementRef(parent.elt))
.child('div', {class: 'just-cite'}).cap(this, 'elt')
.child('span').cap(this, 'textElt');
const cs = (opt && opt.c) || [];
this.references = cs.map(cite => lmap[cite]).filter(r => r);
}
parentStep()
{
let s = this;
while (s && !s.step)
s = s.parent;
return s;
}
selfIsEditable()
{
return !(this.ro & CITATION);
}
cite(step)
{
if (!this.isEditable())
return;
const i = this.references.indexOf(step);
if (i >= 0) {
this.references.splice(i,1);
step.cited(false);
}
else {
this.references.push(step);
step.cited(true);
}
this.fixCitations();
}
start()
{
this.references.forEach(r => r.cited(true));
this.parentStep().citing(true);
}
end()
{
this.references.forEach(ref => ref.cited(false));
this.parentStep().citing(false);
}
fixCitations()
{
this.references = this.references.filter(ref => ref.top.isTop);
let lines = this.references.map(ref => ref.getNumbers());
lines.sort((a,b) => a[0]-b[0]);
const text = lines.map(([a,b]) => a == b ? a : a + '-' + b).join(', ');
setText(this.textElt, text);
}
export()
{
return this.references.map(({label}) => label);
}
}
class JustificationDialog
{
constructor(parentElt, container, options)
{
this.container = container;
this.options = options;
(new ElementRef(parentElt)).child('div', {class: 'just-entry'}).cap(this, 'elt');
this.conclusion = null;
this.premises = [];
this.makeTop();
this.makeBottom();
this.makeButtons();
this.elt.addEventListener('mousedown', event => {
event.preventDefault();
event.stopPropagation();
}, true);
}
remove()
{
this.elt.parentNode.removeChild(this.elt);
}
makeTop()
{
(new ElementRef(this.elt))
.child('div').cap(this, 'top')
.child('div').cap(this, 'premElt')
.sibling('div').cap(this, 'conclElt');
}
makeBottom()
{
this.bottom = document.createElement('div');
this.elt.appendChild(this.bottom);
this.rulemap = {};
const items = [['Elim', ['~','&','|','->','<->','=','A','E']], ['Intro', ['~','&','|','->','<->','=','A','E']], 'Reit', 'Contradiction', 'Taut Con'];
items.forEach(item => {
let ref = new ElementRef(this.bottom).child('div');
if (typeof(item) == 'string') {
ref.child('span', item).cap(span => this.installRule(span, item));
}
else {
ref = ref.child('div', item[0])
.sibling('div');
this.rulemap[item[0]] = {};
item[1].forEach(ii => {
ref.child('span', ii)
.cap(span => this.installRule(span, ii + ' ' + item[0]));
});
}
});
this.currentItem = null;
}
installRule(s, rule)
{
this.rulemap[rule] = s;
let enabled = true;
if (this.options.enabledRules && this.options.enabledRules.indexOf(rule) === -1)
enabled = false;
else if (this.options.disabledRules && this.options.disabledRules.indexOf(rule) !== -1)
enabled = false;
if (enabled) {
s.addEventListener('click', () => {
this.step.setRule(rule);
this.setRule(this.step.getRule());
}, false);
}
else {
s.className = 'disabled';
}
}
makeButtons()
{
(new ElementRef(this.elt))
.child('div')
.child('span', 'Done', {class: 'proof-button'})
.cap(span => span.addEventListener('click', () => {
const step = this.citation.parentStep();
const next = step.nextLine();
if (next)
next.focus();
else
step.focus();
}, false));
}
show(step)
{
this.elt.style.display = 'inline-block';
this.conclusion = step.sentence();
this.step = step;
setText(this.conclElt, this.conclusion || '?');
this.citation = step.just.citation;
this.setCitations(this.citation.references);
this.setRule(this.step.getRule());
}
setRule(rule)
{
if (this.currentItem) {
this.currentItem.className = '';
this.currentItem = null;
}
if (rule && this.rulemap[rule]) {
this.currentItem = this.rulemap[rule];
this.currentItem.className = 'selected';
}
}
hide()
{
this.elt.style.display='none';
}
setCitations(steps)
{
while (this.premElt.firstChild)
this.premElt.removeChild(this.premElt.firstChild);
this.premises = steps.slice(0);
let prem = this.premises.map(p => [p, p.getNumbers()[0]]);
prem.sort(([_1,n1], [_2,n2]) => n1-n2);
prem.forEach(([p,_]) => {
let e;
if (p.sentence) {
e = document.createElement('div');
e.className = 'cite-premise';
setText(e, p.sentence() || '?');
}
else {
e = this.makeSubproof(p.hypothesis() || '?', p.conclusion() || '?');
}
this.premElt.appendChild(e);
})
if (this.premises.length == 0) {
let div = document.createElement('div');
setText(div, '(Premises)');
div.style.color='#ccc';
this.premElt.appendChild(div);
}
}
cited(step, add)
{
const i = this.premises.indexOf(step);
if (i < 0 && add)
this.setCitations(this.premises.concat([step]));
else if (i >= 0 && !add)
this.setCitations(this.premises.filter((p,j) => j !== i));
}
makeSubproof(p, c)
{
let spref = ElementRef.newelt('div', {class: 'cite-subproof'});
spref.child('div', p)
.child('div', {class: 'cite-fitchbar'})
.parent().sibling('div', c);
return spref.elt;
}
}
}());

var TautConRule, isConsistent, areEquivalent;
(function(){
"use strict";
TautConRule = class {
constructor() {}
isValidInference(premises, conclusion, context)
{
var sentences = premises.map(p => p.getSentence());
if (sentences.some(s => s.op === 'PROVES'))
return false;
var c = conclusion.getSentence();
sentences.push(new Expression('NOT', c));
return !isConsistent(sentences);
}
dump(model, sentence)
{
var str = "[";
for (i=0; i<model.length; i++) {
var pair=model[i];
str += "(" + pair[0].stringify() +" => "+ (pair[1] ? "TRUE" : "FALSE") + ")";
}
str += "]";
alert("Testing \""+sentence.stringify()+"\" against model: "+str);
}
}
isConsistent = function(sentences)
{
return (new Valuation).satisfies(sentences);
}
function implies(s1, s2)
{
const ss = [s1, new Expression('NOT', s2)];
return !isConsistent(ss);
}
areEquivalent = function(s1, s2)
{
return implies(s1, s2) && implies(s2, s1);
}
class Valuation {
constructor(val)
{
this.values = val ? val.slice() : [];
}
satisfies(sentences)
{
var n, sent, list2, tmp;
sentences = sentences.map(s => normalize(s, true));
while (sentences.length > 0) {
n = sentences.length;
sent = sentences[n-1];
switch (sent.op) {
case "NOT":
sent = sent.args[0];
if (!this.add(sent, false))
return false;
sentences.pop();
break;
case "AND":
sentences[n-1] = sent.args[0];
sentences[n] = sent.args[1];
break;
case "OR":
list2 = sentences.slice(0);
list2[n-1] = sent.args[0];
tmp = new Valuation(this.values);
if (tmp.satisfies(list2))
return true;
sentences[n-1] = sent.args[1];
break;
default:
if (!this.add(sent, true))
return false;
sentences.pop();
}
}
return true;
}
add(sentence, value)
{
if (sentence.op === 'EET') {
return value ? false : true;
}
var pair = this.values.find(([s, v]) => s.equals(sentence));
if (pair)
return pair[1] === value;
this.values.push([sentence, value]);
return true;
}
}
function normalize(sentence, sign)
{
var s1, s2, s3, s4, op, A, B, result;
switch (sentence.op) {
case "AND":
s1 = normalize(sentence.args[0], sign);
s2 = normalize(sentence.args[1], sign);
op = sign ? "AND" : "OR";
result = new Expression(op, s1, s2);
break;
case "OR":
s1 = normalize(sentence.args[0], sign);
s2 = normalize(sentence.args[1], sign);
op = sign ? "OR" : "AND";
result = new Expression(op, s1, s2);
break;
case "IF":
s1 = normalize(sentence.args[0], !sign);
s2 = normalize(sentence.args[1], sign);
op = sign ? "OR" : "AND";
result = new Expression(op, s1, s2);
break;
case "IFF":
s1 = normalize(sentence.args[0], sign);
s2 = normalize(sentence.args[1], sign);
s3 = normalize(sentence.args[0], !sign);
s4 = normalize(sentence.args[1], !sign);
const op1 = sign ? "OR" : "AND";
const op2 = sign ? "AND" : "OR";
A = new Expression(op1, s2, s3);
B = new Expression(op1, s1, s4);
result = new Expression(op2, A, B);
break;
case "NOT":
return normalize(sentence.args[0], !sign);
default:
if (sign)
return sentence;
else
return new Expression("NOT", sentence);
}
return result;
}
}());

let ProofController;
let ProofModel;
(function(){
"use strict";
ProofController = class {
constructor(options, parentElt, controller)
{
this.controller = controller || null;
if (typeof(options) == 'string')
options = JSON.parse(options);
const defaultOptions = { premises: [{s:''}], body: [{s:''}] };
this.options = mergeParams(options, defaultOptions);
this.creating = true;
this.ui = new ProofUI(this.options, this, parentElt);
this.ui.update();
this.creating = false;
}
check()
{
if (!this.ui)
return null;
const p = this.ui.export();
const m = new ProofModel(p);
if (this.controller && !this.creating) {
this.controller.attemptChanged();
}
return m.check();
}
shouldCheck()
{
return true;
}
export()
{
return this.ui.export();
}
remove()
{
this.ui.remove();
}
}
ProofModel = class {
constructor(data, map)
{
this.premises = [];
this.body = [];
this.map = map ? map.slice(0) : [];
this.premises = data.premises.map(p => new Step(p, true, this)).filter(s => s.sentence);
this.body = data.body.map(b => new Step(b, false, this));
if (data.goal) {
this.goal = parseSentence(data.goal);
}
}
check(ctx)
{
const context = new MatchContext(ctx);
this.premises.forEach(p => p.sentence && context.handlePremise(p.sentence));
let report = this.body.map(step => {
if (step.sentence) {
return this.checkLine(step, context);
}
else if (step.subproof) {
return step.subproof.check(context);
}
else if (step.error) {
return {valid: false, message: 'syntax error' };
}
else {
return {valid: true, empty: true};
}
});
if (this.goal) {
report.goal = this.checkGoal(report, context);
}
if (ctx) {
ctx.endSubproof(context);
}
return report;
}
checkGoal(report, context)
{
const goalFound = this.body.some(({sentence}) => sentence && this.goal.equals(sentence));
return goalFound && context.checkGoal(this.goal) && !this.containsErrors(report);
}
containsErrors(report)
{
return report.some((r,i) => {
const s = this.body[i].subproof;
return (s && s.containsErrors(r)) || (r.valid === false);
});
}
checkLine(line, context)
{
let result = {valid: true};
if (!line.sentence) {
result = {valid: false, message: 'missing sentence'};
}
else if (!line.rule) {
result = {valid: false, message: 'missing rule'};
}
else if (!line.citations) {
result = {valid:false, message: 'missing citations'};
}
else if (line.sentence.containsFreeVariables()) {
result = {valid:false, message: 'open formula'};
}
else if (!line.rule.isValidInference(line.citations, line, context)) {
result = {valid: false, message: "invalid inference"};
}
else if (context.forbiddenName(line.sentence)) {
result = {valid: false, message: "name restriction violation"};
}
if (line.sentence) {
context.handleStep(line.sentence);
}
return result;
}
hypothesis()
{
const p = this.premises;
if (p.length == 0)
return new Expression('NULL');
else
return p[0].sentence;
}
conclusion()
{
if (this.body.length == 0)
return new Expression('NULL');
else {
const s = this.body[this.body.length-1].sentence;
return s || new Expression('NULL');
}
}
isCorrect() {
const report = this.check();
let succ = !this.containsErrors(report);
if (this.goal)
succ = succ && report.goal;
return succ;
}
}
class Step {
constructor(stepData, isPremise, proof)
{
let map = proof.map;
this.parent = proof;
if (stepData.p) {
this.subproof = new ProofModel(stepData.p, map);
this.subproof.parent = this;
}
else if (stepData.s) {
this.sentence = isPremise ? parsePremise(stepData.s) : parseSentence(stepData.s);
if (!this.sentence && !(/^\s*$/.test(stepData.s)))
this.error = true;
if (stepData.r) {
this.rule = getRules()[stepData.r];
}
if (stepData.c) {
this.citations = stepData.c.map(a => map[a]);
}
}
if (stepData.l) {
map[stepData.l] = this;
}
}
getSentence() {
if (this.sentence)
return this.sentence;
if (!this.subproof)
return null;
const hyp = this.subproof.hypothesis();
const concl = this.subproof.conclusion();
if (!hyp || !concl)
return null;
return new Expression('PROVES', hyp, concl);
}
match(pat, pmatch)
{
const sent = this.getSentence();
if (!sent)
return null;
pmatch = pmatch || new PatternMatch;
const op = pat.op;
if (op == 'NEW' || op == 'LOCAL' || op == 'ARBITRARY') {
const name = pat.args[0];
const patbody = pat.args[1];
let p = pmatch.matches(sent, patbody);
return p && p.addRestriction(op, name, this);
}
else {
return pmatch.matches(sent, pat);
}
}
}
function checkRestrictions(match, context)
{
return match.restrictions.every(({name, type}) => {
const n = match.get(name);
if (n) {
switch (type) {
case 'NEW':
return context.isNew(n);
case'LOCAL':
if (!context.isNew(n))
return false;
context.addLocalName(n);
break;
case 'ARBITRARY':
return context.isArbitrary(n);
}
}
return true;
});
}
class InferenceRule {
constructor()
{
this.inferences = Array.from(arguments).map(inf => new Inference(inf));
}
isValidInference(premises, conclusion, context)
{
let pm;
return this.inferences.some(inf => (pm = inf.matches(premises, conclusion)) && checkRestrictions(pm, context));
}
}
class Inference {
constructor(args)
{
this.premises = args.map(parsePattern);
this.conclusion = this.premises.pop();
}
matches(prem, concl)
{
const pm = concl.match(this.conclusion, new PatternMatch);
if (!pm)
return null;
if (prem.length != this.premises.length)
return null;
if (prem.some(p => !p))
return null;
return matchFrom(prem, this.premises, pm);
function matchFrom(steps, pats, pmatch)
{
if (steps.length === 0)
return pmatch && pmatch.verify();
for (let i=0; i<steps.length; i++) {
const m = steps[i].match(pats[0], pmatch);
if (m) {
const s = steps.filter((_, j) => j !== i);
const p = pats.slice(1);
const m2 = matchFrom(s, p, m);
if (m2)
return m2;
}
}
return null;
}
}
}
function MatchContext(parentContext)
{
if (parentContext) {
this.used = parentContext.used.slice(0);
this.nonArbitrary = parentContext.nonArbitrary.slice(0);
this.local = [];
this.forbidden = parentContext.forbidden.slice(0);
}
else {
this.used = [];
this.nonArbitrary = [];
this.local = [];
this.forbidden = [];
}
this.handlePremise = function (p)
{
if (p) {
const names = namesInExpr(p);
addNames(names, this.nonArbitrary);
addNames(names, this.used);
}
}
this.handleStep = function (s)
{
if (s) {
addNames(namesInExpr(s), this.used);
}
}
this.addLocalName = function (name)
{
if (name) {
addNames([name], this.local);
addNames([name], this.nonArbitrary);
addNames([name], this.used);
}
}
this.endSubproof = function (childContext)
{
addNames(childContext.local, this.forbidden);
addNames(childContext.forbidden, this.forbidden);
}
this.forbiddenName = function (sentence)
{
let names = namesInExpr(sentence);
names = intersection(names, this.forbidden);
return (names.length !== 0);
}
this.isArbitrary = function(name)
{
return this.nonArbitrary.every(a => !a.equals(name));
}
this.isNew = function(name)
{
return this.used.every(u => !u.equals(name));
}
this.checkGoal = function(goal)
{
if (goal) {
let names = namesInExpr(goal);
const loc = this.local.concat(this.forbidden);
names = intersection(names, loc);
return names.length == 0;
}
else {
return true;
}
}
function addNames(names, arr)
{
const unique = names.filter(n => !arr.find(a => a.equals(n)));
unique.forEach(u => arr.push(u));
}
function namesInExpr(expr)
{
let arr;
switch(expr.op) {
case 'NAME':
return expr.variable ? [] : [expr];
case 'PRED':
case 'FUNC':
arr = expr.args.slice(1).map(a => namesInExpr(a));
break;
default:
arr = expr.args.map(a => namesInExpr(a));
break;
}
return arr.reduce((a,b) => a.concat(b), []);
}
function intersection(arr1, arr2)
{
return arr1.filter(n1 => arr2.find(n2 => n1.equals(n2)));
}
}
function makeFitchRules()
{
const result = {
"= Intro": new InferenceRule(["a=a"]),
"= Elim": new InferenceRule(["a=b", "F(a)", "F(b)"],
["a=b", "F(b)", "F(a)"]),
"Reit": new InferenceRule(["A", "A"]),
"& Intro": new InferenceRule(["A", "B", "A&B"]),
"& Elim": new InferenceRule(["A&B", "A"],
["A&B", "B"]),
"| Intro": new InferenceRule(["A", "A|B"],
["B", "A|B"]),
"| Elim": new InferenceRule(["A|B", "A>C", "B>C", "C"]),
"Contradiction": new InferenceRule(["A", "~A", "!"]),
"~ Intro": new InferenceRule(["A>~A", "~A"],
["A>!", "~A"]),
"~ Elim": new InferenceRule(["~~A", "A"],
["~A>A","A"],
["~A>!","A"]),
"-> Intro": new InferenceRule(["A>B", "A->B"]),
"-> Elim": new InferenceRule(["A->B", "A", "B"]),
"<-> Intro": new InferenceRule(["A>B", "B>A", "A<->B"]),
"<-> Elim": new InferenceRule(["A<->B", "A", "B"],
["A<->B", "B", "A"]),
"A Intro": new InferenceRule(["new a a > F(a)", "Ax F(x)"]),
"A Elim": new InferenceRule(["Ax F(x)", "F(a)"]),
"E Intro": new InferenceRule(["F(a)", "Ex F(x)"]),
"E Elim": new InferenceRule(["Ex F(x)", "local a F(a)"]),
"Taut Con": new TautConRule(),
}
return result;
}
let theRules = null;
function getRules()
{
if (!theRules)
theRules = makeFitchRules();
return theRules;
}
}());

"use strict";
class Server {
constructor(logFn, logoutFn)
{
this.authUser = null;
initApp();
firebase.auth().onAuthStateChanged(user => {
if (user) {
if (this.authUser)
return;
this.authUser = user;
this.didLogin(logFn);
} else {
this.authUser = null;
logoutFn(this);
}
}, function(error) {
alert(error);
});
}
login(email, password)
{
firebase.auth().signInWithEmailAndPassword(email, password)
.catch(function(error){
var errorCode = error.code;
var errorMessage = error.message;
if (errorCode === 'auth/wrong-password') {
alert('Wrong password.');
} else {
alert(errorMessage);
}
console.log(error);
});
}
logout()
{
firebase.auth().signOut();
}
didLogin(f)
{
this.email = this.authUser && this.authUser.email;
this.userid = this.authUser && this.authUser.uid;
f(this.userid, this.email, this);
}
setUser(id, email)
{
this.userid = id;
this.email = email;
}
changePassword(newPassword) {
const user = firebase.auth().currentUser;
return user.updatePassword(newPassword);
}
createAccount(email, password, firstName, lastName)
{
return firebase.auth().createUserWithEmailAndPassword(email, password)
.then(user => this.addAccountToInstance(user, email, firstName, lastName));
}
addAccountToInstance(user, email, firstName, lastName)
{
const ref = rootRef.child('logic/instances').child(CURRENT_INSTANCE).child('users');
let userdata = {};
const id = user.uid;
userdata[id] = {};
userdata[id]['email'] = email;
userdata[id]['firstName'] = firstName;
userdata[id]['lastName'] = lastName;
return ref.update(userdata);
}
_update(path, data, instance)
{
if (instance === undefined)
instance = CURRENT_INSTANCE;
var ref = rootRef.child('logic/instances').child(instance);
if (path) {
if (Array.isArray(path))
path = path.join('/');
ref = ref.child(path);
}
return ref.update(data);
}
_write(path, data)
{
var ref = rootRef.child('logic/instances').child(CURRENT_INSTANCE);
if (path) {
if (Array.isArray(path))
path = path.join('/');
ref = ref.child(path);
}
return ref.set(data);
}
async _read(path, type, instance)
{
if (instance === undefined)
instance = CURRENT_INSTANCE;
let ref = rootRef.child('logic/instances').child(instance);
if (path) {
if (Array.isArray(path))
path = path.join('/');
ref = ref.child(path);
}
const snapshot = await ref.once('value');
let data = snapshot.val();
if (type === 'object' && typeof(data) === 'string') {
data = JSON.parse(data);
}
else if (type === 'string' && typeof(data) === 'object' && data !== null) {
data = JSON.stringify(data);
}
return data;
}
_monitor(path, type, on, handler, errHandler, instance)
{
if (instance === undefined)
instance = CURRENT_INSTANCE;
let ref = rootRef.child('logic/instances').child(instance);
if (path) {
if (Array.isArray(path))
path = path.join('/');
ref = ref.child(path);
}
if (on) {
if (!this.cbtable)
this.cbtable = {};
this.cbtable[path] = callback;
ref.on('value', callback, function(error) {
errHandler && errHandler(error)
});
}
else {
if (this.cbtable && this.cbtable[path]) {
ref.off('value', this.cbtable[path]);
}
else {
ref.off('value');
}
}
function callback(snapshot) {
var data = snapshot.val();
if (type == 'object' && typeof(data) == 'string') {
data = JSON.parse(data);
}
else if (type == 'string' && typeof(data) == 'object' && data !== null) {
data = JSON.stringify(data);
}
handler(data);
}
}
async readInstructorStatus()
{
this.instructor = false;
this.instructorKey = "";
var ref = rootRef.child('logic/instances').child(CURRENT_INSTANCE).child('teachers').child(this.userid);
const snapshot = await ref.once('value');
this.instructor = snapshot.exists();
if (this.instructor) {
this.instructorKey = await this._read('key', 'string');
}
}
writeAttempt(week, problem, data)
{
const path = ['attempts', this.userid, week, problem];
return this._write(path, data);
}
writeStatus(week, problem, key, status)
{
const path = ['status', this.userid, week.toString(), problem.toString()];
let data = {};
data[key] = status;
data['time'] = firebase.database.ServerValue.TIMESTAMP;
return this._update(path, data);
}
readAttempt(week, problem)
{
const path = ['attempts', this.userid, week, problem];
return this._read(path, 'object');
}
readStudentAttempt(uid, week, problem)
{
const path = ['attempts', uid, week, problem];
return this._read(path, 'object');
}
monitorAttempt(week, problem, handler, on)
{
if (on === undefined)
on = true;
var path = ['attempts', this.userid, week, problem];
this._monitor(path, 'object', on, handler);
}
readSolution(week, problem)
{
const path = ['solutions', week, problem];
return this._read(path, 'object');
}
monitorStatus(handler)
{
var path = ['status', this.userid];
this._monitor(path, 'object', true, function(data) {
var table = new Table(['problem', 'week', 'grade', 'submitted', 'time']);
table.import(data, ['$week', '$problem', '%grade', '%submitted', '%time']);
table.createIndex(['week', 'problem']);
handler(table);
});
}
monitorAllStatus(handler)
{
var path = 'status';
this._monitor(path, 'object', true, function(data) {
var table = new Table(['userid', 'week', 'problem', 'grade', 'submitted', 'time']);
table.import(data, ['$userid', '$week', '$problem', '%grade', '%submitted', '%time']);
table.createIndex(['week', 'problem']);
handler(table);
});
}
monitorUsers(handler)
{
const path = 'users';
this._monitor(path, 'object', true, data => {
let table = new Table(['userid', 'email', 'firstName', 'lastName', 'role']);
table.import(data, ['$userid', '%email', '%firstName', '%lastName', '%role']);
handler(table);
});
}
readFeedback(week, problem)
{
const path = ['feedback', this.userid, week, problem];
return this._read(path, 'object');
}
readStudentFeedback(uid, week, problem)
{
const path = ['feedback', uid, week, problem];
return this._read(path, 'object');
}
readAll()
{
return this._read(null, 'object');
}
writeAll(data, handler)
{
return this._write(null, data, handler);
}
async readDraftGrades()
{
const data = await this._read(['draft-grades'], 'object');
let table = new Table(['userid', 'week', 'problem', 'grade']);
table.import(data, ['$userid', '$week', '$problem', '%grade']);
table.createIndex(['userid', 'week', 'problem']);
return table;
}
async isInstructor()
{
if (this.instructor === undefined)
await this.readInstructorStatus();
return this.instructor ? this.instructorKey : null;
}
readUserInfo(userid)
{
return this._read(['users', userid], 'object');
}
async getName() {
if (this.displayName !== undefined) {
return this.displayName;
}
else {
const {email, firstName, lastName} = await this._read(['users', this.userid], 'object');
this.email = email;
this.displayName = firstName + ' ' + lastName;
return this.displayName;
}
}
async getInstances() {
let instances = [];
const ref = rootRef.child('logic/instances');
const snap = await ref.once('value');
if (snap) {
snap.forEach(inst => {
const key = inst.key;
instances.push(key);
});
}
instances.sort();
return instances;
}
async instanceExists(inst)
{
let ref = rootRef.child('logic/instances');
const snapshot = await ref.once('value');
return snapshot.child(inst).exists();
}
async deploy(settings)
{
let instancename = settings['instance'];
const exists = await this.instanceExists(instancename);
if (exists) {
throw new Error('An instance named ' + instancename + ' already exists.');
}
else {
const solutions = await this._read('solutions', 'object', settings['oldinstance']);
const key = await this._read('key', 'string', settings['oldinstance']);
let data = { 'solutions': solutions,
'teachers': {},
'users': {},
'key': key
};
data.teachers[settings.instructoruid] = settings.instructoremail;
data.users[settings.instructoruid] = {
'email': settings.instructoremail,
'firstName': settings.instructorname,
'lastName': settings.instructorsurname
};
await this._update('', data, instancename);
}
}
}

var ToolbarBase, Toolbar, MainToolbar;
(function(){
"use strict";
class Button {
constructor(domelt, click)
{
this.domElt = domelt;
this.clickHandler = click;
this.enabled = true;
this.domElt.addEventListener('click', event => {
if (!this.enabled)
return;
this.domElt.classList.remove('pressed');
this.clickHandler(event);
}, false);
this.domElt.addEventListener('mousedown', event => {
if (this.enabled) {
this.domElt.classList.add('pressed');
}
}, false);
this.domElt.addEventListener('mouseout', event => {
if (this.enabled) {
this.domElt.classList.remove('pressed');
}
}, false);
}
enable(state)
{
this.enabled = state;
if (state)
this.domElt.classList.remove('disabled');
else
this.domElt.classList.add('disabled');
}
setTitle(title)
{
setText(this.domElt, title);
}
setAction(action)
{
this.clickHandler = action;
}
update(options)
{
if (options.title !== undefined) {
for (let i=0; i<this.domElt.childNodes.length; i++) {
let child = this.domElt.childNodes[i];
if (child.nodeType == 3) {
this.domElt.removeChild(child);
child = document.createTextNode(options.title);
this.domElt.appendChild(child);
break;
}
}
}
if (options.enabled !== undefined) {
this.enable(options.enabled);
}
if (options.action !== undefined) {
this.setAction(options.action);
}
}
}
class Menu {
constructor(parent, options, titleElt)
{
this.parent = parent;
let elts = {};
this.visible = false;
this.closing = false;
this.titleElt = titleElt;
this.items = [];
this.actions = [];
(new ElementRef(this.parent))
.child('div', {class:'menu'}).cap(this, 'domElt')
.child('ul').cap(elts, 'list');
if (options.width !== undefined)
this.domElt.style.width = options.width + 'px';
if (options.left !== undefined)
this.domElt.style.left = options.left + 'px';
for (let i=0; i<options.items.length; i++) {
(new ElementRef(elts.list)). child('li', options.items[i].text).cap(elts, 'item');
this.items[i] = elts.item;
if (options.items[i].disabled) {
elts.item.className = 'disabled';
}
else {
if (options.items[i].action) {
this.actions[i] = options.items[i].action;
(i => {
elts.item.addEventListener('click', event => {
if (this.actions[i]) {
this.hide();
this.actions[i](event);
}
}, false);
})(i);
}
if (options.items[i].separator) {
elts.item.className = 'separator disabled';
}
if (options.items[i].selected) {
elts.item.className = 'selected';
}
}
}
this._firstClick = event => {
var elt = event.target;
while (elt && elt !== this.menu)
elt = elt.parentElement;
if (elt !== this.menu && this.visible) {
this.hide();
this.closing = true;
}
}
this._lastClick = event => {
this.closing = false;
}
document.body.addEventListener('click', this._firstClick, true);
document.body.addEventListener('click', this._lastClick, false);
}
show() {
if (!this.closing) {
this.domElt.style.display = 'block';
this.visible = true;
}
}
hide() {
this.domElt.style.display = 'none';
this.visible = false;
}
remove() {
document.body.removeEventListener('click', this._firstClick, true);
document.body.removeEventListener('click', this._lastClick, false);
}
update(options)
{
if (options.title && this.titleElt) {
setText(this.titleElt, options.title);
}
if (options.items) {
options.items.forEach((item, i) => {
if (item.text !== undefined) {
setText(this.items[i], item.text);
}
if (item.action !== undefined) {
this.actions[i] = item.action;
}
if (item.disabled) {
this.items[i].className = 'disabled';
}
else if (item.disabled === false) {
this.items[i].className = '';
}
});
}
}
}
function copyObject(obj)
{
if (Array.isArray(obj)) {
return obj.map(o => copyObject(o));
}
else if (typeof obj == 'object') {
if (obj === null) {
return null;
}
else {
var result = { };
for (var id in obj) {
result[id] = copyObject(obj[id]);
}
return result;
}
}
else {
return obj;
}
}
class Breadcrumbs {
constructor(options, parent)
{
this.items = [];
this.parent = parent;
const ref = (new ElementRef(parent))
.child('ul', {class:'breadcrumb'});
options.forEach((opt, i) => {
var crumb = {};
this.items.push(crumb);
ref.child('li').cap(crumb,'elt')
.child('span', opt.text).cap(crumb,'text');
if (opt.menu) {
this.addMenu(opt.menu, i);
}
if (opt.action) {
crumb.elt.addEventListener('click', opt.action, false);
}
});
}
addMenu(menuOpt, i)
{
(new ElementRef(this.items[i].elt))
.child('span', {class: 'triangle-down'}).cap(this.items[i], 'menuElt');
menuOpt = copyObject(menuOpt);
menuOpt.left = this.items[i].elt.offsetLeft;
this.items[i].menu = new Menu(this.parent, menuOpt);
(m => {
this.items[i].elt.addEventListener('click', () => m.show(), false);
})(this.items[i].menu);
}
update(options)
{
options.forEach((opt, i) => {
if (opt) {
if (opt.text) {
setText(this.items[i].text, opt.text);
}
if (opt.menu && !this.items[i].menu) {
this.addMenu(opt.menu, i);
}
}
});
}
remove()
{
this.items.forEach(({menu}) => {
if (menu)
menu.remove();
});
}
}
class Nav {
constructor(options, parent, controller)
{
let elts = {};
this.controller = controller;
this.formatText = options.format || 'Problem {current} of {total}';
(new ElementRef(parent)) .child('div')
.child('span', navText(options.problem, options.numberOfProblems, this.formatText))
.cap(this, 'curProbField')
.sibling('div', '<', {class: 'button narrow'}).cap(elts, 'prev')
.sibling('div', '>', {class: 'button narrow'}).cap(elts, 'next');
this.currentProblem = options.problem;
this.numberOfProblems = options.numberOfProblems;
this.prevButton = new Button(elts.prev, () => {
if (this.currentProblem > 1) {
this.setCurrentProblem(this.currentProblem - 1);
}
});
this.nextButton = new Button(elts.next, () => {
if (this.currentProblem < this.numberOfProblems) {
this.setCurrentProblem(this.currentProblem + 1);
}
});
this.prevButton.enable(this.currentProblem > 1);
this.nextButton.enable(this.currentProblem < this.numberOfProblems);
}
setCurrentProblem(prob, act)
{
this.currentProblem = prob;
setText(this.curProbField, navText(this.currentProblem, this.numberOfProblems, this.formatText));
this.prevButton.enable(this.currentProblem > 1);
this.nextButton.enable(this.currentProblem < this.numberOfProblems);
if (act === undefined || act)
this.controller.goToProblem(prob);
}
update(options)
{
this.setCurrentProblem(options.problem, false);
}
}
function navText(curr, tot, formatText)
{
const re = /\{([^}]*)\}/g;
return formatText.replace(re, (match, p) => {
if (p == 'current')
return String(curr);
else if (p == 'total')
return String(tot);
else
return match;
});
}
class ToolbarText {
constructor(elt) {
this.elt = elt;
}
update(options) {
setText(this.elt, options.title);
if (options.color !== undefined) {
this.elt.className = 'status ' + options.color;
}
}
}
function locationLastComponent()
{
var path = window.location.pathname;
var comps = path.split('/');
return comps.pop();
}
function urlQueryString(url) {
if (/\.html$/.test(url)) {
url = url.slice(0,-5);
}
return 'url='+url;
}
ToolbarBase = class {
constructor(options, controller)
{
var elts = {};
this._controller = controller;
var ref = (new ElementRef(document.body))
.child('div', {class:'toolbar'}).cap(this, 'bar');
this.breadcrumbs = new Breadcrumbs(options.breadcrumbs, this.bar);
var rightDivs = [];
var tabs = options.tabs.slice(0);
tabs.push(100);
for (var i=0; i<tabs.length-1; i++) {
var left = tabs[i];
var right = 100 - tabs[i+1];
var div = document.createElement('div');
div.setAttribute('style', 'left:'+left+'%;right:'+right+'%');
this.bar.appendChild(div);
rightDivs.push(div);
}
this.contents = { };
for (var name in options.contents) {
var c = options.contents[name];
var elt;
var tab = rightDivs[c.tab];
switch (c.type) {
case 'nav':
elt = new Nav(c, tab, controller);
break;
case 'button':
(new ElementRef(tab))
.child('div')
.child('div', c.title, {class: 'button'}).cap(elts, 'actionbtn')
.sibling('span', '_', {style:'color:rgba(0,0,0,0)'});
var act = c.action;
elt = new Button(elts.actionbtn, c.action);
if (c.enabled !== undefined) {
elt.enable(c.enabled);
}
break;
case 'menu':
(new ElementRef(tab)) .child('div', {class:'account'})
.child('span').cap(elts, 'menu')
.child('span', c.title).cap(elts, 'menutitle')
.sibling('span', {class: 'triangle-down'});
elt = new Menu(this.bar, c, elts.menutitle);
(e => {
elts.menu.addEventListener('click', () => e.show(), false);
})(elt);
break;
case 'text':
(new ElementRef(tab)) .child('div', c.title, {class: 'status'}).cap(elts, 'text');
if (c.color) {
elts.text.className = 'status ' + c.color;
}
elt = new ToolbarText(elts.text);
break;
default:
elt = null;
break;
}
this.contents[name] = elt;
}
this._mouseBlocker = event => event.stopPropagation();
}
disable()
{
this.bar.addEventListener('click', this._mouseBlocker, true);
}
enable()
{
this.bar.removeEventListener('click', this._mouseBlocker, true);
}
remove()
{
for (var id in self.contents) {
var elt = this.contents[id];
if (elt.remove !== undefined)
elt.remove();
}
this.bar.parentElement.removeChild(this.bar);
}
update(options)
{
for (var name in options) {
var elt = this.contents[name];
if (elt)
elt.update(options[name]);
}
if (options.breadcrumbs) {
this.breadcrumbs.update(options.breadcrumbs);
}
}
static accountMenu(controller, options)
{
var menuItems = [
{ text: 'Log Out',
action: () => controller.logOut()
},
{ text: 'Change Password',
action: () => {
var last = locationLastComponent();
var u = "change_password.html?" + urlQueryString(last);
window.location = u;
}
},
{ text: '', separator: true },
{ text: 'Syllabus',
action: () => window.location = 'syllabus.html'
},
{ text: '', separator: true },
{ text: 'World',
action: () => window.location = 'world.html'
},
{ text: 'Parse Tree',
action: () => window.location = 'parsetree.html'
},
{ text: 'Proof',
action: () => window.location = 'proofeditor.html'
}
];
if (!options.username && options.username !== '') {
menuItems[0] = {
text: 'Log In',
action: () => {
var last = locationLastComponent();
var u = "login.html?" + urlQueryString(last);
window.location = u;
}
};
}
return menuItems;
}
}
Toolbar = class extends ToolbarBase {
constructor(options, controller)
{
const semester = getCurrentSemester()
const label = semester.unitLabel()
let layout = { };
layout.breadcrumbs = [ { text: 'Home',
action: () => controller.goHome() },
{ text: label + ' ' + options.week } ];
layout.tabs = [ 25, 62 ];
layout.contents = { };
layout.contents.nav = {
type: 'nav',
tab: 0,
problem: options.problem,
numberOfProblems: options.numberOfProblems
};
layout.contents.status = {
type: 'text',
tab: 0,
title: options.statusString
};
if (options.statusColor !== undefined)
layout.contents.status.color = options.statusColor;
layout.contents.action = {
type: 'button',
tab: 1,
title: options.actionString,
action: options.action
};
if (options.actionEnabled !== undefined)
layout.contents.action.enabled = options.actionEnabled;
layout.contents.account = {
type: 'menu',
tab: 1,
title: options.username,
items: ToolbarBase.accountMenu(controller, options)
};
super(layout, controller);
}
update(options)
{
const semester = getCurrentSemester()
const label = semester.unitLabel()
let upd = { };
if (options.statusString) {
upd.status = { title: options.statusString };
if (options.statusColor !== undefined)
upd.status.color = options.statusColor;
}
if (options.actionString) {
upd.action = {
title: options.actionString,
action: options.action,
enabled: options.actionEnabled === undefined ? true : options.actionEnabled
};
}
if (options.week) {
upd.breadcrumbs = [ null, {text: label + ' ' + options.week} ];
}
if (options.numberOfProblems !== undefined) {
upd.nav = { problem: 1 };
}
super.update(upd);
}
}
MainToolbar = class extends ToolbarBase {
constructor(options, controller)
{
let layout = {};
let bc = {text: 'Home' };
if (options.instructor) {
bc.menu = this.instructorMenuOptions(options.key);
}
layout.breadcrumbs = [ bc ];
layout.tabs = [ 25 ];
layout.contents = {
account: {
type: 'menu',
tab: 0,
title: options.username,
items: ToolbarBase.accountMenu(controller, options)
}
};
super(layout, controller);
}
update(options)
{
let bopt = {};
if (options.instructor) {
const bc = { menu: this.instructorMenuOptions(options.key) };
bopt.breadcrumbs = [bc];
}
if (options.username) {
bopt.account = { title: options.username };
}
super.update(bopt);
}
instructorMenuOptions(key)
{
return {
items: [ {
text: 'Gradebook',
action: () => {
if (typeof DEPLOYED == 'undefined') {
window.location = 'gradebook.html';
}
else {
window.location = 'gradebook-' + key + '.html';
}
}
},
{
text: 'Lessons',
selected: true
}
]
};
}
}
}());

"use strict";
class Animation {
constructor(delta, animate)
{
this.start = null;
this.done = false;
this.delta = delta;
this.animate = animate;
}
step(timestamp)
{
if (this.done)
return true;
if (this.start === null)
this.start = timestamp;
let t = (timestamp - this.start) / 1000;
this.time = t;
if (this.delay !== undefined) {
t -= this.delay;
if (t < 0)
return;
}
let d = this.delta(t);
if (d > 1)
d = 1;
this.animate(d, this);
if (d === 1) {
this.done = true;
this.end = timestamp;
}
return this.done;
}
getEndTime()
{
let d0 = this.delta(0);
let d1 = this.delta(1);
let t = (1 - d0) / (d1-d0);
let d = this.delay || 0;
return d + t;
}
reverse(baseTime)
{
let result = new Animation(this.delta, (d, a) =>
this.animate(Math.min(1, 1-d), a) );
result.delay = baseTime - this.getEndTime();
return result;
}
dilate(d)
{
if (this.delay)
this.delay *= d;
let delta = this.delta;
this.delta = t => delta(t) / d;
}
}
class AnimationList {
constructor(items)
{
this.list = items ? items.slice() : [];
}
addAnimation(a)
{
this.list.push(a);
}
start()
{
window.requestAnimationFrame(doStep);
let list = this.list;
function doStep(timestamp)
{
if (!list.reduce((done, item) => item.step(timestamp) && done, true))
window.requestAnimationFrame(doStep);
}
}
getReverse()
{
let t = this.list.reduce((t, a) => Math.max(t, a.getEndTime()), 0);
let items = this.list.map(a => a.reverse(t));
return new AnimationList(items);
}
dilate(d)
{
this.list.forEach(d => dilate(d));
}
}
var EssayUI;
(function(){
"use strict";
EssayUI = class {
constructor(data, parent, controller)
{
this.controller = controller;
this.parent = parent;
this.onRemove = [];
this.properties = data.ui_properties || { editable: true, gradable: false, feedback: true};
this.editor = null;
this.feedbackEditor = null;
let ref = (new ElementRef(parent))
.child('div', {'class': 'translation-container'}) .cap(this, 'container')
.child('p', {'class': 'message'}) .cap(elt => elt.innerHTML = data.message || "");
if (this.properties.feedback) {
let ed, fb=null;
if (data.feedback && data.feedback.studentInfo)
fb = data.feedback.studentInfo.comments || null;
[ref, ed] = this.addEditor(ref, fb, {theme: 'bubble', readOnly: true}, "Feedback");
[ref, this.editor] = this.addEditor(ref, data.content, { theme: 'bubble', readOnly: true}, "Your Answer");
}
else if (this.properties.gradable) {
[ref, this.editor] = this.addEditor(ref, data.content, { theme: 'bubble', readOnly: true}, "Student Response");
[ref, this.feedbackEditor] = this.addEditor(ref, null, { theme: 'snow'}, "Feedback to Student");
}
else {
[ref, this.editor] = this.addEditor(ref, data.content, {theme: 'snow', placeholder: 'Your answer here'});
}
}
addEditor(ref, content, options, label)
{
let e = {}
ref = ref.sibling('div', {'class': 'editor-content'}).cap(e, 'content')
if (options.theme !== 'bubble')
ref.elt.classList.add('active')
const editor = new Quill(e.content, options)
this.toolbar = editor.getModule('toolbar').container
if (content)
editor.setContents(content)
if (label) {
let lref = ref
if (options.theme === 'snow')
lref = new ElementRef(editor.getModule('toolbar').container)
lref.child('label', label)
}
const handler = (delta, oldDelta, source) => this.handleEdit(delta, oldDelta, source)
editor.on('text-change', handler)
this.onRemove.push(() => editor.off('text-change', handler))
return [ref, editor]
}
export()
{
return {content: this.editor.getContents()}
}
feedback()
{
return {comments: this.feedbackEditor.getContents()}
}
remove()
{
this.onRemove.forEach(f => f())
this.parent.removeChild(this.container)
}
handleEdit(delta, oldDelta, source)
{
if (this.controller) {
if (source === 'user' && this.properties.editable)
this.controller.attemptChanged(this)
}
}
}
}());
var Account;
(function(){
"use strict";
function goBack()
{
var params = parseURLQuery();
var url = params['url'] || "index.html";
if (!/\.html$/.test(url))
url += '.html';
window.location = url;
}
function login(email, password)
{
var server = new Server(didLogin, loggedOut);
function didLogin(userid, email)
{
goBack();
}
function loggedOut()
{
server.login(email, password);
}
}
Account = {
login: function()
{
var emailElt = document.getElementById("emailfield");
var passElt = document.getElementById("passwordfield");
var email = emailElt.value;
var password = passElt.value;
login(email, password);
},
create: function()
{
var nombre = document.getElementById("firstnamefield");
var apellido = document.getElementById("lastnamefield");
var correo = document.getElementById("newemailfield");
var contrasenia = document.getElementById("newpasswordfield");
var confirmar = document.getElementById("confirmpasswordfield");
var firstName = nombre.value;
var lastName = apellido.value;
var email = correo.value.toLowerCase();
var password = contrasenia.value;
var password2 = confirmar.value;
const ids = ['fnerror', 'lnerror', 'emailerror', 'passerror', 'conferror'];
for (var i=0; i<ids.length; i++) {
var id = document.getElementById(ids[i]);
id.innerHTML = '&nbsp;';
}
var errcount = 0;
if (firstName.match(/^ *$/)) {
error('fnerror', 'You must enter your first name.');
errcount++;
}
if (lastName.match(/^ *$/)) {
error('lnerror', 'You must enter your last name.');
errcount++;
}
if (!email.match(/.*@uis\.edu$/)) {
error('emailerror', 'You must enter a valid UIS email address.');
errcount++;
}
if (password.match(/^ *$/)) {
error('passerror', 'You must enter a password.');
errcount++;
}
if (password !== password2) {
error('conferror', 'Passwords must match.');
errcount++;
}
if (errcount)
return;
if (createAccountServer) {
createAccountServer.createAccount(email, password, firstName, lastName)
.then(() => {
alert('Account created successfully');
window.location = 'index.html';
}).catch(err => alert(err.message));
}
function error(id, msg)
{
var id = document.getElementById(id);
setText(id, msg);
}
},
resetPassword: function()
{
var server = new Server(function(){}, function(){});
var elt = document.getElementById("emailfield");
var email = elt.value.toLowerCase();
if (!email.match(/.*@uis\.edu$/)) {
alert("Email address entered incorrectly.");
}
else {
firebase.auth().sendPasswordResetEmail(email).then(function() {
alert('A password reset email has been sent to ' + email + '.');
}).catch(function(error) {
if (error = 'auth/user-not-found') {
alert('There is no user with the email address ' + email + '.');
}
else {
alert('The password reset could not be performed.');
}
});
}
},
change: async function()
{
var nueva = document.getElementById("newpasswordfield");
var confirmar = document.getElementById("confirmpasswordfield");
var newpass = nueva.value;
var newpass2 = confirmar.value;
for (const id of ['newpasserror', 'conferror']) {
const elt = document.getElementById(id);
elt.innerHTML = '&nbsp;';
}
var errcount = 0;
if (newpass.match(/^ *$/)) {
error('newpasserror', 'You must choose a new password.');
errcount++;
}
if (newpass !== newpass2) {
error('conferror', 'Passwords must match.');
errcount++;
}
if (errcount)
return;
if (changePassServer) {
try {
await changePassServer.changePassword(newpass);
alert("Password successfully changed.")
goBack();
}
catch (err) {
alert('Error changing password: ' + err);
}
}
else {
alert('Your password could not be changed at this time.');
goBack();
}
function error(id, msg)
{
var id = document.getElementById(id);
setText(id, msg);
}
},
cancelChange: function()
{
goBack();
}
}
}());

const DEPLOYED=true;