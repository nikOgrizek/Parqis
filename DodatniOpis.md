## 🚗 Celovit potek delovanja pametnega parkirnega sistema

Pametni sistem omogoča popolnoma avtomatizirano upravljanje parkirišč – od rezervacije do izhoda. Spodaj je razširjen, optimiziran in jasno strukturiran opis celotnega procesa.

---

## 1️⃣ Rezervacija pred prihodom

Uporabnik prek spletne strani ali aplikacije:
- izbere želeno parkirišče,
- vnese registrsko številko vozila,
- določi predviden čas parkiranja,
- potrdi rezervacijo.

Sistem nato:
- aktivira rezervacijo,
- označi parkirno mesto kot **rezervirano**,
- poveže parkiranje z registrsko številko (brez kartic, listkov ali QR-kod).

Dodatne funkcionalnosti:
- prikaz trenutne zasedenosti,
- možnost izbire posebnih mest (npr. EV polnilnice, invalidska mesta),
- samodejno obveščanje o skorajšnjem izteku rezervacije.

---

## 2️⃣ Prihod na parkirišče

Na vhodu kamera prepozna registrsko številko in sproži preverjanje:

Sistem preveri:
- ali obstaja aktivna rezervacija,
- ali je rezervacija časovno veljavna,
- ali vozilo prihaja na pravilno parkirišče.

Če je vse pravilno:
- zapornica se **samodejno odpre**,  
- vozilo vstopi brez ustavljanja,
- mesto se označi kot **zasedeno**.

Če rezervacija ni veljavna:
- zapornica ostane zaprta,
- upravljavec prejme opozorilo,
- sistem prikaže razlog (npr. potekla rezervacija, napačno parkirišče),
- po potrebi se sproži postopek obravnave (opozorilo, kazen, obvestilo redarju).

Dodatne funkcionalnosti:
- možnost ročnega potrjevanja vstopa s strani upravljavca,
- integracija z mobilno aplikacijo za takojšnje obveščanje uporabnika.

---

## 3️⃣ Med parkiranjem

Sistem v realnem času spremlja:
- trajanje parkiranja,
- veljavnost rezervacije,
- morebitne prekoračitve.

Uporabnik lahko:
- podaljša parkiranje prek spletne strani ali aplikacije,
- doplača razliko,
- podaljša veljavnost brez premikanja vozila.

Če parkiranje poteče:
- sistem zazna prekoračitev,
- upravljavca opozori na nepravilnost,
- lahko se evidentira kršitev.

Dodatne funkcionalnosti:
- samodejna obvestila uporabniku (SMS, e-mail, push),
- dinamično določanje cen (npr. višja cena ob visoki zasedenosti).

---

## 4️⃣ Zaključek parkiranja in plačilo

Pred odhodom uporabnik:
- poravna morebitno razliko (če je parkiral dlje od rezervacije),
- potrdi zaključek parkiranja.

Po plačilu sistem aktivira **15-minutno izhodno okno**, v katerem mora vozilo zapustiti parkirišče.

Dodatne funkcionalnosti:
- samodejno plačilo prek shranjene kartice,
- izdaja e-računa,
- možnost poslovnih računov in mesečnih poročil.

---

## 5️⃣ Izhod s parkirišča

Na izhodu kamera ponovno prepozna registrsko številko.

Sistem preveri:
- ali je parkiranje zaključeno,
- ali je vozilo znotraj izhodnega časovnega okna.

Če je vse pravilno:
- zapornica se odpre,
- parkirno mesto se sprosti,
- stanje se posodobi kot **prosto**.

Če je izhodno okno prekoračeno:
- sistem lahko zahteva dodatno plačilo,
- ali sproži opozorilo nadzoru.

Dodatne funkcionalnosti:
- možnost avtomatskega zaračunavanja prekoračitve,
- integracija z LPR (License Plate Recognition) sistemi za hitrejši izhod.

---

## 🎯 Ključna logika sistema

Sistem temelji na:
- vezavi parkiranja na **registrsko številko**,
- avtomatskem preverjanju ob vstopu in izstopu,
- sprotnem spremljanju časa in zasedenosti,
- samodejnem sproščanju mest,
- obveščanju upravljavca ob nepravilnostih,
- popolni digitalizaciji brez fizičnih listkov ali kartic.

---

## 🏁 Rezultat

### Za uporabnika:
- brez fizičnih kartic ali listkov,
- brez iskanja parkomata,
- možnost enostavnega podaljšanja parkiranja,
- hitrejši vstop in izstop,
- pregled nad stroški in zgodovino parkiranj.

### Za upravljavca:
- popoln nadzor nad zasedenostjo,
- manj zlorab in nepravilnosti,
- avtomatizirana obravnava kršitev,
- statistika uporabe in poročila,
- manj potrebe po fizičnem nadzoru.
