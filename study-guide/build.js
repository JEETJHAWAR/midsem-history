// Builds the study guide: concatenates src/*.html, injects SVG maps, prints a PDF.
// Usage: node build.js            -> History_Midsem_Study_Guide.{html,pdf}
//        node build.js --lite     -> History_Midsem_Exam_Essentials.{html,pdf}
const fs = require('fs');
const path = require('path');

// --lite builds the short "Exam Essentials" edition from src-lite/.
const LITE = process.argv.includes('--lite');
const SRC = path.join(__dirname, LITE ? 'src-lite' : 'src');
const OUT_BASE = LITE ? 'History_Midsem_Exam_Essentials' : 'History_Midsem_Study_Guide';
const OUT_HTML = path.join(__dirname, OUT_BASE + '.html');
const OUT_PDF = path.join(__dirname, OUT_BASE + '.pdf');

// ---------- Map projection (simple equirectangular) ----------
const LON0 = 28, LAT0 = 46, K = 8; // x = (lon-28)*8, y = (46-lat)*8
const W = (126 - LON0) * K, H = (LAT0 + 13) * K;
const P = (lon, lat) => [((lon - LON0) * K).toFixed(1), ((LAT0 - lat) * K).toFixed(1)];
const poly = pts => pts.map(([a, b]) => P(a, b).join(',')).join(' ');

const AFRICA = [[28,31.3],[32.3,31.3],[32.5,30],[33.5,27.5],[35.5,23.5],[37.2,19],[39.5,15.5],[43.3,12],[51.2,11.8],[49,6],[44,1],[41,-2],[39.5,-6],[39.3,-9],[40.5,-11],[40.5,-13],[28,-13]];
const EURASIA = [[28,46],[28,36.8],[36,36.5],[35,33],[34.3,31.3],[32.6,30],[34.5,28],[35,28],[39,21.5],[42.7,15],[43.4,12.7],[45,12.8],[49,14.2],[52.2,15.6],[55.5,17.5],[57.8,19],[59.8,22.5],[58.6,23.7],[56.3,26.3],[54.5,24.2],[51.6,24.6],[51.5,26],[50.2,26.6],[48.5,28.4],[47.9,30],[48.8,30.2],[50.3,29.3],[51.4,27.9],[54.5,26.6],[56.5,27.1],[58.8,25.6],[61.6,25.2],[66.6,25.4],[67.3,24.7],[68.5,23.5],[70.2,22.6],[69,22.3],[70.2,20.9],[72.6,21.3],[72.8,19],[73.4,16],[74.7,13],[76,10],[77.5,8.1],[78.2,8.9],[79.3,10.3],[79.9,12],[80.3,15],[81.5,16.4],[82.3,17],[84.5,19],[86.5,20.2],[87,21.5],[88.5,21.7],[89.5,22],[90.5,22.6],[91.5,22.5],[92.3,20.7],[94.2,19],[94.4,16],[95.5,15.8],[97.6,16.5],[97.8,14],[98.6,10],[98.3,8],[100.3,6],[101.2,3],[103.4,1.3],[104.2,1.4],[103.4,4],[102.3,6.2],[100.3,7.6],[100,9.5],[99.2,10.5],[100,13.4],[100.9,13.4],[102.3,12.2],[103,11],[104.6,10.4],[105,8.6],[106.8,10.4],[109.3,11.8],[109.2,13.8],[108.3,16],[106.6,17.5],[105.6,19],[106.7,20.6],[108,21.6],[109.8,21.5],[110.2,20.2],[111,21.5],[113.5,22.2],[116.5,23],[118.5,24.5],[119.6,25.8],[120.5,27.5],[121.8,30],[121,31.5],[120.5,34],[119.3,35],[120.5,36.2],[122.5,37.3],[121,37.8],[119,37.2],[118,38.5],[117.6,39.1],[119.5,40.2],[121.5,40.8],[122,40.5],[124.5,40],[126,39.6],[126,46]];
const ISLANDS = [
  [[79.9,9.8],[80.2,9.8],[81.4,8.5],[81.9,7],[81.3,6.2],[80.1,6],[79.8,7.5]], // Sri Lanka
  [[95.3,5.6],[97.5,5.2],[100.3,2.5],[103.6,-1],[106,-3.2],[105.8,-5.8],[104.5,-5.9],[102.3,-4],[100.3,-1],[98.7,1.7],[96,3.8]], // Sumatra
  [[105.2,-6.8],[106.5,-6],[108.3,-6.3],[110.4,-6.9],[112.6,-6.9],[114.5,-7.8],[114.4,-8.7],[111,-8.2],[108.5,-7.8],[106.4,-7.4]], // Java
  [[109,1.7],[110.5,1.7],[113,3.2],[115.5,5],[117.2,7],[119,5.2],[118,4.4],[117.6,1],[116.2,-1.5],[116,-3.7],[114.3,-3.5],[111.7,-3],[110.1,-1.7],[109,0]], // Borneo
  [[108.7,19.2],[110.5,20.1],[111,19.6],[110.3,18.4],[109,18.5]], // Hainan
  [[120.2,23],[121.5,25.2],[121.9,24.6],[120.9,22]], // Taiwan
  [[48.6,-13],[49.3,-12],[50.3,-13]], // Madagascar tip
];

