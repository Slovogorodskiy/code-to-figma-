figma.showUI(__html__, { width: 420, height: 620 });

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function px(value, fallback = 0) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'number') return value;
  const m = String(value).match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : fallback;
}

function parseColor(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let raw = hex[1];
    if (raw.length === 3) raw = raw.split('').map((c) => c + c).join('');
    const r = parseInt(raw.slice(0, 2), 16) / 255;
    const g = parseInt(raw.slice(2, 4), 16) / 255;
    const b = parseInt(raw.slice(4, 6), 16) / 255;
    return { r, g, b };
  }
  const rgb = v.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const [r, g, b, a] = rgb[1].split(',').map((s) => s.trim());
    return {
      r: clamp(Number(r) / 255, 0, 1),
      g: clamp(Number(g) / 255, 0, 1),
      b: clamp(Number(b) / 255, 0, 1),
      a: a !== undefined ? clamp(Number(a), 0, 1) : 1
    };
  }
  return null;
}

function applyFills(node, style) {
  const fillColor = parseColor(style['background-color'] || style.background);
  if (!fillColor) return;
  node.fills = [{
    type: 'SOLID',
    color: {
      r: fillColor.r,
      g: fillColor.g,
      b: fillColor.b
    },
    opacity: fillColor.a !== undefined ? fillColor.a : 1
  }];
}

function parseSpacing(value) {
  if (!value) return [0, 0, 0, 0];
  const parts = String(value).split(/\s+/).map((p) => px(p, 0));
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
  return [parts[0], parts[1], parts[2], parts[3]];
}

function applyFrameStyle(frame, style) {
  const display = (style.display || '').trim();
  const direction = (style['flex-direction'] || '').trim();
  if (display === 'flex') {
    frame.layoutMode = direction === 'row' ? 'HORIZONTAL' : 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
    frame.itemSpacing = px(style.gap, 0);
    const justify = (style['justify-content'] || '').trim();
    const align = (style['align-items'] || '').trim();
    frame.primaryAxisAlignItems = justify === 'center' ? 'CENTER' : justify === 'space-between' ? 'SPACE_BETWEEN' : 'MIN';
    frame.counterAxisAlignItems = align === 'center' ? 'CENTER' : align === 'end' || align === 'flex-end' ? 'MAX' : 'MIN';
  } else {
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
    frame.itemSpacing = 0;
  }

  const [pt, pr, pb, pl] = parseSpacing(style.padding);
  frame.paddingTop = pt;
  frame.paddingRight = pr;
  frame.paddingBottom = pb;
  frame.paddingLeft = pl;

  if (style['border-radius']) {
    frame.cornerRadius = px(style['border-radius'], 0);
  }

  if (style.width && style.width.includes('px')) {
    frame.resize(px(style.width, 100), frame.height);
    frame.primaryAxisSizingMode = 'FIXED';
  }
  if (style.height && style.height.includes('px')) {
    frame.resize(frame.width, px(style.height, 100));
    frame.counterAxisSizingMode = 'FIXED';
  }

  applyFills(frame, style);
}

