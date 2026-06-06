#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
assemble_apology_vlog.py
========================
محرّر آلي لـ"فلوق اعتذار": يأخذ مقطعك الأساسي (أنت تتكلم للكاميرا) ومجلد ذكريات
(صور وكليبات قديمة)، يفرّغ كلامك بطوابع زمنية على مستوى الكلمة، يكتشف "لحظات
الإرساء" العاطفية، وينسج الذكريات فوق صوتك المتواصل — جسم هادئ ثم ختام متصاعد —
بلوك دافئ موحّد، ويصدّر MP4/H.264 بنفس أبعاد ومعدل إطارات المصدر.

المبدأ الأساسي للمونتاج
-----------------------
صوتك هو العمود الفقري ولا ينقطع أبداً: نبقي فيديو + صوت المقطع الأساسي متواصلين
بطول الفلوق، ونركّب الذكريات *فوق* الصورة كطبقات بقناة ألفا (دِزولڤ)، فالصوت يستمر
تحتها دون أي قطع. هذا الموديل الوحيد الذي يضمن "صوتي ما ينقطع".
"""
from __future__ import annotations
import argparse, csv, json, math, os, random, re, shutil, subprocess, sys, unicodedata
from dataclasses import dataclass, field
from pathlib import Path

# ──────────────────────────────────────────────────────────────────────────
#  لوك موحّد دافئ ناعم (دفء + desaturation خفيف، بدون تباين عالٍ) — يُطبّق على كل
#  اللقطات والذكريات حتى تتوحّد. لا نستخدم تبايناً عالياً؛ نرفع الأسود قليلاً
#  ونخفض السطوع الأعلى (curves) لمظهر ناعم، مع vignette خفيفة.
# ──────────────────────────────────────────────────────────────────────────
GRADE = (
    "eq=contrast=0.96:saturation=0.86:brightness=0.015:gamma=1.03,"
    "colorbalance=rs=0.030:rm=0.045:rh=0.020:bs=-0.050:bm=-0.050:bh=-0.030,"
    "curves=all='0/0.03 0.5/0.5 1/0.965',"
    "vignette=PI/5"
)

IMG_EXT = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".tiff", ".bmp", ".gif"}
VID_EXT = {".mov", ".mp4", ".m4v", ".mkv", ".avi", ".webm", ".3gp", ".wmv", ".flv", ".mpg", ".mpeg", ".ts"}

# كلمات الإرساء العاطفي (تُطبّع عربياً قبل المطابقة)
KW_STRONG = ["اسف", "عاسف", "كاسف", "سامح", "سامحيني", "اعتذر", "عذرا", "سمحيني",
             "غلطت", "غلط", "ندمت", "ندم", "خطأي", "خطاي", "تسامحيني"]
KW_MED = ["احنا", "حننا", "نحن", "اتذكر", "تذكر", "ذكرى", "ذكريات", "فاكر", "فاكره",
          "وعدتك", "وعد", "اوعدك", "حبيبتي", "حبيبي", "عمري", "قلبي", "بحبك", "احبك",
          "كنا", "ايامنا", "بيننا", "سوا", "معاك", "معك"]


# ╭──────────────────────────── أدوات مساعدة ────────────────────────────╮
def run(cmd, **kw):
    """تشغيل أمر والتقاط الخطأ مع stderr مفيد."""
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kw)
    if p.returncode != 0:
        sys.stderr.write("\n[CMD FAILED] " + " ".join(map(str, cmd)) + "\n")
        sys.stderr.write(p.stderr.decode("utf-8", "replace")[-3000:] + "\n")
        raise SystemExit(1)
    return p.stdout.decode("utf-8", "replace")


def ffprobe_dur(path) -> float:
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
               "-of", "csv=p=0", str(path)]).strip()
    try:
        return float(out)
    except ValueError:
        return 0.0


def ffprobe_video(path):
    """يرجّع (w, h, fps) لأول مسار فيديو، أو None لو مافي فيديو."""
    out = run(["ffprobe", "-v", "error", "-select_streams", "v:0",
               "-show_entries", "stream=width,height,r_frame_rate",
               "-of", "json", str(path)])
    try:
        st = json.loads(out)["streams"][0]
    except (KeyError, IndexError):
        return None
    num, den = (st["r_frame_rate"].split("/") + ["1"])[:2]
    fps = float(num) / float(den or 1) if float(den or 1) else float(num)
    return int(st["width"]), int(st["height"]), round(fps, 4)


def has_audio(path) -> bool:
    out = run(["ffprobe", "-v", "error", "-select_streams", "a:0",
               "-show_entries", "stream=codec_name", "-of", "csv=p=0", str(path)]).strip()
    return bool(out)


def norm_ar(s: str) -> str:
    """تطبيع عربي: حذف التشكيل وتوحيد الألف/الياء/التاء المربوطة."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    for a, b in [("أ", "ا"), ("إ", "ا"), ("آ", "ا"), ("ٱ", "ا"),
                 ("ى", "ي"), ("ة", "ه"), ("ؤ", "و"), ("ئ", "ي"), ("ـ", "")]:
        s = s.replace(a, b)
    return re.sub(r"[^\w\s]", "", s)


