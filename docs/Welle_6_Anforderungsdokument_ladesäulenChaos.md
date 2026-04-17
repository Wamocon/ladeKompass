**Anforderungsdokument**

LadesäulenChaos Softwareprojekt

  -----------------------------------------------------------------------
  **Projekt:**           LadesäulenChaos
  ---------------------- ------------------------------------------------
  **Unternehmen**        WAMOCON GmbH

  **App Version:**       1

  **Erstellt von:**      Nikolaj Schefner

  **Eingereicht an:**    Waleri Moretz (Geschäftsführung)

  **Datum:**             09.04.2026

  **Vertraulichkeit:**   Intern vertraulich

  **Status:**            Freigegben
  -----------------------------------------------------------------------

\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--

# **1. Zusammenfassung**

## **1.1 Die Idee**

LadesäulenChaos ist eine universelle Lade-App für E-Autofahrer in
Deutschland. Sie löst das täglich erlebte Problem:

-   Wer öffentlich lädt, braucht je nach Netzwerk eine andere App, eine
    andere Ladekarte und kennt die Preise oft erst nach dem Laden.

LadesäulenChaos bündelt alle relevanten Ladenetzwerke, zeigt
Echtzeit-Verfügbarkeit und vergleicht Tarife, bevor der Ladevorgang
startet.

## **1.2 Warum jetzt?**

Im Jahr 2025 wurden in Deutschland 545.142 reine E-Autos neu zugelassen,
Marktanteil 19,1 Prozent, neuer Höchstwert. Im März 2026 kamen weitere
70.663 hinzu. Parallel stieg die Zahl öffentlicher Ladepunkte auf
172.150, betrieben von hunderten verschiedenen Betreibern. Je mehr
Betreiber es gibt, desto unübersichtlicher wird die Landschaft für
Fahrer. Eine neutrale Aggregator-App wird mit jeder neuen Ladesäule
wertvoller.

# **2. Marktanalyse: Fokus Deutschland**

## **2.1 E-Fahrzeugbestand und tatsächliche Zielgruppe**

Deutschland hat heute rund 2,93 Millionen Elektrofahrzeuge auf der
Straße: 1,9 Millionen reine Elektroautos (BEV)

Wichtig:

-   Nicht alle 2,93 Millionen Fahrer sind automatisch Nutzer einer
    Lade-App.

-   Wer eine Wallbox zu Hause hat, deckt den Großteil seiner Ladeenergie
    privat ab und lädt öffentlich nur auf Reisen oder als Ergänzung.

-   Tesla-Fahrer laden bevorzugt am eigenen Supercharger-Netz, das seit
    Ende 2023 zu 99 Prozent auch für Fremdmarken geöffnet ist, aber
    weiterhin über die Tesla-App läuft.

Die echte Zielgruppe sind daher E-Autofahrer, die regelmäßig auf
öffentliche Ladesäulen fremder Anbieter angewiesen sind:

-   Pendler ohne Heimladeoption,

-   Langstreckenfahrer und Flottenfahrer.

Branchenschätzungen gehen von 40 bis 60 Prozent der E-Autofahrer aus,
die mindestens mehrmals monatlich öffentlich laden.

Das ergibt heute eine realistische Kernzielgruppe von 1,2 bis 1,8
Millionen Nutzern in Deutschland, wachsend auf schätzungsweise 3 bis 5
Millionen bis 2030.

*Quelle: KBA, EnBW Blog Januar 2026, Dena Dezember 2025, ADAC April
2026, Alternativ-Mobil*

## **2.2 Ladeinfrastruktur: Wachstum und was es bedeutet**

In Deutschland waren im Juli 2025 insgesamt 172.150 öffentliche
Ladepunkte in Betrieb, davon rund 40.777 Schnellladepunkte.

Die Zahl der Ladepunkte wuchs von Mai 2024 bis Mai 2025 um 17 Prozent,
Schnellladepunkte sogar um 34 Prozent. Die Bundesregierung plant bis
2030 über 1 Million öffentliche Ladepunkte.

Was das für LadesäulenChaos bedeutet:

-   Jeder neue Ladepunkt kommt von einem Betreiber mit eigenem Tarif und
    eigener App.

-   Je schneller die Infrastruktur wächst, desto mehr Betreiber treten
    in den Markt ein, und desto größer wird das Chaos.

-   LadesäulenChaos wird mit jedem neuen Ladepunkt relevanter, nicht
    weniger.

*Quelle: Bundesnetzagentur Juli 2025, AutoBild Juni 2025,
Bundesregierung*

## **2.3 Das Kernproblem: Fragmentierung des Lademarkts**

Fragmentierung bezeichnet den Zustand, in dem ein zusammengehöriger
Markt in viele unverbundene Inseln zerfällt. Im deutschen Lademarkt hat
jeder der hunderten Betreiber sein eigenes System, seine eigene App und
seine eigene Preislogik. Das erzeugt sechs konkrete Probleme für jeden
Fahrer:

-   Zu viele Apps:

    -   Erfahrene E-Autofahrer besitzen heute 3 bis 5 verschiedene
        Lade-Apps und Ladekarten, weil kein Anbieter alle Ladesäulen in
        Deutschland abdeckt.

-   Intransparente Tarife:

    -   Es gibt kWh-Preise, Minutenpreise, Grundgebühren und
        Blockiergebühren in verschiedenen Kombinationen.

    -   Der ADAC beschreibt die Abrechnung ausdrücklich als teils
        verwirrend.