async function createTextNode(nodeData, style) {
  const textNode = figma.createText();
  const weight = px(style['font-weight'], 400);
  const family = (style['font-family'] || 'Roboto').split(',')[0].replace(/["']/g, '').trim() || 'Roboto';
  const fontName = { family, style: weight >= 600 ? 'Bold' : 'Regular' };

  try {
    await figma.loadFontAsync(fontName);
    textNode.fontName = fontName;
  } catch (e) {
    try {
      await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
      textNode.fontName = { family: 'Roboto', style: 'Regular' };
    } catch (_err) {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      textNode.fontName = { family: 'Inter', style: 'Regular' };
    }
  }

  textNode.characters = nodeData.text || '';
  textNode.fontSize = px(style['font-size'], 16);

  const color = parseColor(style.color || '#111111');
  if (color) {
    textNode.fills = [{ type: 'SOLID', color: { r: color.r, g: color.g, b: color.b }, opacity: color.a !== undefined ? color.a : 1 }];
  }

  const lh = px(style['line-height'], 0);
  if (lh > 0) {
    textNode.lineHeight = { unit: 'PIXELS', value: lh };
  }

  return textNode;
}

function isTextTag(tag) {
  return ['p', 'span', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'button', 'small', 'strong'].includes(tag);
}

function marginTopOf(style) {
  if (style['margin-top']) return px(style['margin-top'], 0);
  if (style.margin) {
    const [mt] = parseSpacing(style.margin);
    return mt;
  }
  return 0;
}

async function createNodeTree(nodeData, parentFrame, bpName) {
  if (!nodeData) return null;
  const style = (nodeData.styles && nodeData.styles[bpName]) || (nodeData.styles && nodeData.styles.base) || {};

  if (nodeData.type === 'text' && nodeData.text && nodeData.text.trim()) {
    const txt = await createTextNode(nodeData, style);
    parentFrame.appendChild(txt);
    return txt;
  }

  if (nodeData.type === 'element' && isTextTag(nodeData.tag)) {
    const mergedText = nodeData.text || '';
    const txt = await createTextNode({ text: mergedText }, style);
    parentFrame.appendChild(txt);
    return txt;
  }

  let node;
  if (nodeData.tag === 'img') {
    node = figma.createRectangle();
    node.resize(px(style.width, 120), px(style.height, 80));
    node.fills = [{ type: 'SOLID', color: { r: 0.87, g: 0.87, b: 0.87 } }];
    node.cornerRadius = 8;
  } else {
    node = figma.createFrame();
    node.name = nodeData.tag || 'block';
    applyFrameStyle(node, style);
  }

  parentFrame.appendChild(node);

  if (Array.isArray(nodeData.children)) {
    for (const child of nodeData.children) {
      const childStyle = (child.styles && child.styles[bpName]) || (child.styles && child.styles.base) || {};
      const mt = marginTopOf(childStyle);
      if (mt > 0 && node.type === 'FRAME' && node.layoutMode !== 'NONE') {
        const spacer = figma.createFrame();
        spacer.name = '__margin_top';
        spacer.layoutMode = 'NONE';
        spacer.resize(1, mt);
        spacer.fills = [];
        spacer.strokes = [];
        node.appendChild(spacer);
      }
      await createNodeTree(child, node, bpName);
    }
  }

  return node;
}

async function buildLayout(payload) {
  if (!payload || !payload.ast || !Array.isArray(payload.breakpoints) || payload.breakpoints.length === 0) {
    throw new Error('Пустые данные для генерации макета.');
  }

  const root = payload.ast;
  const breakpoints = payload.breakpoints;

  const groupFrame = figma.createFrame();
  groupFrame.name = 'Code to Figma Import';
  groupFrame.layoutMode = 'HORIZONTAL';
  groupFrame.itemSpacing = 48;
  groupFrame.primaryAxisSizingMode = 'AUTO';
  groupFrame.counterAxisSizingMode = 'AUTO';
  groupFrame.fills = [];
  figma.currentPage.appendChild(groupFrame);

  for (const bp of breakpoints) {
    const screenFrame = figma.createFrame();
    screenFrame.name = `${bp.name} (${bp.width}px)`;
    screenFrame.layoutMode = 'VERTICAL';
    screenFrame.primaryAxisSizingMode = 'AUTO';
    screenFrame.counterAxisSizingMode = 'FIXED';
    screenFrame.resize(bp.width, 10);
    screenFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    screenFrame.itemSpacing = 0;
    groupFrame.appendChild(screenFrame);

    await createNodeTree(root, screenFrame, bp.name);
  }

  figma.currentPage.selection = [groupFrame];
  figma.viewport.scrollAndZoomIntoView([groupFrame]);
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'build-layout') {
    try {
      await buildLayout(msg.payload);
      figma.notify('Готово: макеты созданы на странице.');
    } catch (error) {
      console.error(error);
      figma.notify('Ошибка во время генерации макета. Проверьте консоль плагина.');
    }
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
