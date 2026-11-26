import { greekToClassicalIpa, greekToElevenLabsIpa } from "./greek-ipa.ts";
import type { Lesson3CourseAudioAsset } from "./lesson3-assets.ts";
export const lesson23And24VocabularyAudio: Readonly<Record<string, { label: string; greek: string }>> = {
  "lesson23-v1": {
    "label": "ὁράω, ὄψομαι, εἶδον, ἑόρακα / ἑώρακα, ἑώραμαι / ὦμμαι",
    "greek": "ὁράω, ὄψομαι, εἶδον, ἑόρακα / ἑώρακα, ἑώραμαι / ὦμμαι"
  },
  "lesson23-v2": {
    "label": "ἔτος, -ους, τό",
    "greek": "ἔτος, -ους, τό"
  },
  "lesson23-v3": {
    "label": "ἡμέρᾱ, -ᾱς, ἡ",
    "greek": "ἡμέρᾱ, -ᾱς, ἡ"
  },
  "lesson23-v4": {
    "label": "νύξ, νυκτός, ἡ",
    "greek": "νύξ, νυκτός, ἡ"
  },
  "lesson23-v5": {
    "label": "χρόνος, -ου, ὁ",
    "greek": "χρόνος, -ου, ὁ"
  },
  "lesson23-v6": {
    "label": "ὅς, ἥ, ὅ",
    "greek": "ὅς, ἥ, ὅ"
  },
  "lesson23-v7": {
    "label": "πᾶς, πᾶσα, πᾶν",
    "greek": "πᾶς, πᾶσα, πᾶν"
  },
  "lesson23-v8": {
    "label": "σήμερον",
    "greek": "σήμερον"
  },
  "lesson23-v9": {
    "label": "ἀμφί (ἀμφ᾽)",
    "greek": "ἀμφί (ἀμφ᾽)"
  },
  "lesson23-v10": {
    "label": "ἀνά (ἀν᾽)",
    "greek": "ἀνά (ἀν᾽)"
  },
  "lesson23-v11": {
    "label": "ἕως",
    "greek": "ἕως"
  },
  "lesson24-v1": {
    "label": "καλέω, καλῶ, ἐκάλεσα, κέκληκα, κέκλημαι",
    "greek": "καλέω, καλῶ, ἐκάλεσα, κέκληκα, κέκλημαι"
  },
  "lesson24-v2": {
    "label": "δεῖπνον, -ου, τό",
    "greek": "δεῖπνον, -ου, τό"
  },
  "lesson24-v3": {
    "label": "ἐλπίς, -ίδος, ἡ",
    "greek": "ἐλπίς, -ίδος, ἡ"
  },
  "lesson24-v4": {
    "label": "θύρᾱ, -ᾱς, ἡ",
    "greek": "θύρᾱ, -ᾱς, ἡ"
  },
  "lesson24-v5": {
    "label": "ξενίᾱ, -ᾱς, ἡ",
    "greek": "ξενίᾱ, -ᾱς, ἡ"
  },
  "lesson24-v6": {
    "label": "ξένος, -ου, ὁ",
    "greek": "ξένος, -ου, ὁ"
  },
  "lesson24-v7": {
    "label": "ἄνευ",
    "greek": "ἄνευ"
  },
  "lesson24-v8": {
    "label": "ἅτε",
    "greek": "ἅτε"
  },
  "lesson24-v9": {
    "label": "καίπερ",
    "greek": "καίπερ"
  },
  "lesson24-v10": {
    "label": "ὡς",
    "greek": "ὡς"
  }
};
const charts = [
  {
    "id": "lesson23-chart-relative-pronoun-singular",
    "label": "Relative Pronoun Forms — Singular",
    "columns": [
      [
        "ὅς",
        "οὗ",
        "ᾧ",
        "ὅν"
      ],
      [
        "ἥ",
        "ἧς",
        "ᾗ",
        "ἥν"
      ],
      [
        "ὅ",
        "οὗ",
        "ᾧ",
        "ὅ"
      ]
    ]
  },
  {
    "id": "lesson23-chart-relative-pronoun-plural",
    "label": "Relative Pronoun Forms — Plural",
    "columns": [
      [
        "οἵ",
        "ὧν",
        "οἷς",
        "οὕς"
      ],
      [
        "αἵ",
        "ὧν",
        "αἷς",
        "ἅς"
      ],
      [
        "ἅ",
        "ὧν",
        "οἷς",
        "ἅ"
      ]
    ]
  },
  {
    "id": "lesson23-chart-pas-singular",
    "label": "πᾶς Forms — Singular",
    "columns": [
      [
        "πᾶς",
        "παντός",
        "παντί",
        "πάντα"
      ],
      [
        "πᾶσα",
        "πάσης",
        "πάσῃ",
        "πᾶσαν"
      ],
      [
        "πᾶν",
        "παντός",
        "παντί",
        "πᾶν"
      ]
    ]
  },
  {
    "id": "lesson23-chart-pas-plural",
    "label": "πᾶς Forms — Plural",
    "columns": [
      [
        "πάντες",
        "πάντων",
        "πᾶσιν",
        "πάντας"
      ],
      [
        "πᾶσαι",
        "πασῶν",
        "πάσαις",
        "πάσᾱς"
      ],
      [
        "πάντα",
        "πάντων",
        "πᾶσιν",
        "πάντα"
      ]
    ]
  },
  {
    "id": "lesson24-chart-present-second-aorist-active-participle-singular",
    "label": "Present / Second Aorist Active Participle Endings — Singular",
    "columns": [
      [
        "ων",
        "οντος",
        "οντι",
        "οντα"
      ],
      [
        "ουσα",
        "ουσης",
        "ουσῃ",
        "ουσαν"
      ],
      [
        "ον",
        "οντος",
        "οντι",
        "ον"
      ]
    ]
  },
  {
    "id": "lesson24-chart-present-second-aorist-active-participle-plural",
    "label": "Present / Second Aorist Active Participle Endings — Plural",
    "columns": [
      [
        "οντες",
        "οντων",
        "ουσιν",
        "οντας"
      ],
      [
        "ουσαι",
        "ουσῶν",
        "ουσαις",
        "ουσᾱς"
      ],
      [
        "οντα",
        "οντων",
        "ουσιν",
        "οντα"
      ]
    ]
  },
  {
    "id": "lesson24-chart-future-active-participle-singular",
    "label": "Future Active Participle Endings — Singular",
    "columns": [
      [
        "σων",
        "σοντος",
        "σοντι",
        "σοντα"
      ],
      [
        "σουσα",
        "σουσης",
        "σουσῃ",
        "σουσαν"
      ],
      [
        "σον",
        "σοντος",
        "σοντι",
        "σον"
      ]
    ]
  },
  {
    "id": "lesson24-chart-future-active-participle-plural",
    "label": "Future Active Participle Endings — Plural",
    "columns": [
      [
        "σοντες",
        "σοντων",
        "σουσιν",
        "σοντας"
      ],
      [
        "σουσαι",
        "σουσῶν",
        "σουσαις",
        "σουσᾱς"
      ],
      [
        "σοντα",
        "σοντων",
        "σουσιν",
        "σοντα"
      ]
    ]
  },
  {
    "id": "lesson24-chart-first-aorist-active-participle-singular",
    "label": "First Aorist Active Participle Endings — Singular",
    "columns": [
      [
        "σᾱς",
        "σαντος",
        "σαντι",
        "σαντα"
      ],
      [
        "σᾱσα",
        "σᾱσης",
        "σᾱσῃ",
        "σᾱσαν"
      ],
      [
        "σαν",
        "σαντος",
        "σαντι",
        "σαν"
      ]
    ]
  },
  {
    "id": "lesson24-chart-first-aorist-active-participle-plural",
    "label": "First Aorist Active Participle Endings — Plural",
    "columns": [
      [
        "σαντες",
        "σαντων",
        "σᾱσιν",
        "σαντας"
      ],
      [
        "σᾱσαι",
        "σᾱσῶν",
        "σᾱσαις",
        "σᾱσᾱς"
      ],
      [
        "σαντα",
        "σαντων",
        "σᾱσιν",
        "σαντα"
      ]
    ]
  },
  {
    "id": "lesson24-chart-perfect-active-participle-singular",
    "label": "Perfect Active Participle Endings — Singular",
    "columns": [
      [
        "κώς",
        "κότος",
        "κότι",
        "κότα"
      ],
      [
        "κυῖα",
        "κυίᾱς",
        "κυίᾳ",
        "κυῖαν"
      ],
      [
        "κός",
        "κότος",
        "κότι",
        "κός"
      ]
    ]
  },
  {
    "id": "lesson24-chart-perfect-active-participle-plural",
    "label": "Perfect Active Participle Endings — Plural",
    "columns": [
      [
        "κότες",
        "κότων",
        "κόσιν",
        "κότας"
      ],
      [
        "κυῖαι",
        "κυιῶν",
        "κυίαις",
        "κυίᾱς"
      ],
      [
        "κότα",
        "κότων",
        "κόσιν",
        "κότα"
      ]
    ]
  },
  {
    "id": "lesson24-chart-eimi-present-participle-singular",
    "label": "Present Participle of εἰμί — Singular",
    "columns": [
      [
        "ὤν",
        "ὄντος",
        "ὄντι",
        "ὄντα"
      ],
      [
        "οὖσα",
        "οὔσης",
        "οὔσῃ",
        "οὖσαν"
      ],
      [
        "ὄν",
        "ὄντος",
        "ὄντι",
        "ὄν"
      ]
    ]
  },
  {
    "id": "lesson24-chart-eimi-present-participle-plural",
    "label": "Present Participle of εἰμί — Plural",
    "columns": [
      [
        "ὄντες",
        "ὄντων",
        "οὖσιν",
        "ὄντας"
      ],
      [
        "οὖσαι",
        "οὐσῶν",
        "οὔσαις",
        "οὔσᾱς"
      ],
      [
        "ὄντα",
        "ὄντων",
        "οὖσιν",
        "ὄντα"
      ]
    ]
  }
];
export const lesson23And24CourseAudioAssets: readonly Lesson3CourseAudioAsset[] = charts.map(chart => ({id: chart.id, label: chart.label, canonicalIpa: greekToClassicalIpa(chart.columns.flat().join(", ")), ttsText: chart.columns.map(col => col.map(greekToElevenLabsIpa).filter(Boolean).join(", ")).filter(Boolean).join(" [pause] ")}));