-   Unbekannte Roaming-Kosten:

    -   Wer mit einer App an einer Säule eines anderen Netzes lädt,
        zahlt einen Aufschlag.

    -   Wie hoch, erfährt man oft erst auf der Abrechnung.

-   Instabile Partnerschaften:

    -   Die ADAC-EnBW-Kooperation endete im Juli 2024.

    -   Millionen Nutzer verloren ihren bevorzugten Tarif.

    -   Solche Brüche verunsichern Nutzer.

-   Datenschutzmängel:

    -   Eine unabhängige Analyse (Kuketz Blog 2023) zeigt, dass die
        EnBW-App Nutzerdaten mit personenbezogenen IDs an Drittanbieter
        weitergibt, ohne die rechtlichen Anforderungen einzuhalten.

-   Schlechte Nutzbarkeit:

    -   Komplexe Anmeldung, unklare Statusanzeigen, fehlerhafte
        Standortdaten.

    -   Nutzerbewertungen bei Google Play nennen konsistent
        umständliches Login und verwirrende Bedienung.

Zum Vergleich:

-   Mobile Telefonie war in den 1990er-Jahren genauso fragmentiert.

-   Erst technische Standards und regulatorische Eingriffe lösten das.

-   Im Lademarkt stehen wir genau an diesem Wendepunkt.

*Quelle: ADAC 2025, Kuketz-Blog 2023, AutoBild Juni 2025, electrive.net
November 2024*

## 

## **2.4 Regulatorischer Rückenwind**

Die EU-Verordnung AFIR[^1] ist seit April 2024 verbindlich und stärkt
direkt den USP von LadesäulenChaos:

-   AFIR schreibt Preistransparenz in Echtzeit an Schnellladepunkten
    über 50 kW vor.

    -   LadesäulenChaos zeigt genau das.

-   AFIR schreibt Ad-hoc-Laden per Kartenterminal ohne App-Pflicht vor.

    -   LadesäulenChaos unterstützt das (Version 2).

-   EU-CO2-Flottengrenzwerte zwingen Hersteller zu hohen
    BEV-Neuzulassungen.

    -   Das garantiert das Wachstum der Zielgruppe.

-   EU-Verbrennerverbot ab 2035 bedeutet, dass alle Pkw-Neuzulassungen
    in der EU werden elektrifiziert.

    -   Der Markt für Lade-Apps wächst strukturell gesichert.

*Quelle: EU-Verordnung AFIR 2023/1804, Bundesministerium für Digitales
und Verkehr, EU-Klimapaket 2035*

# **3. Wettbewerb**

## **3.1 Netzbetreiber mit eigener App: Stärken und strukturelle Schwächen**

Netzbetreiber wie EnBW, Shell und ADAC betreiben eigene Ladesäulen und
bieten gleichzeitig Apps an. Das schafft einen Interessenkonflikt:

-   Ihr Ziel ist nicht, dem Nutzer den günstigsten Preis zu zeigen,
    sondern Umsatz im eigenen Netz zu maximieren.

-   Das ist die entscheidende Schwäche und gleichzeitig die Marktöffnung
    für LadesäulenChaos.

  -------------------------------------------------------------------------------
  **Anbieter**   **Ladepunkte**   **Stärke des          **Schwäche als App,
                                  Anbieters**           Chance für
                                                        LadesäulenChaos**
  -------------- ---------------- --------------------- -------------------------
  EnBW mobility+ 900.000 in 17    7-facher              Sendet Nutzerdaten mit
                 Ländern          connect-Testsieger,   personenbezogenen IDs an
                                  größtes               Drittanbieter (Kuketz
                                  Schnellladenetz DE,   2023). Roaming-Preise an
                                  AutoBild              fremden Säulen
                                  App-Testsieger 2025   intransparent. Nicht
                                                        neutral, fördert eigenes
                                                        Netz.

  Shell Recharge 714.000          Großes                Seit Juni 2025 dynamische
                                  internationales Netz, Preise, die sich täglich
                                  Markenbekanntheit     ändern. Für Nutzer kaum
                                                        planbar. Keine
                                                        Neutralität.

  ADAC e-Charge  Aral Pulse-Netz  Markenvertrauen ADAC, Kooperation mit EnBW
  (Aral Pulse)                    keine Grundgebühr     endete Juli 2024,
                                                        Millionen Nutzer mussten
                                                        wechseln. Roaming 75
                                                        Cent/kWh, doppelt so
                                                        teuer wie
                                                        Eigenladepunkte.

  EWE Go         127.000 in DE    Günstigster Tarif     Nur stark in
                                  2026: Ø 762 EUR/Jahr  Norddeutschland.
                                  (AutoBild)            Außerhalb kaum präsent.
                                                        Kein überregionaler
                                                        Fahrer kann sich allein
                                                        darauf verlassen.

  Tesla          3.600 in DE, 99% Schnellstes Netz,     Nur über Tesla-App
  Supercharger   für Fremdmarken  eigene App, seit 2023 steuerbar. Fremdmarken
                 offen            markenoffen           zahlen 0,55 bis 0,68
                                                        EUR/kWh, Tesla-Fahrer
                                                        0,42 bis 0,51 EUR.
                                                        Diskriminierende
                                                        Preisstruktur.
  -------------------------------------------------------------------------------

Das gemeinsame Muster:

-   Jeder dieser Anbieter maximiert seinen eigenen Netzwerkumsatz.

-   Kein einziger zeigt dem Nutzer, dass er an derselben Säule bei einem
    anderen Anbieter günstiger laden könnte.

-   LadesäulenChaos tut genau das.

