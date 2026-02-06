
# Luwa Academy: Institutional Registry v3.0
**Architect:** Shewit – 2026

## 1. Project Overview
Luwa Academy is a high-fidelity, AI-moderated educational platform designed specifically for Ethiopian Grade 12 scholars. It aligns with the Ministry of Education curriculum and EUEE standards.

## 2. Architecture (11.1)
The application follows a **3-Layer Modular Architecture**:
- **Presentation Layer**: React 19 components utilizing Tailwind CSS and Material Design 3 (M3).
- **Domain/Service Layer**: `geminiService` (AI Orchestration) and `storageService` (Persistence & Logic).
- **Data Layer**: LocalStorage-based Persistent Registry with JSON serialization.

### Data Flow
`User Action` → `React Component` → `Service Layer` → `Gemini AI / Storage` → `State Update` → `UI Refresh`

## 3. Setup Instructions (11.1)
1. **Prerequisites**: Node.js v20+, NPM/PNPM.
2. **Installation**: `npm install`.
3. **API Configuration**: Ensure `process.env.API_KEY` is set for Gemini 1.5/2.5 Pro access.
4. **Development**: `npm run dev` to launch the HMR server.
5. **Production**: `npm run build` for optimized AAB-ready bundles.

## 4. Coding Standards
- **Naming**: PascalCase for Components, camelCase for functions/variables.
- **Documentation**: All public exports must include TSDoc comments.
- **Testing**: UI components require M3 accessibility verification.

## 5. API & Database
- **Primary AI**: Google Gemini Pro (Text/Vision/Video).
- **Registry**: Key-Value pair storage with `luwa_v3_` prefix.
- **Schema**: See `types.ts` for formal interface definitions.
