import base64
from PIL import Image

im = Image.open('public/images/brand/icon.png')
im256 = im.resize((256, 256), Image.Resampling.LANCZOS)
im256.save('public/images/brand/icon-256.png', 'PNG')

with open('public/images/brand/icon-256.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img">
  <title>BestConverter by GudMud</title>
  <image href="data:image/png;base64,{b64}" x="0" y="0" width="256" height="256" />
</svg>
'''
with open('public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('Updated public/favicon.svg successfully.')