const PLACES = {
  Baghdad:[44.4,33.3], Basra:[47.8,30.5], Siraf:[52.6,27.7], Hormuz:[56.5,27.1], Muscat:[58.4,23.6], Aden:[45,12.8],
  Cairo:[31.2,30], Alexandria:[29.9,31.2], Jeddah:[39.2,21.5], Kilwa:[39.5,-8.9], Malindi:[40.1,-3.2], Suez:[32.5,29.9],
  Cambay:[72.6,22.3], Surat:[72.8,21.2], Diu:[71,20.7], Calicut:[75.8,11.25], Cochin:[76.3,10], Quilon:[76.6,8.9], Goa:[73.8,15.5],
  Bombay:[72.9,19], Madras:[80.3,13.1], Masulipatnam:[81.1,16.2], Pulicat:[80.3,13.4], Calcutta:[88.4,22.6],
  SriLanka:[80.6,7.8], Anuradhapura:[80.4,8.3], Nagapattinam:[79.8,10.8], Tamralipti:[87.9,22.3], Chittagong:[91.8,22.3], Dhaka:[90.4,23.8],
  Pataliputra:[85.1,25.6], Nalanda:[85.4,25.1], Vikramashila:[87.3,25.3], Kanauj:[79.9,27.1], Mathura:[77.7,27.5], Delhi:[77.2,28.6],
  Peshawar:[71.6,34], Taxila:[72.8,33.7], Bamiyan:[67.8,34.8], Kashmir:[74.8,34.1], Guwahati:[91.7,26.1], Lhasa:[91.1,29.6], Pandua:[88.1,25.1],
  Kunming:[102.7,25], Bhamo:[97.2,24.3], Mandalay:[96.1,22], Arakan:[92.9,20.1], Pegu:[96.5,17.3], Andamans:[92.7,12],
  Kedah:[100.4,6.1], Malacca:[102.25,2.2], Palembang:[104.8,-3], Java:[110.4,-7.6], RatuBoko:[110.5,-7.8], Jiaozhi:[105.8,21], OcEo:[105.1,10.2], Champa:[108.3,15.9],
  Canton:[113.3,23.1], Quanzhou:[118.6,24.9], Yangzhou:[119.4,32.4], Nanjing:[118.8,32], Kongwang:[119.2,34.6], Shandong:[120.3,36],
  ChangAn:[108.9,34.3], Dunhuang:[94.7,40.1], Turfan:[89.2,42.9], Kucha:[83,41.7], Khotan:[79.9,37.1], Kashgar:[76,39.5], Samarkand:[67,39.6], Bukhara:[64.4,39.8], Wuwei:[102.6,37.9],
  Takuapa:[98.3,8.9], KlongThom:[99.1,7.9], Nakhon:[99.9,8.4], Barus:[98.4,2], Kutei:[117,-0.5], WestJava:[106.7,-6.6], NhaTrang:[109.2,12.2], MySon:[108.1,15.8], Champasak:[105.8,14.9],
};
const LABEL = { SriLanka:'Sri Lanka', ChangAn:"Chang'an (Xi'an)", OcEo:'Oc Eo (Funan)', RatuBoko:'Ratu Boko', KlongThom:'Klong Thom', Nakhon:'Nakhon Si Thammarat', WestJava:'Ciaruteun (W. Java)', NhaTrang:'Vo Canh', MySon:'My Son', Kongwang:'Mt Kongwang', Canton:'Canton (Guangzhou)', Quanzhou:'Quanzhou (Zaitun)', Palembang:'Palembang (Srivijaya)', Tamralipti:'Tamralipti (Tamluk)', Shandong:'Shandong (Faxian lands)', Java:'Java (Yepoti?)', Kutei:'Kutei (Borneo)', Barus:'Barus' };