# ╭──────────────────────────── نماذج البيانات ──────────────────────────╮
@dataclass
class Word:
    start: float
    end: float
    text: str


@dataclass
class Anchor:
    t: float
    weight: float
    kind: str          # keyword-strong | keyword-med | pause | beat | name
    label: str


@dataclass
class Memory:
    path: Path
    kind: str          # still | clip
    dur: float         # طول المصدر (للكليبات)؛ للصور = 0


@dataclass
class Placement:
    idx: int
    section: str       # body | finale
    t_start: float
    t_end: float
    mem: Memory
    src_in: float
    transition: str    # dissolve | light_leak | white_flash | speed_ramp | match_cut
    anchor_t: float
    reason: str
    speed: float = 1.0
    element: Path = None   # ملف العنصر المُرندَر (alpha .mov)


# ╭──────────────────────── 1) التفريغ بطوابع الكلمات ───────────────────╮
def transcribe(base: Path, work: Path, lang: str, model_size: str):
    wav = work / "voice16k.wav"
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(base),
         "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(wav)])
    from faster_whisper import WhisperModel
    print(f"   • تحميل موديل faster-whisper ({model_size}) …", flush=True)
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segs, info = model.transcribe(str(wav), language=lang, word_timestamps=True,
                                  vad_filter=True, beam_size=5)
    words: list[Word] = []
    for s in segs:
        for w in (s.words or []):
            t = w.word.strip()
            if t:
                words.append(Word(round(w.start, 3), round(w.end, 3), t))
    print(f"   • لغة={info.language} (ثقة {info.language_probability:.2f})، "
          f"{len(words)} كلمة بطوابع زمنية", flush=True)
    return words


# ╭──────────────────────── 2) كشف لحظات الإرساء ────────────────────────╮
def find_anchors(words: list[Word], total: float, name: str | None) -> list[Anchor]:
    anchors: list[Anchor] = []
    strong = list(KW_STRONG) + ([norm_ar(name)] if name else [])
    for i, w in enumerate(words):
        nw = norm_ar(w.text)
        if not nw:
            continue
        if any(k and k in nw for k in strong):
            anchors.append(Anchor(w.start, 3.0, "keyword-strong", f"كلمة قوية: «{w.text}»"))
        elif any(k in nw for k in KW_MED):
            anchors.append(Anchor(w.start, 2.0, "keyword-med", f"كلمة وصل: «{w.text}»"))
        # وقفة طويلة قبل جملة ثقيلة
        if i > 0:
            gap = w.start - words[i - 1].end
            if gap > 0.6:
                nxt = " ".join(x.text for x in words[i:i + 4])
                anchors.append(Anchor(w.start, 1.0 + min(gap, 2.0), "pause",
                                      f"وقفة {gap:.1f}ث قبل: «{nxt}»"))
    # دمج المتقاربة (≤1.5ث) مع الإبقاء على الأقوى
    anchors.sort(key=lambda a: a.t)
    merged: list[Anchor] = []
    for a in anchors:
        if merged and a.t - merged[-1].t < 1.5:
            if a.weight > merged[-1].weight:
                merged[-1] = a
        else:
            merged.append(a)
    return merged


