import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = '/Users/onur/Documents/Codex/2026-09-27/guastore';
const SKILL_DIR = '/Users/onur/.codex/plugins/cache/openai-primary-runtime/presentations/26.927.11222/skills/presentations';
const RUNTIME_PYTHON = '/Users/onur/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const FINAL_PPTX = path.join(workspaceDir, 'output/pptx/guasha-shop-a7-canva-editierbar-neue-jade.pptx');
const logoPath = '/Users/onur/.codex/generated_images/019f93a8-e06d-79e0-b8d7-bf3ac9ffd40a/exec-645faf05-4604-476d-8c41-1627016e271c.png';
const referencePath = path.join(workspaceDir,'output/pdf/guasha-shop-edelstahl-a7-druck.pdf');
const { finalizePresentation } = await import(pathToFileURL(path.join(SKILL_DIR, 'container_tools/artifact_tool_utils.mjs')).href);
const px = (mm) => mm * 96 / 25.4;
const pageWidth = px(80);
const pageHeight = px(111);
const ppt = Presentation.create({slideSize:{width:pageWidth,height:pageHeight}});
const none = {fill:'none',width:0};
const ink = '#252B2A';
const muted = '#5C6561';
const cream = '#F9F9F5';

function rect(slide,name,x,y,w,h,fill,radius=0){
  slide.shapes.add({geometry:radius?'roundRect':'rect',name,position:{left:px(x),top:px(y),width:px(w),height:px(h)},fill,line:none,...(radius?{borderRadius:px(radius)}:{})});
}
function line(slide,name,x1,y1,x2,y2,color,widthPt){
  slide.shapes.add({geometry:'line',name,position:{left:px(x1),top:px(y1),width:px(x2-x1),height:px(y2-y1)},fill:'none',line:{style:'solid',fill:color,width:widthPt*96/72}});
}
function text(slide,name,value,x,baseline,width,sizePt,color,font='Arial',bold=false){
  // ReportLab uses lower-left baselines; PowerPoint uses upper-left frames.
  const fontPx=sizePt*96/72;
  const top=111-baseline-sizePt*0.32;
  const box=slide.shapes.add({geometry:'textbox',name,position:{left:px(x),top:px(top),width:px(width),height:fontPx*1.42},fill:'none',line:none});
  box.text=value;
  box.text.style={typeface:font,fontSize:fontPx,color,bold,wrap:'none',autoFit:'none',verticalAlignment:'top',insets:{left:0,right:0,top:0,bottom:0}};
  return box;
}
function front(v){
  const slide=ppt.slides.add();
  slide.background.fill=cream;
  rect(slide,'Farbstreifen',0,0,80,4,v.accent);
  text(slide,'Produkttitel','Gua Sha',11,98,58,22,ink,'Georgia');
  text(slide,'Material',v.material,11,89,62,10,muted,'Arial',true);
  line(slide,'Trennlinie oben',11,27,69,27,v.accent,0.7);
  text(slide,'Anleitung Titel','GEBRAUCHSANWEISUNG',11,78,60,9.5,v.accent,'Arial',true);
  const steps=[['01','Haut reinigen, Öl oder Serum auftragen.'],['02','Flach anlegen, sanft nach außen führen.'],['03','Abwischen und trocken lagern.']];
  steps.forEach(([n,t],i)=>{
    text(slide,`Schritt ${n}`,n,11,71-i*7,6,9,v.accent,'Arial',true);
    text(slide,`Anleitung ${n}`,t,18,71-i*7,54,8.4,ink);
  });
  rect(slide,'Wichtig Hintergrund',9.5,58.5,61,20.5,v.pale,2);
  text(slide,'Wichtig Titel','WICHTIG',13,48,55,9,v.accent,'Arial',true);
  text(slide,'Warnung 1','Nicht auf verletzter oder gereizter Haut',13,43.5,56,8.4,ink);
  text(slide,'Warnung 2','anwenden. Bei Irritation stoppen.',13,39.5,56,8.4,ink);
  text(slide,'Warnung 3','Kein Medizinprodukt.',13,35.5,56,8.4,ink);
  text(slide,'Hersteller Titel','HERSTELLER',11,27.5,58,8.5,v.accent,'Arial',true);
  text(slide,'Firma und Name','RHODIDE · Onur Arda Küçük',11,23,58,8.4,ink);
  text(slide,'Adresse','Saalmannstraße 9 · 13403 Berlin',11,18.5,58,8.4,muted);
  text(slide,'E-Mail','info@guasha-shop.de',11,14,58,8.4,ink);
  line(slide,'Trennlinie unten',11,100,69,100,'#D7DCD8',0.5);
  text(slide,'Produkt-ID',`ID ${v.sku}`,11,6.5,26,7.8,ink,'Arial',true);
  text(slide,'Charge Beschriftung','CHARGE',39,6.5,14,7.8,ink,'Arial',true);
  line(slide,'Charge Schreiblinie',53,104.2,69,104.2,ink,0.5);
}
async function back(v,logo){
  const slide=ppt.slides.add();
  slide.background.fill=v.reverse;
  slide.images.add({blob:logo,contentType:'image/png',alt:'Weißes Gua-Sha-Logo',fit:'contain',position:{left:px(22),top:px(37.5),width:px(36),height:px(36)}});
}
const logo=new Uint8Array(await fs.readFile(logoPath));
const steel={material:'EDELSTAHL',sku:'GS-STEEL-01',accent:'#596B77',pale:'#E8ECEF',reverse:'#5E6971'};
const xiuyan={material:'NEUE JADE (XIUYAN)',sku:'GS-JADE-01',accent:'#286D55',pale:'#E4EFE8',reverse:'#286D55'};
front(steel); await back(steel,logo);
front(xiuyan); await back(xiuyan,logo);

const staging=path.join(workspaceDir,'.codex-finalizer');
await fs.mkdir(staging,{recursive:true});
await fs.mkdir(path.dirname(FINAL_PPTX),{recursive:true});
const candidatePath=path.join(staging,'guasha-a7-candidate.pptx');
await (await PresentationFile.exportPptx(ppt)).save(candidatePath);
for(let i=0;i<ppt.slides.items.length;i++){
  const blob=await ppt.export({slide:ppt.slides.items[i],format:'png',scale:2});
  await fs.writeFile(path.join(staging,`guasha-a7-slide-${i+1}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const result=await finalizePresentation({
  workspaceDir,candidatePath,finalPath:FINAL_PPTX,pythonExecutable:RUNTIME_PYTHON,
  integrityValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs:['--expected-slide-size-emu','2880000,3996000','--validate-bullet-geometry','--validate-heading-fit'],
  explicitTotalSlideCount:4,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
  fontPolicy:{basis:'reference',families:['Arial','Georgia'],referencePath,referenceSha256:crypto.createHash('sha256').update(await fs.readFile(referencePath)).digest('hex')},
  verifyArtifactToolImport:true,
  receiptPath:path.join(staging,'guasha-a7-neue-jade.validation.json'),
});
console.log(JSON.stringify({finalPath:FINAL_PPTX,result},null,2));
