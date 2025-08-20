"use strict";
function modelForProblem(data)
{
var result;
switch(data['class']) {
case 'world':
result = new WorldData(data);
break;
case 'translation':
result = new TranslationData(data);
break;
case 'parse':
result = new ParseTreeData(data);
break;
case 'proof':
result = new ProofModel(data);
break;
case 'essay':
result = new EssayModel(data);
break;
default:
return null;
}
return result;
}
function newGradeResult() {
return {
defaultGrade: null,
isCorrect: true,
instructorComments: '',
instructorInfo: {}
}
}
class WorldData {
constructor (problemData)
{
if (typeof(problemData) == "string")
problemData = JSON.parse(problemData);
this.model = new ChessboardModel(problemData.pieces);
var sent = problemData.sentences;
sent = sent.filter(s => s !== null && !/^ *$/.test(s));
var ee = sent.map(parseSentence);
this.sentences = ee.filter(e => e);
this.syntaxErrorCount = ee.length - this.sentences.length;
}
predicates(s) {
if (s === undefined)
s = this.sentences;
return s.reduce((t, sent) => t.concat(predicatesUsed(sent)), []);
}
atoms(s) {
if (s === undefined)
s = this.sentences;
return s.reduce((t, sent) => t.concat(atomsUsed(sent)), []);
}
connectives(s) {
if (s === undefined)
s = this.sentences;
var con = s.map(sent => connectivesUsed(sent));
return con.reduce((t,a) => t.concat(a), []);
}
gradeSentences(expected)
{
var s = this.sentences;
var result = newGradeResult();
if (expected === undefined)
expected = true;
if (!Array.isArray(expected)) {
expected = Array(s.length).fill(expected);
}
result.instructorInfo.sentences = s.map((sent, i) =>
sent ? expected[i] === this.model.eval(sent) : false
);
var ecount = result.instructorInfo.sentences.filter(v => !v).length;
if (ecount) {
result.isCorrect = false;
result.instructorComments += 'At least one incorrect sentence.\n';
}
result.defaultGrade = (1.0 * (s.length - ecount)) / s.length;
result.errorCount = { err: ecount, total: s.length };
return result;
}
}
function predicatesUsed(expr)
{
switch(expr.op) {
case 'PRED':
return [expr.args[0].atom];
case 'EQUAL':
return ['='];
case 'NAME':
case 'FUNC':
return [];
case 'NOT':
if (expr.args[0].op == 'EQUAL')
return ['!='];
default:
return expr.args.reduce((t, a) => t.concat(predicatesUsed(a)), []);
}
}
function connectivesUsed(expr)
{
var result = [];
switch(expr.op) {
case 'PRED':
case 'FUNC':
case 'NAME':
case 'EQUAL':
return [];
case 'AND':
case 'OR':
case 'IF':
case 'IFF':
case 'NOT':
result = [expr.op];
default:
return expr.args.reduce((t, a) => t.concat(connectivesUsed(a)), result);
}
}
function atomsUsed(expr)
{
switch(expr.op) {
case 'PRED':
case 'EQUAL':
case 'EET':
return [expr.stringify()];
case 'NAME':
case 'FUNC':
return [];
default:
return expr.args.reduce((t, e) => t.concat(atomsUsed(e)), []);
}
}
class TranslationData {
constructor (problemData)
{
this.sentences = problemData.sentences.slice(0);
}
match(arr) {
let result = newGradeResult();
if (arr.length < this.sentences.length) {
result.instructorComments = "Needs grading.";
result.instructorInfo.comments = this.sentences.map(s => null);
return result;
}
arr = arr.map(a => typeof a === 'string' ? [a] : a);
const parsed = arr.map(a => a.map(parseSentence));
result.instructorInfo.comments = this.sentences.map((s,i) => {
const expr = parseSentence(s);
if (!expr)
return 'Sentence is not well-formed. Correct answer: ' + arr[i][0];
else if (parsed[i].find(p => FOLEquivalent(expr, p) === 'equivalent'))
return null;
else
return 'Translation: '+arr[i][0];
});
result.isCorrect = result.instructorInfo.comments.every(c => c === null);
if (!result.isCorrect) {
result.instructorComments = 'Needs grading.';
}
return result;
}
}
class ParseTreeData {
constructor(data)
{
if (typeof(data) === 'string')
this.data = JSON.parse(data);
else
this.data = JSON.parse(JSON.stringify(data));
this.sentences = (this.data.sentences || []).map(parseSentence);
}
expandCount()
{
var err = {err: 0, total: 0};
if (!this.sentences || !this.data.cstate)
return err;
var m = new TreeMap(this.sentences);
var cs = this.data.cstate.join('');
var cidx = 0;
m.forEach(sent => {
var first = cs.charAt(cidx++);
if (sent.op === 'PRED' || sent.op === 'EQUAL' || sent.op == 'NAME') {
return false;
}
err.total++;
if (first === 'X') {
err.err++;
return false;
}
else {
return true;
}
});
return err;
}
mistakeCount()
{
return this.data.ecount;
}
truthTableErrorCount()
{
var ecount = {err: 0, total: 0};
if (!this.data.tt)
return ecount;
var ttd = new TruthTableData(this.sentences);
var trows = ttd.getAllRows();
var d = this.data.tt;
d = d[0].map((col, i) => d.map(row => row[i]));
d.forEach((data, row) => {
var model = new TTModel(ttd.getSentences(), trows[row]);
var map = new TreeMap(this.sentences);
map.import(data);
map.forEach((e, n) => {
var isAtom = ['NOT','AND','OR','IF','IFF'].indexOf(e.op) < 0;
if (!isAtom) {
ecount.total++;
if (n.value !== model.eval(e)) {
ecount.err++;
}
}
return this.data.enforceTree && !isAtom;
});
});
return ecount;
}
tautology()
{
return this.implies();
}
implies()
{
var sent = this.sentences.slice(0);
var last = sent[sent.length-1];
sent[sent.length-1] = new Expression('NOT', last);
return !isConsistent(sent);
}
equivalent()
{
return areEquivalent(this.sentences[0], this.sentences[1]);
}
contradiction()
{
return !isConsistent(this.sentences);
}
classifiedCorrectly()
{
var choice = (this.data.sel == 1);
var result;
switch(this.data.entryType) {
case 'taut':
result = this.tautology();
break;
case 'equiv':
result = this.equivalent();
break;
case 'impl':
result = this.implies();
break;
case 'contr':
result = this.contradiction();
break;
default:
return false;
}
return (choice === result);
}
}
class EssayModel {
constructor(data) {
this.response = data
}
}