# ╭──────────────────────── 3) مسح مجلد الذكريات ────────────────────────╮
def sanitize_sources(raw_files: list[Path], work: Path):
    """نسخ/تحويل كل المصادر لأسماء آمنة (وتحويل HEIC→PNG)."""
    from PIL import Image, ImageOps
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
    except Exception:
        pass
    srcdir = work / "src"
    srcdir.mkdir(parents=True, exist_ok=True)
    out = []
    for i, f in enumerate(raw_files):
        ext = f.suffix.lower()
        safe_stem = f"{i:02d}_" + re.sub(r"[^A-Za-z0-9._-]", "_", f.stem)[:40]
        if ext in {".heic", ".heif"}:
            dst = srcdir / (safe_stem + ".png")
            im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
            im.save(dst)
        else:
            dst = srcdir / (safe_stem + ext)
            shutil.copy2(f, dst)
        out.append((dst, f.name))
    return out


def scan_memories(sources) -> list[Memory]:
    mems: list[Memory] = []
    for path, _orig in sources:
        ext = path.suffix.lower()
        if ext in IMG_EXT:
            mems.append(Memory(path, "still", 0.0))
        elif ext in VID_EXT:
            d = ffprobe_dur(path)
            if d > 0.4:
                mems.append(Memory(path, "clip", d))
    return mems


# ╭──────────────────────── 4) تخطيط الخط الزمني ────────────────────────╮
def plan_timeline(anchors, mems, total, rng):
    INTRO_HOLD = min(3.5, total * 0.08)      # نبقى على الوجه في البداية
    FINALE_START = total * 0.75
    END_FREEZE = min(2.6, total * 0.10)      # إقفال على الوجه + تلاشٍ
    MONTAGE_END = total - END_FREEZE

    stills = [m for m in mems if m.kind == "still"]
    clips = [m for m in mems if m.kind == "clip"]
    rng.shuffle(stills); rng.shuffle(clips)

    def draw(pref, used):
        """اسحب ذكرى مفضّلة النوع مع تجنّب التكرار الفوري قدر الإمكان."""
        pools = ([clips, stills] if pref == "clip" else [stills, clips])
        for pool in pools:
            cand = [m for m in pool if m.path not in used[-1:]] or pool
            if cand:
                m = cand[rng.randrange(len(cand))]
                used.append(m.path)
                return m
        return None

    placements: list[Placement] = []
    used: list[Path] = [None]
    idx = 0

    # ── الجسم (~75%): ذكريات قليلة ومتباعدة، كل وحدة مربوطة بلحظة إرساء ──
    BODY_GAP = 4.2
    body_anchors = [a for a in anchors if INTRO_HOLD <= a.t <= FINALE_START - 1.5]
    body_anchors.sort(key=lambda a: (-a.weight, a.t))
    chosen, occupied = [], []
    for a in body_anchors:
        md = rng.uniform(2.6, 3.6)
        if a.t + md > FINALE_START - 0.8:
            continue
        if all(abs(a.t - o) >= BODY_GAP for o in occupied):
            chosen.append((a, md)); occupied.append(a.t)
    chosen.sort(key=lambda x: x[0].t)
    for k, (a, md) in enumerate(chosen):
        pref = "still" if k % 2 == 0 else "clip"   # هادئ: نوزّع صور/كليبات
        m = draw(pref, used)
        if not m:
            continue
        d = md if m.kind == "still" else min(md, m.dur)
        src_in = 0.0 if m.kind == "still" else max(0.0, (m.dur - d) * 0.35)
        placements.append(Placement(idx, "body", round(a.t, 3), round(a.t + d, 3),
                                    m, round(src_in, 3), "dissolve", round(a.t, 3),
                                    a.label))
        idx += 1

    # ── الختام (~25%): مونتاج متسارع، كل وحدة أقصر من اللي قبلها ──
    FL = MONTAGE_END - FINALE_START
    durs, d = [], 2.0
    while sum(durs) < FL - 0.3 and len(durs) < 16:
        durs.append(max(d, 0.5)); d *= 0.82
    s = FL / sum(durs)
    durs = [x * s for x in durs]                    # تتناقص رتابياً وتملأ النافذة
    strong = ["light_leak", "speed_ramp", "white_flash", "match_cut"]
    t = FINALE_START
    for k, d in enumerate(durs):
        m = draw("clip" if k % 3 != 2 else "still", used)   # الختام يميل للكليبات
        if not m:
            break
        trans = "light_leak" if k == 0 else strong[(k - 1) % len(strong)]
        speed = 1.0
        if trans == "speed_ramp" and m.kind == "clip":
            speed = 1.7
        if m.kind == "clip":
            srcdur = min(m.dur, d * speed)
            d = min(d, srcdur / speed)
            src_in = max(0.0, (m.dur - srcdur) * 0.4)
        else:
            src_in = 0.0
        placements.append(Placement(idx, "finale", round(t, 3), round(t + d, 3),
                                    m, round(src_in, 3), trans, round(FINALE_START, 3),
                                    "كريشندو الختام", speed=speed))
        idx += 1
        t += d

    info = dict(intro_hold=INTRO_HOLD, finale_start=FINALE_START,
                montage_end=MONTAGE_END, end_freeze=END_FREEZE, total=total)
    return placements, info


