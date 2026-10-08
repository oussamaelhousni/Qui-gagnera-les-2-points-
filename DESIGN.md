---
name: "Qui gagnera les 2 points ?"
description: "A light classroom quiz stage made for projection."
colors:
  primary: "#5746c5"
  primary-hover: "#4535a6"
  primary-wash: "#eeebfc"
  ground: "#f4f6fc"
  paper: "#ffffff"
  ink: "#222c4d"
  muted: "#56627b"
  line: "#d8deec"
  rail: "#eaeefa"
  gold: "#855700"
  gold-wash: "#fff0c6"
  success: "#15613f"
  success-wash: "#e4f5eb"
  danger: "#a32f3b"
  danger-wash: "#fcebee"
typography:
  display:
    fontFamily: "Barlow, Segoe UI, sans-serif"
    fontSize: "clamp(42px, 4.5vw, 66px)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Barlow, Segoe UI, sans-serif"
    fontSize: "clamp(28px, 2.5vw, 38px)"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Barlow, Segoe UI, sans-serif"
    fontSize: "22px"
    fontWeight: 600
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "17px"
    lineHeight: 1.7
  label:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  control: "10px"
  answer: "14px"
  panel: "20px"
spacing:
  tight: "10px"
  control: "14px"
  section: "20px"
  panel: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "15px 24px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.paper}"
  answer:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.answer}"
    padding: "15px 20px"
  answer-selected:
    backgroundColor: "{colors.gold-wash}"
    textColor: "{colors.ink}"
  answer-correct:
    backgroundColor: "{colors.success-wash}"
    textColor: "{colors.success}"
  answer-incorrect:
    backgroundColor: "{colors.danger-wash}"
    textColor: "{colors.danger}"
---

# Design System: Qui gagnera les 2 points ?

## Overview

**Creative North Star: "Le plateau de classe"**

A light television quiz stage for a teacher operating a projector. The question, answer choices and reveal lead the experience. Small controls recede, while the violet action and active prize step establish a consistent visual anchor.

The surfaces use cool white and pale blue rather than a dark television studio. Prize gold marks anticipation; green and red describe outcomes with explicit text and icons as well as color. Geometry is crisp and intentionally digital.

**Key Characteristics:**

- Large readable questions and answer labels.
- Cool surfaces with navy text and violet actions.
- Gold suspense, labeled success and labeled failure.
- A stable four-answer grid and a sequential prize rail.

## Colors

### Primary

Violet identifies primary actions, the brand and the active prize step. Its darker variant is the hover treatment; the pale wash supports quiet interactions.

### Secondary

Gold indicates the virtual prize and the selected answer before reveal. Success green and error red are semantic outcome colors with matching pale backgrounds.

### Neutral

Cool ground surrounds a white question stage and a blue-tinted prize rail. Navy carries reading text; the muted ink carries supporting instructions; pale lines divide adjacent control groups.

**The Outcome Rule.** Color never carries a result alone: success and failure include a label and a check or cross icon.

## Typography

Barlow Semibold and Bold are bundled locally for headings, answer letters, prizes and the identity. Segoe UI with Arial fallback handles body copy and controls. The compact Barlow proportions make long French questions workable at presentation sizes.

The main display uses the frontmatter scale. Question headlines use a smaller, balanced measure (up to 36 characters); answer text is normally 21px. The prize ladder uses tabular numbers. Supporting controls and instructions are 11–15px and are secondary to the content watched by the classroom.

## Layout

The shell is centered at a maximum width of 1560px with 48px horizontal padding. The desktop layout pairs a flexible stage with a 270px prize rail, separated by 28px. Below 1200px the rail narrows to 230px. Below 760px it follows the stage, and its ladder becomes a two-column list. Below 440px answer choices become a single column.

Desktop viewports at most 800px high use a compact header, tighter vertical gaps, smaller question headings and denser ladder steps. This supports common classroom projection resolutions. Long imported content remains scrollable rather than clipped.

## Elevation & Depth

Tonal separation defines the rail; the white stage has a soft offset shadow (`0 12px 36px -20px #69769c4a`). Dialogs have a stronger soft shadow and a navy translucent backdrop to protect focus during instructions or progress-reset confirmation. Answer plates use borders, without shadows.

## Shapes

Panel corners are softly rounded; controls use the smaller control radius, while answer plates have the answer radius. Small progress markers are circular. All icons are a consistent authored SVG stroke system (1.8px). The geometric points emblem is vector linework, without imitation physical texture.

## Components

### Buttons

The primary action is a solid violet button with white text and an arrow. Secondary actions use transparent backgrounds and pale borders. Hover deepens the primary color or strengthens the secondary surface. Keyboard focus uses a violet outline (3px) with a 5px offset.

### Answers

Four equal answer plates are arranged in two columns on wide screens. Each has a stable A–D label, answer text, and room for a result icon. Gold is selected, dashed red is marked for manual removal, green is correct and red is incorrect. Removed answers preserve grid positions on desktop and are omitted from the narrow mobile layout. Controls keep their DOM identities so selection does not discard focus.

### Jokers

Three compact, labeled buttons pair an SVG or typographic 50:50 mark with their availability. Used jokers have dashed borders and a textual state. Assistance pauses answering; the teacher resumes using the primary action.

### Prize Ladder

A reversed ten-step list places the million at the top. The active question uses a violet field, completed steps gain a check, and a failed step receives a red outcome treatment. Sequence numbers carry actual question order.

### Feedback and Motion

The live feedback region uses a semantic wash and a plain-language instruction. A selected answer pulses for 3.2 seconds of suspense, accompanied by three animated dots. Victory adds a short confetti moment. Reduced motion disables decorative animations without changing the reveal delay or game rules.

## Do's and Don'ts

- **Do** keep the main question and primary pacing action easy to locate.
- **Do** keep projector-facing content on light, high-contrast surfaces.
- **Do** combine outcome colors with explicit wording and icons.
- **Do** preserve keyboard focus, disabled states and reduced-motion behavior.
- **Don't** communicate a correct answer or used joker by color alone.
- **Don't** describe the virtual prize as real money or award points on intermediate questions.
- **Don't** clip imported question text to enforce a fixed viewport height.