## **3.2 Unabhängige Aggregatoren: Warum sie die Lücke nicht schließen**

Aggregatoren haben keinen eigenen Umsatz durch Ladesäulen, sind also
grundsätzlich neutraler. Aber keiner von ihnen schließt die Lücke
vollständig:

  --------------------------------------------------------------------------
  **Anbieter**   **Was er bietet**        **Was fehlt und warum das eine
                                          Chance ist**
  -------------- ------------------------ ----------------------------------
  Chargemap      Kartenansicht, 600.000   Hat eigene Ladetarife eingestellt.
                 Punkte EU,               Bietet heute kein direktes Laden
                 Community-Bewertungen,   mehr an. Nutzer müssen wieder zu
                 1,5 Mio. Nutzer          Netzwerkanbietern wechseln.

  Plugsurfing    600.000 Punkte EU, keine Abrechnung je nach Säule
                 Grundgebühr, Ladestart   verschieden, teils schwer
                 möglich                  vergleichbar. Kein Tarifvergleich
                                          vor dem Laden.

  Chargeprice    Zeigt günstigsten        Nur Preisanzeige, kein Ladestart,
  App            Anbieter je Ladesäule    keine Bezahlung. Nutzer muss
                 kostenlos                danach noch eine zweite App
                                          öffnen.

  A Better       Beste Routenplanung,     Kein Ladestart, keine Bezahlung.
  Routeplanner   Batteriemodell je        Nur Planung.
                 Fahrzeug                 
  --------------------------------------------------------------------------

Die Marktlücke:

-   Es gibt heute keine neutrale App, die Ladestationssuche,
    Tarifvergleich vor dem Laden und direkten Ladestart in einer
    Anwendung kombiniert.

-   LadesäulenChaos schließt diese Lücke.

*Quelle: AutoBild Juni 2025, eMobility Excellence Report 2025, ADAC
2025, Kuketz-Blog 2023*

# **4. Zielgruppe**

## **4.1 Primäre Zielgruppe (B2C) und Marktvolumen**

Die Hauptzielgruppe ist Privatpersonen mit E-Fahrzeugen, die öffentlich
laden. Sie bilden den größeren Markt, haben hohe tägliche
Nutzungsintensität und sind am schwierigsten von bestehenden Anbietern
zu halten, weil ihre Loyalität von Preisen und Einfachheit abhängt,
nicht von Verträgen.

Warum Privatkunden priorisiert werden:

-   Sie sind die Mehrheit der heutigen 1,2 bis 1,8 Millionen öffentlich
    ladenden Fahrer.

-   Sie entscheiden selbst, welche App sie nutzen.

-   Eine gute App mit klarem Mehrwert (günstigster Preis, einfachste
    Bedienung) gewinnt diese Gruppe durch Mundpropaganda und
    App-Store-Bewertungen, ohne teuren Vertrieb.

-   B2B-Kunden haben längere Entscheidungszyklen, höhere
    Vertragsanforderungen und kleinere Stückzahlen.

Vier Nutzerprofile im B2C-Bereich:

-   Pendler ohne Wallbox: Lädt täglich oder mehrmals wöchentlich
    öffentlich. Höchster Leidensdruck durch aktuelle
    Unübersichtlichkeit. Wichtigste Nutzergruppe.

-   Gelegenheitslader mit Heimwallbox: Lädt öffentlich hauptsächlich auf
    Reisen. Sucht Einfachheit und kennt Ladesäulen unterwegs nicht.

-   Langstreckenfahrer: Nutzt häufig HPC[^2]-Schnellladepunkte auf
    Autobahnen. Benötigt zuverlässige Verfügbarkeitsdaten und
    Routenplanung.

-   Flottenfahrer (Firmenwagen): Lädt im Auftrag des Arbeitgebers und
    braucht einen klaren Nachweis der Ladekosten für die Abrechnung.

## **4.2 Sekundäre Zielgruppe (B2B)**

Unternehmen mit E-Fuhrparks sind eine attraktive, aber separate
Zielgruppe. Sie brauchen zentrale Kostenkontrolle, mehrere
Fahrzeugprofile und monatliche Berichte für die Buchhaltung. Das ist ein
Premium-Segment mit höherer Zahlungsbereitschaft als Privatfahrer. Für
Version 1 ist B2B nicht der Fokus, die Infrastruktur (Rollen,
Fahrzeugprofile, Ladehistorie) wird aber so angelegt, dass B2B in einer
späteren Version ohne Architekturwechsel ergänzt werden kann.

## 

## **4.3 Nicht Zielgruppe**

Fahrer, die ausschließlich zu Hause an einer privaten Wallbox laden und
nie öffentlich laden, benötigen LadesäulenChaos nicht. Das betrifft
einen Teil der Tesla-Fahrer, die das Supercharger-Netz als ausreichend
betrachten. Diese Gruppe wird mit wachsenden Langstreckenanforderungen
und Preisdruck aber zunehmend zur potenziellen Zielgruppe.

# **5. Nutzen**

