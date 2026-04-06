# -*- coding: utf-8 -*-
"""キオスク画面遷移図 PDF（ワイヤーフレーム付き・全8パターン）"""

from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os, math

# ─── フォント ──────────────────────────────────────────────
for name, file in [("MeiryoBd","meiryob.ttc"),("Meiryo","meiryo.ttc")]:
    p = os.path.join("C:/Windows/Fonts", file)
    if os.path.exists(p):
        try: pdfmetrics.registerFont(TTFont(name, p, subfontIndex=0))
        except: pass
FB = "MeiryoBd" if "MeiryoBd" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"
FR = "Meiryo" if "Meiryo" in pdfmetrics.getRegisteredFontNames() else "Helvetica"

# ─── 色 ───────────────────────────────────────────────────
NAVY   = HexColor("#1a3a6b")
TEAL   = HexColor("#0D9488")
BLUE   = HexColor("#2563EB")
ORANGE = HexColor("#EA580C")
PURPLE = HexColor("#7C3AED")
GREEN  = HexColor("#16A34A")
RED    = HexColor("#DC2626")
GRAY   = HexColor("#9CA3AF")
GRAYDK = HexColor("#4B5563")
YELLOW = HexColor("#CA8A04")
BG     = HexColor("#F8FAFC")

W, H = landscape(A4)

# ─── 描画ユーティリティ ────────────────────────────────────
def rrect(c, x, y, w, h, r, fill=None, stroke=None, sw=1):
    p = c.beginPath(); p.roundRect(x, y, w, h, r)
    if fill: c.setFillColor(fill)
    if stroke: c.setStrokeColor(stroke); c.setLineWidth(sw)
    c.drawPath(p, fill=1 if fill else 0, stroke=1 if stroke else 0)

def arrow(c, x1, y1, x2, y2, color=GRAY, lw=1.5, dash=False):
    c.setStrokeColor(color); c.setLineWidth(lw)
    if dash: c.setDash(5,3)
    else: c.setDash()
    c.line(x1,y1,x2,y2); c.setDash()
    a = math.atan2(y2-y1,x2-x1); al=7
    c.setFillColor(color)
    p = c.beginPath(); p.moveTo(x2,y2)
    p.lineTo(x2+al*math.cos(a+2.7), y2+al*math.sin(a+2.7))
    p.lineTo(x2+al*math.cos(a-2.7), y2+al*math.sin(a-2.7))
    p.close(); c.drawPath(p,fill=1,stroke=0)

def arrow_r(c, x1, x2, y, color=GRAY, label=""):
    arrow(c, x1, y, x2, y, color)
    if label:
        c.setFillColor(color); c.setFont(FR,6.5)
        c.drawCentredString((x1+x2)/2, y+4, label)

def arrow_d(c, x, y1, y2, color=GRAY, label=""):
    arrow(c, x, y1, x, y2, color)
    if label:
        c.setFillColor(color); c.setFont(FR,6.5)
        c.drawString(x+3, (y1+y2)/2, label)

def elbow_r_d(c, x1, y1, x2, y2, color=GRAY, label=""):
    """右→下のL字矢印"""
    c.setStrokeColor(color); c.setLineWidth(1.5); c.setDash()
    c.line(x1, y1, x2, y1)
    c.line(x2, y1, x2, y2+7)
    arrow(c, x2, y1, x2, y2, color)
    if label:
        c.setFillColor(color); c.setFont(FR,6.5)
        c.drawString(x2+3, (y1+y2)/2+5, label)

def elbow_d_r(c, x1, y1, x2, y2, color=GRAY, label=""):
    """下→右のL字矢印"""
    c.setStrokeColor(color); c.setLineWidth(1.5); c.setDash()
    c.line(x1, y1, x1, y2)
    arrow(c, x1, y2, x2, y2, color)
    if label:
        c.setFillColor(color); c.setFont(FR,6.5)
        c.drawCentredString((x1+x2)/2, y2+5, label)


