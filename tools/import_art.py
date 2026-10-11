#!/usr/bin/env python3
"""生成画像(緑バック)→透過PNG化して public/assets/chars/<id>/<pose>.png に配置。
使い方: python3 tools/import_art.py <入力画像> <id> <pose>   (pose: portrait|idle|attack|special|...)
全身スプライトは 256x384 キャンバスに足元下端・中央揃えで統一スケール。portrait は 256x256。"""
import sys,os
from PIL import Image,ImageFilter
src,cid,pose=sys.argv[1:4]
im=Image.open(src).convert('RGBA');px=im.load();w,h=im.size
for y in range(h):
  for x in range(w):
    r,g,b,a=px[x,y]
    if g>140 and g>r*1.4 and g>b*1.4: px[x,y]=(0,0,0,0)
    elif g>r and g>b and g-max(r,b)>30: px[x,y]=(r,max(r,b),b,a)  # 緑フリンジ除去
al=im.split()[3].filter(ImageFilter.MinFilter(3));im.putalpha(al)
bb=im.getbbox();im=im.crop(bb)
W,H=(256,256) if pose=='portrait' else (256,384)
s=min(W/im.width,(H*0.97)/im.height);im=im.resize((max(1,int(im.width*s)),max(1,int(im.height*s))),Image.NEAREST)
out=Image.new('RGBA',(W,H),(0,0,0,0));out.paste(im,((W-im.width)//2,(H-im.height)//2 if pose=='portrait' else H-im.height),im)
d=f'public/assets/chars/{cid}';os.makedirs(d,exist_ok=True);out.save(f'{d}/{pose}.png');print('saved',f'{d}/{pose}.png')
