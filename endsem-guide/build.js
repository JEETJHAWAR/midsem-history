// Builds the study guide: concatenates src/*.html, injects SVG maps, prints a PDF.
// Usage: node build.js            -> History_Endsem_Study_Guide.{html,pdf}
//        node build.js --lite     -> History_Endsem_Exam_Essentials.{html,pdf}
//        node build.js --qa       -> History_Endsem_Model_Answers.{html,pdf}
const fs = require('fs');
const path = require('path');

// --lite builds the short "Exam Essentials" edition from src-lite/.
// --qa builds the "Model Answers" collection from src-qa/ (uses the lite styles too).
const QA = process.argv.includes('--qa');
const LITE = QA || process.argv.includes('--lite');
const SRC = path.join(__dirname, QA ? 'src-qa' : LITE ? 'src-lite' : 'src');
const OUT_BASE = QA ? 'History_Endsem_Model_Answers' : LITE ? 'History_Endsem_Exam_Essentials' : 'History_Endsem_Study_Guide';
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
  [[119.5,-5.5],[120.4,-2.9],[119.8,0],[120.9,1.3],[123,0.9],[124.3,1.4],[125,1.6],[123.2,0.5],[121.5,0.5],[121.2,-1],[122.8,-1],[123.3,-0.9],[122.3,-2.7],[122.4,-4.7],[121.2,-4.6],[120.5,-5.6]], // Sulawesi
  [[39.2,-5.7],[39.4,-5.9],[39.5,-6.4],[39.3,-6.5]], // Zanzibar
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
  Socotra:[53.8,12.5], Kish:[53.95,26.55], Somnath:[70.4,20.9], Thana:[72.97,19.2], Mangalore:[74.85,12.9], Motupalli:[80.3,15.75], Visakhapatnam:[83.3,17.7], Pasai:[97.2,5.1], Aidhab:[36.3,22.3], Berenike:[35.47,23.91], Quseir:[34.28,26.1], Barbarikon:[67.4,24.6], Sulawesi:[121.7,-2.4], Moluccas:[125.4,0.9], ThaKae:[100.7,14.8], Belitung:[107.9,-2.9],
  Qasim:[43.97,26.33], Kuwait:[47.98,29.37], Bahrain:[50.55,26.2], Jubayl:[49.66,27.0], Uqayr:[50.2,25.65], Karachi:[67.0,24.86], Zanzibar:[39.2,-6.16], Madinah:[39.6,24.47], Mecca:[39.8,21.4], Bushire:[50.84,28.97], BandarAbbas:[56.27,27.18], Mocha:[43.25,13.32], Hudayda:[42.95,14.8], Lamu:[40.9,-2.27], Maldives:[73.5,4.2], Porbandar:[69.6,21.64],
  Patna:[85.1,25.6], Penang:[100.33,5.41], Singapore:[103.85,1.29], Lintin:[113.8,22.4], Macao:[113.55,22.2], HongKong:[114.17,22.3], Rangoon:[96.16,16.8], Colombo:[79.86,6.93], Ahmadabad:[72.58,23.03], Baroda:[73.18,22.3], Broach:[72.98,21.7], Agra:[78.0,27.18], Ponnani:[75.93,10.77], Gresik:[112.65,-7.16], Trowulan:[112.38,-7.56], Lamreh:[95.6,5.55], Brunei:[114.9,4.9], Sanya:[109.5,18.25], Chaul:[72.93,18.55], Daibul:[67.5,24.75], Kayal:[78.12,8.57], Batavia:[106.8,-6.2], Daman:[72.83,20.4], Aceh:[95.32,5.55], Pontian:[103.3,3.8], Oman:[57.5,22.3], Plassey:[88.25,23.8], Pondicherry:[79.83,11.93], Seringapatam:[76.68,12.42], Benkulen:[102.26,-3.8], Basra2:[47.8,30.5],
};
const LABEL = { Cairo:'Fustat (Old Cairo)', Qasim:'al-Qasim (Buraydah, Unayzah)', Jubayl:'al-Jubayl', Uqayr:'al-Uqayr', BandarAbbas:'Bandar Abbas (Gombroon)', Mocha:'Mocha (al-Mukka)', HongKong:'Hong Kong', Lintin:'Lintin', Sulawesi:'Sulawesi (Pontanoa)', Moluccas:'Moluccas →', ThaKae:'Tha Kae', Belitung:'Belitung wreck (c.826)', Quseir:'Quseir al-Qadim', Chaul:'Saymur (Chaul)', Kayal:'Kayal (Ma‘abar)', Lamreh:'Lamreh', Trowulan:'Trowulan (Majapahit)', Pontian:'Pontian boat', Oman:'Oman (Sohar)', Daibul:'Daibul', Patna:'Patna (Bihar opium)', Basra2:'Basra', Visakhapatnam:'Visakhapatnam', Motupalli:'Motupalli',  SriLanka:'Sri Lanka', ChangAn:"Chang'an (Xi'an)", OcEo:'Oc Eo (Funan)', RatuBoko:'Ratu Boko', KlongThom:'Klong Thom', Nakhon:'Nakhon Si Thammarat', WestJava:'Ciaruteun (W. Java)', NhaTrang:'Vo Canh', MySon:'My Son', Kongwang:'Mt Kongwang', Canton:'Canton (Guangzhou)', Quanzhou:'Quanzhou (Zaitun)', Palembang:'Palembang (Srivijaya)', Tamralipti:'Tamralipti (Tamluk)', Shandong:'Shandong (Faxian lands)', Java:'Java (Yepoti?)', Kutei:'Kutei (Borneo)', Barus:'Barus' };

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
  s12_medieval: {
    title: 'Chakravarti’s Indian Ocean, c. 500–1500: South Asia as the hinge',
    routes: [
      { pts:['Cairo','Aidhab',[38.5,19],[41.5,16],RED_SEA_S[1],'Aden'], cls:'gold', label:'Geniza route: Fustat → Aidhab → Aden' },
      { pts:['Aden',[52,12.5],[62,12.5],'Mangalore'], cls:'gold', label:'Aden → Malabar (Ben Yiju at Mangalore)' },
      { pts:['Siraf','Kish',...HORMUZ_STRAIT,[62,23.5],[68,21.5],'Somnath'], cls:'sea', label:'Persian Gulf → Gujarat / Konkan' },
      { pts:[[68,21.5],'Thana'], cls:'sea' },
      { pts:['Hormuz',[60,22],[64,16],[71,12],'Calicut'], cls:'land', label:'Sea-borne (bahri) horses to Malabar' },
      { pts:['Calicut','Quilon',CAPE_COMORIN,S_LANKA,'Nagapattinam'], cls:'sea' },
      { pts:['Nagapattinam',[86,9],[94,7],'Kedah',MALACCA_STRAIT_S,[103.5,-0.5],'Palembang'], cls:'atisa', label:'Chola reach: Kadaram campaign 1025' },
      { pts:['Nagapattinam',[86,5],[95,3.2],'Barus'], cls:'atisa' },
      { pts:['Chittagong',[89,15],[80,6],'Maldives'], cls:'south', label:'Rice out, cowries in (Bengal–Maldives)' },
    ],
    points: ['Cairo','Aidhab','Aden','Socotra','Siraf','Kish','Hormuz','Daibul','Cambay','Somnath','Thana','Mangalore','Calicut','Quilon','SriLanka','Nagapattinam','Motupalli','Visakhapatnam','Tamralipti','Chittagong','Maldives','Kedah','Barus','Palembang'],
    monsoon: true, legendX: 330,
  },
  s12_qusman: {
    title: 'al-Sharida’s Qusman network, c. 1850–1950: desert interior linked to the ocean',
    routes: [
      { pts:['Qasim','Kuwait'], cls:'land', label:'Camel caravans (about 20 days one way)' },
      { pts:['Qasim','Jubayl'], cls:'land' }, { pts:['Qasim','Uqayr'], cls:'land' },
      { pts:['Qasim',[45,29.5],'Basra','Baghdad'], cls:'land' },
      { pts:['Qasim','Madinah'], cls:'land' },
      { pts:['Kuwait',[50.5,27.8],...HORMUZ_STRAIT,[62,22.5],[68,20.5],'Bombay'], cls:'sea', label:'Horses, pearls, dates, gold → India' },
      { pts:['Bahrain',[52.5,26.6],HORMUZ_STRAIT[0]], cls:'sea' },
      { pts:['Bombay',[72,15],[74,9],CAPE_COMORIN,S_LANKA,[84,12],'Calcutta'], cls:'gold', label:'Rice, tea, textiles, spices ← India' },
      { pts:['Muscat',[52,10],[45,0],'Zanzibar'], cls:'south', label:'Oman–East Africa (slaves, weapons)' },
      { pts:['Bombay',[63,13],[50,12.6],'Aden',RED_SEA_S[0],[38.8,20],'Jeddah'], cls:'gold' },
    ],
    points: ['Qasim','Kuwait','Basra','Baghdad','Bahrain','Jubayl','Uqayr','Muscat','Madinah','Jeddah','Aden','Karachi','Bombay','Calcutta','Zanzibar'],
    legendX: 330,
  },
  s13_commodities: {
    title: 'Where the cloth, spices and aromatics came from — and where archaeology has found them',
    routes: [
      { pts:['Cambay',[66,20],[56,14],[50,12.4],'Aden',RED_SEA_S[0],[38.5,19.5],'Berenike'], cls:'gold', label:'Indian cloth & indigo to the Red Sea' },
      { pts:['Berenike','Quseir','Cairo'], cls:'gold' },
      { pts:['Barbarikon',[62,23],...HORMUZ_STRAIT.slice().reverse(),'Siraf','Basra','Baghdad'], cls:'sea', label:'Gulf route to the Caliphate (the "hinge")' },
      { pts:['Calicut',[66,13],[58,17],'Muscat'], cls:'sea' },
      { pts:['Cambay',[74,12],S_LANKA,N_SUMATRA,MALACCA_STRAIT_N,MALACCA_STRAIT_S,SINGAPORE,[107,-4],'Java'], cls:'atisa', label:'Indian textiles east (Java, Sulawesi, Thailand)' },
      { pts:[[107,-4],[115,-6],[119,-4.5]], cls:'atisa' },
      { pts:['Belitung',[106.5,2],VIETNAM_S,VIETNAM_C,HAINAN_E,'Canton'], cls:'land', label:'Belitung ship (China ceramics westward)' },
    ],
    points: ['Cairo','Quseir','Berenike','Aden','Baghdad','Basra','Siraf','Muscat','Barbarikon','Cambay','Calicut','Quilon','SriLanka','Barus','ThaKae','Java','Sulawesi','Moluccas','Belitung','Canton'],
    legendX: 300,
  },
  s14_islam: {
    title: 'Wade’s arc of Islam across the Indian Ocean to 1500',
    routes: [
      { pts:['Basra','Siraf',...HORMUZ_STRAIT,[60,20],[70,11],'Quilon',CAPE_COMORIN,S_LANKA,[90,7],'Kedah',MALACCA_STRAIT_S,'Malacca',SINGAPORE,VIETNAM_S,'Champa',HAINAN_E,'Canton',CANTON_E,'Quanzhou'], cls:'sea', label:'Merchant route Gulf → Quilon → Kalah → Canton' },
      { pts:['Cambay',[72,15],[76,5],N_SUMATRA,'Pasai'], cls:'gold', label:'Cambay gravestones to Pasai & Gresik (Lambourn)' },
      { pts:['Pasai',MALACCA_STRAIT_N,MALACCA_STRAIT_S,SINGAPORE,[108,-4],'Gresik'], cls:'gold' },
      { pts:['Quanzhou',[118,21],[113,16],[111,10],[107.8,3],[107.5,-4.5],'Gresik'], cls:'atisa', label:'1360s refugees from Quanzhou to Java' },
      { pts:['Champa','Sanya'], cls:'atisa', label:'980s Cham Muslims to Hainan & Guangzhou' },
    ],
    points: ['Basra','Siraf','Hormuz','Aden','Chaul','Cambay','Calicut','Ponnani','Quilon','Kayal','SriLanka','Kedah','Lamreh','Pasai','Barus','Malacca','Palembang','Gresik','Trowulan','Brunei','Champa','Sanya','Canton','Quanzhou'],
    legendX: 300,
  },
  s15_ships: {
    title: 'Shipbuilding traditions (Burningham) and the first steam link (1830)',
    routes: [
      { pts:['Bombay',[66,17],[58,14],[51,12.3],'Aden',RED_SEA_S[0],[38,21],'Suez'], cls:'gold', label:'Bombay–Suez steam mail, 1830 (Suez Canal 1869)' },
    ],
    points: ['Oman','Muscat','Surat','Bombay','Lamu','Zanzibar','Maldives','Nagapattinam','Pontian','Java','Belitung','Malacca','Pasai','Suez','Hormuz'],
    legendX: 330,
    regions: [
      { lon:52, lat:19.5, text:'ARABIAN SEA TRADITION', sub:'sewn-plank ("stitched") hulls' },
      { lon:42, lat:-3.8, text:'SWAHILI', sub:'mtepe: sewn + edge-dowelled' },
      { lon:68, lat:2.5, text:'MALDIVIAN', sub:'edge-dowelled' },
      { lon:83, lat:8.6, text:'OTHER INDIAN', sub:'dovetail straps, flat bottoms' },
      { lon:113, lat:-10.8, text:'SOUTHEAST ASIAN', sub:'lashed-lug; the jong' },
    ],
  },
  s17_surat: {
    title: 'Surat and the Company factories in Gujarat and North India (17th–18th c.)',
    routes: [
      { pts:['Surat','Broach','Baroda','Ahmadabad','Agra'], cls:'land', label:'Inland factories: indigo & textiles' },
      { pts:['Broach','Cambay'], cls:'land' },
      { pts:['Surat',[66,18],[56,14],[50,12.4],'Mocha'], cls:'sea', label:'Surat shipping to the Red Sea & Gulf' },
      { pts:['Surat',[66,22.5],...HORMUZ_STRAIT.slice().reverse(),'BandarAbbas'], cls:'sea' },
      { pts:[HORMUZ_STRAIT[0],'Basra'], cls:'sea' },
      { pts:['Surat',[72,15],[74,9],S_LANKA,N_SUMATRA,'Aceh'], cls:'gold', label:'East to Aceh and (VOC) Batavia' },
      { pts:['Aceh',MALACCA_STRAIT_N,MALACCA_STRAIT_S,[104.5,-2],'Batavia'], cls:'gold' },
    ],
    points: ['Surat','Ahmadabad','Cambay','Agra','Bombay','Goa','Mocha','BandarAbbas','Basra','Jeddah','Aceh','Batavia','Madras','Calcutta'],
    marks: { english:['Bombay','Madras','Calcutta'], portuguese:['Goa'] },
    markLabels: ['Portuguese base','English presidency town'],
    legendX: 330,
  },
  s19_opium: {
    title: 'The opium–silver–tea circuit: India → Southeast Asia → China (Trocki, Bowen, Furber)',
    routes: [
      { pts:['Patna','Calcutta',[89.5,19],[93,13],[97,7],'Penang',MALACCA_STRAIT_S,'Singapore',[106,4],[110,10],[113.5,19],'Lintin','Canton'], cls:'gold', label:'Bengal opium (auctioned at Calcutta) by clipper' },
      { pts:['Bombay',[72,15],[74,9],S_LANKA,N_SUMATRA,MALACCA_STRAIT_N], cls:'sea', label:'Bombay raw cotton (and later opium) to Canton' },
      { pts:['Canton',[114.5,18],[111,12],[108.5,6],[104.8,2.2],[101.5,3.1],[97.5,6.4],[88,10],[80.8,4.8],[74.6,8.4],[72.6,16]], cls:'atisa', label:'Silver back to India ("golden current")' },
    ],
    points: ['Patna','Calcutta','Bombay','Madras','Penang','Malacca','Singapore','Lintin','Macao','HongKong','Canton','Benkulen'],
    legendX: 290,
  },
  s20_ports: {
    title: 'Port cities of the western Indian Ocean (Barendse) and the colonial port cities (Kosambi & Brush)',
    routes: [
      { pts:['Surat',[64,23],...HORMUZ_STRAIT.slice().reverse(),'Bushire','Basra'], cls:'sea', label:'Western India ↔ Gulf' },
      { pts:['Bombay',[63,14],[51,12.3],'Aden',RED_SEA_S[0],'Mocha',[41.2,17],'Jeddah'], cls:'sea', label:'Western India ↔ Red Sea' },
      { pts:['Muscat',[54,12],[46,2],'Lamu','Zanzibar'], cls:'south', label:'Gulf / Red Sea ↔ East Africa' },
      { pts:['Aden',[48,6],[42,-1],'Zanzibar'], cls:'south' },
    ],
    points: ['Basra','Kuwait','Bushire','BandarAbbas','Bahrain','Muscat','Jeddah','Hudayda','Mocha','Aden','Lamu','Zanzibar','Surat','Porbandar','Bombay','Madras','Calcutta','Colombo','Rangoon','Penang','Singapore','HongKong'],
    marks: { english:['Bombay','Madras','Calcutta'] },
    markLabels: [null,'Kosambi & Brush’s three port cities'],
    legendX: 330,
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
  (m.regions || []).forEach(r => {
    const [x, y] = P(r.lon, r.lat);
    parts.push(`<text x="${x}" y="${y}" class="region-name" text-anchor="middle">${r.text}</text><text x="${x}" y="${+y + 12}" class="region-sub" text-anchor="middle">${r.sub}</text>`);
  });
  // legend
  if (legendItems.length || m.marks) {
    const lx = (m.legendX || 300), ly0 = H - 14 - 16 * (legendItems.length + (m.marks ? 2 : 0)) + 14;
    parts.push(`<g class="legend"><rect x="${lx - 8}" y="${ly0 - 14}" width="270" height="${16 * (legendItems.length + (m.marks ? 2 : 0)) + 14}" rx="4"/>`);
    legendItems.forEach((r, i) => {
      const y = ly0 + i * 16;
      parts.push(`<line x1="${lx}" y1="${y - 4}" x2="${lx + 26}" y2="${y - 4}" class="route ${r.cls}"/><text x="${lx + 32}" y="${y}">${r.label}</text>`);
    });
    if (m.marks) {
      const y = ly0 + legendItems.length * 16;
      const ml = m.markLabels || ['Portuguese base (16th c.)', 'English presidency town (17th c.)'];
      if (ml[0]) parts.push(`<circle cx="${lx + 13}" cy="${y - 4}" r="4" class="pt pt-port"/><text x="${lx + 32}" y="${y}">${ml[0]}</text>`);
      if (ml[1]) parts.push(`<circle cx="${lx + 13}" cy="${y + 12}" r="4" class="pt pt-eng"/><text x="${lx + 32}" y="${y + 16}">${ml[1]}</text>`);
    }
    parts.push(`</g>`);
  }
  parts.push(`</svg>`);
  return `<figure class="mapfig">${parts.join('')}<figcaption>${m.title}. Coastlines simplified; positions approximate.</figcaption></figure>`;
}

