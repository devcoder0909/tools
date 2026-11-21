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
];

export function getGuidesForTool(slug: string) {
  return searchGuides.filter(guide => guide.tools.includes(slug));
}
