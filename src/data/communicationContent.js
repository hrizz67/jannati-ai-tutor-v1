/* Semantic communication banks. Each row changes the learning meaning, not just its title. */
const bmListening = [
  ['Aina menyiram bunga merah di halaman.', 'Apakah yang disiram Aina?', ['Bunga merah','Pokok mangga','Rumput hijau'],'Bunga merah',['Aina','menyiram','bunga','merah'],'halaman','Di manakah Aina berada?',['halaman','di halaman']],
  ['Ayah membaiki basikal biru di garaj.', 'Apakah yang dibaiki ayah?', ['Basikal biru','Kereta merah','Pintu rumah'],'Basikal biru',['Ayah','membaiki','basikal'],'garaj','Apakah warna basikal itu?',['biru']],
  ['Murid membaca cerita di perpustakaan.', 'Di manakah murid membaca?', ['Perpustakaan','Kantin','Padang'],'Perpustakaan',['Murid','membaca','cerita'],'perpustakaan','Siapakah yang membaca?',['murid']],
  ['Kakak memasak sup ayam untuk keluarga.', 'Apakah yang dimasak kakak?', ['Sup ayam','Nasi goreng','Kek coklat'],'Sup ayam',['Kakak','memasak','sup','ayam'],'keluarga','Untuk siapakah sup itu?',['keluarga']],
  ['Ravi membawa payung ketika hujan turun.', 'Bilakah Ravi membawa payung?', ['Ketika hujan','Ketika panas','Ketika malam'],'Ketika hujan',['Ravi','membawa','payung'],'hujan','Apakah yang dibawa Ravi?',['payung']],
  ['Ibu membeli epal dan pisang di pasar.', 'Di manakah ibu membeli buah?', ['Pasar','Sekolah','Hospital'],'Pasar',['Ibu','membeli','epal','pisang'],'pasar','Apakah buah yang dibeli?',['epal','pisang']],
  ['Siti melukis rumah kecil dengan krayon.', 'Apakah yang dilukis Siti?', ['Rumah kecil','Bunga besar','Kucing putih'],'Rumah kecil',['Siti','melukis','rumah'],'krayon','Dengan apakah Siti melukis?',['krayon']],
  ['Datuk membaca surat khabar pada waktu pagi.', 'Bilakah datuk membaca surat khabar?', ['Waktu pagi','Waktu petang','Waktu malam'],'Waktu pagi',['Datuk','membaca','surat','khabar'],'pagi','Apakah yang dibaca datuk?',['surat khabar']],
  ['Kami bermain bola di padang sekolah.', 'Di manakah kami bermain bola?', ['Padang sekolah','Bilik darjah','Kedai buku'],'Padang sekolah',['Kami','bermain','bola'],'sekolah','Apakah permainan kami?',['bola']],
  ['Nina menyusun buku di atas rak.', 'Di manakah Nina menyusun buku?', ['Di atas rak','Di bawah meja','Di dalam beg'],'Di atas rak',['Nina','menyusun','buku'],'rak','Apakah yang disusun Nina?',['buku']],
  ['Abang mencuci kasut sukan selepas berlari.', 'Bilakah abang mencuci kasut?', ['Selepas berlari','Sebelum tidur','Ketika makan'],'Selepas berlari',['Abang','mencuci','kasut','sukan'],'kasut','Apakah jenis kasut itu?',['sukan']],
  ['Kucing putih tidur di bawah kerusi.', 'Di manakah kucing tidur?', ['Di bawah kerusi','Di atas katil','Di tepi pintu'],'Di bawah kerusi',['Kucing','putih','tidur'],'kerusi','Apakah warna kucing itu?',['putih']],
  ['Guru menulis tarikh pada papan putih.', 'Apakah yang ditulis guru?', ['Tarikh','Nama murid','Cerita'],'Tarikh',['Guru','menulis','tarikh'],'papan','Di manakah guru menulis?',['papan putih']],
  ['Haziq membawa bekal nasi ke sekolah.', 'Apakah bekal Haziq?', ['Nasi','Roti','Mi'],'Nasi',['Haziq','membawa','bekal','nasi'],'bekal','Ke manakah Haziq pergi?',['sekolah']],
  ['Lina memetik dua biji mangga masak.', 'Berapakah mangga yang dipetik?', ['Dua biji','Tiga biji','Empat biji'],'Dua biji',['Lina','memetik','mangga'],'mangga','Apakah keadaan mangga itu?',['masak']],
  ['Adik minum susu sebelum tidur.', 'Bilakah adik minum susu?', ['Sebelum tidur','Selepas bangun','Ketika bermain'],'Sebelum tidur',['Adik','minum','susu'],'susu','Apakah minuman adik?',['susu']],
  ['Farah menolong ibu mengangkat bakul.', 'Siapakah yang ditolong Farah?', ['Ibu','Ayah','Kakak'],'Ibu',['Farah','menolong','ibu'],'bakul','Apakah yang diangkat?',['bakul']],
  ['Burung hinggap di dahan pokok besar.', 'Di manakah burung hinggap?', ['Di dahan','Di tanah','Di bumbung'],'Di dahan',['Burung','hinggap','dahan'],'pokok','Apakah saiz pokok itu?',['besar']],
  ['Amir menutup tingkap kerana angin kuat.', 'Mengapakah Amir menutup tingkap?', ['Angin kuat','Hari hujan','Matahari terik'],'Angin kuat',['Amir','menutup','tingkap'],'angin','Apakah yang ditutup Amir?',['tingkap']],
  ['Puan Salmah membeli bunga untuk majlis.', 'Untuk apakah bunga dibeli?', ['Majlis','Hadiah','Kelas'],'Majlis',['Puan','Salmah','membeli','bunga'],'majlis','Apakah yang dibeli?',['bunga']],
  ['Kanak-kanak beratur di hadapan kantin.', 'Di manakah kanak-kanak beratur?', ['Di hadapan kantin','Di dalam kelas','Di belakang rumah'],'Di hadapan kantin',['Kanak-kanak','beratur','kantin'],'kantin','Apakah yang dilakukan?',['beratur']],
  ['Rina mengira lima ekor ikan dalam akuarium.', 'Berapakah ikan dalam akuarium?', ['Lima ekor','Tiga ekor','Tujuh ekor'],'Lima ekor',['Rina','mengira','ikan'],'akuarium','Apakah yang dikira Rina?',['ikan']],
  ['Bapa membakar roti pada waktu sarapan.', 'Bilakah bapa membakar roti?', ['Waktu sarapan','Waktu makan malam','Waktu rehat'],'Waktu sarapan',['Bapa','membakar','roti'],'sarapan','Apakah yang dibakar?',['roti']],
  ['Mira memakai topi kuning ketika berbasikal.', 'Apakah warna topi Mira?', ['Kuning','Hijau','Merah'],'Kuning',['Mira','memakai','topi'],'kuning','Apakah aktiviti Mira?',['berbasikal']],
  ['Johan menanam anak pokok di kebun.', 'Apakah yang ditanam Johan?', ['Anak pokok','Biji jagung','Bunga ros'],'Anak pokok',['Johan','menanam','anak','pokok'],'kebun','Di manakah Johan menanam?',['kebun']],
  ['Sara menyimpan pensel di dalam kotak.', 'Di manakah pensel disimpan?', ['Di dalam kotak','Di atas meja','Di bawah buku'],'Di dalam kotak',['Sara','menyimpan','pensel'],'kotak','Apakah yang disimpan?',['pensel']],
  ['Murid menyanyi lagu sekolah dalam perhimpunan.', 'Apakah yang dinyanyikan murid?', ['Lagu sekolah','Lagu hari jadi','Lagu tidur'],'Lagu sekolah',['Murid','menyanyi','lagu','sekolah'],'perhimpunan','Bilakah aktiviti berlaku?',['perhimpunan']],
  ['Irfan membantu adik memakai kasut.', 'Siapakah yang dibantu Irfan?', ['Adik','Kakak','Rakan'],'Adik',['Irfan','membantu','adik'],'kasut','Apakah yang dipakai?',['kasut']],
  ['Tukang kebun memotong rumput yang panjang.', 'Apakah yang dipotong?', ['Rumput panjang','Daun kering','Ranting kecil'],'Rumput panjang',['Tukang','kebun','memotong','rumput'],'panjang','Siapakah yang memotong rumput?',['tukang kebun']],
  ['Wani mengembalikan buku kepada pustakawan.', 'Kepada siapakah buku dikembalikan?', ['Pustakawan','Guru','Pengetua'],'Pustakawan',['Wani','mengembalikan','buku'],'pustakawan','Apakah yang dikembalikan Wani?',['buku']]
];

