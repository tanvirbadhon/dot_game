import fs from 'node:fs';import {bundleClientScript} from './client-bundle.mjs';import path from 'node:path';
export function exportPreview(){
 const wood='data:image/svg+xml,'+encodeURIComponent(fs.readFileSync('client/wood.svg','utf8'));
 const css=fs.readFileSync('client/style.css','utf8').replaceAll("url('/wood.svg')",'url("'+wood+'")');
 let js=bundleClientScript();
 js=js.replace("$('#onlineTab').onclick=()=>setMode(true);","$('#onlineTab').onclick=()=>{window.location.href='https://paper-dots-badhon.lizasuraiya44.chatgpt.site/';};").replace('const previous=saved();','const previous=null;');
 let html=fs.readFileSync('client/index.html','utf8').replace('<link rel="stylesheet" href="/style.css">',()=>'<style>'+css+'</style>').replace('<script type="module" src="/game.js"></script>',()=>'<script>'+js+'</script>').replace('href="/" class="brand"','href="./index.html" class="brand"');
 fs.writeFileSync(path.resolve('..','index.html'),html);console.log('Updated root index.html for Live Server.');
}
