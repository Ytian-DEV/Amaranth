// src/quill.d.ts
declare module 'react-quill' {
  import { Component } from 'react';
  
  interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    onChange?: (content: string, delta: any, source: string, editor: any) => void;
    placeholder?: string;
    modules?: any;
    formats?: string[];
    theme?: string;
    style?: React.CSSProperties;
    className?: string;
  }
  
  export default class ReactQuill extends Component<ReactQuillProps> {}
}

// For CSS modules
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'react-quill/dist/quill.snow.css';