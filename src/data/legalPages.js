export const LEGAL_NAV = [
  { label: "Terms and Conditions", to: "/terms" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Return & Refund Policy", to: "/refund-policy" },
  { label: "Shipping Policy", to: "/shipping-policy" },
];

const CONTACT_LINES = [
  "Ashwini Natural Products",
  "Email: hello@ashwinibynatural.com",
  "Phone: 6363250586",
  "Address: Rajarajeshwari Nagar, Bengaluru, Karnataka, 560098",
];

export const LEGAL_PAGES = {
  terms: {
    slug: "terms",
    label: "Legal",
    title: "Terms and Conditions",
    intro:
      "Please read these terms carefully before using our website or placing an order.",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        paragraphs: [
          "By accessing or using the website https://nimmaashwini.com/, you agree to be bound by these Terms and Conditions.",
        ],
      },
      {
        heading: "2. User Conduct",
        paragraphs: [
          "You agree not to engage in any activity that disrupts or interferes with the functioning of the website or its services.",
        ],
      },
      {
        heading: "3. Intellectual Property",
        paragraphs: [
          "All content and materials available on the website are protected by intellectual property laws.",
        ],
      },
      {
        heading: "4. Limitation of Liability",
        paragraphs: [
          "Nimma Ashwini shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or use of the website.",
        ],
      },
      {
        heading: "5. Indemnification",
        paragraphs: [
          "You agree to indemnify and hold Nimma Ashwini harmless from any claims.",
        ],
      },
      {
        heading: "6. Governing Law",
        paragraphs: [
          "These Terms and Conditions shall be governed by and construed in accordance with the laws of India.",
        ],
      },
      {
        heading: "7. Contact Information",
        paragraphs: CONTACT_LINES,
      },
      {
        heading: "8. Ownership",
        paragraphs: ["Ashwini Natural Products"],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    label: "Legal",
    title: "Privacy Policy",
    intro:
      "This policy explains how we collect, use, and protect your personal information.",
    sections: [
      {
        heading: "1. Information We Collect",
        paragraphs: [
          "We collect personal information—such as your name, email address, and payment details—when you place an order, register an account, or sign up for our newsletter.",
        ],
      },
      {
        heading: "2. How We Use Your Information",
        paragraphs: [
          "We use the collected information to process your transactions, communicate with you regarding your orders, respond to customer service requests, and continuously improve our products and services.",
        ],
      },
      {
        heading: "3. Cookies",
        paragraphs: [
          "We utilize cookies and similar tracking technologies to personalize content, analyze our website traffic, and enhance your overall browsing experience. You can manage your cookie preferences through your browser settings.",
        ],
      },
      {
        heading: "4. Data Security",
        paragraphs: [
          "We implement robust technical and organizational precautions to protect your personal information both online and offline against unauthorized access, alteration, or disclosure.",
        ],
      },
      {
        heading: "5. Changes to This Privacy Policy",
        paragraphs: [
          "We reserve the right to update or modify this Privacy Policy at any time. Any changes will become effective immediately upon posting the updated policy on our website. We encourage you to review this page periodically.",
        ],
      },
      {
        heading: "6. Contact Information",
        paragraphs: CONTACT_LINES,
      },
    ],
  },
  refund: {
    slug: "refund-policy",
    label: "Policies",
    title: "Return & Refund Policy",
    intro: "Please review this policy carefully before placing an order.",
    sections: [
      {
        heading: "All Sales Are Final",
        paragraphs: [
          "All sales made through our website are final and non-refundable. We do not accept returns, exchanges, or order cancellations once a purchase has been completed. Please review your order carefully before placing it.",
        ],
      },
    ],
  },
  shipping: {
    slug: "shipping-policy",
    label: "Policies",
    title: "Shipping Policy",
    intro: "Here is how we process and deliver orders placed on our website.",
    sections: [
      {
        heading: "Delivery Timeline",
        paragraphs: [
          "All orders purchased through our website are processed and delivered within 5 to 7 business days (excluding weekends and public holidays).",
        ],
      },
    ],
  },
};
