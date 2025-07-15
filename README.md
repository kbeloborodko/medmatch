# MedMatch 💊

**Find equivalent medications when traveling abroad**

MedMatch is a modern web application that helps travelers and expats find equivalent medications across different countries. Built with React, TypeScript, and Tailwind CSS, it provides a safe and educational tool for medication research.

## ✨ Features

- **🔍 Smart Search**: Search by brand name, generic name, or active ingredient
- **🌍 Multi-Country Support**: US, EU, and Canada with curated OTC medications
- **💊 OTC Focus**: Safe, over-the-counter medications only
- **🛡️ Safety First**: Prominent disclaimers and medical warnings
- **📱 Responsive Design**: Works on all devices
- **🗄️ Local Database**: Curated database of popular OTC medications

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/kbeloborodko/medmatch.git
cd medmatch

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

## 🏗️ Architecture

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for fast development

### Data Source
- **Local Medication Database**: Curated list of popular OTC medications
- **Multi-country coverage**: US, EU, and Canada
- **Reliable and fast**: No external API dependencies

### Safety & Compliance
- **Educational purpose only** disclaimers
- **Healthcare provider consultation** reminders
- **OTC medications only** for reduced liability
- **Clear medical warnings** throughout

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
├── services/           # API services
│   ├── api.ts         # Local medication database
│   └── medicationService.ts  # Business logic
├── types/              # TypeScript interfaces
└── App.tsx            # Main application
```

### Data Services
- **LocalMedicationService**: Curated database of popular OTC medications
- **MedicationService**: Business logic layer with search and filtering

### Database Coverage
The local database includes popular OTC medications such as:
- **Pain Relief**: Ibuprofen, Acetaminophen/Paracetamol, Aspirin
- **Cold & Allergy**: Diphenhydramine, Cetirizine
- **Digestive Health**: Omeprazole, Ranitidine
- **Sleep & Relaxation**: Melatonin

Each medication includes:
- Brand names and generic names
- Dosage forms and strengths
- Country-specific availability
- Safety warnings and interactions
- Cross-references to analogues

## 🛡️ Safety & Legal

**Important**: MedMatch provides educational information only. Always:
- Consult with healthcare providers before taking any medication
- Verify dosage and availability in your destination country
- Check local regulations and requirements
- Only use over-the-counter medications as intended

## 🌟 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For questions or support, please open an issue on GitHub.

---

**MedMatch** - Making medication information accessible and safe for travelers worldwide.
