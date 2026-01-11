# CodeSlides 🚀

Turn your codebase into an interactive HTML presentation.
CodeSlides parses your project structure and generates a beautiful, navigable "slide deck" that helps you walk through your code, explain architecture, or onboard new developers.

## Features

- 📂 **Auto-Scan**: Automatically maps your file structure
- 🎨 **Beautiful UI**: Dark theme with smooth animations
- 📝 **Content Management**: Annotate files with descriptions and bullet points
- ⌨️ **Keyboard Navigation**: Arrow keys and Space for easy navigation
- 🎯 **Syntax Highlighting**: Code blocks with highlight.js
- 📐 **Layout Control**: Support for linear and split-screen layouts
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

Edit the generated `presentation-content.json` to customize your slides using the powerful **Generic Sections** model.

### 1. Basic Structure

Each slide can contain a `sections` array. Supported section types are:

- `text`: Simple Markdown text
- `list`: Bullet points or numbered lists
- `code`: Syntax-highlighted code blocks
- `images`: Image galleries with tilt effect

```json
{
  "src/main.ts": {
    "title": "Main Entry Point",
    "sections": [
      {
        "type": "text",
        "title": "Overview",
        "content": "This is the **bootstrap** logic."
      },
      {
        "type": "list",
        "title": "Key Points",
        "items": ["Sets up CLI", "Handles arguments"],
        "listStyle": "bullets"
      }
    ]
  }
}
```

### 2. Split Layout

Create rich side-by-side layouts using `layout: "split"`.

- **Left Column** (Default): Takes available space (auto-width).
- **Right Column** (`slot: "right"`): Takes intrinsic space and **auto-aligns to the right**.

```json
{
  "screens/LoginScreen.tsx": {
    "title": "Login UI",
    "layout": "split",
    "sections": [
      {
        "type": "text",
        "title": "Implementation",
        "content": "Uses `useAuth` hook for logic."
      },
      {
        "type": "images",
        "slot": "right",
        "images": [{ "src": "screenshot.png", "width": "300px" }]
      }
    ]
  }
}
```

### 3. Section Types Reference

#### Text Section

```json
{
  "type": "text",
  "title": "Concept",
  "content": "Markdown is **fully supported** here."
}
```

#### List Section

```json
{
  "type": "list",
  "title": "Features",
  "items": ["Item 1", "Item 2", "Item 3"],
  "listStyle": "bullets" // or "numbered"
}
```

#### Code Section

```json
{
  "type": "code",
  "title": "Implementation",
  "language": "typescript",
  "code": ["const greeting = 'Hello';", "console.log(greeting);"]
}
```

#### Image Section

```json
{
  "type": "images",
  "title": "Preview",
  "images": [
    {
      "src": "screenshot.png",
      "width": "400px" // Optional override
    }
  ]
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
