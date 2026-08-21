import { BIBLE } from "./bible.js";

/**
 * Prompt templates. The structure comes from the AI-influencer guide;
 * the content is injected from the locked bible so a prompt cannot
 * contradict the character. Engine-neutral by design — see docs/DECISIONS.md.
 */
export const PROMPTS = [
  {
    id: "anchor", he: "עוגן זהות", src: "המדריך · שלב 2 + מראה קבוע",
    text: `Create a photorealistic female digital influencer character.
Age: ${BIBLE.age}
Appearance: ${BIBLE.lookEn}.
Personality: calm, confident, observant, understated, quietly magnetic.
Style: luxury hotel and travel creator; wardrobe in black, cream, hotel white, deep burgundy, muted gold, charcoal; delicate gold jewellery only, no visible logos.
Photography: natural iPhone-style capture, real daylight, slightly imperfect composition, natural skin texture, subtle film grain.
The character must have a highly recognizable and repeatable identity.
Avoid: plastic skin, beauty filters, doll-like appearance, distorted hands, extra fingers, inconsistent facial features, unrealistic anatomy, neon or saturated colours.`,
  },
  {
    id: "scene", he: "החלפת סצנה מול רפרנס", src: "המדריך · שלב 3",
    text: `Use the reference character as the exact identity anchor.
Keep: facial identity, freckle placement, eye shape, hair length and colour, skin tone, body proportions.
Change only:
Location: [לובי / סוויטה / בר / מרפסת / מסדרון קומה 7]
Outfit: [לפי טבלת הלבוש — בוקר / יום / ערב / כושר]
Pose: [תיאור אחד, טבעי]
Lighting: [בוקר רך / שעת זהב / תאורת לילה חמה]
Single visual clue in frame: [סמל אחד בלבד]
Photography: natural, social-native, 4:5, shallow but realistic depth of field, real skin texture.
The character must remain clearly recognizable as the same person.`,
  },
  {
    id: "motion", he: "תנועה לווידאו", src: "המדריך · שלב 5",
    text: `Subject: the reference character, unchanged identity throughout.
Action: one continuous natural action — [תיאור], ending before any explanation.
Environment: [מיקום, עקבי עם הרצף של אותו יום]
Camera: slow push-in, natural handheld micro-movement, medium to close-up.
Lighting: [תואם לשעת היום בסצנה]
Motion: natural body movement, realistic hair movement, subtle facial expression arc — settle, notice, hold.
Emotion: calm, unhurried, quietly aware of the camera.
Timing: 8s. Beat 1 stillness, beat 2 the notice, beat 3 the cut.
Maintain exact character identity. No facial morphing, no body distortion, no unnatural hand movement, no frozen mannequin face.`,
  },
  {
    id: "script", he: "תסריט 20 שניות", src: "המדריך · שלב 6 + צורת דיבור",
    text: `Write a 20 second social script for Romy Vane.
Audience: US, adults following luxury travel and slow mystery storytelling.
Voice: short spoken sentences, low and calm, slightly slow, dry humour, never explains the joke, never sounds like an ad, almost no emojis.
Structure:
0-3s   one line that works with sound off
3-12s  one concrete observation, no lesson
12-17s the unresolved detail
17-20s cut before the explanation, or one direct question
Do not beg for follows. Do not use more than two hashtags.`,
  },
];
