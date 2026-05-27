import type { FormDefinition, ThemeVariant } from "@repo/database/form-definition";

export type TemplatePreset = {
  key: string;
  title: string;
  description: string;
  category: string;
  genre: "FEEDBACK" | "SURVEY" | "EVENTS" | "JOB" | "SPORTS" | "ANIME" | "TV" | "TRAVEL" | "CONTACT" | "CUSTOM";
  themeVariant: ThemeVariant;
  definition: FormDefinition;
};

export const templateCatalog: TemplatePreset[] = [
  {
    key: "customer-feedback",
    title: "Customer Feedback",
    description: "Measure satisfaction, collect product comments, and spot support follow-ups.",
    category: "Feedback",
    genre: "FEEDBACK",
    themeVariant: "soft-sakura",
    definition: {
      title: "Customer Feedback",
      description: "Tell us what felt great and what we can improve.",
      category: "Feedback",
      themeVariant: "soft-sakura",
      fields: [
        { id: "name", kind: "short-text", label: "Your name", required: false, minLength: 1, maxLength: 80 },
        { id: "email", kind: "email", label: "Email", required: false },
        { id: "rating", kind: "select", label: "Overall experience", required: true, options: ["Excellent", "Good", "Okay", "Poor"] },
        { id: "comments", kind: "long-text", label: "What should we know?", required: true, minLength: 10, maxLength: 1200 },
      ],
    },
  },
  {
    key: "job-application",
    title: "Job Application",
    description: "A focused application intake for hiring teams.",
    category: "Professional",
    genre: "JOB",
    themeVariant: "zen-slate",
    definition: {
      title: "Job Application",
      description: "Share your profile and experience with our team.",
      category: "Professional",
      themeVariant: "zen-slate",
      fields: [
        { id: "full_name", kind: "short-text", label: "Full name", required: true, minLength: 2, maxLength: 120 },
        { id: "email", kind: "email", label: "Email", required: true },
        { id: "role", kind: "select", label: "Role", required: true, options: ["Frontend Engineer", "Backend Engineer", "Product Designer", "Growth"] },
        { id: "experience_years", kind: "number", label: "Years of experience", required: true, min: 0, max: 50, integer: true },
        { id: "portfolio", kind: "short-text", label: "Portfolio or LinkedIn URL", required: false, minLength: 4, maxLength: 240 },
      ],
    },
  },
  {
    key: "event-registration",
    title: "Event Registration",
    description: "Collect attendee details, dietary needs, and session preferences.",
    category: "Events",
    genre: "EVENTS",
    themeVariant: "lantern-pulse",
    definition: {
      title: "Event Registration",
      description: "Reserve your spot and choose your event preferences.",
      category: "Events",
      themeVariant: "lantern-pulse",
      fields: [
        { id: "name", kind: "short-text", label: "Name", required: true, minLength: 2, maxLength: 100 },
        { id: "email", kind: "email", label: "Email", required: true },
        { id: "attending_date", kind: "date", label: "Preferred date", required: true },
        { id: "sessions", kind: "multi-select", label: "Sessions", required: true, options: ["Keynote", "Workshop", "Networking", "Afterparty"], minSelect: 1, maxSelect: 3 },
        { id: "dietary", kind: "long-text", label: "Dietary notes", required: false, minLength: 0, maxLength: 400 },
      ],
    },
  },
  {
    key: "product-survey",
    title: "Product Survey",
    description: "Understand feature usage and prioritization.",
    category: "Survey",
    genre: "SURVEY",
    themeVariant: "aurora-grid",
    definition: {
      title: "Product Survey",
      description: "Help us decide what to build next.",
      category: "Survey",
      themeVariant: "aurora-grid",
      fields: [
        { id: "role", kind: "select", label: "How do you use the product?", required: true, options: ["Personal", "Team", "Enterprise", "Research"] },
        { id: "features", kind: "multi-select", label: "Most valuable features", required: true, options: ["Builder", "Analytics", "Templates", "Integrations"], minSelect: 1, maxSelect: 3 },
        { id: "nps", kind: "number", label: "Likelihood to recommend", required: true, min: 0, max: 10, integer: true },
        { id: "wish", kind: "long-text", label: "What should we add?", required: false, minLength: 0, maxLength: 800 },
      ],
    },
  },
  {
    key: "contact-form",
    title: "Contact Form",
    description: "Simple lead capture with message routing.",
    category: "Contact",
    genre: "CONTACT",
    themeVariant: "soft-sakura",
    definition: {
      title: "Contact Form",
      description: "Send a note and we will get back to you.",
      category: "Contact",
      themeVariant: "soft-sakura",
      fields: [
        { id: "name", kind: "short-text", label: "Name", required: true, minLength: 2, maxLength: 100 },
        { id: "email", kind: "email", label: "Email", required: true },
        { id: "topic", kind: "select", label: "Topic", required: true, options: ["Sales", "Support", "Partnership", "General"] },
        { id: "message", kind: "long-text", label: "Message", required: true, minLength: 10, maxLength: 1000 },
      ],
    },
  },
  {
    key: "sports-poll",
    title: "Sports Poll",
    description: "Fast fan polling for teams, predictions, and match sentiment.",
    category: "Sports",
    genre: "SPORTS",
    themeVariant: "stadium-neon",
    definition: {
      title: "Sports Poll",
      description: "Vote on the match-day story.",
      category: "Sports",
      themeVariant: "stadium-neon",
      fields: [
        { id: "favorite_team", kind: "short-text", label: "Favorite team", required: true, minLength: 2, maxLength: 80 },
        { id: "match_result", kind: "select", label: "Predicted result", required: true, options: ["Home win", "Away win", "Draw"] },
        { id: "mvp", kind: "short-text", label: "Player of the match", required: false, minLength: 2, maxLength: 80 },
      ],
    },
  },
  {
    key: "ipl-match-prediction",
    title: "IPL Match Prediction",
    description: "Cricket prediction form with winner, top scorer, and confidence.",
    category: "Sports",
    genre: "SPORTS",
    themeVariant: "stadium-neon",
    definition: {
      title: "IPL Match Prediction",
      description: "Lock in your match call before the first ball.",
      category: "Sports",
      themeVariant: "stadium-neon",
      fields: [
        { id: "winner", kind: "select", label: "Who wins?", required: true, options: ["CSK", "MI", "RCB", "KKR", "SRH", "DC", "RR", "PBKS", "GT", "LSG"] },
        { id: "top_scorer", kind: "short-text", label: "Top scorer", required: true, minLength: 2, maxLength: 80 },
        { id: "wickets", kind: "number", label: "Total wickets", required: true, min: 0, max: 20, integer: true },
        { id: "confidence", kind: "select", label: "Confidence", required: true, options: ["Low", "Medium", "High"] },
      ],
    },
  },
  {
    key: "anime-fan-survey",
    title: "Anime Fan Survey",
    description: "Capture fan tastes across genres, characters, and arcs.",
    category: "Anime",
    genre: "ANIME",
    themeVariant: "neon-night",
    definition: {
      title: "Anime Fan Survey",
      description: "Share your watchlist energy.",
      category: "Anime",
      themeVariant: "neon-night",
      fields: [
        { id: "favorite_genres", kind: "multi-select", label: "Favorite genres", required: true, options: ["Shonen", "Seinen", "Slice of Life", "Isekai", "Sports", "Mecha"], minSelect: 1, maxSelect: 3 },
        { id: "favorite_character", kind: "short-text", label: "Favorite character", required: true, minLength: 2, maxLength: 100 },
        { id: "sub_or_dub", kind: "select", label: "Sub or dub?", required: true, options: ["Sub", "Dub", "Both"] },
        { id: "recommendation", kind: "long-text", label: "One anime everyone should watch", required: false, minLength: 0, maxLength: 700 },
      ],
    },
  },
  {
    key: "tv-series-quiz",
    title: "TV Series Quiz",
    description: "Run a lightweight quiz for fan communities.",
    category: "Entertainment",
    genre: "TV",
    themeVariant: "neon-night",
    definition: {
      title: "TV Series Quiz",
      description: "Test the fandom pulse.",
      category: "Entertainment",
      themeVariant: "neon-night",
      fields: [
        { id: "show", kind: "short-text", label: "Favorite series", required: true, minLength: 2, maxLength: 120 },
        { id: "rewatch", kind: "boolean", label: "Would you rewatch it?", required: true },
        { id: "season", kind: "number", label: "Best season number", required: true, min: 1, max: 30, integer: true },
        { id: "ending", kind: "select", label: "How was the ending?", required: true, options: ["Perfect", "Good", "Mixed", "Painful"] },
      ],
    },
  },
  {
    key: "travel-planner",
    title: "Travel Planner",
    description: "Gather destination ideas, dates, budget, and trip style.",
    category: "Travel",
    genre: "TRAVEL",
    themeVariant: "mist-valley",
    definition: {
      title: "Travel Planner",
      description: "Plan a misty mountain escape with the right pace.",
      category: "Travel",
      themeVariant: "mist-valley",
      fields: [
        { id: "destination", kind: "short-text", label: "Dream destination", required: true, minLength: 2, maxLength: 120 },
        { id: "travel_date", kind: "date", label: "Start date", required: true },
        { id: "trip_style", kind: "multi-select", label: "Trip style", required: true, options: ["Nature", "Food", "Anime spots", "Luxury", "Backpacking", "Photography"], minSelect: 1, maxSelect: 3 },
        { id: "budget", kind: "number", label: "Budget per person", required: false, min: 0, integer: true },
        { id: "notes", kind: "long-text", label: "Must-have moments", required: false, minLength: 0, maxLength: 900 },
      ],
    },
  },
];

export const getTemplateByKey = (key: string) => templateCatalog.find((template) => template.key === key);
