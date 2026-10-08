# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Plain HTML, CSS and JavaScript, explicitly requested by the user. No backend or build step.

## Users

A teacher operating a quiz on a computer and students watching through a classroom projector. The teacher chooses the participating student in person.

## Product Purpose

A French-language, Millionaire-style classroom game with ten increasingly difficult questions, four answers per question, suspense and sounds.

## Operating Context

The teacher clicks the selected answer, reveals the result and explicitly advances each question. A wrong answer ends the attempt. The fictional prize ladder reaches one million; completing all ten questions correctly awards two classroom points in total.

## Capabilities and Constraints

- Ten questions provided through a JSON file; actual questions are pending.
- Clearly identified demonstration questions until the real file is provided.
- Three once-per-attempt lifelines: teacher assistance, friend/class assistance, and teacher-controlled removal of two answers (50/50).
- Human assistance happens in the classroom; no simulated voting or random suggestions.
- French controls and copy, large text, light projector-friendly surfaces.
- Teacher-controlled pacing with a short suspense reveal.
- No supplied sound files; generate sound effects locally in JavaScript.

## Brand Commitments

Inspired by the real Millionaire quiz format. User's name idea is “man sayarbah deux point”; French display name inferred as “Qui gagnera les 2 points ?”. Light colors are binding.

## Evidence on Hand

No existing code, questions or audio assets. Demonstration questions are author-created and must be identified as examples.

## Product Principles

- Make the question and four possible answers legible from the back of a classroom.
- Leave pacing and lifeline assistance in the teacher's hands.
- Separate the virtual million from the two real classroom points awarded only on full success.
- Keep operation simple and independent of external services.
