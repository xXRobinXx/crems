import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeSupplierArchive,SUPPLIERS} from './import-supplier-catalog.mjs';
const provenance={revision:'a'.repeat(40),month:'2026-10',checkedOn:'2026-10-04'};
const data={supplier:'eneco',contract:'power_fix',energy_kind:'fixed',energy:{single:0.20,peak:0.21,offpeak:0.17,yearly_fixed_fee:75},taxes:{vat_rate:0,card_vat_rate:0.06},source_url:'https://example.com/card.pdf',_sources:[{url:'https://example.com/card.pdf',pdf:'b'.repeat(64)}],injection:null};
const row=(d=data,path='eneco/power_fix/flanders/2026-10.json')=>({path,data:d});
test('all 18 real suppliers, residential region, EUR-to-cent conversion and pinned evidence',()=>{
 const {catalog,rejected}=normalizeSupplierArchive([row()],provenance);assert.deepEqual(rejected,[]);assert.equal(Object.keys(SUPPLIERS).length,18);assert.equal(catalog.suppliers.length,18);const c=catalog.cards[0];assert.equal(c.importDayCtKwh,21);assert.equal(c.importNightCtKwh,17);assert.equal(c.importSingleCtKwh,20);assert.equal(c.annualFeeEur,75);assert.equal(c.injection.indicativeCtKwh,null);assert.equal(c.injection.kind,'unavailable');assert.equal(c.contractMonths,0);assert.ok(c.archiveUrl.includes(provenance.revision));assert.equal(catalog.suppliers.find(s=>s.id==='dats24').currentCards,0);
});
test('professional cards excluded, uncertain VAT not assumed, explicit residential ex-VAT grossed once',()=>{
 assert.equal(normalizeSupplierArchive([row({...data,contract:'eneco_pro_fixed'},'eneco/eneco_pro_fixed/flanders/2026-10.json')],provenance).catalog.cards.length,0);
 const uncertain=normalizeSupplierArchive([row({...data,taxes:{vat_rate:0,assumed_vat_rate:0.06}})],provenance).catalog.cards[0];assert.equal(uncertain.vatPercent,null);assert.equal(uncertain.importSingleCtKwh,20);
 const ex=normalizeSupplierArchive([row({...data,taxes:{vat_rate:0.06,card_vat_rate:0.06}})],provenance).catalog.cards[0];assert.equal(ex.importSingleCtKwh,21.2);assert.equal(ex.annualFeeEur,79.5);
 assert.equal(normalizeSupplierArchive([row({...data,taxes:{vat_rate:0.21,card_vat_rate:0.21}})],provenance).rejected.length,1);
});
test('dynamic/month-index and missing prices remain null, no fabricated annual rate',()=>{
 for(const kind of ['dynamic','spot_monthly','tou']){const c=normalizeSupplierArchive([row({...data,energy_kind:kind,energy:{yearly_fixed_fee:40,factor:1.1,base:0.02}})],provenance).catalog.cards[0];assert.equal(c.importDayCtKwh,null);assert.equal(c.importNightCtKwh,null);assert.equal(c.priceBasis,'interval-required');}
 const c=normalizeSupplierArchive([row({...data,energy_kind:'variable',energy:{current:-0.01,yearly_fixed_fee:40}})],provenance).catalog.cards[0];assert.equal(c.importDayCtKwh,-1);assert.equal(c.priceBasis,'published-variable');
});
test('bad sources, identity, duplicate rows and revision fail closed',()=>{
 assert.equal(normalizeSupplierArchive([row({...data,_sources:[{url:'https://user:secret@example.com/card',pdf:'b'.repeat(64)}]})],provenance).rejected.length,1);
 assert.throws(()=>normalizeSupplierArchive([row({...data,supplier:'mega'})],provenance));assert.throws(()=>normalizeSupplierArchive([row(),row()],provenance));assert.throws(()=>normalizeSupplierArchive([row()],{...provenance,revision:'main'}));
});
