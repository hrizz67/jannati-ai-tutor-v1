import"./rolldown-runtime-hePW80VL.js";import{i as e,t}from"./vendor-react-DmFoF-aV.js";e();var n=`/jannati-ai-tutor-v1/assets/janna-ClSwW60N.png`,r=t();function i({size:e=64,className:t=``}){let i=typeof e==`number`?e:64;return(0,r.jsx)(`img`,{src:n,alt:`Janna`,className:`janna-avatar ${t}`.trim(),style:{width:i,height:i,borderRadius:`50%`,backgroundColor:`#fff`,border:`3px solid #F4B400`,boxShadow:`0 6px 16px rgba(0,0,0,.12)`,objectFit:`cover`,display:`block`},loading:`eager`,decoding:`async`})}var a={person:[`Ali`,`Aiman`,`Siti`,`Farah`],place:[`padang`,`sekolah`,`hospital`,`kedai`,`pasar`],animal:[`kucing`,`ayam`,`gajah`,`burung`],object:[`buku`,`pensel`,`kerusi`,`meja`],verb:[`berlari`,`makan`,`menulis`,`tidur`],adjective:[`cantik`,`besar`,`tinggi`,`gembira`],penjodoh:[`seekor ayam`,`sekuntum bunga`,`sehelai kertas`,`sebatang pensel`],simpulan:[`ringan tulang`,`buah tangan`,`kaki ayam`,`panjang tangan`],conjunction:[`dan`,`atau`,`tetapi`,`kerana`],sendi:[`di`,`ke`,`dari`,`daripada`],name:[`Ali`,`Aiman`,`Siti`,`Farah`],generic:[`jawapan yang tepat`,`petunjuk kata kunci`,`contoh yang sepadan`,`maksud ayat`]},o={person:`🧠 Tip Ingatan
NAMA ORANG
=
Ali
Aiman
Siti
Farah`,place:`🧠 Tip Ingatan
NAMA TEMPAT
=
padang
sekolah
hospital
kedai
pasar`,animal:`🧠 Tip Ingatan
NAMA HAIWAN
=
kucing
ayam
gajah
burung`,object:`🧠 Tip Ingatan
NAMA BENDA
=
buku
pensel
kerusi
meja`,verb:`🧠 Tip Ingatan
KATA KERJA
=
perbuatan atau aksi`,adjective:`🧠 Tip Ingatan
KATA ADJEKTIF
=
sifat atau keadaan`,penjodoh:`🧠 Tip Ingatan
PENJODOH BILANGAN
=
seekor, sekuntum, sehelai, sebatang`,simpulan:`🧠 Tip Ingatan
SIMPULAN BAHASA
=
maksud khas, bukan maksud biasa`,conjunction:`🧠 Tip Ingatan
KATA HUBUNG
=
dan, atau, tetapi, kerana`,sendi:`🧠 Tip Ingatan
KATA SENDI NAMA
=
di, ke, dari, daripada`,generic:`🧠 Tip Ingatan
Baca soalan perlahan-lahan dan cari kata kunci.`};function s(e=``){return String(e).toLowerCase()}function c(e=[]){return[...new Set((Array.isArray(e)?e:[]).map(e=>String(e).trim()).filter(Boolean))]}function l(e={},t={}){let n=e?.subjectId||t?.subjectId||e?.subject||t?.subject;return n?s(n):{BM:`bm`,MATH:`math`,EN:`english`,ENG:`english`,SAINS:`sains`,ARAB:`arab`,ISLAM:`islam`,PJ:`pj`,PK:`pk`}[String(e?.id||``).toUpperCase().split(`-`)[0]]||``}function u(e={}){return s(e?.q||e?.question||e?.stem||e?.text||``)}function d(e={}){let t=u(e),n=t.match(/nombor selepas\s+(\d+)/i),r=t.match(/nombor sebelum\s+(\d+)/i);if(n){let e=Number(n[1]);return[`${e} + 1 = ${e+1}`,`Nombor selepas ${e} ialah ${e+1}.`]}if(r){let e=Number(r[1]);return[`${e} - 1 = ${e-1}`,`Nombor sebelum ${e} ialah ${e-1}.`]}return[`Baca nombor dengan teliti.`,`Kenal pasti nilai tempat.`,`Semak urutan nombor.`]}function f(e={},t={}){return s([t?.id,t?.title,t?.note,e?.topicId,e?.topic,e?.q,e?.hint,e?.explanation].filter(Boolean).join(` `))}function p(e={},t={}){return/jisim[_ ]isi[_ ]padu|jisim dan isi padu|menimbang jisim|penimbang|berat|cecair|kg|gram|mililiter|liter|\bml\b|\bl\b/i.test(f(e,t))}function m(e={}){let t=u(e);return/alat|menimbang|jisim|berat/.test(t)?[`Penimbang digunakan untuk menimbang jisim.`,`Jisim boleh diukur dalam gram (g) atau kilogram (kg).`,`Pilih alat dan unit yang sesuai dengan objek.`]:/cecair|isi padu|liter|mililiter|\bml\b|\bl\b/.test(t)?[`Gunakan mL untuk isi padu cecair yang sedikit.`,`Gunakan L untuk isi padu cecair yang lebih banyak.`,`Semak unit sebelum menulis jawapan.`]:[`Gunakan g atau kg untuk jisim.`,`Gunakan mL atau L untuk isi padu.`,`Baca soalan dan semak unit jawapan.`]}function h(e={},t={}){return p(e,t)?{focus:`Memahami jisim, isi padu, alat dan unit yang sesuai.`,steps:[`Kenal pasti sama ada soalan tentang jisim atau isi padu.`,`Pilih alat atau unit yang sesuai.`,`Semak jawapan dan unit.`],examples:m(e),commonMistakes:[`Tersalah guna unit jisim dan isi padu.`,`Tidak membezakan g dan kg atau mL dan L.`],memoryTip:`Tip Ingatan: Jisim diukur dengan g atau kg. Isi padu cecair diukur dengan mL atau L.`}:{focus:`Memahami maklumat, kaedah dan unit yang digunakan dalam soalan.`,steps:[`Kenal pasti maklumat yang diberi.`,`Pilih kaedah atau operasi yang sesuai.`,`Kira dan semak jawapan serta unit.`],examples:[`Kenal pasti maklumat penting dalam soalan.`,`Pilih kaedah yang sesuai.`,`Semak jawapan sebelum meneruskan.`],commonMistakes:[`Memilih kaedah yang tidak sesuai.`,`Tidak menyemak pengiraan, jawapan atau unit.`],memoryTip:`Tip Ingatan: Baca soalan, pilih kaedah dan semak jawapan.`}}function g(e=``){return String(e||``).replace(/\s*Konteks:\s*.*$/gim,``).replace(/\bLatihan AI\b/gi,``).replace(/\bUASA\b/gi,``).replace(/\bKSSR Tahun 2\b/gi,``).replace(/\bSubject IDs?\b/gi,``).replace(/\bInternal lesson IDs?\b/gi,``).replace(/\bTopic IDs?\b/gi,``).replace(/\s+[•·]\s+/g,` • `).replace(/\s+/g,` `).trim()}function _(e=``){return g(String(e||``)).replace(/\b[A-Za-z]+_[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*(?:_[A-Za-z0-9-]+)?\b/g,``).replace(/\b[0-9a-f]{8,}(?:-[0-9a-f]{4,}){3}-[0-9a-f]{12}\b/gi,``).replace(/\[object Object\]/g,``).replace(/\bundefined\b/gi,``).replace(/\bnull\b/gi,``).replace(/\s{2,}/g,` `).replace(/\s+([.,!?;:])/g,`$1`).replace(/([.,!?;:])\1+/g,`$1`).trim()}function v(e={},t={}){if(l(e,t)===`math`)return`generic`;let n=s([t?.id,t?.title,t?.note,e?.topic,e?.uasa,e?.dskp,e?.q,e?.hint,e?.explanation].filter(Boolean).join(` `));return/simpulan bahasa/.test(n)?`simpulan`:/penjodoh bilangan/.test(n)?`penjodoh`:/kata sendi/.test(n)?`sendi`:/kata hubung/.test(n)?`conjunction`:/kata adjektif/.test(n)?`adjective`:/kata kerja/.test(n)?`verb`:/kata[_ ]nama[_ ]khas|nama khas/.test(n)?/nama orang|nama manusia/.test(n)||/nama guru|nama murid|nama tokoh/.test(n)?`person`:/nama tempat|tempat tersebut|tempat percutian|nama bandar|\bbandar\b|nama sekolah|nama negeri|nama negara/.test(n)?`place`:/nama haiwan/.test(n)?`animal`:/nama jenama|\bjenama\b|tajuk rancangan|nama buku/.test(n)?`properNoun`:/nama benda/.test(n)?`object`:`properNoun`:/kata nama tempat|nama tempat|tempat/.test(n)?`place`:/kata nama haiwan|nama haiwan|haiwan/.test(n)?`animal`:/kata nama benda|nama benda|benda/.test(n)?`object`:/kata nama orang|nama orang|nama khas|tokoh|murid/.test(n)?`person`:/kata nama/.test(n)?`name`:`generic`}function y(e={},t={}){let n=l(e,t),r=u(e);return n===`math`?/nombor\s+(selepas|sebelum)\s+\d+/i.test(r)?d(e):h(e,t).examples:n===`bm`&&/kata ganti nama|menyiapkan kerja kelas|meja belajar/.test(`${r} ${s(t?.id)} ${s(t?.title)}`)?[`Saya membaca buku.`,`Saya menulis di meja belajar.`,`Kata ganti nama diri pertama ialah saya.`]:c(a[v(e,t)]||a.generic)}function b(e={},t={}){let n=l(e,t);if(n===`math`){let n=u(e);return/nombor\s+(selepas|sebelum)\s+\d+/i.test(n)?`Tip Ingatan: nombor selepas tambah 1, nombor sebelum tolak 1.`:h(e,t).memoryTip}return n===`bm`&&/kata ganti nama|menyiapkan kerja kelas|meja belajar/.test(`${u(e)} ${s(t?.id)} ${s(t?.title)}`)?`Tip Ingatan: Saya ialah kata ganti nama diri pertama untuk orang yang bercakap.`:o[v(e,t)]||o.generic}function x(e={},t=``,n={}){let r=e=>String(e||``).toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/gi,` `).trim().split(/\s+/).filter(Boolean),i=new Set(r(t)),a=new Set,o={...e};for(let t of[`summary`,`focus`,`simpleExplanation`,`whyCorrect`,`hint`,`steps`,`example`,`commonMistake`,`memoryTip`,`coachMessage`])t in o&&(o[t]=(Array.isArray(o[t])?o[t]:[o[t]]).map((e,o)=>{let s=String(e||``).trim(),c=r(s),l=i.size?c.filter(e=>i.has(e)).length/i.size:0;return(a.has(s.toLowerCase())||c.length>=5&&l>=.85)&&n[t]?Array.isArray(n[t])?n[t][o]||n[t][0]:n[t]:(a.add(s.toLowerCase()),e)}),Array.isArray(e[t])||(o[t]=o[t][0]||``));return o}export{l as a,_ as c,h as i,i as l,y as n,x as o,b as r,g as s,v as t};