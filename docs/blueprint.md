# **App Name**: Vale+ Digital

## Core Features:

- Home Dashboard: Home dashboard displaying key metrics and associated data, formatted in a clear, summarized card.
- Vale Creation Form: Form to create vales by inputting client names and the amount for the vale
- Unique Folio Generator: Unique folio generation combining the associated ID, year, month and a UUID to generate each vale.
- Vale Document Creation: Creation of vale documents with the intial status 'PENDIENTE'.
- Create Signing Link Endpoint: API endpoint that creates and stores signing link for each document.
- Face Liveness and Comparison Verification: Call AWS Rekognition's Face Liveness and Face Compare **tools** for verification before completing the signature.
- Realtime Status Updates: Vale status updates, showing the current status (FIRMADO, PENDIENTE) after signature verification.

## Style Guidelines:

- Primary color: Soft rose (#E07A8C) evoking trust and security in financial operations, inspired by Presta&Gana's magenta.
- Background color: Light gray (#F0F0F0), subtly tinted with the primary hue, offering a clean, neutral backdrop.
- Accent color: Green (#50B848), a brighter take on Presta&Gana's green, offering a contrast and highlighting the important elements
- Font pairing: 'Poppins' (sans-serif) for headers and short text snippets to achieve contemporary, clean look and 'PT Sans' (sans-serif) for the body to ensure comfortable reading for the paragraph-like sections.
- Simple line icons for main actions like 'create', 'sign', and 'verify' to provide a minimal but guiding UI experience.
- Use of cards with soft shadows to elevate content and provide focus to main sections, such as metrics, summaries, and forms.
- Gentle transitions and micro-interactions when state changes, such as loading and confirmation messages, to subtly enhance user feedback.