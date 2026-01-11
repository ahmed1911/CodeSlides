export interface ProjectNode {
  type: 'folder' | 'file' | 'slide';
  children?: { [key: string]: ProjectNode };
  icon?: string;
  content?: SlideContent;
}

export interface ProjectStructure {
  [key: string]: ProjectNode;
}

export interface SlideContent {
  title?: string;
  description?: string;
  bullets?: string[];
  code?: string | string[];
  screenshots?: (string | { src: string; width?: string | number })[];
  layout?: 'linear' | 'split';
  listStyle?: 'bullets' | 'numbered'; // numbered = boxes with numbers
  show?: boolean; // Set to false to hide from presentation
  [key: string]: any;
}

export interface PresentationContent {
  __META__?: {
    projectTitle?: string;
    [key: string]: any;
  };
  [filePath: string]: SlideContent | any;
}
