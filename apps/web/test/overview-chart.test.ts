import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {build} from "esbuild";
import {fullBrusselsDayWindow} from "../src/day-window.ts";

const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const bundled = await build({entryPoints:[fileURLToPath(new URL("../src/App.tsx",import.meta.url))],bundle:true,write:false,format:"esm",platform:"node",logLevel:"silent",plugins:[{name:"overview-runtime",setup(b){
  b.onResolve({filter:/^react(?:\/jsx-runtime)?$/},args=>({path:args.path,namespace:"runtime"}));
  b.onLoad({filter:/.*/,namespace:"runtime"},args=>({contents:args.path==="react"?'export const useState=()=>{}; export const useRef=()=>{}; export const useMemo=()=>{}; export const useEffect=()=>{};':'export const Fragment="fragment"; export const jsx=(type,props,key)=>({type,props,key}); export const jsxs=jsx;'}));
  b.onLoad({filter:/App\.tsx$/},()=>({contents:source.replaceAll('new Date()', 'new Date("2026-09-22T12:00:00.000Z")')+'\nexport {PowerHistoryPanel};',loader:"tsx"}));
  b.onLoad({filter:/price-chart\.ts$/},async args=>({contents:(await readFile(args.path,"utf8")).replaceAll('Date.now()', 'Date.parse("2026-09-22T12:00:00.000Z")'),loader:"ts"}));
}}]});
const {PowerHistoryPanel} = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0]!.text).toString("base64")}`);
type Element = {type:any;props:any};
function expand(value:any):any {
  if(Array.isArray(value))return value.map(expand);
  if(!value||typeof value!=="object")return value;
  if(typeof value.type==="function")return expand(value.type(value.props));
  return {...value,props:{...value.props,children:expand(value.props.children)}};
}
function elements(tree:any):Element[] {
  if(Array.isArray(tree))return tree.flatMap(elements);
  return tree&&typeof tree==="object"?[tree,...elements(tree.props?.children)]:[];
}
const render=(selection:"today"|"tomorrow", priceStatus="success", powerStatus="success")=>{
  const window=fullBrusselsDayWindow(selection,new Date("2026-09-22T12:00:00.000Z"));
  const timestamp=(hour:number)=>new Date(Date.parse(window.start)+hour*3600000).toISOString();
  const price={day:selection,...window,quality:"measured",points:[{timestamp:timestamp(0),priceCtKwh:-2},{timestamp:timestamp(1),priceCtKwh:5},{timestamp:timestamp(2),priceCtKwh:0}]};
  const power={...window,quality:"measured",import:[{timestamp:timestamp(0),powerW:100},{timestamp:timestamp(1),powerW:200}],export:[{timestamp:timestamp(0),powerW:30},{timestamp:timestamp(1),powerW:40}]};
  return expand(PowerHistoryPanel({selection,onSelection:()=>{},state:powerStatus==="success"?{status:"success",data:power}:{status:powerStatus},priceState:priceStatus==="success"?{status:"success",data:price}:{status:priceStatus}}));
};

test("vandaag behoudt vermogen en prijs in precies één SVG met afzonderlijke assen",()=>{
  const tree=render("today"),nodes=elements(tree),svg=nodes.filter(n=>n.type==="svg");
  assert.equal(svg.length,1);
  const contents=elements(svg[0]);
  for(const color of ["#4ba3ff","#33d6a6","#ffb84d"])assert.ok(contents.some(n=>n.type==="path"&&n.props.stroke===color));
  assert.ok(contents.some(n=>n.type==="text"&&Number(n.props.x)===-8&&n.props.textAnchor==="end"));
  assert.ok(contents.some(n=>n.type==="text"&&n.props.x===878&&n.props.textAnchor==="start"));
  assert.match(svg[0]!.props["aria-label"],/Home Assistant met linkeras in watt en spotprijs van Energy-Charts\.info met rechteras in ct per kWh/);
  assert.equal(nodes.filter(n=>n.props?.className==="chart-times").length,1);
  assert.equal(nodes.filter(n=>n.type==="time").length,5);
  assert.equal(nodes.filter(n=>n.type==="details").length,2);
  assert.match(JSON.stringify(tree),/Laagste gepubliceerde prijs/);
  assert.match(JSON.stringify(tree),/einde afgeleid/);
});
test("morgen toont uitsluitend prijs in één SVG en nooit vermogenspaths",()=>{
  const nodes=elements(render("tomorrow")),svg=nodes.filter(n=>n.type==="svg");
  assert.equal(svg.length,1);
  const paths=elements(svg[0]).filter(n=>n.type==="path");
  assert.equal(paths.length,1);assert.equal(paths[0]!.props.stroke,"#ffb84d");
  assert.equal(nodes.filter(n=>n.props?.className==="chart-times").length,1);
  assert.match(JSON.stringify(nodes),/Vermogen wordt pas morgen gemeten/);
});

test("prijsfout laat vandaag de vermogensgrafiek bestaan",()=>{
  const nodes=elements(render("today","error"));
  assert.equal(nodes.filter(n=>n.type==="svg").length,1);
  assert.equal(nodes.filter(n=>n.type==="path"&&n.props.stroke==="#ffb84d").length,0);
  assert.match(JSON.stringify(nodes),/energieprijs kon niet worden geladen/);
});

test("spotprijzen blijven zichtbaar wanneer Home Assistant niet verbonden is",()=>{
  const nodes=elements(render("today","success","unavailable"));
  const svg=nodes.find(n=>n.type==="svg");
  assert.ok(svg);
  assert.match(svg.props["aria-label"],/Energy-Charts\.info/);
  assert.ok(elements(svg).some(n=>n.type==="path"&&n.props.stroke==="#ffb84d"));
  assert.equal(elements(svg).some(n=>n.type==="path"&&n.props.stroke==="#4ba3ff"),false);
});