# ─── 画面ボックス（ミニワイヤーフレーム）──────────────────
def screen_box(c, x, y, w, h, title, color, wireframe_fn=None, step="", highlight=False):
    """画面ボックスを描画（影＋角丸＋ヘッダー＋ワイヤーフレーム）"""
    # 影
    rrect(c, x+2, y-2, w, h, 5, fill=HexColor("#00000018"))
    # 本体
    rrect(c, x, y, w, h, 5, fill=white, stroke=color if not highlight else RED, sw=2 if highlight else 1.2)
    # ヘッダーバー
    hh = 16
    rrect(c, x, y+h-hh, w, hh, 5, fill=color)
    c.setFillColor(color); c.rect(x, y+h-hh, w, 6, fill=1, stroke=0)
    # ヘッダーテキスト
    c.setFillColor(white); c.setFont(FB, 7.5)
    label = f"{step}  {title}" if step else title
    c.drawCentredString(x+w/2, y+h-hh+4.5, label)
    # ワイヤーフレーム内容
    if wireframe_fn:
        c.saveState()
        wireframe_fn(c, x+3, y+3, w-6, h-hh-6)
        c.restoreState()

# ─── ワイヤーフレーム描画関数 ──────────────────────────────
def wf_top(c, x, y, w, h):
    # ヘッダーバー
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    # いらっしゃいませ
    c.setFillColor(GRAYDK); c.setFont(FB, 8)
    c.drawCentredString(x+w/2, y+h-24, "いらっしゃいませ")
    # ボタン
    rrect(c, x+8, y+6, w-16, 18, 4, fill=TEAL)
    c.setFillColor(white); c.setFont(FB, 7)
    c.drawCentredString(x+w/2, y+12, "受付はこちら")

def wf_caution(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GRAYDK); c.setFont(FB, 6.5)
    c.drawCentredString(x+w/2, y+h-20, "安全注意事項")
    # アイコン
    c.setFont(FR, 14)
    c.drawCentredString(x+w/2, y+h-40, "⚠")
    c.setFont(FR, 5.5)
    c.drawCentredString(x+w/2, y+h-48, "保護帽・安全靴")
    rrect(c, x+8, y+4, w-16, 14, 3, fill=TEAL)
    c.setFillColor(white); c.setFont(FB, 6)
    c.drawCentredString(x+w/2, y+8, "確認しました")

def wf_phone(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GRAYDK); c.setFont(FB, 6.5)
    c.drawCentredString(x+w/2, y+h-20, "電話番号を入力")
    # 入力欄
    rrect(c, x+6, y+h-34, w-12, 10, 2, fill=HexColor("#F3F4F6"), stroke=GRAY, sw=0.5)
    c.setFillColor(GRAYDK); c.setFont(FR, 5.5)
    c.drawCentredString(x+w/2, y+h-32, "090-1234-5678")
    # テンキー
    for r in range(3):
        for col in range(3):
            bx = x + 10 + col*20
            by = y + 6 + (2-r)*10
            rrect(c, bx, by, 16, 8, 1.5, fill=HexColor("#F3F4F6"), stroke=HexColor("#D1D5DB"), sw=0.3)

def wf_person_input(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GRAYDK); c.setFont(FB, 6)
    c.drawCentredString(x+w/2, y+h-18, "会社名・お名前")
    c.setFont(FR, 5)
    c.drawCentredString(x+w/2, y+h-26, "カタカナ入力")
    # キーボード風
    for r in range(3):
        for col in range(5):
            bx = x + 4 + col*14
            by = y + 4 + (2-r)*9
            rrect(c, bx, by, 12, 7, 1, fill=HexColor("#EFF6FF"), stroke=HexColor("#BFDBFE"), sw=0.3)

def wf_person_confirm(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GRAYDK); c.setFont(FB, 6)
    c.drawCentredString(x+w/2, y+h-18, "この方ですか？")
    # カード
    rrect(c, x+5, y+h-42, w-10, 18, 3, fill=HexColor("#F0FDF4"), stroke=GREEN, sw=0.5)
    c.setFillColor(GRAYDK); c.setFont(FR, 5)
    c.drawCentredString(x+w/2, y+h-36, "テスト運送  太郎")
    # ボタン
    rrect(c, x+4, y+4, w/2-6, 12, 2, fill=TEAL)
    c.setFillColor(white); c.setFont(FB, 5)
    c.drawCentredString(x+w/4, y+8, "はい")
    rrect(c, x+w/2+2, y+4, w/2-6, 12, 2, fill=HexColor("#F3F4F6"), stroke=GRAY, sw=0.3)
    c.setFillColor(GRAYDK); c.setFont(FB, 5)
    c.drawCentredString(x+3*w/4, y+8, "修正する")