// label offsets: [dx, dy, anchor]
const OFFSETS = {
  silk_roads: { Chittagong:[0,13,'middle'], Dhaka:[5,7], Arakan:[-6,12,'end'] },
  s12_qusman: { Basra:[5,10], Baghdad:[5,-5], Kuwait:[5,-3], Bahrain:[6,4], Jubayl:[-5,-4,'end'], Uqayr:[-5,8,'end'], Madinah:[-5,4,'end'] },
  s17_surat: { Surat:[-5,4,'end'], Broach:[5,6], Baroda:[5,3], Cambay:[-5,-4,'end'], Ahmadabad:[5,-2], Daman:[-5,6,'end'], Bombay:[-5,6,'end'], Basra:[5,10] },
  s20_ports: { Kuwait:[-4,-6,'end'], Basra:[5,-4], Bushire:[5,-3], Bahrain:[-5,4,'end'], BandarAbbas:[5,-4], Surat:[-5,-3,'end'], Porbandar:[-5,5,'end'], Bombay:[-5,8,'end'] },
  s19_opium: { Lintin:[-5,-6,'end'], Macao:[-5,10,'end'], HongKong:[5,10], Canton:[5,-4], Singapore:[5,8], Malacca:[-5,4,'end'], Penang:[-5,-2,'end'], Benkulen:[-5,10,'end'] },
  s14_islam: { Lamreh:[-5,-4,'end'], Pasai:[5,-4], Barus:[-5,6,'end'], Trowulan:[5,12], Gresik:[5,-3], Sanya:[5,6], Ponnani:[-5,10,'end'], Chaul:[-5,0,'end'], Kayal:[5,8] },
  s12_medieval: { Somnath:[-5,6,'end'], Thana:[-5,4,'end'], Daibul:[-5,-3,'end'], Kish:[3,11], Motupalli:[5,6], Visakhapatnam:[5,-2] },
  s13_commodities: { Berenike:[-5,4,'end'], Quseir:[5,-3], Cairo:[-4,-6,'start'], Belitung:[5,10], Java:[-6,12,'end'], Sulawesi:[5,10], ThaKae:[5,-3] },
  s15_ships: { Surat:[-5,-3,'end'], Bombay:[-5,8,'end'], Oman:[5,6], Muscat:[5,-4], Suez:[5,-3], Pontian:[5,4], Belitung:[5,10], Pasai:[5,-4] },
  _default: {
    Basra:[5,10], Siraf:[4,11], Hormuz:[5,-5], Muscat:[5,10], Aden:[-5,13,'end'], Cairo:[-4,-6,'start'], Alexandria:[5,-5], Jeddah:[-5,4,'end'], Kilwa:[5,4], Malindi:[5,4],
    Cambay:[-5,-4,'end'], Surat:[-5,4,'end'], Diu:[-5,0,'end'], Calicut:[-5,4,'end'], Cochin:[-5,8,'end'], Quilon:[-5,6,'end'], Goa:[-5,3,'end'], Bombay:[-5,0,'end'],
    Madras:[5,4], Masulipatnam:[5,0], Pulicat:[5,-3], Calcutta:[5,10], SriLanka:[6,8], Anuradhapura:[6,-2], Nagapattinam:[5,4], Tamralipti:[-5,10,'end'], Chittagong:[5,6], Dhaka:[5,-3],
    Pataliputra:[-5,-5,'end'], Nalanda:[4,9], Vikramashila:[5,-5], Kanauj:[-5,-4,'end'], Mathura:[-5,4,'end'], Delhi:[-5,-4,'end'], Peshawar:[-5,-4,'end'], Taxila:[5,5], Bamiyan:[-5,-4,'end'], Kashmir:[5,-4],
    Guwahati:[5,-4], Lhasa:[5,-4], Pandua:[5,-3], Kunming:[5,-4], Bhamo:[5,-4], Mandalay:[5,4], Arakan:[-5,10,'end'], Pegu:[5,4], Andamans:[5,4],
    Kedah:[-5,4,'end'], Malacca:[-5,10,'end'], Palembang:[6,4], Java:[-6,12,'end'], RatuBoko:[5,12], Jiaozhi:[-5,-4,'end'], OcEo:[-5,10,'end'], Champa:[5,4],
    Canton:[5,8], Quanzhou:[-4,-6,'end'], Yangzhou:[5,4], Nanjing:[5,-2], Kongwang:[5,-3], Shandong:[5,-4],
    ChangAn:[5,-5], Dunhuang:[5,-5], Turfan:[5,-5], Kucha:[-5,-5,'end'], Khotan:[5,9], Kashgar:[-5,-5,'end'], Samarkand:[-5,-5,'end'], Bukhara:[-5,9,'end'], Wuwei:[5,4],
    Socotra:[5,4], Aden:[-5,13,'end'], Zanzibar:[5,4], Lamu:[5,4], Maldives:[5,4], Mangalore:[-5,4,'end'], Jeddah:[-5,4,'end'], Mocha:[-5,6,'end'], Hudayda:[-5,0,'end'], Colombo:[-5,8,'end'], Rangoon:[5,4], Patna:[-5,-5,'end'], Karachi:[-5,4,'end'], Agra:[5,-3], Goa:[-5,3,'end'], Batavia:[-5,10,'end'], Aceh:[-5,-4,'end'], Moluccas:[-4,-6,'end'], Brunei:[5,-2], Barbarikon:[-5,-4,'end'],
    Takuapa:[-5,-2,'end'], KlongThom:[-5,7,'end'], Nakhon:[5,4], Barus:[-5,4,'end'], Kutei:[5,4], WestJava:[-5,12,'end'], NhaTrang:[5,4], MySon:[5,0], Champasak:[-5,-4,'end'], Baghdad:[5,-5],
  },
};

function build() {
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.html')).sort();
  let body = files.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
  body = body.replace(/<!--MAP:([a-z_0-9]+)-->/g, (_, id) => mapSVG(id));
  let css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
  if (LITE) css += '\n' + fs.readFileSync(path.join(__dirname, 'style-lite.css'), 'utf8');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>World &amp; Indian History — End-term Study Guide</title><style>${css}</style></head><body>${body}</body></html>`;
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
    headerTemplate: `<div style="font-family:Inter,sans-serif;font-size:7px;color:#8a93a3;width:100%;padding:0 15mm;display:flex;justify-content:space-between"><span>BMS-01 · World &amp; Indian History · ${QA ? 'End-term Model Answers' : LITE ? 'End-term Exam Essentials (simple version)' : 'End-term Study Guide'}</span><span>Sessions 12–15, 17–22</span></div>`,
    footerTemplate: '<div style="font-family:Inter,sans-serif;font-size:7.5px;color:#8a93a3;width:100%;text-align:center">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  });
  await browser.close();
}

build();
if (!process.argv.includes('--html-only')) pdf().then(() => console.log('PDF written:', OUT_PDF)).catch(e => { console.error(e); process.exit(1); });
else console.log('HTML written:', OUT_HTML);
