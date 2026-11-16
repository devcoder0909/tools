import os
import glob
import re

SVG_DIR = 'public/images/tools'

SPECIFIC_METADATA = {
    'emi-calculator-infographic.svg': (
        'Loan Amortization Matrix & Reducing Balance EMI Calculation Infographic',
        'Visual chart explaining loan amortization, monthly reducing interest, and principal repayment schedule.'
    ),
    'compound-interest-growth.svg': (
        'Compound Interest Future Value & Exponential Wealth Curve Infographic',
        'Visual comparison of linear principal accumulation vs exponential compound interest returns across different compounding frequencies.'
    ),
    'sip-compounding-wealth.svg': (
        'Systematic Investment Plan (SIP) Compounding Wealth Multiplier Chart',
        'Visual breakdown of monthly SIP investments, rupee cost averaging, and long-term corpus milestones.'
    ),
    'percentage-calculator-formulas.svg': (
        'Percentage Calculation Formulas & Mathematical Matrix Infographic',
        'Visual reference matrix for calculating percentage of a number, percentage change, and proportions.'
    ),
    'json-formatter-structure.svg': (
        'RFC 8259 JSON Syntax Tree & Node Hierarchy Infographic',
        'Visual breakdown of JSON syntax tree, object key-value pairs, nested arrays, and data validation rules.'
    ),
    'base64-encoding-matrix.svg': (
        'RFC 4648 Base64 6-Bit Encoding Architecture Matrix Infographic',
        'Diagram illustrating ASCII 8-bit octet splitting into 6-bit Radix-64 indices and padding characters.'
    ),
    'qr-code-anatomy-infographic.svg': (
        'ISO/IEC 18004 QR Code Matrix Anatomy Infographic',
        'Visual anatomy diagram showing finder patterns, timing tracks, alignment markers, and Reed-Solomon data blocks.'
    ),
    'password-entropy-infographic.svg': (
        'Cryptographic Password Entropy & Brute-Force Crack Time Matrix',
        'Chart illustrating logarithmic Shannon entropy and estimated brute-force crack resistance across character sets.'
    ),
    'png-vs-jpg-comparison.svg': (
        'PNG vs JPG Image Format Technical Comparison Infographic',
        'Detailed comparison matrix between lossless PNG with alpha transparency and lossy DCT compressed JPEG.'
    ),
    'pdf-security-infographic.svg': (
        'Client-Side PDF Security & In-Memory Privacy Architecture',
        'Diagram illustrating zero server uploads, local browser RAM processing, and instant document destruction.'
    )
}

def clean_title_from_slug(slug: str) -> str:
    # convert slug to title
    words = slug.split('-')
    return ' '.join(w.capitalize() for w in words)

def optimize_svg(file_path: str):
    filename = os.path.basename(file_path)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Determine title and desc
    if filename in SPECIFIC_METADATA:
        title, desc = SPECIFIC_METADATA[filename]
    elif filename.endswith('-video-thumb.svg'):
        base_slug = filename.replace('-video-thumb.svg', '')
        base_name = clean_title_from_slug(base_slug)
        title = f'{base_name} Step-by-Step Video Tutorial Demonstration Poster'
        desc = f'Video demonstration and interactive walkthrough for {base_name} online with zero server uploads and instant processing.'
    elif filename.endswith('-workflow.svg'):
        base_slug = filename.replace('-workflow.svg', '')
        base_name = clean_title_from_slug(base_slug)
        title = f'{base_name} Client-Side Architecture & Process Flow Diagram'
        desc = f'Technical flowchart illustrating the 100% in-browser RAM conversion and processing pipeline for {base_name}.'
    else:
        base_slug = filename.replace('.svg', '')
        base_name = clean_title_from_slug(base_slug)
        title = f'{base_name} Infographic Diagram'
        desc = f'Visual architecture and technical reference guide for {base_name}.'

    # Ensure role="img" and aria attributes
    svg_tag_match = re.search(r'<svg([^>]*)>', content)
    if not svg_tag_match:
        return

    attrs = svg_tag_match.group(1)
    if 'role=' not in attrs:
        attrs += ' role="img"'
    title_id = 'svg-title-' + re.sub(r'[^a-zA-Z0-9]', '-', filename)
    desc_id = 'svg-desc-' + re.sub(r'[^a-zA-Z0-9]', '-', filename)

    if 'aria-labelledby=' not in attrs:
        attrs += f' aria-labelledby="{title_id} {desc_id}"'

    new_svg_tag = f'<svg{attrs}>'
    content = content[:svg_tag_match.start()] + new_svg_tag + content[svg_tag_match.end():]

    # Remove any existing title / desc if present
    content = re.sub(r'<title[^>]*>.*?</title>', '', content, flags=re.DOTALL)
    content = re.sub(r'<desc[^>]*>.*?</desc>', '', content, flags=re.DOTALL)

    # Insert <title> and <desc> right after opening <svg...> tag
    svg_end_pos = content.find('>') + 1
    insert_block = f'\n  <title id="{title_id}">{title}</title>\n  <desc id="{desc_id}">{desc}</desc>'
    content = content[:svg_end_pos] + insert_block + content[svg_end_pos:]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Optimized {filename}: "{title}"')

def main():
    svg_files = glob.glob(os.path.join(SVG_DIR, '*.svg'))
    print(f'Found {len(svg_files)} SVG files to optimize...')
    for svg_file in svg_files:
        optimize_svg(svg_file)
    print('All SVG files successfully enriched with semantic title, description, and accessibility attributes!')

if __name__ == '__main__':
    main()
