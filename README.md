# CodeSlides 🚀

Turn your codebase into an interactive HTML presentation.
CodeSlides parses your project structure and generates a beautiful, navigable "slide deck" that helps you walk through your code, explain architecture, or onboard new developers.

## Features

- 📂 **Auto-Scan**: Automatically maps your file structure
- 🎨 **Beautiful UI**: Dark theme with smooth animations
- 📝 **Content Management**: Annotate files with descriptions and bullet points
- ⌨️ **Keyboard Navigation**: Arrow keys and Space for easy navigation
- 🎯 **Syntax Highlighting**: Code blocks with highlight.js
- ✨ **Animations**: Tilt effects for screenshots, typewriter for code

## Installation

### Global Installation (Recommended)

```bash
# Clone the repository
git clone https://github.com/ahmed1911/CodeSlides.git
cd CodeSlides

# Install dependencies
yarn install

# Build the project
yarn build

# Link globally for easy access
npm link
```

### Local Usage

```bash
# Install dependencies and build
yarn install && yarn build

# Run directly
./dist/cli.js <source-directory>
```

## Usage

Navigate to any project you want to present:

```bash
# Generate presentation for current directory
codeslides .

# Generate for specific directory
codeslides ./src

# Specify custom output directory
codeslides ./src ./my-presentation
```

After running, open the generated `code-presentation.html` in your browser.

## Customization

Edit the generated `presentation-content.json` to add:

- Custom descriptions
- Bullet points
- Code snippets
- Screenshots
- Custom slides

Example:

```json
{
  "src/main.ts": {
    "title": "Main Entry Point",
    "description": "Application bootstrap and initialization",
    "bullets": ["Sets up the CLI interface", "Handles command-line arguments"],
    "screenshots": ["https://example.com/screenshot.png"]
  }
}
```

## Development

```bash
# Run in development mode
yarn dev <directory>

# Lint code
yarn lint

# Format code
yarn format

# Build for production
yarn build
```

## License

MIT
