import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type BelpexPoint = Readonly<{start:string;resolutionMinutes:15|60;priceEurMwh:number}>;
export type BelpexArchive = Readonly<{start:string;end:string;points:ReadonlyArray<BelpexPoint>}>;

const path=fileURLToPath(new URL("../data/belpex-day-ahead-2021-09-01_2026-08-31.csv",import.meta.url));

export const loadBelpexArchive=(text=readFileSync(path,"utf8")):BelpexArchive=>{
  const lines=text.trim().split(/\r?\n/);if(lines.shift()!=="start_utc,resolution_minutes,price_eur_mwh")throw new Error("INVALID_BELPEX_HEADER");
  const points:BelpexPoint[]=[];
  for(const line of lines){const [start,resolutionText,priceText]=line.split(",");const timestamp=Date.parse(start??"");const resolution=Number(resolutionText),price=Number(priceText);if(!Number.isFinite(timestamp)||(resolution!==15&&resolution!==60)||!Number.isFinite(price))throw new Error("INVALID_BELPEX_ROW");points.push({start:new Date(timestamp).toISOString(),resolutionMinutes:resolution,priceEurMwh:price});}
  if(points.length===0)throw new Error("EMPTY_BELPEX_ARCHIVE");
  for(let index=1;index<points.length;index++){const previous=points[index-1]!,current=points[index]!;if(Date.parse(current.start)!==Date.parse(previous.start)+previous.resolutionMinutes*60_000)throw new Error("INCOMPLETE_BELPEX_ARCHIVE");}
  const first=points[0]!,last=points.at(-1)!;return{start:first.start,end:new Date(Date.parse(last.start)+last.resolutionMinutes*60_000).toISOString(),points};
};

export const selectBelpexRange=(archive:BelpexArchive,start:string,end:string)=>{
  const from=Date.parse(start),until=Date.parse(end);if(!Number.isFinite(from)||!Number.isFinite(until)||until<=from||until-from>5*366*86_400_000)return undefined;
  const points=archive.points.filter(point=>{const time=Date.parse(point.start);return time<until&&time+point.resolutionMinutes*60_000>from;});
  const covered=points.length>0&&Date.parse(points[0]!.start)<=from&&Date.parse(points.at(-1)!.start)+points.at(-1)!.resolutionMinutes*60_000>=until;
  return{start:new Date(from).toISOString(),end:new Date(until).toISOString(),quality:covered?"complete" as const:"incomplete" as const,source:"Elexys · EPEX SPOT Belgium",unit:"EUR/MWh" as const,points};
};
