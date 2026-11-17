#!/usr/bin/env python3
"""
Generate a professional, branded 1200x630 OpenGraph (OG) image for Gudmud Convert
featuring the official "BestConverter by GudMud" logo and clean trust badges.
"""
import os
from PIL import Image, ImageDraw, ImageFont

def generate_og():
    width, height = 1200, 630
    img = Image.new('RGB', (width, height), color='#0f172a')
    draw = ImageDraw.Draw(img)

    # Deep slate gradient background
    for y in range(height):
        t = y / height
        r = int(15 * (1 - t) + 8 * t)
        g = int(23 * (1 - t) + 60 * t)
        b = int(42 * (1 - t) + 40 * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # White inner card
    card_box = [80, 60, 1120, 570]
    draw.rounded_rectangle(card_box, radius=20, fill=(255, 255, 255), outline=(229, 231, 235), width=2)

    # Load logo
    logo_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'brand', 'logo.png')
    logo = Image.open(logo_path)
    logo_w, logo_h = logo.size
    target_h = 130
    target_w = int(logo_w * (target_h / logo_h))
    logo_resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    logo_x = (width - target_w) // 2
    logo_y = 120
    img.paste(logo_resized, (logo_x, logo_y), logo_resized)

    # Font loading
    try:
        font_title = ImageFont.truetype('arial.ttf', 36)
        font_sub = ImageFont.truetype('arial.ttf', 22)
        font_badge = ImageFont.truetype('arialbd.ttf', 18)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_badge = ImageFont.load_default()

    # Tagline text
    title_text = 'Private In-Browser File Converters & Image Tools'
    bbox_t = draw.textbbox((0, 0), title_text, font=font_title)
    t_w = bbox_t[2] - bbox_t[0]
    draw.text(((width - t_w) // 2, 280), title_text, fill=(30, 41, 59), font=font_title)

    desc_text = 'Fast, secure, 100% client-side conversions. Files never leave your browser.'
    bbox_d = draw.textbbox((0, 0), desc_text, font=font_sub)
    d_w = bbox_d[2] - bbox_d[0]
    draw.text(((width - d_w) // 2, 335), desc_text, fill=(100, 116, 139), font=font_sub)

    # Badges pill at bottom
    badges = ['Client-Side Processing', 'Zero Cloud Uploads', 'Private In-Browser', 'Lossless Quality']
    badge_y = 420
    pill_padding_x = 20
    pill_height = 42
    gap = 16

    pills_info = []
    for b in badges:
        b_box = draw.textbbox((0, 0), b, font=font_badge)
        pw = (b_box[2] - b_box[0]) + pill_padding_x * 2
        pills_info.append((b, pw))

    total_pills_w = sum(p[1] for p in pills_info) + gap * (len(badges) - 1)
    cur_x = (width - total_pills_w) // 2

    for b, pw in pills_info:
        draw.rounded_rectangle([cur_x, badge_y, cur_x + pw, badge_y + pill_height], radius=21, fill=(240, 253, 244), outline=(187, 247, 208), width=1)
        b_box = draw.textbbox((0, 0), b, font=font_badge)
        text_w = b_box[2] - b_box[0]
        draw.text((cur_x + (pw - text_w) // 2, badge_y + 11), b, fill=(22, 101, 52), font=font_badge)
        cur_x += pw + gap

    out_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'og-image.png')
    img.save(out_path, 'PNG', optimize=True)
    print(f'[OG] Generated {out_path} ({os.path.getsize(out_path)} bytes)')

if __name__ == '__main__':
    generate_og()
