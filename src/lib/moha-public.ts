export type MohaGalleryItem = {
  title: string;
  subtitle?: string;
  image: string;
};

export const mohaPublic = {
  name: "MOHA",
  label: "MOHA NAIL PARLOUR",

  heroTitle: "Nails that feel like you.",
  heroDescription:
    "Clean finishes, beautiful details, and nail sets made for your style.",

  // Replace these before launch.
  phoneDisplay: "0783046015",
  phoneE164: "+254783046015",
  locationName: "   Lower Kabete",
  locationDetail: "near the shopping centre",
  mapsUrl: "https://maps.app.goo.gl/XJjHwJq8X38d7XJk9",
  instagramUrl: "https://www.instagram.com/moha_beautystudio/",

  /*
   * Add real service photos later.
   * The key must match the exact service name in Admin > Services.
   *
   * Example:
   * "Gel manicure": "/images/services/gel-manicure.jpg",
   */
  serviceImages: {
    "Gel manicure": "/images/services/gel-manicure.jpg",
    "Acrylic overlay": "/images/services/acrylic-overlay.jpg",
    "Short acrylic extensions": "/images/services/short-acrylic.jpg",
  },

  featuredLooks: [
    {
      title: "Soft chrome almond",
      subtitle: "Acrylic extensions",
      image: "/images/gallery/chrome-almond.jpg",
    },
    {
      title: "Clean French tips",
      subtitle: "Gel manicure",
      image: "/images/gallery/french-tips.jpg",
    },
    {
      title: "Soft glam nude set",
      subtitle: "Signature MOHA look",
      image: "/images/gallery/soft-glam.jpg",
    },
  ],
};
