<p align="right"><a href="README.md">English</a> | <a href="README_RU.md">Русский</a></p>

# Localis

**Localis** is a desktop application for analyzing and translating Minecraft mods. It helps you inspect mod language files, edit translations, use AI providers for translation, and review localization coverage in an HTML report.

## Features

- Scan Minecraft mod `.jar` files and locate language resources.
- Review and edit translations in the app, including its table and JSON editor.
- Translate text with an OpenAI-compatible API or a local Ollama model.
- Run AI translations across selected mods with progress information for strings, batches, and mods.
- Generate an HTML report with localization status and translation issues.
- Save edited language files back into JAR archives, with backup and restore support.
- Configure terminology rules and choose the interface language.

## Requirements

- Node.js and npm (for running from source)
- An OpenAI-compatible API endpoint, or Ollama with a model installed, for AI translation

You can also use a packaged Windows installer; Node.js is not needed to run an installed build.

## Run from source

```bash
git clone https://github.com/Dronsys/Localis
cd Localis
npm install
npm start
```

To build a Windows installer:

```bash
npm run dist:win
```

The installer is written to the `dist/` directory.

## Getting started

1. Open Localis and select the folder containing your Minecraft mods.
2. Run the scan to find available localization files.
3. Select a mod to review or edit its translations.
4. To use AI translation, configure a provider in **AI Settings** and select the target language.
5. Review the results, then save the changes to the mod archive.
6. Export an HTML report when you need a shareable overview of localization status.

Localis creates backups before saving changes to JAR files. Use the app's backup controls to restore a previous version if needed.

## AI translation setup

In **AI Settings**, choose an OpenAI-compatible provider or Ollama and configure its endpoint and model. Add an API key when the selected provider requires one. For Ollama, make sure its server is running and the model has already been downloaded.

Translation quality and throughput depend on the selected model, API availability, and context limits. Review AI-generated text before distributing a mod or modpack.

## Privacy

When you use a hosted AI provider, the text selected for translation is sent to that provider. With Ollama, requests go to the configured Ollama server, which can be local to your computer. Keep API credentials private and review the provider's data handling terms.

## Project layout

- `main.js` — Electron main process and file operations.
- `renderer.js` — application interface, localization, reporting, and translation workflow.
- `index.html` and `style.css` — interface markup and styles.
- `assets/` — application images and icons.
- `logger.js` — application logging.

## License

Localis is distributed under the [MIT License](LICENSE). See the license file for the full terms.