# ╭──────────────────────── 5) رندرة عناصر الذكريات ─────────────────────╮
def cover(W, H):
    return f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1"


def render_element(p: Placement, W, H, R, work, rng):
    d = round(p.t_end - p.t_start, 3)
    out = work / "elem" / f"e{p.idx:02d}.mov"
    out.parent.mkdir(parents=True, exist_ok=True)
    # حواف الدِزولڤ: الجسم ناعم طويل؛ الختام قصير (أو قصّة مطابقة بلا تلاشٍ)
    if p.section == "body":
        fin = fout = 0.8
    else:
        fin = 0.05 if p.transition == "match_cut" else 0.14
        fout = 0.16
    fin = min(fin, d / 2); fout = min(fout, d / 2)
    fade = (f"format=yuva420p,"
            f"fade=t=in:st=0:d={fin:.3f}:alpha=1,"
            f"fade=t=out:st={max(0,d-fout):.3f}:d={fout:.3f}:alpha=1")

    if p.mem.kind == "still":
        nframes = max(2, int(round(d * R)))
        ztot = float(nframes)
        # Ken Burns بطيء جداً: زوم لطيف + انجراف أفقي خفيف عشوائي الاتجاه
        zoom_end = 1.07 if p.section == "body" else 1.12
        inc = (zoom_end - 1.0) / ztot
        drift = rng.choice([-1, 1]) * (0.06 if p.section == "body" else 0.10)
        x = (f"iw/2-(iw/zoom/2)+({drift})*iw*0.5*(on/{ztot})")
        y = "ih/2-(ih/zoom/2)"
        vf = (f"{cover(W*2, H*2)},"
              f"zoompan=z='min(zoom+{inc:.6f},{zoom_end})':d={nframes}:"
              f"x='{x}':y='{y}':s={W}x{H}:fps={R},"
              f"{GRADE},{fade}")
        run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-t", f"{d:.3f}",
             "-i", str(p.mem.path), "-vf", vf, "-frames:v", str(nframes),
             "-c:v", "qtrle", str(out)])
    else:
        srcdur = d * p.speed
        setpts = f"setpts={(1.0/p.speed):.4f}*PTS," if p.speed != 1.0 else ""
        vf = f"{cover(W, H)},fps={R},{setpts}{GRADE},{fade}"
        run(["ffmpeg", "-y", "-loglevel", "error",
             "-ss", f"{p.src_in:.3f}", "-t", f"{srcdur:.3f}", "-i", str(p.mem.path),
             "-an", "-vf", vf, "-c:v", "qtrle", str(out)])
    p.element = out
    return out


def render_flash(kind, t_center, W, H, R, work, idx):
    """ومضة بيضاء ناعمة أو لايت-ليك دافئ كعنصر مستقل عند حدّ القصّة."""
    out = work / "elem" / f"fx{idx:02d}_{kind}.mov"
    if kind == "white_flash":
        d = 0.20
        vf = (f"format=yuva420p,colorchannelmixer=aa=0.85,"
              f"fade=t=in:st=0:d={d/2:.3f}:alpha=1,fade=t=out:st={d/2:.3f}:d={d/2:.3f}:alpha=1")
        src = f"color=c=white:s={W}x{H}:r={R}"
    else:  # light_leak: مسحة دافئة قطرية شفافة
        d = 0.55
        vf = (f"format=yuva420p,colorchannelmixer=aa=0.5,"
              f"fade=t=in:st=0:d={d*0.4:.3f}:alpha=1,fade=t=out:st={d*0.5:.3f}:d={d*0.5:.3f}:alpha=1")
        src = (f"gradients=s={W}x{H}:r={R}:c0=0xFF8A33:c1=0xFFD27A:"
               f"x0=0:y0={H}:x1={W}:y1=0")
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-t", f"{d:.3f}",
         "-i", src, "-vf", vf, "-c:v", "qtrle", str(out)])
    return out, d, max(0.0, t_center - d / 2)