// sea-lane waypoints (lon,lat) keep routes off land
const HORMUZ_STRAIT = [[56.8,26.6],[57.6,25.2]];
const CAPE_COMORIN = [76.4,7.4];
const S_LANKA = [80.5,5.3];
const N_SUMATRA = [95,6.5];
const MALACCA_STRAIT_N = [99.5,4.5];
const MALACCA_STRAIT_S = [101.8,2];
const SINGAPORE = [104.5,1];
const VIETNAM_S = [109.8,9];
const VIETNAM_C = [110.5,13];
const HAINAN_E = [112,19];
const CANTON_E = [116.5,22.4];
const HORN = [[43.5,-1],[50,5],[52.5,11.5]];
const RED_SEA_S = [[41.5,16],[43.3,12.6]];
const SUNDA = [[101,-4],[105.6,-6.2]];
const JAVA_TO_CHINA = [[108,-5],[106.5,2],VIETNAM_S,VIETNAM_C,HAINAN_E,[121,27]];
const BAY_TO_MALACCA = [[93,15],[97,6.8],MALACCA_STRAIT_N];
const MALACCA_TO_CANTON = [SINGAPORE,VIETNAM_S,VIETNAM_C,HAINAN_E];

const MAPS = {
  overview: {
    title: 'The connected world of this course (schematic)',
    routes: [
      { pts:['ChangAn','Dunhuang','Khotan','Kashgar','Samarkand','Bukhara','Baghdad'], cls:'land', label:'Overland Silk Roads' },
      { pts:['Basra','Siraf',...HORMUZ_STRAIT,'Muscat','Calicut',CAPE_COMORIN,'SriLanka','Andamans','Kedah',MALACCA_STRAIT_S,'Malacca',...MALACCA_TO_CANTON,'Canton',CANTON_E,'Quanzhou'], cls:'sea', label:'Maritime routes (Baghdad–Canton)' },
      { pts:['Aden','Cambay'], cls:'sea' },
      { pts:['Cambay',[72,17],[74,9],S_LANKA,N_SUMATRA,MALACCA_STRAIT_N,'Malacca'], cls:'sea' },
      { pts:['Kilwa','Malindi',...HORN,'Aden'], cls:'sea' },
      { pts:['Kunming','Bhamo','Chittagong','Pataliputra'], cls:'south', label:'Southern Silk Road' },
      { pts:['Lhasa','Pataliputra'], cls:'south' },
    ],
    points: ['Baghdad','Basra','Siraf','Hormuz','Aden','Cairo','Kilwa','Cambay','Calicut','SriLanka','Nagapattinam','Tamralipti','Pataliputra','Kedah','Malacca','Palembang','Canton','Quanzhou','ChangAn','Dunhuang','Khotan','Samarkand','Kunming','Lhasa','Chittagong'],
    monsoon: true,
  },
  pilgrims: {
    title: 'Routes of the three Chinese pilgrims (approximate)',
    routes: [
      { pts:['ChangAn','Dunhuang','Khotan','Peshawar','Taxila','Mathura','Pataliputra','Tamralipti','SriLanka',...SUNDA,'Java',...JAVA_TO_CHINA,'Shandong'], cls:'faxian', label:'Faxian 399–413' },
      { pts:['ChangAn','Dunhuang','Turfan','Kucha','Samarkand','Bamiyan','Kanauj','Nalanda'], cls:'xuanzang', label:'Xuanzang 627–645 (outward)' },
      { pts:['Nalanda','Kashmir','Kashgar','Khotan','Dunhuang','ChangAn'], cls:'xuanzang2', label:'Xuanzang (return)' },
      { pts:['ChangAn','Yangzhou','Canton','Palembang',MALACCA_STRAIT_S,MALACCA_STRAIT_N,...BAY_TO_MALACCA.slice(0,2).reverse(),'Tamralipti','Nalanda'], cls:'yijing', label:'Yijing 671–695 (by sea)' },
    ],
    points: ['ChangAn','Dunhuang','Khotan','Turfan','Kucha','Samarkand','Bamiyan','Peshawar','Mathura','Kanauj','Nalanda','Pataliputra','Tamralipti','SriLanka','Java','Palembang','Canton','Yangzhou','Shandong'],
  },
  baghdad_canton: {
    title: 'The Baghdad–Canton sea route (Akhbar al-Sin wa’l-Hind, 9th c.) and the later Cambay–Malacca axis (Pires)',
    routes: [
      { pts:['Baghdad','Basra','Siraf',...HORMUZ_STRAIT,'Muscat','Quilon',CAPE_COMORIN,S_LANKA,'Andamans','Kedah',MALACCA_STRAIT_S,'Malacca',SINGAPORE,VIETNAM_S,VIETNAM_C,'Champa',HAINAN_E,'Canton'], cls:'sea', label:'Basra/Siraf → Malabar → Kedah → Canton' },
      { pts:['Cambay',[72,17],[74,9],S_LANKA,N_SUMATRA,MALACCA_STRAIT_N,'Malacca'], cls:'gold', label:'Cambay → Malacca (Pires, 1510s)' },
      { pts:['Aden','Cambay'], cls:'gold' },
      { pts:['Malindi',...HORN,'Aden'], cls:'gold' },
      { pts:['Cairo','Suez','Jeddah',...RED_SEA_S,'Aden'], cls:'sea' },
      { pts:['Canton',CANTON_E,'Quanzhou'], cls:'sea' },
    ],
    points: ['Baghdad','Basra','Siraf','Hormuz','Muscat','Aden','Jeddah','Cairo','Malindi','Cambay','Calicut','Quilon','Andamans','Kedah','Malacca','Palembang','Champa','Canton','Quanzhou','Delhi'],
    monsoon: true,
  },
  silk_roads: {
    title: 'Two lenses: Chang’an as terminus (Hansen) and Bengal as circulatory centre (Bhattacharya)',
    routes: [
      { pts:['ChangAn','Wuwei','Dunhuang','Turfan','Kucha','Kashgar','Samarkand','Bukhara'], cls:'land', label:'Northern overland routes' },
      { pts:['Dunhuang','Khotan','Kashgar'], cls:'land' },
      { pts:['Kunming','Bhamo','Guwahati','Pataliputra'], cls:'south', label:'Southern routes: Yunnan–Assam/Arakan–Bengal' },
      { pts:['Kunming','Mandalay','Arakan','Chittagong'], cls:'south' },
      { pts:['Lhasa','Pataliputra'], cls:'south' },
      { pts:['Tamralipti','SriLanka'], cls:'sea' },
      { pts:['Chittagong',...BAY_TO_MALACCA,'Malacca',...MALACCA_TO_CANTON,'Canton'], cls:'sea', label:'Bay of Bengal – South China Sea' },
    ],
    points: ['ChangAn','Wuwei','Dunhuang','Turfan','Kucha','Khotan','Kashgar','Samarkand','Bukhara','Kunming','Bhamo','Mandalay','Arakan','Chittagong','Dhaka','Tamralipti','Guwahati','Lhasa','Pataliputra','Pandua','Canton','Malacca','SriLanka'],
  },
  maritime_buddhism: {
    title: 'Maritime Buddhist networks (Tansen Sen)',
    routes: [
      { pts:['Tamralipti','SriLanka',...SUNDA,'Java',...JAVA_TO_CHINA.slice(0,5),'Canton'], cls:'faxian', label:'Sri Lanka–Java–China route (Faxian, Gunavarman)' },
      { pts:['Canton','Palembang',MALACCA_STRAIT_S,MALACCA_STRAIT_N,[97,6.8],[93,15],'Tamralipti','Nalanda'], cls:'yijing', label:'Yijing via Srivijaya (Palembang)' },
      { pts:['Vikramashila','Tamralipti',[89,15],[95.5,8],MALACCA_STRAIT_N,MALACCA_STRAIT_S,'Palembang'], cls:'atisa', label:'Atisa: Bengal ↔ Suvarnadvipa (1012–c.1025)' },
      { pts:['Vikramashila','Lhasa'], cls:'atisa' },
      { pts:['OcEo','Jiaozhi','Nanjing'], cls:'sea', label:'Funan–Jiaozhi–Nanjing (3rd–6th c.)' },
    ],
    points: ['Tamralipti','Nalanda','Vikramashila','SriLanka','Anuradhapura','Kedah','Palembang','Java','RatuBoko','OcEo','Jiaozhi','Canton','Nanjing','Kongwang','Lhasa','ChangAn'],
  },
  religion_network: {
    title: 'Inscriptions and sacred sites of the Hindu–Buddhist maritime world (Guy; H.P. Ray)',
    routes: [
      { pts:['Nagapattinam','Takuapa','Kedah',[100.5,4.5],MALACCA_STRAIT_S,[103.5,-0.5],'Palembang'], cls:'sea', label:'Tamil merchant routes' },
      { pts:['Nagapattinam','Barus'], cls:'sea' },
      { pts:['Kedah',MALACCA_STRAIT_S,SINGAPORE,VIETNAM_S,VIETNAM_C,'Champa',HAINAN_E,'Canton',CANTON_E,'Quanzhou'], cls:'sea' },
      { pts:['Palembang',[103.5,-0.5],MALACCA_STRAIT_S,MALACCA_STRAIT_N,[93,15],'Tamralipti','Nalanda'], cls:'atisa', label:'Srivijaya patronage: Nalanda & Nagapattinam' },
      { pts:[MALACCA_STRAIT_N,N_SUMATRA,'Nagapattinam'], cls:'atisa' },
    ],
    points: ['Nagapattinam','Nalanda','Tamralipti','SriLanka','Takuapa','KlongThom','Nakhon','Kedah','Barus','Palembang','WestJava','Kutei','NhaTrang','MySon','Champasak','Canton','Quanzhou'],
  },
  indian_ocean_1500: {
    title: 'Indian Ocean c.1500–1800: Asian hubs, Portuguese bases, English presidencies (T. Roy)',
    routes: [
      { pts:['Aden','Cambay'], cls:'sea' },
      { pts:['Cambay',[72,17],[74,9],S_LANKA,N_SUMATRA,MALACCA_STRAIT_N,'Malacca'], cls:'sea', label:'Main Asian trade axes' },
      { pts:['Hormuz',[66,23.5],[69.5,20.5],[72,20.8],'Cambay'], cls:'sea' },
      { pts:['Kilwa','Malindi','Calicut'], cls:'sea' },
      { pts:['Calicut',CAPE_COMORIN,S_LANKA], cls:'sea' },
      { pts:['Masulipatnam',N_SUMATRA], cls:'sea' },
    ],
    points: ['Aden','Hormuz','Basra','Kilwa','Malindi','Cambay','Diu','Surat','Bombay','Goa','Calicut','Cochin','Masulipatnam','Pulicat','Madras','Calcutta','Chittagong','Malacca','SriLanka'],
    marks: { portuguese:['Goa','Cochin','Hormuz','Malacca','Diu'], english:['Bombay','Madras','Calcutta'] },
  },
};