## **5.1 Nutzen für Kunden**

  -------------------------------------------------------------------------
  **Problem heute**    **Lösung durch            **Konkreter Vorteil**
                       LadesäulenChaos**         
  -------------------- ------------------------- --------------------------
  3 bis 5 verschiedene Eine App für alle         Ein Login, weniger
  Apps                 Netzwerke                 Verwaltungsaufwand

  Tarife erst nach dem Tarifvergleich vor dem    Bis zu 300 EUR Ersparnis
  Laden bekannt        Ladestart                 pro Jahr (AutoBild 2025)

  Roaming-Aufschläge   Alle Kosten inklusive     Keine bösen Überraschungen
  überraschend         Roaming vorher angezeigt  auf der Abrechnung

  Verfügbarkeit unklar Echtzeit-Verfügbarkeit    Keine vergeblichen
                       und Community-Meldungen   Anfahrten

  Registrierung bei    Gastnutzung,              Sofortiger Einstieg ohne
  jedem Anbieter       Ad-hoc-Kartenzahlung ohne Hürde
                       Konto                     

  Datenschutzmängel    DSGVO-konform, Server in  Datenschutz als aktives
  bei EnBW             DE/EU                     Kaufargument
  -------------------------------------------------------------------------

*Quelle: AutoBild Juni 2025, Kuketz-Blog 2023, ADAC 2025*

## **5.2 Nutzen für die WAMOCON GmbH**

LadesäulenChaos ist ein Konsumentenprodukt mit täglich wiederkehrender
Nutzung. Jeder Ladevorgang ist ein Kontaktpunkt. WAMOCON baut damit eine
direkte Kundenbeziehung zu einer stark wachsenden Nutzergruppe auf.

Eigenes Produkt mit Alleinstellungsmerkmal:

-   WAMOCON tritt als Softwareanbieter in einem gesetzlich gesicherten
    Wachstumsmarkt auf.

-   Das schafft Markenpräsenz unabhängig von Einzelprojekten.

Mehrere Einnahmequellen:

-   Free- und Premium-Abo,

-   Transaktionsprovision pro Ladevorgang und

-   langfristig White-Label-Kooperationen mit Automobilherstellern oder
    Energieversorgern.

Wachstumshebel:

-   Der Markt verdoppelt bis verfünffacht sich bis 2030.

-   Wer jetzt Nutzer gewinnt, profitiert von Netzwerkeffekten und
    Nutzerloyalität.

# **6. Abhängigkeiten und Machbarkeit**

LadesäulenChaos hat zwei externe Abhängigkeiten:

-   Datenzugang zu Ladesäulen und

-   die Möglichkeit, Ladevorgänge abzurechnen.

-   Beide sind lösbar ohne exklusive Partnerschaft.

Wichtig:

-   Für Version 1 wird bewusst auf Roaming-Abrechnung verzichtet, um
    maximale Unabhängigkeit zu sichern.

## **6.1 Datenzugang: Welche Quellen für welche Funktionen**

  ------------------------------------------------------------------------------------------------------------------
  **Quelle**            **Was sie liefert**       **Für welche             **Abhängigkeit**   **Kosten**
                                                  App-Funktion**                              
  --------------------- ------------------------- ------------------------ ------------------ ----------------------
  Open Charge Map API   Standorte, Steckertypen,  Kartenansicht,           Keine Vereinbarung Kostenlos
                        Leistung, statische Infos Ladestationssuche,       nötig, öffentliche 
                                                  Fahrzeugfilter           API                

  Bundesnetzagentur     Alle gemeldeten           Offizielle DE-Daten als  Kein Vertrag,      Kostenlos
  Ladesäulenregister    Ladepunkte DE mit         zweite Kartenquelle,     offene Daten       
                        Standort, Betreiber,      Qualitätssicherung                          
                        Leistung                                                              

  Community-Meldungen   Echtzeit-Verfügbarkeit,   Verfügbarkeitsanzeige,   Keine externe      Kein Drittanbieter
  (App-Nutzer)          Defekte, aktuelle         Defektmeldungen          Abhängigkeit,      
                        Belegung gemeldet von                              intern aufgebaut   
                        Nutzern                                                               

  Mapbox EV Charge      750.000+ Ladepunkte       Echtzeit-Verfügbarkeit   API-Vertrag mit    Nutzungsbasiert
  Finder API            weltweit mit              und Tarifvergleich       Mapbox,            
                        Echtzeit-Verfügbarkeit    (Version 2+)             nutzungsbasierte   
                        und Preisen                                        Bezahlung, kein    
                                                                           Exklusivvertrag    

  OCPI direkt zu CPOs   Echtzeit-Verfügbarkeit,   Vollständiger            Technische         Hubject:
  oder Hubs             Tarife, Ladestart         Tarifvergleich und       Anbindungen, kein  Registrierungsgebühr
                                                  Ladestart (Version 2+)   Exklusivvertrag,   
                                                                           kostenlos und      
                                                                           royalty-free       
  ------------------------------------------------------------------------------------------------------------------

Fazit Datenzugang:

-   Version 1 startet mit Open Charge Map und Bundesnetzagentur-Daten,
    also vollständig kostenlos und ohne jede Vereinbarung.

-   Community-Meldungen ersetzen Echtzeit-Verfügbarkeit als erste
    Näherung.

-   Echtzeit-Daten über Mapbox oder OCPI kommen in Version 2.

