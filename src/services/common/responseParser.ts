/**
 * Response Parser Module
 * 
 * This module provides utilities for parsing API responses in various formats
 * and ensuring proper handling of content types.
 */

/**
 * Safely checks if a string is valid JSON
 * @param {string} str - The string to check
 * @returns {boolean} - Whether the string can be parsed as JSON
 */
export const isValidJson = (str : string) => {
  if (typeof str !== 'string') return false;
  if (str.trim() === '') return false;
  
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Safely formats JSON with indentation
 * @param {any} data - The data to format
 * @returns {string} - Formatted JSON string
 */
export const formatJson = (data:any) => {
  try {
    if (typeof data === 'string' && isValidJson(data)) {
      // Parse and re-stringify for proper formatting
      return JSON.stringify(JSON.parse(data), null, 2);
    } else if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  } catch (e) {
    console.error('Error formatting JSON:', e);
    return String(data);
  }
};

/**
 * Detects if content is likely binary data
 * @param {ArrayBuffer} buffer - Array buffer to check
 * @returns {boolean} - True if likely binary
 */
export const isLikelyBinary = (buffer : any) => {
  // Check if buffer exists and has content
  if (!buffer || buffer.byteLength === 0) return false;
  
  // Create a view of the first few bytes (checking more gives better accuracy)
  const byteView = new Uint8Array(buffer.slice(0, Math.min(buffer.byteLength, 1024)));
  
  // Count binary characters (non-printable ASCII)
  let binaryCount = 0;
  for (let i = 0; i < byteView.length; i++) {
    // Skip common whitespace characters
    if (byteView[i] < 32 && ![9, 10, 13].includes(byteView[i])) {
      binaryCount++;
    }
  }
  
  // If more than 10% of characters are binary, it's likely binary data
  // We increased the threshold because some HTML content might contain a small 
  // number of non-printable characters but should still be treated as text
  return (binaryCount / byteView.length) > 0.10;
};

/**
 * Detects if content is XML based on content
 * @param {string} content - The content to check
 * @returns {boolean} - True if content appears to be XML
 */
export const isXml = (content:any) => {
  if (typeof content !== 'string') return false;
  
  // Simple check for XML pattern
  const trimmed = content.trim();
  return trimmed.startsWith('<?xml') || 
         (trimmed.startsWith('<') && trimmed.endsWith('>') && 
         (trimmed.includes('</') || trimmed.includes('/>')));
};

/**
 * Formats XML with proper indentation
 * @param {string} xml - XML string to format
 * @returns {string} - Formatted XML
 */
export const formatXml = (xml:any) => {
  if (typeof xml !== 'string') return String(xml);
  
  // More robust XML formatter with improved tag handling
  try {
    // Normalize line endings and remove existing indentation
    let normalized = xml.replace(/\r\n/g, '\n')
                         .replace(/[\t ]+</g, '<')
                         .replace(/>\s+</g, '><');
    
    let formatted = '';
    let indent = 0;
    let inTag = false;
    let inComment = false;
    
    // Process the XML character by character for more accurate formatting
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      const nextChar = normalized[i + 1] || '';
      
      // Handle XML comments
      if (char === '<' && nextChar === '!' && normalized.substr(i, 4) === '<!--') {
        inComment = true;
        formatted += '\n' + '  '.repeat(indent) + '<!--';
        i += 3; // Skip the '<!--'
        continue;
      }
      
      if (inComment && char === '-' && nextChar === '-' && normalized[i + 2] === '>') {
        inComment = false;
        formatted += '-->';
        i += 2; // Skip the '-->'
        continue;
      }
      
      if (inComment) {
        formatted += char;
        continue;
      }
      
      // Handle tags
      if (char === '<' && !inTag) {
        inTag = true;
        
        // Check if it's a closing tag
        if (nextChar === '/') {
          indent = Math.max(0, indent - 1);
        }
        
        formatted += '\n' + '  '.repeat(indent) + '<';
      } else if (char === '>' && inTag) {
        inTag = false;
        formatted += '>';
        
        // Check if it was a self-closing tag
        const lastFewChars = formatted.slice(-2);
        if (lastFewChars !== '/>') {
          // If it wasn't a closing tag or self-closing tag, increase indent
          if (formatted[formatted.lastIndexOf('<') + 1] !== '/') {
            indent++;
          }
        }
      } else {
        formatted += char;
      }
    }
    
    // Clean up the result and remove empty lines
    return formatted.trim()
                   .replace(/\n\s*\n/g, '\n');
  } catch (e) {
    console.warn('Error formatting XML:', e);
    return xml;
  }
};

