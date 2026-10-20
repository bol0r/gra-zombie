# DEAD LIGHT: RZEŹ — kontynuacja

Ostatnia aktualizacja: 2026-10-20. GitHub: https://github.com/bol0r/gra-zombie, branch `main`, commit `cecb247` (wypchnięty). Wcześniejszy commit na remote to `1cf4025`.

Ten plik jest źródłem prawdy na moment, gdy skończyły się tokeny w głównym oknie. Nie zaczynaj od nowa. Nie rób rzeczy z sekcji „Już zrobione” ani „Na później, nie ruszaj”.

## Gdzie przerwało

Główne okno mieliło długą listę rozgrywki i skończyło tokeny w połowie. To okno boczne dopięło tylko wyłącznik filtra VHS i wypchnęło cały lokalny stan na GitHub (`cecb247`). `npx tsc --noEmit` po tej zmianie przeszedł.

Cloudflare Pages: projekt `dead-light-rzez`, branch `main`, build `npm run build`, output `dist`. Binding KV nie siedzi w `wrangler.toml` (fałszywe id psuło deploy). Po pierwszym deployu, w panelu: Workers & Pages → dead-light-rzez → Settings → Bindings → KV namespace, nazwa zmiennej dokładnie `DAILY`. Bez tego `/api/daily` zwraca 503, a gra po cichu pomija nagrodę.

Nie rób commita ani pusha, dopóki Aleksander w tym oknie nie napisze wprost „zrób commit i push”.

## Już zrobione (nie powtarzaj)

- Trzy poziomy po trzy etapy: Stary Port, Szpital Dixona, Dworzec. Jeden wspólny zegar 2:00 na cały bieg. Przejście bramy nie dodaje czasu. Czas 0 albo śmierć = porażka, nie darmowa ewakuacja.
- Drzewko umiejętności (jedyny sposób na kupowanie mocy), sklepik za monety, pies (Kieł / Warta / Trop), trudność, odznaki, pad Xbox w Chrome na Macu, rekordy w `localStorage`, nagroda dzienna (klient + `functions/api/daily.ts`).
- Intro: `public/movies/video01.mp4` przed poziomem 1, `video02.mp4` przed poziomem 2. Brak pliku nie może blokować gry. `video03.mp4` jeszcze nie istnieje na dysku.
- Muzyka: menu `menu_paper_saints.mp3`, poziom 1 `Low_Tide_Vigil.mp3`, poziom 3 `empty_hall.mp3`, przetrwanie `horde_clock.mp3` (plik jest, tryb przetrwania nadal nie jest w menu, więc utwór zagra dopiero po podpięciu trybu przez `playCue('survival')`). Poziom 2 szuka `public/music/dixon_ward.mp3`. Tego pliku jeszcze nie ma: dopóki go nie ma, poziom 2 zostaje przy `Low_Tide_Vigil.mp3` i gra się nie wywala. Przejście etapu nie zmienia utworu. Starych placeholderów `stary-port` nie używać.
- Opcje: menu i pauza mają **Opcje**, przełącznik „Filtr VHS”. Klucz `deadlight_rzeź_vhs_v1` (`0` wyłączony, brak albo `1` włączony). `PostProcessing.setVhsEnabled`. Wyłączenie zdejmuje pływanie, aberrację VHS, linie i szum. Winieta, nocna korekcja i puls obrażeń zostają.
- Katana ma krótsze ostrze w danych (`bladeLength` 1.4). Bronie są zdefiniowane i część leży na ulicach przez `createWeaponDrop` w `src/entities/Loot.ts`.

## Dokończ to, na czym stanęło

Kolejność ma znaczenie. Zrób punkty po kolei i nie zaczynaj „na później”.

1. **Oznaczenia na planszy.** Broń leży rzadko, apteczka i zdrowie też. Nad takim pickupem ma być delikatna ikona, widoczna z izometrii, bez wielkiego markera. Broń, apteczka i zdrowie mają się dać odróżnić. Ikona znika razem z pickupem. Nie oznaczaj w ten sposób drobnych monet ani zwykłego XP.

2. **Naładowany zamach.** Przytrzymanie LPM / RT ładuje zamach dookoła. Młot zamiast tego robi falę uderzenia (`chargedSlamWave` jest w `WeaponTypes`, ale `Player.meleeChargeRatio` jest tylko zerowany, nigdy nie rośnie).

3. **Strzelba to nie błyskawica.** Błyskawica zostaje tylko przy maczecie elektrycznej. `CombatSystem.ts` około linii 308 nadal woła `spawnLightningArc` dla strzału dystansowego.

4. **Special nie ładuje się od dasha.** `Game.ts` około linii 1201 oraz `CombatSystem.ts` około 221 i 259 nadal robią `addSpecial(8)` przy dashu. Zostaw ładowanie ze walki, nie z dasha i nie ze skoku.

