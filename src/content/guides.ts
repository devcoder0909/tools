export interface SearchGuide {
  slug: string;
  title: string;
  description: string;
  answer: string;
  updated: string;
  tools: string[];
  sections: { id: string; title: string; body: string }[];
  sources: { name: string; url: string }[];
}

export const searchGuides: SearchGuide[] = [
  {
    slug: 'image-upload-requirements',
    title: 'Image Upload Requirements: Photo & KB Guide',
    description: 'Fix image upload requirements and rejected photo errors. Check KB limits, pixel dimensions, and format rules with our practical troubleshooting guide.',
    answer: 'A photo can meet a KB limit and still be rejected. Check the actual file format, width and height, byte size, and any crop or background rules separately. Change only the property that fails the destination’s instructions.',
    updated: '2026-11-19',
    tools: ['image-compressor', 'photo-compressor', 'passport-photo-resizer', 'resize-image', 'compress-image-to-20kb', 'compress-image-to-50kb', 'compress-image-to-100kb', 'compress-image-to-200kb', 'compress-image-to-500kb', 'compress-image-to-1mb', 'png-to-jpg', 'heic-to-jpg'],
    sections: [
      { id: 'read-the-error', title: 'Start with the requirement that failed', body: `Keep the original photo and read the error message before trying another export. Meeting strict **image upload requirements** means understanding why “unsupported file type”, “image too large”, and “incorrect dimensions” describe completely different problems. Repeated compression will not fix all three.


Write down the accepted extensions, maximum bytes or KB, required pixel dimensions, and any minimum size. If the page asks for a specific crop, background, or recent photograph, treat that as a separate requirement. Requirements vary by issuing authority and application; do not rely on a generic “passport size” preset as proof of acceptance.

For example, suppose a portal asks for JPEG, 600 by 600 pixels, and less than 200KB. A 150KB PNG still has the wrong format. A 150KB JPEG measuring 1200 by 800 has the wrong dimensions. A correctly sized square JPEG weighing 250KB needs compression. This checklist separates those cases so you can choose one appropriate tool.` },
      { id: 'bytes-and-pixels', title: 'File size in KB is different from dimensions in pixels', body: `Pixels describe the width and height of the decoded picture. Bytes describe the stored file. Two images with identical dimensions can have very different file sizes because their content, format, and compression settings differ.

Check the exact byte count where your file manager or tool exposes it. A label of 200KB may mean 200,000 bytes or 204,800 bytes, depending on the software. A rounded display can hide a file that is slightly over the portal’s limit. When the unit is ambiguous, aim comfortably below the limit and follow the portal’s actual acceptance result.

Use [Resize Image](/resize-image/) when width or height is the problem. Use the [image compressor](/image-compressor/) when the dimensions are acceptable but the file is too large. If both fail, crop or resize first, then compress the resulting image once. Repeatedly saving the same JPEG can introduce more visible artifacts.` },
      { id: 'format', title: 'Convert the image instead of renaming the extension', body: `Renaming a PNG or HEIC file to end in .jpg does not encode it as JPEG. A site may inspect the file contents rather than trusting the filename. Use [PNG to JPG](/png-to-jpg/) for PNG originals or [HEIC to JPG](/heic-to-jpg/) for supported iPhone photo files, then open the downloaded result.

JPEG does not preserve transparent pixels. If you convert a transparent signature or logo, inspect its background and edges. PNG is useful when transparency is required and permitted, but a portal that accepts only JPEG still needs a genuine JPEG output. The destination’s accepted format takes priority over a general recommendation to choose the smallest format.

Do not assume changing format will make a file smaller. A compact graphic may grow when converted, and JPEG cannot restore detail already missing from a blurry original. Compare the saved result rather than relying on a promised reduction percentage.` },
      { id: 'choose-limit', title: 'Choose the compressor for your stated upload limit', body: `Use the limit written on the form rather than guessing from the type of document. The [20KB compressor](/compress-image-to-20kb/) is useful for a particularly small allowance, while [50KB](/compress-image-to-50kb/), [100KB](/compress-image-to-100kb/), and [200KB](/compress-image-to-200kb/) tools cover other common size targets. These are preset workflows, not guarantees that a particular institution will accept a photo.

After downloading, inspect eyes, signature strokes, and small text at the intended viewing size. If they become blocky, return to the original. Check whether the required dimensions leave room for a smaller image without violating the rules. A technically small enough image is not useful if the reviewer cannot read it.

For a photo with an exact crop requirement, the [passport photo resizer](/passport-photo-resizer/) may help prepare the shape. Always compare against the current destination instructions before submission.` },
      { id: 'final-check', title: 'Verify the final download before retrying', body: `Open the downloaded file, not an older copy still selected in the upload control. Check its name, extension, actual size, orientation, and dimensions. Save a clearly named working copy so it is easy to distinguish from the original.

If the file passes those checks but upload still fails, confirm the page accepts your browser, that the application session has not expired, and that the connection is working. Retry with one file if the form supports only one attachment. A server error or expired session cannot be solved by compressing a photo further.

Keep the original until the application confirms submission. If the instructions request PDF instead of an image, read the [PDF upload size guide](/guides/pdf-file-size-limits/) before converting: putting a large image into a PDF does not automatically make it smaller.` },
    ],
    sources: [
      { name: 'MDN: file and Blob sizes are measured in bytes', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Blob/size' },
      { name: 'MDN: image formats and transparency', url: 'https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types' },
    ],
  },
  {
    slug: 'pdf-file-size-limits',
    title: 'PDF File Size Limits: How to Fix Failed Uploads',
    description: 'Learn how to fix PDF file size limits when document uploads fail. Compare scanned and text files, compress photos, and verify document legibility.',
    answer: 'A PDF’s size depends on its contents. Scanned pages often need image recompression; rewriting PDF object streams alone may make little difference. Start from the source document when possible, then verify size, readability, and page order.',
    updated: '2026-11-19',
    tools: ['merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'jpg-to-pdf', 'png-to-pdf', 'heic-to-pdf'],
    sections: [
      { id: 'identify-pdf', title: 'Identify what makes the document large', body: `When dealing with strict **PDF file size limits**, identifying what makes the document large is the essential first step. Try selecting a sentence in your PDF viewer. If you can select individual words, the document may contain text objects. If selecting text is impossible and each page behaves like one picture, it may be a scan. Some PDFs contain both text and images, and an OCR layer can make scanned text selectable, so use this as a clue rather than a complete diagnosis.

Look for high-resolution photos, unnecessary pages, repeated scans, or attachments. A short document with detailed full-page images can be larger than a much longer text-only report. Page count alone is therefore a poor way to predict the final file size.

Keep the original document before trying any rewrite. If you have the word-processing or presentation source, exporting again with appropriate image settings usually gives more control than repeatedly processing an existing PDF.` },
      { id: 'compression-limits', title: 'Why a PDF compressor may not reach 200KB or 500KB', body: `Different PDF optimizers change different parts of a document. Structural optimization rewrites how PDF objects are stored. Image recompression changes embedded pictures. Removing pages changes the content itself. These operations are not interchangeable, and a small result cannot be promised without knowing the source.

The current [ZixTool PDF compressor](/compress-pdf/) saves the document with object streams through pdf-lib. That can reduce some structural overhead, but it does not implement a scan-resolution slider, image resampling, or an exact-byte search. A scanned PDF can remain almost the same size, and some files may grow after rewriting.

If the destination asks for a maximum of 200KB, verify the downloaded file rather than treating the compressor’s name as a guarantee. Do not pad a file to hit an exact number unless the receiving system specifically requires a minimum. A maximum normally means staying below the limit.` },
      { id: 'prepare-source', title: 'Prepare images before making a new PDF', body: `If your source is a set of photos, prepare copies at the resolution needed for legibility before assembling them. Crop unused borders, check orientation, and choose a level of compression that keeps fine text readable. Use the [image compressor](/image-compressor/) for JPEG or WebP preparation and [Resize Image](/resize-image/) when the source dimensions are unnecessarily large.

Create the document with [JPG to PDF](/jpg-to-pdf/) or [PNG to PDF](/png-to-pdf/) as appropriate. Inspect the output after conversion. A file-size limit applying to the complete PDF is different from a limit on each source image; several individually small photos can still exceed the combined allowance.

For an existing PDF with pages the recipient does not need, [Split PDF](/split-pdf/) can help extract an allowed subset. Do this only when the submission instructions permit it. Missing pages may make an application incomplete even if the smaller file uploads successfully.` },
      { id: 'preserve-document', title: 'Check document integrity after processing', body: `Open the final PDF and compare the page count with the source. Check the first and last page, any signatures, fine print, and diagrams. Zoom in far enough to detect missing strokes or unreadable labels, then return to normal viewing size to judge usability.

If you combined several documents with [Merge PDF](/merge-pdf/), confirm their order. If pages face the wrong way, use [Rotate PDF](/rotate-pdf/) and inspect again. Page rotation and merging do not automatically improve scan quality or make text searchable.

Preserve electronically signed originals. Rewriting a document can affect signature validation, forms, annotations, or other features even when the visible pages appear unchanged. For an official submission, check the recipient’s requirements for signed documents instead of assuming a rewritten copy is equivalent.` },
      { id: 'upload-check', title: 'Separate a size problem from an upload problem', body: `Check that the destination accepts PDF and that you selected the newest saved copy. Read whether the stated size applies per attachment or to all attachments combined. If it displays bytes, compare that count directly; if it rounds to KB or MB, leave a margin below the maximum.

If a document is below the limit but still fails, read the full error. Password protection, an expired session, or an unsupported filename can require a different remedy. Do not remove document protection without permission from its owner. If the form instead requires an image attachment, follow the [image upload requirements checklist](/guides/image-upload-requirements/).

For a file that cannot become small enough while retaining required detail, ask the receiving organization whether it accepts multiple attachments or another submission channel. Destroying readability to satisfy a byte limit is not a successful conversion.` },
    ],
    sources: [
      { name: 'pdf-lib: document save options', url: 'https://pdf-lib.js.org/docs/api/interfaces/saveoptions' },
      { name: 'pdf-lib: supported document operations', url: 'https://pdf-lib.js.org/' },
    ],
  },
  {
    slug: 'json-to-csv-data-checklist',
    title: 'JSON to CSV Data Checklist: Spreadsheets & Nested Keys',
    description: 'Follow our JSON to CSV data checklist to convert nested objects into spreadsheet columns without data loss, formatting corruption, or missing keys.',
    answer: 'Before converting JSON to CSV, decide what each row represents and how nested values should become columns. Validate the JSON, preserve identifiers as text, then compare row counts and representative values after importing the CSV.',
    updated: '2026-11-19',
    tools: ['json-formatter', 'json-to-csv', 'csv-to-json', 'diff-checker', 'base64-encoder', 'url-encoder-decoder'],
    sections: [
      { id: 'choose-rows', title: 'Decide what one spreadsheet row represents', body: `Following a structured **JSON to CSV data checklist** ensures that tabular conversion proceeds cleanly without field truncation. A useful CSV has a clear row definition: one customer, one order, one measurement, or another consistent record. JSON can represent nested structures, while a CSV spreadsheet is a sequence of rows and fields. Decide how to map the data before exporting it.

For example, an order object may contain a customer and three line items. You could use one row per order and keep the line items together, or use three rows with the order ID repeated. Both choices can be valid, but they answer different questions. A converter cannot infer the correct business meaning from the braces alone.

Use [JSON Formatter](/json-formatter/) to inspect the structure. An array of similarly shaped objects is a useful starting point for [JSON to CSV](/json-to-csv/). If the response wraps the array in a property such as data or results, select that array deliberately rather than exporting the entire response envelope.` },
      { id: 'nested-fields', title: 'Nested objects need an explicit mapping', body: `Suppose a record contains customer.name and customer.address.city. A flat table might use columns named customer_name and city. If an array represents multiple events, you need a decision about extra rows, separate tables, or storing that array as text in one cell.

The current ZixTool JSON-to-CSV converter uses top-level object keys as headers and serializes nested objects into cell text. It does not automatically expand nested properties into separate columns. Prepare a flat array before using it when your import system expects one scalar value per column.

Check records that have missing keys, null values, or additional fields. An empty cell may not mean the same thing as zero, false, or the literal text null. Make those distinctions in your preparation step and keep a copy of the original JSON so that you can check any ambiguous output later.` },
      { id: 'quotes-delimiters', title: 'Check delimiters, commas and quoted text', body: `A comma inside a value is data, not necessarily a new column. CSV conventions use quoting to distinguish such values; embedded quote characters require escaping. Values can also contain line breaks. Avoid splitting CSV on every comma or newline without respecting quoted fields.

Test with a representative value such as a name containing a comma and a note containing quotation marks. Select the same delimiter in the converter and your spreadsheet import dialog. If the whole row appears in one column, a delimiter mismatch is one possible cause.

When using [CSV to JSON](/csv-to-json/), inspect the output before relying on it for complex multiline records. Keep the first test small enough to compare manually. A successful parse is not proof that every field retained its original meaning.` },
      { id: 'ids-types', title: 'Preserve IDs, dates and large numbers', body: `An identifier such as 00123 is often text, even if it contains only digits. Spreadsheet software may remove leading zeros or interpret certain strings as dates. Import identifier columns as text where your spreadsheet supports that setting and compare their values afterward.

Large integer identifiers need attention before conversion too. JavaScript’s ordinary numeric parsing cannot exactly represent every possible integer. Keep identifiers as JSON strings if exact character preservation matters; turning an already-rounded number back into text cannot restore missing digits.

Inspect any imported data that begins with formula-like characters before opening an untrusted CSV in a spreadsheet. Decide how your receiving application should treat those values. This checklist is about preserving data, not establishing that an arbitrary file is safe or valid for a particular database schema.` },
      { id: 'verify-output', title: 'Compare the result with the source', body: `Count records before export and rows after import, allowing for a header row. Compare at least one simple record and one record with missing, nested, quoted, or unusual values. Verify that every expected column is present and in the order required by the receiving system.

Use [Diff Checker](/diff-checker/) to compare small text samples when helpful, but remember that field reordering or whitespace changes can produce differences without changing meaning. For an API import, validate the required fields and types against that API’s documented schema separately.

Do not paste access tokens or unnecessary personal data into examples you intend to share. Keep your original export until the destination confirms a successful import. If you are troubleshooting a rejected file attachment rather than its data contents, the [upload requirements guide](/guides/image-upload-requirements/) explains the distinction between format and file-size failures.` },
    ],
    sources: [
      { name: 'RFC 8259: JSON data interchange format', url: 'https://www.rfc-editor.org/rfc/rfc8259' },
      { name: 'RFC 4180: common CSV format conventions', url: 'https://www.rfc-editor.org/rfc/rfc4180' },
    ],
  },
  {
    slug: 'restaurant-tipping-and-bill-splitting',
    title: 'Restaurant Tipping and Bill Splitting Guide: Etiquette & Math',
    description: 'Master restaurant tipping etiquette, pre-tax gratuity math, and fair bill splitting for groups. Learn standard tip percentages and avoid double-tipping.',
    answer: 'Calculate tips on the pre-tax food subtotal using standard percentages (15% standard, 18% good, 20% exceptional). For groups, check for auto-gratuity before adding a tip, and split total cost evenly unless alcohol or orders vary substantially.',
    updated: '2026-11-21',
    tools: ['tip-calculator', 'percentage-calculator', 'discount-calculator'],
    sections: [
      {
        id: 'pre-tax-standard',
        title: 'Always calculate gratuity on the pre-tax food subtotal',
        body: `When dining out, calculating gratuity on the correct baseline figure prevents overpaying while treating service staff fairly. Standard etiquette rules established by hospitality associations and etiquette authorities advise tipping on the **pre-tax subtotal** of food and beverage services. Sales tax is an obligatory municipal or state levy assessed by the government, not hospitality work performed by your server.

Modern touchscreen point-of-sale terminals (such as Toast, Square, and Clover) frequently default their preset tip options ($18\%$, $20\%$, $25\%$) against the post-tax grand total. In metropolitan dining destinations where municipal sales taxes, hospitality fees, and liquor surcharges combine to exceed $10\%$, tipping on the post-tax sum increases your effective tip rate by an extra $2\%$ to $3\%$.

To verify your tip baseline, locate the itemized line labeled *Subtotal* or *Food & Beverage* on your paper check. Use our free [Tip Calculator](/tip-calculator/) to compute exact pre-tax gratuities, or turn to our [Percentage Calculator](/percentage-calculator/) when calculating promotional percentages or non-standard dining discounts.`
      },
      {
        id: 'standard-percentages',
        title: 'Standard gratuity benchmarks by dining setting',
        body: `Tipping expectations vary across service formats. While tipping remains voluntary in legal terms across North America, waitstaff in tipped occupations earn statutory sub-minimum base wages and rely on gratuities to earn a living wage:

1. **Sit-Down Table Service:** $15\%$ represents standard baseline service, $18\%$ indicates attentive, prompt dining care, and $20\%$ to $25\%$ rewards exceptional hospitality, complex table maintenance, or fine dining course pacing.
2. **Buffet Dining:** $10\%$ is customary when waitstaff clear plates, refill beverage carafes, and deliver bread baskets.
3. **Food Delivery Couriers:** $15\%$ to $20\%$ of the food subtotal, with a minimum tip of $3.00 to $5.00 for inclement weather, long distances, or high-floor apartment deliveries.
4. **Bartenders & Taprooms:** $1.00 to $2.00 per draft beer or glass of wine, and $2.00 to $3.00 (or $18\%$ to $20\%$ of the open tab) for handcrafted craft cocktails.
5. **Takeout & Counter Service:** Tipping on counter pickup orders is entirely optional. Leaving loose change or $5\%$ to $10\%$ for large, intricate party orders shows courteous appreciation to back-of-house staging crews.

If you are tracking promotional shopping savings or calculating coupon markdowns alongside your dining budget, our [Discount Calculator](/discount-calculator/) and full catalog of [online calculators](/calculators/) provide fast mathematical validation.`
      },
      {
        id: 'mental-math-methods',
        title: 'Fast mental math shortcuts to compute tips without a phone',
        body: `You do not need a smartphone or calculator app to determine exact restaurant gratuities at the table. Three simple mental arithmetic tricks make tipping quick:

- **The 10% Foundation Rule:** Shift the decimal point one position to the left. On an $\$84.00$ dining check, $10\%$ is immediately $\$8.40$.
- **Doubling for 20% (Great Hospitality):** Multiply your $10\%$ number by $2$. For an $\$84.00$ subtotal, $\$8.40 \\times 2 = \\$16.80$.
- **Splitting the Difference for 15% (Standard Care):** Take your $10\%$ baseline ($\$8.40$), cut it in half ($\$4.20$), and add both pieces together ($\$8.40 + \\$4.20 = \\$12.60$).
- **The $18\%$ Shortcut:** Calculate $20\%$ first, then deduct approximately one-tenth of that figure (for $\$84.00$, take $\$16.80 - \\$1.70 \\approx \\$15.10$).

Our browser-based [tip calculator](/tip-calculator/) automates this arithmetic to the exact cent, with options to round totals up to the nearest whole dollar so cash settlements and digital peer-to-peer transfers remain clean.`
      },
      {
        id: 'group-splitting',
        title: 'Fair bill splitting rules: equal division vs itemized checks',
        body: `Splitting restaurant checks among group diners can create social awkwardness if expectations are not aligned early in the meal. Follow these practical etiquette guidelines:

- **Equal Per-Person Splits:** Dividing the grand total equally works best when all dining guests ordered meals of comparable value (such as family-style dining, shared tapas, or similar entrees). Entering your guest count into our [Tip Calculator](/tip-calculator/) splits both the meal subtotal and gratuity evenly in one click.
- **Itemized Splits for Unequal Tabs:** If one guest ordered multiple premium cocktails and expensive appetizers while another ordered a single salad and iced water, equal division forces light diners to subsidize heavy spenders. In these scenarios, ask the server for separate itemized checks at the start of service, or have each companion calculate their meal plus $20\%$ tip on their individual subtotal.
- **Rounding for Peer-to-Peer Transfers:** When paying via Venmo, Zelle, or Cash App, rounding per-person shares up to the nearest dollar avoids awkward cent transactions and leaves an extra dollar of appreciation for dining staff.

Explore our comprehensive [tools directory](/tools/) for additional productivity and math utilities.`
      },
      {
        id: 'auto-gratuity-service-charges',
        title: 'Examine receipts for auto-gratuity before leaving a tip',
        body: `One of the most frequent tipping mistakes is paying gratuity twice on large party tabs. Many restaurants automatically apply an **automatic gratuity** (typically $18\%$ or $20\%$, designated on the receipt as *Auto-Gratuity*, *Service Charge*, or *Large Party Fee*) on tables of 5, 6, or more guests.

Before writing a figure on the *Tip* or *Gratuity* line of your credit card slip, carefully inspect every line item above the total:
1. If an automatic gratuity is already included in the printed balance, adding an additional $20\%$ results in a $40\%$ total tip.
2. If service was truly outstanding and you wish to reward the team further, you can add a supplemental tip on the *Additional Tip* line, but doing so should be a conscious choice.
3. If an obligatory service fee is charged by the restaurant, check whether the receipt notes that service charges are retained by management rather than distributed to waitstaff. In jurisdictions where service charges do not go to servers, you may choose to leave a modest direct cash tip for your server.

For broader technical workflows, explore our [image upload guide](/guides/image-upload-requirements/), [PDF size guide](/guides/pdf-file-size-limits/), or [JSON to CSV checklist](/guides/json-to-csv-data-checklist/).`
      }
    ],
    sources: [
      { name: 'Emily Post Institute: General Dining & Tipping Etiquette', url: 'https://emilypost.com/advice/general-tipping-guide' },
      { name: 'Cornell Center for Hospitality Research: Restaurant Tipping Analysis', url: 'https://www.hotelschool.cornell.edu/research/chr/' }
    ]
  },
  {
    slug: 'gta-6-pc-system-requirements-and-hardware-guide',
    title: 'GTA 6 PC Specs & Storage Guide: Hardware Calculator',
    description: 'Check estimated GTA 6 PC requirements, storage GB needs, 4K ultrawide aspect ratios, and gameplay clip compression with our practical hardware guide.',
    answer: 'Grand Theft Auto VI demands upwards of 200GB NVMe SSD storage space based on current-generation console installations. While official PC specifications remain unannounced by Rockstar Games, 4K resolution and ray tracing require high VRAM and modern multi-threaded processors. Use our resolution and video compression calculators to plan display setups and share gameplay clips within web upload limits.',
    updated: '2026-11-22',
    tools: [
      'aspect-ratio-calculator',
      'video-compressor',
      'screen-recorder',
      'image-compressor',
      'resize-image',
      'photo-compressor',
      'online-calculator',
      'diff-checker'
    ],
    sections: [
      {
        id: 'storage-requirements',
        title: 'GTA 6 storage footprint: why 200GB+ NVMe SSD space is mandatory',
        body: `Following official launch specifications on current-generation PlayStation 5 and Xbox Series X|S consoles, **Grand Theft Auto VI requires between 212 GB and 223 GB of initial storage installation space**. When a PC version arrives, the storage footprint is expected to match or exceed this threshold due to uncompressed 4K texture packages, extensive audio localization, and dynamic world cache files.

Mechanical hard disk drives (HDDs) and legacy SATA SSDs capped at 500 MB/s transfer speeds will cause severe asset streaming bottlenecks, resulting in blurred mipmaps and visible texture pop-in across sprawling Vice City and Leonida highways. High-speed DirectStorage PCIe Gen 4 or Gen 5 NVMe SSDs with sequential read velocities exceeding 5,000 MB/s will be practically mandatory to support high-speed vehicle navigation and rapid interior-exterior transitions.

When partitioning your storage drive, calculate an additional $20\%$ to $25\%$ of free headroom beyond the base game package. Operating systems require scratch space for shader compilation caches, virtual memory paging files, and cumulative Day One patch downloads. Preparing a dedicated 250 GB to 300 GB NVMe volume ensures smooth performance without mid-game disk exhaustion. You can calculate remaining drive allowances and gigabyte-to-megabyte conversions directly with our [Online Calculator](/online-calculator/) and explore related utilities in our [tools directory](/tools/).`
      },
      {
        id: 'estimated-pc-specs',
        title: 'Target hardware tiers: minimum, recommended, and 4K ultra specs',
        body: `Because Rockstar Games has not published official PC system requirements, building or upgrading a gaming setup requires benchmarking against current-generation console hardware architectures and modern open-world graphics engines. The following target specifications represent realistic engineering targets for stable desktop performance:

| Specification Tier | Target Performance | Recommended Processor (CPU) | Graphics Card (GPU) | Minimum VRAM | System RAM |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Minimum** | 1080p @ 30-45 FPS (Dynamic, Low-Med) | AMD Ryzen 5 5600 / Intel Core i5-12400 | GeForce RTX 3060 / Radeon RX 6600 XT | 8 GB GDDR6 | 16 GB DDR4 |
| **Recommended** | 1440p @ 60 FPS (High Settings, DLSS/FSR) | AMD Ryzen 7 7800X3D / Intel Core i7-13700K | GeForce RTX 4070 Super / Radeon RX 7800 XT | 12 GB GDDR6X | 32 GB DDR5 |
| **4K Ultra Ray Tracing** | 4K UHD (2160p) @ 60+ FPS (Max Quality) | AMD Ryzen 9 9900X / Intel Core i9-14900K | GeForce RTX 4080 / RTX 4090 / RX 7900 XTX | 16 GB - 24 GB | 32 GB - 64 GB |

The most critical bottleneck for next-generation open-world titles is video memory (VRAM). Complex ambient occlusion, ray-traced reflections on coastal waterways, and high-density volumetric weather simulations fill memory pools rapidly. While 8 GB GPUs can run baseline configurations, cards equipped with 12 GB to 16 GB of VRAM prevent micro-stutters caused by texture swapping into system memory. If you are comparing PC configuration text files or command-line graphics arguments, use our [Diff Checker](/diff-checker/) to audit setting changes.`
      },
      {
        id: 'aspect-ratio-resolutions',
        title: 'Resolution and aspect ratio: 4K UHD, 1440p, and ultrawide 21:9',
        body: `Display resolution and aspect ratio directly govern field of view (FOV), immersion, and graphics rendering workload. Standard 16:9 displays remain the industry benchmark, but panoramic ultrawide setups offer competitive peripheral vision advantages across dense urban intersections:

- **Standard 16:9 Widescreen:** $1920 \\times 1080$ (1080p FHD), $2560 \\times 1440$ (1440p QHD), and $3840 \\times 2160$ (4K UHD). Native 4K pushes $8,294,400$ total pixels per frame, requiring aggressive GPU upscaling such as DLSS or FSR to maintain high refresh rates.
- **Ultrawide 21:9 Displays:** $2560 \\times 1080$ (UW-FHD), $3440 \\times 1440$ (UW-QHD), and $5120 \\times 2160$ (5K2K). Ultrawide displays expand horizontal viewing space by $33\\%$, offering wider cockpit views and expansive horizon visibility without distortion.
- **Super Ultrawide 32:9 Displays:** $5120 \\times 1440$ (Dual QHD) and $7680 \\times 2160$ (Dual 4K). These setups simulate a seamless two-monitor curve, demanding exceptional GPU rasterization throughput.

When configuring multi-monitor simulators or custom windowed aspect ratios, calculating exact pixel scaling prevents black bar letterboxing and distorted user interface HUDs. Compute precise display dimensions and pixel densities with our [Aspect Ratio Calculator](/aspect-ratio-calculator/) and adjust promotional image assets using [Resize Image](/resize-image/).`
      },
      {
        id: 'compress-gameplay-clips',
        title: 'Sharing gameplay clips: compressing 4K 60fps video for Discord and web',
        body: `Modern graphics cards record uncompressed 4K 60fps gameplay clips at high bitrates (ranging from 40 Mbps to 80 Mbps), producing raw files that consume between 300 MB and 600 MB per minute of footage. Online community channels enforce strict upload limits: Discord provides a 10MB free upload ceiling (or 25MB with select boosts), while messaging platforms like WhatsApp cap video sharing at 16MB.

To share a high-definition mission clip or stunt highlight without paying for cloud storage or uploading sensitive footage to remote conversion servers, use client-side target size compression. The mathematical formula for video bit budgeting is:

$$\\text{Target Video Bitrate (kbps)} = \\left( \\frac{\\text{Target Size in MB} \\times 8192}{\\text{Clip Duration in Seconds}} \\right) - \\text{Audio Bitrate (64 kbps)}$$

For example, compressing a 30-second Vice City driving clip to meet Discord’s 10MB limit requires setting an average bitrate of approximately $2666\\text{ kbps}$ ($10 \\times 8192 / 30 - 64$). Our browser-based [Video Compressor](/video-compressor/) runs this calculation automatically, encoding your clip in your local browser memory using hardware-accelerated codecs with zero server uploads. If you need to record short walkthroughs or browser-based gameplay streams directly on your device, use our [Screen Recorder](/screen-recorder/).`
      },
      {
        id: 'wallpaper-and-asset-optimization',
        title: 'Exporting 4K Vice City wallpapers and screenshots without quality loss',
        body: `Promotional wallpapers and in-game photo-mode captures from Vice City showcase vibrant tropical neon palettes, detailed vehicle chrome reflections, and atmospheric volumetric fog. However, uncompressed 4K PNG files frequently range between 25 MB and 45 MB per screenshot, making them unsuitable for web publishing, forum avatars, or mobile lockscreens.

To preserve maximum visual fidelity while reducing file weights by $75\\%$ to $85\\%$, follow a structured asset workflow:

1. **Format Conversion:** Convert lossless PNG captures to modern high-efficiency WebP or high-quality JPEG using [PNG to JPG](/png-to-jpg/) or [JPG to WebP](/jpg-to-webp/). WebP retains fine neon gradients without introducing blocky DCT quantization artifacts.
2. **Target File Size Reduction:** Use our [Image Compressor](/image-compressor/) or dedicated [Photo Compressor](/photo-compressor/) to dial in specific size targets (such as under 2MB for ultra-fast web loading) while keeping high dynamic range color contrast intact.
3. **Custom Cropping for Mobile:** When turning landscape desktop captures into vertical smartphone wallpapers (such as 9:16 aspect ratio $1080 \\times 1920$ or $1440 \\times 3120$), crop focal characters using our [Crop Image](/crop-image/) tool or format headshots with the [Passport Photo Resizer](/passport-photo-resizer/).

All image optimizations execute entirely within your client browser RAM, ensuring your unreleased game screenshots and media remain 100% private. For additional conversion needs, explore our complete list of [image compression tools by file size](/topics/image-compression-tools/).`
      }
    ],
    sources: [
      { name: 'Rockstar Games: Official Installation and Console Specifications', url: 'https://support.rockstargames.com/' },
      { name: 'VESA: DisplayPort and Ultrawide Display Specifications', url: 'https://vesa.org/' },
      { name: 'MDN Web Docs: MediaStream Recording & Hardware Video Codecs', url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API' }
    ]
  },
  {
    slug: 'gta-6-video-and-screenshot-optimization-guide',
    title: 'GTA 6 Video & Screenshot Guide: 4K Clips & Discord',
    description: 'Learn how to compress 4K 60fps GTA 6 gameplay clips for Discord 10MB limits, calculate video bitrates, and export lossless 4K Vice City wallpapers.',
    answer: 'High-definition 4K 60fps Grand Theft Auto VI gameplay recordings generate 400MB to 600MB per minute of footage, exceeding Discord and WhatsApp file upload caps. By calculating targeted video bitrates and downsampling uncompressed 4K PNG screenshots into high-efficiency WebP or JPEG files, creators can share sharp Vice City media instantly without cloud server uploads.',
    updated: '2026-11-22',
    tools: [
      'video-compressor',
      'aspect-ratio-calculator',
      'screen-recorder',
      'image-compressor',
      'photo-compressor',
      'png-to-jpg',
      'jpg-to-webp',
      'crop-image'
    ],
    sections: [
      {
        id: 'bitrate-math',
        title: 'Video bitrate mathematics for Discord and messaging limits',
        body: `Recording gameplay at native $3840 \\times 2160$ resolution at $60\\text{ FPS}$ with high dynamic range produces massive video streams. Popular messaging and gaming community channels enforce strict payload ceilings:
- **Discord Free Standard:** 10 MB per file attachment.
- **Discord Nitro Basic:** 50 MB per file attachment.
- **WhatsApp Mobile Messaging:** 16 MB video sharing ceiling.
- **X (formerly Twitter) & Web Forums:** 512 MB, with severe automated server recompression that crushes fine details.

To hit an exact upload ceiling without arbitrary trial and error, determine your target video bitrate using mathematical duration budgeting:

$$\\text{Target Video Bitrate (kbps)} = \\left( \\frac{\\text{Maximum File Size (MB)} \\times 8192}{\\text{Clip Length (Seconds)}} \\right) - \\text{Audio Bitrate (64 kbps)}$$

For example, compressing a 45-second stunt sequence for a 10MB Discord channel requires targeting:
$$\\text{Bitrate} = \\left( \\frac{10 \\times 8192}{45} \\right) - 64 = 1820 - 64 = 1756\\text{ kbps}$$

Entering this threshold into our client-side [Video Compressor](/video-compressor/) forces the encoder to compress within your exact allowance while maintaining synchronized audio. If you want to capture live gameplay commentary without watermarks, record directly with our [Screen Recorder](/screen-recorder/).`
      },
      {
        id: 'resolution-downsampling',
        title: 'Downsampling 4K gameplay to 1080p and 1440p for crisp playback',
        body: `Encoding native 4K footage down to 10MB often results in macroblocking and smeared motion during fast vehicle chases. Downsampling spatial dimensions from 4K ($3840 \\times 2160$) to 1080p ($1920 \\times 1080$) or 1440p ($2560 \\times 1440$) increases bits per pixel, yielding noticeably crisper clarity on mobile screens.

1. **Calculate Output Pixel Density:** Maintaining standard 16:9 widescreen or 21:9 ultrawide geometry prevents stretched character models. Use our [Aspect Ratio Calculator](/aspect-ratio-calculator/) to verify proportionate scaling before encoding.
2. **Preserve Color Contrast:** In Vice City night sequences, high-contrast neon illumination can cause color banding if bitrate is starved. Downscaling to 1080p allows the encoder to allocate higher bit depth to vibrant pink and cyan highlights.
3. **Format Selection:** Modern browsers support WebM (VP8/VP9) and MP4 (H.264). WebM typically delivers superior compression efficiency at sub-2000 kbps bitrates, while MP4 offers universal playback on older mobile devices.`
      },
      {
        id: 'lossless-screenshot-compression',
        title: 'Compressing 4K Vice City screenshots from 40MB to under 2MB',
        body: `Capturing photo-mode stills in Vice City produces uncompressed 24-bit PNG images weighing between 25 MB and 45 MB each. While PNG provides lossless fidelity, hosting services and social feeds reject files exceeding standard 5MB or 10MB image upload caps.

To reduce file sizes by over $85\\%$ while retaining crisp palm tree silhouettes, vehicle paint reflections, and character facial details:
- **Convert PNG to WebP or JPEG:** Run raw screenshots through our [PNG to JPG](/png-to-jpg/) or [JPG to WebP](/jpg-to-webp/) converters. Modern WebP encoding eliminates color banding across sky gradients while dropping file size to under 3 MB.
- **Target Exact Kilobyte Ceilings:** When uploading to portals with rigid size gates, use our [Image Compressor](/image-compressor/) or [Photo Compressor](/photo-compressor/) to dial in specific size limits without server processing.`
      },
      {
        id: 'mobile-lockscreen-wallpapers',
        title: 'Formatting ultrawide captures into vertical 9:16 phone wallpapers',
        body: `Horizontal gameplay captures look stunning on desktop monitors, but converting them into vertical smartphone lockscreens (such as $1080 \\times 1920$ or $1440 \\times 3120$) requires careful compositional cropping rather than anamorphic stretching.

- **Focal Framing:** Center the protagonist or vehicle while cropping peripheral road geometry.
- **Aspect Scaling:** Use our [Crop Image](/crop-image/) tool or [Passport Photo Resizer](/passport-photo-resizer/) to set exact vertical aspect bounds.
- **Inspect on Device:** After cropping, test lockscreen clock placement to ensure UI elements do not obscure the primary subject.`
      },
      {
        id: 'in-browser-privacy',
        title: 'Why zero-upload browser processing protects unreleased media',
        body: `Creators, reviewers, and competitive players frequently handle embargoed gameplay recordings, private server captures, and custom graphics benchmarks. Cloud-based conversion platforms upload user videos to remote server queues, creating leakage risks and bandwidth bottlenecks.

ZixTool executes all video compression, image transcoding, and calculations directly inside your client browser RAM via HTML5 Canvas, WebCodecs, and WebAssembly. No media bytes ever leave your device. Review our complete [privacy architecture](/privacy-explained/) to understand how client-side isolation protects your content.`
      }
    ],
    sources: [
      { name: 'Discord Developer Documentation: Attachment Size Limits', url: 'https://discord.com/developers/docs/reference' },
      { name: 'WhatsApp Help Center: Media File Size Standards', url: 'https://faq.whatsapp.com/' },
      { name: 'W3C WebCodecs Specification', url: 'https://www.w3.org/TR/webcodecs/' }
    ]
  }
];

export function getGuidesForTool(slug: string) {
  return searchGuides.filter(guide => guide.tools.includes(slug));
}
