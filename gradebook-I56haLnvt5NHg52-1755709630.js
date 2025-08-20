
(function(){
"use strict";
let iServer = null;
function login(onauth)
{
if (!iServer) {
iServer = new Server(loggedIn, loggedOut);
}
function loggedIn(userid, email, server)
{
onauth();
}
function loggedOut(server)
{
const last = locationLastComponent();
window.location = "login.html?" + urlQueryString(last);
}
}
document.addEventListener('DOMContentLoaded', () => {
login(() => new InstructorUI(document.body))
}, false);
function problemNeedsGrading(row)
{
return row.attempt && row.submitted && row.grade === null;
}
function fixAttempt(attempt, week, problem)
{
let admin = { ui_properties: {
editable: false,
feedback: false,
gradable: true
}};
return makeHomeworkData(attempt, Homework.getProblem(week, problem), admin);
}
class GradebookData {
constructor(controller)
{
this.controller = controller;
this._users = new Table(['userid', 'email', 'firstName', 'lastName', 'role']);
this._db = new Table(['userid', 'week', 'problem', 'attempt', 'feedback', 'notes', 'grade', 'submitted', 'time', 'source']);
iServer.readDraftGrades().then(tbl => this._loadDraftGrades(tbl));
}
_fixAttempts()
{
this._db.update(row => {
if (row.attempt) {
row.attempt = fixAttempt(row.attempt, row.week, row.problem);
}
});
}
_gradeProblems()
{
this._db.update(row => {
if (problemNeedsGrading(row)) {
this._gradeProblem(row);
}
});
}
_gradeProblem(row)
{
const attempt = row.attempt;
const week = row.week;
const problem = row.problem;
const answer = HomeworkSolutions.solution(week, problem);
const model = modelForProblem(attempt);
const result = answer(model);
row.notes = result;
if (result.isCorrect && row.grade === null) {
row.grade = Homework.maxPoints(week, problem);
row.source = 'draft';
}
}
_makeHomeworkBase()
{
let t = new Table(['week', 'problem']);
for (let i=1; i<=Homework.numberOfWeeks(); i++) {
for (let j=1; j<=Homework.numberOfProblems(i); j++) {
t.insert([i,j], ['week','problem']);
}
}
return t;
}
setGrade(id, data)
{
const map = {'userid': id.userid, 'week': id.week, 'problem': id.problem};
this._db.doWhereEqual(map, r => {
let update = {};
if ('grade' in data) {
r.grade = data.grade;
const key = ['/draft-grades', map.userid, map.week, map.problem, 'grade'].join('/');
update[key] = data.grade;
r.source = 'draft';
}
if ('feedback' in data) {
r.feedback = data.feedback;
const key = ['/feedback', map.userid, map.week, map.problem].join('/');
update[key] = JSON.stringify(data.feedback);
}
iServer._update(null, update).catch(err => alert(err));
});
}
getUsers()
{
return this._users.select();
}
getUserInfo(userid)
{
const idx = this._users.getIndexOf({'userid': userid})
if (idx >= 0) {
const row = this._users.getRow(idx)
let result = {}
for (let k in row)
result[k] = row[k]
return result
}
else {
return null
}
}
async loadAttempt(userid, week, problem)
{
const data = await iServer.readStudentAttempt(userid, week, problem);
let row = this._db.getData({userid: userid, week: week, problem: problem});
if (row) {
row.attempt = fixAttempt(data, week, problem);
this._gradeProblem(row);
return row;
}
else {
throw new Error('No data: '+userid + ', ' + week + ', ' + problem);
}
}
async loadData(id)
{
const map = { userid: id.userid, week: id.week, problem: id.problem };
const idx = this._db.getIndexOf(map);
let r = this._db.getRow(idx);
if (r.attempt === null) {
r = await this.loadAttempt(id.userid, id.week, id.problem);
}
if (r.feedback === null) {
const data = await iServer.readStudentFeedback(id.userid, id.week, id.problem);
r.feedback = (data === null) ? {} : data;
}
let newRow = {};
for (let k in r) {
newRow[k] = r[k];
}
for (let k in map) {
newRow[k] = map[k];
}
return newRow;
}
getData(columns, map)
{
const tbl = this._db.selectWhereEqual(columns, map);
return tbl.innerJoin(this._users);
}
getDataForWeek(userid, week)
{
return this._db.selectWhereEqual( null, {'userid': userid, 'week': week} );
}
getTotal(userid)
{
let tbl = this._db.selectWhereEqual(null, {'userid': userid});
let total = 0;
tbl.forEach(row => {
if (row.grade || row.grade === 0)
total += row.grade;
});
return total;
}
getProblemsToGrade(gradeAhead, onlyNG)
{
let tbl = this._db.innerJoin(this._users.select(['userid']));
return tbl.select(null, row => toGrade(row, gradeAhead, onlyNG));
function toGrade(row, gradeAhead, onlyNG)
{
let result = row.submitted && row.grade === null;
if (result && !gradeAhead) {
result = MyDate.today().daysSince(Homework.dueDate(row.week)) > 0;
}
return result;
}
}
needsGrading(userid, week, problem)
{
let row = this._db.getData({userid: userid, week: week, problem: problem});
return row && problemNeedsGrading(row);
}
needsUpload()
{
let tbl = this._db.innerJoin(this._users.select(['userid']));
tbl = tbl.select(null, row => row.grade !== null && row.source === 'draft');
return tbl.numberOfRows() > 0;
}
async uploadGrades()
{
const tbl = this._db.select(null, row => row.grade !== null && row.source === 'draft');
const stat = tbl.select(['userid', 'week', 'problem', 'grade']);
const fb = tbl.select(['userid', 'week', 'problem', 'feedback']);
const notes = tbl.select(['userid', 'week', 'problem', 'notes']);
let result = {};
stat.forEach(function(row) {
const key = ['/status', row.userid, row.week, row.problem, 'grade'].join('/');
result[key] = row.grade;
});
fb.forEach(function(row) {
const key = ['/feedback', row.userid, row.week, row.problem].join('/');
result[key] = JSON.stringify(row.feedback);
});
notes.forEach(function(row) {
const key = ['/notes', row.userid, row.week, row.problem].join('/');
result[key] = JSON.stringify(row.notes);
});
let updating = {};
for (let key in result) {
if (result[key] !== null) {
updating[key] = result[key];
}
}
await iServer._update(null, updating);
this._db.forEach(row => {
if (row.grade !== null && row.source === 'draft')
row.source === 'commit';
});
}
async revokeGrade(userid, week, problem)
{
let result = {};
const key = ['/status', userid, week, problem, 'grade'].join('/');
result[key] = null;
try {
await iServer._update(null, result);
console.log('Grade revoked');
}
catch (err) {
console.log('Error revoking grade: '+err);
}
}
statusChanged(status)
{
let uu = status.select(['userid']);
uu.reduce();
uu = uu.difference(this._users.select(['userid']));
if (uu.numberOfRows()) {
let base = this._makeHomeworkBase();
uu = base.innerJoin(uu);
this._db = this._db.outerJoin(uu);
this._db.createIndex(['userid', 'week', 'problem']);
}
let diff = this._db.simpleJoin(status, ['userid', 'week', 'problem']);
diff = diff.filter(d => d[0] && d[1]);
diff.forEach(([orig, repl]) => {
if (!repl.submitted) {
if (orig.submitted) {
orig.submitted = false;
orig.time = null;
orig.attempt = null;
orig.grade = null;
orig.source = 'none';
if (repl.grade !== null) {
this.revokeGrade(orig.userid, orig.week, orig.problem);
}
this.controller.statusDidChange(orig);
}
}
else if (repl.grade !== null) {
orig.submitted = repl.submitted;
orig.time = repl.time;
if (orig.source !== 'draft' || repl.grade == orig.grade) {
let oldGrade = orig.grade;
let oldSource = orig.source;
orig.grade = repl.grade;
orig.source = 'commit';
if (oldGrade != orig.grade || oldSource != orig.source) {
this.controller.statusDidChange(orig);
}
}
}
else if (!orig.time || orig.time !== repl.time) {
orig.submitted = true;
orig.time = repl.time;
this.loadAttempt(orig.userid, orig.week, orig.problem)
.then(r2 => this.controller.statusDidChange(r2));
}
});
}
usersChanged(tbl)
{
let diff = this._users.simpleJoin(tbl, ['userid']);
this._users = this._users.rightJoin(tbl, ['userid']);
let base = this._makeHomeworkBase();
let upd = tbl.select(['userid']).innerJoin(base);
this._db = this._db.outerJoin(upd, ['userid', 'week', 'problem']);
this._db.createIndex(['userid', 'week']);
diff.forEach(([orig, upd]) => {
if (orig && !upd) {
this.controller.userDidChange('delete', orig.userid);
}
else if (!orig && upd) {
this.controller.userDidChange('new', upd.userid);
}
else if (orig && upd && (orig.firstName !== upd.firstName || orig.lastName !== upd.lastName || orig.email !== upd.email)) {
this.controller.userDidChange('change', upd.userid);
}
});
this.controller.userDidChange();
}
_loadDraftGrades(tbl)
{
let uu = tbl.select(['userid']);
uu.reduce();
uu = uu.difference(this._users.select(['userid']));
if (uu.numberOfRows()) {
let base = this._makeHomeworkBase();
uu = base.innerJoin(uu);
this._db = this._db.outerJoin(uu);
this._db.createIndex(['userid', 'week', 'problem']);
}
let diff = this._db.simpleJoin(tbl, ['userid', 'week', 'problem']);
diff.forEach(([orig, repl]) => {
if (orig && repl) {
if (repl.grade !== null && orig.grade !== repl.grade) {
orig.grade = repl.grade;
orig.source = 'draft';
this.controller.statusDidChange(orig);
}
}
});
this.controller.statusDidChange(null);
}
}
class TableUI {
constructor(parentElt, controller)
{
this.parentElt = parentElt;
this.controller = controller;
this.mainElt = null;
const semester = getCurrentSemester()
const label = semester.unitLabel() + ' #'
this.columns = ['firstName', 'lastName', 'percent', 'weeks', 'total'];
this.columnHeads = ['First Name', 'Last Name', 'Percent', label, 'Total'];
this.create();
}
create()
{
this.remove();
let ref = (new ElementRef(this.parentElt))
.child('table', {class:'instructor'}) .cap(this,'mainElt')
.child('thead')
.child('tr');
this.columnHeads.forEach(col => {
if (col.includes('#')) {
const nweeks = Homework.numberOfWeeks();
for (let w=1; w<=nweeks; w++) {
ref.child('td', col.replace('#', w));
}
}
else {
ref.child('td', col);
}
});
ref = (new ElementRef(this.mainElt))
.child('tbody').cap(this, 'tableBody');
this.rowTable = new Table(['userid', 'row']);
this.cellTable = new Table(['userid', 'week', 'cell']);
this.nameTable = new Table(['userid', 'firstName', 'lastName']);
this.calculatedCells = { total: {}, percent: {} };
let users = this.controller.gradebookData.getUsers();
users.sort(['lastName', 'firstName']);
users.forEach(row => {
this.createRow(row.userid, row.firstName, row.lastName);
});
this.cellTable.createIndex(['userid', 'week']);
this.rowTable.createIndex(['userid']);
}
createRow(userid, firstName, lastName, before)
{
const url = 'index.html?uid='+encodeURIComponent(userid);
let e = {};
const info = this.controller.gradebookData.getUserInfo(userid)
const usrWeeks = Homework.numberOfWeeks(info)
const num = Homework.numberOfWeeks();
const total = this.controller.gradebookData.getTotal(userid);
const percent = Math.round(total / usrWeeks);
if (!before) before = null;
let tr = document.createElement('tr');
this.tableBody.insertBefore(tr, before);
this.rowTable.insert([userid, tr], ['userid', 'row']);
let ref2 = (new ElementRef(tr))
this.columns.forEach(col => {
switch(col) {
case 'firstName':
ref2.child('td').cap(e, 'fn')
.child('a', {'href': url, 'target': '_blank'}, firstName);
break;
case 'lastName':
ref2.child('td').cap(e, 'ln')
.child('a', {'href': url, 'target': '_blank'}, lastName);
break;
case 'percent':
ref2.child('td', percent.toString()).cap(e, 'pct');
this.calculatedCells.percent[userid] = e.pct;
break;
case 'total':
ref2.child('td',total.toString()).cap(e, 'total');
this.calculatedCells.total[userid] = e.total;
break;
case 'weeks':
(new Array(num+1)).fill(0,1,num+1).forEach((_,w) => {
ref2.child('td').cap(e, 'week');
e.week.addEventListener('click', () => {
this.controller.show(userid, w);
}, false);
this.createGradeEntry(e.week, userid, w);
this.cellTable.insert([userid, w, e.week], ['userid', 'week', 'cell']);
});
break;
}
});
this.nameTable.insert([userid, e.fn, e.ln], ['userid', 'firstName', 'lastName']);
}
createGradeEntry(elt, userid, week)
{
const gb = this.controller.gradebookData;
const data = gb.getDataForWeek(userid, week);
if (data.numberOfRows === 0) {
setText(elt, '*')
elt.className = 'needs-grading';
return;
}
let needsGrading = false;
let total = 0;
let anySubmitted = false;
data.forEach(row => {
if (row.submitted) {
anySubmitted = true;
if (problemNeedsGrading(row)) {
needsGrading = true;
}
else {
total += row.grade;
}
}
});
if (!anySubmitted) {
setText(elt, '*');
elt.className = '';
}
else if (needsGrading) {
setText(elt, '--');
elt.className = 'needs-grading';
}
else {
setText(elt, Math.round(total));
elt.className = 'graded';
}
}
remove()
{
if (this.mainElt && this.mainElt.parentElement) {
this.mainElt.parentElement.removeChild(this.mainElt);
}
}
attach(parent)
{
parent = parent || this.parentElt;
if (this.mainElt.parentNode !== parent) {
if (this.mainElt.parentNode)
this.mainElt.parentNode.removeChild(this.mainElt);
parent.appendChild(this.mainElt)
this.parentElt = parent;
}
}
statusDidChange(r) {
const row = this.cellTable.getData({userid: r.userid, week: r.week});
if (row) {
const gb = this.controller.gradebookData;
const info = gb.getUserInfo(r.userid)
this.createGradeEntry(row.cell, r.userid, r.week);
const total = gb.getTotal(r.userid);
setText(this.calculatedCells.total[r.userid], total.toString());
const pct = Math.round(total / Homework.numberOfWeeks(info));
setText(this.calculatedCells.percent[r.userid], pct.toString());
}
}
userDidChange(action, userid) {
switch (action) {
case 'new':
this.addUser(userid);
break;
case 'delete':
this.removeUser(userid);
break;
case 'change':
this.updateUser(userid);
break;
}
}
addUser(userid)
{
let gb = this.controller.gradebookData;
let users = gb.getUsers();
let r = users.getData({'userid': userid});
if (!r)
return;
let uids = this.rowTable.select(['userid']);
users = users.innerJoin(uids);
users.insert([userid, r.firstName, r.lastName, r.role], ['userid', 'firstName', 'lastName', 'role']);
users.sort(['lastName', 'firstName']);
let idx = users.getIndexOf({userid: userid});
let before = null;
if (idx+1 < users.numberOfRows()) {
let buid = users.getRow(idx+1).userid;
let d = this.rowTable.getData({userid: buid});
before = d && d.row;
}
this.createRow(userid, r.firstName, r.lastName, before);
}
removeUser(userid)
{
let r = this.rowTable.getData({'userid': userid});
if (!r)
return;
let tr =r.row;
this.tableBody.removeChild(tr);
['rowTable', 'cellTable', 'nameTable'].forEach(name => {
this[name] = this[name].select(null, row => row.userid !== userid);
});
for (let k in this.calculatedCells) {
delete this.calculatedCells[k][userid];
}
}
updateUser(userid)
{
let url = 'lessons_ins.html?uid='+encodeURIComponent(userid);
let nt = this.nameTable.getData({'userid': userid});
let gb = this.controller.gradebookData;
let ntt = gb.getUsers().getData({'userid': userid});
let cells = [nt.firstName, nt.lastName];
let names = [ntt.firstName, ntt.lastName];
cells.forEach((cell, idx) => {
while (cell.firstChild)
cell.removeChild(cell.firstChild);
(new ElementRef(cell)).child('a', {'href': url}, names[idx]);
});
}
}
class InstructorUI {
constructor(parent)
{
this.parent = parent;
this.gradebookData = new GradebookData(this);
(new ElementRef(this.parent))
.child('div', {class:'content-view'}) .cap(this, 'outer')
.child('div', {class:'gradebook-container'}) .cap(this, 'container');
this.table = new TableUI(this.container, this);
this.gradeEntry = new GradeDialog(this, this.outer);
this.goToMain();
iServer.monitorAllStatus( statusData => this.gradebookData.statusChanged( statusData ) );
iServer.monitorUsers(userData => this.gradebookData.usersChanged(userData));
}
async goToMain()
{
if (this.problemUI) {
this.problemUI.remove();
this.problemUI = null;
}
const toGrade = this.gradebookData.getProblemsToGrade(false, true);
const options = {
gradeFn: () => this.startGrading(),
gradeEnabled: toGrade.numberOfRows() !== 0,
commitFn: () => this.commit(),
commitEnabled: this.gradebookData.needsUpload()
}
if (this.toolbar)
this.toolbar.remove();
this.toolbar = new GBMainToolbar(options, this);
if (this.alertbox) {
this.alertbox.remove();
this.alertbox = null;
}
this.table.attach();
const name = await iServer.getName();
this.toolbar.update({ username: name || 'Account' });
}
updateToolbar()
{
const ng = this.gradebookData.getProblemsToGrade(false, true).numberOfRows();
let options = {};
options.gradeEnabled = !!ng;
options.commitEnabled = this.gradebookData.needsUpload();
this.toolbar.update(options);
}
statusDidChange(r)
{
if (r) {
this.table.statusDidChange(r);
if (this.problemUI) {
this.updateProblems(r);
}
}
if (!this.problemUI) {
this.updateToolbar();
}
}
userDidChange(action, userid)
{
if (userid) {
this.table.userDidChange(action, userid);
}
else if (!this.problemUI)
this.updateToolbar();
}
updateProblems(row)
{
if (this.currentList) {
if (this.currentView && this.currentView.userid == row.userid
&& this.currentView.week == row.week
&& this.currentView.problem == row.problem
&& !row.submitted)
{
this.toolbar.update({ enterEnabled: false});
}
}
}
async _show(row)
{
this.currentView = { userid: row.userid, week: row.week, problem: row.problem };
this.table.remove();
const r = await this.gradebookData.loadData(this.currentView);
let data = JSON.parse(JSON.stringify(r.attempt));
data.feedback = r.notes || {};
if (r.feedback) {
for (let k in r.feedback) {
data.feedback[k] = r.feedback[k];
}
}
const points = Homework.maxPoints(r.week, r.problem);
data.pointsPossible = points;
this.problemUI = uiForProblem(data, this.container);
const msg = r.notes && r.notes.instructorComments;
if (msg) {
this.alertbox = new Alert(msg, this.outer);
}
const grade = r.grade && Math.round(100 * r.grade / Homework.maxPoints(row.week, row.problem));
this.toolbar.update({ enterEnabled: row.submitted, grade: grade });
}
show(userid, week, problem)
{
if (problem === null)
return;
let tbl = this.gradebookData.getData(null, {week: week});
tbl = tbl.select(null, r => r.submitted);
tbl.sort(['lastName', 'firstName', 'problem']);
let map = {userid: userid};
if (problem !== undefined)
map.problem = problem;
const row = tbl.getData(map);
if (!row)
return;
this.currentList = tbl;
if (this.toolbar)
this.toolbar.remove();
const options = this.toolbarOptions(row);
this.toolbar = new GBAttemptToolbar(options, this);
this._show({userid: userid, week: week, problem: row.problem});
}
startGrading()
{
let tbl = this.gradebookData.getProblemsToGrade(false, true);
let row = tbl.getRow(0);
if (!row)
return;
this.currentList = tbl;
if (this.toolbar)
this.toolbar.remove();
let options = this.toolbarOptions(row);
this.toolbar = new GBAttemptToolbar(options, this);
this._show(row);
}
_getDataAtIndex(idx)
{
const r = this.currentList.getRow(idx);
const map = {userid: r.userid, week: r.week, problem: r.problem};
const t = this.gradebookData.getData(null, map);
return t.getRow(0);
}
goToProblem(idx)
{
this.problemUI.remove();
this.problemUI = null;
if (this.alertbox) {
this.alertbox.remove();
this.alertbox = null;
}
const row = this._getDataAtIndex(idx-1);
const options = this.toolbarOptions(row);
this.toolbar.update(options);
this._show(row);
}
async commit()
{
try {
await this.gradebookData.uploadGrades();
const options = { commitEnabled: false };
this.toolbar.update(options);
alert('Grades successfully uploaded');
}
catch (err) {
alert(err);
}
}
toolbarOptions(row)
{
const tbl = this.currentList;
const rowIdx = tbl.getIndexOf({'userid': row.userid, 'week': row.week, 'problem': row.problem});
const user = this.gradebookData.getUsers().getData({userid: row.userid});
const options = {
studentName: user.firstName + ' ' + user.lastName,
week: row.week,
problem: row.problem,
index: rowIdx,
total: tbl.numberOfRows(),
submitDate: new Date(row.time),
grade: null
}
return options;
}
enterGrade(idx)
{
let row = this._getDataAtIndex(idx);
this.gradeEntry.show(row);
}
setGrade(row, report)
{
row.grade = report.grade;
let options = { grade: Math.round(row.grade * 100 / Homework.maxPoints(row.week, row.problem)) };
this.toolbar.update(options);
let data = { grade: report.grade,
feedback: { 'studentComments': report.comments || "" }
};
if (this.problemUI.feedback) {
data.feedback.studentInfo = this.problemUI.feedback();
}
else if (row.notes && row.notes.instructorInfo) {
data.feedback.studentInfo = row.notes.instructorInfo;
}
row.feedback = data.feedback;
this.gradebookData.setGrade(row, data);
this.table.statusDidChange(row);
}
logOut()
{
iServer.logout();
const last = locationLastComponent();
window.location = "login.html?" + urlQueryString(last);
}
}
class GradeDialog {
constructor(controller, parentElt)
{
this.parent = parentElt;
this.controller = controller;
const ids = ['gradeEntry', 'gradeField', 'commentBox', 'enterButton', 'cancelButton'];
const names = ['dialog', 'gradebox', 'commentbox', 'ok', 'cancel'];
ids.forEach((a, i) => this[names[i]] = document.getElementById(a));
this.dialog.parentElement.removeChild(this.dialog);
this.parent.appendChild(this.dialog);
this.ok.addEventListener('click', () => {
this.hide();
controller.setGrade(this.row, this.result());
}, false);
this.cancel.addEventListener('click', () => this.hide(), false);
}
show(row)
{
this.row = row;
let week = row.week;
let prob = row.problem;
let defaultGrade;
if (!problemNeedsGrading(row)) {
defaultGrade = row.grade;
}
else if (this.controller.problemUI.calculatedGrade) {
defaultGrade = this.controller.problemUI.calculatedGrade();
if (isNaN(defaultGrade))
defaultGrade = '';
}
else if (row.notes.defaultGrade !== undefined) {
defaultGrade = row.notes.defaultGrade;
if (isNaN(defaultGrade))
defaultGrade = '';
else if (defaultGrade <= 1) {
defaultGrade = Math.round(defaultGrade * Homework.maxPoints(week, prob));
if (defaultGrade < 0)
defaultGrade = 0;
}
}
else {
defaultGrade = '';
}
this.gradebox.value = defaultGrade + ' / ' + Homework.maxPoints(week, prob);
if (this.row.feedback.studentComments)
this.commentbox.value = this.row.feedback.studentComments;
else
this.commentbox.value = '';
this.dialog.style.display='block';
}
hide()
{
let d = this.dialog;
d.classList.add('exiting');
animationEnd(d).then(() => {
d.style.display = 'none';
d.classList.remove('exiting');
});
}
result()
{
let r = {};
let raw;
let grade = this.gradebox.value;
let match = grade.match(/^(.*)\/(.*)$/);
if (match) {
raw = Number(match[1])/Number(match[2]);
}
else {
let n = Number(grade);
if (n > 1.1)
n = n / 100;
raw = n;
}
let week = this.row.week;
let prob = this.row.problem;
r.grade = Math.round(raw * Homework.maxPoints(week, prob));
r.comments = this.commentbox.value;
return r;
}
remove()
{
this.parent.removeChild(this.dialog);
}
}
class GBMainToolbar extends ToolbarBase {
constructor(options, controller)
{
let layout = { };
let acctMenu = [ { text: 'Log Out',
action: () => controller.logOut()
} ];
layout.breadcrumbs = [ {text: 'Gradebook',
menu: {
items: [ {
text: 'Gradebook',
selected: true
},
{
text: 'Lessons',
action: () => window.location = "index.html"
}
]
}}];
layout.tabs = [ 25, 35, 62 ];
layout.contents = {
grade: {
type: 'button',
tab: 0,
title: 'Start Grading',
action: options.gradeFn,
enabled: options.gradeEnabled
},
commit: {
type: 'button',
tab: 1,
title: 'Commit',
action: options.commitFn,
enabled: options.commitEnabled
},
account: {
type: 'menu',
tab: 2,
title: '',
items: acctMenu
}
};
super(layout, controller);
}
update(options)
{
let upd = { };
if (options.gradeEnabled !== undefined)
upd.grade = { enabled: options.gradeEnabled };
if (options.commitEnabled !== undefined)
upd.commit = { enabled: options.commitEnabled };
if (options.username) {
upd.account = { title: options.username };
}
super.update(upd);
};
}
class GBAttemptToolbar extends ToolbarBase {
constructor(options, controller)
{
const semester = getCurrentSemester()
const label = semester.unitLabel()
let layout = { };
layout.breadcrumbs = [ { text: 'Gradebook',
action: () => controller.goToMain()
},
{ text: options.studentName }
];
layout.tabs = [ 25, 45, 55, 65, 75, 85 ];
layout.contents = {
prob: {
type: 'text',
tab: 1,
title: label + ' ' + options.week + ' Problem ' + options.problem
},
nav: {
type: 'nav',
tab: 0,
problem: options.index + 1,
numberOfProblems: options.total
},
enter: {
type: 'button',
tab: 3,
title: 'Enter Grade',
action: () => controller.enterGrade(options.index),
enabled: options.enterEnabled || true
},
grade: {
type: 'text',
tab: 2,
title: options.grade === null ? 'Grade: --' : 'Grade: ' + options.grade
},
submitted: {
type: 'text',
tab: 4,
title: 'Submitted: ' + (options.submitDate.getMonth() + 1) + '/' + options.submitDate.getDate()
}
};
super(layout, controller);
}
update(options)
{
const semester = getCurrentSemester()
const label = semester.unitLabel()
let upd = {};
if (options.studentName) {
upd.breadcrumbs = [ null, {text: options.studentName} ];
}
if (options.week || options.problem) {
upd.prob = { title: label + ' ' + options.week + ' Problem ' + options.problem };
}
upd.enter = {};
if (options.index !== undefined) {
upd.nav = {problem: options.index + 1};
upd.enter.action = () => this._controller.enterGrade(options.index);
}
if (options.enterEnabled !== undefined) {
upd.enter.enabled = options.enterEnabled;
}
if (options.grade !== undefined) {
upd.grade = {title: (options.grade === null ? 'Grade: --' : 'Grade: ' + options.grade)};
}
if (options.submitDate) {
upd.submitted = {title: 'Submitted: ' + (options.submitDate.getMonth() + 1) + '/' + options.submitDate.getDate()};
}
super.update(upd);
}
}
class Alert {
constructor(message, parentElt)
{
(new ElementRef(parentElt)).child('div',{class:'gradebook-feedback'}).cap(this, 'alertbox') .child('h3', 'Feedback') .sibling('p', message);
this.isOpen = true;
this.alertbox.addEventListener('click', () => {
this.setOpen(!this.isOpen);
}, false);
}
setOpen(state)
{
if (this.alertbox) {
this.alertbox.style.right = state ? '0px' : '-310px';
this.isOpen = state;
}
}
remove()
{
if (this.alertbox) {
this.alertbox.parentNode.removeChild(this.alertbox);
this.alertbox = null;
}
}
}
}());

