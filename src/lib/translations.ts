export type Language = "en" | "sw";

export const translations = {
  en: {
    // Top Bar & Nav
    siteName: "Sokonyumbani",
    tagline: "Local Market",
    searchPlaceholder: "Search furniture, livestock, tools, vehicles, services...",
    allCounties: "All Kenya",
    postAd: "Post an Ad",
    myDashboard: "My Dashboard",
    adminPanel: "Admin Panel",
    safetyTips: "Safety Guide",
    marketInquiry: "Market Inquiry",
    signIn: "Sign In",
    signOut: "Sign Out",
    wallet: "Wallet",
    favorites: "Favorites",
    referrals: "Refer & Earn",
    notifications: "Notifications",

    // Categories
    homeLiving: "Home & Living",
    furnitureClothing: "Furniture & Clothing",
    machineryTools: "Machinery & Tools",
    animalFarm: "Animal & Farm Produce",

    // Listing Types
    forSale: "For Sale",
    forHire: "For Hire",
    serviceSkill: "Service / Skill",
    donation: "Donation",

    // Actions
    contactSeller: "Contact Seller",
    callSeller: "Call Seller",
    chatWithSeller: "Chat with Seller",
    makeOffer: "Make an Offer",
    payWithEscrow: "Buy with Escrow",
    escrowGuarantee: "Escrow Protection: Money released to seller ONLY after you confirm delivery.",
    deliveryAvailable: "Delivery Available",
    saveSearch: "Save Search",
    verifiedSeller: "Verified Seller",
    phoneVerified: "Phone Verified",
    reportListing: "Report Listing",
    share: "Share",
    followSeller: "Follow Seller",
    following: "Following",

    // Escrow & Delivery
    deliveryOptions: "Delivery & Courier Options",
    deliveryFee: "Estimated Delivery Fee",
    selectCourier: "Select Courier Partner",
    confirmDelivery: "Confirm Delivery & Release Funds",
    openDispute: "Report Issue / Open Dispute",

    // Seller Tools
    sellerAnalytics: "Seller Analytics",
    totalViews: "Listing Views",
    contactClicks: "Contact / Call Clicks",
    conversionRate: "Conversion Rate",
    daysRemaining: "Days until expiry",
    renewAd: "Renew for 30 Days",
  },
  sw: {
    // Top Bar & Nav
    siteName: "Sokonyumbani",
    tagline: "Soko la Nyumbani",
    searchPlaceholder: "Tafuta samani, mifugo, vifaa, magari, au mafundi...",
    allCounties: "Kaunti Zote Kenya",
    postAd: "Weka Tangazo",
    myDashboard: "Dashibodi Yangu",
    adminPanel: "Paneli ya Msimamizi",
    safetyTips: "Mwongozo wa Usalama",
    marketInquiry: "Uchunguzi wa Soko",
    signIn: "Ingia",
    signOut: "Toka",
    wallet: "Pochi",
    favorites: "Vipendwa Vyangu",
    referrals: "Alika na Upate Pesa",
    notifications: "Taarifa",

    // Categories
    homeLiving: "Vifaa vya Nyumbani",
    furnitureClothing: "Samani na Mavazi",
    machineryTools: "Mashine na Zana",
    animalFarm: "Mifugo na Mazao ya Shamba",

    // Listing Types
    forSale: "Kuuza",
    forHire: "Kukodisha",
    serviceSkill: "Ujuzi / Fundi",
    donation: "Mchango / Msaada",

    // Actions
    contactSeller: "Wasiliana na Muuzaji",
    callSeller: "Piga Simu",
    chatWithSeller: "Tuma Ujumbe",
    makeOffer: "Tuma Ofa Yako",
    payWithEscrow: "Nunua kwa Escrow (Salama)",
    escrowGuarantee: "Ulinzi wa Escrow: Pesa zitalipwa kwa muuzaji BAADA TU ya kupokea na kukagua bidhaa.",
    deliveryAvailable: "Usafirishaji Unapatikana",
    saveSearch: "Hifadhi Utafutaji",
    verifiedSeller: "Muuzaji Aliyethibitishwa",
    phoneVerified: "Nambari Imethibitishwa",
    reportListing: "Ripoti Tangazo Hili",
    share: "Sambaza",
    followSeller: "Fuata Muuzaji",
    following: "Unamfuata",

    // Escrow & Delivery
    deliveryOptions: "Chaguo za Usafirishaji",
    deliveryFee: "Gharama ya Usafiri",
    selectCourier: "Chagua Kampuni ya Usafirishaji",
    confirmDelivery: "Thibitisha Umepokea (Lipa Muuzaji)",
    openDispute: "Ripoti Tatizo / Fungua Mgogoro",

    // Seller Tools
    sellerAnalytics: "Takwimu za Mauzo",
    totalViews: "Watazamaji wa Tangazo",
    contactClicks: "Mibofyo ya Simu / WhatsApp",
    conversionRate: "Kiwango cha Mafanikio",
    daysRemaining: "Siku zilizosalia",
    renewAd: "Ongeza Siku 30",
  },
} as const;

export type TranslationKey = keyof typeof translations["en"];