# ╭──────────────────────── 6) بناء الصوت (سبين + موسيقى) ────────────────╮
def build_audio(base: Path, music: Path | None, finale_start, total, work):
    out = work / "audio.m4a"
    if music and Path(music).exists():
        music_in = ["-i", str(music)]
        music_label = "[1:a]"
    else:
        # سرير موسيقي دافئ مُركّب: كورد منخفض + LFO بطيء + صدى للمساحة
        music_in = ["-f", "lavfi", "-i",
                    (f"aevalsrc=0.20*sin(2*PI*110*t)+0.16*sin(2*PI*164.81*t)+"
                     f"0.12*sin(2*PI*220*t)+0.09*sin(2*PI*277.18*t):"
                     f"d={total:.3f}:s=44100:c=stereo")]
        music_label = "[1:a]"
    # voice = 0:a — يبقى متواصلاً ونظيفاً (highpass خفيف فقط)
    # ducking قوي تحت الكلام في الجسم؛ نخفّف الـducking ونرفع الموسيقى في الختام
    # ملاحظة: نُقسّم الصوت بـasplit لأن وسم الفلتر يُستهلك مرة واحدة، ونحتاج الصوت
    # مرّتين: مفتاحاً للـsidechain (ducking) وأيضاً مصدراً في الـamix.
    fc = (
        f"[0:a]highpass=f=80,aresample=44100,asetpts=N/SR/TB,asplit=2[voice][vkey];"
        f"{music_label}lowpass=f=2600,tremolo=f=0.12:d=0.4,"
        f"aecho=0.8:0.6:55:0.35,aresample=44100[bed];"
        f"[bed][vkey]sidechaincompress=threshold=0.030:ratio=9:attack=15:release=320[duck];"
        # رفع تدريجي للموسيقى داخل نافذة الختام (تقليل أثر الـducking سمعياً)
        f"[duck]volume=volume='if(gt(t,{finale_start:.3f}),"
        f"1+2.2*(t-{finale_start:.3f})/max(0.5,{total:.3f}-{finale_start:.3f}),0.9)':eval=frame[bedf];"
        f"[voice][bedf]amix=inputs=2:duration=first:normalize=0,"
        f"alimiter=limit=0.95[aout]"
    )
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(base)] + music_in +
        ["-filter_complex", fc, "-map", "[aout]",
         "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", str(out)])
    return out


# ╭──────────────────────── 7) التركيب النهائي ──────────────────────────╮
def composite(base: Path, placements, flashes, audio: Path, W, H, R, total, out: Path, work):
    inputs = ["-i", str(base)]
    elems = []   # (input_index, start_time)
    n = 1
    for p in placements:
        inputs += ["-i", str(p.element)]
        elems.append((n, p.t_start)); n += 1
    for (fpath, fdur, fstart) in flashes:
        inputs += ["-i", str(fpath)]
        elems.append((n, fstart)); n += 1
    audio_idx = n
    inputs += ["-i", str(audio)]

    # سلسلة overlay: أساس مدروج كامل الطول، ثم كل عنصر مُزاح لوقته بـsetpts
    lines = [f"[0:v]scale={W}:{H},setsar=1,{GRADE},fps={R},format=yuv420p[bg]"]
    cur = "bg"
    for j, (in_idx, start) in enumerate(elems):
        nxt = f"c{j}"
        lines.append(f"[{in_idx}:v]setpts=PTS+{start:.3f}/TB[d{j}]")
        lines.append(f"[{cur}][d{j}]overlay=eof_action=pass:format=auto[{nxt}]")
        cur = nxt
    # إقفال بتلاشٍ بطيء على آخر لقطة (الوجه)
    fade_st = max(0.0, total - 1.6)
    lines.append(f"[{cur}]fade=t=out:st={fade_st:.3f}:d=1.6,format=yuv420p[v]")
    script = work / "composite.filtergraph"
    script.write_text(";\n".join(lines), encoding="utf-8")

    run(["ffmpeg", "-y", "-loglevel", "error", *inputs,
         "-filter_complex_script", str(script),
         "-map", "[v]", "-map", f"{audio_idx}:a",
         "-c:v", "libx264", "-crf", "18", "-preset", "medium",
         "-pix_fmt", "yuv420p", "-r", str(R),
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
         "-t", f"{total:.3f}", str(out)])


