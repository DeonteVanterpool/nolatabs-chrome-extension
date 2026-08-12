declare module '*.css';
declare module '*.scss';

declare module "*.svg" {
  import type * as React from "react";
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.png' { const url: string; export default url; }
declare module '*.jpg' { const url: string; export default url; }
declare module '*.jpeg' { const url: string; export default url; }
declare module '*.gif' { const url: string; export default url; }
declare module '*.webp' { const url: string; export default url; }
declare module '*.woff' { const url: string; export default url; }
declare module '*.woff2' { const url: string; export default url; }
declare module '*.ttf' { const url: string; export default url; }
declare module '*.eot' { const url: string; export default url; }