const enListening = [
  ['The girl feeds her rabbit in the garden.','What does the girl feed?',['A rabbit','A fish','A bird'],'A rabbit',['The','girl','feeds','her','rabbit'],'garden','Where is the girl?',['in the garden']],
  ['Ben packs a red lunch box for school.','What colour is the lunch box?',['Red','Blue','Green'],'Red',['Ben','packs','a','lunch','box'],'red','Where is Ben going?',['school']],
  ['The twins ride bicycles after breakfast.','When do the twins ride?',['After breakfast','Before sleep','At midnight'],'After breakfast',['The','twins','ride','bicycles'],'bicycles','Who rides bicycles?',['the twins']],
  ['Maya puts three books on the desk.','How many books are there?',['Three','Two','Five'],'Three',['Maya','puts','books','on','desk'],'three','Where are the books?',['on the desk']],
  ['Dad waters the tomato plants every morning.','What does Dad water?',['Tomato plants','Rose flowers','Grass'],'Tomato plants',['Dad','waters','the','plants'],'tomato','When does Dad water them?',['every morning']],
  ['A blue kite flies above the field.','What flies above the field?',['A blue kite','A red ball','A green flag'],'A blue kite',['A','blue','kite','flies'],'field','What colour is the kite?',['blue']],
  ['The pupils draw a map of their village.','What do the pupils draw?',['A map','A poster','A boat'],'A map',['The','pupils','draw','a','map'],'village','Whose village is it?',['their village']],
  ['Liam washes his hands before eating lunch.','When does Liam wash his hands?',['Before lunch','After dinner','At bedtime'],'Before lunch',['Liam','washes','his','hands'],'lunch','What does Liam wash?',['his hands']],
  ['A small turtle swims beside the rock.','What swims beside the rock?',['A small turtle','A frog','A crab'],'A small turtle',['A','small','turtle','swims'],'rock','How big is the turtle?',['small']],
  ['The coach blows a whistle during practice.','What does the coach blow?',['A whistle','A horn','A bell'],'A whistle',['The','coach','blows','a','whistle'],'practice','Who blows it?',['the coach']],
  ['Nora finds a shell on the sandy beach.','Where does Nora find the shell?',['On the beach','In the lake','Under a tree'],'On the beach',['Nora','finds','a','shell'],'beach','What does Nora find?',['a shell']],
  ['The baker makes warm bread for the customers.','What does the baker make?',['Warm bread','Cold soup','Sweet tea'],'Warm bread',['The','baker','makes','warm','bread'],'bread','For whom is it made?',['customers']],
  ['Sam reads a comic beside his sister.','Who reads a comic?',['Sam','His sister','His teacher'],'Sam',['Sam','reads','a','comic'],'comic','Who is beside Sam?',['his sister']],
  ['A bus stops at the yellow school gate.','Where does the bus stop?',['At the school gate','At the market','At the bridge'],'At the school gate',['A','bus','stops','at','gate'],'yellow','What colour is the gate?',['yellow']],
  ['The baby laughs when the puppy jumps.','When does the baby laugh?',['When the puppy jumps','When it rains','When Dad sleeps'],'When the puppy jumps',['The','baby','laughs'],'puppy','What jumps?',['the puppy']],
  ['Grace folds a clean towel in the bathroom.','What does Grace fold?',['A towel','A blanket','A shirt'],'A towel',['Grace','folds','a','towel'],'bathroom','What kind of towel is it?',['clean']],
  ['The farmer collects eggs from the hen house.','Where are the eggs collected?',['Hen house','Kitchen','Barn door'],'Hen house',['The','farmer','collects','eggs'],'eggs','Who collects them?',['the farmer']],
  ['A red apple rolls under the table.','Where does the apple roll?',['Under the table','Behind the chair','Into the bag'],'Under the table',['A','red','apple','rolls'],'table','What colour is it?',['red']],
  ['Ella shares crayons with her best friend.','What does Ella share?',['Crayons','Stickers','Books'],'Crayons',['Ella','shares','crayons'],'friend','With whom does she share?',['her best friend']],
  ['The family lights a lamp during the blackout.','What do they light?',['A lamp','A candle','A torch'],'A lamp',['The','family','lights','a','lamp'],'blackout','When do they light it?',['during the blackout']],
  ['Omar carries a heavy box to the storeroom.','What does Omar carry?',['A heavy box','A light bag','A small ball'],'A heavy box',['Omar','carries','a','box'],'storeroom','Where does he take it?',['storeroom']],
  ['The doctor checks Mia’s sore throat.','What does the doctor check?',['A sore throat','A broken arm','A cold foot'],'A sore throat',['The','doctor','checks','Mia'],'throat','Who has the sore throat?',['Mia']],
  ['A squirrel hides nuts beside the old tree.','What does the squirrel hide?',['Nuts','Seeds','Leaves'],'Nuts',['A','squirrel','hides','nuts'],'tree','Where does it hide them?',['beside the old tree']],
  ['The class claps after the magic show.','When does the class clap?',['After the show','Before the lesson','At lunch'],'After the show',['The','class','claps'],'magic','What does the class watch?',['a magic show']],
  ['Hana paints a bright sun on the poster.','What does Hana paint?',['A sun','A moon','A star'],'A sun',['Hana','paints','a','sun'],'poster','How is the sun?',['bright']],
  ['The train arrives before the rain starts.','What arrives first?',['The train','The rain','The bus'],'The train',['The','train','arrives'],'rain','When does the rain start?',['after the train']],
  ['Jack places a key inside his pocket.','Where does Jack place the key?',['Inside his pocket','On his shoe','Under the bed'],'Inside his pocket',['Jack','places','a','key'],'pocket','What does he place there?',['a key']],
  ['The children count six ducks at the pond.','How many ducks do they count?',['Six','Four','Eight'],'Six',['The','children','count','ducks'],'pond','Where are the ducks?',['at the pond']],
  ['Mum slices a ripe mango for dessert.','What does Mum slice?',['A mango','A melon','An orange'],'A mango',['Mum','slices','a','mango'],'ripe','When will they eat it?',['for dessert']],
  ['A gentle breeze moves the white curtains.','What moves the curtains?',['A gentle breeze','A strong dog','A little cat'],'A gentle breeze',['A','breeze','moves','curtains'],'curtains','What colour are they?',['white']]
];

