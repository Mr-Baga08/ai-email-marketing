import React, { useState, useRef, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Image,
  Trash2
} from 'lucide-react';

/**
 * EmailEditor component for creating and editing email templates
 * 
 * @param {Object} props - Component properties
 * @param {string} [props.initialContent] - Initial content for the editor
 * @param {function} [props.onChange] - Callback when content changes
 * @param {function} [props.onSave] - Callback when template is saved
 * @param {string} [props.className] - Additional CSS classes
 */
const EmailEditor = ({
  initialContent = '',
  onChange,
  onSave,
  className = ''
}) => {
  // References
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // State management
  const [content, setContent] = useState(initialContent);
  const [selectedImage, setSelectedImage] = useState(null);

  // Formatting actions
  const applyFormat = (command, value = null) => {
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateContent();
  };

  // Update content and trigger onChange
  const updateContent = useCallback(() => {
    const newContent = editorRef.current.innerHTML;
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  }, [onChange]);

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = document.createElement('img');
        img.src = reader.result;
        img.classList.add('max-w-full', 'h-auto', 'my-2');
        
        // Insert image at cursor position
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.insertNode(img);
        
        updateContent();
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle link insertion
  const insertLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      applyFormat('createLink', url);
    }
  };

  // Render toolbar buttons
  const ToolbarButton = ({ icon: Icon, onClick, title, active }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        p-2 
        rounded 
        hover:bg-gray-200 
        transition-colors 
        ${active ? 'bg-gray-200' : ''}
      `}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
        {/* Text Formatting */}
        <ToolbarButton 
          icon={Bold} 
          onClick={() => applyFormat('bold')} 
          title="Bold"
        />
        <ToolbarButton 
          icon={Italic} 
          onClick={() => applyFormat('italic')} 
          title="Italic"
        />
        <ToolbarButton 
          icon={Underline} 
          onClick={() => applyFormat('underline')} 
          title="Underline"
        />

        {/* Lists */}
        <ToolbarButton 
          icon={List} 
          onClick={() => applyFormat('insertUnorderedList')} 
          title="Unordered List"
        />
        <ToolbarButton 
          icon={ListOrdered} 
          onClick={() => applyFormat('insertOrderedList')} 
          title="Ordered List"
        />

        {/* Alignment */}
        <ToolbarButton 
          icon={AlignLeft} 
          onClick={() => applyFormat('justifyLeft')} 
          title="Align Left"
        />
        <ToolbarButton 
          icon={AlignCenter} 
          onClick={() => applyFormat('justifyCenter')} 
          title="Align Center"
        />
        <ToolbarButton 
          icon={AlignRight} 
          onClick={() => applyFormat('justifyRight')} 
          title="Align Right"
        />

        {/* Headers */}
        <ToolbarButton 
          icon={Heading1} 
          onClick={() => applyFormat('formatBlock', 'h1')} 
          title="Heading 1"
        />
        <ToolbarButton 
          icon={Heading2} 
          onClick={() => applyFormat('formatBlock', 'h2')} 
          title="Heading 2"
        />

        {/* Link and Image */}
        <ToolbarButton 
          icon={Link} 
          onClick={insertLink} 
          title="Insert Link"
        />
        <ToolbarButton 
          icon={Image} 
          onClick={() => fileInputRef.current.click()} 
          title="Upload Image"
        />
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload}
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {/* Content Editor */}
      <div 
        ref={editorRef}
        contentEditable={true}
        className="p-4 min-h-[300px] outline-none"
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={updateContent}
        placeholder="Start composing your email..."
      />

      {/* Save Button */}
      {onSave && (
        <div className="p-2 border-t bg-gray-50 flex justify-end">
          <button
            onClick={() => onSave(content)}
            className="
              bg-blue-500 
              text-white 
              px-4 
              py-2 
              rounded 
              hover:bg-blue-600 
              transition-colors
            "
          >
            Save Template
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailEditor;