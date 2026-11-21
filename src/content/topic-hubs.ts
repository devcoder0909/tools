export const topicHubs = [
  {
    slug: 'image-compression-tools', title: 'Image Compression Tools and File Size Guide',
    description: 'Compare image compression tools for common KB and MB limits, and learn how file size, image quality and dimensions affect uploads.',
    intro: 'Choose an image compressor based on the upload limit you need to meet. A size limit describes the number of bytes in the file; it does not specify its width, height, or visual quality.',
    sections: [
      { title: 'Choose a target file size', text: 'When a form specifies a maximum, choose the closest target below that limit. The 20 KB and 50 KB tools suit particularly restrictive forms; 100 KB, 200 KB, 500 KB, and 1 MB targets give photographs more room for detail. A maximum is not the same as a required size: check whether the receiving service also specifies a minimum.' },
      { title: 'Balance image quality and dimensions', text: 'Compression and resizing solve different problems. If a portal specifies both pixels and bytes, first adjust the dimensions, then compress the resulting image and check both requirements again. More aggressive compression can introduce visible artifacts, especially around text and fine edges. Keep the original so you can try again if the result is unacceptable.' },
      { title: 'Check the finished file', text: 'Confirm the actual file format, file size, and pixel dimensions before uploading. JPEG is often suitable for photos, while images with transparency may need a format that preserves it. Destination websites set their own rules, so a successful download does not guarantee that a particular upload will be accepted.' },
    ],
    tools: ['image-compressor','photo-compressor','jpg-compressor','compress-image-to-20kb','compress-image-to-50kb','compress-image-to-100kb','compress-image-to-200kb','compress-image-to-500kb','compress-image-to-1mb','resize-image'],
    guide: 'image-upload-requirements',
  },
  {
    slug: 'json-csv-tools', title: 'JSON and CSV Tools: Format and Convert Data',
    description: 'Find JSON formatter, JSON to CSV and CSV to JSON tools, with practical checks for nested data, headers and spreadsheet imports.',
    intro: 'Choose a tool based on whether you need to inspect JSON, convert records into a table, or turn a CSV table into structured JSON data.',
    sections: [
      { title: 'Format JSON for inspection', text: 'A JSON formatter makes nested objects and arrays easier to read by adding indentation. Formatting changes the presentation of valid data, not its meaning. If the input fails validation, inspect commas, quotation marks and brackets before trying again. Keep the source available so you can compare the result.' },
      { title: 'Convert JSON to CSV', text: 'CSV is a row-and-column format. It works best when JSON contains an array of records with consistent fields. Nested objects, arrays, missing fields and mixed value types need special attention because a flat table may not represent them as expected. Inspect the exported headers and compare several records with the source before importing.' },
      { title: 'Convert CSV to JSON safely', text: 'Check the header row, delimiter, quoted commas and line breaks in the original CSV. Spreadsheet applications may interpret identifiers, leading zeroes and dates differently from plain text. After conversion, compare the number of records and check representative values, including empty fields. Retain the original until the receiving application confirms the import.' },
    ],
    tools: ['json-formatter','json-to-csv','csv-to-json','diff-checker'],
    guide: 'json-to-csv-data-checklist',
  },
];