## **6.2 Abrechnung: Optionen ohne eigene Netzwerkverträge**

  ------------------------------------------------------------------------------------------
  **Option**           **Wie es              **Abhängigkeit**   **Für       **Empfehlung**
                       funktioniert**                           welche      
                                                                Version**   
  -------------------- --------------------- ------------------ ----------- ----------------
  AFIR-Kartenzahlung   Nutzer bezahlt direkt Keine              Version 1   Start hier
  am Terminal          per Kreditkarte oder  Partnerschaft                  
                       NFC am                nötig, AFIR                    
                       Säulen-Terminal. App  schreibt das vor               
                       übernimmt nur                                        
                       Navigation.                                          

  MSP-Partnerschaft    Plugsurfing übernimmt Kommerzieller      Version 2   Schnellster Weg
  (z.B. Plugsurfing)   Abrechnung,           Vertrag mit einem              zum
                       LadesäulenChaos ist   MSP                            App-Ladestart
                       Frontend                                             

  Hubject White-Label  Hubject stellt        Registrierung bei  Version 2/3 Mittelfristig
                       MSP-Infrastruktur     Hubject, keine                 empfohlen
                       bereit, eine          Exklusivbindung                
                       Anbindung gibt Zugang                                
                       zu vielen CPOs                                       

  Eigener              LadesäulenChaos       Technische Arbeit, Version 3+  Maximale
  OCPI-EMSP-Status     selbst baut           keine Genehmigung,             Unabhängigkeit
                       bilaterale            royalty-free                   langfristig
                       OCPI-Verbindungen zu  Standard                       
                       CPOs auf                                             
  ------------------------------------------------------------------------------------------

Fazit Abrechnung:

-   Für Version 1 ist keine eigene Zahlungsabwicklung notwendig.

-   Die App navigiert zur Säule, der Nutzer bezahlt am Terminal.

-   Das ist die Lösung mit null externen Abhängigkeiten.

-   In-App-Bezahlung folgt in Version 2.

## **6.3 Gesamtbewertung**

Version 1 hat keine kritischen externen Abhängigkeiten. Open Charge Map,
Bundesnetzagentur-Daten und AFIR-Kartenzahlung sind alle öffentlich und
ohne Vertrag verfügbar. Es gibt keinen Punkt, an dem ein Wettbewerber
den Start blockieren kann. Das macht LadesäulenChaos trotz des komplexen
Marktumfelds gut planbar.

# **7. Anforderungen Version 1**

Version 1 ist bewusst minimal gehalten:

-   maximaler Nutzen für Fahrer, minimale externe Abhängigkeiten.

-   Kein Ladestart in der App, keine eigene Zahlungsabwicklung.

-   Stattdessen:

    -   zuverlässige Kartenansicht, fairer Tarifvergleich und gute
        Routenplanung.

## **7.1 Hauptprozesse**

### **7.1.1 Kartenansicht und Ladestationssuche**

Datengrundlage:

-   Open Charge Map API und Bundesnetzagentur-Ladesäulenregister (beide
    kostenlos, ohne Vereinbarung).

-   Echtzeit-Verfügbarkeit über Community-Meldungen in der App.

  -------------------------------------------------------------------------------
  **ID**   **Anforderung**                           **Priorität**   **Status**
  -------- ----------------------------------------- --------------- ------------
  L-01     Interaktive Kartenansicht aller           Muss            Neu
           Ladepunkte aus Open Charge Map und                        
           Bundesnetzagentur-Daten                                   

  L-02     Verfügbarkeitsanzeige je Ladepunkt:       Muss            Neu
           verfügbar, belegt, defekt, unbekannt (aus                 
           Community-Meldungen)                                      

  L-03     Filterfunktion nach Ladeleistung: AC      Muss            Neu
           Normal bis 22 kW, DC Schnell bis 150 kW,                  
           HPC über 150 kW                                           

  L-04     Filterfunktion nach Steckertyp: Typ 2,    Muss            Neu
           CCS, CHAdeMO, Tesla CCS                                   

  L-05     Suchfunktion nach Adresse, Ort oder Name  Muss            Neu
           der Ladestation                                           

  L-06     Detailansicht je Ladesäule: Adresse,      Muss            Neu
           Öffnungszeiten, Steckertypen, Leistung,                   
           bekannte Tarife, Community-Bewertungen                    

  L-07     Community-Meldung: Nutzer können Defekte, Muss            Neu
           Belegung und Preiskorrekturen melden                      
           (Echtzeit-Datenbasis aus der eigenen                      
           Nutzergemeinschaft)                                       

  L-08     Hinweis auf Ad-hoc-Kartenzahlung am       Muss            Neu
           Terminal für Säulen ohne registrierten                    
           Anbieter                                                  
  -------------------------------------------------------------------------------

### **7.1.2 Tarifvergleich mit öffentlichen Quellen**

Tarifquellen in Version 1:

-   Chargeprice-API (kostenlos), öffentlich zugängliche Preisangaben der
    Betreiber, Community-gemeldete Preise.

-   Kein Echtzeit-Roaming, keine eigene Abrechnungslogik.

  -------------------------------------------------------------------------------
  **ID**   **Anforderung**                           **Priorität**   **Status**
  -------- ----------------------------------------- --------------- ------------
  T-01     Anzeige aller bekannten Tarife für die    Muss            Neu
           gewählte Ladesäule vor dem Laden, aus                     
           öffentlichen Quellen und Community-Daten                  

  T-02     Hervorhebung des günstigsten verfügbaren  Muss            Neu
           Tarifs je Ladesäule                                       

  T-03     Aufschlüsselung der Tarifkomponenten:     Muss            Neu
           kWh-Preis, Minutenpreis, Grundgebühr,                     
           Blockiergebühr                                            

  T-04     Preisberechnung auf Basis des             Soll            Neu
           Fahrzeugprofils: voraussichtliche                         
           Ladekosten bei aktuellem Ladestand                        

  T-05     Hinweis wenn Tarifangabe aus              Soll            Neu
           Community-Daten stammt (mit Zeitstempel                   
           der letzten Meldung)                                      
  -------------------------------------------------------------------------------

