export const DEFAULT_CAPABILITIES: Record<string, boolean> = {
  black_white: true,
  color: false,
  single_sided: true,
  back_to_back_auto: false,
  back_to_back_manual: true,
  a4: true,
  a3: false,
  glossy_paper: false,
  plain_paper: true,
  auto_orientation: true,
  portrait: true,
  landscape: true,
  multiple_copies: true,
  page_selection: true,
  fit_to_page: true,
  actual_size: true,
  collated_printing: true,
  pages_per_sheet: false,
  // Advanced
  a5: false,
  b4: false,
  b5: false,
  letter: false,
  legal: false,
  draft_quality: false,
  high_quality: false,
  resolution_dpi: false,
  long_edge_binding: false,
  short_edge_binding: false,
  reverse_order: false,
  mirror: false,
  // Physical
  custom_dimensions: false,
  matte_paper: false,
  photo_paper: false,
  bond_paper: false,
  cardstock: false,
  labels: false,
  envelopes: false,
  borderless_printing: false,
  stapling: false,
  hole_punching: false,
  folding: false,
  booklet_finishing: false,
  binding: false,
  cutting: false,
  output_bin_selection: false,
};

export const CAPABILITY_GROUPS: { key: string; label: string }[][] = [
  [
    { key: "black_white", label: "Black & White" },
    { key: "color", label: "Colour" },
    { key: "single_sided", label: "Single-sided" },
  ],
  [
    { key: "back_to_back_auto", label: "Back-to-Back · Automatic" },
    { key: "back_to_back_manual", label: "Back-to-Back · Manual" },
    { key: "a4", label: "A4" },
  ],
  [
    { key: "a3", label: "A3" },
    { key: "glossy_paper", label: "Glossy paper" },
    { key: "plain_paper", label: "Plain paper" },
  ],
  [
    { key: "auto_orientation", label: "Auto orientation" },
    { key: "portrait", label: "Portrait" },
    { key: "landscape", label: "Landscape" },
  ],
  [
    { key: "multiple_copies", label: "Multiple copies" },
    { key: "page_selection", label: "Page selection" },
    { key: "fit_to_page", label: "Fit to page" },
  ],
  [
    { key: "actual_size", label: "Actual size" },
    { key: "collated_printing", label: "Collated printing" },
    { key: "pages_per_sheet", label: "Pages per sheet" },
  ],
];

export const ADVANCED_CAPABILITY_GROUPS: { key: string; label: string }[][] = [
  [
    { key: "a5", label: "A5" },
    { key: "b4", label: "B4" },
    { key: "b5", label: "B5" },
  ],
  [
    { key: "letter", label: "Letter" },
    { key: "legal", label: "Legal" },
    { key: "draft_quality", label: "Draft quality" },
  ],
  [
    { key: "high_quality", label: "High quality" },
    { key: "resolution_dpi", label: "Resolution / DPI" },
    { key: "long_edge_binding", label: "Long-edge binding" },
  ],
  [
    { key: "short_edge_binding", label: "Short-edge binding" },
    { key: "reverse_order", label: "Reverse order" },
    { key: "mirror", label: "Mirror" },
  ],
];

export const PHYSICAL_CAPABILITY_GROUPS: { key: string; label: string }[][] = [
  [
    { key: "custom_dimensions", label: "Custom dimensions" },
    { key: "matte_paper", label: "Matte paper" },
    { key: "photo_paper", label: "Photo paper" },
  ],
  [
    { key: "bond_paper", label: "Bond paper" },
    { key: "cardstock", label: "Cardstock" },
    { key: "labels", label: "Labels" },
  ],
  [
    { key: "envelopes", label: "Envelopes" },
    { key: "borderless_printing", label: "Borderless printing" },
    { key: "stapling", label: "Stapling" },
  ],
  [
    { key: "hole_punching", label: "Hole punching" },
    { key: "folding", label: "Folding" },
    { key: "booklet_finishing", label: "Booklet finishing" },
  ],
  [
    { key: "binding", label: "Binding" },
    { key: "cutting", label: "Cutting" },
    { key: "output_bin_selection", label: "Output-bin selection" },
  ],
];
