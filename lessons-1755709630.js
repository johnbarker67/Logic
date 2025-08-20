
(function(){
"use strict";
let LessonUI;
let User;
function lessonSetup()
{
makeSpinner();
let server = new Server(didLogIn, didLogOut);
function didLogIn(id, email) {
new LessonUI(server, id, email, document.body);
}
function didLogOut(server) {
window.location = "login.html?url=lessons";
}
}
document.addEventListener('DOMContentLoaded', lessonSetup, false);
const myUniqueString = "0URnIMvMvI6MJaH";
function readLocalStorage(user, key) {
let k = myUniqueString;
if (user)
k += '_'+user;
k += '_'+key;
let result = localStorage.getItem(k);
if (result == '')
result = null;
return result;
}
function writeLocalStorage(user, key, data) {
if (data === null)
data = '';
let k = myUniqueString;
if (user)
k += '_'+user;
k += '_'+key;
localStorage.setItem(k, data);
}
class Alert {
constructor(message, parentElt)
{
(new ElementRef(parentElt))
.child('div',{class:'gradebook-feedback'}).cap(this, 'alertbox')
.child('h3', 'Feedback')
.sibling('p', message)
.sibling('div', {'class': 'closebox'}) .cap(this, 'closebox');
this.isOpen = true;
this.alertbox.addEventListener('click', () => this.setOpen(true), false);
this.closebox.addEventListener('click', event => {
this.setOpen(false);
event.stopPropagation();
}, false);
}
setOpen(state)
{
if (this.alertbox && this.isOpen !== state) {
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
const duration = .2;
const stagger = .1;
const detailOffset = 170;
const gap = 7;
const problemBorder = 2;
const clearance = 8;
const arrowRate = .3;
class Accordion {
constructor(problems, details, arrow, container)
{
this.problems = problems;
this.details = details;
this.arrow = arrow;
this.container = container;
this.x0 = problems[0].offsetLeft;
this.y0 = problems[0].offsetTop;
this.w = problems[0].clientWidth;
this.h = problems[0].clientHeight;
this.dh = container.clientHeight;
details.forEach(d => {
d.style.height = this.h + "px";
d.style.lineHeight = this.h + "px";
});
}
expand()
{
let i;
this.animateList = new AnimationList;
this.animateList.addAnimation(new Animation(arrow_delta, arrow_animate));
this.problems.forEach((_, idx) => {
if (idx > 0) {
const a = new Animation( t => delta(t, idx),
d => transformProblem(idx, d) );
this.animateList.addAnimation(a);
}
});
const nprob = this.problems.length;
const A = delta_inverse(.4, 1);
const B = delta_inverse(.9, nprob - 1);
this.problems.forEach((_, idx) => {
let a = new Animation( t => t/duration, d => transformDetail(idx, d) );
if (nprob > 1)
a.delay = (B-A) * idx / (nprob - 1) + A;
this.animateList.addAnimation(a);
});
if (nprob > 1) {
this.animateList.addAnimation(new Animation(t => t/duration, transformContainer));
}
this.details.forEach((d, i) => {
const y = this.y0 + (this.h + gap) * i + problemBorder;
d.style.top = y + "px";
});
this.animateList.start();
const self=this;
function delta(t, idx)
{
const f = Math.max(1 - stagger * idx, .1);
return (t / duration) * f;
}
function delta_inverse(d, idx)
{
const f = Math.max(1 - stagger * idx, .1);
return d * duration / f;
}
function transformDetail(idx, d)
{
const dx = d * detailOffset;
const elt = self.details[idx];
elt.style.transform = 'translateX(' + dx + 'px)';
}
function transformContainer(t)
{
const newHeight = self.problems.length * (gap + self.h) + clearance;
const height = t * newHeight + (1-t) * self.h;
self.container.style.height = height + 'px';
}
function transformProblem(idx, t)
{
const oldX = self.problems[idx].offsetLeft - self.x0;
const newY = idx * (self.h + gap);
const a = Math.PI/2 * t;
const x = oldX * Math.cos(a);
const y = newY * Math.sin(a);
self.problems[idx].style.transform = 'translate(' + (x - oldX) + 'px,' + y + 'px)';
}
function arrow_delta(t)
{
return t / arrowRate;
}
function arrow_animate(d)
{
const deg = Math.round(45 + 180 * d);
self.arrow.style.transform = 'rotate('+deg+'deg)';
}
}
collapse()
{
const collapseList = this.animateList.getReverse();
collapseList.start();
}
}
class LessonTable {
constructor(parentElt, controller)
{
this.parent = parentElt;
this.controller = controller;
this.create();
}
create()
{
const semester = getCurrentSemester()
const userInfo = this.controller.getUserInfo()
let ref = (new ElementRef(this.parent))
.child('table', {class:'gradebook'}) .cap(this,'table');
ref.child('thead')
.child('tr')
.child('td', semester.unitLabel())
.sibling('td', 'Due')
.sibling('td', 'Lesson')
.sibling('td', 'Problems')
.sibling('td', 'Score')
.sibling('td');
ref = ref.child('tbody');
const n = Homework.numberOfWeeks(userInfo);
let e={};
this.domTree = { weeks: [] };
for (let week=1; week<=n; week++) {
let wk = this.domTree.weeks[week] = { problems: [], details: [] };
let row = ref.child('tr');
const dueDate = Homework.dueDate(week);
const dateStr = dueDate.string('mm dd');
row.child('td', week.toString()) .sibling('td', dateStr);
const url = 'lecture'+week+'.html';
const title = Homework.lessonTitle(week);
if (Homework.weekAvailable(week)) {
row.child('td') .child('a', title, {href: url});
}
else {
row.child('td', title, {'class': 'disabled'});
}
const container = this.makeProblems(row, week);
row.child('td')
.child('span', '').cap(wk, 'points')
.parent().sibling('td').cap(e, 'target')
.child('span', {class: 'arrow-down'}).cap(e, 'arrow');
this.makeAccordion(e.target, e.arrow, wk.problems.slice(1), wk.details.slice(1), container);
}
ref.child('tr', {class:'totalrow'})
.child('td', 'TOTAL', {colspan:'3'})
.sibling('td', '').cap(e, 'percent')
.sibling('td', {colspan: '2'}, '( of )').cap(e, 'number');
this.domTree.total = { percent: e.percent, number: e.number };
}
createMobile()
{
let ref = (new ElementRef(this.parent))
.child('table', {class:'gradebook'}) .cap(this,'table');
ref.child('thead')
.child('tr')
.sibling('td', 'Due')
.sibling('td', 'Lesson')
.sibling('td', 'Problems')
.sibling('td', 'Score');
ref = ref.child('tbody');
let n = Homework.numberOfWeeks();
let total = 0;
let e={};
this.domTree = { weeks: [] };
for (let week=1; week<=n; week++) {
let wk = this.domTree.weeks[week] = { problems: [], details: [] };
let row = ref.child('tr');
let dueDate = Homework.dueDate(week);
let dateStr = dueDate.string('mm dd');
row.child('td', dateStr);
let url = 'lecture'+week+'.html';
let title = Homework.lessonTitle(week);
if (Homework.weekAvailable(week)) {
row.child('td') .child('a', title, {href: url});
}
else {
row.child('td', title, {'class': 'disabled'});
}
let container = this.makeProblems(row, week);
row.child('td')
.child('span', '').cap(wk, 'points')
}
ref.child('tr', {class:'totalrow'})
.child('td', 'TOTAL', {colspan:'2'})
.sibling('td', '').cap(e, 'percent')
.sibling('td', '( of )').cap(e, 'number');
this.domTree.total = { percent: e.percent, number: e.number };
}
remove()
{
this.parent.removeChild(this.table);
}
attach(parentElt, controller)
{
this.parent = parentElt;
this.controller = controller;
parentElt.appendChild(this.table);
}
makeProblems(row, week)
{
let cell = row.child('td', {class: 'prob-cell'});
let dummyCell = cell.child('div', {class: 'dummy-cell'});
const n = Homework.numberOfProblems(week);
const pnos = Array(n+1).fill(0,1).map((_,i)=>i);
const available = Homework.weekAvailable(week)
const classname = available ? 'problem not-submitted' : 'problem not-available';
let wk = this.domTree.weeks[week];
wk.problems = pnos.map(p =>
dummyCell.child('span', p.toString(), {class: classname}).elt
);
if (available) {
wk.problems.forEach((elt, problem) => elt.addEventListener('click', () => this.controller.show(week, problem), false));
}
let details = dummyCell.child('div', {class: 'details'});
wk.details = pnos.map(_ => details.child('div', 'Not submitted').elt);
return cell.elt;
}
makeAccordion(target, arrow, problems, details, container)
{
const accordion = new Accordion(problems, details, arrow, container);
let vis = false;
target.addEventListener('click', () => {
vis ? accordion.collapse() : accordion.expand();
vis = !vis;
}, false);
}
statusChanged()
{
const statusTable = this.controller.user.getStatus();
let total = 0, totalMax = 0;
this.domTree.weeks.forEach((wk, w) => {
let weekTotal = 0;
let weekMax = 100;
wk.problems.forEach((prob, p) => {
const r = statusTable.getData({'week': w, 'problem': p}) || {};
if (r.grade || r.grade === 0) {
prob.className = 'problem';
weekTotal += r.grade;
}
else if (r.submitted)
prob.className = 'problem not-graded';
else
prob.className = 'problem not-submitted'
let detail = wk.details[p];
while (detail.firstChild)
detail.removeChild(detail.firstChild);
let line = new ElementRef(detail);
if (r.grade || r.grade === 0) {
const mp = Homework.maxPoints(w, p);
const pct = Math.round(r.grade * weekMax / mp);
line.child('div', pct + '%', {class: 'pct'}) .parent() .text('(' + r.grade + '/' + mp + ')');
}
else if (r.submitted)
line.text('Needs grading');
else
line.text('Not submitted');
let scoreCell = wk.points;
while (scoreCell.firstChild)
scoreCell.removeChild(scoreCell.firstChild);
setText(scoreCell, weekTotal.toString());
});
total += weekTotal;
totalMax += weekMax;
});
let pct = this.domTree.total.percent;
while (pct.firstChild)
pct.removeChild(pct.firstChild);
setText(pct, Math.round(100 * total/totalMax).toString() + '%');
let num = this.domTree.total.number;
while (num.firstChild)
num.removeChild(num.firstChild);
setText(num, '('+total+' of '+totalMax +')');
}
}
class AttemptUI {
constructor(user, controller, container, readOnly)
{
this.user = user;
this.controller = controller;
this.container = container;
this.parent = controller.parent;
this.readOnly = readOnly;
this.createSolutionUI();
if (!readOnly) {
this.unloadHandler = () => this.save(true);
window.addEventListener('unload', this.unloadHandler, false);
this.visibilityHandler = () => this.visibilityChanged();
document.addEventListener('visibilitychange', this.visibilityHandler, false);
}
this.loaded = false;
}
setToolbar(t)
{
this.toolbar = t;
}
clearSave()
{
if (this.saveTimer) {
window.clearTimeout(this.saveTimer);
this.saveTimer = null;
}
if (this.statusTimer) {
window.clearTimeout(this.statusTimer);
this.statusTimer = null;
}
}
deferSave(signal)
{
this.clearSave();
if (signal) {
let options = {statusString: 'Saving...'};
this.toolbar.update(options);
}
this.saveTimer = window.setTimeout(() => {
this.save(true);
this.saveTimer = null;
if (signal) {
this.toolbar.update({statusString: 'Saved'});
this.statusTimer = window.setTimeout(() => {
this.toolbar.update({statusString: 'Not Submitted'});
this.statusTimer = null;
}, 2000);
}
}, 2000);
}
attemptChanged()
{
this.deferSave(true);
}
goToProblem(problem)
{
this.clearSave();
this.save(true);
this.goTo(this.currentWeek, problem);
}
goToWeek(week)
{
this.clearSave();
this.save(true);
this.goTo(week, 1);
}
goTo(week, problem)
{
if (this.readOnly) {
this.user.monitorAttempt(this.currentWeek, this.currentProblem, null, false);
}
if (this.alert) {
this.alert.remove();
this.alert = null;
}
const statusTable = this.user.getStatus();
let grade, submitted;
const table = statusTable.selectWhereEqual( ['grade', 'submitted'], {'week': week, 'problem': problem } );
if (table.numberOfRows() == 0) {
grade = null;
submitted = false;
}
else {
const row = table.getRow(0);
grade = row.grade;
submitted = row.submitted;
}
this.loaded = false;
this.currentWeek = week;
this.currentProblem = problem;
this.setupToolbar(grade, submitted);
this.showAttempt(grade, submitted);
}
async setupToolbar(grade, submitted)
{
let options;
this.isMutable = false;
let soln = false;
if (!submitted) {
options = {
statusString: "Not Submitted",
statusColor: 'attention',
actionString: "Submit",
action: () => this.submit()
};
this.isMutable = true;
}
else if (submitted && !grade && grade !== 0) {
options = {
statusString: "Submitted",
statusColor: 'submitted',
actionString: "Unsubmit",
action: () => this.unsubmit(),
actionEnabled: this.user.canUnsubmit(this.currentWeek, this.currentProblem)
};
}
else {
options = {
statusString: "Grade: " + grade + ' of ' + Homework.maxPoints(this.currentWeek, this.currentProblem),
statusColor: 'graded',
actionString: "Show Solution",
actionEnabled: false
}
soln = true;
}
if (this.readOnly)
options.actionEnabled = false;
this.toolbar.update(options);
if (soln) {
const data = await this.user.readSolution(this.currentWeek, this.currentProblem);
if (data) {
const opt = {
actionString: "Show Solution",
actionEnabled: true,
action: () => this.showSolution(data)
}
this.toolbar.update(opt)
}
}
}
async showAttempt(grade, submitted)
{
const week = this.currentWeek, problem = this.currentProblem;
const hwdata = Homework.getProblem(this.currentWeek, this.currentProblem);
if (this.readOnly) {
this.user.monitorAttempt(week, problem, async data => {
const feedback = await this.user.readFeedback(this.currentWeek, this.currentProblem);
handleData(data, feedback, this);
});
}
else {
startSpinner();
const data = await this.user.loadData(this.currentWeek, this.currentProblem);
endSpinner();
if (this.currentWeek != week || this.currentProblem != problem)
return;
if (grade || grade === 0) {
const feedback = await this.user.readFeedback(this.currentWeek, this.currentProblem);
handleData(data, feedback, this);
}
else {
handleData(data, null, this);
}
}
function handleData(data, feedback, self) {
if (self.currentWeek != week || self.currentProblem != problem)
return;
if (!data)
data = {};
else if (typeof(data) == 'string')
data = JSON.parse(data);
const props = {
editable: !self.readOnly && !submitted,
feedback: submitted && (grade || grade === 0),
gradable: false
};
data = makeHomeworkData(data, hwdata, { ui_properties: props });
data.feedback = feedback || {};
if (self.problemUI)
self.problemUI.remove();
self.problemUI = uiForProblem(data, self.container, self);
if (feedback && feedback.studentComments) {
self.alert = new Alert(feedback.studentComments, self.container);
}
self.loaded = true;
}
}
logOut()
{
this.controller.logOut();
}
goToSyllabus()
{
this.controller.goToSyllabus();
}
changePassword()
{
this.controller.changePassword();
}
save(remote)
{
if (!this.problemUI || !this.isMutable || !this.loaded || this.readOnly)
return;
const data = this.problemUI.export();
this.user.saveAttempt(this.currentWeek, this.currentProblem, data, remote);
}
async submit()
{
if (!this.loaded) {
alert('Your homework could not be submitted. Please try again later.');
return;
}
this.clearSave();
const data = this.problemUI.export();
startSpinner();
const w = this.currentWeek, p = this.currentProblem;
try {
await this.user.submitAttempt(w, p, data);
endSpinner();
this.goTo(w, p);
alert('Success! Your homework was submitted.');
}
catch (err) {
endSpinner();
alert('Your homework could not be submitted. Please try again later.');
}
}
createSolutionUI()
{
this.solutionWindow = new SolutionUI(this.parent, this);
this._solutionKeyEvent = event => {
if (event.keyCode === 27) {
this.hideSolution();
}
}
}
showSolution(data)
{
this.solutionWindow.show(this.currentWeek, this.currentProblem, data);
this.parent.addEventListener('keydown', this._solutionKeyEvent, false);
this.toolbar.disable();
}
hideSolution()
{
this.container.style.display="block";
this.parent.removeEventListener('keydown', this._solutionKeyEvent, false);
this.toolbar.enable();
this.solutionWindow.hide();
}
async unsubmit()
{
if (!this.loaded)
return;
let week = this.currentWeek, problem = this.currentProblem;
try {
await this.user.unsubmit(week, problem);
this.goTo(week, problem);
alert('Success! This problem was unsubmitted. You may now modify the problem and submit it later.');
}
catch (err) {
alert('There was an error processing your request. Please try later, or contact your instructor.');
}
}
remove()
{
window.removeEventListener('unload', this.unloadHandler, false);
document.removeEventListener('visibilitychange', this.visibilityHandler, false);
this.clearSave();
this.save(true);
if (this.alert) {
this.alert.remove();
this.alert = null;
}
if (this.problemUI) {
this.problemUI.remove();
this.problemUI = null;
this.loaded = false;
}
if (this.solutionWindow) {
this.solutionWindow.remove();
this.solutionWidow = null;
}
if (this.readOnly) {
this.user.monitorAttempt(this.currentWeek, this.currentProblem, null, false);
}
}
visibilityChanged()
{
if (document.visibilityState === 'hidden') {
this.clearSave();
this.save();
}
else if (document.visibilityState === 'visible') {
}
}
goHome()
{
this.controller.goToMain();
}
statusChanged()
{
let statusTable = this.user.getStatus();
let grade, submitted;
let row = statusTable.getData({'week': this.currentWeek, 'problem': this.currentProblem });
if (!row) {
grade = null;
submitted = false;
}
else {
grade = row.grade;
submitted = row.submitted;
}
this.setupToolbar(grade, submitted);
}
}
class SolutionUI {
constructor(parentElt, controller)
{
this.parent = parentElt;
this.controller = controller;
(new ElementRef(this.parent))
.child('div', {class: 'solution-window'}) .cap(this, 'solutionWindow')
.child('div', {class: 'solution-bar'})
.child('span', 'Solution')
.sibling('span', {class: 'subtitle'}) .cap(this, 'solutionSubtitle')
.sibling('div', {class: 'solution-dismiss'}) .cap(this, 'solutionDismiss')
.parent()
.sibling('div', {class: 'solution-content'}) .cap(this, 'solutionContent');
this.solutionDismiss.addEventListener('click', () => controller.hideSolution(), false);
}
show(week, problem, data)
{
const hw = Homework.getProblem(week, problem);
const props = { editable: false, feedback: false, gradable: false };
data = makeHomeworkData(data, hw, {ui_properties: props});
const label = getCurrentSemester().unitLabel()
setText(this.solutionSubtitle, label + ' ' + week + " problem " + problem);
this.solutionWindow.style.height = window.innerHeight + 'px';
this.solutionWindow.style.display = 'block';
this.solutionUI = uiForProblem(data, this.solutionContent);
}
hide()
{
this.solutionWindow.classList.add('exiting');
animationEnd(this.solutionWindow).then(() => {
this.solutionWindow.classList.remove('exiting');
this.solutionWindow.style.display = 'none';
this.solutionUI.remove();
this.solutionUI = null;
});
}
remove()
{
this.solutionWindow.parentNode.removeChild(this.solutionWindow);
}
}
LessonUI = class {
constructor(server, id, email, parent)
{
this.parent = parent;
this.server = server;
this.readOnly = false;
let q = parseURLQuery();
if (q.uid) {
this.readOnly = true;
id = q.uid;
server.setUser(q.uid, email);
}
this.user = new User(id, email, server);
(new ElementRef(this.parent)) .child('div', {class:'gradebook-container'}) .cap(this, 'container');
this.user.getInfo().then(info => {
this.userInfo = info
this.goToMain();
this.user.finalize(() => this.table.statusChanged(), () => this.statusChanged());
})
}
goToMain()
{
if (this.toolbar)
this.toolbar.remove();
if (this.attemptUI) {
this.attemptUI.remove();
this.attemptUI = null;
}
let options = {
username: ''
};
this.toolbar = new MainToolbar(options, this);
this.user.getName()
.then(name => {
this.toolbar.update({ username: name || 'Guest' });
this.displayName = name;
});
this.user.getInstructorKey().then(key => {
if (key) {
const opt = { instructor: true, key: key };
this.toolbar.update(opt);
}
});
if (this.table) {
this.table.attach(this.container, this);
}
else {
this.table = new LessonTable(this.container, this);
}
}
statusChanged()
{
if (this.table) {
this.table.statusChanged();
}
if (this.attemptUI) {
this.attemptUI.statusChanged();
}
}
show(week, problem)
{
this.table.remove();
let options = {
week: week,
problem: problem,
numberOfProblems: Homework.numberOfProblems(week),
statusString: 'Not Submitted',
action: () => this.submit(),
actionString: 'Submit',
username: this.displayName
};
if (this.readOnly)
options.actionEnabled = false;
if (this.toolbar)
this.toolbar.remove();
this.attemptUI = new AttemptUI(this.user, this, this.container, this.readOnly);
this.toolbar = new Toolbar(options, this.attemptUI);
this.attemptUI.setToolbar(this.toolbar);
this.attemptUI.goTo(week, problem);
}
logOut()
{
this.server.logout();
window.location = "login.html";
}
getUserInfo()
{
return this.userInfo
}
}
User = function(id, email, server)
{
let _id = id;
let _email = email;
let _info;
let _remote = {};
let _server = server;
let _status = null;
let myUniqueString = "0URnIMvMvI6MJaH";
function makeHomeworkId(week, problem)
{
let w = ('0'+week).slice(-2);
let p = ('0'+problem).slice(-2);
return CURRENT_INSTANCE + '_' + w + '_' + p;
}
function readLocalStorage(user, key) {
let k = myUniqueString;
if (user)
k += '_'+user;
k += '_'+key;
let result = localStorage.getItem(k);
if (result == '')
result = null;
return result;
}
function writeLocalStorage(user, key, data) {
if (data === null)
data = '';
let k = myUniqueString;
if (user)
k += '_'+user;
k += '_'+key;
localStorage.setItem(k, data);
}
function timestamp() {
let d = new Date();
let s = Math.floor(d.getTime() / 1000);
return s;
}
function getLocalData(week, problem)
{
return null
let hwkid = makeHomeworkId(week, problem);
let data = readLocalStorage(_id, hwkid);
return JSON.parse(data);
}
function setLocalData(week, problem, data)
{
return;
let hwkid = makeHomeworkId(week, problem);
if (typeof(data) == "string") {
data = JSON.parse(data);
}
data.ts = timestamp();
data = JSON.stringify(data);
writeLocalStorage(_id, hwkid, data);
}
function writeAttempt(week, problem, data)
{
if (typeof(data) === 'string') {
data = JSON.parse(data);
}
let key = week.toString() + '_' + problem.toString();
if (objectsAreEqual(data, _remote[key])) {
return new Promise(resolve => resolve())
}
else {
_remote[key] = data;
data.ts = timestamp();
data = JSON.stringify(data);
return _server.writeAttempt(week, problem, data);
}
}
async function setStatus(week, problem, key, status)
{
await _server.writeStatus(week, problem, key, status);
const count = _status.doWhereEqual( {'week': week, 'problem': problem},
r => r[key] = status);
if (!count) {
_status.insert([week, problem, status], ['week', 'problem', key]);
}
}
function getProblemStatus(week, problem, key)
{
let row = _status.getData(['problem', 'grade', key], {'week': week, 'problem': problem});
return row && row[key];
}
this.finalize = function(firstTime, nextTime)
{
_server.monitorStatus(function(table) {
const frst = !_status;
_status = table;
frst ? firstTime() : nextTime();
});
}
this.getStatus = function()
{
return _status;
}
this.getUserId = function()
{
return _id;
}
this.getEmail = function()
{
return _email;
}
this.getInfo = async function()
{
if (_info === undefined) {
const info = await _server.readUserInfo(_id);
let _info = {};
for (const k in info)
_info[k] = info[k];
return _info;
}
else {
return _info;
}
}
this.getName = async function()
{
const info = await this.getInfo();
return info.firstName + ' ' + info.lastName;
}
this.getInstructorKey = async function()
{
return await _server.isInstructor();
}
this.logout = function()
{
_server.logout();
}
this.loadData = async function(week, problem)
{
let local = getLocalData(week, problem);
let localtime = -1;
if (local && local.ts !== undefined)
localtime = local.ts;
let submitted = getProblemStatus(week, problem, 'submitted') || false;
let data = await _server.readAttempt(week, problem);
if (data) {
if (data.ts !== undefined && data.ts < localtime && !submitted) {
data = local;
await writeAttempt(week, problem, data);
}
}
else {
data = local;
}
return data;
}
this.monitorAttempt = function(week, problem, handler, on)
{
_server.monitorAttempt(week, problem, data => {
handler && handler(data);
}, on);
}
this.saveAttempt = function(week, problem, data, remote)
{
setLocalData(week, problem, data);
if (remote) {
return writeAttempt(week, problem, data);
}
else {
return new Promise(resolve => resolve());
}
}
this.submitAttempt = async function(week, problem, data)
{
await this.saveAttempt(week, problem, data, true);
await setStatus(week, problem, 'submitted', true);
}
this.canUnsubmit = function(week, problem)
{
let row = this.getStatus().getData({'week': week, 'problem': problem});
return row && row.grade === null;
}
this.unsubmit = function(week, problem)
{
return setStatus(week, problem, 'submitted', false);
}
this.readSolution = function(week, problem)
{
return _server.readSolution(week, problem);
}
this.readFeedback = function(week, problem)
{
return _server.readFeedback(week, problem);
}
}
}());

