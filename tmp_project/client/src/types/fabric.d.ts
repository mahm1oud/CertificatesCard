// تعريف الأنواع الأساسية لمكتبة fabric.js
declare module 'fabric' {
  export namespace fabric {
    class Canvas {
      constructor(element: HTMLCanvasElement | string, options?: any);
      add(...objects: any[]): Canvas;
      remove(...objects: any[]): Canvas;
      clear(): Canvas;
      renderAll(): Canvas;
      getObjects(): any[];
      getActiveObject(): any;
      setActiveObject(object: any): Canvas;
      discardActiveObject(): Canvas;
      setBackgroundImage(image: any, callback: Function, options?: any): Canvas;
      setWidth(width: number): Canvas;
      setHeight(height: number): Canvas;
      dispose(): void;
      toJSON(propertiesToInclude?: string[]): any;
      loadFromJSON(json: any, callback?: Function, reviverCallback?: Function): Canvas;
      width?: number;
      height?: number;
    }

    class Object {
      set(options: any): this;
      get(property: string): any;
      setCoords(): this;
      setControlsVisibility(options: any): this;
      moveTo(index: number): this;
      type: string;
      left: number;
      top: number;
      width: number;
      height: number;
      scaleX: number;
      scaleY: number;
      angle: number;
      fill: string;
      stroke: string;
      strokeWidth: number;
      data: any;
    }

    class Textbox extends Object {
      constructor(text: string, options?: any);
      text: string;
      fontFamily: string;
      fontSize: number;
      fontWeight: string;
      fontStyle: string;
      textAlign: string;
      lineHeight: number;
      underline: boolean;
      overline: boolean;
      linethrough: boolean;
    }

    class Rect extends Object {
      constructor(options?: any);
      rx: number;
      ry: number;
    }

    class Circle extends Object {
      constructor(options?: any);
      radius: number;
    }

    class Image extends Object {
      static fromURL(url: string, callback: (image: Image) => any, options?: any): void;
      constructor(element: HTMLImageElement, options?: any);
      setSrc(src: string, callback?: Function, options?: any): void;
      scaleToWidth(width: number): void;
      scaleToHeight(height: number): void;
    }

    class Group extends Object {
      constructor(objects: any[], options?: any);
      addWithUpdate(object: any): Group;
      removeWithUpdate(object: any): Group;
      getObjects(): any[];
    }

    class Path extends Object {
      constructor(path: string, options?: any);
      path: any[];
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    class Color {
      constructor(color: string);
      toRgb(): string;
      toHex(): string;
    }

    class util {
      static loadImage(url: string, callback: Function, context?: any): void;
    }
  }
}