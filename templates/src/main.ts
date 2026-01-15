import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import confetti from 'canvas-confetti';
import { ProjectStructure, ProjectNode, SlideContent } from '../../src/types';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);

declare global {
  interface Window {
    projectStructure: ProjectStructure;
    tailwind: any;
  }
}

// Helper to separate Hex to RGB for Tailwind opacity support
function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : null;
}

function applyTheme(meta: any) {
  const root = document.documentElement;
  if (meta?.accentColor) {
    root.style.setProperty('--accent-color', meta.accentColor);
    const rgb = hexToRgb(meta.accentColor);
    if (rgb) {
      root.style.setProperty('--accent-rgb', rgb);
    }
  }
  if (meta?.backgroundColor) {
    root.style.setProperty('--bg-color', meta.backgroundColor);
    root.style.setProperty('--sidebar-color', meta.backgroundColor);
  }
}

// State
const sidebar = document.getElementById('sidebar') as HTMLElement;
const toggleBtn = document.getElementById('toggleSidebar') as HTMLElement;
const progressBar = document.getElementById('progressBar') as HTMLElement;
const contentArea = document.getElementById('contentArea') as HTMLElement;

let navigationList: { path: string; data: ProjectNode; element: HTMLElement }[] = [];
let currentIndex = -1;

// URL Hash Management
function updateURLHash(index: number) {
  const slide = navigationList[index];
  if (!slide) return;

  const hash = `#slide-${index}`;
  history.replaceState({ slideIndex: index }, '', hash);
}

function parseURLHash(): number | null {
  const hash = window.location.hash.slice(1); // Remove #

  // Support #slide-5 format
  if (hash.startsWith('slide-')) {
    const index = parseInt(hash.replace('slide-', ''), 10);
    if (!isNaN(index) && index >= 0 && index < navigationList.length) {
      return index;
    }
  }

  // Support #path/to/file.ts format
  const slideIndex = navigationList.findIndex((item) => item.path === hash);
  if (slideIndex !== -1) return slideIndex;

  return null;
}

// Initialize
function init() {
  const projectStructure = window.projectStructure;
  
  // Apply Theme
  applyTheme(projectStructure.__META__);

  const fileContainer = document.getElementById('fileTree');
  if (!fileContainer || !projectStructure) return;

  // Render Sidebar
  renderSidebar(projectStructure, fileContainer);

  // Build Navigation Map
  const items = fileContainer.querySelectorAll('.tree-item');
  const contentMap = buildContentMap(projectStructure);

  items.forEach((item) => {
    const path = item.getAttribute('data-path');
    const type = item.getAttribute('data-type');

    if (!path) return;

    const data = contentMap[path];

    if ((type === 'file' || type === 'slide') && data) {
      navigationList.push({
        path,
        data,
        element: item as HTMLElement,
      });

      const index = navigationList.length - 1;
      (item as HTMLElement).onclick = (e) => {
        e.stopPropagation();
        currentIndex = index;
        showFile(currentIndex);
      };
    }
  });

  // Keyboard Navigation
  document.addEventListener('keydown', handleKeyboard);

  // Setup Sidebar Toggle
  if (toggleBtn && sidebar) {
    toggleBtn.onclick = () => {
      const isOpening = sidebar.classList.contains('-ml-[300px]');
      sidebar.classList.toggle('-ml-[300px]');

      sidebar.animate(
        [
          { marginLeft: isOpening ? '-300px' : '0px' },
          { marginLeft: isOpening ? '0px' : '-300px' },
        ],
        {
          duration: 300,
          easing: isOpening ? 'ease-out' : 'ease-in',
        }
      );
    };
  }

  const fullscreenBtn = document.getElementById('toggleFullscreen');
  if (fullscreenBtn) {
    fullscreenBtn.onclick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    };
  }

  // Check for URL hash on load
  const hashIndex = parseURLHash();
  if (hashIndex !== null) {
    currentIndex = hashIndex;
  } else if (navigationList.length > 0) {
    currentIndex = 0;
  }

  if (navigationList.length > 0) {
    showFile(currentIndex);
  }
}