/**
 * Converts a headers object to an array of key-value pairs
 * @param {Object} headers - Headers object from Fetch API
 * @returns {Array} - Array of header objects
 */
export const formatHeaders = (headers:any) => {
  const result:any[] = [];
  
  if (!headers) return result;
  
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result.push({ key, value });
    });
  } else if (typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers)) {
      result.push({ key, value: String(value) });
    }
  }
  
  return result;
};

/**
 * Main function to parse API responses
 * @param {Response} response - Fetch API Response object
 * @returns {Promise<Object>} - Parsed response with type-specific handling
 */
export const parseApiResponse = async (response:any) => {
  const contentType = response.headers.get('content-type') || '';
  const contentLength = response.headers.get('content-length') || 'unknown';
  
  try {
    // Handle status codes with no expected body
    if (response.status === 204 || response.status === 304) {
      return {
        data: response.status === 204 ? 
          '[204 No Content]' : 
          '[304 Not Modified]',
        contentType: contentType,
        raw: '',
        formatted: response.status === 204 ? 
          '[204 No Content]' : 
          '[304 Not Modified]',
        size: 0,
        error: null,
        format: 'text'
      };
    }
    
    // First try to get the response as a buffer to determine content type
    const buffer = await response.clone().arrayBuffer();
    
    // For empty responses, return immediately
    if (buffer.byteLength === 0) {
      return {
        data: '[Empty response]',
        contentType: contentType,
        raw: '',
        formatted: '[Empty response]',
        size: 0,
        error: null,
        format: 'text'
      };
    }
    
    // Check if the content is likely binary
    const isBinary = isLikelyBinary(buffer);
    
    // Handle binary data
    if (isBinary || 
        contentType.includes('image/') || 
        contentType.includes('audio/') || 
        contentType.includes('video/') ||
        contentType.includes('application/octet-stream') ||
        contentType.includes('application/pdf') ||
        contentType.includes('application/zip')) {
      
      // Special handling for content that might be JSON despite being compressed/binary
      // This covers multiple scenarios where the content type might be misleading
      try {
        // Try to convert to text and parse as JSON
        const text = new TextDecoder('utf-8').decode(buffer);
        const trimmedText = text.trim();
        
        // Case 1: Explicit JSON content type but compressed
        if (contentType.includes('application/json')) {
          if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
            try {
              const jsonData = JSON.parse(trimmedText);
              return {
                data: jsonData,
                contentType: contentType,
                raw: text,
                formatted: formatJson(trimmedText),
                size: text.length,
                error: null,
                format: 'json'
              };
            } catch (e) {
              console.warn('Detected application/json content type but failed to parse:', e);
              // Continue to other cases
            }
          }
        }
        
        // Case 2: Content looks like JSON regardless of content type
        if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
          try {
            const jsonData = JSON.parse(trimmedText);
            console.log('Successfully parsed JSON-like content despite binary/compressed detection');
            return {
              data: jsonData,
              contentType: contentType,
              raw: text,
              formatted: formatJson(trimmedText),
              size: text.length,
              error: null,
              format: 'json',
              note: 'JSON data detected despite content type'
            };
          } catch (e) {
            console.warn('Content appears to be JSON but failed to parse:', e);
            // Continue to binary handling
          }
        }
        
        // Case 3: Check if it might be HTML despite binary detection (enhanced detection)
        if (trimmedText.startsWith('<!DOCTYPE html>') || 
            trimmedText.startsWith('<html') ||
            trimmedText.includes('</head>') ||
            trimmedText.includes('</body>') ||
            trimmedText.includes('</div>') ||
            (trimmedText.startsWith('<') && trimmedText.includes('</html>')) ||
            // Check common HTML patterns
            (contentType.includes('text/html') || 
             contentType.includes('application/xhtml')) ||
            // Look for common HTML tags that indicate it's very likely HTML
            (trimmedText.includes('<div') && trimmedText.includes('</div>')) ||
            (trimmedText.includes('<p>') && trimmedText.includes('</p>')) ||
            (trimmedText.includes('<span') && trimmedText.includes('</span>'))) {
          
          // Apply better HTML formatting for readability
          let formatted = text;
          try {
            // Use similar formatting as in the main HTML case
            formatted = text.replace(/></g, '>\n<')
                           .replace(/<\/([a-zA-Z0-9]+)><([a-zA-Z0-9]+)>/g, '</$1>\n<$2>')
                           .replace(/<([a-zA-Z0-9]+)><\/([a-zA-Z0-9]+)>/g, '<$1>\n</$2>');
          } catch (e) {
            console.warn('Error formatting HTML in binary data:', e);
          }
          
          return {
            data: text,
            contentType: contentType + ' (detected as HTML)',
            raw: text,
            formatted: formatted,
            size: text.length,
            error: null,
            format: 'html',
            note: 'HTML content detected despite binary classification'
          };
        }
        
        // Case 4: Check for XML content
        if (trimmedText.startsWith('<?xml') || 
            (trimmedText.startsWith('<') && 
             (trimmedText.includes('</') || trimmedText.includes('/>')) &&
             !trimmedText.includes('<html') && 
             !trimmedText.includes('</body>'))) {
          return {
            data: text,
            contentType: contentType + ' (detected as XML)',
            raw: text, 
            formatted: formatXml(text),
            size: text.length,
            error: null,
            format: 'xml',
            note: 'XML content detected despite binary classification'
          };
        }
      } catch (e) {
        console.warn('Error attempting to process binary data as text:', e);
      }
      
      // If all the special case handling fails, treat as binary
      return {
        data: `[Binary data: ${contentType || 'unknown type'}, ${buffer.byteLength} bytes]`,
        contentType: contentType,
        raw: `[Binary data: ${contentType || 'unknown type'}, ${buffer.byteLength} bytes]`,
        formatted: `[Binary data: ${contentType || 'unknown type'}, ${buffer.byteLength} bytes]`,
        size: buffer.byteLength,
        error: null,
        format: 'binary'
      };
    }
    
    // Convert buffer to text
    const text = new TextDecoder('utf-8').decode(buffer);
    
    // Handle JSON content
    if (contentType.includes('application/json') || isValidJson(text)) {
      try {
        const jsonData = JSON.parse(text);
        return {
          data: jsonData,
          contentType: contentType,
          raw: text,
          formatted: formatJson(text),
          size: text.length,
          error: null,
          format: 'json'
        };
      } catch (jsonError:any) {
        console.warn('JSON parse error:', jsonError);
        return {
          data: text,
          contentType: contentType,
          raw: text,
          formatted: text,
          size: text.length,
          error: `Invalid JSON: ${jsonError.message}`,
          format: 'text'
        };
      }
    }
    
    // Handle XML content
    if (contentType.includes('application/xml') || 
        contentType.includes('text/xml') || 
        isXml(text)) {
      return {
        data: text,
        contentType: contentType,
        raw: text,
        formatted: formatXml(text),
        size: text.length,
        error: null,
        format: 'xml'
      };
    }
    
    // Handle CSV content
    if (contentType.includes('text/csv') || 
        contentType.includes('application/csv') ||
        (response.url && (response.url.endsWith('.csv') || response.url.includes('.csv?')))) {
      return {
        data: text,
        contentType: contentType,
        raw: text,
        formatted: text,
        size: text.length,
        error: null,
        format: 'csv'
      };
    }
    
    // Handle JavaScript content
    if (contentType.includes('application/javascript') || 
        contentType.includes('text/javascript') ||
        (response.url && (response.url.endsWith('.js') || response.url.includes('.js?')))) {
      return {
        data: text,
        contentType: contentType,
        raw: text,
        formatted: text, // We could add JS code formatting in the future
        size: text.length,
        error: null,
        format: 'javascript'
      };
    }
    
    // HTML content - format it for better readability using similar approach to XML formatter
    if (contentType.includes('text/html') || 
        contentType.includes('application/xhtml') ||
        text.trim().startsWith('<!DOCTYPE html>') || 
        text.trim().startsWith('<html') ||
        // Enhanced HTML detection for edge cases
        (text.trim().startsWith('<') && (
          text.includes('</head>') ||
          text.includes('</body>') ||
          text.includes('</html>') ||
          (text.includes('<div') && text.includes('</div>')) ||
          (text.includes('<p>') && text.includes('</p>')) ||
          (text.includes('<span') && text.includes('</span>'))
        ))) {
      
      // Use a more sophisticated HTML formatter
      let formatted = text;
      try {
        // Normalize line endings and remove existing indentation
        let normalized = text.replace(/\r\n/g, '\n')
                             .replace(/[\t ]+</g, '<')
                             .replace(/>\s+</g, '><');
        
        let result = '';
        let indent = 0;
        let inTag = false;
        let inScript = false;
        let inStyle = false;
        let inComment = false;
        
        // Process character by character for better control
        for (let i = 0; i < normalized.length; i++) {
          const char = normalized[i];
          const nextChar = normalized[i + 1] || '';
          
          // Handle HTML comments
          if (char === '<' && nextChar === '!' && normalized.substr(i, 4) === '<!--') {
            inComment = true;
            result += '\n' + '  '.repeat(indent) + '<!--';
            i += 3; // Skip the '<!--'
            continue;
          }
          
          if (inComment && char === '-' && nextChar === '-' && normalized[i + 2] === '>') {
            inComment = false;
            result += '-->';
            i += 2; // Skip the '-->'
            continue;
          }
          
          if (inComment) {
            result += char;
            continue;
          }
          
          // Special handling for script and style tags - don't format their content
          if (inScript) {
            result += char;
            if (char === '<' && normalized.substr(i, 9).toLowerCase() === '</script>') {
              inScript = false;
              // Add a line break after the script tag
              result += '/script>\n';
              i += 8; // Skip the '/script>'
            }
            continue;
          }
          
          if (inStyle) {
            result += char;
            if (char === '<' && normalized.substr(i, 8).toLowerCase() === '</style>') {
              inStyle = false;
              // Add a line break after the style tag
              result += '/style>\n';
              i += 7; // Skip the '/style>'
            }
            continue;
          }
          
          // Check for script and style tags
          if (char === '<' && normalized.substr(i, 7).toLowerCase() === '<script') {
            inScript = true;
            result += '\n' + '  '.repeat(indent) + '<script';
            i += 6; // Skip the '<script'
            continue;
          }
          
          if (char === '<' && normalized.substr(i, 6).toLowerCase() === '<style') {
            inStyle = true;
            result += '\n' + '  '.repeat(indent) + '<style';
            i += 5; // Skip the '<style'
            continue;
          }
          
          // Normal tag handling
          if (char === '<' && !inTag) {
            inTag = true;
            
            // Check if it's a closing tag
            if (nextChar === '/') {
              indent = Math.max(0, indent - 1);
            }
            
            result += '\n' + '  '.repeat(indent) + '<';
          } else if (char === '>' && inTag) {
            inTag = false;
            result += '>';
            
            // Check if it was a self-closing tag
            const lastFewChars = result.slice(-2);
            if (lastFewChars !== '/>') {
              // Increase indent for opening tags that aren't self-closing
              if (result[result.lastIndexOf('<') + 1] !== '/') {
                indent++;
              }
            }
          } else {
            result += char;
          }
        }
        
        // Clean up the result
        formatted = result.trim().replace(/\n\s*\n/g, '\n');
      } catch (e) {
        console.warn('Error formatting HTML:', e);
        formatted = text;
      }
      
      return {
        data: text,
        contentType: contentType,
        raw: text,
        formatted: formatted,
        size: text.length,
        error: null,
        format: 'html'
      };
    }
    
    // Additional check for JSON content with non-standard content types
    // Some APIs return JSON with text/plain or other content types
    const trimmedText = text.trim();
    if ((trimmedText.startsWith('{') && trimmedText.endsWith('}')) || 
        (trimmedText.startsWith('[') && trimmedText.endsWith(']'))) {
      try {
        const jsonData = JSON.parse(trimmedText);
        console.log('Detected JSON content with non-standard content type:', contentType);
        return {
          data: jsonData,
          contentType: contentType + ' (detected as JSON)',
          raw: text,
          formatted: formatJson(text),
          size: text.length,
          error: null,
          format: 'json',
          note: 'JSON data detected despite content type'
        };
      } catch (e) {
        console.warn('Content looks like JSON but failed to parse:', e);
        // Continue to default handling
      }
    }
    
    // Default case - treat as plain text
    return {
      data: text,
      contentType: contentType,
      raw: text,
      formatted: text,
      size: text.length,
      error: null,
      format: 'text'
    };
    
  } catch (error:any) {
    console.error('Error parsing response:', error);
    return {
      data: `[Error parsing response: ${error.message}]`,
      contentType: contentType,
      raw: `[Error parsing response: ${error.message}]`,
      formatted: `[Error parsing response: ${error.message}]`,
      size: contentLength,
      error: error.message,
      format: 'error'
    };
  }
};