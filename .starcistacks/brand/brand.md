# starci-next brand

The sheet every design and image brief of starci-next reads first (contexts/project/brand.md PROJECT-BRAND-1, 3). It is the app's own: edit it.
Replace each `TODO(brand)`. Name a colour by its token, never by a value.

## Name

- Product name: StarCi Next
- Spoken as: StarCi Next, always two capitalised words

## Brand colour tokens

The tokens are the app's own, in its theme file (`fe/apps/app/src/modules/brand/brand.css`). List the names only.

| role | token | use |
|---|---|---|
| brand | `--accent` | the one brand colour: primary actions, the accent of an illustration and the colour of the Next helper chip |
| brand, soft | `--accent-soft`, `--accent-soft-foreground` | the soft tint and its foreground, for a surface held by the brand |
| neutral | `--default`, `--surface-secondary` | the grey and the cream an illustration may add to the brand colour |

The owner's direction for these tokens is the Work record `.starciwork/brand/index.yaml`; this table points at it and copies nothing from it.

## Illustration

Flat editorial style, a plain scene by default. The Next helper (a small violet chip with a simple face) is optional and appears only when the subject asks for it; each picture shows one literal scene that means one thing; see `illustration.md` (v3, 2026-11-24).

## Voice and tone

- Voice: a mentor speaks to a learner who builds real backend systems
- Tone: clear, direct, encouraging; never salesy or playful about mistakes
- Language of the copy: Vietnamese first, English second