def wf_person_select(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GRAYDK); c.setFont(FB, 6)
    c.drawCentredString(x+w/2, y+h-18, "選んでください")
    # リスト
    for i in range(3):
        by = y+h-30-i*12
        rrect(c, x+4, by, w-8, 10, 2, fill=HexColor("#F9FAFB"), stroke=HexColor("#E5E7EB"), sw=0.3)
        c.setFillColor(GRAYDK); c.setFont(FR, 4.5)
        c.drawString(x+8, by+3, f"候補 {i+1}")
    rrect(c, x+8, y+3, w-16, 10, 2, fill=HexColor("#EFF6FF"), stroke=BLUE, sw=0.5)
    c.setFillColor(BLUE); c.setFont(FB, 5)
    c.drawCentredString(x+w/2, y+6, "新しく入力する")

def wf_vehicle_input(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GRAYDK); c.setFont(FB, 6)
    c.drawCentredString(x+w/2, y+h-18, "ナンバー入力")
    # ナンバープレート
    rrect(c, x+10, y+h-42, w-20, 20, 3, fill=HexColor("#1a6320"), stroke=HexColor("#555"), sw=0.8)
    c.setFillColor(white); c.setFont(FB, 5.5)
    c.drawCentredString(x+w/2, y+h-34, "所沢 100")
    c.setFont(FB, 4.5)
    c.drawCentredString(x+w/2, y+h-40, "あ  12-34")
    # テンキー
    for r in range(2):
        for col in range(3):
            bx = x + 10 + col*18
            by = y + 4 + (1-r)*9
            rrect(c, bx, by, 15, 7, 1, fill=HexColor("#F3F4F6"), stroke=HexColor("#D1D5DB"), sw=0.3)

def wf_vehicle_confirm(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GRAYDK); c.setFont(FB, 6)
    c.drawCentredString(x+w/2, y+h-18, "この車両ですか？")
    rrect(c, x+5, y+h-42, w-10, 18, 3, fill=HexColor("#1a6320"), stroke=HexColor("#555"), sw=0.5)
    c.setFillColor(white); c.setFont(FB, 5)
    c.drawCentredString(x+w/2, y+h-34, "所沢100 あ 12-34")
    rrect(c, x+4, y+4, w/2-6, 12, 2, fill=TEAL)
    c.setFillColor(white); c.setFont(FB, 5)
    c.drawCentredString(x+w/4, y+8, "はい")
    rrect(c, x+w/2+2, y+4, w/2-6, 12, 2, fill=HexColor("#F3F4F6"), stroke=GRAY, sw=0.3)
    c.setFillColor(GRAYDK); c.setFont(FB, 5)
    c.drawCentredString(x+3*w/4, y+8, "修正する")

def wf_vehicle_select(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GRAYDK); c.setFont(FB, 6)
    c.drawCentredString(x+w/2, y+h-18, "車両を選択")
    for i in range(3):
        by = y+h-30-i*12
        rrect(c, x+4, by, w-8, 10, 2, fill=HexColor("#F0FDF4"), stroke=HexColor("#BBF7D0"), sw=0.3)
        c.setFillColor(GRAYDK); c.setFont(FR, 4.5)
        c.drawString(x+8, by+3, f"車両 {i+1}")
    rrect(c, x+8, y+3, w-16, 10, 2, fill=HexColor("#EFF6FF"), stroke=BLUE, sw=0.5)
    c.setFillColor(BLUE); c.setFont(FB, 5)
    c.drawCentredString(x+w/2, y+6, "新しく入力する")