### **7.1.3 Routenplanung mit Ladestopps**

  -------------------------------------------------------------------------------
  **ID**   **Anforderung**                           **Priorität**   **Status**
  -------- ----------------------------------------- --------------- ------------
  R-01     Routenplanung mit Start und Ziel,         Muss            Neu
           automatische Berechnung notwendiger                       
           Ladestopps auf Basis Fahrzeugprofil                       

  R-02     Berücksichtigung von Batteriekapazität,   Muss            Neu
           Steckertyp und Verbrauch aus dem                          
           Fahrzeugprofil                                            

  R-03     Anzeige bekannter Tarife je geplantem     Soll            Neu
           Ladestopp auf der Route                                   

  R-04     Export der Route nach Apple Maps, Google  Soll            Neu
           Maps oder Waze                                            
  -------------------------------------------------------------------------------

## **7.2 Basisfunktionalitäten**

### **7.2.1 Rollen, Anmeldung und Registrierung**

  -------------------------------------------------------------------------------
  **ID**   **Anforderung**                           **Priorität**   **Status**
  -------- ----------------------------------------- --------------- ------------
  RB-01    Drei Rollen: Fahrer (Standard),           Muss            Neu
           Flottenmanager (B2B, mehrere Fahrzeuge),                  
           Admin (WAMOCON intern)                                    

  RB-02    Registrierung per E-Mail mit              Muss            Neu
           Bestätigungslink (Double-Opt-In)                          

  RB-03    Anmeldung per E-Mail und Passwort sowie   Soll            Neu
           per Google oder Apple (Social Login)                      

  RB-04    Gastnutzung ohne Konto: Karte und         Muss            Neu
           Navigation nutzbar, kein Tarifvergleich                   
           und keine Ladehistorie                                    

  RB-05    Passwort zurücksetzen per E-Mail          Muss            Neu

  RB-06    Admin-Bereich: Nutzerverwaltung,          Muss            Neu
           Inhaltsbearbeitung, Systemeinstellungen                   
  -------------------------------------------------------------------------------

### **7.2.2 Fahrzeugprofil**

  -------------------------------------------------------------------------------
  **ID**   **Anforderung**                           **Priorität**   **Status**
  -------- ----------------------------------------- --------------- ------------
  FP-01    Fahrzeugprofil anlegen: Marke, Modell,    Muss            Neu
           Batteriekapazität, Steckertyp, maximale                   
           Ladeleistung                                              

  FP-02    Mehrere Fahrzeugprofile für               Soll            Neu
           Flottenmanager                                            

  FP-03    Bevorzugte Ladesäulen als Favoriten       Muss            Neu
           speichern                                                 
  -------------------------------------------------------------------------------

### **7.2.3 Navigation, Benachrichtigungen und Darstellung**

  -------------------------------------------------------------------------------
  **ID**   **Anforderung**                           **Priorität**   **Status**
  -------- ----------------------------------------- --------------- ------------
  NV-01    Breadcrumb-Navigation auf allen           Muss            Neu
           Unterseiten                                               

  NV-02    Dashboard: zuletzt genutzte Säulen,       Muss            Neu
           Favoriten, Community-Meldungen in der                     
           Umgebung                                                  

  NV-03    Dunkel/Hell-Modus umschaltbar in den      Muss            Neu
           Einstellungen                                             

  NV-04    Responsives Design für iOS und Android    Muss            Neu

  BN-01    Push-Benachrichtigung bei Abschluss eines Soll            Neu
           gemeldeten Ladevorgangs                                   

  BN-02    Benachrichtigung wenn Lieblingssäule nach Soll            Neu
           Defektmeldung wieder verfügbar ist                        
  -------------------------------------------------------------------------------

### **7.2.4 Spracheinstellungen und Profilseite**

  -------------------------------------------------------------------------------
  **ID**   **Anforderung**                           **Priorität**   **Status**
  -------- ----------------------------------------- --------------- ------------
  SP-01    Sprachumschaltung Deutsch und Englisch in Muss            Neu
           den Einstellungen ohne Seitenneuladen                     

  SP-02    Datum- und Zahlenformate richten sich     Muss            Neu
           nach der gewählten Sprache                                

  PR-01    Profilseite: Name, E-Mail,                Muss            Neu
           Fahrzeugprofile, Einstellungen,                           
           Sprachauswahl                                             

  PR-02    DSGVO: Konto löschen und persönliche      Muss            Neu
           Daten exportieren                                         
  -------------------------------------------------------------------------------

### **7.2.5 Rechtliches und Geschäftsmodell**

  -------------------------------------------------------------------------------
  **ID**   **Anforderung**                           **Priorität**   **Status**
  -------- ----------------------------------------- --------------- ------------
  RE-01    AGB, Impressum, Datenschutzerklärung als  Muss            Neu
           eigene Seiten in der App                                  

  RE-02    Cookie-Banner bei erstem Aufruf,          Muss            Neu
           DSGVO-konform                                             

  RE-03    Zwei-Tarif-Modell: Free (Kartenansicht,   Muss            Neu
           Navigation, Tarifvergleich) und Premium                   
           (Routenplanung, Favoriten, erweiterte                     
           Filterung)                                                

  RE-04    Upgrade von Free auf Premium direkt in    Muss            Neu
           der App                                                   

  RE-05    Server ausschließlich in Deutschland oder Muss            Neu
           EU, keine Weitergabe von Nutzungsdaten an                 
           Drittanbieter                                             
  -------------------------------------------------------------------------------

