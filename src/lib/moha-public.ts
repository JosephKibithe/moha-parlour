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
  phoneE164: "",
  locationName: "   Lower Kabete",
  locationDetail: "near the shopping centre",
  mapsUrl: "https://maps.app.goo.gl/j7sE7hYd178174aP8",
  instagramUrl: "https://www.instagram.com/moha_beautystudio/",

  /*
   * Add real service photos later.
   * The key must match the exact service name in Admin > Services.
   *
   * Example:
   * "Gel manicure": "/images/services/gel-manicure.jpg",
   */
  serviceImages: {} as Record<string, string>,

  /*
   * Add your best real nail-set photos here later.
   * The gallery stays hidden until at least one photo is added.
   *
   * Example:
   * {
   *   title: "Soft glam extensions",
   *   subtitle: "Acrylic set",
   *   image: "/images/gallery/look-1.jpg",
   * },
   */
  featuredLooks: [] as MohaGalleryItem[],
};