const arListening = [
  ['ذَهَبَ عَلِيٌّ إِلَى الْمَدْرَسَةِ.','مَنْ ذَهَبَ إِلَى الْمَدْرَسَةِ؟',['عَلِيٌّ','أَحْمَدُ','سَارَةُ'],'عَلِيٌّ',['ذَهَبَ','عَلِيٌّ','إِلَى','الْمَدْرَسَةِ'],'الْمَدْرَسَةِ','إِلَى أَيْنَ ذَهَبَ عَلِيٌّ؟',['إِلَى الْمَدْرَسَةِ']],
  ['تَشْرَبُ سَارَةُ الْمَاءَ.','مَاذَا تَشْرَبُ سَارَةُ؟',['الْمَاءَ','اللَّبَنَ','الْعَصِيرَ'],'الْمَاءَ',['تَشْرَبُ','سَارَةُ','الْمَاءَ'],'الْمَاءَ','مَنْ يَشْرَبُ؟',['سَارَةُ']],
  ['هَذَا كِتَابٌ جَدِيدٌ.','مَا هَذَا؟',['كِتَابٌ','قَلَمٌ','بَابٌ'],'كِتَابٌ',['هَذَا','كِتَابٌ','جَدِيدٌ'],'كِتَابٌ','كَيْفَ الْكِتَابُ؟',['جَدِيدٌ']],
  ['فِي الْفَصْلِ سَبُّورَةٌ بَيْضَاءُ.','أَيْنَ السَّبُّورَةُ؟',['فِي الْفَصْلِ','فِي الْبَيْتِ','فِي السُّوقِ'],'فِي الْفَصْلِ',['فِي','الْفَصْلِ','سَبُّورَةٌ'],'السَّبُّورَةُ','مَا لَوْنُهَا؟',['بَيْضَاءُ']],
  ['يَلْعَبُ الأَطْفَالُ فِي الْحَدِيقَةِ.','أَيْنَ يَلْعَبُ الأَطْفَالُ؟',['فِي الْحَدِيقَةِ','فِي الْمَدْرَسَةِ','فِي الْمَطْعَمِ'],'فِي الْحَدِيقَةِ',['يَلْعَبُ','الأَطْفَالُ','فِي','الْحَدِيقَةِ'],'الْحَدِيقَةِ','مَنْ يَلْعَبُ؟',['الأَطْفَالُ']],
  ['أَكَلَ الْوَلَدُ تُفَّاحَةً حَمْرَاءَ.','مَاذَا أَكَلَ الْوَلَدُ؟',['تُفَّاحَةً','مَوْزَةً','بُرْتُقَالَةً'],'تُفَّاحَةً',['أَكَلَ','الْوَلَدُ','تُفَّاحَةً'],'تُفَّاحَةً','مَا لَوْنُهَا؟',['حَمْرَاءَ']],
  ['تَرْكُضُ الْبِنْتُ سَرِيعًا.','كَيْفَ تَرْكُضُ الْبِنْتُ؟',['سَرِيعًا','بَطِيئًا','هَادِئًا'],'سَرِيعًا',['تَرْكُضُ','الْبِنْتُ','سَرِيعًا'],'سَرِيعًا','مَنْ يَرْكُضُ؟',['الْبِنْتُ']],
  ['يَكْتُبُ مُحَمَّدٌ بِقَلَمٍ أَزْرَقَ.','بِمَاذَا يَكْتُبُ مُحَمَّدٌ؟',['بِقَلَمٍ','بِكِتَابٍ','بِمِمْحَاةٍ'],'بِقَلَمٍ',['يَكْتُبُ','مُحَمَّدٌ','بِقَلَمٍ'],'أَزْرَقَ','مَا لَوْنُ الْقَلَمِ؟',['أَزْرَقَ']],
  ['تَنَامُ الْقِطَّةُ تَحْتَ الْكُرْسِيِّ.','أَيْنَ تَنَامُ الْقِطَّةُ؟',['تَحْتَ الْكُرْسِيِّ','فَوْقَ السَّرِيرِ','بِجَانِبِ الْبَابِ'],'تَحْتَ الْكُرْسِيِّ',['تَنَامُ','الْقِطَّةُ','تَحْتَ','الْكُرْسِيِّ'],'الْكُرْسِيِّ','مَنْ يَنَامُ؟',['الْقِطَّةُ']],
  ['تَفْتَحُ الأُمُّ النَّافِذَةَ صَبَاحًا.','مَتَى تَفْتَحُ الأُمُّ النَّافِذَةَ؟',['صَبَاحًا','لَيْلًا','ظُهْرًا'],'صَبَاحًا',['تَفْتَحُ','الأُمُّ','النَّافِذَةَ'],'صَبَاحًا','مَنْ يَفْتَحُ؟',['الأُمُّ']],
  ['يَغْسِلُ الطَّالِبُ يَدَيْهِ قَبْلَ الطَّعَامِ.','مَتَى يَغْسِلُ الطَّالِبُ يَدَيْهِ؟',['قَبْلَ الطَّعَامِ','بَعْدَ النَّوْمِ','أَثْنَاءَ اللَّعِبِ'],'قَبْلَ الطَّعَامِ',['يَغْسِلُ','الطَّالِبُ','يَدَيْهِ'],'يَدَيْهِ','مَنْ يَغْسِلُ؟',['الطَّالِبُ']],
  ['عِنْدِي ثَلَاثَةُ أَقْلَامٍ.','كَمْ قَلَمًا عِنْدِي؟',['ثَلَاثَةُ','خَمْسَةُ','وَاحِدٌ'],'ثَلَاثَةُ',['عِنْدِي','ثَلَاثَةُ','أَقْلَامٍ'],'ثَلَاثَةُ','مَاذَا عِنْدِي؟',['أَقْلَامٍ']],
  ['هَذِهِ زَهْرَةٌ جَمِيلَةٌ.','مَا هَذِهِ؟',['زَهْرَةٌ','شَجَرَةٌ','وَرَقَةٌ'],'زَهْرَةٌ',['هَذِهِ','زَهْرَةٌ','جَمِيلَةٌ'],'زَهْرَةٌ','كَيْفَ الزَّهْرَةُ؟',['جَمِيلَةٌ']],
  ['يَشْتَرِي الأَبُ خُبْزًا مِنَ السُّوقِ.','مَاذَا يَشْتَرِي الأَبُ؟',['خُبْزًا','أَرُزًّا','حَلِيبًا'],'خُبْزًا',['يَشْتَرِي','الأَبُ','خُبْزًا'],'خُبْزًا','مِنْ أَيْنَ يَشْتَرِي؟',['السُّوقِ']],
  ['تَجْرِي سَارَةُ فِي الْمَلْعَبِ.','أَيْنَ تَجْرِي سَارَةُ؟',['فِي الْمَلْعَبِ','فِي الْفَصْلِ','فِي الْمَكْتَبِ'],'فِي الْمَلْعَبِ',['تَجْرِي','سَارَةُ','فِي','الْمَلْعَبِ'],'الْمَلْعَبِ','مَنْ يَجْرِي؟',['سَارَةُ']],
  ['يَقْرَأُ خَالِدٌ قِصَّةً قَصِيرَةً.','مَاذَا يَقْرَأُ خَالِدٌ؟',['قِصَّةً','مَجَلَّةً','رِسَالَةً'],'قِصَّةً',['يَقْرَأُ','خَالِدٌ','قِصَّةً'],'قِصَّةً','كَيْفَ الْقِصَّةُ؟',['قَصِيرَةً']],
  ['تَقِفُ السَّيَّارَةُ أَمَامَ الْبَيْتِ.','أَيْنَ تَقِفُ السَّيَّارَةُ؟',['أَمَامَ الْبَيْتِ','خَلْفَ الْمَدْرَسَةِ','فِي الْحَدِيقَةِ'],'أَمَامَ الْبَيْتِ',['تَقِفُ','السَّيَّارَةُ','أَمَامَ','الْبَيْتِ'],'السَّيَّارَةُ','مَا الَّذِي يَقِفُ؟',['السَّيَّارَةُ']],
  ['يَحْمِلُ عَلِيٌّ حَقِيبَةً كَبِيرَةً.','مَاذَا يَحْمِلُ عَلِيٌّ؟',['حَقِيبَةً','كِتَابًا','قَلَمًا'],'حَقِيبَةً',['يَحْمِلُ','عَلِيٌّ','حَقِيبَةً'],'حَقِيبَةً','كَيْفَ الْحَقِيبَةُ؟',['كَبِيرَةً']],
  ['تَطِيرُ الطَّائِرَةُ فَوْقَ الْبَحْرِ.','أَيْنَ تَطِيرُ الطَّائِرَةُ؟',['فَوْقَ الْبَحْرِ','تَحْتَ الْجِسْرِ','بِجَانِبِ الْبَيْتِ'],'فَوْقَ الْبَحْرِ',['تَطِيرُ','الطَّائِرَةُ','فَوْقَ','الْبَحْرِ'],'الطَّائِرَةُ','مَا الَّذِي يَطِيرُ؟',['الطَّائِرَةُ']],
  ['يَرْسُمُ الطِّفْلُ شَمْسًا صَفْرَاءَ.','مَاذَا يَرْسُمُ الطِّفْلُ؟',['شَمْسًا','قَمَرًا','نَجْمًا'],'شَمْسًا',['يَرْسُمُ','الطِّفْلُ','شَمْسًا'],'شَمْسًا','مَا لَوْنُ الشَّمْسِ؟',['صَفْرَاءَ']],
  ['تَغْسِلُ لَيْلَى السَّمَكَةَ فِي الْحَوْضِ.','أَيْنَ السَّمَكَةُ؟',['فِي الْحَوْضِ','فِي الْحَقِيبَةِ','فِي الْكِتَابِ'],'فِي الْحَوْضِ',['تَغْسِلُ','لَيْلَى','السَّمَكَةَ'],'السَّمَكَةُ','مَنْ يَغْسِلُ؟',['لَيْلَى']],
  ['يَلْبَسُ عُمَرُ قَمِيصًا أَخْضَرَ.','مَا لَوْنُ الْقَمِيصِ؟',['أَخْضَرَ','أَحْمَرَ','أَسْوَدَ'],'أَخْضَرَ',['يَلْبَسُ','عُمَرُ','قَمِيصًا'],'أَخْضَرَ','مَنْ يَلْبَسُ؟',['عُمَرُ']],
  ['تَضَعُ فَاطِمَةُ الْمِفْتَاحَ فِي الدُّرْجِ.','أَيْنَ الْمِفْتَاحُ؟',['فِي الدُّرْجِ','فَوْقَ الطَّاوِلَةِ','تَحْتَ الْكُرْسِيِّ'],'فِي الدُّرْجِ',['تَضَعُ','فَاطِمَةُ','الْمِفْتَاحَ'],'الْمِفْتَاحُ','مَنْ يَضَعُ؟',['فَاطِمَةُ']],
  ['يَسْمَعُ الْوَلَدُ صَوْتَ الْجَرَسِ.','مَاذَا يَسْمَعُ الْوَلَدُ؟',['صَوْتَ الْجَرَسِ','صَوْتَ الْمَاءِ','صَوْتَ الرِّيحِ'],'صَوْتَ الْجَرَسِ',['يَسْمَعُ','الْوَلَدُ','صَوْتَ','الْجَرَسِ'],'الْجَرَسِ','مَنْ يَسْمَعُ؟',['الْوَلَدُ']],
  ['يَزْرَعُ الْفَلَّاحُ شَجَرَةً فِي الْحَقْلِ.','مَاذَا يَزْرَعُ الْفَلَّاحُ؟',['شَجَرَةً','زَهْرَةً','عُشْبًا'],'شَجَرَةً',['يَزْرَعُ','الْفَلَّاحُ','شَجَرَةً'],'شَجَرَةً','أَيْنَ يَزْرَعُ؟',['فِي الْحَقْلِ']],
  ['تَضْحَكُ الْبِنْتُ لِأَنَّ أَخَاهَا مَرِحٌ.','لِمَاذَا تَضْحَكُ الْبِنْتُ؟',['لِأَنَّ أَخَاهَا مَرِحٌ','لِأَنَّهَا نَائِمَةٌ','لِأَنَّهَا جَائِعَةٌ'],'لِأَنَّ أَخَاهَا مَرِحٌ',['تَضْحَكُ','الْبِنْتُ','أَخَاهَا','مَرِحٌ'],'مَرِحٌ','مَنْ يَضْحَكُ؟',['الْبِنْتُ']],
  ['يَحْفَظُ الطَّالِبُ سُورَةً قَصِيرَةً.','مَاذَا يَحْفَظُ الطَّالِبُ؟',['سُورَةً','قِصَّةً','أُغْنِيَةً'],'سُورَةً',['يَحْفَظُ','الطَّالِبُ','سُورَةً'],'سُورَةً','كَيْفَ السُّورَةُ؟',['قَصِيرَةً']],
  ['تَسْقِي مَرْيَمُ النَّبَاتَ كُلَّ يَوْمٍ.','مَاذَا تَسْقِي مَرْيَمُ؟',['النَّبَاتَ','الطَّائِرَ','الْكُرْسِيَّ'],'النَّبَاتَ',['تَسْقِي','مَرْيَمُ','النَّبَاتَ'],'النَّبَاتَ','مَتَى تَسْقِي؟',['كُلَّ يَوْمٍ']],
  ['يَجْلِسُ التَّلَامِيذُ فِي الصَّفِّ.','أَيْنَ يَجْلِسُ التَّلَامِيذُ؟',['فِي الصَّفِّ','فِي الْمَلْعَبِ','فِي الْمَطْعَمِ'],'فِي الصَّفِّ',['يَجْلِسُ','التَّلَامِيذُ','فِي','الصَّفِّ'],'الصَّفِّ','مَنْ يَجْلِسُ؟',['التَّلَامِيذُ']],
  ['يَفْتَحُ الْحَارِسُ بَابَ الْمَدْرَسَةِ.','مَنْ يَفْتَحُ الْبَابَ؟',['الْحَارِسُ','الطَّالِبُ','الطَّبِيبُ'],'الْحَارِسُ',['يَفْتَحُ','الْحَارِسُ','بَابَ','الْمَدْرَسَةِ'],'الْبَابَ','مَاذَا يَفْتَحُ؟',['بَابَ الْمَدْرَسَةِ']],
  ['تَشْرَبُ الْبِنْتُ عَصِيرَ الْبُرْتُقَالِ.','مَاذَا تَشْرَبُ الْبِنْتُ؟',['عَصِيرَ الْبُرْتُقَالِ','مَاءً','حَلِيبًا'],'عَصِيرَ الْبُرْتُقَالِ',['تَشْرَبُ','الْبِنْتُ','عَصِيرَ'],'الْبُرْتُقَالِ','مَنْ يَشْرَبُ؟',['الْبِنْتُ']]
];

