var HomeworkSolutions;
(function(){
"use strict";
const solutions = {
'01_01': function(m) {
const predicates = [
"=", "!=", "Square", "Diamond", "Octagon", "Large", "Small", "Above", "Below", "SameRow", "SameColumn", "SameShape", "SameSize", "LeftOf", "RightOf", "Between"
];
var result = m.gradeSentences();
var serr = result.errorCount;
var perr = { err: 0, total: predicates.length };
var diff = difference(predicates, m.predicates());
if (diff.length > 0) {
markError(result, 'Predicates unused: ' + diff.join(', '));
perr.err = diff.length;
}
result.defaultGrade = weightScores([serr, perr], [1, 1]);
return result;
},
'01_02': function(m) {
const predicates = [
"=", "!=", "Square", "Diamond", "Octagon", "Large", "Small", "Above", "Below", "SameRow", "SameColumn", "SameShape", "SameSize", "LeftOf", "RightOf", "Between"
];
var result = m.gradeSentences();
var serr = result.errorCount;
var perr = { err: 0, total: predicates.length };
var diff = difference(predicates, m.predicates());
if (diff.length > 0) {
markError(result, 'Predicates unused: ' + diff.join(', '));
perr.err = diff.length;
}
result.defaultGrade = weightScores([serr, perr], [1, 1]);
return result;
},
'01_03': function(m) {
return m.gradeSentences();
},
'02_01': function(m) {
return m.gradeSentences();
},
'02_02': function(m) {
return m.gradeSentences([true, false, true, false, true, false]);
},
'02_03': function(m) {
return m.gradeSentences();
},
'02_04': function(m) {
var result = m.gradeSentences();
var serr = result.errorCount;
var merr = { err: 0, total: 1 };
var disallowed = uniqueDifference(m.atoms(), ['Square(a)','Square(b)']);
if (disallowed.length) {
markError(result, 'Disallowed predicates used: ' + disallowed.join(', '));
merr.err = 1;
}
const connectives = ['AND','OR','NOT','IF','IFF'];
var cerr = { err: 0, total: connectives.length };
var unused = difference(connectives, m.connectives());
if (unused.length) {
markError(result, 'Connectives unused: ' + unused.join(', '));
cerr.err = unused.length;
}
result.defaultGrade = weightScores([serr, merr, cerr], [2, 1, 2]);
delete result.errorCount;
return result;
},
'03_01': function(m) {
const answers = [
"LikesCookies(amy) | (IsHungry(brett) & IsHungry(craig))",
"IsSad(sarah) & IsSad(michael)",
"HasCats(amy) & HasCats(brett) & ~HasCats(sarah) & ~HasCats(michael)",
"HasCats(craig) | (LikesCookies(sarah) & LikesCookies(amy))",
"(IsHappy(amy) & IsHappy(sarah)) | (IsHungry(amy) & IsHungry(sarah))",
"IsHungry(sarah) & ~LikesCookies(sarah)",
"IsSad(michael) -> IsSad(sarah)",
"IsSad(michael) -> (IsHappy(amy) & IsHappy(brett))",
"~IsSad(amy) -> LikesCookies(craig)",
"LikesCookies(brett) -> (~IsHungry(michael) & ~IsHungry(sarah))",
"IsHappy(sarah) -> IsHappy(michael)",
"~(IsHappy(amy) & IsHappy(brett)) -> ~IsHappy(craig)",
"(HasCats(brett) & LikesCookies(craig)) -> IsHappy(amy)","IsHappy(sarah) <-> HasCats(sarah)",
"IsHappy(michael) -> HasCats(sarah)",
"(HasCats(amy) & IsHappy(brett)) | IsSad(craig)"];
return m.match(answers);
},
'03_02': function(m) {
return m.gradeSentences();
},
'04_01': function(m) {
const rubric = [{weight: 1, message: 'At least one tree not fully expanded.'}];
var ee = m.expandCount();
return gradeWithRubric(rubric, [ee]);
},
'04_02': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'At least one mistake.' } ];
var ee = m.expandCount();
var mm = parseTreeMistakeScore(m.mistakeCount());
return gradeWithRubric(rubric, [ee, mm]);
},
'04_03': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'Incorrect truth table(s).' },
{ weight: 1, message: 'At least one mistake.' } ];
var ee = m.expandCount();
var tt = m.truthTableErrorCount();
var mm = parseTreeMistakeScore(m.mistakeCount());
return gradeWithRubric(rubric, [ee, tt, mm]);
},
'04_04': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'Incorrect truth table(s).' },
{ weight: 1, message: 'At least one mistake.' } ];
var ee = m.expandCount();
var tt = m.truthTableErrorCount();
var mm = parseTreeMistakeScore(m.mistakeCount());
return gradeWithRubric(rubric, [ee, tt, mm]);
},
'04_05': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'Incorrect truth table(s).' },
{ weight: 1, message: 'At least one mistake.' } ];
var ee = m.expandCount();
var tt = m.truthTableErrorCount();
var mm = parseTreeMistakeScore(m.mistakeCount());
return gradeWithRubric(rubric, [ee, tt, mm]);
},
'05_01': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'Incorrect truth table(s).' } ]
var ee = m.expandCount();
var tt = m.truthTableErrorCount();
return gradeWithRubric(rubric, [ee, tt]);
},
'05_02': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'Incorrect truth table(s).' } ]
var ee = m.expandCount();
var tt = m.truthTableErrorCount();
return gradeWithRubric(rubric, [ee, tt]);
},
'05_03': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'Incorrect truth table(s).' },
{ weight: 1, message: 'Incorrect classification.' } ];
var ee = m.expandCount();
var tt = m.truthTableErrorCount();
var mm = { total: 1, err: m.classifiedCorrectly() ? 0 : 1 };
return gradeWithRubric(rubric, [ee, tt, mm]);
},
'05_04': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'Incorrect truth table(s).' },
{ weight: 1, message: 'Incorrect classification.' } ];
var ee = m.expandCount();
var tt = m.truthTableErrorCount();
var mm = { total: 1, err: m.classifiedCorrectly() ? 0 : 1 };
return gradeWithRubric(rubric, [ee, tt, mm]);
},
'05_05': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'Incorrect truth table(s).' },
{ weight: 1, message: 'Incorrect classification.' } ];
var ee = m.expandCount();
var tt = m.truthTableErrorCount();
var mm = { total: 1, err: m.classifiedCorrectly() ? 0 : 1 };
return gradeWithRubric(rubric, [ee, tt, mm]);
},
'06_01': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'06_02': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'06_03': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'06_04': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'06_05': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'07_01': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'07_02': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'07_03': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'07_04': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'07_05': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'07_06': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'08_01': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'08_02': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'08_03': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'08_04': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'08_05': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'08_06': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'09_01': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'09_02': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'09_03': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'09_04': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'09_05': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'09_06': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'10_01': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'10_02': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'10_03': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'10_04': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'10_05': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'10_06': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'11_01': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'11_02': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'11_03': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'11_04': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'11_05': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'12_01': function(m) {
return m.gradeSentences();
},
'12_02': function(m) {
return m.gradeSentences();
},
'12_03': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'At least one mistake.' } ];
var ee = m.expandCount();
var mm = parseTreeMistakeScore(m.mistakeCount());
return gradeWithRubric(rubric, [ee, mm]);
},
'12_04': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'At least one mistake.' } ];
var ee = m.expandCount();
var mm = parseTreeMistakeScore(m.mistakeCount());
return gradeWithRubric(rubric, [ee, mm]);
},
'12_05': function(m) {
const rubric = [ { weight: 1, message: 'At least one tree not fully expanded.' },
{ weight: 1, message: 'At least one mistake.' } ];
var ee = m.expandCount();
var mm = parseTreeMistakeScore(m.mistakeCount());
return gradeWithRubric(rubric, [ee, mm]);
},
'13_01': function(m) {
const answers = [
"Ax (Diamond(x) -> Large(x))",
"Ex (Diamond(x) & Large(x))",
"Ex (Small(x) & Diamond(x) & Green(x))",
"Ax (Diamond(x) -> Small(x)) & Ex (Octagon(x) & Small(x))",
"Ax ((Square(x) | Diamond(x)) -> Large(x))",
"Ax (Square(x) -> (Large(x) & Blue(x)))",
"Ax (Square(x) -> (Large(x) | Small(x)))",
"Ex Ey (Diamond(x) & Square(y) & Above(x, y))",
"~Ax (Square(x) -> Blue(x))",
"~Ex (Square(x) & Green(x))",
"Ex (Octagon(x) & ~Large(x))",
"Ex (Octagon(x) & Large(x) & ~Red(x))"
];
return m.match(answers);
},
'14_01': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'14_02': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'14_03': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'14_04': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'14_05': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'15_01': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'15_02': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'15_03': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'15_04': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'15_05': function(m) {
return basicGrade(m.isCorrect(), 'Proof has mistakes.');
},
'16_01': () => basicGrade(false, ''),
'16_02': () => basicGrade(false, ''),
'16_03': () => basicGrade(false, ''),
'16_04': () => basicGrade(false, ''),
'16_05': () => basicGrade(false, '')
}
function difference(arr1, arr2)
{
var ob = {};
arr2.forEach(a => ob[a]=a);
return arr1.filter(a => ob[a] === undefined);
}
function uniqueDifference(arr1, arr2)
{
arr1.sort();
return arr1.filter((a, i) => (i === 0 || a !== arr1[i-1]) && arr2.indexOf(a) < 0);
}
function parseTreeMistakeScore(n)
{
const counts = [0, 2, 2, 2, 2, 2, 1, 1, 1, 1];
var tot = counts.reduce((t,c) => t+c, 0);
var err = counts.slice(0,n).reduce((t,c) => t+c, 0);
return {err: err, total: tot};
}
function parseTreeExpandPenalty(ecount, tot)
{
if (ecount.total === 0)
return 0;
else
return tot * (ecount.err * 1.0) / (ecount.total * 1.0);
}
function weightScores(earr, warr)
{
var wtot = warr.reduce((n,w) => n+w, 0);
var raw = earr.reduce((n, e, i) =>
n + warr[i] * (e.total - e.err) / e.total, 0);
return raw / wtot;
}
function basicGrade(correct, err)
{
return {
defaultGrade: null,
isCorrect: correct,
instructorComments: correct ? '' : err,
instructorInfo: {}
}
}
function newResult()
{
var result = {
defaultGrade: 0,
isCorrect: false,
instructorComments: '',
instructorInfo: {}
}
return result;
}
function markError(result, errMsg)
{
result.isCorrect = false;
result.instructorComments += errMsg + '\n';
}
function gradeWithRubric(rubric, scores)
{
var result = newResult();
var weights = rubric.map(r => r.weight);
result.defaultGrade = weightScores(scores, weights);
result.isCorrect = !scores.some(s => s.err);
result.instructorComments = rubric.reduce((m, r, i) =>
(scores[i].err) ? m + r.message + '\n' : m, '');
return result;
}
HomeworkSolutions = {
solution: function(week, problem)
{
var probid = String('0'+week).slice(-2) + '_' + String('0'+problem).slice(-2);
return solutions[probid];
}
}
}());