## **7.3 Scope: Was ist Version 1 und was nicht**

  -----------------------------------------------------------------------
  **In Scope Version 1**              **Out of Scope, ab Version 2 und
                                      folgende**
  ----------------------------------- -----------------------------------
  Kartenansicht mit Open Charge Map   Echtzeit-Verfügbarkeit über OCPI
  und Bundesnetzagentur-Daten         oder Mapbox API

  Tarifvergleich aus öffentlichen     Echtzeit-Tarifvergleich mit
  Quellen (Chargeprice-API,           Roaming-Kosten
  Community)                          

  Community-Meldungen für             Ladevorgang starten direkt in der
  Verfügbarkeit und Preise            App

  Routenplanung mit Ladestopps        In-App-Bezahlung, eigene
                                      Zahlungsabwicklung

  Rollen, Anmeldung, Registrierung,   Vollständiger
  Gastnutzung                         Flottenmanagement-Bereich

  Fahrzeugprofil, Favoriten,          Apple CarPlay und Android Auto
  Dashboard                           

  Dunkel/Hell-Modus, Breadcrumbs,     AutoCharge, bidirektionales Laden
  Spracheinstellungen DE und EN       

  Profilseite, DSGVO-Funktionen       White-Label-Lösung für
                                      Automobilhersteller

  AGB, Impressum, Datenschutz,        KI-gestützte Prognosen und
  Cookie-Banner                       Empfehlungen

  Free- und Premium-Tarif             Öffentliche API für Drittanbieter
  -----------------------------------------------------------------------

# **8. Chancen und Risiken**

## **8.1 Chancen**

  ----------------------------------------------------------------------------
  **Chance**               **Begründung**
  ------------------------ ---------------------------------------------------
  Wachsende Zielgruppe     545.142 neue E-Autos in 2025, Prognose 4,5 bis 8,7
  ohne Deckel              Millionen BEV bis 2030. Jedes neue E-Auto ist ein
                           potenzieller Nutzer.

  AFIR stärkt direkt den   Gesetzlich vorgeschriebene Preistransparenz und
  USP                      Ad-hoc-Laden entsprechen genau dem Kernversprechen
                           der App.

  Kein neutraler           Die Kombination aus Suche, Tarifvergleich und
  Vollservice-Anbieter     Ladestart in einer neutralen App gibt es nicht. Die
                           Lücke ist offen.

  Datenschutz als          EnBW ist öffentlich dokumentiert
  Unterscheidungsmerkmal   datenschutzmängelbehaftet. DSGVO-konformer Betrieb
                           ist ein echtes Kaufargument.

  Version 1 ohne kritische Kein Partnervertrag nötig. Start ist sofort
  Abhängigkeiten           möglich. Kein Gatekeeper kann den Marktzugang
                           blockieren.
  ----------------------------------------------------------------------------

## **8.2 Risiken**

  -------------------------------------------------------------------------------
  **Risiko**            **Warum es eintreten       **Gegenmaßnahme**
                        kann**                     
  --------------------- -------------------------- ------------------------------
  Datenqualität bei     Veraltete oder falsche     Zeitstempel je Meldung,
  Community-Meldungen   Meldungen beschädigen      automatische Markierung bei
                        Nutzervertrauen.           langer Inaktivität, schnelle
                                                   Community-Reaktion durch
                                                   Gamification. Zusätzlich
                                                   Bestätigung der Meldung durch
                                                   andere Nutzer für Echtheit.

  Nutzergewinnung gegen Etablierte Anbieter haben  Positionierung auf Neutralität
  EnBW und Shell        Millionen Nutzer und hohe  und Datenschutz,
                        Markenbekanntheit.         App-Store-Bewertungen als
                                                   Wachstumsmotor, Ansprache von
                                                   EnBW-Kritikern.

  Regulatorische        Als MSP oder               Rechtsberatung vor V2-Launch.
  Anforderungen bei     Zahlungsanbieter greifen   In V1 keine eigene
  Bezahlung (ab V2)     PSD2 und                   Zahlungsabwicklung, daher kein
                        Eichrecht-Anforderungen.   Risiko.

  EnBW oder Chargemap   Theoretisch möglich. Aber  First-Mover-Vorteil durch
  schließt Lücke selbst Neutralität ist für        schnellen V1-Launch.
                        Netzbetreiber strukturell  Datenschutz-Positionierung ist
                        schwer reproduzierbar.     für EnBW nicht glaubwürdig.
  -------------------------------------------------------------------------------

# **9. Umsetzungsplan Version 1**

## **9.1 Entwicklungsansatz**

Die Entwicklung erfolgt mit GitHub Copilot als aktivem
Implementierungswerkzeug. GitHub Copilot schreibt den Großteil des
Codes, der Entwickler übernimmt Review, Architekturentscheidungen und
Qualitätssicherung. Das ermöglicht die Umsetzung von Version 1 in 5-7
Werktagen.

Technologiestack für Version 1:

-   **Frontend:** Next.js (React), Tailwind CSS, Kartenkomponente mit
    Mapbox oder Leaflet.js

-   **Backend und Datenbank:** Supabase[^3] (PostgreSQL mit Row Level
    Security für Rollentrennung, Authentifizierung integriert)

-   **Hosting und Deployment:** Vercel[^4] (automatisches Deployment aus
    GitHub, skaliert ohne Konfiguration)

-   **Externe Daten:** Open Charge Map API (Ladepunktdaten, kostenlos),
    Chargeprice-API (Tarifdaten, öffentlich)

## **9.2 Umsetzungsplan 5 Werktage**

