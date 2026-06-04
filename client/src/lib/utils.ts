import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ParsedComponentName {
  baseName: string;
  subLabel?: string;
  properties: Array<{ key: string; value: string }>;
  formattedProperties: string;
  valuesOnlyProperties: string;
}

export function parseFigmaComponentName(
  componentName: string,
  componentSetName: string | null
): ParsedComponentName {
  let baseName = componentSetName || componentName;
  let subLabel = componentSetName ? componentName : undefined;
  const properties: Array<{ key: string; value: string }> = [];

  // 1. If it contains key-value pairs (e.g. "Active=false, Type=Big")
  if (componentName.includes('=')) {
    const pairs = componentName.split(',').map(p => p.trim());
    pairs.forEach(p => {
      const parts = p.split('=');
      if (parts.length === 2) {
        properties.push({ key: parts[0].trim(), value: parts[1].trim() });
      }
    });

    if (!componentSetName) {
      if (componentName.includes('/')) {
        const slashIdx = componentName.lastIndexOf('/');
        baseName = componentName.substring(0, slashIdx).trim();
        const variantStr = componentName.substring(slashIdx + 1).trim();
        properties.length = 0; // reset
        variantStr.split(',').map(p => p.trim()).forEach(p => {
          const parts = p.split('=');
          if (parts.length === 2) {
            properties.push({ key: parts[0].trim(), value: parts[1].trim() });
          }
        });
      } else {
        baseName = "Component Variant";
      }
    }
    subLabel = undefined;
  } else {
    // 2. If no "=" but has slashes (e.g. "Button/Primary/Hover")
    if (componentName.includes('/')) {
      const parts = componentName.split('/').map(p => p.trim());
      if (componentSetName && parts[0].toLowerCase() === componentSetName.toLowerCase()) {
        baseName = componentSetName;
        subLabel = parts.slice(1).join(' / ');
      } else {
        baseName = parts[parts.length - 1];
        subLabel = parts.slice(0, parts.length - 1).join(' / ');
      }
    } else if (componentSetName && componentName !== componentSetName) {
      baseName = componentSetName;
      subLabel = componentName;
    }
  }

  const formattedProperties = properties
    .map(p => `${p.key}: ${p.value}`)
    .join(' · ');

  const valuesOnlyProperties = properties
    .map(p => p.value)
    .join(' · ');

  return {
    baseName,
    subLabel,
    properties,
    formattedProperties,
    valuesOnlyProperties,
  };
}
