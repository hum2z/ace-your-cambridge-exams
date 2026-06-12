# AceurExam brand assets

## `aceurexam_linkedin_banner.png`
LinkedIn banner, **1584 × 396 px** (LinkedIn's recommended profile-cover ratio).
Built to match the website: warm-dark palette (`#14110e` / cream `#f1ead9` / orange
`#ef5a2b`), Fraunces serif headline, Inter body, JetBrains Mono labels, the `✺`
starburst mark, and a miniature of the homepage "workspace console".

## Regenerating (`make_banner.py`)
Needs Pillow and three fonts placed in the folder referenced by `FONTS` in the script:

- **Fraunces** — `Fraunces[...].ttf` + `Fraunces-Italic[...].ttf` (Google Fonts, OFL)
- **Inter** — `Inter[opsz,wght].ttf` (Google Fonts, OFL)
- **JetBrains Mono** — `JetBrainsMono[wght].ttf` (Google Fonts, OFL)

```bash
pip install Pillow
python make_banner.py   # writes the PNG
```
