"""
safety-shoes.png に焼き付いた「安全靴」の緑文字を黄色で塗り潰すユーティリティ。

分布実測に基づく領域定義(992x1086 画像):
  - 緑の十字:      y=400-500, x=500-600
  - 緑のアール(J): y=500-600, x=100-300(左つま先)
  - 「安全靴」文字: y=520-640, x=350-750

文字のみを塗り潰すには x>=350 AND y>=520 の緑ピクセルを対象にする。
アンチエイリアス境界は 2px 膨張。
"""
import sys
import numpy as np
from PIL import Image

Y_TEXT_START = 520   # 文字領域開始 y
X_TEXT_START = 350   # 文字領域開始 x(緑アールを保護)
GREEN_DIFF = 30
YELLOW = np.array([251, 227, 5, 255], dtype=np.uint8)

def main(path):
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    h, w = arr.shape[:2]
    r = arr[:, :, 0].astype(int)
    g = arr[:, :, 1].astype(int)
    b = arr[:, :, 2].astype(int)
    a = arr[:, :, 3]

    # 緑ピクセル(文字+十字+アール)
    is_green = (g - r > GREEN_DIFF) & (g - b > GREEN_DIFF) & (a > 0)
    # 文字領域のみ(十字=上部 と 緑アール=左つま先 は保持)
    text_mask = is_green.copy()
    text_mask[:Y_TEXT_START, :] = False       # 上部の十字は保持
    text_mask[:, :X_TEXT_START] = False        # 左つま先の緑アールは保持

    # アンチエイリアス境界も塗り込むため、text_mask を半径 2 で膨張
    # (簡易実装: シフト OR)
    dilated = text_mask.copy()
    for dy in (-2, -1, 1, 2):
        for dx in (-2, -1, 1, 2):
            src = text_mask
            sl_src_y = slice(max(0, -dy), h if dy >= 0 else h + dy)
            sl_dst_y = slice(max(0, dy), h if dy <= 0 else h - dy) if dy > 0 else slice(max(0, dy), h + dy if dy < 0 else h)
            # 単純な絶対座標スライディング
            # ここは簡単のため numpy roll で代用(端が回り込むが今回は端ではないので OK)
    # 単純化: np.pad + スライディング
    pad = 2
    padded = np.pad(text_mask, pad, mode="constant", constant_values=False)
    dilated = np.zeros_like(text_mask)
    for dy in range(-pad, pad + 1):
        for dx in range(-pad, pad + 1):
            dilated |= padded[pad + dy : pad + dy + h, pad + dx : pad + dx + w]
    # dilated のうち、そもそも alpha>0(被写体内)で、かつ Y_TEXT_START 以降のみに限定
    in_shoe = a > 0
    final_mask = dilated & in_shoe
    final_mask[:Y_TEXT_START] = False

    print(f"{path}: size=({w},{h})")
    print(f"  文字緑ピクセル: {text_mask.sum()}")
    print(f"  膨張後(アンチエイリアス含む): {final_mask.sum()}")

    # 黄色で塗り潰し
    arr[final_mask] = YELLOW
    Image.fromarray(arr).save(path)
    print(f"  saved: {path}")

if __name__ == "__main__":
    for p in sys.argv[1:]:
        main(p)
