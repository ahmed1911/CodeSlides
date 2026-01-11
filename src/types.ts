export interface ProjectNode {
  type: 'folder' | 'file' | 'slide';
  children?: { [key: string]: ProjectNode };
  icon?: string;
  content?: SlideContent;
}

export interface ProjectStructure {
  [key: string]: ProjectNode;
}

export type SlideSection =
  | { type: 'text'; title?: string; content: string; slot?: 'left' | 'right' }
  | { type: 'list'; title?: string; items: string[]; listStyle?: 'bullets' | 'numbered'; slot?: 'left' | 'right' }
  | { type: 'code'; title?: string; code: string | string[]; language?: string; slot?: 'left' | 'right' }
  | { type: 'images'; title?: string; images: (string | { src: string; width?: string | number })[]; slot?: 'left' | 'right'; border?: boolean };

export interface SlideContent {
  title?: string;
  
  // New generic sections
  sections?: SlideSection[];
  layout?: 'linear' | 'split';
  listStyle?: 'bullets' | 'numbered';
  show?: boolean;
  [key: string]: any;
}

export interface PresentationContent {
  __META__?: {
    projectTitle?: string;
    accentColor?: string;
    backgroundColor?: string;
    [key: string]: any;
  };
  [filePath: string]: SlideContent | any;
}