function rowsToListening(rows, id, language, speechLang, title) {
  return { id, language, speechLang, title, sessionItems: rows.map((row, index) => ({ id: `${id}-${index + 1}`, language, speechLang, title: `${title} ${index + 1}`, prompt: row[0], choose: { question: row[1], options: row[2], answer: row[3] }, arrange: row[4], spell: row[5], answer: { question: row[6], accepted: row[7] } })) };
}

export const semanticListeningSets = [
  rowsToListening(bmListening, 'bm', 'BM', 'ms-MY', 'BM Mendengar'),
  rowsToListening(enListening, 'english', 'Bahasa Inggeris', 'en-US', 'Bahasa Inggeris Mendengar'),
  rowsToListening(arListening, 'arab', 'Bahasa Arab', 'ar-SA', 'Bahasa Arab Mendengar')
];

const speakingSeeds = {
  bm: ['ceritakan sarapan kamu','terangkan bilik darjah','huraikan kucing kesayangan','ceritakan perjalanan ke sekolah','jelaskan cara menjaga kebersihan','ceritakan permainan di taman','terangkan cuaca hari ini','ceritakan makanan sihat','huraikan rakan baik kamu','ceritakan aktiviti hujung minggu','jelaskan cara menanam pokok','ceritakan lawatan ke perpustakaan','terangkan peraturan kelas','ceritakan hadiah hari jadi','huraikan haiwan di zoo','ceritakan membantu keluarga','jelaskan cara bersiap pagi','ceritakan hari sukan','terangkan warna kegemaran','ceritakan membaca buku','huraikan suasana pasar','ceritakan menjaga adik','jelaskan cara berjimat air','ceritakan aktiviti seni','terangkan tempat kegemaran','ceritakan bunyi di sekeliling','huraikan cuaca hujan','ceritakan jiran yang baik','jelaskan cara berkongsi','ceritakan impian kamu','terangkan cara menjaga buku','ceritakan perjalanan bas','huraikan bunga di taman','ceritakan sarapan sihat','jelaskan cara beratur','ceritakan permainan tradisional','terangkan kerja rumah','huraikan pakaian sekolah','ceritakan satu kejayaan','jelaskan cara meminta maaf'],
  english: ['describe your breakfast','talk about your classroom','describe a pet cat','tell us about your way to school','explain how to stay clean','talk about a park game','describe today’s weather','talk about healthy food','describe your best friend','tell us about your weekend','explain how to plant a seed','talk about the library','describe a class rule','talk about a birthday gift','describe an animal at the zoo','tell us how you help at home','explain your morning routine','talk about sports day','describe your favourite colour','tell us about a book','describe a busy market','talk about caring for a baby','explain how to save water','talk about an art activity','describe a favourite place','tell us about sounds around you','describe a rainy day','talk about a kind neighbour','explain how to share','tell us about a dream','describe how to care for books','talk about a bus ride','describe flowers in a garden','talk about a healthy meal','explain how to queue','talk about a traditional game','describe your homework','talk about a school uniform','tell us about a success','explain how to say sorry'],
  arab: ['صِفْ فَطُورَكَ','تَكَلَّمْ عَنْ فَصْلِكَ','صِفْ قِطَّتَكَ','تَكَلَّمْ عَنْ طَرِيقِكَ','اشْرَحْ كَيْفَ تَنَظَّفُ','تَكَلَّمْ عَنْ لُعْبَةٍ','صِفْ طَقْسَ الْيَوْمِ','تَكَلَّمْ عَنْ طَعَامٍ صِحِّيٍّ','صِفْ صَدِيقَكَ','تَكَلَّمْ عَنْ عُطْلَتِكَ','اشْرَحْ زِرَاعَةَ نَبْتَةٍ','تَكَلَّمْ عَنْ الْمَكْتَبَةِ','صِفْ قَاعِدَةً','تَكَلَّمْ عَنْ هَدِيَّةٍ','صِفْ حَيَوَانًا','تَكَلَّمْ عَنْ مُسَاعَدَةِ أَهْلِكَ','اشْرَحْ رُوتِينَكَ','تَكَلَّمْ عَنْ يَوْمِ الرِّيَاضَةِ','صِفْ لَوْنَكَ الْمُفَضَّلَ','تَكَلَّمْ عَنْ كِتَابٍ','صِفْ سُوقًا','تَكَلَّمْ عَنْ رِعَايَةِ طِفْلٍ','اشْرَحْ تَوْفِيرَ الْمَاءِ','تَكَلَّمْ عَنْ فَنٍّ','صِفْ مَكَانًا','تَكَلَّمْ عَنْ أَصْوَاتٍ','صِفْ يَوْمًا مُمْطِرًا','تَكَلَّمْ عَنْ جَارٍ','اشْرَحْ كَيْفَ تُشَارِكُ','تَكَلَّمْ عَنْ حُلْمٍ','صِفْ كِتَابًا','تَكَلَّمْ عَنْ رِحْلَةٍ','صِفْ أَزْهَارًا','تَكَلَّمْ عَنْ وَجْبَةٍ','اشْرَحْ كَيْفَ تَنْتَظِرُ','تَكَلَّمْ عَنْ لُعْبَةٍ شَعْبِيَّةٍ','صِفْ وَاجِبَكَ','تَكَلَّمْ عَنْ زِيِّكَ','تَكَلَّمْ عَنْ نَجَاحٍ','اشْرَحْ كَيْفَ تَعْتَذِرُ']
};