# ╭──────────────────────── 8) التقارير: خريطة + EDL ────────────────────╮
def fmt_t(t):
    m, s = divmod(t, 60)
    return f"{int(m):02d}:{s:05.2f}"


def write_reports(placements, info, base_name, mem_count, out_mp4, work, project_dir):
    edl = project_dir / "edl.csv"
    with edl.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["idx", "section", "tl_in", "tl_out", "dur", "source", "kind",
                    "src_in", "speed", "transition", "anchor_t", "reason"])
        for p in placements:
            w.writerow([p.idx, p.section, f"{p.t_start:.3f}", f"{p.t_end:.3f}",
                        f"{p.t_end - p.t_start:.3f}", p.mem.path.name, p.mem.kind,
                        f"{p.src_in:.3f}", f"{p.speed:.2f}", p.transition,
                        f"{p.anchor_t:.3f}", p.reason])

    lines = []
    lines.append("═" * 78)
    lines.append("خريطة المونتاج — فلوق اعتذار")
    lines.append("═" * 78)
    lines.append(f"المقطع الأساسي (السبين الصوتي): {base_name}")
    lines.append(f"الطول الكلي: {info['total']:.2f}ث | بداية الختام: "
                 f"{info['finale_start']:.2f}ث | إقفال الوجه: آخر {info['end_freeze']:.2f}ث")
    lines.append(f"عدد الذكريات المتاحة: {mem_count} | عدد التوظيفات: {len(placements)}")
    lines.append("-" * 78)
    body = [p for p in placements if p.section == "body"]
    fin = [p for p in placements if p.section == "finale"]
    lines.append(f"\n▶ الجسم (هادئ ومكشوف) — {len(body)} ذكرى متباعدة، انتقالات دِزولڤ فقط:")
    for p in body:
        lines.append(f"  [{p.idx:02d}] {fmt_t(p.t_start)}→{fmt_t(p.t_end)} "
                     f"({p.t_end-p.t_start:.1f}ث) | {p.mem.kind:5s} | "
                     f"{p.mem.path.name}")
        lines.append(f"        ↳ لماذا هنا: {p.reason}")
        lines.append(f"        ↳ انتقال: دِزولڤ/كروس-فيد طويل | "
                     f"{'Ken Burns بطيء' if p.mem.kind=='still' else 'كليب مكتوم، صوتك يكمل فوقه'}")
    lines.append(f"\n▶ الختام (كريشندو متصاعد) — {len(fin)} ذكرى متسارعة (كل وحدة أقصر):")
    for p in fin:
        extra = f" | سبيد رامب ×{p.speed:.1f}" if p.speed != 1.0 else ""
        lines.append(f"  [{p.idx:02d}] {fmt_t(p.t_start)}→{fmt_t(p.t_end)} "
                     f"({p.t_end-p.t_start:.2f}ث) | {p.mem.kind:5s} | "
                     f"انتقال: {p.transition}{extra}")
        lines.append(f"        ↳ {p.mem.path.name}")
    lines.append("\n▶ الإقفال: تلاشٍ بطيء (1.6ث) على آخر لقطة من وجهك.")
    lines.append("\n♪ الصوت: صوتك سبين متواصل بلا قطع؛ موسيقى واطية مع ducking قوي في")
    lines.append("   الجسم، ثم ترتفع تدريجياً في الختام لذروة عاطفية.")
    lines.append("♪ اللوك: دفء + desaturation خفيف + vignette، موحّد على كل اللقطات.")
    lines.append("-" * 78)
    lines.append(f"الإخراج: {out_mp4}")
    lines.append(f"ملف EDL/CSV للتعديل اليدوي: {edl}")
    lines.append("═" * 78)
    report = "\n".join(lines)
    (project_dir / "montage_map.txt").write_text(report, encoding="utf-8")
    print(report)
    return edl