def wf_reservation(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GRAYDK); c.setFont(FB, 6)
    c.drawCentredString(x+w/2, y+h-18, "予約を選択")
    for i in range(2):
        by = y+h-30-i*14
        rrect(c, x+4, by, w-8, 12, 2, fill=HexColor("#DBEAFE"), stroke=BLUE, sw=0.5)
        c.setFillColor(BLUE); c.setFont(FR, 4.5)
        c.drawCentredString(x+w/2, by+4, f"10:00〜11:00")
    rrect(c, x+6, y+3, w-12, 10, 2, fill=HexColor("#FEF2F2"), stroke=RED, sw=0.5)
    c.setFillColor(RED); c.setFont(FB, 5)
    c.drawCentredString(x+w/2, y+6, "予約なしで受付")

def wf_final(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GRAYDK); c.setFont(FB, 6)
    c.drawCentredString(x+w/2, y+h-18, "内容をご確認ください")
    # 行
    items = ["連絡先","本人","車両"]
    for i, t in enumerate(items):
        by = y+h-28-i*11
        rrect(c, x+3, by, w-6, 9, 1.5, fill=HexColor("#F9FAFB"), stroke=HexColor("#E5E7EB"), sw=0.3)
        c.setFillColor(GRAYDK); c.setFont(FR, 4.5)
        c.drawString(x+6, by+2.5, t)
        c.setFillColor(BLUE); c.setFont(FR, 4)
        c.drawRightString(x+w-6, by+2.5, "修正")
    # 受付ボタン
    rrect(c, x+8, y+3, w-16, 14, 3, fill=TEAL)
    c.setFillColor(white); c.setFont(FB, 6)
    c.drawCentredString(x+w/2, y+7, "受付する")

def wf_complete(c, x, y, w, h):
    rrect(c, x, y+h-8, w, 8, 2, fill=NAVY)
    c.setFillColor(GREEN); c.setFont(FB, 14)
    c.drawCentredString(x+w/2, y+h-32, "✓")
    c.setFont(FB, 7)
    c.drawCentredString(x+w/2, y+h-42, "受付完了")
    c.setFillColor(GRAY); c.setFont(FR, 5)
    c.drawCentredString(x+w/2, y+8, "10秒で自動戻り")

# ─── ページヘッダー ────────────────────────────────────────
def page_header(c, title, desc, pnum, total, color=NAVY):
    c.setFillColor(NAVY); c.rect(0, H-32, W, 32, fill=1, stroke=0)
    c.setFillColor(white); c.setFont(FB, 12)
    c.drawString(16, H-23, "トラック受付キオスク  画面遷移図")
    c.setFont(FR, 8)
    c.drawRightString(W-16, H-23, f"page {pnum}/{total}")
    rrect(c, 16, H-60, W-32, 22, 5, fill=color)
    c.setFillColor(white); c.setFont(FB, 11)
    c.drawString(28, H-54, title)
    c.setFont(FR, 8)
    c.drawString(28 + len(title)*12 + 8, H-54, desc)
    # フッター
    c.setFillColor(GRAY); c.setFont(FR, 6)
    c.drawString(16, 10, "日本セイフティー株式会社  トラック受付システム  2026年4月")

# ─── 共通フローラベル ─────────────────────────────────────
def mode_badge(c, x, y, text, color):
    tw = max(len(text)*6+12, 50)
    rrect(c, x-tw/2, y-5, tw, 14, 4, fill=white, stroke=color, sw=0.8)
    c.setFillColor(color); c.setFont(FB, 6.5)
    c.drawCentredString(x, y-1, text)


# ═══════════════════════════════════════════════════════════
# 各パターンのページ
# ═══════════════════════════════════════════════════════════
SW = 80   # screen width
SH = 72   # screen height
TOTAL = 8

def draw_common_start(c, y, sw=SW, sh=SH):
    """TOP→注意→電話の共通3画面を描画、座標リスト返す"""
    gap = sw + 22
    xs = []
    screens = [
        ("TOP", NAVY, wf_top, ""),
        ("注意事項", NAVY, wf_caution, ""),
        ("電話番号入力", BLUE, wf_phone, "STEP1"),
    ]
    for i, (t, col, wf, st) in enumerate(screens):
        x = 24 + i * gap
        screen_box(c, x, y, sw, sh, t, col, wf, st)
        xs.append(x)
        if i > 0:
            arrow_r(c, xs[i-1]+sw, x, y+sh/2)
    return xs