function buildContentMap(
  structure: ProjectStructure,
  currentPath = '',
  map: Record<string, ProjectNode> = {}
) {
  Object.keys(structure).forEach((key) => {
    if (key === '__META__') return;
    const item = structure[key];
    const fullPath = currentPath ? `${currentPath}/${key}` : key;

    if (item.type === 'file' || item.type === 'slide') {
      map[fullPath] = item;
    }

    if (item.children) {
      buildContentMap(item.children, fullPath, map);
    }
  });
  return map;
}

function renderSidebar(structure: ProjectStructure, container: HTMLElement, pathStr = '') {
  if (!pathStr) container.innerHTML = '';

  const sortedKeys = Object.keys(structure);

  for (const key of sortedKeys) {
    if (key === '__META__') continue;
    const item = structure[key];
    const currentPath = pathStr ? `${pathStr}/${key}` : key;
    const safeId = currentPath.replace(/[^\w-]/g, '_');

    if (item.type === 'folder') {
      const tmpl = document.getElementById('tmpl-folder') as HTMLTemplateElement;
      const clone = document.importNode(tmpl.content, true);

      const folderItem = clone.querySelector('.tree-item') as HTMLElement;
      folderItem.id = `folder-${safeId}`;
      folderItem.querySelector('.label')!.textContent = key;

      const childrenContainer = clone.querySelector('.tree-children') as HTMLElement;
      if (item.children) {
        renderSidebar(item.children, childrenContainer, currentPath);
      }
      container.appendChild(clone);
    } else if (item.type === 'slide') {
      const tmpl = document.getElementById('tmpl-slide') as HTMLTemplateElement;
      const clone = document.importNode(tmpl.content, true);

      const slideItem = clone.querySelector('.tree-item') as HTMLElement;
      slideItem.id = `slide-${safeId}`;
      slideItem.setAttribute('data-path', currentPath);
      slideItem.querySelector('.label')!.textContent = key;

      if (key.includes('__')) {
        slideItem.classList.add('border-t', 'border-border', 'mt-2.5', 'pt-2.5');
      }
      container.appendChild(clone);
    } else {
      const tmpl = document.getElementById('tmpl-file') as HTMLTemplateElement;
      const clone = document.importNode(tmpl.content, true);

      const fileItem = clone.querySelector('.tree-item') as HTMLElement;
      fileItem.id = `file-${safeId}`;
      fileItem.setAttribute('data-path', currentPath);

      const ext = key.split('.').pop()?.toLowerCase() || 'txt';
      const icon = fileItem.querySelector('.tree-icon') as HTMLElement;
      icon.className = `tree-icon ${item.icon || 'ri-file-text-line'} icon-${ext}`;

      fileItem.querySelector('.label')!.textContent = key;
      container.appendChild(clone);
    }
  }
}

function handleKeyboard(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'ArrowRight') {
    e.preventDefault();
    navigate(1);
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    navigate(-1);
  }
}

function navigate(direction: number) {
  if (navigationList.length === 0) return;
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= navigationList.length) return;
  currentIndex = nextIndex;
  showFile(currentIndex);
}

function showFile(index: number) {
  const item = navigationList[index];
  if (!item) return;

  // Update URL hash
  updateURLHash(index);

  // Active State
  document.querySelectorAll('.tree-item').forEach((el) => el.classList.remove('active'));
  item.element.classList.add('active');
  item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Progress
  const progress = ((index + 1) / navigationList.length) * 100;
  progressBar.animate([{ width: `${progress}%` }], {
    duration: 300,
    easing: 'ease-out',
    fill: 'forwards',
  });

  // Confetti on final slide
  if (item.path.includes('Abschluss')) {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 100 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      
      // Add some center blasts
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.6 },
        startVelocity: 55,
        scalar: 1.2
      });
    }, 250);
    
    confetti({
      particleCount: 500,
      spread: 160,
      origin: { y: 0.6 },
      startVelocity: 70,
      scalar: 1.5
    });
  }

  // Render Content
  const content = item.data.content;

  // Clear Content with Fade Out (optional, but let's keep it snappy for now and animate IN)
  contentArea.innerHTML = '';

  if (content) {
    renderContent(item.path, content, item.data.type);
  } else {
    contentArea.innerHTML = `
            <div class="placeholder opacity-0">
                <div class="placeholder-icon">📝</div>
                <h3>Keine Details hinterlegt</h3>
            </div>
        `;
    requestAnimationFrame(() => {
      const placeholder = contentArea.querySelector('.placeholder');
      if (placeholder) {
        placeholder.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 500,
          easing: 'ease-out',
          fill: 'forwards',
        });
      }
    });
  }
}

