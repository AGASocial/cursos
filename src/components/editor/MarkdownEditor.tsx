import React from 'react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image, Quote, Code, Heading1, Heading2, Heading3, Youtube, Trash2, Copy } from 'lucide-react';
import { markdownComponents } from '../../lib/markdown';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  placeholder?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  minHeight = '400px',
  placeholder
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newText = selectedText
      ? `${beforeText}${prefix}${selectedText}${suffix}${afterText}`
      : `${beforeText}${prefix}placeholder${suffix}${afterText}`;

    onChange(newText);

    // Set cursor position after update
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText 
        ? start + prefix.length + selectedText.length + suffix.length
        : start + prefix.length + 'placeholder'.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const controls = [
    {
      icon: <Heading1 className="h-4 w-4" />,
      title: 'Heading 1',
      action: () => insertMarkdown('# ')
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      title: 'Heading 2',
      action: () => insertMarkdown('## ')
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      title: 'Heading 3',
      action: () => insertMarkdown('### ')
    },
    { type: 'divider' },
    {
      icon: <Bold className="h-4 w-4" />,
      title: 'Bold',
      action: () => insertMarkdown('**', '**')
    },
    {
      icon: <Italic className="h-4 w-4" />,
      title: 'Italic',
      action: () => insertMarkdown('*', '*')
    },
    { type: 'divider' },
    {
      icon: <List className="h-4 w-4" />,
      title: 'Bullet List',
      action: () => insertMarkdown('- ')
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      title: 'Numbered List',
      action: () => insertMarkdown('1. ')
    },
    { type: 'divider' },
    {
      icon: <LinkIcon className="h-4 w-4" />,
      title: 'Link',
      action: () => insertMarkdown('[', '](url)')
    },
    {
      icon: <Image className="h-4 w-4" />,
      title: 'Image',
      action: () => insertMarkdown('![alt text](', ')')
    },
    { type: 'divider' },
    {
      icon: <Quote className="h-4 w-4" />,
      title: 'Blockquote',
      action: () => insertMarkdown('> ')
    },
    {
      icon: <Code className="h-4 w-4" />,
      title: 'Code Block',
      action: () => insertMarkdown('```\n', '\n```')
    },
    { type: 'divider' },
    {
      icon: <Youtube className="h-4 w-4" />,
      title: 'YouTube Video',
      action: () => insertMarkdown(':youtube[', ']')
    },
    { type: 'divider' },
    {
      icon: <Trash2 className="h-4 w-4" />,
      title: 'Clear Content',
      action: () => setShowDeleteModal(true)
    },
    {
      icon: <Copy className="h-4 w-4" />,
      title: 'Copy Content',
      action: async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch (err) {
          console.error('Failed to copy content:', err);
        }
      }
    }
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Toolbar */}
      <div className="flex items-center space-x-1 border-b border-gray-200 bg-gray-50 p-2">
        {controls.map((control, index) => 
          control.type === 'divider' ? (
            <div key={index} className="h-6 w-px bg-gray-300" />
          ) : (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                control.action();
              }}
              type="button"
              title={control.title}
              className="rounded p-1.5 text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm"
            >
              {control.icon}
            </button>
          )
        )}
      </div>

      {/* Editor Area */}
      <div className="grid grid-cols-2 divide-x divide-gray-200">
        {/* Editor */}
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="block h-full w-full resize-none border-0 bg-transparent p-4 font-mono text-sm text-gray-900 placeholder-gray-400 focus:ring-0"
            style={{ minHeight }}
          />
        </div>

        {/* Preview */}
        <div className="prose prose-sm max-w-none overflow-auto bg-gray-50/50 p-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {value || '*No content*'}
          </ReactMarkdown>
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onChange('');
          setShowDeleteModal(false);
        }}
      />
    </div>
  );
};