def draw_end(c, x, y, sw=SW, sh=SH):
    """最終確認→完了"""
    screen_box(c, x, y, sw, sh, "最終確認", TEAL, wf_final, "STEP4")
    cx = x + sw + 22
    screen_box(c, cx, y, sw, sh, "完了", GREEN, wf_complete, "")
    arrow_r(c, x+sw, cx, y+sh/2)
    return cx


def page_A(c):
    """パターンA: 完全新規"""
    page_header(c, "パターンA：完全新規", "電話番号の履歴なし → 全項目を手入力する最長フロー", 1, TOTAL, TEAL)
    rrect(c, 10, 24, W-20, H-90, 8, fill=BG)

    y = H - 150
    xs = draw_common_start(c, y)
    gap = SW + 22

    # 本人情報（入力モード）
    x4 = xs[-1] + gap
    screen_box(c, x4, y, SW, SH, "本人情報", PURPLE, wf_person_input, "STEP2")
    arrow_r(c, xs[-1]+SW, x4, y+SH/2)
    mode_badge(c, x4+SW/2, y-8, "入力モード", PURPLE)

    # 車両情報（入力モード）
    x5 = x4 + gap
    screen_box(c, x5, y, SW, SH, "車両情報", ORANGE, wf_vehicle_input, "STEP3")
    arrow_r(c, x4+SW, x5, y+SH/2)
    mode_badge(c, x5+SW/2, y-8, "入力モード", ORANGE)

    # 最終確認→完了
    x6 = x5 + gap
    cx = draw_end(c, x6, y)

    # 戻り矢印
    ret_y = y - 28
    c.setStrokeColor(GRAY); c.setLineWidth(0.8); c.setDash(4,3)
    c.line(cx+SW/2, y, cx+SW/2, ret_y)
    c.line(cx+SW/2, ret_y, xs[0]+SW/2, ret_y)
    c.setDash()
    arrow(c, xs[0]+SW/2, ret_y, xs[0]+SW/2, y, GRAY)
    c.setFillColor(GRAY); c.setFont(FR, 6)
    c.drawCentredString((cx+SW/2+xs[0]+SW/2)/2, ret_y+4, "10秒で自動戻り / 最初からボタン")

    # 説明
    dy = y - 68
    rrect(c, 24, dy, W-48, 38, 6, fill=white, stroke=HexColor("#E5E7EB"))
    c.setFillColor(NAVY); c.setFont(FB, 9); c.drawString(36, dy+24, "説明")
    c.setFillColor(GRAYDK); c.setFont(FR, 7.5)
    c.drawString(36, dy+12, "電話番号に該当する履歴なし（初来場）。全ての情報を手入力で登録する最も長いフロー。")
    c.drawString(36, dy+2, "本人情報はカタカナキーボードで会社名・氏名を入力。車両情報はナンバープレート各パーツ＋最大積載量を入力。")


def page_B(c):
    """パターンB: 予約あり → 直行"""
    page_header(c, "パターンB：予約あり", "電話番号で予約ヒット → 予約選択 → STEP2・3スキップで最終確認へ直行", 2, TOTAL, BLUE)
    rrect(c, 10, 24, W-20, H-90, 8, fill=BG)

    y = H - 150
    xs = draw_common_start(c, y)
    gap = SW + 22

    # 予約選択
    x4 = xs[-1] + gap
    screen_box(c, x4, y, SW, SH, "予約選択", BLUE, wf_reservation, "")
    arrow_r(c, xs[-1]+SW, x4, y+SH/2, BLUE, "予約あり")

    # 最終確認→完了
    x5 = x4 + gap
    cx = draw_end(c, x5, y)

    # 予約選択→最終確認
    arrow_r(c, x4+SW, x5, y+SH/2, TEAL, "予約選択")

    # SKIP表示
    skip_y = y + SH + 16
    rrect(c, x4+20, skip_y, 180, 18, 5, fill=HexColor("#DBEAFE"), stroke=BLUE)
    c.setFillColor(BLUE); c.setFont(FB, 7.5)
    c.drawCentredString(x4+110, skip_y+5, "STEP2（本人情報）・STEP3（車両情報）をスキップ")

    # 説明
    dy = y - 55
    rrect(c, 24, dy, W-48, 32, 6, fill=white, stroke=HexColor("#E5E7EB"))
    c.setFillColor(NAVY); c.setFont(FB, 9); c.drawString(36, dy+18, "説明")
    c.setFillColor(GRAYDK); c.setFont(FR, 7.5)
    c.drawString(36, dy+6, "予約データに会社名・氏名・車両情報が含まれているため、本人情報・車両情報の入力を全てスキップ。最短フロー。")


