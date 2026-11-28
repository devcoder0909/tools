import { toolAlternates, type AlternateEntry } from './i18n-alternates';

export interface LocalizedPageConfig {
  lang: 'de' | 'es' | 'fr' | 'pl' | 'it';
  slug: string;
  baseToolSlug: 'tip-calculator' | 'heic-to-jpg';
  title: string;
  description: string;
  h1: string;
  badge: string;
  contentHtml: string;
  alternates: AlternateEntry[];
}

export const localizedPages: LocalizedPageConfig[] = [
  // 1. German Tip Calculator
  {
    lang: 'de',
    slug: 'trinkgeld-rechner',
    baseToolSlug: 'tip-calculator',
    title: 'Trinkgeld Rechner – Trinkgeld berechnen & Rechnung teilen',
    description: 'Kostenloser Trinkgeld-Rechner online. Berechnen Sie das Trinkgeld für Restaurant und Bar und teilen Sie die Rechnung fair auf alle Personen auf.',
    h1: 'Trinkgeld Rechner & Rechnungs-Teiler',
    badge: 'Rechner',
    alternates: toolAlternates['tip-calculator'],
    contentHtml: `
      <section class="prose max-w-none text-slate-700 space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Wie viel Trinkgeld gibt man in Deutschland, Österreich und der Schweiz?</h2>
        <p>In den deutschsprachigen Ländern (DACH-Region) ist das Bedienungsgeld im Restaurant gesetzlich bereits im Endpreis enthalten. Dennoch ist ein freiwilliges Trinkgeld (auch bekannt als „Trinkgeld“ oder „Bedienungsgeld“) eine geschätzte Anerkennung für guten Service:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>5% bis 10% (Standard im Restaurant):</strong> Üblich bei normalem bis freundlichem Service in Gaststätten und Cafés. Bei kleineren Beträgen rundet man häufig auf den nächsten vollen Euro-Betrag auf.</li>
          <li><strong>10% bis 15% (Hervorragender Service):</strong> Angebracht bei aufmerksamem, schnellem und zuvorkommendem Service in gehobenen Restaurants.</li>
          <li><strong>Aufrunden bei Bar und Café:</strong> Bei Rechnungen unter 10 Euro wird meist auf den nächsten vollen Euro aufgerundet.</li>
        </ul>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Rechnung fair unter Freunden aufteilen</h2>
        <p>Unser Online-Rechner ermöglicht es Ihnen, den Gesamtbetrag der Bewirtung inklusive Trinkgeld exakt auf die Anzahl der Gäste aufzuteilen. Jeder Gast erfährt sofort seinen individuellen Zahlungsbetrag auf den Cent genau.</p>
        <p>Nutzen Sie auch unsere englischen Werkzeuge wie den <a href="/tip-calculator/" class="text-emerald-700 underline font-medium">Tip Calculator</a>, den <a href="/discount-calculator/" class="text-emerald-700 underline font-medium">Discount Calculator</a> und den <a href="/percentage-calculator/" class="text-emerald-700 underline font-medium">Percentage Calculator</a>.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Internationale Versionen dieses Rechners</h2>
        <p>Dieser Trinkgeldrechner ist in weiteren europäischen Sprachen verfügbar:</p>
        <ul class="list-disc pl-6 space-y-1">
          <li>Spanisch: <a href="/es/calculadora-de-propinas/" class="text-emerald-700 underline">Calculadora de Propinas</a></li>
          <li>Französisch: <a href="/fr/calculateur-de-pourboire/" class="text-emerald-700 underline">Calculateur de Pourboire</a></li>
          <li>Polnisch: <a href="/pl/kalkulator-napiwkow/" class="text-emerald-700 underline">Kalkulator Napiwków</a></li>
          <li>Italienisch: <a href="/it/calcolo-mance/" class="text-emerald-700 underline">Calcolo Mance</a></li>
          <li>Hauptübersicht: <a href="/calculators/" class="text-emerald-700 underline">Online Calculators</a></li>
        </ul>
      </section>
    `,
  },

  // 2. Spanish Tip Calculator
  {
    lang: 'es',
    slug: 'calculadora-de-propinas',
    baseToolSlug: 'tip-calculator',
    title: 'Calculadora de Propinas – Dividir la Cuenta del Restaurante',
    description: 'Calculadora de propinas online gratis. Calcule el porcentaje de propina en restaurantes y divida el total de la cuenta entre varios comensales al céntimo.',
    h1: 'Calculadora de Propinas para Restaurantes',
    badge: 'Calculadora',
    alternates: toolAlternates['tip-calculator'],
    contentHtml: `
      <section class="prose max-w-none text-slate-700 space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">¿Cuánto se deja de propina en España y América Latina?</h2>
        <p>La costumbre de dejar propina varía notablemente según el país y el tipo de establecimiento gastronómico:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>España:</strong> La propina no es legalmente obligatoria, ya que el servicio está incluido en el sueldo del personal. Es habitual redondear la cuenta o dejar entre un 5% y un 10% en restaurantes cuando la atención ha sido excelente.</li>
          <li><strong>México y América Latina:</strong> En México es estándar dejar entre el 10% y el 15% de propina en restaurantes con servicio a mesa. En locales de lujo se puede llegar al 18% o 20%.</li>
          <li><strong>Estados Unidos:</strong> Si viaja a EE.UU., la propina oscila entre el 15% y el 20% antes de impuestos.</li>
        </ul>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Cómo calcular la propina y dividir la cuenta fácilmente</h2>
        <p>Nuestra calculadora gratuita procesa el cálculo directamente en la memoria de su navegador sin enviar ningún dato a servidores externos. Introduzca el subtotal de la comida, seleccione el porcentaje deseado e indique el número de comensales para obtener la cifra exacta que debe aportar cada persona.</p>
        <p>Descubra también nuestras herramientas en inglés como <a href="/tip-calculator/" class="text-emerald-700 underline font-medium">Tip Calculator</a>, <a href="/restaurant-tip-calculator/" class="text-emerald-700 underline font-medium">Restaurant Tip Calculator</a> y <a href="/percentage-calculator/" class="text-emerald-700 underline font-medium">Percentage Calculator</a>.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Otras versiones en idiomas europeos</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>Alemán: <a href="/de/trinkgeld-rechner/" class="text-emerald-700 underline">Trinkgeld Rechner</a></li>
          <li>Francés: <a href="/fr/calculateur-de-pourboire/" class="text-emerald-700 underline">Calculateur de Pourboire</a></li>
          <li>Polaco: <a href="/pl/kalkulator-napiwkow/" class="text-emerald-700 underline">Kalkulator Napiwków</a></li>
          <li>Italiano: <a href="/it/calcolo-mance/" class="text-emerald-700 underline">Calcolo Mance</a></li>
          <li>Catálogo de herramientas: <a href="/tools/" class="text-emerald-700 underline">All Tools & Converters</a></li>
        </ul>
      </section>
    `,
  },

  // 3. French Tip Calculator
  {
    lang: 'fr',
    slug: 'calculateur-de-pourboire',
    baseToolSlug: 'tip-calculator',
    title: "Calculateur de Pourboire – Partager l'Addition en Ligne",
    description: "Calculateur de pourboire gratuit pour restaurant et bar. Calculez le montant du pourboire et divisez l'addition équitablement par personne au centime près.",
    h1: "Calculateur de Pourboire et Partage d'Addition",
    badge: 'Calculateur',
    alternates: toolAlternates['tip-calculator'],
    contentHtml: `
      <section class="prose max-w-none text-slate-700 space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Usage du pourboire en France, Belgique et Suisse</h2>
        <p>En France, la mention « service compris » (15%) est obligatoirement intégrée aux prix affichés sur la carte des cafés et restaurants. Laisser un pourboire supplémentaire reste un geste d'appréciation pour la qualité de l'accueil :</p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Bistrots et Brasseries :</strong> Il est coutumier d'arrondir à l'euro supérieur ou de laisser 1 à 2 euros pour un café ou déjeuner rapide.</li>
          <li><strong>Restaurants gastronomiques :</strong> Un pourboire de 5% à 10% du montant total est apprécié pour un service attentionné et irréprochable.</li>
          <li><strong>À l'international (Canada et USA) :</strong> Le pourboire n'est pas inclus et s'élève généralement à 15% ou 20% du montant hors taxes.</li>
        </ul>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Diviser l'addition sans calcul de tête complexe</h2>
        <p>Entrez simplement le montant de votre repas, ajustez le taux de pourboire et indiquez le nombre de personnes à table. Notre calculateur détermine instantanément la part exacte de chaque convive au centime d'euro près.</p>
        <p>Consultez nos autres outils pratiques : <a href="/tip-calculator/" class="text-emerald-700 underline font-medium">Tip Calculator</a>, <a href="/canadian-tip-calculator/" class="text-emerald-700 underline font-medium">Canadian Tip Calculator</a> et <a href="/percentage-calculator/" class="text-emerald-700 underline font-medium">Percentage Calculator</a>.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Disponibilité dans d'autres langues</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>Allemand : <a href="/de/trinkgeld-rechner/" class="text-emerald-700 underline">Trinkgeld Rechner</a></li>
          <li>Espagnol : <a href="/es/calculadora-de-propinas/" class="text-emerald-700 underline">Calculadora de Propinas</a></li>
          <li>Polonais : <a href="/pl/kalkulator-napiwkow/" class="text-emerald-700 underline">Kalkulator Napiwków</a></li>
          <li>Italien : <a href="/it/calcolo-mance/" class="text-emerald-700 underline">Calcolo Mance</a></li>
          <li>Tous les calculateurs : <a href="/calculators/" class="text-emerald-700 underline">Free Online Calculators</a></li>
        </ul>
      </section>
    `,
  },

  // 4. Polish Tip Calculator
  {
    lang: 'pl',
    slug: 'kalkulator-napiwkow',
    baseToolSlug: 'tip-calculator',
    title: 'Kalkulator Napiwków – Oblicz Napiwek i Podziel Rachunek',
    description: 'Darmowy kalkulator napiwków online. Oblicz kwotę napiwku w restauracji oraz podziel rachunek równo na liczbę osób z dokładnością do jednego grosza.',
    h1: 'Kalkulator Napiwków Restauracyjnych',
    badge: 'Kalkulator',
    alternates: toolAlternates['tip-calculator'],
    contentHtml: `
      <section class="prose max-w-none text-slate-700 space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Ile wynosi napiwek w polskich restauracjach?</h2>
        <p>W Polsce zwyczaj zostawiania napiwków jest powszechnie przyjęty jako wyraz uznania za profesjonalną obsługę kelnerską:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>10% wartości rachunku (standard):</strong> Najczęściej spotykana wysokość napiwku w polskich lokalach gastronomicznych przy satysfakcjonującej obsłudze.</li>
          <li><strong>15% do 20% (wyjątkowa obsługa):</strong> Zostawiane w eleganckich restauracjach lub przy obsłudze wymagających uroczystości i kolacji biznesowych.</li>
          <li><strong>Opłata serwisowa (serwis grupy):</strong> W przypadku grup liczących od 5–6 osób wiele lokali automatycznie dolicza 10% serwisu do rachunku końcowego.</li>
        </ul>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Szybkie dzielenie rachunku na osoby</h2>
        <p>Nasz darmowy kalkulator działa bezpośrednio w przeglądarce i natychmiast dzieli całą kwotę rachunku wraz z napiwkiem pomiędzy biesiadników z dokładnością do jednego grosza.</p>
        <p>Sprawdź również nasze wersje anglojęzyczne: <a href="/tip-calculator/" class="text-emerald-700 underline font-medium">Tip Calculator</a>, <a href="/restaurant-tip-calculator/" class="text-emerald-700 underline font-medium">Restaurant Tip Calculator</a> oraz <a href="/discount-calculator/" class="text-emerald-700 underline font-medium">Discount Calculator</a>.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Kalkulator w innych językach europejskich</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>Niemiecki: <a href="/de/trinkgeld-rechner/" class="text-emerald-700 underline">Trinkgeld Rechner</a></li>
          <li>Hiszpański: <a href="/es/calculadora-de-propinas/" class="text-emerald-700 underline">Calculadora de Propinas</a></li>
          <li>Francuski: <a href="/fr/calculateur-de-pourboire/" class="text-emerald-700 underline">Calculateur de Pourboire</a></li>
          <li>Włoski: <a href="/it/calcolo-mance/" class="text-emerald-700 underline">Calcolo Mance</a></li>
          <li>Katalog narzędzi: <a href="/tools/" class="text-emerald-700 underline">Wszystkie narzędzia online</a></li>
        </ul>
      </section>
    `,
  },

  // 5. Italian Tip Calculator
  {
    lang: 'it',
    slug: 'calcolo-mance',
    baseToolSlug: 'tip-calculator',
    title: 'Calcolo Mance Ristorante – Calcola Mancia e Dividi Conto',
    description: 'Calcolatore mance online gratuito per ristoranti. Calcola la percentuale di mancia ideale e dividi il conto tra i commensali con precisione al centesimo.',
    h1: 'Calcolo Mance per Ristorante e Bar',
    badge: 'Calcolatore',
    alternates: toolAlternates['tip-calculator'],
    contentHtml: `
      <section class="prose max-w-none text-slate-700 space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Come funziona la mancia in Italia nei ristoranti</h2>
        <p>In Italia la mancia non è formalmente obbligatoria, poiché il costo del personale è inserito nel prezzo delle pietanze e molti locali applicano la voce «coperto»:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Arrotondamento per eccesso:</strong> È consuetudine comune lasciare qualche moneta di resto al cameriere o arrotondare il totale all'euro superiore.</li>
          <li><strong>Mancia del 5% al 10%:</strong> In pizzerie e ristoranti di qualità, lasciare il 10% del totale è un gradito segnale di soddisfazione per il servizio ricevuto.</li>
          <li><strong>Viaggi all'estero:</strong> Se viaggiate nel Regno Unito o negli USA, ricordate che la mancia sale tipicamente al 15% o 20% del subtotale.</li>
        </ul>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Dividere il conto alla romana in pochi secondi</h2>
        <p>Inserite l'importo della cena, scegliete la percentuale di mancia desiderata e specificate il numero di commensali. Il nostro calcolatore visualizza all'istante la quota esatta dovuta da ciascun partecipante.</p>
        <p>Provate anche i nostri strumenti principali in lingua inglese: <a href="/tip-calculator/" class="text-emerald-700 underline font-medium">Tip Calculator</a>, <a href="/restaurant-tip-calculator/" class="text-emerald-700 underline font-medium">Restaurant Tip Calculator</a> e <a href="/percentage-calculator/" class="text-emerald-700 underline font-medium">Percentage Calculator</a>.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Versioni in altre lingue europee</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>Tedesco: <a href="/de/trinkgeld-rechner/" class="text-emerald-700 underline">Trinkgeld Rechner</a></li>
          <li>Spagnolo: <a href="/es/calculadora-de-propinas/" class="text-emerald-700 underline">Calculadora de Propinas</a></li>
          <li>Francese: <a href="/fr/calculateur-de-pourboire/" class="text-emerald-700 underline">Calculateur de Pourboire</a></li>
          <li>Polacco: <a href="/pl/kalkulator-napiwkow/" class="text-emerald-700 underline">Kalkulator Napiwków</a></li>
          <li>Elenco calcolatori: <a href="/calculators/" class="text-emerald-700 underline">Online Calculators</a></li>
        </ul>
      </section>
    `,
  },

  // 6. German HEIC to JPG
  {
    lang: 'de',
    slug: 'heic-in-jpg-umwandeln',
    baseToolSlug: 'heic-to-jpg',
    title: 'HEIC in JPG umwandeln – iPhone Fotos kostenlos konvertieren',
    description: 'Konvertieren Sie Apple HEIC Fotos direkt im Browser in universelles JPG Format. Ohne Upload, 100% datensicher, schnell und in voller Bildqualität.',
    h1: 'HEIC in JPG Konverter für iPhone & Mac',
    badge: 'Konverter',
    alternates: toolAlternates['heic-to-jpg'],
    contentHtml: `
      <section class="prose max-w-none text-slate-700 space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Warum speichert das iPhone Fotos als HEIC?</h2>
        <p>Seit iOS 11 speichert Apple Fotos standardmäßig im High Efficiency Image File Format (HEIC). Dieses Format spart gegenüber herkömmlichen JPEGs bis zu 50% Speicherplatz ein. Allerdings unterstützen ältere Windows-Versionen, Android-Geräte und Online-Formulare HEIC oft nicht nativ.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">HEIC Fotos ohne Server-Upload in JPG umwandeln</h2>
        <p>Mit unserem kostenlosen Online-Konverter wandeln Sie Ihre iPhone-Bilder direkt im Browser um:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>100% Privatsphäre:</strong> Ihre privaten Fotos werden nicht auf externe Server hochgeladen, sondern lokal im Gerätespeicher Ihres Browsers verarbeitet.</li>
          <li><strong>Hohe Bildqualität:</strong> Farbtiefe, Schärfe und Kontraste bleiben dank moderner WebAssembly-Decodierung vollständig erhalten.</li>
          <li><strong>Stapelverarbeitung:</strong> Ziehen Sie mehrere HEIC-Dateien gleichzeitig in das Tool, um sie gemeinsam zu konvertieren.</li>
        </ul>
        <p>Besuchen Sie auch unsere englischen Bildtools wie <a href="/heic-to-jpg/" class="text-emerald-700 underline font-medium">HEIC to JPG Converter</a>, <a href="/webp-to-jpg/" class="text-emerald-700 underline font-medium">WebP to JPG</a> und <a href="/image-compressor/" class="text-emerald-700 underline font-medium">Image Compressor</a>.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Verfügbare Sprachversionen</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>Spanisch: <a href="/es/convertir-heic-a-jpg/" class="text-emerald-700 underline">Convertir HEIC a JPG</a></li>
          <li>Französisch: <a href="/fr/convertir-heic-en-jpg/" class="text-emerald-700 underline">Convertir HEIC en JPG</a></li>
          <li>Polnisch: <a href="/pl/heic-na-jpg/" class="text-emerald-700 underline">Konwerter HEIC na JPG</a></li>
          <li>Italienisch: <a href="/it/convertire-heic-in-jpg/" class="text-emerald-700 underline">Convertire HEIC in JPG</a></li>
          <li>Alle Konverter: <a href="/tools/" class="text-emerald-700 underline">Alle Online-Tools</a></li>
        </ul>
      </section>
    `,
  },

  // 7. Spanish HEIC to JPG
  {
    lang: 'es',
    slug: 'convertir-heic-a-jpg',
    baseToolSlug: 'heic-to-jpg',
    title: 'Convertir HEIC a JPG – Fotos de iPhone a JPEG Gratis',
    description: 'Convierta fotos HEIC de iPhone a JPG en su navegador gratis. Sin subir archivos a servidores externos, seguro, rápido y manteniendo la calidad original.',
    h1: 'Convertidor de Fotos HEIC a JPG Online',
    badge: 'Convertidor',
    alternates: toolAlternates['heic-to-jpg'],
    contentHtml: `
      <section class="prose max-w-none text-slate-700 space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">¿Por qué el iPhone guarda las fotos en formato HEIC?</h2>
        <p>Apple utiliza el formato HEIC (High Efficiency Image Container) para reducir el tamaño de las fotografías a la mitad sin perder resolución óptica. No obstante, Windows y muchos sitios web exigen archivos JPEG universales para adjuntar documentos o solicitar visas.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Ventajas de convertir HEIC a JPG con ZixTool</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Procesamiento en memoria local:</strong> Sus fotos nunca salen de su ordenador o teléfono móvil. Cero transferencias a servidores ajenos.</li>
          <li><strong>Conversión por lotes:</strong> Seleccione múltiples fotos HEIC al mismo tiempo y descárguelas en segundos en formato JPG estándar.</li>
          <li><strong>Sin registro:</strong> Sin suscripciones ni marcas de agua en sus imágenes personales.</li>
        </ul>
        <p>Explore también nuestras herramientas complementarias en inglés: <a href="/heic-to-jpg/" class="text-emerald-700 underline font-medium">HEIC to JPG Converter</a>, <a href="/png-to-jpg/" class="text-emerald-700 underline font-medium">PNG to JPG</a> y <a href="/passport-photo-resizer/" class="text-emerald-700 underline font-medium">Passport Photo Resizer</a>.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Otras versiones en idiomas de Europa</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>Alemán: <a href="/de/heic-in-jpg-umwandeln/" class="text-emerald-700 underline">HEIC in JPG umwandeln</a></li>
          <li>Francés: <a href="/fr/convertir-heic-en-jpg/" class="text-emerald-700 underline">Convertir HEIC en JPG</a></li>
          <li>Polaco: <a href="/pl/heic-na-jpg/" class="text-emerald-700 underline">HEIC na JPG</a></li>
          <li>Italiano: <a href="/it/convertire-heic-in-jpg/" class="text-emerald-700 underline">Convertire HEIC in JPG</a></li>
          <li>Directorio general: <a href="/tools/" class="text-emerald-700 underline">Todos los conversores</a></li>
        </ul>
      </section>
    `,
  },

  // 8. French HEIC to JPG
  {
    lang: 'fr',
    slug: 'convertir-heic-en-jpg',
    baseToolSlug: 'heic-to-jpg',
    title: 'Convertir HEIC en JPG – Photos iPhone en JPEG Gratuit',
    description: 'Convertissez gratuitement vos photos iPhone HEIC en JPG dans votre navigateur. Traitement local sans upload, respect total de la vie privée et haute qualité.',
    h1: 'Convertisseur HEIC en JPG Gratuit en Ligne',
    badge: 'Convertisseur',
    alternates: toolAlternates['heic-to-jpg'],
    contentHtml: `
      <section class="prose max-w-none text-slate-700 space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Pourquoi convertir une photo HEIC d'iPhone en JPG ?</h2>
        <p>Depuis la mise à jour iOS 11, Apple enregistre automatiquement les clichés au format HEIC afin de préserver l'espace de stockage. Cependant, de nombreux logiciels sur PC Windows, plateformes administratives et sites e-commerce refusent d'ouvrir les images sous cette extension.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Conversion locale et confidentielle en 3 secondes</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Confidentialité absolue :</strong> Aucune photo n'est transférée vers le cloud. Tout le traitement d'encodage JPEG s'exécute directement dans la mémoire de votre navigateur.</li>
          <li><strong>Traitement par lot :</strong> Glissez plusieurs fichiers HEIC simultanément pour une conversion instantanée et sans perte visible de détails.</li>
          <li><strong>Compatibilité universelle :</strong> Les fichiers JPG obtenus s'ouvrent sans problème sur tous les téléviseurs, ordinateurs et smartphones.</li>
        </ul>
        <p>Découvrez nos outils en anglais : <a href="/heic-to-jpg/" class="text-emerald-700 underline font-medium">HEIC to JPG Converter</a>, <a href="/webp-to-jpg/" class="text-emerald-700 underline font-medium">WebP to JPG</a> et <a href="/compress-image-to-200kb/" class="text-emerald-700 underline font-medium">Compress Image to 200KB</a>.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Versions disponibles dans d'autres langues</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>Allemand : <a href="/de/heic-in-jpg-umwandeln/" class="text-emerald-700 underline">HEIC in JPG umwandeln</a></li>
          <li>Espagnol : <a href="/es/convertir-heic-a-jpg/" class="text-emerald-700 underline">Convertir HEIC a JPG</a></li>
          <li>Polonais : <a href="/pl/heic-na-jpg/" class="text-emerald-700 underline">HEIC na JPG</a></li>
          <li>Italien : <a href="/it/convertire-heic-in-jpg/" class="text-emerald-700 underline">Convertire HEIC in JPG</a></li>
          <li>Catalogue complet : <a href="/tools/" class="text-emerald-700 underline">Tous les outils en ligne</a></li>
        </ul>
      </section>
    `,
  },

  // 9. Polish HEIC to JPG
  {
    lang: 'pl',
    slug: 'heic-na-jpg',
    baseToolSlug: 'heic-to-jpg',
    title: 'Konwerter HEIC na JPG – Zdjęcia iPhone do JPEG za Darmo',
    description: 'Darmowa konwersja zdjęć HEIC z iPhone do formatu JPG online. Przetwarzanie bezpośrednio w przeglądarce bez wysyłania plików na serwer, szybko i bezpiecznie.',
    h1: 'Konwerter Plików HEIC na JPG z iPhone',
    badge: 'Konwerter',
    alternates: toolAlternates['heic-to-jpg'],
    contentHtml: `
      <section class="prose max-w-none text-slate-700 space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Dlaczego zdjęcia z iPhone zapisują się jako HEIC?</h2>
        <p>Urządzenia Apple (iPhone oraz iPad) stosują format HEIC, aby zmniejszyć wagę plików graficznych przy zachowaniu doskonałej ostrości. Niestety, systemy Windows oraz polskie portale rekrutacyjne i urzędowe wymagają uniwersalnego formatu JPG/JPEG.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Bezpieczna konwersja zdjęć w pamięci przeglądarki</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>100% prywatności:</strong> Twoje osobiste fotografie i dokumenty nie są wysyłane na żaden zewnętrzny serwer. Cały proces zachodzi lokalnie na Twoim urządzeniu.</li>
          <li><strong>Konwersja wsadowa:</strong> Możesz przeciągnąć kilkadziesiąt zdjęć naraz i przekonwertować je w kilka chwil.</li>
          <li><strong>Oryginalna jakość:</strong> Konwersja zachowuje rozdzielczość i wyrazistość barw z aparatu fotograficznego.</li>
        </ul>
        <p>Poznaj również nasze główne narzędzia anglojęzyczne: <a href="/heic-to-jpg/" class="text-emerald-700 underline font-medium">HEIC to JPG Converter</a>, <a href="/png-to-jpg/" class="text-emerald-700 underline font-medium">PNG to JPG</a> oraz <a href="/image-compressor/" class="text-emerald-700 underline font-medium">Image Compressor</a>.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Inne wersje językowe konwertera</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>Niemiecki: <a href="/de/heic-in-jpg-umwandeln/" class="text-emerald-700 underline">HEIC in JPG umwandeln</a></li>
          <li>Hiszpański: <a href="/es/convertir-heic-a-jpg/" class="text-emerald-700 underline">Convertir HEIC a JPG</a></li>
          <li>Francuski: <a href="/fr/convertir-heic-en-jpg/" class="text-emerald-700 underline">Convertir HEIC en JPG</a></li>
          <li>Włoski: <a href="/it/convertire-heic-in-jpg/" class="text-emerald-700 underline">Convertire HEIC in JPG</a></li>
          <li>Katalog narzędzi: <a href="/tools/" class="text-emerald-700 underline">Wszystkie narzędzia</a></li>
        </ul>
      </section>
    `,
  },

  // 10. Italian HEIC to JPG
  {
    lang: 'it',
    slug: 'convertire-heic-in-jpg',
    baseToolSlug: 'heic-to-jpg',
    title: 'Convertire HEIC in JPG – Foto iPhone in JPEG Gratis Online',
    description: 'Converti foto HEIC di iPhone in formato JPG direttamente nel browser gratis. Nessun caricamento su server, massima privacy e qualità fotografica intatta.',
    h1: 'Convertitore HEIC in JPG per iPhone e Mac',
    badge: 'Convertitore',
    alternates: toolAlternates['heic-to-jpg'],
    contentHtml: `
      <section class="prose max-w-none text-slate-700 space-y-6">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Perché i dispositivi Apple usano il formato HEIC?</h2>
        <p>A partire da iOS 11, Apple ha introdotto lo standard HEIC per dimezzare lo spazio occupato dalle fotografie rispetto al classico JPEG. Tuttavia, molti programmi Windows e portali web di concorsi pubblici non supportano direttamente questo tipo di file.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Convertire file HEIC in JPG con totale riservatezza</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Sicurezza totale:</strong> Le vostre immagini private non vengono mai caricate su server remoti; la decodifica e la conversione avvengono direttamente nella memoria RAM del browser.</li>
          <li><strong>Conversione multipla simultanea:</strong> Trascinate diverse immagini HEIC in una sola volta per trasformarle in JPEG pronte all'uso.</li>
          <li><strong>Qualità visiva fedele:</strong> Conserva colori, luminosità e dettagli nitidi senza degradazione percettibile.</li>
        </ul>
        <p>Esplora anche gli strumenti in inglese correlati: <a href="/heic-to-jpg/" class="text-emerald-700 underline font-medium">HEIC to JPG Converter</a>, <a href="/webp-to-jpg/" class="text-emerald-700 underline font-medium">WebP to JPG</a> e <a href="/image-compressor/" class="text-emerald-700 underline font-medium">Image Compressor</a>.</p>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Versioni in altre lingue europee</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>Tedesco: <a href="/de/heic-in-jpg-umwandeln/" class="text-emerald-700 underline">HEIC in JPG umwandeln</a></li>
          <li>Spagnolo: <a href="/es/convertir-heic-a-jpg/" class="text-emerald-700 underline">Convertir HEIC a JPG</a></li>
          <li>Francese: <a href="/fr/convertir-heic-en-jpg/" class="text-emerald-700 underline">Convertir HEIC en JPG</a></li>
          <li>Polacco: <a href="/pl/heic-na-jpg/" class="text-emerald-700 underline">HEIC na JPG</a></li>
          <li>Indice strumenti: <a href="/tools/" class="text-emerald-700 underline">Tutti gli strumenti online</a></li>
        </ul>
      </section>
    `,
  },
];
