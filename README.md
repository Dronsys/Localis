<p align="right"><a href="README.md">English</a> | <a href="README_RU.md">Русский</a> | <a href="README_CH.md">中文</a></p>

# Localis

**Localis** is a desktop application for analyzing and translating Minecraft mods. It helps you inspect mod language files, edit translations, use AI providers for translation, and review localization coverage in an HTML report.

## Download Localis 1.0.0

| Platform | Downloads |
| --- | --- |
| Windows | [![Setup x64](https://img.shields.io/badge/Setup-x64-0078D4?logo=windows)](https://github.com/FoxSoul-dev/Localis/releases/download/v1.0.0/Windows-x64-Localis-Setup-1.0.0.exe)<br>[![Portable x64](https://img.shields.io/badge/Portable-x64-2D7D9A?logo=windows)](https://github.com/FoxSoul-dev/Localis/releases/download/v1.0.0/win-unpacked.zip)<br>[![Setup ARM](https://camo.githubusercontent.com/a278fe2fd8c1282bb6b22202543901533e2d610371b082da3f9e3fbea3dd8af2/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f53657475702d61726d2d3264376439612e7376673f6c6f676f3d77696e646f7773)](https://github.com/FoxSoul-dev/Localis/releases/download/v1.0.0/Windows-ARM-Localis-Setup-1.0.0.exe)<br>[![Portable ARM](https://camo.githubusercontent.com/b8fc5ff4a6be08df0276d20ebed3709e44b6b6c9d0370d99fab749945e6f463a/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f506f727461626c652d61726d2d3637623764312e7376673f6c6f676f3d77696e646f7773)](https://github.com/FoxSoul-dev/Localis/releases/download/v1.0.0/Windows-ARM-Localis-Portable-1.0.0.zip)  |
| macOS | [![Apple Silicon](https://img.shields.io/badge/DMG-Apple%20Silicon-000000?logo=apple)](https://github.com/FoxSoul-dev/Localis/releases/download/v1.0.0/MacOS-Silicon-Localis-1.0.0-arm64.dmg)<br>[![Intel x64](https://img.shields.io/badge/DMG-Intel%20x64-000000?logo=apple)](https://github.com/FoxSoul-dev/Localis/releases/download/v1.0.0/MacOS-intel-Localis-1.0.0.dmg) |
| Linux | [![AppImage x86_64](https://img.shields.io/badge/AppImage-x86__64-F2A900?logo=linux)](https://github.com/FoxSoul-dev/Localis/releases/download/v1.0.0/Linux-x86_64-Localis-1.0.0.AppImage)<br>[![DEB amd64](https://img.shields.io/badge/DEB-amd64-A81D33?logo=debian)](https://github.com/FoxSoul-dev/Localis/releases/download/v1.0.0/Linux-amd64-Localis-1.0.0.deb)<br>[![RPM x86_64](https://img.shields.io/badge/RPM-x86__64-EE0000?logo=redhat)](https://github.com/FoxSoul-dev/Localis/releases/download/v1.0.0/Linux-x86_64-Localis-1.0.0.rpm)<br>[![pacman x64](https://img.shields.io/badge/pacman-x64-1793D1?logo=archlinux)](https://github.com/FoxSoul-dev/Localis/releases/download/v1.0.0/Linux-x64-Localis-1.0.0.pacman)<br>[![AUR recipe](https://img.shields.io/badge/AUR-PKGBUILD-1793D1?logo=archlinux)](https://github.com/FoxSoul-dev/Localis/blob/main/packaging/aur/PKGBUILD) |

## Screenshots

<p align="center">
  <img src="assets/screenshots/dashboard-en.png" alt="Localis main screen" width="100%">
</p>

<p align="center">
  <img src="assets/screenshots/editor-en.png" alt="Mod translation editor" width="100%">
</p>

<p align="center">
  <img src="assets/screenshots/ai-settings-en.png" alt="AI and Ollama settings" width="49%">
  <img src="assets/screenshots/ai-progress-en.png" alt="AI translation progress" width="49%">
</p>

<p align="center">
  <img src="assets/screenshots/notifications-en.png" alt="Translation status in notifications" width="49%">
</p>

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
git clone https://github.com/FoxSoul-dev/Localis
cd Localis
npm install
npm start
```

To build a Windows installer:

```bash
npm run dist:win
```

To build the release packages on their corresponding GitHub Actions runners:

```bash
npm run dist:mac    # Intel and Apple Silicon DMG files (requires macOS)
npm run dist:linux  # AppImage, DEB, RPM, and pacman package
```

Windows builds include x64 and ARM64 installers. All local build outputs are written to `dist/`. Pushing a `v*` tag starts the cross-platform workflow and publishes the generated packages as a GitHub Release. macOS packages are not code-signed or notarized, so macOS may require users to approve the first launch.

The Arch Linux `localis-bin` AUR recipe is in [`packaging/aur/PKGBUILD`](packaging/aur/PKGBUILD). It uses the AppImage attached to the matching GitHub Release.

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