def page_C(c):
    """パターンC: 予約あり → 予約なしで受付"""
    page_header(c, "パターンC：予約あり → 予約なしで受付", "予約一覧で「予約なしで受付する」を選択 → 通常フローへ合流", 3, TOTAL, PURPLE)
    rrect(c, 10, 24, W-20, H-90, 8, fill=BG)

    y1 = H - 140
    sw2 = 72; sh2 = 64; gap2 = sw2 + 18

    # 上段: TOP→注意→電話→予約選択
    screens1 = [("TOP",NAVY,wf_top,""),("注意事項",NAVY,wf_caution,""),("電話番号",BLUE,wf_phone,"STEP1"),("予約選択",BLUE,wf_reservation,"")]
    xs1 = []
    for i,(t,col,wf,st) in enumerate(screens1):
        x = 20 + i*gap2
        screen_box(c, x, y1, sw2, sh2, t, col, wf, st)
        xs1.append(x)
        if i > 0: arrow_r(c, xs1[i-1]+sw2, x, y1+sh2/2)

    # 下段: 本人→車両→最終確認→完了
    y2 = y1 - sh2 - 30
    screens2 = [("本人情報",PURPLE,wf_person_input,"STEP2"),("車両情報",ORANGE,wf_vehicle_input,"STEP3"),("最終確認",TEAL,wf_final,"STEP4"),("完了",GREEN,wf_complete,"")]
    xs2 = []
    x_offset = xs1[2]  # 電話番号の下あたりから
    for i,(t,col,wf,st) in enumerate(screens2):
        x = x_offset + i*gap2
        screen_box(c, x, y2, sw2, sh2, t, col, wf, st)
        xs2.append(x)
        if i > 0: arrow_r(c, xs2[i-1]+sw2, x, y2+sh2/2)

    # 予約選択 → 本人情報（L字矢印）
    mid_x = xs1[3] + sw2/2
    elbow_d_r(c, mid_x, y1, xs2[0], y2+sh2/2, PURPLE, "予約なしで受付する")

    # 説明
    dy = y2 - 28
    rrect(c, 24, dy, W-48, 20, 6, fill=white, stroke=HexColor("#E5E7EB"))
    c.setFillColor(GRAYDK); c.setFont(FR, 7.5)
    c.drawString(36, dy+6, "予約はあるが使わない場合。予約データを無視し、電話番号で検索済みの候補データを使って通常フローへ。")


def page_D(c):
    """パターンD: リピーター 本人1件・車両1件"""
    page_header(c, "パターンD：リピーター（本人1件・車両1件）", "両方とも確認モード → 「はい」で即決する最速通常フロー", 4, TOTAL, TEAL)
    rrect(c, 10, 24, W-20, H-90, 8, fill=BG)

    y = H - 150
    xs = draw_common_start(c, y)
    gap = SW + 22

    x4 = xs[-1] + gap
    screen_box(c, x4, y, SW, SH, "本人情報", PURPLE, wf_person_confirm, "STEP2")
    arrow_r(c, xs[-1]+SW, x4, y+SH/2)
    mode_badge(c, x4+SW/2, y-8, "確認モード", PURPLE)

    x5 = x4 + gap
    screen_box(c, x5, y, SW, SH, "車両情報", ORANGE, wf_vehicle_confirm, "STEP3")
    arrow_r(c, x4+SW, x5, y+SH/2)
    mode_badge(c, x5+SW/2, y-8, "確認モード", ORANGE)

    x6 = x5 + gap
    draw_end(c, x6, y)

    dy = y - 55
    rrect(c, 24, dy, W-48, 32, 6, fill=white, stroke=HexColor("#E5E7EB"))
    c.setFillColor(NAVY); c.setFont(FB, 9); c.drawString(36, dy+18, "説明")
    c.setFillColor(GRAYDK); c.setFont(FR, 7.5)
    c.drawString(36, dy+6, "電話番号でドライバー1名・車両1台がヒット。「この方ですか？」「この車両ですか？」と確認画面が表示される。")


