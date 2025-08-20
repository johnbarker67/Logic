
(function(){
"use strict";
const homeURL = 'index.html';
const syllabusURL = 'syllabus.html';
function createLessonToolbar()
{
var options = { username: '' };
var server = new Server(finish, finish);
var toolbar = new LessonToolbar(options, lessonController);
function finish(id, email)
{
toolbar.connect(server, id);
}
}
class LessonToolbar extends ToolbarBase {
constructor(options, controller)
{
const semester = getCurrentSemester()
const label = semester.unitLabel()
var layout = { };
layout.breadcrumbs = [ {text: 'Home', action: () => controller.goHome() } ];
var pat = /lecture([0-9]+)\.html/;
var loc = window.location.pathname;
var match = loc.match(pat);
if (match) {
var week = match[1] || 1;
var title = Homework.lessonTitle(week);
var weekMenu = createWeekMenu(controller, Number(week), options.username);
layout.breadcrumbs.push( { text: label + ' ' + week + ': ' + title,
menu: weekMenu } );
}
else if (loc.match(/syllabus/)) {
layout.breadcrumbs.push( { text: 'Syllabus' } );
}
else if (loc.match(/world/)) {
layout.breadcrumbs.push( { text: 'World' } );
}
else if (loc.match(/parsetree/)) {
layout.breadcrumbs.push( { text: 'Parse Tree' } );
}
else if (loc.match(/proofeditor/)) {
layout.breadcrumbs.push( { text: 'Proof' } );
}
layout.tabs = [ 50 ];
var menuItems = ToolbarBase.accountMenu(controller, options);
layout.contents = {
account: {
type: 'menu',
tab: 0,
title: (typeof (options.username) === 'string') ? (options.username) : 'Guest',
items: menuItems
}
};
super(layout, controller);
}
async connect(server, id)
{
this.server = server;
const name = await server.getName();
let options = {};
if (name) {
options.account = { title: name };
}
else {
const last = locationLastComponent();
options.account = {
title: 'Guest',
items: [ {
text: 'Log In',
action: () => window.location = "login.html?" + urlQueryString(last)
} ]
};
}
this.update(options);
}
}
function createWeekMenu(controller, currentWeek, user)
{
const semester = getCurrentSemester()
const label = semester.unitLabel()
var n = Homework.numberOfWeeks();
var items = Array(n).fill().map((_, i) => {
var week = i+1;
var obj = { text: label + ' ' + week + ': ' + Homework.lessonTitle(week),
action: () => controller.goToWeek(week, user)
};
if (!Homework.weekAvailable(week))
obj.disabled = true;
if (week === currentWeek)
obj.selected = true;
return obj;
});
return {items: items, width: 300};
}
var lessonController = {
goHome: function()
{
window.location = homeURL;
},
logOut: function()
{
const last = locationLastComponent();
var server = new Server( () => { },
() => window.location = "login.html?" + urlQueryString(last) );
server.logout();
},
goToWeek: function(week, user)
{
window.location = 'lecture'+week+'.html';
}
}
document.addEventListener('DOMContentLoaded', createLessonToolbar, false);
}());