function createSpeakingPromptSet(id, seeds) {
  const language = id === 'bm' ? 'BM' : id === 'english' ? 'Bahasa Inggeris' : 'Bahasa Arab';
  const speechLang = id === 'bm' ? 'ms-MY' : id === 'english' ? 'en-US' : 'ar-SA';
  return { id, language, speechLang, title: `${language} Bertutur`, sessionItems: seeds.map((text, index) => {
    const keywords = text.toLowerCase().split(/\s+/).slice(0, 3);
    const prompt = label => ({ label, text, keywords });
    return { id: `${id}-${index + 1}`, title: `${language} Bertutur ${index + 1}`, prompts: { intro: prompt('Bercakap'), describe: prompt('Huraikan'), answer: prompt('Jawab'), repeat: prompt('Ulang') } };
  }) };
}
export const semanticSpeakingPrompts = Object.entries(speakingSeeds).map(([id, seeds]) => createSpeakingPromptSet(id, seeds));

const readingSeeds = {
  bm: [
    ['Kucing Saya', 'Saya ada seekor kucing. Kucing saya suka tidur di atas tikar.'],
    ['Pagi di Taman', 'Aina berjoging di taman pada waktu pagi. Udara di situ segar.'],
    ['Bekal Sekolah', 'Amir membawa nasi dan buah ke sekolah. Dia berkongsi epal dengan rakannya.'],
    ['Pokok Mangga', 'Datuk menanam pokok mangga di belakang rumah. Pokok itu semakin tinggi.'],
    ['Hujan Petang', 'Hujan turun pada waktu petang. Siti menutup tingkap sebelum membaca buku.'],
    ['Bas Sekolah', 'Bas sekolah tiba pada pukul tujuh. Murid-murid beratur dengan tertib.'],
    ['Ikan Emas', 'Ikan emas berenang di dalam akuarium. Adik memberi ikan itu makanan.'],
    ['Hari Sukan', 'Murid-murid menyertai larian pada Hari Sukan. Mereka bersorak untuk rakan.'],
    ['Perpustakaan', 'Kami pergi ke perpustakaan selepas rehat. Saya memilih sebuah buku cerita.'],
    ['Kebun Sekolah', 'Kelas kami menanam sawi di kebun sekolah. Kami menyiram pokok setiap hari.'],
    ['Jiran Baharu', 'Keluarga baharu berpindah ke rumah sebelah. Kami menyambut mereka dengan senyuman.'],
    ['Pasar Pagi', 'Ibu membeli sayur di pasar pagi. Penjual itu memberi ibu seikat bayam.'],
    ['Burung Kecil', 'Seekor burung kecil membuat sarang di pokok. Anak burung menunggu makanan.'],
    ['Bilik Kemas', 'Nadia menyusun buku di dalam bilik. Dia menyimpan mainan di dalam kotak.'],
    ['Kasut Hilang', 'Hakim mencari kasutnya di bawah bangku. Dia menjumpainya berhampiran pintu.'],
    ['Makanan Sihat', 'Kami makan buah selepas bersenam. Buah-buahan membantu tubuh kekal sihat.'],
    ['Kawan Menolong', 'Ravi membantu Mei membawa buku. Mereka berjalan bersama ke kelas.'],
    ['Layang-layang', 'Farah bermain layang-layang di padang. Layang-layangnya berwarna merah.'],
    ['Lampu Isyarat', 'Ayah berhenti apabila lampu isyarat berwarna merah. Kami menunggu dengan selamat.'],
    ['Hari Keluarga', 'Keluarga Ali berkumpul pada hari Ahad. Mereka memasak sup di dapur.'],
    ['Pensel Warna', 'Lina melukis rumah menggunakan pensel warna. Gambar itu mempunyai pokok dan awan.'],
    ['Kelas Muzik', 'Guru muzik mengajar kami lagu baharu. Kami menyanyi mengikut rentak.'],
    ['Bola Di Padang', 'Bola itu bergolek ke tepi padang. Johan mengambilnya dan menyambung permainan.'],
    ['Air Minuman', 'Ibu mengisi botol dengan air kosong. Saya membawa botol itu ke sekolah.'],
    ['Kura-kura', 'Kura-kura bergerak perlahan di atas rumput. Adik memerhatikannya tanpa mengganggu.'],
    ['Kedai Buku', 'Kami membeli buku nota di kedai buku. Kakak memilih pen biru.'],
    ['Matahari Terbit', 'Matahari terbit di sebelah timur. Burung mula berkicau pada waktu pagi.'],
    ['Baju Basah', 'Baju Amir basah selepas bermain hujan. Dia menjemurnya di ampaian.'],
    ['Kek Hari Jadi', 'Ibu membuat kek hari jadi untuk adik. Kami menghias kek itu dengan strawberi.'],
    ['Menjaga Alam', 'Murid-murid mengutip sampah di pantai. Mereka membuang sampah ke dalam tong.']
  ],
  english: [
    ['My Garden', 'I water the flowers every morning. The small garden looks bright.'],
    ['A New Pencil', 'Mia gets a new pencil at school. She writes her name on it.'],
    ['The Red Kite', 'Tom flies a red kite in the field. The kite moves high in the sky.'],
    ['Rainy Day', 'Rain falls after lunch. Ben reads a story while he stays indoors.'],
    ['At the Library', 'Sara visits the library on Tuesday. She chooses a book about animals.'],
    ['Healthy Lunch', 'Adam packs rice and fruit for lunch. He drinks water after eating.'],
    ['The Little Bird', 'A little bird builds a nest in a tree. It carries soft grass to the nest.'],
    ['School Bus', 'The school bus arrives at seven o’clock. The children wait in a neat line.'],
    ['A Kind Friend', 'Lily helps her friend carry the books. They walk back to class together.'],
    ['The Goldfish', 'A goldfish swims in a round bowl. Dan feeds it in the morning.'],
    ['Clean Room', 'Nora puts her toys in a box. Her room looks tidy and fresh.'],
    ['At the Market', 'Mum buys vegetables at the market. She brings home a bunch of spinach.'],
    ['Sports Day', 'The pupils run in a race on Sports Day. They cheer for every runner.'],
    ['A Tall Tree', 'Grandpa plants a tall tree behind the house. Birds rest on its branches.'],
    ['Lost Shoes', 'Haziq looks under the bench for his shoes. He finds them near the door.'],
    ['Music Class', 'Our teacher teaches a new song. We clap to the steady beat.'],
    ['The Red Light', 'Dad stops when the traffic light is red. We cross when it is safe.'],
    ['Sunday Picnic', 'The family has a picnic on Sunday. They share sandwiches under a shady tree.'],
    ['Colour Pencils', 'Ella draws a house with colour pencils. She adds clouds and a small tree.'],
    ['A Wet Shirt', 'Kai plays in the rain and gets wet. He hangs his shirt to dry.'],
    ['A Birthday Cake', 'Mum makes a cake for Ana. The children decorate it with strawberries.'],
    ['The Slow Tortoise', 'A tortoise walks slowly across the grass. We watch it quietly.'],
    ['Book Shop', 'We visit a book shop after school. Amir chooses a blue notebook.'],
    ['Sunrise', 'The sun rises in the east. Birds begin to sing in the morning.'],
    ['Water Bottle', 'I fill my bottle with clean water. I take it to class every day.'],
    ['A Helpful Neighbour', 'A new family moves next door. We welcome them with a smile.'],
    ['The Ball', 'The ball rolls to the side of the field. Johan picks it up for the game.'],
    ['A Busy Kitchen', 'Dad cooks soup in the kitchen. We set the plates on the table.'],
    ['Keeping Nature Clean', 'The pupils collect rubbish at the beach. They put it into a bin.'],
    ['A Happy Cat', 'Our cat sleeps on a mat. It purrs when we gently stroke its back.']
  ],
  arab: [
    ['قطة صغيرة', 'عندي قطة صغيرة. تنام القطة على السجادة.'],
    ['في الحديقة', 'يذهب أمين إلى الحديقة صباحا. الهواء هناك نقي.'],
    ['حقيبة المدرسة', 'تحمل سارة حقيبة زرقاء إلى المدرسة. فيها كتاب وقلم.'],
    ['شجرة المانجو', 'زرع الجد شجرة مانجو خلف البيت. كبرت الشجرة كثيرا.'],
    ['يوم ممطر', 'نزل المطر بعد الظهر. قرأ خالد كتابا في البيت.'],
    ['حافلة المدرسة', 'تصل حافلة المدرسة في الساعة السابعة. يقف التلاميذ في صف.'],
    ['سمكة ذهبية', 'تسبح سمكة ذهبية في الحوض. يطعمها علي كل صباح.'],
    ['يوم الرياضة', 'شارك التلاميذ في سباق الجري. شجعوا أصدقاءهم.'],
    ['في المكتبة', 'ذهبت مريم إلى المكتبة. اختارت كتابا عن الحيوانات.'],
    ['طعام صحي', 'أكلت ليلى الفاكهة وشربت الماء. الطعام الصحي مفيد للجسم.'],
    ['عصفور صغير', 'بنى عصفور صغير عشا في الشجرة. حمل العصفور العشب الناعم.'],
    ['سوق الصباح', 'اشترت أمي الخضروات من السوق. عادت إلى البيت سعيدة.'],
    ['غرفة نظيفة', 'رتب يوسف ألعابه في الصندوق. أصبحت غرفته نظيفة.'],
    ['حذاء ضائع', 'بحث حازم عن حذائه تحت المقعد. وجده قرب الباب.'],
    ['صديق يساعد', 'ساعد فهد صديقه في حمل الكتب. مشيا إلى الصف معا.'],
    ['طائرة ورقية', 'لعبت فاطمة بالطائرة الورقية في الملعب. كان لونها أحمر.'],
    ['إشارة المرور', 'توقف أبي عند الضوء الأحمر. عبرنا الطريق عندما أصبح آمنا.'],
    ['يوم العائلة', 'اجتمعت العائلة يوم الأحد. طبخوا الحساء في المطبخ.'],
    ['أقلام ملونة', 'رسمت نور بيتا بالأقلام الملونة. أضافت شجرة وسحابة.'],
    ['درس الموسيقى', 'علمنا المعلم أغنية جديدة. غنينا مع الإيقاع.'],
    ['كرة في الملعب', 'تدحرجت الكرة إلى جانب الملعب. أخذها حسن وأكمل اللعب.'],
    ['زجاجة ماء', 'ملأت أمي الزجاجة بالماء. أخذتها إلى المدرسة.'],
    ['سلحفاة بطيئة', 'تمشي السلحفاة ببطء فوق العشب. شاهدها الطفل بهدوء.'],
    ['مكتبة الكتب', 'ذهبنا إلى متجر الكتب. اشترت أختي دفترا أزرق.'],
    ['شروق الشمس', 'تشرق الشمس من الشرق. تغرد الطيور في الصباح.'],
    ['جار جديد', 'انتقلت أسرة جديدة إلى البيت المجاور. رحبنا بهم بابتسامة.'],
    ['قميص مبلل', 'لعب عمر تحت المطر فابتل قميصه. نشره ليجف.'],
    ['كعكة الميلاد', 'صنعت أمي كعكة لأخي. زيناها بالفراولة.'],
    ['المحافظة على الطبيعة', 'جمع التلاميذ النفايات في الشاطئ. وضعوها في سلة.'],
    ['قط سعيد', 'ينام القط على فراشه. يخرخر عندما نداعبه بلطف.']
  ]
};