def page_E(c):
    """パターンE: リピーター 本人複数・車両複数"""
    page_header(c, "パターンE：リピーター（本人複数・車両複数）", "両方とも選択モード → 候補一覧から選択", 5, TOTAL, ORANGE)
    rrect(c, 10, 24, W-20, H-90, 8, fill=BG)

    y = H - 150
    xs = draw_common_start(c, y)
    gap = SW + 22

    x4 = xs[-1] + gap
    screen_box(c, x4, y, SW, SH, "本人情報", PURPLE, wf_person_select, "STEP2")
    arrow_r(c, xs[-1]+SW, x4, y+SH/2)
    mode_badge(c, x4+SW/2, y-8, "選択モード", PURPLE)

    x5 = x4 + gap
    screen_box(c, x5, y, SW, SH, "車両情報", ORANGE, wf_vehicle_select, "STEP3")
    arrow_r(c, x4+SW, x5, y+SH/2)
    mode_badge(c, x5+SW/2, y-8, "選択モード", ORANGE)

    x6 = x5 + gap
    draw_end(c, x6, y)

    dy = y - 55
    rrect(c, 24, dy, W-48, 32, 6, fill=white, stroke=HexColor("#E5E7EB"))
    c.setFillColor(NAVY); c.setFont(FB, 9); c.drawString(36, dy+18, "説明")
    c.setFillColor(GRAYDK); c.setFont(FR, 7.5)
    c.drawString(36, dy+6, "同一電話番号で複数のドライバー/車両が登録済み。一覧から選択するか、「新しく入力する」で手入力モードへ。")


def page_F(c):
    """パターンF: 本人1件・車両複数"""
    page_header(c, "パターンF：リピーター（本人1件・車両複数）", "本人は確認モード、車両は選択モード", 6, TOTAL, PURPLE)
    rrect(c, 10, 24, W-20, H-90, 8, fill=BG)

    y = H - 150
    xs = draw_common_start(c, y)
    gap = SW + 22

    x4 = xs[-1] + gap
    screen_box(c, x4, y, SW, SH, "本人情報", PURPLE, wf_person_confirm, "STEP2")
    arrow_r(c, xs[-1]+SW, x4, y+SH/2)
    mode_badge(c, x4+SW/2, y-8, "確認モード", PURPLE)

    x5 = x4 + gap
    screen_box(c, x5, y, SW, SH, "車両情報", ORANGE, wf_vehicle_select, "STEP3")
    arrow_r(c, x4+SW, x5, y+SH/2)
    mode_badge(c, x5+SW/2, y-8, "選択モード", ORANGE)

    x6 = x5 + gap
    draw_end(c, x6, y)

    dy = y - 55
    rrect(c, 24, dy, W-48, 32, 6, fill=white, stroke=HexColor("#E5E7EB"))
    c.setFillColor(NAVY); c.setFont(FB, 9); c.drawString(36, dy+18, "説明")
    c.setFillColor(GRAYDK); c.setFont(FR, 7.5)
    c.drawString(36, dy+6, "同一ドライバーが複数車両を使い分けるケース。本人は「はい」で即決、車両は一覧から選択する。")