function mapSVG(id) {
  const m = MAPS[id];
  if (!m) throw new Error('unknown map ' + id);
  const parts = [];
  parts.push(`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="map" role="img" aria-label="${m.title}">`);
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" class="sea-bg"/>`);
  parts.push(`<polygon class="land-fill" points="${poly(EURASIA)}"/>`);
  parts.push(`<polygon class="land-fill" points="${poly(AFRICA)}"/>`);
  ISLANDS.forEach(i => parts.push(`<polygon class="land-fill" points="${poly(i)}"/>`));
  // sea names
  const sea = (t, lon, lat) => { const [x, y] = P(lon, lat); return `<text x="${x}" y="${y}" class="sea-name">${t}</text>`; };
  parts.push(sea('ARABIAN SEA', 60, 14), sea('BAY OF BENGAL', 84, 14.5), sea('INDIAN OCEAN', 70, -4), sea('SOUTH CHINA SEA', 112, 13), sea('PERSIAN GULF', 50.5, 27.2).replace('sea-name','sea-name small'), sea('RED SEA', 36.5, 20).replace('sea-name','sea-name small'));
  if (m.monsoon) {
    const arrow = (a, b, cls) => { const [x1, y1] = P(...a), [x2, y2] = P(...b); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" marker-end="url(#ah-${cls})"/>`; };
    parts.push(`<defs><marker id="ah-sw" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="9" refY="5.5" orient="auto"><path d="M0,0 L11,5.5 L0,11 z" class="ah-sw"/></marker><marker id="ah-ne" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" refX="9" refY="5.5" orient="auto"><path d="M0,0 L11,5.5 L0,11 z" class="ah-ne"/></marker></defs>`);
    parts.push(arrow([55, 7], [61, 13], 'sw'), arrow([84, 5], [89, 11], 'sw'));
    parts.push(arrow([68, 19], [63, 14], 'ne'), arrow([93, 17], [88, 12], 'ne'), arrow([116, 17], [112, 11], 'ne'));
    const [lx, ly] = P(28.8, 45);
    parts.push(`<g class="legend"><rect x="${lx}" y="${ly}" width="150" height="40" rx="4"/><line x1="${+lx + 8}" y1="${+ly + 13}" x2="${+lx + 30}" y2="${+ly + 13}" class="sw"/><text x="${+lx + 36}" y="${+ly + 16}">SW monsoon (Jun–Sep)</text><line x1="${+lx + 8}" y1="${+ly + 29}" x2="${+lx + 30}" y2="${+ly + 29}" class="ne"/><text x="${+lx + 36}" y="${+ly + 32}">NE monsoon (Nov–Mar)</text></g>`);
  }
  // routes
  const legendItems = [];
  m.routes.forEach(r => {
    const pts = r.pts.map(n => { if (Array.isArray(n)) return P(...n).join(','); if (!PLACES[n]) throw new Error('no place ' + n); return P(...PLACES[n]).join(','); }).join(' ');
    parts.push(`<polyline points="${pts}" class="route ${r.cls}"/>`);
    if (r.label) legendItems.push(r);
  });
  // marks
  const marks = m.marks || {};
  (m.points || []).forEach(n => {
    const [x, y] = P(...PLACES[n]);
    let cls = 'pt';
    if ((marks.portuguese || []).includes(n)) cls += ' pt-port';
    if ((marks.english || []).includes(n)) cls += ' pt-eng';
    parts.push(`<circle cx="${x}" cy="${y}" r="3.2" class="${cls}"/>`);
    const lab = LABEL[n] || n;
    const off = (OFFSETS[id] && OFFSETS[id][n]) || OFFSETS._default[n] || [5, -4];
    const anchor = off[2] || 'start';
    parts.push(`<text x="${(+x + off[0]).toFixed(1)}" y="${(+y + off[1]).toFixed(1)}" class="pt-label" text-anchor="${anchor}">${lab}</text>`);
  });
  // legend
  if (legendItems.length || m.marks) {
    const lx = (m.legendX || 300), ly0 = H - 14 - 16 * (legendItems.length + (m.marks ? 2 : 0)) + 14;
    parts.push(`<g class="legend"><rect x="${lx - 8}" y="${ly0 - 14}" width="240" height="${16 * (legendItems.length + (m.marks ? 2 : 0)) + 14}" rx="4"/>`);
    legendItems.forEach((r, i) => {
      const y = ly0 + i * 16;
      parts.push(`<line x1="${lx}" y1="${y - 4}" x2="${lx + 26}" y2="${y - 4}" class="route ${r.cls}"/><text x="${lx + 32}" y="${y}">${r.label}</text>`);
    });
    if (m.marks) {
      const y = ly0 + legendItems.length * 16;
      parts.push(`<circle cx="${lx + 13}" cy="${y - 4}" r="4" class="pt pt-port"/><text x="${lx + 32}" y="${y}">Portuguese base (16th c.)</text>`);
      parts.push(`<circle cx="${lx + 13}" cy="${y + 12}" r="4" class="pt pt-eng"/><text x="${lx + 32}" y="${y + 16}">English presidency town (17th c.)</text>`);
    }
    parts.push(`</g>`);
  }
  parts.push(`</svg>`);
  return `<figure class="mapfig">${parts.join('')}<figcaption>${m.title}. Coastlines simplified; positions approximate.</figcaption></figure>`;
}

// label offsets: [dx, dy, anchor]
const OFFSETS = {
  silk_roads: { Chittagong:[0,13,'middle'], Dhaka:[5,7], Arakan:[-6,12,'end'] },
  _default: {
    Basra:[5,10], Siraf:[4,11], Hormuz:[5,-5], Muscat:[5,10], Aden:[-5,13,'end'], Cairo:[-4,-6,'start'], Alexandria:[5,-5], Jeddah:[-5,4,'end'], Kilwa:[5,4], Malindi:[5,4],
    Cambay:[-5,-4,'end'], Surat:[-5,4,'end'], Diu:[-5,0,'end'], Calicut:[-5,4,'end'], Cochin:[-5,8,'end'], Quilon:[-5,6,'end'], Goa:[-5,3,'end'], Bombay:[-5,0,'end'],
    Madras:[5,4], Masulipatnam:[5,0], Pulicat:[5,-3], Calcutta:[5,10], SriLanka:[6,8], Anuradhapura:[6,-2], Nagapattinam:[5,4], Tamralipti:[-5,10,'end'], Chittagong:[5,6], Dhaka:[5,-3],
    Pataliputra:[-5,-5,'end'], Nalanda:[4,9], Vikramashila:[5,-5], Kanauj:[-5,-4,'end'], Mathura:[-5,4,'end'], Delhi:[-5,-4,'end'], Peshawar:[-5,-4,'end'], Taxila:[5,5], Bamiyan:[-5,-4,'end'], Kashmir:[5,-4],
    Guwahati:[5,-4], Lhasa:[5,-4], Pandua:[5,-3], Kunming:[5,-4], Bhamo:[5,-4], Mandalay:[5,4], Arakan:[-5,10,'end'], Pegu:[5,4], Andamans:[5,4],
    Kedah:[-5,4,'end'], Malacca:[-5,10,'end'], Palembang:[6,4], Java:[-6,12,'end'], RatuBoko:[5,12], Jiaozhi:[-5,-4,'end'], OcEo:[-5,10,'end'], Champa:[5,4],
    Canton:[5,8], Quanzhou:[-4,-6,'end'], Yangzhou:[5,4], Nanjing:[5,-2], Kongwang:[5,-3], Shandong:[5,-4],
    ChangAn:[5,-5], Dunhuang:[5,-5], Turfan:[5,-5], Kucha:[-5,-5,'end'], Khotan:[5,9], Kashgar:[-5,-5,'end'], Samarkand:[-5,-5,'end'], Bukhara:[-5,9,'end'], Wuwei:[5,4],
    Takuapa:[-5,-2,'end'], KlongThom:[-5,7,'end'], Nakhon:[5,4], Barus:[-5,4,'end'], Kutei:[5,4], WestJava:[-5,12,'end'], NhaTrang:[5,4], MySon:[5,0], Champasak:[-5,-4,'end'], Baghdad:[5,-5],
  },
};

function build() {
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.html')).sort();
  let body = files.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
  body = body.replace(/<!--MAP:([a-z_0-9]+)-->/g, (_, id) => mapSVG(id));
  let css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
  if (LITE) css += '\n' + fs.readFileSync(path.join(__dirname, 'style-lite.css'), 'utf8');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>World &amp; Indian History — Mid-term Study Guide</title><style>${css}</style></head><body>${body}</body></html>`;
  fs.writeFileSync(OUT_HTML, html);
  return html;
}

async function pdf() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + OUT_HTML, { waitUntil: 'load' });
  await page.pdf({
    path: OUT_PDF, format: 'A4', printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-family:Inter,sans-serif;font-size:7px;color:#8a93a3;width:100%;padding:0 15mm;display:flex;justify-content:space-between"><span>BMS-01 · World &amp; Indian History · ${LITE ? 'Exam Essentials (simple version)' : 'Mid-term Study Guide'}</span><span>Sessions 1–4, 6–11</span></div>`,
    footerTemplate: '<div style="font-family:Inter,sans-serif;font-size:7.5px;color:#8a93a3;width:100%;text-align:center">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  });
  await browser.close();
}

build();
if (!process.argv.includes('--html-only')) pdf().then(() => console.log('PDF written:', OUT_PDF)).catch(e => { console.error(e); process.exit(1); });
else console.log('HTML written:', OUT_HTML);
