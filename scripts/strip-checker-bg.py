"""
PNG の市松模様(グレー)背景を透明化するユーティリティ。

画像の四隅から flood-fill で「明るいグレー系の連続領域」を透明にする。
中央の被写体(ヘルメット黄色・安全靴グレー)は連続性で保護される。

使い方:
    python scripts/strip-checker-bg.py public/images/safety-shoes.png
    python scripts/strip-checker-bg.py --strict public/images/helmet.png

    --strict: 被写体に明るいグレーが含まれない画像(ヘルメットなど)向け。
              edge flood fill 後、画像全体に残った 明るいグレー のピクセルも一括透明化する。
              閉じた領域(顎ひも内側など)まできれいに抜ける。
"""
import sys
from PIL import Image
from collections import deque

# 市松背景: 明るいグレー全般(R≈G≈B かつ明るい)
# 基準色との厳密マッチではなく「グレースケール+十分な明るさ」なら背景と判定する。
BG_MIN_BRIGHTNESS = 200  # 被写体(黒・濃い色)は守る
BG_GREY_TOL = 18         # R-G, G-B の差がこの範囲内ならグレー扱い

def is_bg_color(c, ref_colors):
    """c (r,g,b) が 市松模様らしい明るいグレー なら背景と判定"""
    r, g, b = int(c[0]), int(c[1]), int(c[2])
    # 十分に明るい
    if min(r, g, b) < BG_MIN_BRIGHTNESS:
        return False
    # R≈G≈B (グレースケール)
    if abs(r - g) > BG_GREY_TOL or abs(g - b) > BG_GREY_TOL or abs(r - b) > BG_GREY_TOL:
        return False
    return True

def strip_bg(path, strict=False):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()

    # 四隅の色を基準色として収集
    corners = [px[0, 0], px[w-1, 0], px[0, h-1], px[w-1, h-1]]
    ref = [(c[0], c[1], c[2]) for c in corners]
    print(f"{path}: size=({w},{h}), 基準色(四隅)={ref}")

    # BFS flood-fill from all edges
    visited = [[False] * w for _ in range(h)]
    queue = deque()
    # 縁の全ピクセルをシード
    for x in range(w):
        for y in (0, h-1):
            if not visited[y][x] and is_bg_color(px[x, y], ref):
                queue.append((x, y))
                visited[y][x] = True
    for y in range(h):
        for x in (0, w-1):
            if not visited[y][x] and is_bg_color(px[x, y], ref):
                queue.append((x, y))
                visited[y][x] = True

    # 4方向拡張
    count = 0
    while queue:
        x, y = queue.popleft()
        px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)  # alpha=0 に
        count += 1
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                if is_bg_color(px[nx, ny], ref):
                    visited[ny][nx] = True
                    queue.append((nx, ny))

    print(f"  [pass1] edge flood-fill 透明化: {count} ({100*count/(w*h):.1f}%)")

    # strict モード: 画像全体をスキャンして残った「明るいグレー」を無条件に透明化
    # (顎ひも内側など閉じた領域も抜ける。被写体に明るいグレーが含まれる画像では使わない)
    if strict:
        extra = 0
        for y in range(h):
            for x in range(w):
                p = px[x, y]
                if p[3] != 0 and is_bg_color(p, ref):
                    px[x, y] = (p[0], p[1], p[2], 0)
                    extra += 1
        print(f"  [pass2 strict] 閉領域の残グレーも透明化: +{extra} ({100*extra/(w*h):.1f}%)")

    im.save(path)
    print(f"  saved: {path}")

if __name__ == "__main__":
    args = sys.argv[1:]
    strict = "--strict" in args
    paths = [a for a in args if not a.startswith("--")]
    for p in paths:
        strip_bg(p, strict=strict)