function renderContent(path: string, content: SlideContent, type: string) {
  // 1. Breadcrumbs & Title
  let breadcrumbsHtml = '';
  if (path) {
    const parts = path.split('/');
    breadcrumbsHtml =
      `<div class="flex items-center text-xl text-text-secondary font-mono mt-2 breadcrumb-item">` +
      parts
        .map((part, index) => {
          const isLast = index === parts.length - 1;
          return `
                    <span class="${isLast ? 'text-accent font-semibold' : 'text-text-secondary hover:text-text-primary transition-colors'}">${part}</span>
                    ${!isLast ? '<span class="mx-3 text-border">/</span>' : ''}
                `;
        })
        .join('') +
      `</div>`;
  }

  const titleHtml = `
        <div class="flex flex-col justify-center h-full">
            <div class="text-4xl font-bold text-text-primary tracking-tight leading-none mb-1 main-title">${content.title || path.split('/').pop()}</div>
            ${breadcrumbsHtml}
        </div>
    `;
  const titleContainer = document.getElementById('dynamicTitleContainer');
  if (titleContainer) titleContainer.innerHTML = titleHtml;

  // 2. Normalize Sections
  let sections: any[] = content.sections || [];

  if (sections.length === 0) {
  }

  // 3. Render Sections
  let sectionsHtml = '';
  // Helpers for Split Layout
  let leftSectionsHtml = '';
  let rightSectionsHtml = '';

  // We need to collect code blocks to initialize typewriters later
  const codeBlocksToInit: { id: string; code: string }[] = [];

  sections.forEach((section, index) => {
    // Determine Alignment based on Slot
    const isRightSlot = section.slot === 'right';
    const alignClass = isRightSlot ? 'text-right items-end' : '';
    const titleReverseClass = isRightSlot ? 'flex-row-reverse' : '';
    const titleMarginClass = isRightSlot ? 'ml-auto' : ''; // Ensure title block moves right if container is items-end

    // Optional Section Title
    let sectionTitleHtml = '';
    if (section.title) {
      sectionTitleHtml = `<div class="section-title ${titleReverseClass}">${section.title}</div>`; 
    }

    let currentSectionHtml = '';

    if (section.type === 'text') {
      const parsedContent = marked.parse(section.content);
      currentSectionHtml = `
        <div class="content-section flex flex-col ${alignClass}">
            ${sectionTitleHtml}
            <div class="text-2xl leading-relaxed text-[#d0d7de] markdown-content">${parsedContent}</div>
        </div>
      `;
    } else if (section.type === 'list') {
      const isNumbered = section.listStyle === 'numbered';
      const listItems = section.items
        .map((item: string, i: number) => {
          const parsedItem = marked.parseInline(item);
          if (isNumbered) {
            return `<li class="py-3 pl-[60px] relative text-2xl text-[#d0d7de] markdown-content">
              <span class="absolute left-0 top-2 w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-lg">${i + 1}</span>
              ${parsedItem}
            </li>`;
          } else {
            return `<li class="py-2 pl-[40px] relative text-2xl text-[#d0d7de] markdown-content before:content-['•'] before:absolute before:left-0 before:text-accent before:text-4xl before:leading-none before:top-1">${parsedItem}</li>`;
          }
        })
        .join('');

      currentSectionHtml = `
        <div class="content-section flex flex-col ${alignClass}">
            ${sectionTitleHtml}
            <ul class="list-none text-left"> <!-- Force lists to stay left-aligned text for readability, or remove text-left to align right? -->
                 <!-- Actually, list bullets are absolute left. If we align text right, bullets overlap text. -->
                 <!-- Keeping lists text-left is safer for now. -->
                ${listItems}
            </ul>
        </div>
      `;
    } else if (section.type === 'code') {
      const codeId = `code-${index}`;
      const codeText = Array.isArray(section.code) ? section.code.join('\n') : section.code;
      codeBlocksToInit.push({ id: codeId, code: codeText });

      currentSectionHtml = `
        <div class="content-section flex flex-col ${alignClass}">
            ${sectionTitleHtml}
            <div class="rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117] shadow-2xl relative group w-full text-left"> <!-- Code always LTR -->
                <div class="h-9 bg-[#161b22] border-b border-[#30363d] flex items-center px-4 justify-between">
                    <div class="flex gap-2">
                        <div class="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff4e44] transition-colors"></div>
                        <div class="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffb02e] transition-colors"></div>
                        <div class="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#22b738] transition-colors"></div>
                    </div>
                    <div class="text-xs text-text-secondary font-mono opacity-50 select-none">${section.language || 'typescript'}</div>
                </div>
                <div class="overflow-x-auto p-4 custom-scrollbar max-h-[600px]">
                    <pre><code class="language-${section.language || 'typescript'} font-mono text-[14px] leading-relaxed text-[#e6edf3]" id="${codeId}"></code></pre>
                </div>
            </div>
        </div>
      `;
    } else if (section.type === 'images') {
      let imagesHtml = '';
      section.images.forEach((item: any, i: number) => {
        const src = typeof item === 'string' ? item : item.src;
        const width = typeof item === 'object' && item.width ? item.width : '400px';
        const widthStyle = typeof width === 'number' ? `${width}px` : width;
        const animationDelay = `${i * 150}ms`;
        
        const showBorder = section.border !== false;
        const styleClass = showBorder ? 'border border-border shadow-2xl' : '';
        
        imagesHtml += `<img src="${src}" alt="Screenshot" style="max-width: ${widthStyle}; width: 100%; animation-delay: ${animationDelay};" class="rounded-lg ${styleClass} screenshot-img" data-animate="tilt">`;
      });

      const justifyClass = isRightSlot ? 'justify-end' : 'items-start';

      currentSectionHtml = `
        <div class="content-section flex flex-col ${alignClass}">
            ${sectionTitleHtml}
            <div class="flex flex-wrap gap-4 ${justifyClass} w-full">
                ${imagesHtml}
            </div>
        </div>
      `;
    }

    // Accumulate Logic
    if (content.layout === 'split') {
        if (section.slot === 'right') {
            rightSectionsHtml += currentSectionHtml;
        } else {
            leftSectionsHtml += currentSectionHtml;
        }
    } else {
        sectionsHtml += currentSectionHtml;
    }
  });

  // Handle Layout Construction
  if (content.layout === 'split') {
    sectionsHtml = `
      <div class="flex gap-12 items-start h-full">
        <div class="flex flex-col gap-0 min-h-0 flex-1 min-w-0">
            ${leftSectionsHtml}
        </div>
        <div class="flex flex-col gap-0 min-h-0 items-end shrink-0">
            ${rightSectionsHtml}
        </div>
      </div>
    `;
  }
  
  contentArea.innerHTML = sectionsHtml;
  // Trigger animations after DOM insertion
  requestAnimationFrame(() => {
    const animatedImages = contentArea.querySelectorAll('[data-animate="tilt"]');
    animatedImages.forEach((img) => {
      img.classList.add('animate-tilt-in');
    });
  });

  // Init Typewriters
  codeBlocksToInit.forEach(({ id, code }) => {
    const codeEl = document.getElementById(id);
    if (codeEl && code) {
      typeWriter(codeEl, code);
    }
  });
}

function typeWriter(element: HTMLElement, text: string) {
  try {
    const result = hljs.highlight(text, { language: 'typescript' });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.value;

    element.innerHTML = '';
    element.style.opacity = '1';

    const queue: (() => void)[] = [];

    function traverse(node: Node, parent: HTMLElement) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent || '';
        for (let i = 0; i < textContent.length; i++) {
          const char = textContent[i];
          queue.push(() => {
            parent.appendChild(document.createTextNode(char));
            const pre = element.closest('pre');
            if (pre) pre.scrollTop = pre.scrollHeight;
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const clone = el.cloneNode(false) as HTMLElement; // Shallow clone (no children)
        queue.push(() => parent.appendChild(clone));

        // Recurse
        el.childNodes.forEach((child) => traverse(child, clone));
      }
    }

    tempDiv.childNodes.forEach((child) => traverse(child, element));

    const chunk = 5;

    let i = 0;
    function frame() {
      if (i >= queue.length) return;

      for (let c = 0; c < chunk && i < queue.length; c++) {
        queue[i]();
        i++;
      }
      requestAnimationFrame(frame);
    }

    frame();
  } catch (e) {
    element.textContent = text;
  }
}

document.addEventListener('DOMContentLoaded', init);
