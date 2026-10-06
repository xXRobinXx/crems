import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SUPPLIERS = { aspiravi:'Aspiravi', bolt:'Bolt', cociter:'Cociter', dats24:'DATS 24', ebem:'EBEM', ecofix:'Ecofix', ecopower:'Ecopower', eneco:'Eneco', energiebe:'Energie.be', energyknights:'Energy Knights', energyvision:'EnergyVision', engie:'ENGIE', frank:'Frank Energie', luminus:'Luminus', mega:'Mega', octaplus:'OCTA+', totalenergies:'TotalEnergies', trevion:'Trevion' };
const regions={flanders:'Flanders',wallonia:'Wallonia',brussels:'Brussels'};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const ct=n=>finite(n)?Math.round(n*100*1e6)/1e6:null;
const https=s=>{try {const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};

/** Independent adapter for publicly archived factual rates. No upstream Python code. */
export function normalizeSupplierArchive(rows,{revision,month,checkedOn}) {
  if(!/^[a-f0-9]{40}$/.test(revision)||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)||!/^\d{4}-\d{2}-\d{2}$/.test(checkedOn)||!Number.isFinite(Date.parse(checkedOn+'T00:00:00Z'))||new Date(checkedOn+'T00:00:00Z').toISOString().slice(0,10)!==checkedOn)throw Error('Invalid import provenance');
  const cards=[], rejected=[];
  for(const {path,data:d} of rows){
    const parts=path.split('/');const [supplier,contract,region,file]=parts;
    if(parts.length!==4||!SUPPLIERS[supplier]||!/^[a-z0-9_]+$/.test(contract)||d.supplier!==supplier||d.contract!==contract||!regions[region]||!/^20\d{2}-(0[1-9]|1[0-2])\.json$/.test(file)||file.slice(0,7)>month)throw Error('Unexpected archive row');
    if(contract.includes('_pro_'))continue;
    const e=d.energy,t=d.taxes,kind=d.energy_kind;
    const sources=(d._sources??[]).filter(s=>/^[a-f0-9]{64}$/.test(s.pdf??'')&&https(s.url));
    const source=sources.find(s=>s.url===d.source_url)??sources.at(-1);
    // Positive vat_rate means parsed prices exclude VAT: residential Ecopower is grossed explicitly.
    const vat=t?.card_vat_rate??t?.assumed_vat_rate;
    if(!e||!t||!['fixed','variable','dynamic','tou','tou_impact','spot_monthly'].includes(kind)||!source||![0,0.06].includes(t.vat_rate)|| (vat!==undefined&&vat!==0.06)||!finite(e.yearly_fixed_fee)||e.yearly_fixed_fee<0||e.yearly_fixed_fee>10000||(['dynamic','spot_monthly'].includes(kind)&&(!finite(e.factor)||!finite(e.base)))){rejected.push(path);continue;}
    const factor=t.vat_rate===0.06?1.06:1;
    const convert=n=>ct(finite(n)?n*factor:null);
    const single=kind==='fixed'?e.single:kind==='variable'?e.current:null;
    const day=kind==='fixed'||kind==='variable'?e.peak??single:null;
    const night=kind==='fixed'||kind==='variable'?e.offpeak??single:null;
    const rateFormula=kind==='dynamic'?`spot EUR/kWh × ${e.factor} + ${e.base} EUR/kWh; ${e.quarter_hourly?'kwartier':'uur'}`:kind==='spot_monthly'?`maandindex EUR/kWh × ${e.factor} + ${e.base} EUR/kWh`:e.formula?String(e.formula).replace(/\s+/g,' ').slice(0,300):'Prijs volgens de tijdvakken en indexvoorwaarden in de bronkaart.';
    const inj=d.injection;
    const injFormula=inj&&finite(inj.factor)&&finite(inj.base)?`index EUR/kWh × ${inj.factor} + ${inj.base} EUR/kWh${inj.minimum!==null&&finite(inj.minimum)?`; minimum ${ct(inj.minimum)} ct/kWh`:''}`:inj?'Raadpleeg de bronkaart voor index, tijdvakken en voorwaarden.':'Geen injectietarief uitgelezen; geen nulvergoeding aangenomen.';
    const publicationMonth=file.slice(0,7);
cards.push({id:`${supplier}-${contract}-${region}-${publicationMonth}`,supplier:SUPPLIERS[supplier],name:contract.replaceAll('_',' '),region:regions[region],tariff:kind==='tou_impact'?'tou':kind,contractMonths:0,publicationMonth,checkedOn,sourceUrl:source.url,sourceSha256:source.pdf,vatPercent:t.card_vat_rate===0.06?6:null,annualFeeEur:Math.round(e.yearly_fixed_fee*factor*100)/100,importDayCtKwh:convert(day),importNightCtKwh:convert(night),importSingleCtKwh:convert(single),priceBasis:kind==='fixed'?'fixed':kind==='variable'?'published-variable':'interval-required',formula:rateFormula,verification:'community-extracted',archiveUrl:`https://github.com/renaudallard/be_price_cards/blob/${revision}/electricity/cards/${path}`,injection:{kind:inj?.fixed_for_term?'fixed':inj?'indexed':'unavailable',indicativeCtKwh:ct(inj?.current),minimumCtKwh:ct(inj?.minimum),formula:injFormula},conditions:'Zonder welkomstkortingen, domiciliëringskortingen, coöperatieve deelname of bijzondere meterregelingen. Controleer beschikbaarheid en voorwaarden in de bronkaart.'});
  }
  const seen=new Set();for(const c of cards){if(seen.has(c.id))throw Error('Duplicate card');seen.add(c.id);}
  const suppliers=Object.entries(SUPPLIERS).map(([id,name])=>({id,name,currentCards:cards.filter(c=>c.supplier===name&&c.publicationMonth===month).length,note:id==='dats24'?'Geen huidige kaart in het archief; controleer het opvolgaanbod bij EnergyVision.':cards.some(c=>c.supplier===name&&c.publicationMonth===month)?'Openbaar uitgelezen kaarten; geen garantie op volledige actuele marktdekking.':'Geen kaart voor deze maand; historische kaart indien beschikbaar.'}));
  return {catalog:{schemaVersion:2,cards,suppliers,archiveRevision:revision,publicationMonth:month},rejected};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [root,revision,month,checkedOn,output]=process.argv.slice(2);if(!output)throw Error('Usage: archive-root revision month checkedOn output');
 const rows=[];for(const supplier of Object.keys(SUPPLIERS)){let contracts;try{contracts=await readdir(join(root,supplier));}catch{continue;}for(const contract of contracts)for(const region of await readdir(join(root,supplier,contract))){const folder=join(root,supplier,contract,region);const files=(await readdir(folder)).filter(f=>/^20\d{2}-\d{2}\.json$/.test(f)&&f.slice(0,7)<=month).sort();const file=files.includes(month+'.json')?month+'.json':files.at(-1);if(file)rows.push({path:[supplier,contract,region,file].join('/'),data:JSON.parse(await readFile(join(folder,file),'utf8'))});}}
 const result=normalizeSupplierArchive(rows,{revision,month,checkedOn});
 if(result.rejected.length)throw Error(`Rejected rows: ${result.rejected.join(', ')}`);
 await writeFile(output,'// Public factual rates from pinned be_price_cards archive; see docs/research/local-contract-catalog.md.\nimport type { LocalContractCatalog } from "@crems/core/local-contract-catalog";\nexport const supplierArchiveCatalog: LocalContractCatalog = '+JSON.stringify(result.catalog,null,2)+';\n');
 console.log(`Imported ${result.catalog.cards.length} contract/region cards across ${result.catalog.suppliers.length} suppliers.`);
}
