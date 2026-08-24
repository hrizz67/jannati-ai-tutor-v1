var e={person:[`Ali`,`Aiman`,`Siti`,`Farah`],place:[`padang`,`sekolah`,`hospital`,`kedai`,`pasar`],animal:[`kucing`,`ayam`,`gajah`,`burung`],object:[`buku`,`pensel`,`kerusi`,`meja`],verb:[`berlari`,`makan`,`menulis`,`tidur`],adjective:[`cantik`,`besar`,`tinggi`,`gembira`],penjodoh:[`seekor ayam`,`sekuntum bunga`,`sehelai kertas`,`sebatang pensel`],simpulan:[`ringan tulang`,`buah tangan`,`kaki ayam`,`panjang tangan`],conjunction:[`dan`,`atau`,`tetapi`,`kerana`],sendi:[`di`,`ke`,`dari`,`daripada`],name:[`Ali`,`Aiman`,`Siti`,`Farah`],generic:[`jawapan yang tepat`,`petunjuk kata kunci`,`contoh yang sepadan`,`maksud ayat`]},t={person:`🧠 Tip Ingatan
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
Baca soalan perlahan-lahan dan cari kata kunci.`};function n(e=``){return String(e).toLowerCase()}function r(e=[]){return[...new Set((Array.isArray(e)?e:[]).map(e=>String(e).trim()).filter(Boolean))]}function i(e={},t={}){let r=e?.subjectId||t?.subjectId||e?.subject||t?.subject;return r?n(r):{BM:`bm`,MATH:`math`,EN:`english`,ENG:`english`,SAINS:`sains`,ARAB:`arab`,ISLAM:`islam`,PJ:`pj`,PK:`pk`}[String(e?.id||``).toUpperCase().split(`-`)[0]]||``}function a(e={}){return n(e?.q||e?.question||e?.stem||e?.text||``)}function o(e={}){let t=a(e),n=t.match(/nombor selepas\s+(\d+)/i),r=t.match(/nombor sebelum\s+(\d+)/i);if(n){let e=Number(n[1]);return[`${e} + 1 = ${e+1}`,`Nombor selepas ${e} ialah ${e+1}.`]}if(r){let e=Number(r[1]);return[`${e} - 1 = ${e-1}`,`Nombor sebelum ${e} ialah ${e-1}.`]}return[`Baca nombor dengan teliti.`,`Kenal pasti nilai tempat.`,`Semak urutan nombor.`]}function s(e={},t={}){return n([t?.id,t?.title,t?.note,e?.topicId,e?.topic,e?.q,e?.hint,e?.explanation].filter(Boolean).join(` `))}function c(e={},t={}){return/jisim[_ ]isi[_ ]padu|jisim dan isi padu|menimbang jisim|penimbang|berat|cecair|kg|gram|mililiter|liter|\bml\b|\bl\b/i.test(s(e,t))}function l(e={}){let t=a(e);return/alat|menimbang|jisim|berat/.test(t)?[`Penimbang digunakan untuk menimbang jisim.`,`Jisim boleh diukur dalam gram (g) atau kilogram (kg).`,`Pilih alat dan unit yang sesuai dengan objek.`]:/cecair|isi padu|liter|mililiter|\bml\b|\bl\b/.test(t)?[`Gunakan mL untuk isi padu cecair yang sedikit.`,`Gunakan L untuk isi padu cecair yang lebih banyak.`,`Semak unit sebelum menulis jawapan.`]:[`Gunakan g atau kg untuk jisim.`,`Gunakan mL atau L untuk isi padu.`,`Baca soalan dan semak unit jawapan.`]}function u(e={},t={}){return c(e,t)?{focus:`Memahami jisim, isi padu, alat dan unit yang sesuai.`,steps:[`Kenal pasti sama ada soalan tentang jisim atau isi padu.`,`Pilih alat atau unit yang sesuai.`,`Semak jawapan dan unit.`],examples:l(e),commonMistakes:[`Tersalah guna unit jisim dan isi padu.`,`Tidak membezakan g dan kg atau mL dan L.`],memoryTip:`Tip Ingatan: Jisim diukur dengan g atau kg. Isi padu cecair diukur dengan mL atau L.`}:{focus:`Memahami maklumat, kaedah dan unit yang digunakan dalam soalan.`,steps:[`Kenal pasti maklumat yang diberi.`,`Pilih kaedah atau operasi yang sesuai.`,`Kira dan semak jawapan serta unit.`],examples:[`Kenal pasti maklumat penting dalam soalan.`,`Pilih kaedah yang sesuai.`,`Semak jawapan sebelum meneruskan.`],commonMistakes:[`Memilih kaedah yang tidak sesuai.`,`Tidak menyemak pengiraan, jawapan atau unit.`],memoryTip:`Tip Ingatan: Baca soalan, pilih kaedah dan semak jawapan.`}}function d(e=``){return String(e||``).replace(/\s*Konteks:\s*.*$/gim,``).replace(/\bLatihan AI\b/gi,``).replace(/\bUASA\b/gi,``).replace(/\bKSSR Tahun 2\b/gi,``).replace(/\bSubject IDs?\b/gi,``).replace(/\bInternal lesson IDs?\b/gi,``).replace(/\bTopic IDs?\b/gi,``).replace(/\s+[•·]\s+/g,` • `).replace(/\s+/g,` `).trim()}function f(e=``){return d(String(e||``)).replace(/\b[A-Za-z]+_[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*(?:_[A-Za-z0-9-]+)?\b/g,``).replace(/\b[0-9a-f]{8,}(?:-[0-9a-f]{4,}){3}-[0-9a-f]{12}\b/gi,``).replace(/\[object Object\]/g,``).replace(/\bundefined\b/gi,``).replace(/\bnull\b/gi,``).replace(/\s{2,}/g,` `).replace(/\s+([.,!?;:])/g,`$1`).replace(/([.,!?;:])\1+/g,`$1`).trim()}function p(e={},t={}){if(i(e,t)===`math`)return`generic`;let r=n([t?.id,t?.title,t?.note,e?.topic,e?.uasa,e?.dskp,e?.q,e?.hint,e?.explanation].filter(Boolean).join(` `));return/simpulan bahasa/.test(r)?`simpulan`:/penjodoh bilangan/.test(r)?`penjodoh`:/kata sendi/.test(r)?`sendi`:/kata hubung/.test(r)?`conjunction`:/kata adjektif/.test(r)?`adjective`:/kata kerja/.test(r)?`verb`:/kata[_ ]nama[_ ]khas|nama khas/.test(r)?/nama orang|nama manusia/.test(r)||/nama guru|nama murid|nama tokoh/.test(r)?`person`:/nama tempat|tempat tersebut|tempat percutian|nama bandar|\bbandar\b|nama sekolah|nama negeri|nama negara/.test(r)?`place`:/nama haiwan/.test(r)?`animal`:/nama jenama|\bjenama\b|tajuk rancangan|nama buku/.test(r)?`properNoun`:/nama benda/.test(r)?`object`:`properNoun`:/kata nama tempat|nama tempat|tempat/.test(r)?`place`:/kata nama haiwan|nama haiwan|haiwan/.test(r)?`animal`:/kata nama benda|nama benda|benda/.test(r)?`object`:/kata nama orang|nama orang|nama khas|tokoh|murid/.test(r)?`person`:/kata nama/.test(r)?`name`:`generic`}function m(t={},s={}){let c=i(t,s),l=a(t);return c===`math`?/nombor\s+(selepas|sebelum)\s+\d+/i.test(l)?o(t):u(t,s).examples:c===`bm`&&/kata ganti nama|menyiapkan kerja kelas|meja belajar/.test(`${l} ${n(s?.id)} ${n(s?.title)}`)?[`Saya membaca buku.`,`Saya menulis di meja belajar.`,`Kata ganti nama diri pertama ialah saya.`]:r(e[p(t,s)]||e.generic)}function h(e={},r={}){let o=i(e,r);if(o===`math`){let t=a(e);return/nombor\s+(selepas|sebelum)\s+\d+/i.test(t)?`Tip Ingatan: nombor selepas tambah 1, nombor sebelum tolak 1.`:u(e,r).memoryTip}return o===`bm`&&/kata ganti nama|menyiapkan kerja kelas|meja belajar/.test(`${a(e)} ${n(r?.id)} ${n(r?.title)}`)?`Tip Ingatan: Saya ialah kata ganti nama diri pertama untuk orang yang bercakap.`:t[p(e,r)]||t.generic}function g(e={},t=``,n={}){let r=e=>String(e||``).toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/gi,` `).trim().split(/\s+/).filter(Boolean),i=new Set(r(t)),a=new Set,o={...e};for(let t of[`summary`,`focus`,`simpleExplanation`,`whyCorrect`,`hint`,`steps`,`example`,`commonMistake`,`memoryTip`,`coachMessage`])t in o&&(o[t]=(Array.isArray(o[t])?o[t]:[o[t]]).map((e,o)=>{let s=String(e||``).trim(),c=r(s),l=i.size?c.filter(e=>i.has(e)).length/i.size:0;return(a.has(s.toLowerCase())||c.length>=5&&l>=.85)&&n[t]?Array.isArray(n[t])?n[t][o]||n[t][0]:n[t]:(a.add(s.toLowerCase()),e)}),Array.isArray(e[t])||(o[t]=o[t][0]||``));return o}export{i as a,f as c,u as i,m as n,g as o,h as r,d as s,p as t};