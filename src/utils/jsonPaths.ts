export function getAllPaths(obj: any, parentPath = ''): string[] {
  if (!obj || typeof obj !== 'object') {
    return [parentPath].filter(Boolean);
  }

  return Object.entries(obj).reduce((paths: string[], [key, value]) => {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    
    if (Array.isArray(value)) {
      // Add array path and its first item paths if it exists
      paths.push(currentPath);
      if (value.length > 0) {
        paths.push(...getAllPaths(value[0], `${currentPath}[0]`));
      }
    } else if (value && typeof value === 'object') {
      // Add the object path and all nested paths
      paths.push(currentPath);
      paths.push(...getAllPaths(value, currentPath));
    } else {
      paths.push(currentPath);
    }
    
    return paths;
  }, []);
}

export function getValueFromPath(obj: any, path: string): any {
  try {
    const result = path
      .split(/[.\[\]]/)
      .filter(Boolean)
      .reduce((current, part) => current?.[part], obj);

    if (typeof result === 'object' && result !== null) {
      return Array.isArray(result)
        ? `[${result.join(', ')}]`
        : Object.entries(result)
            .map(([key, val]) => `${key}: ${val}`)
            .join(', ');
    }

    return result ?? '';
  } catch {
    return '';
  }
}