def page_G(c):
    """パターンG: 本人複数・車両1件"""
    page_header(c, "パターンG：リピーター（本人複数・車両1件）", "本人は選択モード、車両は確認モード", 7, TOTAL, YELLOW)
    rrect(c, 10, 24, W-20, H-90, 8, fill=BG)

    y = H - 150
    xs = draw_common_start(c, y)
    gap = SW + 22

    x4 = xs[-1] + gap
    screen_box(c, x4, y, SW, SH, "本人情報", PURPLE, wf_person_select, "STEP2")
    arrow_r(c, xs[-1]+SW, x4, y+SH/2)
    mode_badge(c, x4+SW/2, y-8, "選択モード", PURPLE)

    x5 = x4 + gap
    screen_box(c, x5, y, SW, SH, "車両情報", ORANGE, wf_vehicle_confirm, "STEP3")
    arrow_r(c, x4+SW, x5, y+SH/2)
    mode_badge(c, x5+SW/2, y-8, "確認モード", ORANGE)

    x6 = x5 + gap
    draw_end(c, x6, y)

    dy = y - 55
    rrect(c, 24, dy, W-48, 32, 6, fill=white, stroke=HexColor("#E5E7EB"))
    c.setFillColor(NAVY); c.setFont(FB, 9); c.drawString(36, dy+18, "説明")
    c.setFillColor(GRAYDK); c.setFont(FR, 7.5)
    c.drawString(36, dy+6, "同一電話番号を複数ドライバーが共有するケース（会社携帯等）。本人を一覧から選択、車両は「はい」で確認。")


def page_H(c):
    """パターンH: 最終確認からの修正"""
    page_header(c, "パターンH：最終確認からの修正フロー", "最終確認画面の「修正」ボタン → 該当画面で編集 → 自動復帰", 8, TOTAL, RED)
    rrect(c, 10, 24, W-20, H-90, 8, fill=BG)

    # 中央に最終確認
    cx = W/2 - SW/2
    cy = H/2 - SH/2 + 10
    screen_box(c, cx, cy, SW+20, SH+10, "最終確認", TEAL, wf_final, "STEP4")

    # 左側の修正先
    left_targets = [
        ("電話番号", BLUE, wf_phone),
        ("会社名", PURPLE, wf_person_input),
        ("氏名", PURPLE, wf_person_input),
    ]
    bw2 = 68; bh2 = 55
    for i, (name, col, wf) in enumerate(left_targets):
        lx = 30
        ly = cy + (SH+10) - 12 - i*(bh2+14)
        screen_box(c, lx, ly, bw2, bh2, name, col, wf, "修正")
        # 行き矢印（破線）
        arrow(c, cx, ly+bh2/2+4, lx+bw2, ly+bh2/2+4, col, dash=True)
        # 戻り矢印（実線）
        arrow(c, lx+bw2, ly+bh2/2-4, cx, ly+bh2/2-4, TEAL)

    # 右側の修正先
    right_targets = [
        ("地名", ORANGE, wf_vehicle_input),
        ("分類番号", ORANGE, wf_vehicle_input),
        ("ひらがな", ORANGE, wf_vehicle_input),
        ("4桁番号", ORANGE, wf_vehicle_input),
        ("最大積載量", YELLOW, wf_vehicle_input),
    ]
    rx_start = cx + SW + 20 + 40
    for i, (name, col, wf) in enumerate(right_targets):
        rx = rx_start
        ry = cy + (SH+10) + 12 - i*(bh2*0.48+10)
        # 小さいボックス
        sbw = 62; sbh = 32
        screen_box(c, rx, ry, sbw, sbh, name, col, None, "修正")
        # 矢印
        arrow(c, cx+SW+20, ry+sbh/2+3, rx, ry+sbh/2+3, col, dash=True)
        arrow(c, rx, ry+sbh/2-3, cx+SW+20, ry+sbh/2-3, TEAL)

    # 説明
    dy = 30
    rrect(c, 24, dy, W-48, 24, 6, fill=white, stroke=HexColor("#E5E7EB"))
    c.setFillColor(GRAYDK); c.setFont(FR, 7.5)
    c.drawString(36, dy+8, "各項目の「修正」ボタンで該当入力画面へ（from=final-confirm付きURL）。編集完了後、最終確認画面に自動復帰。分類番号・4桁番号は既存値クリアで打ち替え。")


# ═══════════════════════════════════════════════════════════
def main():
    out = os.path.join(os.path.dirname(__file__), "kiosk_screen_flow.pdf")
    pdf = canvas.Canvas(out, pagesize=landscape(A4))

    for i, fn in enumerate([page_A, page_B, page_C, page_D, page_E, page_F, page_G, page_H]):
        if i > 0: pdf.showPage()
        fn(pdf)

    pdf.save()
    print(f"OK: {out}")

if __name__ == "__main__":
    main()
