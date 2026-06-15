/**
 * ============================================================================
 * TYPESCRIPT GLOBAL AUGMENTATION
 * ============================================================================
 * @file types.d.ts
 * @description
 * Extends the default React namespace. Because a vanilla Custom Web Component
 * (<altcha-widget>) is injected into the React DOM, the TypeScript 
 * compiler will throw an error because it doesn't recognize the tag. 
 * This file explicitly declares the tag and its props to satisfy the compiler.
 * ============================================================================
 */

import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'altcha-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        challengeurl?: string;
        hidefooter?: boolean;
      };
    }
  }
}