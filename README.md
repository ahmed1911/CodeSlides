# CodeSlides 🚀

Turn your codebase into an interactive HTML presentation.
CodeSlides parses your project structure and generates a beautiful, navigable "slide deck" that helps you walk through your code, explain architecture, or onboard new developers.

## Features

- 📂 **Auto-Scan**: Automatically maps your file structure.
- 🎨 **Component-Based**: Customize the look via `templates/` (Tailwind CSS, clean JS).
- 📝 **Content Management**: Annotate files with descriptions and bullet points in a simple JSON file.
- 🖥️ **Interactive UI**: Navigate through your code like a slide deck.

## Installation

```bash
# Clone the repository
git clone https://github.com/ahmed1911/codeslides.git

# Install dependencies
cd codeslides
npm install

# Build the project
npm run build

# Link globally (optional, for easy access)
npm link
```

## Usage

Navigate to any project you want to present:

```bash
# Generate presentation in the current directory
codeslides .

# Or specify source and output directories
codeslides ./src ./presentation
```

After running, open the generated `code-presentation.html` in your browser.

## Customization

You can fully customize the generated presentation by editing the files in `templates/`:

- `index.html`: The main skeletal structure.
- `style.css`: Tailwind CSS styles.
- `script.js`: Client-side logic for navigation and rendering.

## License

MIT