5. **Stamina.** Pełny pasek ma starczyć na około dwa dashe. `Player.maxStamina` jest nadal 100.

6. **Jeden napis etapu.** Zostaw „ETAP x/3” tylko przy zegarze. Zdejmij duplikat z `#hud-day-phase` i z herbu, jeśli nadal powtarza numer etapu.

7. **HUD spokojniejszy.** Przygaś kolory pasków. Mała minimapa, około 120 px. Wynik biegu (zabicia × 10 + monety) i informacja, czy to rekord.

8. **Budynki przed graczem.** Już schodzą do około 0.28, gdy zasłaniają. Zostaw, tylko nie pogarszaj.

9. **Menu jak plakat zombie z lat 80., nie cyberpunk.** Ekran śmierci: tylko powtórka i powrót do menu. Intro i twórcy zostają wyłącznie w menu głównym (to już tak jest, nie cofaj).

10. **Tryb przetrwania.** Logika fal jest w `WaveManager` (`survivalWave` i dalej) i jest zapis rekordów, ale menu ani pętla `Game` tego nie uruchamiają. Arena portu, fale rosną, bez zegara 2:00, własny rekord. Przy starcie tego trybu zawołaj `sound.playCue('survival')`.

11. **Samouczek przy pierwszym uruchomieniu.** Klucz `deadlight_rzeź_tutorial_done_v1` istnieje, okien nie ma. Pauza i małe okna kontekstowe, nie pełny ekran.

12. **Osiem broni na planszach, założenie przy podniesieniu.** Katana, młot, topór, maczeta elektryczna, pistolet, strzelba, karabin, obrzyn. Wspólna, skąpa amunicja. Sprawdź, czy wszystkie osiem naprawdę leżą i da się je założyć. Nie dokładaj dziewiątej.

## Na później, nie ruszaj

Aleksander odłożył to świadomie:

- W sklepiku popup „na razie beta”.
- Na dole menu głównego numer wersji i changelog, jeśli pliku jeszcze nie ma.
- Szpitalny utwór: Aleksander dogra `public/music/dixon_ward.mp3` (Hospital parking garage at night). Nie zmieniaj nazwy w kodzie. Po wrzuceniu pliku wystarczy push, poziom 2 sam go podejmie.
- `video03.mp4` przed poziomem 3, ten sam odtwarzacz co `video01` / `video02`. Pliku jeszcze nie ma. Brak filmu pomija intro i wchodzi w planszę.
- Nagranie rozgrywki i trailer dopiero po stabilnym buildzie.
- Cloudflare KV: namespace utworzyć w panelu i podpiąć jako zmienną `DAILY`. Nie wpisuj id do `wrangler.toml`.

## Stałe, których nie zmieniaj

Tytuł zostaje DEAD LIGHT: RZEŹ. Miasto zamknięte w Starym Porcie po nieudanym teście światła Dead Net Labs. Za dnia zarażeni są wolni, w nocy Volatiles tam, gdzie gasną latarnie. Kurier ma 2:00 na cały bieg trzech etapów. XP drzewka i monety sklepiku to osobne waluty. Drzewko tylko z menu albo z pauzy, bez wyskakujących kart w trakcie biegu. Jeden gracz na samouczku i na filmie, drugi gracz hot-seat filmu nie ogląda.

## Prompt do wklejenia

Wklej w głównym oknie, gdy wrócą tokeny:

```
Przeczytaj docs/KONTYNUACJA.md i dokończ tylko sekcję „Dokończ to, na czym stanęło”, punkt po punkcie.

Nie powtarzaj rzeczy z „Już zrobione”. Nie ruszaj sekcji „Na później”. Nie rób commita ani pusha.

Najpierw delikatne ikony nad rzadką bronią, apteczką i zdrowiem na planszy. Potem naładowany zamach (meleeChargeRatio ma rosnąć przy przytrzymaniu LPM/RT; młot robi falę), strzelba bez błyskawicy, zdjęcie addSpecial(8) z dasha, stamina na około dwa dashe, jeden napis etapu przy zegarze, spokojniejszy HUD z minimapą ~120 px i wynikiem biegu, menu jak plakat zombie z lat 80., podpięcie trybu przetrwania do menu i pętli gry, samouczek pierwszego uruchomienia. Na końcu sprawdź, czy osiem broni leży na planszach i zakłada się przy podniesieniu.

Zostaw filtr VHS i Opcje tak, jak są. Brak pliku muzyki albo filmu nie może wywalić gry. Po zmianach odpal npx tsc --noEmit i sprawdź w przeglądarce na http://127.0.0.1:5173/ menu, Opcje, jeden bieg i podniesienie broni oraz apteczki.
```