# ╭──────────────────────────────── main ────────────────────────────────╮
def main():
    ap = argparse.ArgumentParser(description="محرّر فلوق اعتذار آلي")
    ap.add_argument("--base", required=True, help="المقطع الأساسي (أنت تتكلم للكاميرا)")
    ap.add_argument("--memories", required=True, help="مجلد الذكريات (صور وكليبات)")
    ap.add_argument("--out", required=True, help="مسار MP4 الناتج")
    ap.add_argument("--music", default=None, help="(اختياري) ملف موسيقى خلفية")
    ap.add_argument("--name", default=None, help="(اختياري) اسمها لتقويته كلحظة إرساء")
    ap.add_argument("--lang", default="ar")
    ap.add_argument("--model", default="small", help="حجم موديل faster-whisper")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    base = Path(args.base).resolve()
    mem_dir = Path(args.memories).resolve()
    out_mp4 = Path(args.out).resolve()
    project_dir = out_mp4.parent
    work = project_dir / "_work"
    work.mkdir(parents=True, exist_ok=True)

    vinfo = ffprobe_video(base)
    if not vinfo:
        sys.exit("تعذّر قراءة فيديو المقطع الأساسي")
    W, H, R = vinfo
    R = int(round(R))
    total = ffprobe_dur(base)
    print(f"■ الأساسي: {base.name}  {W}x{H} @ {R}fps  مدّة {total:.2f}ث")

    print("■ [1/6] تفريغ الكلام بطوابع زمنية على مستوى الكلمة …")
    words = transcribe(base, work, args.lang, args.model)

    print("■ [2/6] كشف لحظات الإرساء العاطفية …")
    anchors = find_anchors(words, total, args.name)
    print(f"   • {len(anchors)} لحظة إرساء "
          f"(قوية={sum(a.kind=='keyword-strong' for a in anchors)}, "
          f"وصل={sum(a.kind=='keyword-med' for a in anchors)}, "
          f"وقفات={sum(a.kind=='pause' for a in anchors)})")

    print("■ [3/6] مسح مجلد الذكريات (تطبيع الأسماء + تحويل HEIC) …")
    raw = sorted(p for p in mem_dir.iterdir()
                 if p.is_file() and p.resolve() != base
                 and p.suffix.lower() in (IMG_EXT | VID_EXT))
    sources = sanitize_sources(raw, work)
    mems = scan_memories(sources)
    print(f"   • {len(mems)} ذكرى ({sum(m.kind=='still' for m in mems)} صورة، "
          f"{sum(m.kind=='clip' for m in mems)} كليب)")
    if not mems:
        sys.exit("لا توجد ذكريات صالحة في المجلد")

    print("■ [4/6] تخطيط الخط الزمني (جسم هادئ + ختام متصاعد) …")
    placements, info = plan_timeline(anchors, mems, total, rng)

    print(f"■ [5/6] رندرة {len(placements)} عنصر ذكرى (Ken Burns / كليبات مكتومة) …")
    flashes = []
    fxc = 0
    for p in placements:
        render_element(p, W, H, R, work, rng)
        if p.transition in ("white_flash", "light_leak"):
            fpath, fdur, fstart = render_flash(p.transition, p.t_start, W, H, R, work, fxc)
            flashes.append((fpath, fdur, fstart)); fxc += 1
    print(f"   • عناصر دِزولڤ/Ken Burns جاهزة، و{len(flashes)} عنصر ومضة/لايت-ليك")

    print("■ بناء مسار الصوت (سبين متواصل + موسيقى مع ducking) …")
    audio = build_audio(base, args.music, info["finale_start"], total, work)

    print("■ [6/6] التركيب النهائي وتصدير H.264 …")
    composite(base, placements, flashes, audio, W, H, R, total, out_mp4, work)

    write_reports(placements, info, base.name, len(mems), out_mp4, work, project_dir)
    od = ffprobe_dur(out_mp4)
    print(f"\n✓ تم: {out_mp4}  ({od:.2f}ث، {W}x{H}@{R})  حجم "
          f"{out_mp4.stat().st_size/1e6:.1f}MB")


if __name__ == "__main__":
    main()
