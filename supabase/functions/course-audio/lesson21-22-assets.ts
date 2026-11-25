import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";
export const lesson21And22VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson21-v1": {
    "label": "ἀποθνῄσκω, ἀποθανοῦμαι, ἀπέθανον, τέθνηκα",
    "greek": "ἀποθνῄσκω, ἀποθανοῦμαι, ἀπέθανον, τέθνηκα"
  },
  "lesson21-v2": {
    "label": "ἀποκτείνω, ἀποκτενῶ, ἀπέκτεινα, ἀπέκτονα",
    "greek": "ἀποκτείνω, ἀποκτενῶ, ἀπέκτεινα, ἀπέκτονα"
  },
  "lesson21-v3": {
    "label": "φοβέω, φοβήσω, ἐφόβησα, πεφόβηκα, πεφόβημαι",
    "greek": "φοβέω, φοβήσω, ἐφόβησα, πεφόβηκα, πεφόβημαι"
  },
  "lesson21-v4": {
    "label": "φόβος, -ου, ὁ",
    "greek": "φόβος"
  },
  "lesson21-v5": {
    "label": "τίς, τί",
    "greek": "τίς, τί"
  },
  "lesson21-v6": {
    "label": "τις, τι",
    "greek": "τις, τι"
  },
  "lesson21-v7": {
    "label": "τινὲς μὲν ... τινὲς δέ",
    "greek": "τινὲς μὲν ... τινὲς δέ"
  },
  "lesson21-v8": {
    "label": "ἐμός, -ή, -όν",
    "greek": "ἐμός"
  },
  "lesson21-v9": {
    "label": "ἡμέτερος, -ᾱ, -ον",
    "greek": "ἡμέτερος"
  },
  "lesson21-v10": {
    "label": "σός, -ή, -όν",
    "greek": "σός"
  },
  "lesson21-v11": {
    "label": "ὑμέτερος, -ᾱ, -ον",
    "greek": "ὑμέτερος"
  },
  "lesson21-v12": {
    "label": "τί",
    "greek": "τί"
  },
  "lesson22-v1": {
    "label": "ἄγω, ἄξω, ἤγαγον, ἦχα, ἦγμαι",
    "greek": "ἄγω, ἄξω, ἤγαγον, ἦχα, ἦγμαι"
  },
  "lesson22-v2": {
    "label": "νόμος, -ου, ὁ",
    "greek": "νόμος"
  },
  "lesson22-v3": {
    "label": "ψῡχή, -ῆς, ἡ",
    "greek": "ψῡχή"
  },
  "lesson22-v4": {
    "label": "ἄλλος, -η, -ο",
    "greek": "ἄλλος"
  },
  "lesson22-v5": {
    "label": "ζῷον, -ου, τό",
    "greek": "ζῷον"
  },
  "lesson22-v6": {
    "label": "παρά (παρ᾽) (+ gen., dat., acc.)",
    "greek": "παρά (παρ᾽) (+ gen., dat., acc.)"
  },
  "lesson22-v7": {
    "label": "τε (τ᾽, θ᾽)",
    "greek": "τε (τ᾽, θ᾽)"
  },
  "lesson22-v8": {
    "label": "τε ... καί / τε ... τε",
    "greek": "τε ... καί / τε ... τε"
  },
  "lesson22-v9": {
    "label": "οὐδέ (οὐδ᾽) / μηδέ (μηδ᾽)",
    "greek": "οὐδέ (οὐδ᾽) / μηδέ (μηδ᾽)"
  },
  "lesson22-v10": {
    "label": "οὐδὲ ... οὐδέ / μηδὲ ... μηδέ",
    "greek": "οὐδὲ ... οὐδέ / μηδὲ ... μηδέ"
  },
  "lesson22-v11": {
    "label": "οὔτε (οὔτ᾽, οὔθ᾽) / μήτε (μήτ᾽, μήθ᾽)",
    "greek": "οὔτε (οὔτ᾽, οὔθ᾽) / μήτε (μήτ᾽, μήθ᾽)"
  },
  "lesson22-v12": {
    "label": "οὔτε ... οὔτε / μήτε ... μήτε",
    "greek": "οὔτε ... οὔτε / μήτε ... μήτε"
  }
};
const charts = [
  {
    "id": "lesson21-chart-interrogative-pronoun",
    "label": "Interrogative Pronoun Forms",
    "columns": [
      [
        "τίς",
        "τίνος, τοῦ",
        "τίνι, τῷ",
        "τίνα",
        "τίνες",
        "τίνων",
        "τίσιν",
        "τίνας"
      ],
      [
        "τί",
        "τίνος, τοῦ",
        "τίνι, τῷ",
        "τί",
        "τίνα",
        "τίνων",
        "τίσιν",
        "τίνα"
      ]
    ]
  },
  {
    "id": "lesson21-chart-indefinite-pronoun",
    "label": "Indefinite Pronoun Forms",
    "columns": [
      [
        "τις",
        "τινος, του",
        "τινι, τῳ",
        "τινα",
        "τινες",
        "τινῶν",
        "τισιν",
        "τινας"
      ],
      [
        "τι",
        "τινος, του",
        "τινι, τῳ",
        "τι",
        "τινα, ἄττα",
        "τινῶν",
        "τισιν",
        "τινα, ἄττα"
      ]
    ]
  },
  {
    "id": "lesson22-chart-perfect-middle-passive-indicative",
    "label": "Perfect Middle/Passive Indicative Endings",
    "columns": [
      [
        "μαι",
        "σαι",
        "ται"
      ],
      [
        "μεθα",
        "σθε",
        "νται"
      ]
    ]
  },
  {
    "id": "lesson22-chart-perfect-middle-passive-infinitive",
    "label": "Perfect Middle/Passive Infinitive Endings",
    "columns": [
      [
        "σθαι"
      ]
    ]
  },
  {
    "id": "lesson22-chart-pluperfect-middle-passive-indicative",
    "label": "Pluperfect Middle/Passive Indicative Endings",
    "columns": [
      [
        "μην",
        "σο",
        "το"
      ],
      [
        "μεθα",
        "σθε",
        "ντο"
      ]
    ]
  }
];
export const lesson21And22CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = charts.map(chart => ({
  id: chart.id,
  label: chart.label,
  canonicalIpa: greekToClassicalIpa(chart.columns.flat().join(", ")),
  ttsText: chart.columns.map(col => col.map(greekToElevenLabsIpa).filter(Boolean).join(" ")).filter(Boolean).join(" [pause] "),
}));
