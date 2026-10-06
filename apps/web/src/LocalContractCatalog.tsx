import { useEffect, useState } from "react";
import { estimateLocalContract, localCardStatus, type LocalContractCatalog as Catalog } from "@crems/core/local-contract-catalog";
import { loadLocalContractCatalog } from "./local-contract-catalog";
import { regionForPostalCode, type ContractMarketInput } from "./contract-market";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "success"; catalog: Catalog };
const money = (value: number) => value.toLocaleString("nl-BE", { style: "currency", currency: "EUR" });
const rate = (value: number | null) => value === null ? "niet uitgelezen" : `${value.toLocaleString("nl-BE")} ct/kWh`;
const regionNames = { Flanders: "Vlaanderen", Brussels: "Brussel", Wallonia: "Wallonië" };
const tariffNames = { fixed: "Vast", variable: "Variabel", dynamic: "Dynamisch", tou: "Meerdere tijdvakken", spot_monthly: "Maandindex" };

export function LocalContractCatalog({ input }: { input: ContractMarketInput }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [supplier, setSupplier] = useState("all");
  const [tariff, setTariff] = useState("all");
  const [limit, setLimit] = useState(20);
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    void loadLocalContractCatalog(controller.signal).then(catalog => {
      if (!controller.signal.aborted) setState({ status: "success", catalog });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ status: "error", message: error instanceof Error ? error.message : "De tariefkaarten konden niet worden geladen." });
    });
    return () => controller.abort();
  }, [attempt]);
  const region = regionForPostalCode(input.postalCode);
  const catalog = state.status === "success" ? state.catalog : undefined;
  const suppliers = catalog?.suppliers?.map(s => s.name) ?? [...new Set(catalog?.cards.map(c => c.supplier) ?? [])];
  const cards = (catalog?.cards ?? []).filter(card => (!region || card.region === region) && (supplier === "all" || supplier === card.supplier) && (tariff === "all" || tariff === card.tariff)).sort((a,b) => a.supplier.localeCompare(b.supplier) || a.name.localeCompare(b.name) || a.region.localeCompare(b.region));
  return <section className="contract-results local-contract-catalog" aria-label="Lokale contractcatalogus">
    <h2>Publieke tariefkaarten, lokaal berekend</h2>
    <p>Je postcode en verbruik blijven in deze browser. De catalogus omvat de leveranciers uit de openbare integratie; ontbrekende actuele kaarten blijven zichtbaar. Geen garantie op volledige marktdekking of het goedkoopste aanbod.</p>
    <button className="primary" type="button" disabled={state.status === "loading" || !region || ![input.annualDayKwh, input.annualNightKwh, input.annualInjectionDayKwh, input.annualInjectionNightKwh].every(value => Number.isFinite(value) && value >= 0 && value <= 100_000) || !(input.annualDayKwh + input.annualNightKwh > 0)} onClick={() => { setSupplier("all"); setTariff("all"); setLimit(20); setState({ status: "loading" }); setAttempt(value => value + 1); }}>{state.status === "loading" ? "Aanbiedingen ophalen…" : "Haal aanbiedingen op"}</button>
    <p>Deze knop haalt de publieke tariefkaarten op en berekent de beschikbare energiecomponenten met je ingevulde jaarverbruik. Vul eerst je postcode en afname in. Historische kaarten en contracten zonder passende prijsgegevens krijgen geen jaarbedrag.</p>
    {state.status === "loading" && <p role="status">Tariefkaarten laden…</p>}
    {state.status === "error" && <><p role="alert">{state.message}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Probeer tariefkaarten opnieuw</button></>}
    {catalog && <>
      <div className="form-grid"><label>Leverancier<select value={supplier} onChange={event=>{setSupplier(event.target.value);setLimit(20);}}><option value="all">Alle leveranciers</option>{suppliers.map(name=><option key={name} value={name}>{name}</option>)}</select></label><label>Prijssoort in lokale catalogus<select value={tariff} onChange={event=>{setTariff(event.target.value);setLimit(20);}}><option value="all">Alle prijssoorten</option>{Object.entries(tariffNames).map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label></div>
      <p role="status">{cards.length} contract-/regiokaarten{region ? ` voor ${regionNames[region]}` : " · vul je postcode in voor jouw gewest"}. Alfabetisch weergegeven; vaste kosten en variabele scenario's zijn geen gezamenlijke ranglijst.</p>
      {catalog.suppliers && <details className="report-details"><summary>Dekking van alle {catalog.suppliers.length} leveranciers</summary><ul>{catalog.suppliers.map(s=><li key={s.id}><strong>{s.name}</strong>: {s.currentCards} kaarten in archiefmaand {catalog.publicationMonth}, over alle gewesten. {s.note}</li>)}</ul><p>Community-archiefrevisie {catalog.archiveRevision}. Een actuele kaart is geen bewijs dat dit product vandaag nog nieuw afsluitbaar is.</p></details>}
      <p>Variabele bedragen zijn scenario's als de gepubliceerde prijzen een heel jaar gelijk zouden blijven. Dynamische en tijdvakcontracten vereisen passende interval- en indexgegevens. Kortingen, netkosten, heffingen en overige factuurcomponenten zijn niet inbegrepen.</p>
    </>}
    {catalog && cards.length === 0 && <p role="status">Voor {region ? regionNames[region] : "dit gewest"} en deze filters bevat de lokale catalogus nog geen tariefkaart.</p>}
    {cards.slice(0,limit).map(card => {
      const status = localCardStatus(card, new Date());
      const estimate = region ? estimateLocalContract(card, region, input, new Date()) : undefined;
      const community = card.verification === "community-extracted";
      return <article key={card.id}>
        <h3>{card.supplier} · {card.name}</h3>
        <p>{regionNames[card.region]} · {tariffNames[card.tariff]} · {card.contractMonths ? `${card.contractMonths} maanden` : "looptijd: zie bronvoorwaarden"} · aanbodkaart {card.publicationMonth}</p>
        <p className={status === "current" ? "" : "chart-warning"}>{status === "current" ? (community ? "Uitgelezen kaart voor deze maand — community-bron" : "Gecontroleerde gepubliceerde kaart voor deze maand") : status === "expired" ? "Verouderde aanbodkaart — geen actuele jaarberekening" : "Aanbodkaart nog niet geldig — geen jaarberekening"} · {community ? "archiefimport" : "gecontroleerd"} {card.checkedOn}</p>
        {estimate ? <div role="status"><strong>{money(estimate.importAndFeeEur)} / jaar voor afname + vaste vergoeding{estimate.priceBasis === "published-variable-scenario" ? " · variabel scenario" : " · vaste prijzen"}</strong><p>Indicatief energiecomponentscenario bij jouw dag-/nachtvolumes: {money(estimate.importEnergyEur)} afname + {money(estimate.annualFeeEur)} vergoeding. Netkosten, capaciteitstarief, heffingen en overige bijdragen zijn niet inbegrepen.</p><p>{estimate.injectionCreditEur === null ? "Injectievergoeding niet berekend: daarvoor zijn passende index-/tijdvakgegevens en injectievolumes nodig. Geen netto jaarbedrag berekend." : "Geen injectie opgegeven."}</p></div> : status === "current" && <p>{card.vatPercent === null ? "Btwbasis onvoldoende herleidbaar — geen jaarberekening." : card.priceBasis === "interval-required" ? "Geen jaarberekening uit dag-/nachttotalen: dit contract vereist interval- of maandindexgegevens." : card.importDayCtKwh === null || card.importNightCtKwh === null ? "Afnameprijs niet volledig uitgelezen — geen jaarberekening." : "Vul een passende postcode en een positief jaarverbruik in om de afnamecomponent lokaal te berekenen."}</p>}
        <details className="report-details"><summary>Tarieven, voorwaarden en bron bekijken</summary>
          <dl><div><dt>Afname dag / nacht · {card.vatPercent === null ? "btwpercentage niet uitgelezen" : `incl. ${card.vatPercent}% btw`}</dt><dd>{rate(card.importDayCtKwh)} / {rate(card.importNightCtKwh)}</dd></div>{card.importSingleCtKwh !== undefined && <div><dt>Enkelvoudig tarief · niet gebruikt in dag-/nachtscenario</dt><dd>{rate(card.importSingleCtKwh)}</dd></div>}<div><dt>Vaste vergoeding · {card.vatPercent === null ? "btwbasis controleren" : "incl. btw"}</dt><dd>{money(card.annualFeeEur)} / jaar</dd></div><div><dt>Injectie · {card.injection.kind === "fixed" ? "vast volgens extractie" : "gepubliceerde indicatie, variabel of onbekend"}</dt><dd>{rate(card.injection.indicativeCtKwh)}</dd></div></dl>
          {card.formula && <p>Afname: {card.formula}</p>}<p>Injectie: {card.injection.formula}. Geen injectiejaarvergoeding berekend.</p>
          {card.conditions && <p>{card.conditions}</p>}{community && <p>Automatisch uitgelezen door het openbare community-project; niet iedere kaart is onafhankelijk door CREMS gecontroleerd. Controleer de originele kaart vóór een keuze.</p>}
          <a href={card.sourceUrl} target="_blank" rel="noreferrer">Bekijk de originele tariefkaart</a>{card.archiveUrl && <p><a href={card.archiveUrl} target="_blank" rel="noreferrer">Bekijk de gebruikte archiefextractie</a></p>}<p>Bron-PDF SHA256: {card.sourceSha256}</p>
        </details>
      </article>;
    })}
    {cards.length > limit && <button type="button" onClick={()=>setLimit(value=>value+20)}>Toon nog {Math.min(20,cards.length-limit)} contracten</button>}
  </section>;
}
