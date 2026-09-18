'use client';

import { useEffect, useRef, useState } from 'react';

// Rich-text editor. Two modes:
//   block  — full document editing (headings, lists, pull quotes)
//   inline — emphasis, colour and links only, for copy that is rendered
//            inside an existing <p> where a heading or list would be invalid
//
// Built on contentEditable + document.execCommand. execCommand is formally
// deprecated but is still the only API every browser implements consistently
// without pulling in an editor framework; the alternative (ProseMirror, TipTap,
// Lexical) is a large dependency for a newsroom that needs bold, links, colour
// and headings.
//
// The editor is uncontrolled — React must not re-render it while the caret is
// inside — so the parent reads `editorRef.current.innerHTML` when saving.

// Palette from the site's own design tokens, plus neutrals. Anything else is
// available through the custom picker.
const COLOURS = [
  ['#0f2743', 'Navy'],
  ['#1c3f66', 'Navy light'],
  ['#c29a4a', 'Gold'],
  ['#9d7a2f', 'Gold deep'],
  ['#23262c', 'Body text'],
  ['#68707c', 'Muted grey'],
  ['#8a1c2b', 'Red']
];

export function RichText({ editorRef, initialHtml = '', withPullQuote = false, inline = false, onChange }) {
  const saved = useRef(null);
  const seeded = useRef(false);
  const [colourOpen, setColourOpen] = useState(false);

  // Content is pushed in only while the caret is elsewhere. Writing innerHTML
  // during typing would reset the caret to the start of the field; skipping it
  // entirely would leave stale text behind when rows are reordered or a
  // different record is opened.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (!seeded.current || (document.activeElement !== el && el.innerHTML !== initialHtml)) {
      el.innerHTML = initialHtml;
      seeded.current = true;
    }
  }, [editorRef, initialHtml]);

  // execCommand writes <font> tags by default; CSS styling is what the rest of
  // the site understands.
  useEffect(() => {
    try { document.execCommand('styleWithCSS', false, true); } catch {}
  }, []);

  const remember = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && editorRef.current?.contains(sel.anchorNode)) {
      saved.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Clicking a toolbar control moves focus out of the editor and drops the
  // selection, so it is restored before every command.
  const restore = () => {
    editorRef.current?.focus();
    if (!saved.current) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(saved.current);
  };

  const run = (cmd, value = null) => {
    restore();
    document.execCommand(cmd, false, value);
    remember();
  };

  const block = tag => run('formatBlock', `<${tag}>`);

  function addLink() {
    restore();
    const url = prompt('Link address — include https://', 'https://');
    if (!url) return;
    run('createLink', url);
  }

  function insertPullQuote() {
    restore();
    run('insertHTML',
      '<div class="pull"><q>Quote goes here</q><cite>Who said it</cite></div><p><br></p>');
  }

  // Buttons use onMouseDown + preventDefault so the selection survives the click.
  const Btn = ({ onPress, title, children, wide }) => (
    <button type="button" title={title} className={wide ? 'wide' : undefined}
      onMouseDown={e => { e.preventDefault(); onPress(); }}>
      {children}
    </button>
  );

  return (
    <>
      <div className="rte-bar">
        <Btn onPress={() => run('bold')} title="Bold (Ctrl+B)"><b>B</b></Btn>
        <Btn onPress={() => run('italic')} title="Italic (Ctrl+I)"><i>I</i></Btn>
        <Btn onPress={() => run('underline')} title="Underline (Ctrl+U)"><u>U</u></Btn>
        <Btn onPress={() => run('strikeThrough')} title="Strikethrough"><s>S</s></Btn>

        <span className="rte-sep" />

        {/* Block-level formatting is hidden in inline mode: this copy is rendered
            inside an existing <p> on the public page, where a heading or list
            would be invalid markup. */}
        {!inline && (
          <>
            <Btn onPress={() => block('p')} title="Normal paragraph" wide>¶ Text</Btn>
            <Btn onPress={() => block('h2')} title="Section heading" wide>H2</Btn>
            <Btn onPress={() => block('h3')} title="Sub-heading" wide>H3</Btn>

            <span className="rte-sep" />

            <Btn onPress={() => run('insertUnorderedList')} title="Bulleted list" wide>• List</Btn>
            <Btn onPress={() => run('insertOrderedList')} title="Numbered list" wide>1. List</Btn>

            <span className="rte-sep" />
          </>
        )}

        <Btn onPress={addLink} title="Add link" wide>🔗 Link</Btn>
        <Btn onPress={() => run('unlink')} title="Remove link" wide>Unlink</Btn>
        {withPullQuote && <Btn onPress={insertPullQuote} title="Insert a pull quote" wide>❝ Pull quote</Btn>}

        <span className="rte-sep" />

        <div className="rte-colour">
          <Btn onPress={() => setColourOpen(o => !o)} title="Text colour" wide>
            <span className="swatch-dot" style={{ background: 'linear-gradient(135deg,#0f2743,#c29a4a)' }} />
            Colour ▾
          </Btn>
          {colourOpen && (
            <div className="rte-palette">
              {COLOURS.map(([hex, name]) => (
                <button key={hex} type="button" title={name} className="swatch"
                  style={{ background: hex }}
                  onMouseDown={e => { e.preventDefault(); run('foreColor', hex); setColourOpen(false); }} />
              ))}
              <label className="swatch custom" title="Any other colour">
                +
                <input type="color" onChange={e => { run('foreColor', e.target.value); setColourOpen(false); }} />
              </label>
            </div>
          )}
        </div>

        <Btn onPress={() => run('removeFormat')} title="Strip formatting from the selection" wide>
          Clear
        </Btn>
      </div>

      <div
        className={inline ? 'rte rte-inline' : 'rte'}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onKeyUp={remember}
        onMouseUp={remember}
        onBlur={remember}
        onInput={onChange ? e => onChange(e.currentTarget.innerHTML) : undefined}
        // In inline mode Enter would open a new block; a line break keeps the
        // value valid inside the paragraph it will be rendered in.
        onKeyDown={inline ? e => {
          if (e.key === 'Enter') { e.preventDefault(); run('insertLineBreak'); }
        } : undefined}
      />
    </>
  );
}