+------+--------------+----------------------------------+------------+
| **T  | **Fokus**    | **Inhalt**                       | **Wer /    |
| ag** |              |                                  | womit**    |
+======+==============+==================================+============+
| Tag  | H            | Kartenansicht mit Open Charge    | Entwickler |
| 1    | auptprozesse | Map-Daten, Filter,               | und GitHub |
| bis  | (Entwurf)    | Ladesäulendetail, Tarifvergleich | Copilot    |
| 3    |              | aus Chargeprice-API,             |            |
|      |              | Routenplanung mit                |            |
|      |              | Fahrzeugprofil. GitHub Copilot   |            |
|      |              | schreibt den Code, Entwickler    |            |
|      |              | reviewt und korrigiert.          |            |
+------+--------------+----------------------------------+------------+
| Tag  | Testing und  | Manuelles Testen aller           | E          |
| 3    | Bugfixing    | Kernfunktionen, Fehlerkorrektur, | ntwickler, |
| bis  | H            | Edge Cases. Parallel:            | GitHub     |
| 4    | auptprozesse | Supabase-Datenbankschema         | Copilot    |
|      |              | aufsetzen, Authentifizierung     | für Fixes  |
|      |              | konfigurieren, Vercel-Deployment |            |
|      |              | einrichten.                      |            |
+------+--------------+----------------------------------+------------+
| Tag  | Basisfunk    | Rollen und Rechteverwaltung,     | E          |
| 4    | tionalitäten | Anmeldung und Registrierung,     | ntwickler, |
| bis  | und          | Fahrzeugprofil, Profilseite,     | GitHub     |
| 5    | Verö         | Dashboard, Spracheinstellungen,  | Copilot    |
|      | ffentlichung | Dunkel/Hell-Modus,               |            |
|      |              | Free/Premium-Modell, AGB und     |            |
|      |              | Datenschutz. Parallel:           |            |
|      |              | Produkthandbuch (erster          |            |
|      |              | Entwurf), Landing Page für App   |            |
|      |              | Store und Website, Impressum und |            |
|      |              | Rechtstexte.                     |            |
+------+--------------+----------------------------------+------------+
| Tag  | Letzte       | Beseitigung von letzten Fehlern, | E          |
| 5    | Arbeiten bei |                                  | ntwickler, |
| bis  | Fehlern      | Prüfung auf offene               | GitHub     |
| 6    |              | Arbeitspakete,                   | Copilot    |
| (Puf |              |                                  |            |
| fer) |              | Vorbereitung auf die             |            |
|      |              | Präsentation                     |            |
+------+--------------+----------------------------------+------------+

Hinweis: Die 5-Tage-Umsetzung produziert einen lauffähigen Prototyp der
Hauptprozesse und alle notwendigen Basisfunktionalitäten für einen
ersten Launch. Das ist kein Endprodukt, aber eine nutzbare Version 1,
die echter Nutzung standhalten kann. Qualitätssicherung und
Stabilisierung laufen nach dem 5-Tage-Sprint weiter.

# **Quellenverzeichnis**

  -----------------------------------------------------------------------
  **Quelle**                  **Inhalt**
  --------------------------- -------------------------------------------
  Bundesnetzagentur Juli 2025 172.150 öffentliche Ladepunkte,
                              Ladesäulenregister, bundesnetzagentur.de

  KBA, Alternativ-Mobil       BEV-Bestand 1,9 Millionen, Neuzulassungen
  Dezember 2025               2025, alternativ-mobil.info

  EnBW Blog Januar 2026       545.142 BEV-Neuzulassungen 2025,
                              Marktanteil 19,1 Prozent, enbw.com

  ADAC April 2026             Neuzulassungen März 2026, Ladetarife 2026,
                              adac.de

  AutoBild Ladeapp-Test Juni  Wachstum Ladepunkte 17 Prozent, EWE Go
  2025                        günstigster Tarif 762 EUR/Jahr, autobild.de

  eMobility Excellence Report MSP-Vergleich, Netzabdeckung,
  2025                        App-Bewertungen, emobilityexcellence.com

  Kuketz IT-Security Blog     Datenschutzanalyse EnBW App, kuketz-blog.de
  2023                        

  EU-Verordnung AFIR          Preistransparenz, Ad-hoc-Laden,
  2023/1804                   eur-lex.europa.eu

  EVRoaming Foundation,       OCPI kostenlos und royalty-free,
  OCPI-Dokumentation          evroaming.org

  Open Charge Map             Offene API für Ladepunktdaten weltweit,
                              openchargemap.org

  Mapbox EV Charge Finder API 750.000+ Ladepunkte mit Echtzeit,
                              mapbox.com

  Tesla Support Deutschland   Supercharger Öffnung für Fremdmarken,
                              tesla.com

  UBA 2025                    BEV-Bestand 2030 Prognose, uba.de

  NOW GmbH 2024               Ladeinfrastruktur-Studie 2025/2030,
                              now-gmbh.de
  -----------------------------------------------------------------------

[^1]: AFIR (Alternative Fuels Infrastructure Regulation): EU-Verordnung
    2023/1804, seit April 2024 gültig. Schreibt Preistransparenz an
    Ladesäulen und Ad-hoc-Kartenzahlung ohne App-Pflicht vor.

[^2]: HPC (High Power Charger): Schnellladepunkte über 150 kW
    Ladeleistung, besonders wichtig für Langstrecken.

[^3]: Supabase: Open-Source Backend-as-a-Service auf PostgreSQL-Basis
    mit integrierter Authentifizierung und Row Level Security (RLS).

[^4]: Vercel: Cloud-Plattform für die Bereitstellung von Web-Apps,
    optimiert für Next.js und React-Anwendungen.
