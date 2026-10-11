#!/usr/bin/env python3
# 緑バック生成画像 → 透過PNG（idle.png / portrait.png）を一括生成
import glob,os
from PIL import Image,ImageFilter
A='/home/box/agent-data/agents/537fe244-9941-4f38-8672-30ddc4a3309c/assets/'
M={'tenshu':('dee3cb85',0),'deshi':('335b7901',1),'banchou':('b329f71c',0),'tuber':('c4d09387',0),'lotbreaker':('7c55ef03',0),
   'butafarmer':('96f11df0',1),'youtuber':('4e8f0fa8',0),'nyinvestor':('e686295d',1),'shisho':('cad98f35',1)}
W,H=384,384
CX={'tenshu':.42,'deshi':.42,'banchou':.47,'tuber':.42,'lotbreaker':.47,'butafarmer':.4,'youtuber':.36,'nyinvestor':.42,'shisho':.45}
def key(im):
  im=im.convert('RGBA');px=im.load();w,h=im.size
  for y in range(h):
    for x in range(w):
      r,g,b,a=px[x,y]
      if g>90 and g-max(r,b)>45: px[x,y]=(0,0,0,0)
      elif g>max(r,b)+8: px[x,y]=(r,max(r,b)+4,b,255)   # 緑かぶり除去
  al=im.split()[3].filter(ImageFilter.MinFilter(3))
  # 孤立ノイズ除去：小さすぎる不透明点を消す
  im.putalpha(al.point(lambda v:255 if v>128 else 0));return im
for cid,(p,flip) in M.items():
  im=key(Image.open(glob.glob(A+p+'*')[0]))
  if flip: im=im.transpose(Image.FLIP_LEFT_RIGHT)
  bb=im.getbbox();im=im.crop(bb)
  s=(H*0.96)/im.height
  if im.width*s>W: s=W/im.width
  sp=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
  out=Image.new('RGBA',(W,H),(0,0,0,0));out.paste(sp,((W-sp.width)//2,H-sp.height),sp)
  d=f'public/assets/chars/{cid}';os.makedirs(d,exist_ok=True);out.save(d+'/idle.png')
  # 顔ポートレート：上部22%の不透明画素の重心を中心に正方形
  top=im.crop((0,0,im.width,int(im.height*.22)));a=top.split()[3];xs=[x for x in range(top.width) for y in range(0,top.height,4) if a.getpixel((x,y))]
  cx=int(im.width*CX[cid]);side=int(im.height*.30);x0=max(0,min(im.width-side,cx-side//2))
  pt=im.crop((x0,0,x0+side,side)).resize((256,256),Image.LANCZOS);bg=Image.new('RGBA',(256,256),(0,0,0,0));bg.paste(pt,(0,0),pt);bg.save(d+'/portrait.png')
  print(cid,'flip' if flip else '', sp.size)
