
(function(){
"use strict";
function modify()
{
function addTrees(elt)
{
if (!elt.getAttribute)
return;
var sent = elt.getAttribute("parsetree");
if (sent) {
elt.style.position='relative';
var sentences = sent.split('.');
var options = { hasTruthTable: false, errbox: false, y: 30, sentences: sentences, collapsed: true, mode: 'composing' };
var a;
if (a = elt.getAttribute('parse_options')) {
var opt;
eval('opt={'+a+'}');
options = mergeParams(opt, options);
}
new ParseTreeUI(options, elt);
return;
}
if (!elt.childNodes)
return;
for (var i=0; i<elt.childNodes.length; i++) {
addTrees(elt.childNodes[i]);
}
}
function addProofs(elt)
{
if (!elt.getAttribute)
return;
var idx = elt.getAttribute("proof");
if (idx === 'json') {
addInlineProof(elt);
return;
}
if (idx) {
idx = Number(idx);
new ProofController(examples[idx], elt);
return;
}
if (!elt.childNodes)
return;
for (var i=0; i<elt.childNodes.length; i++) {
addProofs(elt.childNodes[i]);
}
}
function addInlineProof(elt)
{
if (elt.childNodes) {
for (var i=0; i<elt.childNodes.length; i++) {
var child = elt.childNodes[i];
if (child.nodeType === 3) {
var json = child.nodeValue;
elt.removeChild(child);
new ProofController(JSON.parse(json), elt);
return;
}
}
}
}
addTrees(document.body);
addProofs(document.body);
}
document.addEventListener('DOMContentLoaded', modify, false);
}());