function createReadingSet(id, seeds) {
  const language = id === 'bm' ? 'Bahasa Melayu' : id === 'english' ? 'Bahasa Inggeris' : 'Bahasa Arab';
  const speechLang = id === 'bm' ? 'ms-MY' : id === 'english' ? 'en-US' : 'ar-SA';
  return { id, language: id, label: language, speechLang, title: language + ' Bacaan', sessionItems: seeds.map(([title, text], index) => ({ id: id + '-' + (index + 1), language: id, label: language, speechLang, title, text })) };
}
export const semanticReadingPassages = Object.entries(readingSeeds).map(([id, seeds]) => createReadingSet(id, seeds));

const writingSeeds = {
  bm: ['Tulis tentang sarapan kamu.','Bina ayat tentang kelas.','Huraikan kucing kamu.','Tulis perjalanan ke sekolah.','Lengkapkan ayat tentang kebersihan.','Tulis tentang permainan taman.','Huraikan cuaca hari ini.','Tulis makanan sihat.','Ceritakan rakan baik.','Tulis aktiviti hujung minggu.'],
  english: ['Write about your breakfast.','Build a sentence about class.','Describe your cat.','Write about going to school.','Complete a sentence about being clean.','Write about a park game.','Describe today’s weather.','Write about healthy food.','Describe your best friend.','Write about your weekend.'],
  arab: ['اكتب عن فطورك.','كوّن جملة عن فصلك.','صف قطتك.','اكتب عن طريقك إلى المدرسة.','أكمل جملة عن النظافة.','اكتب عن لعبة في الحديقة.','صف طقس اليوم.','اكتب عن طعام صحي.','صف صديقك.','اكتب عن عطلتك.']
};

function createWritingSet(id, seeds) {
  const language = id === 'bm' ? 'BM' : id === 'english' ? 'Bahasa Inggeris' : 'Bahasa Arab';
  const sessionItems = Array.from({ length: 50 }, (_, index) => {
    const text = seeds[index % seeds.length];
    const variation = index < seeds.length ? text : `${text} Idea ${index + 1}`;
    const clean = variation.replace(/[.?!]/g, '');
    const words = clean.split(/\s+/).slice(0, 4);
    const keywords = clean.split(/\s+/).slice(0, 3);
    const task = (label) => ({ label, prompt: variation, words, keywords, answer: clean });
    return { id: `${id}-${index + 1}`, title: `${language} Menulis ${index + 1}`, tasks: { arrange: task('Susun ayat'), blank: task('Isi tempat kosong'), short: task('Jawapan pendek'), build: task('Bina ayat'), paragraph: task('Perenggan mudah') } };
  });
  return { id, language, title: `${language} Menulis`, sessionItems };
}
export const semanticWritingSets = Object.entries(writingSeeds).map(([id, seeds]) => createWritingSet(id, seeds));

export function normalizeCommunicationText(value = '') { return String(value).toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim(); }
